#!/usr/bin/env python3
"""Generate deck_电改2.0.json for native_pptx.py pipeline.
17-slide investment pitch deck on 电改2.0 电力市场化进度.
"""
import json

SW = 13.333  # slide width
SH = 7.5     # slide height

NAVY = "#364153"
GOLD = "#B89A6A"
RED = "#C00000"
WHITE = "#FFFFFF"
LIGHT_NAVY = "#2a3d55"
CARD_BG = "#2e4259"
DARK_CARD = "#253747"
GOLD_LIGHT = "#c9ad7d"

FONT = "Microsoft YaHei"

def bg(color=NAVY):
    return {"background": color}

def gold_line(y=0.30):
    return {"type": "rect", "x": 0, "y": y, "w": SW, "h": 0.025, "fill": GOLD}

def title_text(text, y=0.5, size=28, color=GOLD, bold=True):
    return {"text": text, "x": 0.7, "y": y, "w": 11.9, "h": 0.7,
            "fontSize": size, "bold": bold, "color": color, "font": FONT}

def subtitle_text(text, y=1.15, size=14, color=WHITE):
    return {"text": text, "x": 0.7, "y": y, "w": 11.9, "h": 0.4,
            "fontSize": size, "bold": False, "color": color, "font": FONT}

def page_num(n, total=17):
    return {"text": f"{n}/{total}", "x": 12.0, "y": 7.05, "w": 1.0, "h": 0.3,
            "fontSize": 9, "bold": False, "color": GOLD, "align": "right", "font": FONT}

def body_text(text, x=0.7, y=1.5, w=11.9, h=0.4, size=14, bold=False, color=WHITE, align="left"):
    return {"text": text, "x": x, "y": y, "w": w, "h": h,
            "fontSize": size, "bold": bold, "color": color, "align": align, "font": FONT}

def accent_card(x, y, w, h, fill=CARD_BG):
    return {"type": "rounded_rect", "x": x, "y": y, "w": w, "h": h,
            "fill": fill}

def body_card_text(text, x, y, w, h, size=12, bold=False, color=WHITE, align="left"):
    return {"text": text, "x": x+0.15, "y": y+0.08, "w": w-0.3, "h": h-0.16,
            "fontSize": size, "bold": bold, "color": color, "align": align, "font": FONT}

# ---------- build slides ----------

slides = []

# ======== SLIDE 1: COVER ========
s1_shapes = [
    gold_line(3.2),
    {"type": "rounded_rect", "x": 1.5, "y": 3.5, "w": 10.3, "h": 0.03, "fill": GOLD},
]
s1_texts = [
    {"text": "电改2.0：电力市场化进度全景地图", "x": 1.5, "y": 2.0, "w": 10.3, "h": 1.2,
     "fontSize": 38, "bold": True, "color": GOLD, "align": "center", "font": FONT},
    {"text": "——哪些省份真的在推电力市场化？", "x": 1.5, "y": 3.0, "w": 10.3, "h": 0.7,
     "fontSize": 22, "bold": False, "color": WHITE, "align": "center", "font": FONT},
    {"text": "算电协同投资系列 · 选题四", "x": 1.5, "y": 4.0, "w": 10.3, "h": 0.5,
     "fontSize": 14, "bold": False, "color": GOLD_LIGHT, "align": "center", "font": FONT},
    {"text": "2026年6月", "x": 1.5, "y": 5.5, "w": 10.3, "h": 0.4,
     "fontSize": 12, "bold": False, "color": WHITE, "align": "center", "font": FONT},
    {"text": "PE/VC Investment Pitch · Institutional Use Only", "x": 1.5, "y": 5.9, "w": 10.3, "h": 0.4,
     "fontSize": 10, "bold": False, "color": GOLD_LIGHT, "align": "center", "font": FONT},
]
slides.append({"background": NAVY, "shapes": s1_shapes, "texts": s1_texts})

# ======== SLIDE 2: 核心观点 ========
s2_shapes = [
    gold_line(),
    accent_card(0.7, 1.6, 11.9, 2.2, DARK_CARD),
    {"type": "rect", "x": 0.7, "y": 1.6, "w": 0.06, "h": 2.2, "fill": GOLD},
    accent_card(0.7, 4.2, 5.8, 1.8, CARD_BG),
    accent_card(6.8, 4.2, 5.8, 1.8, CARD_BG),
]
s2_texts = [
    title_text("核心观点"),
    subtitle_text("Investment Thesis"),
    body_card_text(
        "电改2.0不是要不要推的问题，而是各省进度差3-5年——\n"
        "选对省份布局算电协同，比选对技术路线更重要。",
        0.7, 1.6, 11.9, 1.0, size=18, bold=True, color=GOLD),
    body_card_text(
        "当前7省现货市场已正式运行（山西/广东/山东/甘肃/蒙西/湖北/浙江），\n"
        "5省即将转正（安徽/陕西/辽宁/河北南网/南方区域），\n"
        "仍有近10省停留在短周期试运行或未启动。",
        0.7, 2.5, 11.9, 1.2, size=14, color=WHITE),
    body_card_text("进度分化 → 跨省套利空间", 0.7, 4.2, 5.8, 0.6, size=16, bold=True, color=GOLD),
    body_card_text("蒙西用户侧240元/MWh vs 广东460元/MWh\n价差近1倍，地理套利空间巨大",
                   0.7, 4.8, 5.8, 1.0, size=13, color=WHITE),
    body_card_text("进度分化 → 选址决策梯度", 6.8, 4.2, 5.8, 0.6, size=16, bold=True, color=GOLD),
    body_card_text("甘肃/蒙西/陕西低电价区→算电协同首选\n广东/江苏高价区→VPP/需求响应价值大",
                   6.8, 4.8, 5.8, 1.0, size=13, color=WHITE),
    page_num(2),
]
slides.append({"background": NAVY, "shapes": s2_shapes, "texts": s2_texts})

