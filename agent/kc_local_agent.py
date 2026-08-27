from __future__ import annotations
import json,math,os,platform,re,socket,ssl,statistics,subprocess,threading,time,urllib.request,xml.etree.ElementTree as ET
from datetime import datetime,timezone
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
HOST=os.environ.get('KICC_AGENT_HOST','127.0.0.1');PORT=int(os.environ.get('KICC_AGENT_PORT','8765'));FRITZ_HOST=os.environ.get('KICC_FRITZ_HOST','fritz.box');FRITZ_USER=os.environ.get('KICC_FRITZ_USER','');FRITZ_PASSWORD=os.environ.get('KICC_FRITZ_PASSWORD','')
PROBE_TARGETS=[('Cloudflare','1.1.1.1'),('Google','8.8.8.8'),('Quad9','9.9.9.9')];_lock=threading.Lock();_snapshot={};_speed={'status':'IDLE'}
def utcnow():return datetime.now(timezone.utc).isoformat()
def _status(ok,degraded=False):return 'UNKNOWN' if ok is None else ('FAILED' if not ok else ('DEGRADED' if degraded else 'OK'))
def _run_ping(host,count=4,timeout_ms=1200,ipv6=False):
 system=platform.system().lower();cmd=['ping','-n',str(count),'-w',str(timeout_ms)]+(['-6'] if ipv6 else [])+[host] if system=='windows' else ['ping']+(['-6'] if ipv6 else [])+['-c',str(count),'-W',str(max(1,math.ceil(timeout_ms/1000))),host];started=time.perf_counter()
 try:cp=subprocess.run(cmd,capture_output=True,text=True,timeout=max(5,count*2+2),errors='replace');out=(cp.stdout or '')+'\n'+(cp.stderr or '')
 except Exception as e:return {'host':host,'ok':False,'latencyMs':None,'jitterMs':None,'packetLossPct':100.0,'samplesMs':[],'error':str(e)}
 vals=[]
 for m in re.finditer(r'(?:time|Zeit)[=<]\s*(\d+(?:[.,]\d+)?)\s*ms',out,re.I):
  try:vals.append(float(m.group(1).replace(',','.')))
  except:pass
 loss=max(0,min(100,(count-len(vals))*100/max(1,count)));return {'host':host,'ok':bool(vals),'latencyMs':round(statistics.median(vals),2) if vals else None,'jitterMs':round(statistics.pstdev(vals),2) if len(vals)>1 else (0.0 if vals else None),'packetLossPct':round(loss,2),'samplesMs':vals,'durationMs':round((time.perf_counter()-started)*1000,1)}
def _percentile(values,p):
 v=sorted(float(x) for x in values if isinstance(x,(int,float)))
 if not v:return None
 k=(len(v)-1)*p;f=math.floor(k);c=math.ceil(k);return v[f] if f==c else v[f]*(c-k)+v[c]*(k-f)
def _dns_probe():
 t=time.perf_counter()
 try:infos=socket.getaddrinfo('example.com',443,type=socket.SOCK_STREAM);return {'ok':True,'latencyMs':round((time.perf_counter()-t)*1000,2),'families':sorted({'IPv6' if x[0]==socket.AF_INET6 else 'IPv4' for x in infos})}
 except Exception as e:return {'ok':False,'latencyMs':None,'error':str(e)}
def _https_probe():
 host='www.cloudflare.com';t=time.perf_counter()
 try:
  raw=socket.create_connection((host,443),timeout=3);tcp=(time.perf_counter()-t)*1000;ctx=ssl.create_default_context();tt=time.perf_counter()
  with ctx.wrap_socket(raw,server_hostname=host) as s:tls=(time.perf_counter()-tt)*1000;s.sendall(b'HEAD / HTTP/1.1\r\nHost: www.cloudflare.com\r\nConnection: close\r\n\r\n');s.settimeout(3);ft=time.perf_counter();data=s.recv(256);first=(time.perf_counter()-ft)*1000
  return {'ok':bool(data),'tcpMs':round(tcp,2),'tlsMs':round(tls,2),'firstByteMs':round(first,2),'latencyMs':round((time.perf_counter()-t)*1000,2)}
 except Exception as e:return {'ok':False,'tcpMs':None,'tlsMs':None,'latencyMs':None,'error':str(e)}
