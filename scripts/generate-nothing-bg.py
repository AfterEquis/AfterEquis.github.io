#!/usr/bin/env python3
"""
Generates an authentic, high-fidelity Nothing OS micro-dot matrix video and GIF.
Features:
- Pitch-black OLED background (#000000).
- Dense 16px micro-dot matrix (80 cols x 45 rows = 3600 physical micro-LED dots).
- Authentic Nothing OS graphic patterns:
  * Harmonic concentric ripple wavefronts.
  * Rotating glyph circular arc tracer.
  * Audio equalizer visualizer array (Nothing Voice Recorder style).
  * Diagonal ambient matrix sweep.
  * Top-left telemetry '[ 0 1 ]' and corner coordinate markers '+'.
  * Iconic Nothing red recording indicator LED with breathing optical bloom.
- Mathematically seamless infinite loop (60fps, 6.0 seconds = 360 frames).
- Outputs:
  * assets/nothing-bg.mp4 (H.264, 60fps, YUV420p)
  * assets/nothing-bg.gif (Optimized palette, smooth dither, ~2MB)
"""

import math
import subprocess
import os
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1280, 720
PITCH = 16
COLS = W // PITCH   # 80
ROWS = H // PITCH   # 45
FPS = 60
DURATION = 6.0
TOTAL_FRAMES = int(FPS * DURATION)  # 360 frames

# 5x3 Dot matrix font
FONT_5x3 = {
    '0': ["###", "#.#", "#.#", "#.#", "###"],
    '1': [".#.", "##.", ".#.", ".#.", "###"],
    '[': ["##.", "#..", "#..", "#..", "##."],
    ']': [".##", "..#", "..#", "..#", ".##"],
    '+': ["...", ".#.", "###", ".#.", "..."],
}

print(f"Preparing Nothing OS dot-matrix generator: {W}x{H}, {COLS}x{ROWS} dots, {TOTAL_FRAMES} frames @ {FPS}fps")

# Precompute grid coordinates
xs = np.arange(COLS) * PITCH + PITCH // 2
ys = np.arange(ROWS) * PITCH + PITCH // 2
gx, gy = np.meshgrid(xs, ys)

c1_x, c1_y = 340.0, 360.0
c2_x, c2_y = 940.0, 340.0
d1 = np.hypot(gx - c1_x, gy - c1_y)
d2 = np.hypot(gx - c2_x, gy - c2_y)
ring_d = np.abs(d1 - 144.0)
angles_c1 = np.arctan2(gy - c1_y, gx - c1_x)
diag_coord = (gx * 0.7 + gy * 0.5) * 0.018

# Telemetry masks
telemetry_mask = np.zeros((ROWS, COLS), dtype=np.float32)

def stamp_char(ch, start_r, start_c, val=0.75):
    if ch in FONT_5x3:
        pattern = FONT_5x3[ch]
        for gr, row_str in enumerate(pattern):
            for gc, char_val in enumerate(row_str):
                if char_val == '#':
                    tr = start_r + gr
                    tc = start_c + gc
                    if 0 <= tr < ROWS and 0 <= tc < COLS:
                        telemetry_mask[tr, tc] = max(telemetry_mask[tr, tc], val)

# Top-left telemetry '[ 0 1 ]'
stamp_char('[', 3, 4, 0.78)
stamp_char('0', 3, 8, 0.78)
stamp_char('1', 3, 12, 0.78)
stamp_char(']', 3, 16, 0.78)

# Corner markers '+'
stamp_char('+', 2, COLS - 11, 0.65)
stamp_char('+', ROWS - 6, 4, 0.65)
stamp_char('+', ROWS - 6, COLS - 6, 0.65)

# Red dot position
red_r, red_c = 4, COLS - 4
red_x = red_c * PITCH + PITCH // 2
red_y = red_r * PITCH + PITCH // 2

tau = 2.0 * math.pi

# Launch ffmpeg encoder for MP4
mp4_out = "assets/nothing-bg.mp4"
ffmpeg_cmd = [
    'ffmpeg', '-y',
    '-f', 'rawvideo',
    '-vcodec', 'rawvideo',
    '-s', f'{W}x{H}',
    '-pix_fmt', 'rgb24',
    '-r', str(FPS),
    '-i', '-',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', '17',
    '-preset', 'fast',
    '-movflags', '+faststart',
    mp4_out
]

print("Starting FFmpeg pipeline for MP4...")
ffmpeg_proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)

