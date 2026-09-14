"""浏览器级冒烟测试:多文件上传、二维码渲染、语言切换、取件回环。

用法: python test/ui_smoke.py [base_url]   # 默认 http://localhost:8787
"""
import os
import sys
import tempfile

from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8787"
FAILED = []


def check(name, cond):
    print(f"  {'PASS' if cond else 'FAIL'} {name}")
    if not cond:
        FAILED.append(name)


def main():
    with tempfile.TemporaryDirectory() as td:
        f1 = os.path.join(td, "alpha.txt")
        f2 = os.path.join(td, "贝塔数据.bin")
        with open(f1, "wb") as f:
            f.write("hello ui smoke A".encode())
        with open(f2, "wb") as f:
            f.write(bytes(range(256)) * 4)

        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            errors = []
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: errors.append(str(e)))

            def real_errors():
                # 404 资源报错来自刻意访问的 /no-such-page,属预期
                return [e for e in errors if "404 (Not Found)" not in e]

            print("== 1. 首页加载 ==")
            page.goto(BASE + "/")
            check("语言按钮存在", page.locator("#lang-btn").count() == 1)
            check("初始中文 tab 文案", "发文件" in page.locator(".tab.active").inner_text())
            check("qr 库已加载", page.evaluate("typeof window.qrcode === 'function'"))

            print("== 2. 语言切换 ==")
            page.click("#lang-btn")
            check("切到英文 tab 文案", "Send file" in page.locator(".tab.active").inner_text())
            check("标题跟随", "Send" in page.title())
            page.click("#lang-btn")
            check("切回中文", "发文件" in page.locator(".tab.active").inner_text())

            print("== 3. 多文件选择 ==")
            page.set_input_files("#file-input", [f1, f2])
            check("两行文件队列", page.locator(".file-row").count() == 2)
            check("上传按钮可用", page.locator("#btn-upload").is_enabled())

            print("== 4. 批量上传与结果 ==")
            page.click("#btn-upload")
            page.wait_for_selector("#results .result", timeout=30000)
            page.wait_for_function("document.querySelectorAll('#results .result').length === 2", timeout=30000)
            check("批量头部(2 个成功)", "2" in page.locator(".result-batch-head .result-title").inner_text())
            check("两张结果卡片", page.locator("#results .result").count() == 2)
            check("每张含二维码 SVG", page.locator("#results .qr-wrap svg").count() == 2)
            check("口令瓦片 6 位", page.locator("#results .result .code span").first.inner_text().strip() != "")
            check("复制全部按钮", page.locator(".result-batch-head button").first.inner_text() != "")
            check("每行已完成标记", page.locator(".file-row.done").count() == 2)
            code = "".join(page.locator("#results .result .code").first.inner_text().split())
            check("口令为 6 位数字", code.isdigit() and len(code) == 6)

            print("== 5. 取件回环(?code= 带参)==")
            page.goto(BASE + "/pickup?code=" + code)
            page.wait_for_selector("#pickup-result .share-card", timeout=15000)
            check("取件卡片出现", page.locator("#pickup-result .share-card").count() == 1)
            check("下载按钮", page.locator("#pickup-result a.btn.primary").count() >= 0)

            print("== 6. 404 页 i18n 挂载 ==")
            page.goto(BASE + "/no-such-page")
            page.wait_for_selector("#lang-btn")
            check("404 语言按钮", page.locator("#lang-btn").count() == 1)

            check("无控制台错误", not real_errors())
            if real_errors():
                print("  console errors:", real_errors()[:5])
            browser.close()

    print(f"\n结果: {len(FAILED)} fail")
    sys.exit(1 if FAILED else 0)


if __name__ == "__main__":
    main()
