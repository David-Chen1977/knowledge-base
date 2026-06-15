#!/usr/bin/env python3
"""
微信公众平台数据分析 — 拉取阅读量/用户增长/文章表现

用法:
    python3 wechat_analytics.py              # 查看近7天概览
    python3 wechat_analytics.py --days 30    # 查看近30天
    python3 wechat_analytics.py --json       # JSON 输出
"""

import os, sys, json, argparse
from datetime import datetime, timedelta

try:
    import requests
except ImportError:
    print("pip install requests"); sys.exit(1)

# ── 凭证（复用 wechat_publisher.py 的 .env） ──
APP_ID = os.environ.get("WECHAT_APP_ID", "")
APP_SECRET = os.environ.get("WECHAT_APP_SECRET", "")
if not APP_ID or not APP_SECRET:
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        for line in open(env_path):
            line = line.strip()
            if line and not line.startswith("#"):
                k, _, v = line.partition("=")
                k, v = k.strip(), v.strip().strip("\"'")
                if k == "WECHAT_APP_ID": APP_ID = v
                elif k == "WECHAT_APP_SECRET": APP_SECRET = v


def get_token():
    r = requests.get("https://api.weixin.qq.com/cgi-bin/token", params={
        "grant_type": "client_credential", "appid": APP_ID, "secret": APP_SECRET
    }, timeout=10)
    d = r.json()
    if "access_token" in d:
        return d["access_token"]
    print(f"❌ Token 获取失败: {d}", file=sys.stderr)
    sys.exit(1)


def fetch_api(token, endpoint, body):
    """通用微信数据接口调用"""
    url = f"https://api.weixin.qq.com/datacube/{endpoint}?access_token={token}"
    r = requests.post(url, json=body, timeout=15)
    data = r.json()
    if "list" in data:
        return data["list"]
    if "errcode" in data and data["errcode"] != 0:
        print(f"  ⚠️  {endpoint}: {data.get('errmsg', '未知错误')}", file=sys.stderr)
    return []


def date_range(days):
    """生成微信API需要的日期范围"""
    end = datetime.now() - timedelta(days=1)  # 昨天
    start = end - timedelta(days=days - 1)
    return {
        "begin_date": start.strftime("%Y-%m-%d"),
        "end_date": end.strftime("%Y-%m-%d"),
    }


def main():
    p = argparse.ArgumentParser(description="微信公众平台数据分析")
    p.add_argument("--days", type=int, default=7)
    p.add_argument("--json", action="store_true")
    args = p.parse_args()

    token = get_token()
    period = date_range(args.days)

    # ── 1. 用户增长 ──
    user_data = fetch_api(token, "getusersummary", period)
    new_users = sum(d.get("new_user", 0) for d in user_data) if user_data else 0
    total_users = sum(d.get("cumulate_user", 0) for d in user_data) if user_data else 0

    # ── 2. 文章阅读总量 ──
    article_data = fetch_api(token, "getarticletotal", period)
    total_read = sum(d.get("int_page_read_count", 0) for d in article_data) if article_data else 0
    total_share = sum(d.get("share_count", 0) for d in article_data) if article_data else 0
    total_fav = sum(d.get("add_to_fav_count", 0) for d in article_data) if article_data else 0

    # ── 3. 消息分析 ──
    msg_data = fetch_api(token, "getupstreammsg", period)
    total_msg = sum(d.get("msg_user", 0) for d in msg_data) if msg_data else 0

    if args.json:
        print(json.dumps({
            "period": f"{period['begin_date']} ~ {period['end_date']}",
            "new_users": new_users,
            "cumulate_users": total_users,
            "total_reads": total_read,
            "total_shares": total_share,
            "total_favs": total_fav,
            "total_messages": total_msg,
            "daily_users": user_data,
            "daily_articles": article_data,
        }, ensure_ascii=False, indent=2))
        return

    print(f"\n📊 微信后台数据概览（近 {args.days} 天: {period['begin_date']} ~ {period['end_date']}）")
    print(f"  👥 新增关注: {new_users} 人")
    print(f"  👥 累计关注: {total_users} 人")
    print(f"  📖 文章阅读: {total_read} 次")
    print(f"  🔄 分享转发: {total_share} 次")
    print(f"  ⭐ 收藏: {total_fav} 次")
    print(f"  💬 用户消息: {total_msg} 条")

    if article_data:
        print(f"\n  每日阅读趋势:")
        for d in article_data[-7:]:
            date = d.get("ref_date", "?")
            reads = d.get("int_page_read_count", 0)
            shares = d.get("share_count", 0)
            bar = "█" * min(int(reads / max(1, total_read) * 30), 30)
            print(f"    {date}  {bar}  {reads} 阅读  {shares} 分享")

    if total_read == 0:
        print(f"\n  ⚠️  暂无阅读数据（可能近{args.days}天内未发布文章或数据延迟1-2天）")

    print()


if __name__ == "__main__":
    main()
