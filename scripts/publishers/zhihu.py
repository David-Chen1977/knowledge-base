"""
知乎专栏 Playwright 发布器

编辑器: zhuanlan.zhihu.com/write (Draft.js)
题库：标题 textarea，正文 Draft.js contenteditable div
"""

import time

from playwright.sync_api import Page

from .base import BasePublisher, PublishResult


class ZhihuPublisher(BasePublisher):
    name = "知乎"
    key = "zhihu"

    def get_login_url(self) -> str:
        return "https://www.zhihu.com/signin"

    def get_editor_url(self) -> str:
        return "https://zhuanlan.zhihu.com/write"

    def fill_article(self, page: Page, title: str, html_body: str, cover_path: str = "") -> None:
        page.wait_for_selector('textarea[placeholder*="标题"]', timeout=15000)

        # 1. 标题
        title_input = page.locator('textarea[placeholder*="标题"]')
        title_input.fill(title)

        # 2. 正文 — 使用 ClipboardEvent 批量粘贴
        editor = page.locator('[role="textbox"].public-DraftEditor-content')
        editor.click()
        time.sleep(0.3)

        page.keyboard.press("Meta+a")
        page.keyboard.press("Backspace")
        time.sleep(0.5)

        cleaned_body = self.strip_local_images(html_body, log_prefix="  📸")

        # 使用 ClipboardItem API 写入 HTML + 纯文本（Draft.js 需要的格式）
        page.evaluate("""(html) => {
            const plain = html.replace(/<[^>]*>/g, '');
            return navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': new Blob([html], { type: 'text/html' }),
                    'text/plain': new Blob([plain], { type: 'text/plain' })
                })
            ]);
        }""", cleaned_body)
        time.sleep(0.5)

        page.keyboard.press("Meta+v")
        time.sleep(3)

        # 3. 封面（通过"发布设置"入口）
        if cover_path:
            try:
                settings_btn = page.locator('button:has-text("发布设置")')
                if settings_btn.is_visible(timeout=3000):
                    settings_btn.click()
                    time.sleep(1)

                    # 在弹窗中找封面设置
                    cover_input = page.locator('input.UploadPicture-input, input[type="file"]').first
                    if cover_input.is_visible(timeout=3000):
                        cover_input.set_input_files(cover_path)
                        time.sleep(2)
                        print(f"  ✅ 封面已上传")
                    else:
                        print(f"  ⚠️ 未找到封面上传入口，跳过封面")

                    # 关闭弹窗
                    page.keyboard.press("Escape")
                    time.sleep(0.5)
            except Exception as e:
                print(f"  ⚠️ 封面上传跳过: {e}")

        # 4. 话题标签
        try:
            topic_btn = page.locator('button:has-text("添加话题")')
            if topic_btn.is_visible(timeout=3000):
                topic_btn.click()
                time.sleep(0.5)
                topic_input = page.locator('input[placeholder*="搜索话题"]')
                if topic_input.is_visible(timeout=2000):
                    for tag in ["能源", "科技"]:
                        topic_input.fill(tag)
                        time.sleep(1)
                        first_topic = page.locator(".TopicSelector-item").first
                        if first_topic.is_visible(timeout=2000):
                            first_topic.click()
                            time.sleep(0.3)
            print(f"  ✅ 话题标签已添加")
        except Exception:
            print(f"  ⚠️ 话题标签跳过")

    def click_publish(self, page: Page) -> None:
        publish_btn = page.locator('button:has-text("发布")')
        publish_btn.click()

        try:
            page.wait_for_url(lambda url: "/p/" in url, timeout=20000)
        except:
            time.sleep(5)

    def get_article_url(self, page: Page) -> str:
        return page.url
