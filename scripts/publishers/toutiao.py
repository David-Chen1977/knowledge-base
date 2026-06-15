"""
头条号 Playwright 发布器

编辑器: mp.toutiao.com
"""

import time

from playwright.sync_api import Page

from .base import BasePublisher, PublishResult


class ToutiaoPublisher(BasePublisher):
    name = "头条号"
    key = "toutiao"

    def get_login_url(self) -> str:
        return "https://mp.toutiao.com/"

    def get_editor_url(self) -> str:
        return "https://mp.toutiao.com/profile_v4/graphic/publish"

    def fill_article(self, page: Page, title: str, html_body: str, cover_path: str = "") -> None:
        # 等待编辑器加载
        page.wait_for_selector('[placeholder*="标题"]', timeout=15000)

        # 1. 输入标题
        title_input = page.locator('[placeholder*="标题"]')
        title_input.fill(title)

        # 2. 输入正文
        editor = page.locator('[contenteditable="true"]').first
        if not editor.is_visible():
            editor = page.locator(".ProseMirror").first

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
                # 点击"设置封面"
                cover_btn = page.locator('span:has-text("设置封面")')
                if cover_btn.is_visible(timeout=3000):
                    cover_btn.click()
                    time.sleep(1)
                    # 上传本地图片
                    upload_input = page.locator('input[type="file"]').first
                    if upload_input.is_visible(timeout=3000):
                        upload_input.set_input_files(cover_path)
                        time.sleep(2)
                        # 确认选择
                        confirm_btn = page.locator('button:has-text("确认")')
                        if confirm_btn.is_visible(timeout=3000):
                            confirm_btn.click()
                        print(f"  ✅ 封面已设置")
            except Exception as e:
                print(f"  ⚠️ 封面上传跳过: {e}")

        # 4. 设置原创声明
        try:
            original_switch = page.locator('.original-switch, .original-btn, span:has-text("声明原创")')
            if original_switch.is_visible(timeout=2000):
                original_switch.click()
                print(f"  ✅ 原创声明已勾选")
        except:
            pass

    def click_publish(self, page: Page) -> None:
        # 点击发布
        publish_btn = page.locator('button:has-text("发布")')
        if not publish_btn.is_visible():
            publish_btn = page.locator('button:has-text("发表")')
        publish_btn.click()

        # 等待发布确认弹窗
        time.sleep(2)

        # 有些版本有二次确认
        try:
            confirm_btn = page.locator('button:has-text("确认发布")')
            if confirm_btn.is_visible(timeout=3000):
                confirm_btn.click()
        except:
            pass

        # 等待发布完成
        time.sleep(5)

    def get_article_url(self, page: Page) -> str:
        # 头条发布成功后通常在页面上有跳转或提示
        # 尝试从当前 URL 或页面内容提取
        try:
            link_elem = page.locator('a[href*="toutiao.com/item"]').first
            if link_elem.is_visible(timeout=3000):
                return link_elem.get_attribute("href") or page.url
        except:
            pass
        return page.url