# ======== SLIDE 3: 电改进程时间线 ========
s3_shapes = [
    gold_line(),
    # Timeline base line
    {"type": "rect", "x": 0.7, "y": 2.8, "w": 11.9, "h": 0.02, "fill": GOLD},
    # Milestones
    accent_card(0.7, 1.5, 2.5, 1.2, DARK_CARD),
    accent_card(3.5, 1.5, 2.5, 1.2, DARK_CARD),
    accent_card(6.3, 1.5, 2.5, 1.2, DARK_CARD),
    accent_card(9.1, 1.5, 3.5, 1.2, DARK_CARD),
    # Bottom row milestones
    accent_card(0.7, 3.2, 2.5, 1.2, CARD_BG),
    accent_card(3.5, 3.2, 2.5, 1.2, CARD_BG),
    accent_card(6.3, 3.2, 2.5, 1.2, CARD_BG),
    accent_card(9.1, 3.2, 3.5, 1.2, CARD_BG),
    # Summary box
    accent_card(0.7, 5.0, 11.9, 1.6, DARK_CARD),
]
s3_texts = [
    title_text("电改进程时间线 | 2015-2026"),
    subtitle_text("从9号文到现货市场全面铺开"),
    body_card_text("2015\n中发9号文", 0.7, 1.5, 2.5, 0.8, size=13, bold=True, color=GOLD),
    body_card_text("新一轮电改启动\n管住中间、放开两头", 0.7, 2.0, 2.5, 0.6, size=9, color=WHITE),
    body_card_text("2017-2019\n首批8个现货试点", 3.5, 1.5, 2.5, 0.8, size=13, bold=True, color=GOLD),
    body_card_text("山西/广东/山东/甘肃\n蒙西/福建/浙江/四川", 3.5, 2.0, 2.5, 0.6, size=9, color=WHITE),
    body_card_text("2021-2023\n第二批试点+扩围", 6.3, 1.5, 2.5, 0.8, size=13, bold=True, color=GOLD),
    body_card_text("湖北/安徽/辽宁\n陕西/河北南网等", 6.3, 2.0, 2.5, 0.6, size=9, color=WHITE),
    body_card_text("2024-2026\n现货市场正式运行", 9.1, 1.5, 3.5, 0.8, size=13, bold=True, color=GOLD),
    body_card_text("7省转正 + 5省即将转正\n负电价常态化·容量电价分化", 9.1, 2.0, 3.5, 0.6, size=9, color=WHITE),
    # Bottom milestones
    body_card_text("2024.6\n粤/鲁转正", 0.7, 3.2, 2.5, 0.8, size=13, bold=True, color=GOLD),
    body_card_text("首批非试点省份转正\n市场规则持续迭代", 0.7, 3.7, 2.5, 0.6, size=9, color=WHITE),
    body_card_text("2025\n蒙西/湖北转正", 3.5, 3.2, 2.5, 0.8, size=13, bold=True, color=GOLD),
    body_card_text("首个非试点转正\n规则版本迭代加速", 3.5, 3.7, 2.5, 0.6, size=9, color=WHITE),
    body_card_text("2025-2026\n南方区域市场", 6.3, 3.2, 2.5, 0.8, size=13, bold=True, color=GOLD),
    body_card_text("首个跨省区域市场\n粤桂云黔琼五省", 6.3, 3.7, 2.5, 0.6, size=9, color=WHITE),
    body_card_text("2026关键变化", 9.1, 3.2, 3.5, 0.8, size=13, bold=True, color=RED),
    body_card_text("负电价正式化 · 容量电价分化\n新能源全面入市 · 售电盈利模式重构", 9.1, 3.7, 3.5, 0.6, size=9, color=WHITE),
    # Summary
    body_card_text("核心判断：2024-2026是电改从试点到全面铺开的转折窗口。先行省份已形成成熟市场机制，后发省份存在制度性红利。",
                   0.7, 5.0, 11.9, 1.4, size=14, bold=False, color=GOLD_LIGHT),
    page_num(3),
]
slides.append({"background": NAVY, "shapes": s3_shapes, "texts": s3_texts})

# ======== SLIDE 4: 第一梯队（已正式运行）=======
# Table: Province | 转正时间 | 均价 | 核心特征 | 算电价值
t4_header_y = 1.5
t4_row_h = 0.35
t4_cols_x = [0.3, 1.5, 2.6, 4.0, 7.3, 10.2]
t4_cols_w = [1.2, 1.1, 1.4, 3.3, 2.9, 2.7]

tier1_data = [
    ("山西", "2023", "~260", "首批试点，规则V15.0，辅助服务成熟", "储能+VPP可参与"),
    ("广东", "2024.6", "~460", "负荷最大，电价最高，VPP首单落地", "VPP/需求响应大"),
    ("山东", "2024.6", "~350", "新能源渗透高，储能补偿退坡", "新能源+储能套利"),
    ("甘肃", "2024.9", "~145", "新能源占比最高，电价全国最低", "算电协同首选地"),
    ("蒙西", "2025.2", "~240", "首个非试点转正，数据中心集群", "最优布局地"),
    ("湖北", "2025.6", "~300", "中部电力枢纽", "区位价值中等"),
    ("浙江", "2025底", "~350", "高负荷，高电价", "算力需求大"),
]

s4_shapes = [gold_line()]
s4_texts_start = [
    title_text("第一梯队 | 已正式运行（7省）"),
    subtitle_text("市场机制成熟，可做布局参考"),
]
# Header bg
s4_shapes.append({"type": "rect", "x": 0.3, "y": t4_header_y, "w": 12.7, "h": 0.38, "fill": GOLD})
# Rows
for i, (prov, time, price, feature, value) in enumerate(tier1_data):
    y = t4_header_y + 0.38 + i * t4_row_h
    fill = DARK_CARD if i % 2 == 0 else CARD_BG
    s4_shapes.append({"type": "rect", "x": 0.3, "y": y, "w": 12.7, "h": t4_row_h, "fill": fill})

