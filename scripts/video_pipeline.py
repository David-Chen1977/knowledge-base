#!/usr/bin/env python3
"""
视频生成管线 v2 — 图文知识视频方向

将公众号文章转为"图文+配音"视频，适合视频号/抖音。
画面使用品牌配色+数据图表+金句排版，不依赖AI画面生成。

用法:
    python3 video_pipeline.py --script 文章.md [--output 视频.mp4]
    python3 video_pipeline.py --text "内容" [--title "标题"]

依赖: pip3 install moviepy edge-tts
"""

import os, sys, re, argparse, asyncio, tempfile
from pathlib import Path

FONT = "/System/Library/Fonts/STHeiti Medium.ttc"
BG_DARK = (11, 26, 47)
BG_CARD = (20, 40, 65)
RED = (192, 0, 0)
GOLD = (184, 154, 106)
WHITE = (255, 255, 255)
GRAY = (141, 153, 174)
W, H = 1080, 1920


def parse_args():
    p = argparse.ArgumentParser()
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument("--script", help="文章文件路径")
    g.add_argument("--text", help="直接输入文字")
    p.add_argument("--output", default="知识视频.mp4")
    p.add_argument("--title", help="视频标题")
    return p.parse_args()


async def generate_tts(text, path):
    import edge_tts
    com = edge_tts.Communicate(text, "zh-CN-XiaoxiaoNeural", rate="-5%", pitch="+0Hz")
    await com.save(path)


def parse_and_split(text):
    lines = text.strip().split('\n')
    title = ""
    paras = []
    for l in lines:
        s = l.strip()
        if not s or s.startswith('!['):
            continue
        if s.startswith('# ') and not title:
            title = s[2:].strip()
        elif len(s) > 10:
            paras.append(re.sub(r'\*\*(.+?)\*\*', r'\1', s))
    scenes = []
    for p in paras:
        p = re.sub(r'[*#>`\[\]]', '', p)
        if len(p) <= 50:
            scenes.append(p)
        else:
            parts = re.split(r'[。！？；]', p)
            cur = ""
            for pt in parts:
                pt = pt.strip()
                if not pt:
                    continue
                if len(cur) + len(pt) < 50:
                    cur += pt + "。"
                else:
                    if cur:
                        scenes.append(cur)
                    cur = pt + "。"
            if cur:
                scenes.append(cur)
    return title, scenes


def make_clip(text, duration, font_size=52, color=WHITE, bg=BG_DARK, is_title=False):
    from moviepy import ColorClip, TextClip, CompositeVideoClip
    bg_clip = ColorClip(size=(W, H), color=bg).with_duration(duration)
    clips = [bg_clip]

    if is_title:
        bar = ColorClip(size=(80, 6), color=RED).with_duration(duration).with_position((50, 400))
        txt = TextClip(text=text, font=FONT, font_size=font_size, color=color,
                       size=(W-160, None), method="caption", text_align="center"
                       ).with_duration(duration).with_position(("center", 0.45), relative=True)
        clips += [bar, txt]
    else:
        txt = TextClip(text=text, font=FONT, font_size=font_size, color=color,
                       size=(W-160, None), method="caption", text_align="left"
                       ).with_duration(duration).with_position((80, 0.28), relative=True)
        bar = ColorClip(size=(W-160, 2), color=GOLD).with_duration(duration).with_position((80, H-300))
        src = TextClip(text="道雷 · 投资研究", font=FONT, font_size=20, color=GRAY
                       ).with_duration(duration).with_position((80, H-260))
        clips += [txt, bar, src]

    return CompositeVideoClip(clips)


async def main():
    args = parse_args()
    if args.script:
        with open(args.script, "r", encoding="utf-8") as f:
            raw = f.read()
    else:
        raw = args.text

    title, scenes = parse_and_split(raw)
    title = args.title or title or "投资研究"
    full_text = title + "。" + "".join(scenes)
    print(f"📄 {title} | 📝 {len(scenes)}个场景 | {len(full_text)}字")

    print("🎤 生成配音...")
    audio_path = tempfile.mktemp(suffix=".mp3")
    await generate_tts(full_text, audio_path)
    from moviepy import AudioFileClip, concatenate_videoclips
    audio = AudioFileClip(audio_path)
    print(f"  配音 {audio.duration:.0f}秒")

    total_chars = sum(len(s) for s in scenes) or 1
    clips = [make_clip(title, 3.5, 64, WHITE, BG_DARK, True)]
    clips.append(make_clip(f"作者：道雷\n北大光华 · PE/VC投资人", 3, 42, GOLD))

    for s in scenes:
        dur = max(2.5, audio.duration * len(s) / total_chars)
        clips.append(make_clip(s, dur))

    clips.append(make_clip("关注道雷\n获取更多深度研究", 4, 48, GOLD, BG_DARK, True))

    print("📹 合成视频...")
    final = concatenate_videoclips(clips, method="compose").with_audio(audio)
    final.write_videofile(args.output, fps=24, codec="libx264",
                          audio_codec="aac", threads=4, preset="medium", bitrate="4000k")
    os.remove(audio_path)
    print(f"\n✅ {args.output} | {final.duration:.0f}秒 | {len(clips)}个画面")


if __name__ == "__main__":
    asyncio.run(main())
