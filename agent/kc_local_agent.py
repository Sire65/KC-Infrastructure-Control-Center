from __future__ import annotations

import json
import math
import os
import platform
import re
import socket
import ssl
import statistics
import subprocess
import threading
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HOST = os.environ.get('KICC_AGENT_HOST', '127.0.0.1')
PORT = int(os.environ.get('KICC_AGENT_PORT', '8765'))
FRITZ_HOST = os.environ.get('KICC_FRITZ_HOST', 'fritz.box')
FRITZ_USER = os.environ.get('KICC_FRITZ_USER', '')
FRITZ_PASSWORD = os.environ.get('KICC_FRITZ_PASSWORD', '')
BRIDGE_HEALTH_URL = os.environ.get('KICC_BRIDGE_HEALTH_URL', '')
PROBE_TARGETS = [('Cloudflare', '1.1.1.1'), ('Google', '8.8.8.8'), ('Quad9', '9.9.9.9')]

_lock = threading.Lock()
_snapshot = {}
_speed = {'status': 'IDLE'}
_bufferbloat = {'status': 'IDLE'}
_history = []


def utcnow():
    return datetime.now(timezone.utc).isoformat()


def _status(ok, degraded=False):
    if ok is None:
        return 'UNKNOWN'
    if not ok:
        return 'FAILED'
    return 'DEGRADED' if degraded else 'OK'


def _run_ping(host, count=4, timeout_ms=1200, ipv6=False):
    system = platform.system().lower()
    if system == 'windows':
        cmd = ['ping', '-n', str(count), '-w', str(timeout_ms)] + (['-6'] if ipv6 else []) + [host]
    else:
        cmd = ['ping'] + (['-6'] if ipv6 else []) + ['-c', str(count), '-W', str(max(1, math.ceil(timeout_ms / 1000))), host]
    try:
        cp = subprocess.run(cmd, capture_output=True, text=True, timeout=max(5, count * 2 + 2), errors='replace')
        out = (cp.stdout or '') + '\n' + (cp.stderr or '')
    except Exception as exc:
        return {'host': host, 'ok': False, 'latencyMs': None, 'jitterMs': None, 'packetLossPct': 100.0, 'samplesMs': [], 'error': str(exc)}
    vals = []
    for match in re.finditer(r'(?:time|Zeit)[=<]\s*(\d+(?:[.,]\d+)?)\s*ms', out, re.I):
        try:
            vals.append(float(match.group(1).replace(',', '.')))
        except Exception:
            pass
    loss = max(0, min(100, (count - len(vals)) * 100 / max(1, count)))
    return {
        'host': host,
        'ok': bool(vals),
        'latencyMs': round(statistics.median(vals), 2) if vals else None,
        'jitterMs': round(statistics.pstdev(vals), 2) if len(vals) > 1 else (0.0 if vals else None),
        'packetLossPct': round(loss, 2),
        'samplesMs': vals,
        'evidence': 'icmp'
    }


def _percentile(values, p):
    vals = sorted(float(x) for x in values if isinstance(x, (int, float)))
    if not vals:
        return None
    k = (len(vals) - 1) * p
    f, c = math.floor(k), math.ceil(k)
    return vals[f] if f == c else vals[f] * (c - k) + vals[c] * (k - f)


def _dns_probe():
    started = time.perf_counter()
    try:
        socket.getaddrinfo('example.com', 443, type=socket.SOCK_STREAM)
        return {'ok': True, 'latencyMs': round((time.perf_counter() - started) * 1000, 2), 'evidence': 'socket.getaddrinfo'}
    except Exception as exc:
        return {'ok': False, 'latencyMs': None, 'error': str(exc), 'evidence': 'socket.getaddrinfo'}


