#!/usr/bin/env python3
"""
sprint.py — 日常协作节奏

用法:
    python3 sprint.py start      显示今日状态和待办
    python3 sprint.py done       标记今日完成
    python3 sprint.py log "..."  记录一条日志
    python3 sprint.py summary    本周总结

数据存放在 scripts/生产批次/topic-pool.json
"""

import json, os, sys
from datetime import date, datetime, timedelta

POOL_PATH = "/Users/Admin/OpencodeWorkspace/scripts/生产批次/topic-pool.json"
LOG_PATH  = "/Users/Admin/OpencodeWorkspace/scripts/生产批次/sprint-log.md"

def init_pool():
    """Initialize topic pool if missing"""
    if os.path.exists(POOL_PATH):
        return json.load(open(POOL_PATH))
    pool = {
        "version": 1,
        "topics": [
            {"id": "bundle_01", "title": "算随电动：数据中心虚拟电厂首单交易的商业逻辑", "status": "done", "types": ["article", "website", "ppt", "video"], "done_at": "2026-06-15"},
            {"id": "bundle_02", "title": "液冷赛道PE投资地图：千亿市场的六大主题与全球标的矩阵", "status": "done", "types": ["article", "website", "ppt", "video"], "done_at": "2026-06-15"},
            {"id": "bundle_03", "title": "AIDC两强对比：润泽科技狂奔，数据港追赶，算电协同谁主沉浮", "status": "done", "types": ["article", "website", "ppt", "video"], "done_at": "2026-06-15"},
            {"id": "bundle_04", "title": "液冷赛道PE投资地图：冷却液材料的百亿国产替代机会", "status": "done", "types": ["article", "website", "ppt", "video"], "done_at": "2026-06-15"},
            {"id": "bundle_05", "title": "AIDC绿电一体化：算电协同政策落地下的PE/VC机会图谱", "status": "done", "types": ["article", "website", "ppt", "video"], "done_at": "2026-06-15"},
        ]
    }
    os.makedirs(os.path.dirname(POOL_PATH), exist_ok=True)
    json.dump(pool, open(POOL_PATH, 'w'), ensure_ascii=False, indent=2)
    return pool


def cmd_start():
    pool = init_pool()
    today = date.today().isoformat()

    done = [t for t in pool['topics'] if t.get('status') == 'done']
    pending = [t for t in pool['topics'] if t.get('status') == 'pending']
    in_progress = [t for t in pool['topics'] if t.get('status') == 'in_progress']

    # Count deliverables
    articles = sum(1 for t in done if 'article' in t.get('types', []))
    pptxs = sum(1 for t in done if 'ppt' in t.get('types', []))
    videos = sum(1 for t in done if 'video' in t.get('types', []))
    websites = sum(1 for t in done if 'website' in t.get('types', []))

    print()
    print("╔══════════════════════════════════════════════╗")
    print(f"║  📊 内容生产仪表盘 — {today}            ║")
    print("╠══════════════════════════════════════════════╣")
    print(f"║  已完成选题: {len(done):>4} 个                        ║")
    print(f"║  公众号文章: {articles:>4} 篇                        ║")
    print(f"║  网站文章:   {websites:>4} 篇                        ║")
    print(f"║  PPT:        {pptxs:>4} 份                        ║")
    print(f"║  视频:       {videos:>4} 个                        ║")
    print("╠══════════════════════════════════════════════╣")

    if in_progress:
        print("║  🔨 进行中:                                    ║")
        for t in in_progress:
            print(f"║    - {t['title'][:35]:35s} ║")
    else:
        print("║  ⏸️  无进行中选题                               ║")

    print("╠══════════════════════════════════════════════╣")
    print("║  📋 选题池:                                    ║")
    if pending:
        for t in pending[:5]:
            print(f"║    {t.get('priority','P1')}  {t['title'][:38]:38s} ║")
    else:
        print("║    (选题池为空 — 运行 topic-sense 获取建议)      ║")

    print("╠══════════════════════════════════════════════╣")
    print("║  🛠️  可用命令:                                  ║")
    print("║    pipeline:  content-pipe.mjs --bundle <...>  ║")
    print("║    video:     ppt_to_video.py --bundle <...>   ║")
    print("║    publish:   wechat_publisher.py --md <...>   ║")
    print("║    add topic: sprint.py add \"主题\"             ║")
    print("╚══════════════════════════════════════════════╝")
    print()

    # Append to sprint log
    if not os.path.exists(LOG_PATH):
        with open(LOG_PATH, 'w') as f:
            f.write(f"# Sprint Log — 2026\n\n")
    with open(LOG_PATH, 'a') as f:
        now = datetime.now().strftime('%H:%M')
        f.write(f"## {today} {now}\n- [x] sprint start\n")


def cmd_add(title, priority="P1", types="article,website,ppt,video"):
    pool = init_pool()
    tid = f"topic_{len(pool['topics'])+1:03d}"
    pool['topics'].append({
        "id": tid,
        "title": title,
        "status": "pending",
        "priority": priority,
        "types": types.split(","),
        "created_at": date.today().isoformat(),
    })
    json.dump(pool, open(POOL_PATH, 'w'), ensure_ascii=False, indent=2)
    print(f"  ✅ 已添加选题: {title}")


def cmd_done(topic_id):
    pool = init_pool()
    for t in pool['topics']:
        if t['id'] == topic_id:
            t['status'] = 'done'
            t['done_at'] = date.today().isoformat()
            json.dump(pool, open(POOL_PATH, 'w'), ensure_ascii=False, indent=2)
            print(f"  ✅ 标记完成: {t['title']}")
            return
    print(f"  ❌ 未找到选题: {topic_id}")


def cmd_summary():
    pool = init_pool()
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    done = [t for t in pool['topics'] if t.get('status') == 'done']
    this_week = [t for t in done if (t.get('done_at','') >= week_start.isoformat())]

    print(f"\n📊 本周总结 ({week_start.isoformat()} ~ {today.isoformat()})")
    print(f"  本周完成: {len(this_week)} 个选题")
    print(f"  累计完成: {len(done)} 个选题")
    if this_week:
        print("  本周产出:")
        for t in this_week:
            types_str = ','.join(t.get('types', []))
            print(f"    - {t['title'][:50]}  [{types_str}]")


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'start'
    if cmd == 'start':
        cmd_start()
    elif cmd == 'add' and len(sys.argv) > 2:
        cmd_add(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "P1")
    elif cmd == 'done' and len(sys.argv) > 2:
        cmd_done(sys.argv[2])
    elif cmd == 'summary':
        cmd_summary()
    else:
        print("用法: sprint.py [start|add|done|summary]")