s4_texts = s4_texts_start + [
    page_num(4),
    # Header texts
    body_text("省份", t4_cols_x[0], t4_header_y+0.02, t4_cols_w[0], 0.34, size=11, bold=True, color=NAVY),
    body_text("转正", t4_cols_x[1], t4_header_y+0.02, t4_cols_w[1], 0.34, size=11, bold=True, color=NAVY),
    body_text("均价", t4_cols_x[2], t4_header_y+0.02, t4_cols_w[2], 0.34, size=11, bold=True, color=NAVY),
    body_text("核心特征", t4_cols_x[3], t4_header_y+0.02, t4_cols_w[3], 0.34, size=11, bold=True, color=NAVY),
    body_text("算电协同价值", t4_cols_x[4], t4_header_y+0.02, t4_cols_w[4], 0.34, size=11, bold=True, color=NAVY),
]
# Row data
for i, (prov, time, price, feature, value) in enumerate(tier1_data):
    y = t4_header_y + 0.38 + i * t4_row_h
    prov_color = GOLD if prov in ("蒙西","甘肃") else WHITE
    s4_texts.append(body_text(prov, t4_cols_x[0], y+0.02, t4_cols_w[0], 0.3, size=10, bold=True, color=prov_color))
    s4_texts.append(body_text(time, t4_cols_x[1], y+0.02, t4_cols_w[1], 0.3, size=9, color=WHITE))
    s4_texts.append(body_text(price, t4_cols_x[2], y+0.02, t4_cols_w[2], 0.3, size=9, color=GOLD_LIGHT))
    s4_texts.append(body_text(feature, t4_cols_x[3], y+0.02, t4_cols_w[3], 0.3, size=9, color=WHITE))
    s4_texts.append(body_text(value, t4_cols_x[4], y+0.02, t4_cols_w[4], 0.3, size=9, color=GOLD_LIGHT if "首" in value or "最优" in value else WHITE))

slides.append({"background": NAVY, "shapes": s4_shapes, "texts": s4_texts})

# ======== SLIDE 5: 第二/三/四梯队 ========
t5_header_y = 1.5
t5_row_h = 0.34
t5_cols_x = [0.3, 1.5, 2.6, 4.3, 9.5]
t5_cols_w = [1.2, 1.1, 1.7, 5.2, 2.8]

tier2_data = [
    ("安徽", "连续试运行", "2026.6", "~250", "规则仍在磨合，市场力干预"),
    ("陕西", "连续试运行", "2026.6", "~150", "地板价常态化，30-70元/MWh"),
    ("辽宁", "2025.3启动", "2026", "~200", "引入负电价-100元/MWh"),
    ("河北南网", "2025.3启动", "2026", "待补充", "承接北京外溢算力"),
    ("南方区域", "2025.6启动", "2026Q4", "---", "首个跨省区域市场"),
]
tier3_names = "福建 | 四川 | 江苏 | 湖南 | 河南 | 宁夏 | 重庆 | 上海 | 吉林"
tier4_names = "江西 | 黑龙江 | 新疆 | 蒙东 | 青海"

s5_shapes = [
    gold_line(),
    # Tier 2 header
    {"type": "rect", "x": 0.3, "y": t5_header_y, "w": 12.7, "h": 0.36, "fill": GOLD},
]
for i in range(len(tier2_data)):
    y = t5_header_y + 0.36 + i * t5_row_h
    fill = DARK_CARD if i % 2 == 0 else CARD_BG
    s5_shapes.append({"type": "rect", "x": 0.3, "y": y, "w": 12.7, "h": t5_row_h, "fill": fill})
# Tier 3 card
s5_shapes.append(accent_card(0.3, 3.5, 6.2, 1.6, DARK_CARD))
s5_shapes.append({"type": "rect", "x": 0.3, "y": 3.5, "w": 0.06, "h": 1.6, "fill": GOLD})
# Tier 4 card
s5_shapes.append(accent_card(6.8, 3.5, 6.2, 1.6, DARK_CARD))
s5_shapes.append({"type": "rect", "x": 6.8, "y": 3.5, "w": 0.06, "h": 1.6, "fill": RED})
# Insight box
s5_shapes.append(accent_card(0.3, 5.5, 12.7, 1.3, CARD_BG))

s5_texts = [
    title_text("第二/三/四梯队 | 建设中与待启动"),
    subtitle_text("进度差3-5年，选对省份等于选对赛道"),
    page_num(5),
    body_text("省份", t5_cols_x[0], t5_header_y+0.02, t5_cols_w[0], 0.32, size=10, bold=True, color=NAVY),
    body_text("状态", t5_cols_x[1], t5_header_y+0.02, t5_cols_w[1], 0.32, size=10, bold=True, color=NAVY),
    body_text("预计转正", t5_cols_x[2], t5_header_y+0.02, t5_cols_w[2], 0.32, size=10, bold=True, color=NAVY),
    body_text("关键观察", t5_cols_x[3], t5_header_y+0.02, t5_cols_w[3], 0.32, size=10, bold=True, color=NAVY),
]
for i, (prov, status, exp, price, obs) in enumerate(tier2_data):
    y = t5_header_y + 0.36 + i * t5_row_h
    s5_texts.append(body_text(prov, t5_cols_x[0], y+0.02, t5_cols_w[0], 0.3, size=9, bold=True, color=WHITE))
    s5_texts.append(body_text(status, t5_cols_x[1], y+0.02, t5_cols_w[1], 0.3, size=8, color=WHITE))
    s5_texts.append(body_text(exp, t5_cols_x[2], y+0.02, t5_cols_w[2], 0.3, size=8, color=GOLD_LIGHT))
    s5_texts.append(body_text(obs, t5_cols_x[3], y+0.02, t5_cols_w[3], 0.3, size=8, color=WHITE))

s5_texts += [
    body_card_text("第三梯队：长周期试运行（9省）", 0.3, 3.5, 6.2, 0.4, size=13, bold=True, color=GOLD),
    body_card_text(tier3_names, 0.3, 3.9, 6.2, 0.5, size=11, color=WHITE),
    body_card_text("关键观察：江苏电价高但未转正；四川季节性波动巨大",
                   0.3, 4.4, 6.2, 0.5, size=10, color=GOLD_LIGHT),

    body_card_text("第四梯队：短周期试运行或未启动（5省）", 6.8, 3.5, 6.2, 0.4, size=13, bold=True, color=RED),
    body_card_text(tier4_names, 6.8, 3.9, 6.2, 0.5, size=11, color=WHITE),
    body_card_text("关键观察：黑龙江是典型\"电改落后省\"，\n但电价极低，未来转正存在制度性红利",
                   6.8, 4.4, 6.2, 0.5, size=10, color=GOLD_LIGHT),

    body_card_text("核心结论：进度分化=选址梯度。先行省份（蒙西/甘肃/山西）有成熟市场，后发省份（陕西/辽宁）有转正红利。",
                   0.3, 5.5, 12.7, 1.1, size=14, bold=False, color=WHITE),
]
slides.append({"background": NAVY, "shapes": s5_shapes, "texts": s5_texts})

# ======== SLIDE 6: 最新电价分化态势 ========
t6_header_y = 1.5
t6_row_h = 0.33
t6_cols = [0.3, 1.4, 2.5, 3.6, 4.7, 5.8, 6.9, 8.1, 12.0]
t6_cols_w = [1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1.2, 3.9, 0]

