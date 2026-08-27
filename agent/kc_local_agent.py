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
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HOST = os.environ.get("KICC_AGENT_HOST", "127.0.0.1")
PORT = int(os.environ.get("KICC_AGENT_PORT", "8765"))
FRITZ_HOST = os.environ.get("KICC_FRITZ_HOST", "fritz.box")
FRITZ_USER = os.environ.get("KICC_FRITZ_USER", "")
FRITZ_PASSWORD = os.environ.get("KICC_FRITZ_PASSWORD", "")
PROBE_TARGETS = [
    ("Cloudflare", "1.1.1.1"),
    ("Google", "8.8.8.8"),
    ("Quad9", "9.9.9.9"),
]

_lock = threading.Lock()
_snapshot: dict = {}


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def _status(ok: bool | None, degraded: bool = False) -> str:
    if ok is None:
        return "UNKNOWN"
    if not ok:
        return "FAILED"
    return "DEGRADED" if degraded else "OK"


def _run_ping(host: str, count: int = 4, timeout_ms: int = 1200, ipv6: bool = False) -> dict:
    system = platform.system().lower()
    if system == "windows":
        cmd = ["ping", "-n", str(count), "-w", str(timeout_ms)]
        if ipv6:
            cmd += ["-6"]
        cmd += [host]
    else:
        cmd = ["ping", "-c", str(count), "-W", str(max(1, math.ceil(timeout_ms / 1000)))]
        if ipv6:
            cmd = ["ping", "-6", "-c", str(count), "-W", str(max(1, math.ceil(timeout_ms / 1000))), host]
        else:
            cmd += [host]
    started = time.perf_counter()
    try:
        cp = subprocess.run(cmd, capture_output=True, text=True, timeout=max(5, count * 2 + 2), errors="replace")
        out = (cp.stdout or "") + "\n" + (cp.stderr or "")
    except Exception as exc:
        return {"host": host, "ok": False, "latencyMs": None, "jitterMs": None, "packetLossPct": 100.0, "samplesMs": [], "error": str(exc)}

    values = []
    for m in re.finditer(r"(?:time|Zeit)[=<]\s*(\d+(?:[.,]\d+)?)\s*ms", out, flags=re.I):
        try:
            values.append(float(m.group(1).replace(",", ".")))
        except Exception:
            pass
    if not values:
        for m in re.finditer(r"time[=<]?\s*(\d+(?:\.\d+)?)\s*ms", out, flags=re.I):
            try:
                values.append(float(m.group(1)))
            except Exception:
                pass
    sent = count
    received = len(values)
    loss = max(0.0, min(100.0, (sent - received) * 100.0 / max(1, sent)))
    latency = statistics.median(values) if values else None
    jitter = statistics.pstdev(values) if len(values) > 1 else (0.0 if values else None)
    return {
        "host": host,
        "ok": received > 0,
        "latencyMs": round(latency, 2) if latency is not None else None,
        "jitterMs": round(jitter, 2) if jitter is not None else None,
        "packetLossPct": round(loss, 2),
        "samplesMs": values,
        "durationMs": round((time.perf_counter() - started) * 1000, 1),
    }


def _percentile(values: list[float], p: float) -> float | None:
    vals = sorted(float(v) for v in values if isinstance(v, (int, float)))
    if not vals:
        return None
    if len(vals) == 1:
        return vals[0]
    k = (len(vals) - 1) * p
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return vals[int(k)]
    return vals[f] * (c - k) + vals[c] * (k - f)


def _dns_probe() -> dict:
    started = time.perf_counter()
    try:
        infos = socket.getaddrinfo("example.com", 443, type=socket.SOCK_STREAM)
        elapsed = (time.perf_counter() - started) * 1000
        families = sorted({"IPv6" if x[0] == socket.AF_INET6 else "IPv4" for x in infos})
        return {"ok": True, "latencyMs": round(elapsed, 2), "families": families}
    except Exception as exc:
        return {"ok": False, "latencyMs": None, "error": str(exc)}


def _https_probe() -> dict:
    host = "www.cloudflare.com"
    started = time.perf_counter()
    try:
        raw = socket.create_connection((host, 443), timeout=3)
        tcp_ms = (time.perf_counter() - started) * 1000
        ctx = ssl.create_default_context()
        tls_started = time.perf_counter()
        with ctx.wrap_socket(raw, server_hostname=host) as s:
            tls_ms = (time.perf_counter() - tls_started) * 1000
            s.sendall(b"HEAD / HTTP/1.1\r\nHost: www.cloudflare.com\r\nConnection: close\r\n\r\n")
            s.settimeout(3)
            first_started = time.perf_counter()
            data = s.recv(256)
            first_ms = (time.perf_counter() - first_started) * 1000
        total = (time.perf_counter() - started) * 1000
        return {"ok": bool(data), "tcpMs": round(tcp_ms, 2), "tlsMs": round(tls_ms, 2), "firstByteMs": round(first_ms, 2), "latencyMs": round(total, 2)}
    except Exception as exc:
        return {"ok": False, "tcpMs": None, "tlsMs": None, "firstByteMs": None, "latencyMs": None, "error": str(exc)}