def _route_probe():
 cmd=['tracert','-d','-h','12','-w','700','1.1.1.1'] if platform.system().lower()=='windows' else ['traceroute','-n','-m','12','-w','1','1.1.1.1']
 try:
  cp=subprocess.run(cmd,capture_output=True,text=True,timeout=18,errors='replace');hops=[]
  for line in (cp.stdout or '').splitlines():
   ips=re.findall(r'(?<!\d)(?:\d{1,3}\.){3}\d{1,3}(?!\d)',line)
   if ips and ips[-1] not in hops:hops.append(ips[-1])
  return {'status':'OK' if hops else 'UNKNOWN','hopCount':len(hops),'hops':hops,'signature':'>'.join(hops)}
 except Exception as e:return {'status':'UNKNOWN','hopCount':None,'hops':[],'error':str(e)}
def _digest_opener():
 if not FRITZ_USER and not FRITZ_PASSWORD:return urllib.request.build_opener()
 mgr=urllib.request.HTTPPasswordMgrWithDefaultRealm();mgr.add_password(None,f'http://{FRITZ_HOST}:49000/',FRITZ_USER,FRITZ_PASSWORD);return urllib.request.build_opener(urllib.request.HTTPDigestAuthHandler(mgr))
def _soap(service,control,action):
 url=f'http://{FRITZ_HOST}:49000{control}';body=f'''<?xml version="1.0" encoding="utf-8"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><u:{action} xmlns:u="{service}"></u:{action}></s:Body></s:Envelope>'''.encode();req=urllib.request.Request(url,data=body,method='POST',headers={'Content-Type':'text/xml; charset="utf-8"','SOAPACTION':f'"{service}#{action}"'})
 try:
  with _digest_opener().open(req,timeout=3) as r:root=ET.fromstring(r.read())
  return {e.tag.split('}')[-1][3:]:e.text.strip() for e in root.iter() if e.tag.split('}')[-1].startswith('New') and e.text}
 except:return {}
def _fritz_probe():
 p=_run_ping(FRITZ_HOST,2,800);r={'name':'FRITZ!Box','status':_status(p.get('ok')),'reachable':bool(p.get('ok')),'latencyMs':p.get('latencyMs'),'lanIp':None,'model':None,'firmware':None,'tr064':False}
 try:r['lanIp']=socket.gethostbyname(FRITZ_HOST)
 except:pass
 if r['reachable']:
  try:
   with urllib.request.urlopen(f'http://{FRITZ_HOST}:49000/tr64desc.xml',timeout=3) as x:root=ET.fromstring(x.read());r['tr064']=True;r['model']=next((e.text for e in root.iter() if e.tag.endswith('modelName') and e.text),None)
  except:pass
 dev=_soap('urn:dslforum-org:service:DeviceInfo:1','/upnp/control/deviceinfo','GetInfo');wi=_soap('urn:dslforum-org:service:WANIPConnection:1','/upnp/control/wanipconnection1','GetStatusInfo');ext=_soap('urn:dslforum-org:service:WANIPConnection:1','/upnp/control/wanipconnection1','GetExternalIPAddress');common=_soap('urn:dslforum-org:service:WANCommonInterfaceConfig:1','/upnp/control/wancommonifconfig1','GetCommonLinkProperties');addon=_soap('urn:dslforum-org:service:WANCommonInterfaceConfig:1','/upnp/control/wancommonifconfig1','GetAddonInfos')
 if dev:r.update(model=dev.get('ModelName') or r['model'],firmware=dev.get('SoftwareVersion'),serial=dev.get('SerialNumber'))
 connected=str(wi.get('ConnectionStatus','')).lower()=='connected' if wi else None
 def rate(d,k,div):
  v=str(d.get(k,'') if d else '');return round(int(v)/div,3) if v.isdigit() else None
 w={'status':_status(connected),'publicIp':ext.get('ExternalIPAddress') if ext else None,'uptimeSeconds':int(wi.get('Uptime')) if wi and str(wi.get('Uptime','')).isdigit() else None,'maxDownMbps':rate(common,'Layer1DownstreamMaxBitRate',1e6),'maxUpMbps':rate(common,'Layer1UpstreamMaxBitRate',1e6),'currentDownMbps':rate(addon,'ByteReceiveRate',125000),'currentUpMbps':rate(addon,'ByteSendRate',125000)}
 return r,w,{'status':r['status']},{'status':'UNKNOWN'},{'status':'OK'}