def _https_probe():
    host = 'www.cloudflare.com'
    started = time.perf_counter()
    try:
        raw = socket.create_connection((host, 443), timeout=3)
        tcp_ms = (time.perf_counter() - started) * 1000
        ctx = ssl.create_default_context()
        tls_started = time.perf_counter()
        with ctx.wrap_socket(raw, server_hostname=host) as conn:
            tls_ms = (time.perf_counter() - tls_started) * 1000
            conn.sendall(b'HEAD / HTTP/1.1\r\nHost: www.cloudflare.com\r\nConnection: close\r\n\r\n')
            conn.settimeout(3)
            data = conn.recv(256)
        return {'ok': bool(data), 'tcpMs': round(tcp_ms, 2), 'tlsMs': round(tls_ms, 2), 'latencyMs': round((time.perf_counter() - started) * 1000, 2), 'evidence': 'tcp+tls+http'}
    except Exception as exc:
        return {'ok': False, 'tcpMs': None, 'tlsMs': None, 'latencyMs': None, 'error': str(exc), 'evidence': 'tcp+tls+http'}


def _route_probe():
    cmd = ['tracert', '-d', '-h', '12', '-w', '700', '1.1.1.1'] if platform.system().lower() == 'windows' else ['traceroute', '-n', '-m', '12', '-w', '1', '1.1.1.1']
    try:
        cp = subprocess.run(cmd, capture_output=True, text=True, timeout=18, errors='replace')
        hops = []
        for line in (cp.stdout or '').splitlines():
            ips = re.findall(r'(?<!\d)(?:\d{1,3}\.){3}\d{1,3}(?!\d)', line)
            if ips and ips[-1] not in hops:
                hops.append(ips[-1])
        return {'status': 'OK' if hops else 'UNKNOWN', 'hopCount': len(hops), 'hops': hops, 'signature': '>'.join(hops), 'evidence': 'traceroute'}
    except Exception as exc:
        return {'status': 'UNKNOWN', 'hopCount': None, 'hops': [], 'error': str(exc), 'evidence': 'traceroute'}


def _digest_opener():
    if not FRITZ_USER and not FRITZ_PASSWORD:
        return urllib.request.build_opener()
    mgr = urllib.request.HTTPPasswordMgrWithDefaultRealm()
    mgr.add_password(None, f'http://{FRITZ_HOST}:49000/', FRITZ_USER, FRITZ_PASSWORD)
    return urllib.request.build_opener(urllib.request.HTTPDigestAuthHandler(mgr))


def _soap(service, control, action):
    url = f'http://{FRITZ_HOST}:49000{control}'
    body = f'''<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><u:{action} xmlns:u="{service}"></u:{action}></s:Body></s:Envelope>'''.encode()
    req = urllib.request.Request(url, data=body, method='POST', headers={'Content-Type': 'text/xml; charset="utf-8"', 'SOAPACTION': f'"{service}#{action}"'})
    try:
        with _digest_opener().open(req, timeout=3) as response:
            root = ET.fromstring(response.read())
        return {e.tag.split('}')[-1][3:]: e.text.strip() for e in root.iter() if e.tag.split('}')[-1].startswith('New') and e.text}
    except Exception:
        return {}


def _truth(v):
    if v is None:
        return None
    return str(v).strip().lower() in ('1', 'true', 'yes', 'on', 'enabled')


def _wlan_probe():
    radios = []
    for idx in (1, 2, 3):
        service = f'urn:dslforum-org:service:WLANConfiguration:{idx}'
        control = f'/upnp/control/wlanconfig{idx}'
        info = _soap(service, control, 'GetInfo')
        if not info:
            continue
        enabled = _truth(info.get('Enable'))
        radios.append({
            'index': idx,
            'status': _status(enabled),
            'enabled': enabled,
            'ssid': info.get('SSID'),
            'channel': int(info['Channel']) if str(info.get('Channel', '')).isdigit() else None,
            'standard': info.get('Standard'),
            'bssid': info.get('BSSID'),
            'evidence': f'tr064:WLANConfiguration:{idx}/GetInfo'
        })
    if not radios:
        return {'status': 'UNKNOWN', 'radios': [], 'evidence': None}
    enabled = [x for x in radios if x.get('enabled') is True]
    return {
        'status': 'OK' if enabled else 'FAILED',
        'radios': radios,
        'activeRadios': len(enabled),
        'knownRadios': len(radios),
        'evidence': 'tr064:wlan'
    }