def _digest_opener():
    if not FRITZ_USER and not FRITZ_PASSWORD:
        return urllib.request.build_opener()
    mgr = urllib.request.HTTPPasswordMgrWithDefaultRealm()
    mgr.add_password(None, f"http://{FRITZ_HOST}:49000/", FRITZ_USER, FRITZ_PASSWORD)
    return urllib.request.build_opener(urllib.request.HTTPDigestAuthHandler(mgr))


def _xml_text(root, suffix: str):
    for el in root.iter():
        if el.tag.endswith(suffix) and el.text:
            return el.text.strip()
    return None


def _soap(service: str, control: str, action: str) -> dict:
    url = f"http://{FRITZ_HOST}:49000{control}"
    body = f'''<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
<s:Body><u:{action} xmlns:u="{service}"></u:{action}></s:Body></s:Envelope>'''.encode("utf-8")
    req = urllib.request.Request(url, data=body, method="POST", headers={
        "Content-Type": 'text/xml; charset="utf-8"',
        "SOAPACTION": f'"{service}#{action}"',
        "User-Agent": "KC-Local-Agent/0.1",
    })
    try:
        with _digest_opener().open(req, timeout=3) as r:
            root = ET.fromstring(r.read())
        result = {}
        for el in root.iter():
            name = el.tag.split("}")[-1]
            if name.startswith("New") and el.text is not None:
                result[name[3:]] = el.text.strip()
        return result
    except Exception:
        return {}


def _fritz_probe() -> tuple[dict, dict, dict, dict, dict]:
    router_ping = _run_ping(FRITZ_HOST, count=2, timeout_ms=800)
    router = {
        "name": "FRITZ!Box",
        "status": _status(router_ping.get("ok")),
        "reachable": bool(router_ping.get("ok")),
        "latencyMs": router_ping.get("latencyMs"),
        "lanIp": None,
        "model": None,
        "firmware": None,
        "tr064": False,
    }
    try:
        router["lanIp"] = socket.gethostbyname(FRITZ_HOST)
    except Exception:
        pass
    if router["reachable"]:
        try:
            with urllib.request.urlopen(f"http://{FRITZ_HOST}:49000/tr64desc.xml", timeout=3) as r:
                root = ET.fromstring(r.read())
            router["tr064"] = True
            router["model"] = _xml_text(root, "modelName") or _xml_text(root, "friendlyName")
        except Exception:
            pass

    dev = _soap("urn:dslforum-org:service:DeviceInfo:1", "/upnp/control/deviceinfo", "GetInfo")
    if dev:
        router["model"] = dev.get("ModelName") or router["model"]
        router["firmware"] = dev.get("SoftwareVersion")
        router["serial"] = dev.get("SerialNumber")
        router["uptimeSeconds"] = int(dev.get("UpTime") or 0) if str(dev.get("UpTime") or "").isdigit() else None

    wan_info = _soap("urn:dslforum-org:service:WANIPConnection:1", "/upnp/control/wanipconnection1", "GetStatusInfo")
    ext = _soap("urn:dslforum-org:service:WANIPConnection:1", "/upnp/control/wanipconnection1", "GetExternalIPAddress")
    common = _soap("urn:dslforum-org:service:WANCommonInterfaceConfig:1", "/upnp/control/wancommonifconfig1", "GetCommonLinkProperties")
    addon = _soap("urn:dslforum-org:service:WANCommonInterfaceConfig:1", "/upnp/control/wancommonifconfig1", "GetAddonInfos")
    wan_connected = str(wan_info.get("ConnectionStatus", "")).lower() == "connected" if wan_info else None
    wan = {
        "status": _status(wan_connected),
        "publicIp": ext.get("ExternalIPAddress") if ext else None,
        "uptimeSeconds": int(wan_info.get("Uptime") or 0) if str(wan_info.get("Uptime") or "").isdigit() else None,
        "maxDownMbps": round(int(common.get("Layer1DownstreamMaxBitRate") or 0) / 1_000_000, 2) if str(common.get("Layer1DownstreamMaxBitRate") or "").isdigit() else None,
        "maxUpMbps": round(int(common.get("Layer1UpstreamMaxBitRate") or 0) / 1_000_000, 2) if str(common.get("Layer1UpstreamMaxBitRate") or "").isdigit() else None,
        "currentDownMbps": round(int(addon.get("ByteReceiveRate") or 0) * 8 / 1_000_000, 3) if str(addon.get("ByteReceiveRate") or "").isdigit() else None,
        "currentUpMbps": round(int(addon.get("ByteSendRate") or 0) * 8 / 1_000_000, 3) if str(addon.get("ByteSendRate") or "").isdigit() else None,
    }
    lan = {"status": router["status"]}
    wifi = {"status": "UNKNOWN"}
    bridge = {"status": "OK"}
    return router, wan, lan, wifi, bridge