def collect_snapshot():
 r,w,lan,wifi,bridge=_fritz_probe();probes=[];samples=[];losses=[]
 for name,host in PROBE_TARGETS:p=_run_ping(host);p['name']=name;probes.append(p);samples+=p.get('samplesMs') or [];losses.append(float(p.get('packetLossPct') or 0))
 ipv4=any(p.get('ok') for p in probes);ipv6=_run_ping('2606:4700:4700::1111',2,1500,True);dns=_dns_probe();https=_https_probe();med=statistics.median(samples) if samples else None;jit=statistics.pstdev(samples) if len(samples)>1 else (0 if samples else None);loss=statistics.mean(losses) if losses else None;p95=_percentile(samples,.95);p99=_percentile(samples,.99);ok=ipv4 and dns.get('ok') and https.get('ok');deg=bool((loss or 0)>=2 or (p95 or 0)>=100 or (jit or 0)>=30)
 with _lock:speed=dict(_speed)
 return {'schema':'kicc.local-network.v2','agent':{'name':'KC Local Agent','version':'0.2.0','host':socket.gethostname(),'platform':platform.platform()},'status':_status(ok,deg),'measuredAt':utcnow(),'router':r,'wan':w,'lan':lan,'wifi':wifi,'bridge':bridge,'internet':{'status':_status(ok,deg),'latencyMs':round(med,2) if med is not None else None,'jitterMs':round(jit,2) if jit is not None else None,'packetLossPct':round(loss,2) if loss is not None else None,'p95Ms':round(p95,2) if p95 is not None else None,'p99Ms':round(p99,2) if p99 is not None else None,'dnsMs':dns.get('latencyMs'),'httpMs':https.get('latencyMs'),'tcpMs':https.get('tcpMs'),'tlsMs':https.get('tlsMs'),'ipv4':{'status':_status(ipv4)},'ipv6':{'status':_status(bool(ipv6.get('ok'))),'latencyMs':ipv6.get('latencyMs'),'packetLossPct':ipv6.get('packetLossPct')},'targets':probes},'route':_route_probe(),'speedtest':speed}
def _speed_worker(profile):
 global _speed
 sizes={'small':3_000_000,'medium':15_000_000,'large':35_000_000};size=sizes.get(profile,3_000_000);url=f'https://speed.cloudflare.com/__down?bytes={size}'
 with _lock:_speed={'status':'RUNNING','profile':profile,'startedAt':utcnow(),'bytes':size}
 try:
  t=time.perf_counter();received=0
  with urllib.request.urlopen(url,timeout=30) as x:
   while True:
    b=x.read(65536)
    if not b:break
    received+=len(b)
  sec=time.perf_counter()-t;mbps=received*8/sec/1e6
  with _lock:_speed={'status':'DONE','profile':profile,'measuredAt':utcnow(),'bytes':received,'seconds':round(sec,2),'downloadMbps':round(mbps,2)}
 except Exception as e:
  with _lock:_speed={'status':'FAILED','profile':profile,'measuredAt':utcnow(),'error':str(e)}
def worker():
 global _snapshot
 while True:
  try:s=collect_snapshot()
  except Exception as e:s={'schema':'kicc.local-network.v2','status':'FAILED','measuredAt':utcnow(),'error':str(e)}
  with _lock:_snapshot=s
  time.sleep(10)
class Handler(BaseHTTPRequestHandler):
 def _headers(self,code=200):self.send_response(code);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Cache-Control','no-store');self.send_header('Access-Control-Allow-Origin','*');self.send_header('Access-Control-Allow-Methods','GET,POST,OPTIONS');self.send_header('Access-Control-Allow-Headers','Content-Type');self.end_headers()
 def do_OPTIONS(self):self._headers(204)
 def do_GET(self):
  if self.path not in ('/v1/network','/health'):self._headers(404);self.wfile.write(b'{"error":"not found"}');return
  with _lock:d=dict(_snapshot)
  if self.path=='/health':d={'ok':True,'service':'kc-local-agent','measuredAt':d.get('measuredAt')}
  self._headers();self.wfile.write(json.dumps(d,ensure_ascii=False).encode())
 def do_POST(self):
  if self.path!='/v1/speedtest':self._headers(404);self.wfile.write(b'{"error":"not found"}');return
  try:n=int(self.headers.get('Content-Length','0'));body=json.loads(self.rfile.read(n) or b'{}');profile=body.get('profile','small')
  except:profile='small'
  with _lock:busy=_speed.get('status')=='RUNNING'
  if busy:self._headers(409);self.wfile.write(b'{"error":"speedtest already running"}');return
  threading.Thread(target=_speed_worker,args=(profile,),daemon=True).start();self._headers(202);self.wfile.write(json.dumps({'accepted':True,'profile':profile}).encode())
 def log_message(self,*a):return
def main():
 threading.Thread(target=worker,daemon=True).start();server=ThreadingHTTPServer((HOST,PORT),Handler);print(f'KC Local Agent 0.2.0 auf http://{HOST}:{PORT}');server.serve_forever()
if __name__=='__main__':main()
