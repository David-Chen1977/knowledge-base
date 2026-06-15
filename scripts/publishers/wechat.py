"""
微信公众号发布器（API 通道）
重用了 wechat_publisher.py 中的核心逻辑
"""

import os
import sys
import json
import re
import hashlib
import time
from typing import Optional, List

import requests
import markdown

# 确保能找到同级的 .env
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from .base import BasePublisher, PublishResult

APP_ID = os.environ.get("WECHAT_APP_ID", "")
APP_SECRET = os.environ.get("WECHAT_APP_SECRET", "")

# 尝试读取 .env
if not APP_ID or not APP_SECRET:
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    key, _, value = line.partition("=")
                    key = key.strip()
                    value = value.strip().strip("\"'")
                    if key == "WECHAT_APP_ID":
                        APP_ID = value
                    elif key == "WECHAT_APP_SECRET":
                        APP_SECRET = value


class WeChatPublisher(BasePublisher):
    name = "微信公众号"
    key = "wechat"

    def __init__(self):
        self._token: Optional[str] = None
        self._token_expires: float = 0

    def get_login_url(self) -> str:
        return "https://mp.weixin.qq.com/"

    def get_editor_url(self) -> str:
        return "https://mp.weixin.qq.com/"

    # ---------- API 通道特有 ----------

    def _get_access_token(self) -> Optional[str]:
        if self._token and time.time() < self._token_expires:
            return self._token
        if not APP_ID or not APP_SECRET:
            print("❌ 未设置公众号凭证 (WECHAT_APP_ID / WECHAT_APP_SECRET)")
            return None
        url = "https://api.weixin.qq.com/cgi-bin/token"
        params = {"grant_type": "client_credential", "appid": APP_ID, "secret": APP_SECRET}
        try:
            resp = requests.get(url, params=params, timeout=10)
            data = resp.json()
            if "access_token" in data:
                self._token = data["access_token"]
                self._token_expires = time.time() + data.get("expires_in", 7200) - 300
                return self._token
            else:
                print(f"❌ access_token 获取失败: {data}")
                return None
        except Exception as e:
            print(f"❌ 请求异常: {e}")
            return None

    def _upload_image(self, image_path: str, image_type: str = "thumb") -> Optional[str]:
        """上传图片到微信素材库"""
        token = self._get_access_token()
        if not token:
            return None
        url = "https://api.weixin.qq.com/cgi-bin/material/add_material"
        params = {"access_token": token, "type": image_type}
        mime = "image/png" if image_path.lower().endswith(".png") else "image/jpeg"
        try:
            with open(image_path, "rb") as f:
                files = {"media": (os.path.basename(image_path), f, mime)}
                resp = requests.post(url, params=params, files=files, timeout=30)
                data = resp.json()
                if "media_id" in data:
                    return data["media_id"]
                else:
                    print(f"⚠️ 图片上传失败: {data}")
                    return None
        except Exception as e:
            print(f"❌ 图片上传异常: {e}")
            return None

    def _upload_body_image(self, image_path: str) -> Optional[str]:
        """上传正文图片，返回 CDN URL"""
        token = self._get_access_token()
        if not token:
            return None
        url = "https://api.weixin.qq.com/cgi-bin/media/uploadimg"
        params = {"access_token": token}
        mime = "image/png" if image_path.lower().endswith(".png") else "image/jpeg"
        try:
            with open(image_path, "rb") as f:
                files = {"media": (os.path.basename(image_path), f, mime)}
                resp = requests.post(url, params=params, files=files, timeout=30)
                data = resp.json()
                if "url" in data:
                    return data["url"]
                else:
                    print(f"⚠️ 正文图片上传失败: {data}")
                    return None
        except Exception as e:
            print(f"❌ 正文图片上传异常: {e}")
            return None

    def _md_to_wechat_html(self, md_content: str) -> str:
        """Markdown → 微信公众号兼容 HTML"""
        html = markdown.markdown(
            md_content,
            extensions=[
                "markdown.extensions.extra",
                "markdown.extensions.codehilite",
                "markdown.extensions.tables",
            ],
        )
        html = html.replace("<hr />", '<section style="height:1px;background:#e0e0e0;margin:15px 0;"></section>')
        html = re.sub(r'\s+style="[^"]*"', "", html)
        html = f'<section data-style="default">{html}</section>'
        return html

    def publish(self, title: str, html_body: str, cover_path: str = "", body_images: Optional[List[str]] = None) -> PublishResult:
        """通过 API 创建公众号草稿"""
        token = self._get_access_token()
        if not token:
            return PublishResult(success=False, platform=self.name, error="access_token 获取失败")

        # 上传正文图片并替换 BODY_IMG_N 路径为真实 CDN URL
        body_md = html_body
        if body_images:
            for i, img_path in enumerate(body_images, start=1):
                placeholder = f"BODY_IMG_{i}"
                if placeholder in body_md and os.path.exists(img_path):
                    url = self._upload_body_image(img_path)
                    if url:
                        body_md = body_md.replace(placeholder, url)
                        print(f"  ✅ 正文图片已上传: {placeholder} → {url}")

        html_content = self._md_to_wechat_html(body_md)

        # 上传封面
        thumb_id = ""
        if cover_path and os.path.exists(cover_path):
            print(f"  ▶ 上传封面...")
            thumb_id = self._upload_image(cover_path, "thumb") or ""

        # 创建草稿
        url = "https://api.weixin.qq.com/cgi-bin/draft/add"
        params = {"access_token": token}
        digest = self._extract_digest(body_md)

        article = {
            "title": self._truncate_bytes(title, 200),
            "author": "道雷",
            "digest": digest,
            "content": html_content,
            "content_source_url": "https://chendaolei.pages.dev/blog",
            "need_open_comment": 0,
            "only_fans_can_comment": 0,
        }
        if thumb_id:
            article["thumb_media_id"] = thumb_id

        try:
            body = json.dumps({"articles": [article]}, ensure_ascii=False)
            resp = requests.post(url, params=params, data=body.encode("utf-8"),
                                 headers={"Content-Type": "application/json; charset=utf-8"}, timeout=30)
            data = resp.json()
            if "media_id" in data:
                print(f"  ✅ 公众号草稿创建成功！media_id: {data['media_id']}")
                return PublishResult(success=True, platform=self.name, url=f"media_id: {data['media_id']}")
            else:
                return PublishResult(success=False, platform=self.name, error=str(data))
        except Exception as e:
            return PublishResult(success=False, platform=self.name, error=str(e))

    @staticmethod
    def _extract_digest(md_content: str, max_len: int = 40) -> str:
        text = re.sub(r"^#+\s+", "", md_content, flags=re.MULTILINE)
        text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
        text = re.sub(r"\*(.+?)\*", r"\1", text)
        text = re.sub(r"!\[.*?\]\(.*?\)", "", text)
        text = re.sub(r"\[(.+?)\]\(.*?\)", r"\1", text)
        text = re.sub(r">+\s*.*?(?:\n|$)", "", text)
        text = re.sub(r"[-*_]{3,}", "", text)
        text = re.sub(r"\s+", "", text)
        text = text.strip()
        if len(text) > max_len:
            cut = text[:max_len]
            last_period = cut.rfind("。")
            if last_period > 0:
                return cut[:last_period + 1]
            return cut + "…"
        return text

    @staticmethod
    def _truncate_bytes(text: str, max_bytes: int) -> str:
        if len(text.encode("utf-8")) <= max_bytes:
            return text
        while text and len(text.encode("utf-8")) > max_bytes:
            text = text[:-1]
        return text