for frame_idx in range(TOTAL_FRAMES):
    t = frame_idx / TOTAL_FRAMES
    
    # 1. Harmonic concentric ripples
    w1 = np.sin(d1 * 0.038 - t * tau * 2.0)
    w2 = np.cos(d2 * 0.032 - t * tau * 2.0)
    
    # 2. Diagonal matrix plane wave
    w_diag = np.sin(diag_coord - t * tau * 1.0)
    
    # 3. Rotating glyph arc tracer
    arc_phase = (angles_c1 - t * tau * 1.0) % tau
    arc_pulse = np.exp(- (ring_d ** 2) / (28.0 ** 2)) * (np.maximum(0.0, np.cos(arc_phase)) ** 2.5)
    
    # 4. Audio equalizer visualizer array (Nothing Voice Recorder)
    eq_val = np.zeros((ROWS, COLS), dtype=np.float32)
    # columns 18 to 62, rows 26 to 42
    bar_cols = np.arange(18, 63)
    bar_phase = (bar_cols - 18) / 44.0
    bar_h = 0.45 + 0.35 * np.sin(bar_phase * tau * 3.0 + t * tau * 2.0) + 0.20 * np.cos(bar_phase * tau * 5.0 - t * tau * 3.0)
    for idx, c_idx in enumerate(bar_cols):
        h_val = bar_h[idx]
        target_half = int(h_val * 7.0)
        center_r = 34
        for r_offset in range(-target_half, target_half + 1):
            curr_r = center_r + r_offset
            if 0 <= curr_r < ROWS:
                intensity = 0.85 * (1.0 - abs(r_offset) / (target_half + 1.0))
                eq_val[curr_r, c_idx] = max(eq_val[curr_r, c_idx], intensity)
                
    # Combine contributions
    combined = 0.26 * w1 + 0.24 * w2 + 0.20 * w_diag + 0.55 * arc_pulse + 0.60 * eq_val
    norm = np.clip((combined + 0.35) / 1.5, 0.0, 1.0)
    norm = np.maximum(norm, telemetry_mask)
    
    # Render frame using PIL
    img = Image.new('RGB', (W, H), (1, 1, 3))
    glow_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    dot_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    
    draw_glow = ImageDraw.Draw(glow_layer)
    draw_dots = ImageDraw.Draw(dot_layer)
    
    # Red LED
    red_pulse = 0.8 + 0.2 * math.sin(t * tau * 2.0)
    draw_glow.ellipse([red_x - 7.5, red_y - 7.5, red_x + 7.5, red_y + 7.5], fill=(225, 25, 35, int(95 * red_pulse)))
    draw_dots.ellipse([red_x - 2.8, red_y - 2.8, red_x + 2.8, red_y + 2.8], fill=(245, 30, 42, 255))
    
    # Render micro-dots
    for r in range(ROWS):
        y_val = ys[r]
        for c in range(COLS):
            if r == red_r and c == red_c:
                continue
                
            x_val = xs[c]
            val = norm[r, c]
            
            if val > 0.68:
                glow_a = int(145 * ((val - 0.68) / 0.32))
                draw_glow.ellipse([x_val - 5.5, y_val - 5.5, x_val + 5.5, y_val + 5.5], fill=(255, 255, 255, glow_a))
                draw_dots.ellipse([x_val - 2.5, y_val - 2.5, x_val + 2.5, y_val + 2.5], fill=(255, 255, 255, 255))
            elif val > 0.38:
                lum = int(150 + 105 * ((val - 0.38) / 0.30))
                draw_dots.ellipse([x_val - 1.9, y_val - 1.9, x_val + 1.9, y_val + 1.9], fill=(lum, lum, lum, 255))
            else:
                lum = max(38, int(150 * (val / 0.38)))
                draw_dots.ellipse([x_val - 1.3, y_val - 1.3, x_val + 1.3, y_val + 1.3], fill=(lum, lum, lum, 255))
                
    glow_blurred = glow_layer.filter(ImageFilter.GaussianBlur(radius=2.6))
    img.paste(glow_blurred, (0, 0), glow_blurred)
    img.paste(dot_layer, (0, 0), dot_layer)
    
    # Write raw bytes to ffmpeg
    ffmpeg_proc.stdin.write(img.tobytes())
    
    if (frame_idx + 1) % 60 == 0:
        print(f"Rendered {frame_idx + 1}/{TOTAL_FRAMES} frames ({int((frame_idx + 1) / TOTAL_FRAMES * 100)}%)...")

ffmpeg_proc.stdin.close()
_, stderr = ffmpeg_proc.communicate()
if ffmpeg_proc.returncode != 0:
    print("FFmpeg error:", stderr.decode('utf-8', errors='ignore'))
    sys.exit(1)

print(f"Successfully generated {mp4_out}")

# Now generate optimized GIF from MP4
gif_out = "assets/nothing-bg.gif"
print(f"Generating optimized GIF: {gif_out}...")
gif_cmd = [
    'ffmpeg', '-y',
    '-i', mp4_out,
    '-filter_complex',
    'fps=24,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96:reserve_transparent=0[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3',
    gif_out
]
subprocess.run(gif_cmd, check=True)
print(f"Successfully generated {gif_out}")

# Check sizes
mp4_size = os.path.getsize(mp4_out) / (1024 * 1024)
gif_size = os.path.getsize(gif_out) / (1024 * 1024)
print(f"MP4 Size: {mp4_size:.2f} MB | GIF Size: {gif_size:.2f} MB")
