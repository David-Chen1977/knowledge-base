"""
百家号 Playwright 发布器

编辑器: baijiahao.baidu.com/builder/rc/edit?type=news
"""

import time

from playwright.sync_api import Page

from .base import BasePublisher, PublishResult


class BaijiahaoPublisher(BasePublisher):
    name = "百家号"
    key = "baijiahao"

    def get_login_url(self) -> str:
        return "https://baijiahao.baidu.com/"

    def get_editor_url(self) -> str:
        return "https://baijiahao.baidu.com/builder/rc/edit?type=news"

    def fill_article(self, page: Page, title: str, html_body: str, cover_path: str = "") -> None:
        # 等待编辑器加载
        page.wait_for_selector('input[placeholder*="标题"]', timeout=15000)

        # 1. 输入标题
        title_input = page.locator('input[placeholder*="标题"], input[name="title"]')
        title_input.fill(title)

        # 2. 输入正文
        # 百家号的编辑器可能是 contenteditable 或 textarea
        editor = page.locator('[contenteditable="true"], .editor-content, .ProseMirror').first
        if not editor.is_visible(timeout=5000):
            # 可能是 textarea
            editor = page.locator('textarea[placeholder*="正文"]').first

        if editor.is_visible():
            editor.click()
            time.sleep(0.5)
            page.keyboard.press("Meta+a")
            page.keyboard.press("Backspace")
            time.sleep(0.3)

            cleaned_body = self.strip_local_images(html_body, log_prefix="  📸")
            page.evaluate("""(html) => {
                const blob = new Blob([html], { type: 'text/html' });
                const dt = new DataTransfer();
                dt.items.add(new File([blob], 'content.html', { type: 'text/html' }));
                navigator.clipboard.write(dt);
            }""", cleaned_body)
            page.keyboard.press("Meta+v")
            time.sleep(2)

        # 3. 设置封面
        if cover_path:
            try:
                cover_btn = page.locator('span:has-text("上传图片"), .upload-cover, button:has-text("添加封面")')
                if cover_btn.is_visible(timeout=3000):
                    cover_btn.click()
                    time.sleep(1)
                    upload_input = page.locator('input[type="file"]').first
                    if upload_input.is_visible(timeout=3000):
                        upload_input.set_input_files(cover_path)
                        time.sleep(3)
                        # 确认裁剪
                        try:
                            confirm_btn = page.locator('button:has-text("确定"), button:has-text("确认")')
                            if confirm_btn.is_visible(timeout=3000):
                                confirm_btn.click()
                        except:
                            pass
                        print(f"  ✅ 封面已设置")
            except Exception as e:
                print(f"  ⚠️ 封面上传跳过: {e}")

        # 4. 摘要
        try:
            summary_input = page.locator('textarea[placeholder*="摘要"], input[placeholder*="摘要"]')
            if summary_input.is_visible(timeout=2000):
                summary = html_body[:100].replace("<", "").replace(">", "").replace("\n", "")
                summary_input.fill(summary[:100])
                print(f"  ✅ 摘要已填写")
        except:
            pass

    def click_publish(self, page: Page) -> None:
        # 点击发布
        publish_btn = page.locator('button:has-text("发布"), button:has-text("发表")')
        publish_btn.click()
        time.sleep(2)

        # 二次确认
        try:
            confirm_btn = page.locator('button:has-text("确认发布"), .confirm-btn')
            if confirm_btn.is_visible(timeout=3000):
                confirm_btn.click()
        except:
            pass

        time.sleep(5)

    def get_article_url(self, page: Page) -> str:
        try:
            link_elem = page.locator('a[href*="baijiahao.baidu.com/s"]').first
            if link_elem.is_visible(timeout=3000):
                return link_elem.get_attribute("href") or page.url
        except:
            pass
        return page.url