def collect_snapshot() -> dict:
    router, wan, lan, wifi, bridge = _fritz_probe()
    probes = []
    all_samples = []
    losses = []
    for name, host in PROBE_TARGETS:
        p = _run_ping(host, count=4, timeout_ms=1200)
        p["name"] = name
        probes.append(p)
        all_samples.extend(p.get("samplesMs") or [])
        losses.append(float(p.get("packetLossPct") or 0))
    ipv4_ok = any(p.get("ok") for p in probes)
    ipv6 = _run_ping("2606:4700:4700::1111", count=2, timeout_ms=1500, ipv6=True)
    dns = _dns_probe()
    https = _https_probe()
    median = statistics.median(all_samples) if all_samples else None
    jitter = statistics.pstdev(all_samples) if len(all_samples) > 1 else (0.0 if all_samples else None)
    loss = statistics.mean(losses) if losses else None
    p95 = _percentile(all_samples, 0.95)
    p99 = _percentile(all_samples, 0.99)
    internet_ok = ipv4_ok and bool(dns.get("ok")) and bool(https.get("ok"))
    degraded = bool((loss or 0) >= 2 or (p95 or 0) >= 100 or (jitter or 0) >= 30)
    return {
        "schema": "kicc.local-network.v1",
        "agent": {"name": "KC Local Agent", "version": "0.1.0", "host": socket.gethostname(), "platform": platform.platform()},
        "status": _status(internet_ok, degraded),
        "measuredAt": utcnow(),
        "router": router,
        "wan": wan,
        "lan": lan,
        "wifi": wifi,
        "bridge": bridge,
        "internet": {
            "status": _status(internet_ok, degraded),
            "latencyMs": round(median, 2) if median is not None else None,
            "jitterMs": round(jitter, 2) if jitter is not None else None,
            "packetLossPct": round(loss, 2) if loss is not None else None,
            "p95Ms": round(p95, 2) if p95 is not None else None,
            "p99Ms": round(p99, 2) if p99 is not None else None,
            "dnsMs": dns.get("latencyMs"),
            "httpMs": https.get("latencyMs"),
            "tcpMs": https.get("tcpMs"),
            "tlsMs": https.get("tlsMs"),
            "ipv4": {"status": _status(ipv4_ok)},
            "ipv6": {"status": _status(bool(ipv6.get("ok"))), "latencyMs": ipv6.get("latencyMs"), "packetLossPct": ipv6.get("packetLossPct")},
            "targets": probes,
        },
    }


def worker():
    global _snapshot
    while True:
        try:
            snap = collect_snapshot()
            with _lock:
                _snapshot = snap
        except Exception as exc:
            with _lock:
                _snapshot = {"schema": "kicc.local-network.v1", "status": "FAILED", "measuredAt": utcnow(), "error": str(exc)}
        time.sleep(5)


class Handler(BaseHTTPRequestHandler):
    def _headers(self, code=200):
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.end_headers()

    def do_OPTIONS(self):
        self._headers(204)

    def do_GET(self):
        if self.path not in ("/v1/network", "/health"):
            self._headers(404)
            self.wfile.write(b'{"error":"not found"}')
            return
        with _lock:
            data = dict(_snapshot)
        if self.path == "/health":
            data = {"ok": True, "service": "kc-local-agent", "measuredAt": data.get("measuredAt")}
        self._headers(200)
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def log_message(self, fmt, *args):
        return


def main():
    threading.Thread(target=worker, name="kc-network-probe", daemon=True).start()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"KC Local Agent 0.1.0 auf http://{HOST}:{PORT}")
    print(f"FRITZ!Box: {FRITZ_HOST} · TR-064-Zugangsdaten nur aus lokalen Umgebungsvariablen")
    server.serve_forever()


if __name__ == "__main__":
    main()
