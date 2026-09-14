# -*- coding: utf-8 -*-
"""file-relay 端到端测试: 文本 UTF-8 回环 + 12MB 双分片上传下载 sha256 校验"""
import hashlib, io, json, os, sys, urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8787"
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

def call(method, path, body=None, raw=None, headers=None):
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    h = {"User-Agent": "file-relay-e2e-test/1.0"}  # workers.dev 默认拦截 Python-urllib UA(error 1010)
    if body is not None and raw is None: h["Content-Type"] = "application/json"
    if headers: h.update(headers)
    req = urllib.request.Request(BASE + path, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            content = r.read()
            ct = r.headers.get("Content-Type", "")
            if "json" in ct:
                return r.status, json.loads(content)
            return r.status, content
    except urllib.error.HTTPError as e:
        content = e.read()
        try: return e.code, json.loads(content)
        except Exception: return e.code, content

ok = fail = 0
def check(name, cond, extra=""):
    global ok, fail
    if cond: ok += 1; print(f"  PASS {name}")
    else: fail += 1; print(f"  FAIL {name} {extra}")

print("== 1. 文本 UTF-8 回环 ==")
text = "你好世界 Hello 🎉 第二条文本"
st, r = call("POST", "/api/shares/text", {"text": text, "expiry": "7d", "maxPickups": None})
check("创建文本", st == 201 and len(r.get("code", "")) == 6, f"st={st} r={r}")
code1 = r["code"]
st, r = call("POST", "/api/pickup", {"code": code1})
check("取件返回原文", st == 200 and r.get("text") == text, f"st={st} got={r.get('text')!r}")

print("== 2. 12MB 双分片上传/下载 ==")
# 12MB: 10MB + 2MB,含随机不可压缩数据,中文文件名
payload = os.urandom(12 * 1024 * 1024)
fname = "测试 文件 (v1).bin"
st, r = call("POST", "/api/uploads/init", {"filename": fname, "size": len(payload), "mime": "application/octet-stream", "expiry": "1d", "maxPickups": 5})
check("init", st == 200 and r.get("parts") == 2, f"st={st} r={r}")
upload_id, part_size, parts_n = r["uploadId"], r["partSize"], r["parts"]

etags = []
for i in range(parts_n):
    chunk = payload[i*part_size:(i+1)*part_size]
    st, r = call("PUT", f"/api/uploads/{upload_id}/parts/{i+1}", raw=chunk, headers={"Content-Type": "application/octet-stream"})
    check(f"分片{i+1}({len(chunk)//1024}KB)", st == 200 and isinstance(r.get("etag"), str), f"st={st} r={str(r)[:100]}")
    etags.append({"partNumber": i+1, "etag": r["etag"]})

st, r = call("POST", f"/api/uploads/{upload_id}/complete", {"parts": etags})
check("complete", st == 200 and len(r.get("code", "")) == 6, f"st={st} r={r}")
code2 = r["code"]

st, r = call("POST", "/api/pickup", {"code": code2})
check("取件元数据", st == 200 and r.get("kind") == "file" and r.get("filename") == fname and r.get("pickupsLeft") == 5, f"st={st} r={r}")

st, blob = call("GET", f"/api/pickup/{code2}/download")
check("下载 sha256 一致", st == 200 and hashlib.sha256(blob).hexdigest() == hashlib.sha256(payload).hexdigest(), f"st={st} len={len(blob) if isinstance(blob, bytes) else '?'}")

print("== 3. 边界:伪造分片序号 / 会话不存在 ==")
st, r = call("PUT", "/api/uploads/not-exist/parts/1", raw=b"x")
check("会话不存在404", st == 404, f"st={st}")

st, r = call("POST", "/api/shares/text", {"text": "x", "expiry": "bad"})
check("非法expiry 400", st == 400, f"st={st}")

print(f"\n结果: {ok} pass / {fail} fail")
sys.exit(1 if fail else 0)