price_data = [
    ("广东", "135", "477", "128", "536", "~460元", "峰谷差极大，实时波动剧烈"),
    ("山西", "205", "318", "191", "334", "~260元", "相对平稳，市场成熟"),
    ("山东", "303", "460", "235", "436", "~350元", "新能源出力日波动大"),
    ("蒙西", "188", "276", "188", "276", "~240元", "发电侧低，用户侧加权高"),
    ("陕西", "66", "313", "82", "303", "~150元", "地板价频现，西北特征"),
    ("辽宁", "112", "324", "106", "357", "~200元", "负电价常态化"),
    ("江苏", "325", "369", "333", "380", "~350元", "高且稳定"),
    ("安徽", "177", "298", "155", "315", "~250元", "市场力干预后趋稳"),
]

s6_shapes = [
    gold_line(),
    {"type": "rect", "x": 0.3, "y": t6_header_y, "w": 12.7, "h": 0.36, "fill": GOLD},
]
for i in range(len(price_data)):
    y = t6_header_y + 0.36 + i * t6_row_h
    fill = DARK_CARD if i % 2 == 0 else CARD_BG
    s6_shapes.append({"type": "rect", "x": 0.3, "y": y, "w": 12.7, "h": t6_row_h, "fill": fill})

s6_texts = [
    title_text("最新电价分化态势 | 2026年6月第3周"),
    subtitle_text("八省现货市场价格数据（元/MWh）"),
    page_num(6),
    body_text("省份", 0.3, t6_header_y+0.02, 1.1, 0.32, 10, True, NAVY),
    body_text("日前最低", 1.4, t6_header_y+0.02, 1.1, 0.32, 10, True, NAVY),
    body_text("日前最高", 2.5, t6_header_y+0.02, 1.1, 0.32, 10, True, NAVY),
    body_text("实时最低", 3.6, t6_header_y+0.02, 1.1, 0.32, 10, True, NAVY),
    body_text("实时最高", 4.7, t6_header_y+0.02, 1.1, 0.32, 10, True, NAVY),
    body_text("平均中枢", 5.8, t6_header_y+0.02, 1.1, 0.32, 10, True, NAVY),
    body_text("波动特征", 6.9, t6_header_y+0.02, 5.5, 0.32, 10, True, NAVY),
]
for i, (prov, dmin, dmax, rmin, rmax, avg, feat) in enumerate(price_data):
    y = t6_header_y + 0.36 + i * t6_row_h
    prov_col = GOLD if prov in ("蒙西","甘肃","陕西") else RED if prov in ("广东","江苏") else WHITE
    s6_texts.append(body_text(prov, 0.3, y+0.02, 1.1, 0.29, 9, True, prov_col))
    s6_texts.append(body_text(dmin, 1.4, y+0.02, 1.1, 0.29, 9, False, WHITE))
    s6_texts.append(body_text(dmax, 2.5, y+0.02, 1.1, 0.29, 9, False, WHITE))
    s6_texts.append(body_text(rmin, 3.6, y+0.02, 1.1, 0.29, 9, False, WHITE))
    s6_texts.append(body_text(rmax, 4.7, y+0.02, 1.1, 0.29, 9, False, WHITE))
    s6_texts.append(body_text(avg, 5.8, y+0.02, 1.1, 0.29, 9, True, GOLD_LIGHT))
    s6_texts.append(body_text(feat, 6.9, y+0.02, 5.5, 0.29, 8, False, WHITE))

slides.append({"background": NAVY, "shapes": s6_shapes, "texts": s6_texts})

# ======== SLIDE 7: 电价核心结论 ========
s7_shapes = [
    gold_line(),
    accent_card(0.7, 1.8, 5.8, 2.0, DARK_CARD),
    {"type": "rect", "x": 0.7, "y": 1.8, "w": 0.06, "h": 2.0, "fill": GOLD},
    accent_card(6.8, 1.8, 5.8, 2.0, DARK_CARD),
    {"type": "rect", "x": 6.8, "y": 1.8, "w": 0.06, "h": 2.0, "fill": GOLD},
    accent_card(0.7, 4.2, 11.9, 2.2, DARK_CARD),
    {"type": "rect", "x": 0.7, "y": 4.2, "w": 0.06, "h": 2.2, "fill": RED},
]

s7_texts = [
    title_text("电价分化核心结论", 0.5, 28, GOLD, True),
    subtitle_text("地理套利 + 时点套利 = 算电协同超额收益来源", 1.15),
    page_num(7),
    body_card_text("结论一：电价梯度 = 选址梯度", 0.7, 1.8, 5.8, 0.5, 16, True, GOLD),
    body_card_text("蒙西/陕西/辽宁低价区 → 算电协同首选\n"
                   "广东/江苏高价区 → VPP/需求响应价值大\n"
                   "电价水平直接决定数据中心运营成本",
                   0.7, 2.3, 5.8, 1.3, 13, False, WHITE),
    body_card_text("结论二：地理套利空间巨大", 6.8, 1.8, 5.8, 0.5, 16, True, GOLD),
    body_card_text("蒙西用户侧均价 ~240 元/MWh\n"
                   "广东用户侧均价 ~460 元/MWh\n"
                   "价差近 1 倍 → 年省电费数亿元",
                   6.8, 2.3, 5.8, 1.3, 13, False, WHITE),
    body_card_text("结论三：时点套利空间存在", 0.7, 4.2, 11.9, 0.5, 16, True, RED),
    body_card_text("陕西日前最低66元 vs 最高313元 = 日内价差4.7倍\n"
                   "辽宁引入负电价（-100元/MWh）后，峰谷价差进一步拉大\n"
                   "储能/柔性负荷可通过时点套利获取超额收益",
                   0.7, 4.7, 11.9, 1.3, 13, False, WHITE),
]
slides.append({"background": NAVY, "shapes": s7_shapes, "texts": s7_texts})

