#!/usr/bin/env python3
"""
Thin wrapper — see wechat_publisher.py for the full implementation.

历史说明：
    wechat_inline_upload.py 原为独立脚本（含 inline 图片上传、HTML 优化等）。
    功能已全部合并入 wechat_publisher.py，此文件保持为向后兼容的导入包装。
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from wechat_publisher import main

if __name__ == "__main__":
    main()
