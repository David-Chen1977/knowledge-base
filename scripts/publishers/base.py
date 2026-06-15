import os
import json
import re
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional, List

from playwright.sync_api import sync_playwright, BrowserContext, Page


@dataclass
class PublishResult:
    success: bool
    platform: str
    url: str = ""
    error: str = ""


# 登录态存储目录
STATE_DIR = Path.home() / ".cache" / "opencode" / "publishers"
STATE_DIR.mkdir(parents=True, exist_ok=True)


class BasePublisher(ABC):
    """所有平台发布器的基类"""

    name: str = ""  # 中文显示名：知乎 / 头条号 / 百家号
    key: str = ""   # CLI 标志：zhihu / toutiao / baijiahao

    # ========== 子类必须实现 ==========

    @abstractmethod
    def get_login_url(self) -> str:
        """返回平台的登录页面 URL"""
        ...

    @abstractmethod
    def get_editor_url(self) -> str:
        """返回平台的编辑器页面 URL"""
        ...

    def fill_article(self, page: Page, title: str, html_body: str, cover_path: str = "") -> None:
        """在已打开的编辑器页面中填入文章内容（API 通道的发布器可忽略）"""
        pass

    def click_publish(self, page: Page) -> None:
        """点击发布按钮，返回前等待跳转完成（API 通道的发布器可忽略）"""
        pass

    def get_article_url(self, page: Page) -> str:
        """发布成功后从页面提取文章 URL，默认返回当前页面 URL"""
        return page.url

    # ========== 通用流程 ==========

    def state_path(self) -> Path:
        return STATE_DIR / f"{self.name}.json"

    def is_logged_in(self) -> bool:
        return self.state_path().exists()

    def login(self, headless: bool = False) -> None:
        """交互式登录：打开浏览器让用户手动扫码/输入"""
        print(f"\n🔐 请在打开的浏览器中登录 {self.name}")
        print(f"   登录页面: {self.get_login_url()}")
        print(f"   ⏳ 等待登录完成（登录后会自动检测并保存登录态，最长等待3分钟）...")

        with sync_playwright() as p:
            browser = p.chromium.launch(channel="chrome", headless=headless)
            context = browser.new_context()
            page = context.new_page()
            page.goto(self.get_login_url(), wait_until="domcontentloaded")

            # 等待导航离开登录页（说明登录成功）
            login_domains = ["zhuanlan.zhihu.com", "mp.toutiao.com", "baijiahao.baidu.com"]
            try:
                page.wait_for_url(
                    lambda url: any(d in url for d in login_domains)
                                or "/people/" in url
                                or "/creator" in url
                                or "/dashboard" in url
                                or "/profile" in url
                                or "/uc" in url,
                    timeout=180000,
                )
                print("✅ 检测到登录成功！")
            except:
                print("⚠️ 等待超时，请确认已在浏览器中完成登录...")
                # 额外等待几秒让用户手动完成
                import time as _time
                _time.sleep(5)

            context.storage_state(path=str(self.state_path()))
            print(f"✅ 登录态已保存到 {self.state_path()}")
            browser.close()

    def _ensure_context(self, p, headless: bool = True) -> BrowserContext:
        """创建已登录的 browser context"""
        if self.is_logged_in():
            context = p.chromium.launch(channel="chrome", headless=headless).new_context(
                storage_state=str(self.state_path())
            )
            return context
        else:
            print(f"❌ 未检测到 {self.name} 的登录态")
            print(f"   请先运行 --login: python publish.py --{self.name} --login")
            raise RuntimeError(f"{self.name} 未登录")

    def publish(self, title: str, html_body: str, cover_path: str = "", body_images: Optional[List[str]] = None) -> PublishResult:
        """统一发布流程"""
        if not self.is_logged_in():
            return PublishResult(
                success=False,
                platform=self.name,
                error=f"未登录，请先执行 --{self.key} --login",
            )

        try:
            with sync_playwright() as p:
                context = self._ensure_context(p, headless=True)
                page = context.new_page()

                print(f"  ▶ 正在打开 {self.name} 编辑器...")
                page.goto(self.get_editor_url(), wait_until="domcontentloaded")

                # 等待编辑器就绪
                time.sleep(2)

                # 填入文章
                print(f"  ▶ 正在填写文章...")
                self.fill_article(page, title, html_body, cover_path)

                # 发布
                print(f"  ▶ 正在发布...")
                self.click_publish(page)

                # 等待跳转完成
                time.sleep(3)
                article_url = self.get_article_url(page)

                context.close()
                print(f"  ✅ {self.name} 发布成功: {article_url}")
                return PublishResult(success=True, platform=self.name, url=article_url)

        except Exception as e:
            print(f"  ❌ {self.name} 发布失败: {e}")
            return PublishResult(success=False, platform=self.name, error=str(e))

    # ========== Markdown → HTML 工具方法 ==========

    @staticmethod
    def md_to_html(md_content: str) -> str:
        """通用 Markdown → HTML 转换"""
        import markdown
        html = markdown.markdown(
            md_content,
            extensions=[
                "markdown.extensions.extra",
                "markdown.extensions.codehilite",
                "markdown.extensions.tables",
            ],
        )
        return html

    @staticmethod
    def strip_local_images(html: str, log_prefix: str = "") -> str:
        """去掉 HTML 中指向本地文件的 <img> 标签（浏览器端无法加载 file:// 路径）"""
        count_before = len(re.findall(r'<img\s', html))
        html = re.sub(r'<img[^>]*src="file://[^"]*"[^>]*>', '', html)
        html = re.sub(r'<img[^>]*src="/[^"]+"[^>]*>', '', html)
        count_after = len(re.findall(r'<img\s', html))
        removed = count_before - count_after
        if removed > 0 and log_prefix:
            print(f"{log_prefix} ⚠️ {removed} 张本地图片已跳过（浏览器端无法自动上传）")
        return html