# ======== SLIDE 8: 2026电改规则变化 ========
s8_shapes = [
    gold_line(),
    accent_card(0.3, 1.5, 6.2, 2.5, DARK_CARD),
    {"type": "rect", "x": 0.3, "y": 1.5, "w": 0.06, "h": 2.5, "fill": RED},
    accent_card(6.8, 1.5, 6.2, 2.5, CARD_BG),
    {"type": "rect", "x": 6.8, "y": 1.5, "w": 0.06, "h": 2.5, "fill": GOLD},
    accent_card(0.3, 4.3, 6.2, 2.5, CARD_BG),
    {"type": "rect", "x": 0.3, "y": 4.3, "w": 0.06, "h": 2.5, "fill": GOLD},
    accent_card(6.8, 4.3, 6.2, 2.5, DARK_CARD),
    {"type": "rect", "x": 6.8, "y": 4.3, "w": 0.06, "h": 2.5, "fill": RED},
]
s8_texts = [
    title_text("2026年电改关键变化 | 规则篇", 0.5, 28, GOLD, True),
    subtitle_text("四大结构性变革重塑电力市场格局", 1.15),
    page_num(8),
    body_card_text("1. 负电价正式化", 0.3, 1.5, 6.2, 0.5, 15, True, RED),
    body_card_text("辽宁2026年引入-100元/MWh价格下限\n"
                   "新能源大省可能跟进\n"
                   "储能/柔性负荷价值凸显",
                   0.3, 2.0, 6.2, 1.8, 12, False, WHITE),
    body_card_text("2. 容量电价分化", 6.8, 1.5, 6.2, 0.5, 15, True, GOLD),
    body_card_text("广东气电容量电价涨164%-296%\n"
                   "煤电涨65%\n"
                   "独立储能容量补偿持续退坡",
                   6.8, 2.0, 6.2, 1.8, 12, False, WHITE),
    body_card_text("3. 新能源全面入市", 0.3, 4.3, 6.2, 0.5, 15, True, GOLD),
    body_card_text("136号文：存量集中式新能源30-50%电量入市\n"
                   "分布式光伏逐步全量入市\n"
                   "绿电交易规模有望爆发式增长",
                   0.3, 4.8, 6.2, 1.8, 12, False, WHITE),
    body_card_text("4. 售电盈利模式重构", 6.8, 4.3, 6.2, 0.5, 15, True, RED),
    body_card_text("广东取消浮动费用，批零价差基本消失\n"
                   "售电从\"价差套利\"转向\"服务增值\"\n"
                   "第三方服务商（AI报价/VPP）机会出现",
                   6.8, 4.8, 6.2, 1.8, 12, False, WHITE),
]
slides.append({"background": NAVY, "shapes": s8_shapes, "texts": s8_texts})

# ======== SLIDE 9: 2026市场行为变化 ========
s9_shapes = [
    gold_line(),
    accent_card(0.3, 1.5, 4.0, 4.0, DARK_CARD),
    accent_card(4.6, 1.5, 4.0, 4.0, CARD_BG),
    accent_card(8.9, 1.5, 4.0, 4.0, DARK_CARD),
]
s9_texts = [
    title_text("2026年电改关键变化 | 市场行为篇", 0.5, 28, GOLD, True),
    subtitle_text("发电策略转变 + 监管强化 + 跨省交易常态化", 1.15),
    page_num(9),
    body_card_text("发电企业报价策略转变", 0.3, 1.5, 4.0, 0.5, 15, True, GOLD),
    body_card_text("新年度中长期合约持仓比例调整\n"
                   "多地1月1日电价跳涨20%-289%\n"
                   "现货市场交易频次增加\n"
                   "→ AI报价策略需求爆发",
                   0.3, 2.0, 4.0, 3.3, 12, False, WHITE),
    body_card_text("市场力监管加强", 4.6, 1.5, 4.0, 0.5, 15, True, GOLD),
    body_card_text("安徽/湖北多次触发市场力缓解机制\n"
                   "监管干预后电价曲线异常平稳\n"
                   "规则版本迭代加速\n"
                   "→ 交易合规成本上升",
                   4.6, 2.0, 4.0, 3.3, 12, False, WHITE),
    body_card_text("跨省交易常态化", 8.9, 1.5, 4.0, 0.5, 15, True, RED),
    body_card_text("西北/华中短期互济品种启动\n"
                   "南方区域市场Q4启动\n"
                   "省间壁垒逐渐打破\n"
                   "→ 跨省套利机会增加",
                   8.9, 2.0, 4.0, 3.3, 12, False, WHITE),
]
slides.append({"background": NAVY, "shapes": s9_shapes, "texts": s9_texts})

# ======== SLIDE 10: 投资选址决策矩阵 ========
t10_header_y = 1.5
t10_row_h = 0.46
t10_cols = [0.3, 2.4, 3.8, 5.2, 8.0, 10.5]
t10_cols_w = [2.1, 1.4, 1.4, 2.8, 2.5, 2.3]

matrix_data = [
    ("蒙西", "★★★★★", "低", "数据中心绿电直供", "P0 首选", GOLD),
    ("甘肃", "★★★★★", "极低", "算力西部枢纽", "P0", GOLD),
    ("山西", "★★★★★", "中低", "辅助服务+储能", "P1", WHITE),
    ("陕西", "★★★★", "低", "绿电直供（转正中）", "P1", WHITE),
    ("广东", "★★★★★", "高", "VPP/需求响应", "P1*", WHITE),
    ("辽宁", "★★★★", "中低", "绿电+储能组合", "P2", WHITE),
    ("江苏", "★★★", "高", "需等转正", "P3", WHITE),
]

s10_shapes = [
    gold_line(),
    {"type": "rect", "x": 0.3, "y": t10_header_y, "w": 12.7, "h": 0.40, "fill": GOLD},
]
for i in range(len(matrix_data)):
    y = t10_header_y + 0.40 + i * t10_row_h
    fill = DARK_CARD if i % 2 == 0 else CARD_BG
    s10_shapes.append({"type": "rect", "x": 0.3, "y": y, "w": 12.7, "h": t10_row_h, "fill": fill})