def _bridge_probe():
    if not BRIDGE_HEALTH_URL:
        return {'status': 'UNKNOWN', 'reachable': None, 'evidence': None, 'note': 'KICC_BRIDGE_HEALTH_URL nicht konfiguriert'}
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(BRIDGE_HEALTH_URL, timeout=3) as response:
            ok = 200 <= response.status < 400
        return {'status': _status(ok), 'reachable': ok, 'latencyMs': round((time.perf_counter() - started) * 1000, 2), 'evidence': 'http-health-endpoint', 'endpoint': BRIDGE_HEALTH_URL}
    except Exception as exc:
        return {'status': 'FAILED', 'reachable': False, 'latencyMs': None, 'error': str(exc), 'evidence': 'http-health-endpoint', 'endpoint': BRIDGE_HEALTH_URL}


def _fritz_probe():
    ping = _run_ping(FRITZ_HOST, 2, 800)
    router = {
        'name': 'FRITZ!Box',
        'status': _status(ping.get('ok')),
        'reachable': bool(ping.get('ok')),
        'latencyMs': ping.get('latencyMs'),
        'lanIp': None,
        'model': None,
        'firmware': None,
        'tr064': False,
        'evidence': 'icmp:fritz.box'
    }
    try:
        router['lanIp'] = socket.gethostbyname(FRITZ_HOST)
    except Exception:
        pass
    if router['reachable']:
        try:
            with urllib.request.urlopen(f'http://{FRITZ_HOST}:49000/tr64desc.xml', timeout=3) as response:
                root = ET.fromstring(response.read())
            router['tr064'] = True
            router['model'] = next((e.text for e in root.iter() if e.tag.endswith('modelName') and e.text), None)
        except Exception:
            pass

    dev = _soap('urn:dslforum-org:service:DeviceInfo:1', '/upnp/control/deviceinfo', 'GetInfo')
    wi = _soap('urn:dslforum-org:service:WANIPConnection:1', '/upnp/control/wanipconnection1', 'GetStatusInfo')
    ext = _soap('urn:dslforum-org:service:WANIPConnection:1', '/upnp/control/wanipconnection1', 'GetExternalIPAddress')
    common = _soap('urn:dslforum-org:service:WANCommonInterfaceConfig:1', '/upnp/control/wancommonifconfig1', 'GetCommonLinkProperties')
    addon = _soap('urn:dslforum-org:service:WANCommonInterfaceConfig:1', '/upnp/control/wancommonifconfig1', 'GetAddonInfos')
    if dev:
        router.update(model=dev.get('ModelName') or router['model'], firmware=dev.get('SoftwareVersion'))
        router['evidence'] = 'icmp+tr064:DeviceInfo/GetInfo'

    connected = str(wi.get('ConnectionStatus', '')).lower() == 'connected' if wi else None

    def rate(data, key, div):
        value = str(data.get(key, '') if data else '')
        return round(int(value) / div, 3) if value.isdigit() else None

    wan = {
        'status': _status(connected),
        'publicIp': ext.get('ExternalIPAddress') if ext else None,
        'uptimeSeconds': int(wi.get('Uptime')) if wi and str(wi.get('Uptime', '')).isdigit() else None,
        'maxDownMbps': rate(common, 'Layer1DownstreamMaxBitRate', 1e6),
        'maxUpMbps': rate(common, 'Layer1UpstreamMaxBitRate', 1e6),
        'currentDownMbps': rate(addon, 'ByteReceiveRate', 125000),
        'currentUpMbps': rate(addon, 'ByteSendRate', 125000),
        'evidence': 'tr064:WANIPConnection' if wi else None
    }
    lan = {
        'status': router['status'],
        'reachable': router['reachable'],
        'latencyMs': router['latencyMs'],
        'evidence': 'icmp:fritz.box',
        'note': 'Status beschreibt nur den gemessenen Pfad PC → FRITZ!Box, nicht das gesamte LAN.'
    }
    wifi = _wlan_probe()
    bridge = _bridge_probe()
    return router, wan, lan, wifi, bridge


