# 归档脚本说明

| 脚本 | 原因 | 替代方案 |
|------|------|---------|
| toutiao_publisher.py | Playwright选择器失效，头条频繁改版无法维护 | 人工粘贴 → `*_可粘贴.md` |
| zhihu_publisher.py | 同上，登录流程变更 | 人工粘贴 → `*知乎版.md` |
| wechat_image_update.mjs | 自身标注"已弃用" | wechat_publisher.py |
| wechat_inline_upload.py | 自身标注"thin wrapper" | wechat_publisher.py |
| article_adapt.py | 自身标注"已交给generate-platform-content.mjs" | generate-platform-content.mjs |