s10_texts = [
    title_text("投资选址决策矩阵"),
    subtitle_text("电改成熟度 × 电价水平 × 算电协同适合角色"),
    page_num(10),
    body_text("省域", 0.3, t10_header_y+0.03, 2.1, 0.35, 11, True, NAVY),
    body_text("电改成熟度", 2.4, t10_header_y+0.03, 1.4, 0.35, 11, True, NAVY),
    body_text("电价水平", 3.8, t10_header_y+0.03, 1.4, 0.35, 11, True, NAVY),
    body_text("算电协同适合角色", 5.2, t10_header_y+0.03, 2.8, 0.35, 11, True, NAVY),
    body_text("推荐优先级", 8.0, t10_header_y+0.03, 2.5, 0.35, 11, True, NAVY),
]
for i, (prov, maturity, price, role, priority, pcolor) in enumerate(matrix_data):
    y = t10_header_y + 0.40 + i * t10_row_h
    s10_texts.append(body_text(prov, 0.3, y+0.05, 2.1, 0.36, 11, True, GOLD if prov in ("蒙西","甘肃") else WHITE))
    s10_texts.append(body_text(maturity, 2.4, y+0.05, 1.4, 0.36, 11, False, GOLD_LIGHT))
    s10_texts.append(body_text(price, 3.8, y+0.05, 1.4, 0.36, 11, False, WHITE))
    s10_texts.append(body_text(role, 5.2, y+0.05, 2.8, 0.36, 10, False, WHITE))
    s10_texts.append(body_text(priority, 8.0, y+0.05, 2.5, 0.36, 11, True, pcolor))

slides.append({"background": NAVY, "shapes": s10_shapes, "texts": s10_texts})

# ======== SLIDE 11: 推荐排序详解 ========
s11_shapes = [
    gold_line(),
    # P0 box
    {"type": "rect", "x": 0.3, "y": 1.5, "w": 0.08, "h": 1.6, "fill": GOLD},
    accent_card(0.38, 1.5, 6.2, 1.6, DARK_CARD),
    {"type": "rect", "x": 6.78, "y": 1.5, "w": 0.08, "h": 1.6, "fill": GOLD},
    accent_card(6.86, 1.5, 6.2, 1.6, DARK_CARD),
    # P1 box
    {"type": "rect", "x": 0.3, "y": 3.4, "w": 0.08, "h": 1.6, "fill": GOLD_LIGHT},
    accent_card(0.38, 3.4, 6.2, 1.6, CARD_BG),
    {"type": "rect", "x": 6.78, "y": 3.4, "w": 0.08, "h": 1.6, "fill": GOLD_LIGHT},
    accent_card(6.86, 3.4, 6.2, 1.6, CARD_BG),
    # P2-P3 box
    {"type": "rect", "x": 0.3, "y": 5.3, "w": 0.08, "h": 1.3, "fill": RED},
    accent_card(0.38, 5.3, 6.2, 1.3, CARD_BG),
    {"type": "rect", "x": 6.78, "y": 5.3, "w": 0.08, "h": 1.3, "fill": RED},
    accent_card(6.86, 5.3, 6.2, 1.3, CARD_BG),
]
s11_texts = [
    title_text("选址推荐排序详解", 0.5, 28, GOLD, True),
    subtitle_text("P0 > P1 > P2 > P3 — 分梯度投资策略", 1.15),
    page_num(11),
    # P0
    body_card_text("P0 首选：蒙西 · 甘肃", 0.38, 1.5, 6.2, 0.4, 15, True, GOLD),
    body_card_text("蒙西：现货均价240元/MWh，内蒙古数据中心集群，绿电直连政策（688号文）已发布\n"
                   "甘肃：现货均价145元/MWh（全国最低之一），新能源占比最高，绿电成本确定性优势",
                   0.38, 1.9, 6.2, 1.1, 12, False, WHITE),
    body_card_text("P0 首选：整体评估", 6.86, 1.5, 6.2, 0.4, 15, True, GOLD),
    body_card_text("这两个地区具备\"低电价+政策支持+产业集聚\"三重叠加效应\n"
                   "数据中心可节省50%+电力成本",
                   6.86, 1.9, 6.2, 1.1, 12, False, WHITE),
    # P1
    body_card_text("P1：山西 · 陕西 · 广东", 0.38, 3.4, 6.2, 0.4, 15, True, GOLD_LIGHT),
    body_card_text("山西：辅助服务市场成熟，储能+数据中心VPP可参与\n"
                   "陕西：即将转正，地板价常态化，有转正制度红利\n"
                   "广东：VPP首单落地，电价高但负荷侧价值大",
                   0.38, 3.8, 6.2, 1.1, 12, False, WHITE),
    body_card_text("P1：差异化策略", 6.86, 3.4, 6.2, 0.4, 15, True, GOLD_LIGHT),
    body_card_text("不同省份需要不同进入策略：\n"
                   "山西→辅助服务 / 陕西→绿电直供 / 广东→VPP聚合",
                   6.86, 3.8, 6.2, 1.1, 12, False, WHITE),
    # P2-P3
    body_card_text("P2-P3：辽宁 · 江苏 · 其他", 0.38, 5.3, 6.2, 0.4, 15, True, RED),
    body_card_text("辽宁：负电价机制带来储能套利窗口，但市场仍在建设中\n"
                   "江苏：电价高且稳定，但尚未转正，需等待",
                   0.38, 5.7, 6.2, 0.8, 12, False, WHITE),
    body_card_text("P2-P3：观察等待", 6.86, 5.3, 6.2, 0.4, 15, True, RED),
    body_card_text("新进入者可先布局P0-P1区域\n"
                   "P2-P3区域保持跟踪，等待转正信号",
                   6.86, 5.7, 6.2, 0.8, 12, False, WHITE),
]
slides.append({"background": NAVY, "shapes": s11_shapes, "texts": s11_texts})