def collect_snapshot():
    router, wan, lan, wifi, bridge = _fritz_probe()
    probes, samples, losses = [], [], []
    for name, host in PROBE_TARGETS:
        probe = _run_ping(host)
        probe['name'] = name
        probes.append(probe)
        samples += probe.get('samplesMs') or []
        losses.append(float(probe.get('packetLossPct') or 0))
    ipv4 = any(p.get('ok') for p in probes)
    ipv6 = _run_ping('2606:4700:4700::1111', 2, 1500, True)
    dns = _dns_probe()
    https = _https_probe()
    median = statistics.median(samples) if samples else None
    jitter = statistics.pstdev(samples) if len(samples) > 1 else (0 if samples else None)
    loss = statistics.mean(losses) if losses else None
    p95 = _percentile(samples, .95)
    p99 = _percentile(samples, .99)
    ok = ipv4 and dns.get('ok') and https.get('ok')
    degraded = bool((loss or 0) >= 2 or (p95 or 0) >= 100 or (jitter or 0) >= 30)
    with _lock:
        speed = dict(_speed)
        bb = dict(_bufferbloat)
    return {
        'schema': 'kicc.local-network.v4',
        'agent': {'name': 'KC Local Agent', 'version': '0.4.0', 'host': socket.gethostname(), 'platform': platform.platform()},
        'status': _status(ok, degraded),
        'measuredAt': utcnow(),
        'router': router,
        'wan': wan,
        'lan': lan,
        'wifi': wifi,
        'bridge': bridge,
        'internet': {
            'status': _status(ok, degraded),
            'latencyMs': round(median, 2) if median is not None else None,
            'jitterMs': round(jitter, 2) if jitter is not None else None,
            'packetLossPct': round(loss, 2) if loss is not None else None,
            'p95Ms': round(p95, 2) if p95 is not None else None,
            'p99Ms': round(p99, 2) if p99 is not None else None,
            'dnsMs': dns.get('latencyMs'),
            'httpMs': https.get('latencyMs'),
            'tcpMs': https.get('tcpMs'),
            'tlsMs': https.get('tlsMs'),
            'ipv4': {'status': _status(ipv4), 'evidence': 'icmp:multi-target'},
            'ipv6': {'status': _status(bool(ipv6.get('ok'))), 'latencyMs': ipv6.get('latencyMs'), 'packetLossPct': ipv6.get('packetLossPct'), 'evidence': 'icmp6:cloudflare'},
            'targets': probes,
            'evidence': {'dns': dns.get('evidence'), 'https': https.get('evidence')}
        },
        'route': _route_probe(),
        'speedtest': speed,
        'bufferbloat': bb
    }


def _speed_worker(profile):
    global _speed
    sizes = {'small': 3_000_000, 'medium': 15_000_000, 'large': 35_000_000}
    size = sizes.get(profile, 3_000_000)
    url = f'https://speed.cloudflare.com/__down?bytes={size}'
    with _lock:
        _speed = {'status': 'RUNNING', 'profile': profile, 'startedAt': utcnow(), 'bytes': size}
    try:
        started = time.perf_counter()
        received = 0
        with urllib.request.urlopen(url, timeout=30) as response:
            while True:
                chunk = response.read(65536)
                if not chunk:
                    break
                received += len(chunk)
        seconds = time.perf_counter() - started
        with _lock:
            _speed = {'status': 'DONE', 'profile': profile, 'measuredAt': utcnow(), 'bytes': received, 'seconds': round(seconds, 2), 'downloadMbps': round(received * 8 / seconds / 1e6, 2), 'evidence': 'cloudflare-download'}
    except Exception as exc:
        with _lock:
            _speed = {'status': 'FAILED', 'profile': profile, 'measuredAt': utcnow(), 'error': str(exc), 'evidence': 'cloudflare-download'}


