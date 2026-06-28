#!/usr/bin/env python3
"""Auto-generate WeChat cover image from article title."""

import os
import sys
from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 900, 383  # WeChat cover ratio ~2.35:1
BG_COLOR = (26, 35, 53)   # deep navy
ACCENT_COLOR = (212, 175, 55)  # gold
TEXT_COLOR = (255, 255, 255)
FONT_SIZE = 42
SUBTITLE_FONT_SIZE = 22


def wrap_text(draw, text, font, max_width):
    """Wrap text to fit within max_width."""
    words = text
    lines = []
    current_line = ""
    for char in words:
        test_line = current_line + char
        bbox = draw.textbbox((0, 0), test_line, font=font)
        w = bbox[2] - bbox[0]
        if w <= max_width:
            current_line = test_line
        else:
            lines.append(current_line)
            current_line = char
    if current_line:
        lines.append(current_line)
    return lines


def generate_cover(title: str, output_path: str, subtitle: str = ""):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Try to load a Chinese-capable font
    # macOS: PingFang removed in newer macOS; Songti.ttc available as fallback
    font_paths = [
        "/System/Library/Fonts/Supplemental/Songti.ttc",  # serif (macOS 15+)
        "/System/Library/Fonts/PingFang.ttc",              # sans-serif (older macOS)
        "/System/Library/Fonts/STHeiti Light.ttc",
    ]
    font = None
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                font = ImageFont.truetype(fp, FONT_SIZE)
                break
            except Exception:
                continue
    if font is None:
        font = ImageFont.load_default()

    # Subtitle font
    sub_font = None
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                sub_font = ImageFont.truetype(fp, SUBTITLE_FONT_SIZE)
                break
            except Exception:
                continue
    if sub_font is None:
        sub_font = ImageFont.load_default()

    # Draw title (centered, wrapped)
    max_text_width = WIDTH - 120  # 60px padding each side
    title_lines = wrap_text(draw, title, font, max_text_width)
    total_text_height = len(title_lines) * (FONT_SIZE + 10)

    start_y = (HEIGHT - total_text_height) // 2 - (20 if subtitle else 0)

    for i, line in enumerate(title_lines):
        bbox = draw.textbbox((0, 0), line, font=font)
        line_w = bbox[2] - bbox[0]
        x = (WIDTH - line_w) // 2
        y = start_y + i * (FONT_SIZE + 10)
        draw.text((x, y), line, fill=TEXT_COLOR, font=font)

    # Draw subtitle
    if subtitle:
        bbox = draw.textbbox((0, 0), subtitle, font=sub_font)
        sub_w = bbox[2] - bbox[0]
        sub_x = (WIDTH - sub_w) // 2
        sub_y = start_y + total_text_height + 15
        draw.text((sub_x, sub_y), subtitle, fill=ACCENT_COLOR, font=sub_font)

    # Draw accent line above title
    line_y = start_y - 30
    draw.rectangle([(WIDTH // 2 - 40, line_y), (WIDTH // 2 + 40, line_y + 3)], fill=ACCENT_COLOR)

    img.save(output_path, "PNG")
    return output_path


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: generate_cover.py <title> [output_path] [subtitle]")
        sys.exit(1)

    title = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else "/tmp/cover_generated.png"
    subtitle = sys.argv[3] if len(sys.argv) > 3 else ""

    generate_cover(title, output_path, subtitle)
    print(output_path)