# ======== SLIDE 12: 算电协同投资主题 ========
s12_shapes = [
    gold_line(),
    # Four theme cards
    accent_card(0.3, 1.5, 6.2, 2.5, DARK_CARD),
    {"type": "rect", "x": 0.3, "y": 1.5, "w": 0.06, "h": 2.5, "fill": GOLD},
    accent_card(6.8, 1.5, 6.2, 2.5, DARK_CARD),
    {"type": "rect", "x": 6.8, "y": 1.5, "w": 0.06, "h": 2.5, "fill": GOLD},
    accent_card(0.3, 4.3, 6.2, 2.5, CARD_BG),
    {"type": "rect", "x": 0.3, "y": 4.3, "w": 0.06, "h": 2.5, "fill": RED},
    accent_card(6.8, 4.3, 6.2, 2.5, CARD_BG),
    {"type": "rect", "x": 6.8, "y": 4.3, "w": 0.06, "h": 2.5, "fill": RED},
]
s12_texts = [
    title_text("对算电协同赛道的含义 | 投资主题", 0.5, 28, GOLD, True),
    subtitle_text("四大投资主题过滤", 1.15),
    page_num(12),
    body_card_text("电力交易AI / 软件", 0.3, 1.5, 6.2, 0.5, 15, True, GOLD),
    body_card_text("现货市场扩容 → 交易频次增加 → AI报价策略需求爆发\n"
                   "参考标的：国能日新、清大科越模式\n"
                   "电改进度越快的省份，采购需求越迫切",
                   0.3, 2.0, 6.2, 1.8, 12, False, WHITE),
    body_card_text("虚拟电厂聚合商", 6.8, 1.5, 6.2, 0.5, 15, True, GOLD),
    body_card_text("广东33MW已入市，VPP模式跑通\n"
                   "电改进度越快 → 市场机制越开放 → VPP价值越大\n"
                   "需要关注各省VPP注册准入门槛",
                   6.8, 2.0, 6.2, 1.8, 12, False, WHITE),
    body_card_text("绿电直供项目", 0.3, 4.3, 6.2, 0.5, 15, True, RED),
    body_card_text("688号文已发布\n"
                   "内蒙古明确支持数据中心负荷绿电直连\n"
                   "核心变量：过网费定价机制",
                   0.3, 4.8, 6.2, 1.8, 12, False, WHITE),
    body_card_text("储能套利", 6.8, 4.3, 6.2, 0.5, 15, True, RED),
    body_card_text("现货市场价格波动加剧 → 储能套利空间扩大\n"
                   "山西已跑通模式，其余省份跟进中\n"
                   "负电价机制是最强催化剂",
                   6.8, 4.8, 6.2, 1.8, 12, False, WHITE),
]
slides.append({"background": NAVY, "shapes": s12_shapes, "texts": s12_texts})

# ======== SLIDE 13: 算电协同投资逻辑纵深 ========
s13_shapes = [
    gold_line(),
    # Left: logic chain
    {"type": "rounded_rect", "x": 0.3, "y": 1.5, "w": 7.5, "h": 4.8, "fill": DARK_CARD},
    # Arrow shapes
    {"type": "down_arrow", "x": 3.2, "y": 2.0, "w": 0.5, "h": 0.4, "fill": GOLD},
    {"type": "down_arrow", "x": 3.2, "y": 3.2, "w": 0.5, "h": 0.4, "fill": GOLD},
    {"type": "down_arrow", "x": 3.2, "y": 4.4, "w": 0.5, "h": 0.4, "fill": GOLD},
    # Right: conclusion
    {"type": "rounded_rect", "x": 8.1, "y": 1.5, "w": 4.9, "h": 4.8, "fill": CARD_BG},
    {"type": "rect", "x": 8.1, "y": 1.5, "w": 0.06, "h": 4.8, "fill": GOLD},
]
s13_texts = [
    title_text("算电协同：投资逻辑纵深", 0.5, 28, GOLD, True),
    subtitle_text("从进度地图到投资结论的逻辑链", 1.15),
    page_num(13),
    body_card_text("Step 1：识别进度差距", 0.5, 1.6, 7.0, 0.4, 14, True, GOLD),
    body_card_text("电改2.0各省进度差3-5年 → 先行省份已形成市场化电价机制\n"
                   "后发省份存在制度性红利",
                   0.5, 2.05, 7.0, 0.6, 12, False, WHITE),
    body_card_text("Step 2：定位电价梯度", 0.5, 2.8, 7.0, 0.4, 14, True, GOLD),
    body_card_text("蒙西240 vs 广东460 → 地理套利空间1倍\n"
                   "陕西日内价差4.7倍 → 时点套利空间",
                   0.5, 3.25, 7.0, 0.6, 12, False, WHITE),
    body_card_text("Step 3：匹配投资主题", 0.5, 4.0, 7.0, 0.4, 14, True, GOLD),
    body_card_text("低电价区 → 绿电直供、数据中心投资\n"
                   "高电价区 → VPP聚合、需求响应、储能",
                   0.5, 4.45, 7.0, 0.6, 12, False, WHITE),
    body_card_text("Step 4：执行选址决策", 0.5, 5.2, 7.0, 0.4, 14, True, GOLD),
    body_card_text("P0（蒙西/甘肃）即刻布局\nP1（山西/陕西/广东）差异化进入\nP2-P3观望待机",
                   0.5, 5.65, 7.0, 0.6, 12, False, WHITE),
    # Right side
    body_card_text("核心投资结论", 8.1, 1.6, 4.9, 0.5, 16, True, GOLD),
    body_card_text("电改2.0是算电协同赛道的\n"
                   "最重要基础设施变量。\n\n"
                   "选对省份 = 选对赛道。\n\n"
                   "蒙西和甘肃是目前最佳\n"
                   "布局区域。",
                   8.1, 2.2, 4.9, 3.8, 14, False, WHITE),
]
slides.append({"background": NAVY, "shapes": s13_shapes, "texts": s13_texts})

# ======== SLIDE 14: 关键风险因素 ========
s14_shapes = [
    gold_line(),
    accent_card(0.3, 1.5, 6.2, 1.8, DARK_CARD),
    {"type": "rect", "x": 0.3, "y": 1.5, "w": 0.06, "h": 1.8, "fill": RED},
    accent_card(6.8, 1.5, 6.2, 1.8, DARK_CARD),
    {"type": "rect", "x": 6.8, "y": 1.5, "w": 0.06, "h": 1.8, "fill": RED},
    accent_card(0.3, 3.6, 6.2, 1.8, CARD_BG),
    {"type": "rect", "x": 0.3, "y": 3.6, "w": 0.06, "h": 1.8, "fill": GOLD},
    accent_card(6.8, 3.6, 6.2, 1.8, CARD_BG),
    {"type": "rect", "x": 6.8, "y": 3.6, "w": 0.06, "h": 1.8, "fill": GOLD},
]
s14_texts = [
    title_text("关键风险因素", 0.5, 28, GOLD, True),
    subtitle_text("投资前需持续跟踪的核心风险", 1.15),
    page_num(14),
    body_card_text("政策风险", 0.3, 1.5, 6.2, 0.4, 15, True, RED),
    body_card_text("省间壁垒：各省规则差异大，实际落地仍有地方保护\n"
                   "容量电价政策尚未全国统一",
                   0.3, 1.9, 6.2, 1.2, 12, False, WHITE),
    body_card_text("市场风险", 6.8, 1.5, 6.2, 0.4, 15, True, RED),
    body_card_text("输电通道占用费未明确\n"
                   "部分省份新能源入市补贴退坡节奏不确定",
                   6.8, 1.9, 6.2, 1.2, 12, False, WHITE),
    body_card_text("执行风险", 0.3, 3.6, 6.2, 0.4, 15, True, GOLD),
    body_card_text("各省VPP注册流程和准入门槛差异大\n"
                   "第三方聚合商开放程度参差不齐\n"
                   "市场力干预可能扭曲价格信号",
                   0.3, 4.0, 6.2, 1.2, 12, False, WHITE),
    body_card_text("技术风险", 6.8, 3.6, 6.2, 0.4, 15, True, GOLD),
    body_card_text("绿电直连过网费定价不确定\n"
                   "储能+数据中心VPP技术集成复杂度\n"
                   "跨省交易结算机制仍需验证",
                   6.8, 4.0, 6.2, 1.2, 12, False, WHITE),
]
slides.append({"background": NAVY, "shapes": s14_shapes, "texts": s14_texts})