def _bufferbloat_worker():
    global _bufferbloat
    with _lock:
        _bufferbloat = {'status': 'RUNNING', 'startedAt': utcnow()}
    try:
        idle = _run_ping('1.1.1.1', 6, 1200)
        load_done = threading.Event()

        def load():
            try:
                with urllib.request.urlopen('https://speed.cloudflare.com/__down?bytes=5000000', timeout=20) as response:
                    while response.read(65536):
                        pass
            finally:
                load_done.set()

        threading.Thread(target=load, daemon=True).start()
        samples = []
        while not load_done.is_set():
            probe = _run_ping('1.1.1.1', 1, 1200)
            samples += probe.get('samplesMs') or []
            if len(samples) >= 12:
                break
        loaded = statistics.median(samples) if samples else None
        base = idle.get('latencyMs')
        delta = (loaded - base) if loaded is not None and base is not None else None
        grade = 'A' if delta is not None and delta < 15 else 'B' if delta is not None and delta < 30 else 'C' if delta is not None and delta < 60 else 'D' if delta is not None else 'UNKNOWN'
        with _lock:
            _bufferbloat = {'status': 'DONE', 'measuredAt': utcnow(), 'idleLatencyMs': base, 'loadedLatencyMs': round(loaded, 2) if loaded is not None else None, 'increaseMs': round(delta, 2) if delta is not None else None, 'grade': grade, 'samples': len(samples), 'evidence': 'icmp-under-controlled-download'}
    except Exception as exc:
        with _lock:
            _bufferbloat = {'status': 'FAILED', 'measuredAt': utcnow(), 'error': str(exc), 'evidence': 'icmp-under-controlled-download'}


def worker():
    global _snapshot
    while True:
        try:
            snap = collect_snapshot()
        except Exception as exc:
            snap = {'schema': 'kicc.local-network.v4', 'status': 'FAILED', 'measuredAt': utcnow(), 'error': str(exc)}
        with _lock:
            _snapshot = snap
            _history.append({'measuredAt': snap.get('measuredAt'), 'status': snap.get('status'), 'latencyMs': snap.get('internet', {}).get('latencyMs'), 'jitterMs': snap.get('internet', {}).get('jitterMs'), 'packetLossPct': snap.get('internet', {}).get('packetLossPct')})
            cutoff = time.time() - 86400
            _history[:] = [x for x in _history if datetime.fromisoformat(x['measuredAt']).timestamp() >= cutoff]
        time.sleep(10)


class Handler(BaseHTTPRequestHandler):
    def _headers(self, code=200):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._headers(204)

    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        if url.path == '/health':
            with _lock:
                data = {'ok': True, 'service': 'kc-local-agent', 'version': '0.4.0', 'measuredAt': _snapshot.get('measuredAt')}
        elif url.path == '/v1/network':
            with _lock:
                data = dict(_snapshot)
        elif url.path == '/v1/history':
            query = urllib.parse.parse_qs(url.query)
            minutes = max(1, min(1440, int(query.get('minutes', ['60'])[0])))
            cutoff = time.time() - minutes * 60
            with _lock:
                data = {'minutes': minutes, 'items': [x for x in _history if datetime.fromisoformat(x['measuredAt']).timestamp() >= cutoff]}
        else:
            self._headers(404)
            self.wfile.write(b'{"error":"not found"}')
            return
        self._headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())

    def do_POST(self):
        url = urllib.parse.urlparse(self.path)
        if url.path not in ('/v1/speedtest', '/v1/bufferbloat'):
            self._headers(404)
            self.wfile.write(b'{"error":"not found"}')
            return
        if url.path == '/v1/speedtest':
            try:
                length = int(self.headers.get('Content-Length', '0'))
                body = json.loads(self.rfile.read(length) or b'{}')
                profile = body.get('profile', 'small')
            except Exception:
                profile = 'small'
            with _lock:
                busy = _speed.get('status') == 'RUNNING'
            if busy:
                self._headers(409)
                self.wfile.write(b'{"error":"speedtest already running"}')
                return
            threading.Thread(target=_speed_worker, args=(profile,), daemon=True).start()
            response = {'accepted': True, 'profile': profile}
        else:
            with _lock:
                busy = _bufferbloat.get('status') == 'RUNNING'
            if busy:
                self._headers(409)
                self.wfile.write(b'{"error":"bufferbloat already running"}')
                return
            threading.Thread(target=_bufferbloat_worker, daemon=True).start()
            response = {'accepted': True}
        self._headers(202)
        self.wfile.write(json.dumps(response).encode())

    def log_message(self, *args):
        return


def main():
    threading.Thread(target=worker, daemon=True).start()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f'KC Local Agent 0.4.0 auf http://{HOST}:{PORT}')
    server.serve_forever()


if __name__ == '__main__':
    main()