# ======== SLIDE 15: 待验证问题 ========
s15_shapes = [
    gold_line(),
    accent_card(0.3, 1.5, 12.7, 4.5, DARK_CARD),
]
s15_texts = [
    title_text("下一步需要验证的问题", 0.5, 28, GOLD, True),
    subtitle_text("Due Diligence 优先事项", 1.15),
    page_num(15),
    body_card_text("1. 成本验证：蒙西/甘肃数据中心实际绿电采购成本 vs 大工业目录电价 vs 现货均价",
                   0.3, 1.5, 12.7, 0.5, 14, True, GOLD),
    body_card_text("到底能省多少？需要拿到当地大工业目录电价和中长期合约数据做对比分析",
                   0.3, 2.0, 12.7, 0.4, 12, False, WHITE),
    body_card_text("2. 准入门槛：各省VPP注册流程和准入门槛差异 —— 哪些省真正对第三方聚合商开放？",
                   0.3, 2.7, 12.7, 0.5, 14, True, GOLD),
    body_card_text("广东已开放但门槛高，需要逐省调研市场化交易准入条件和注册成本",
                   0.3, 3.2, 12.7, 0.4, 12, False, WHITE),
    body_card_text("3. 政策细则：内蒙古\"数据中心负荷绿电直连\"政策执行细则 —— 过网费怎么算？",
                   0.3, 3.9, 12.7, 0.5, 14, True, GOLD),
    body_card_text("688号文已发布但关键细节待明确，直接影响项目经济性测算",
                   0.3, 4.4, 12.7, 0.4, 12, False, WHITE),
    body_card_text("4. 实时数据源：能否用 China Energy MCP 自动拉取各省电价数据？",
                   0.3, 5.1, 12.7, 0.5, 14, True, GOLD),
    body_card_text("建立实时进度地图监控，是持续跟踪投资机会的基础设施",
                   0.3, 5.6, 12.7, 0.4, 12, False, WHITE),
]
slides.append({"background": NAVY, "shapes": s15_shapes, "texts": s15_texts})

# ======== SLIDE 16: 附录 ========
s16_shapes = [
    gold_line(),
    accent_card(0.3, 1.5, 6.2, 4.5, DARK_CARD),
    {"type": "rect", "x": 0.3, "y": 1.5, "w": 0.06, "h": 4.5, "fill": GOLD},
    accent_card(6.8, 1.5, 6.2, 4.5, DARK_CARD),
    {"type": "rect", "x": 6.8, "y": 1.5, "w": 0.06, "h": 4.5, "fill": GOLD},
]
s16_texts = [
    title_text("附录：数据来源"),
    subtitle_text("本报告数据基于以下公开信息源"),
    page_num(16),
    body_card_text("电力市场数据", 0.3, 1.5, 6.2, 0.4, 15, True, GOLD),
    body_card_text("北极星电力市场网：2026年6月第3周\n（6.15-6.21）八个地区现货价格周报\n\n"
                   "北极星电力市场网：2026年5月\n第1-2周现货价格周报\n\n"
                   "数字储能网：2026开年24省区\n现货价格涨跌观察（2026.1.26）",
                   0.3, 1.9, 6.2, 3.8, 11, False, WHITE),
    body_card_text("政策与研究", 6.8, 1.5, 6.2, 0.4, 15, True, GOLD),
    body_card_text("RMI落基山研究所：\n《2025电力市场化改革与电价体系洞察》\n\n"
                   "广东电力交易中心：\n《广东电力市场2026年交易关键\n机制和参数》（2025.10）\n\n"
                   "知识库已有研究：\n电改2.0落地时间表\n电力新能源赛道文件",
                   6.8, 1.9, 6.2, 3.8, 11, False, WHITE),
]
slides.append({"background": NAVY, "shapes": s16_shapes, "texts": s16_texts})

# ======== SLIDE 17: Thank you ========
s17_shapes = [
    {"type": "rounded_rect", "x": 3.5, "y": 2.5, "w": 6.3, "h": 0.03, "fill": GOLD},
]
s17_texts = [
    {"text": "谢谢", "x": 1.5, "y": 1.5, "w": 10.3, "h": 1.0,
     "fontSize": 40, "bold": True, "color": GOLD, "align": "center", "font": FONT},
    {"text": "Thank You", "x": 1.5, "y": 2.8, "w": 10.3, "h": 0.8,
     "fontSize": 28, "bold": False, "color": WHITE, "align": "center", "font": FONT},
    {"text": "电改2.0：电力市场化进度全景地图", "x": 1.5, "y": 4.0, "w": 10.3, "h": 0.5,
     "fontSize": 14, "bold": False, "color": GOLD_LIGHT, "align": "center", "font": FONT},
    {"text": "数据截至2026年6月24日 · 仅供机构投资者参考", "x": 1.5, "y": 4.8, "w": 10.3, "h": 0.5,
     "fontSize": 11, "bold": False, "color": WHITE, "align": "center", "font": FONT},
    {"text": "17/17", "x": 12.0, "y": 7.05, "w": 1.0, "h": 0.3,
     "fontSize": 9, "bold": False, "color": GOLD, "align": "right", "font": FONT},
]
slides.append({"background": NAVY, "shapes": s17_shapes, "texts": s17_texts})

# ======== WRITE ========
deck = {
    "title": "电改2.0：电力市场化进度全景地图",
    "slides": slides
}

output_path = "/Users/Admin/OpencodeWorkspace/输出/deck_电改2.0.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(deck, f, ensure_ascii=False, indent=2)

print(f"Generated: {output_path}")
print(f"Slides: {len(slides)}")
