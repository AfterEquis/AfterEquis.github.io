#!/usr/bin/env python3
"""
Generates an authentic macOS dark dynamic wallpaper video, GIF, and poster.
Features:
- Deep obsidian and midnight navy space canvas.
- Multi-layered fluid Apple Intelligence / macOS Sequoia silky ribbons in electric cyan, azure, and royal lavender/violet.
- Smooth specular edges with liquid glass glow and subtle ambient vignette.
- Mathematically seamless infinite loop (60fps, 6.0s = 360 frames).
- Outputs:
  * assets/macos-bg.mp4 (H.264, 60fps, YUV420p)
  * assets/macos-bg.gif (Optimized palette, smooth dither, ~2-3MB)
  * assets/macos-bg.webp (Single frame poster)
"""

import math
import subprocess
import os
import sys
import numpy as np
from PIL import Image, ImageFilter

W, H = 1280, 720
FPS = 60
DURATION = 6.0
TOTAL_FRAMES = int(FPS * DURATION)  # 360 frames
TAU = 2.0 * math.pi

print(f"Preparing macOS background generator: {W}x{H}, {TOTAL_FRAMES} frames @ {FPS}fps...")

# Coordinate grids
u = np.linspace(0, 1, W, dtype=np.float32)
v = np.linspace(0, 1, H, dtype=np.float32)
uu, vv = np.meshgrid(u, v)

# Base dark obsidian vignette
rad = np.hypot(uu - 0.5, vv - 0.5) * 1.35
vignette = np.clip(1.0 - 0.40 * (rad ** 2), 0.25, 1.0)

# Base midnight space backdrop
base_r = (6 + 8 * vv + 5 * (1 - uu)) * vignette
base_g = (8 + 10 * vv + 5 * (1 - uu)) * vignette
base_b = (18 + 20 * vv + 12 * uu) * vignette

mp4_out = "assets/macos-bg.mp4"
gif_out = "assets/macos-bg.gif"
webp_out = "assets/macos-bg.webp"

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
    '-crf', '18',
    '-preset', 'fast',
    '-movflags', '+faststart',
    mp4_out
]

print("Starting FFmpeg pipeline for MP4...")
ffmpeg_proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)

poster_saved = False

for frame_idx in range(TOTAL_FRAMES):
    t = frame_idx / TOTAL_FRAMES
    
    # Ribbon 1: Deep Indigo / Violet primary ribbon
    r1_center = 0.52 + 0.16 * np.sin(uu * TAU * 1.1 + t * TAU) + 0.07 * np.cos(uu * TAU * 2.2 - t * TAU)
    r1_dist = vv - r1_center
    r1_mask = np.exp(- (r1_dist ** 2) / (0.16 ** 2))
    
    # Ribbon 2: Electric Apple Cyan / Azure ribbon
    r2_center = 0.40 + 0.20 * np.sin(uu * TAU * 0.9 - t * TAU) + 0.05 * np.sin(uu * TAU * 2.0 + t * TAU)
    r2_dist = vv - r2_center
    r2_mask = np.exp(- (r2_dist ** 2) / (0.14 ** 2))
    
    # Ribbon 3: Amethyst / Royal Purple tertiary ribbon
    r3_center = 0.64 + 0.14 * np.cos(uu * TAU * 1.3 + t * TAU) + 0.05 * np.sin(uu * TAU * 2.6 - t * TAU)
    r3_dist = vv - r3_center
    r3_mask = np.exp(- (r3_dist ** 2) / (0.18 ** 2))

    # Upper ambient aurora glow
    aurora_y = 0.25 + 0.10 * np.sin(uu * TAU * 0.8 + t * TAU * 1.0)
    aurora_mask = np.exp(- ((vv - aurora_y) ** 2) / (0.25 ** 2)) * (0.6 + 0.4 * np.cos(uu * TAU * 1.5 - t * TAU))

    # Specular sheens (Apple liquid glass reflection highlights)
    sheen1 = np.maximum(0, 1.0 - np.abs(r1_dist - 0.012) / 0.038) ** 2 * (0.65 + 0.35 * np.sin(uu * TAU * 2.0 + t * TAU))
    sheen2 = np.maximum(0, 1.0 - np.abs(r2_dist + 0.010) / 0.032) ** 2 * (0.75 + 0.25 * np.cos(uu * TAU * 3.0 - t * TAU))

    # Combine color channels
    R = base_r + 38 * r1_mask + 14 * r2_mask + 55 * r3_mask + 24 * aurora_mask + 115 * sheen1 + 75 * sheen2
    G = base_g + 24 * r1_mask + 68 * r2_mask + 18 * r3_mask + 15 * aurora_mask + 125 * sheen1 + 135 * sheen2
    B = base_b + 92 * r1_mask + 158 * r2_mask + 105 * r3_mask + 45 * aurora_mask + 220 * sheen1 + 235 * sheen2

    # Apply global vignette
    R *= vignette
    G *= vignette
    B *= vignette

    # Pack to uint8
    img_arr = np.clip(np.stack([R, G, B], axis=-1), 0, 255).astype(np.uint8)
    
    # Save first frame as poster
    if not poster_saved:
        poster_img = Image.fromarray(img_arr)
        poster_img.save(webp_out, 'WEBP', quality=90)
        poster_saved = True

    ffmpeg_proc.stdin.write(img_arr.tobytes())

    if (frame_idx + 1) % 60 == 0:
        print(f"Rendered {frame_idx + 1}/{TOTAL_FRAMES} frames ({int((frame_idx + 1) / TOTAL_FRAMES * 100)}%)...")

ffmpeg_proc.stdin.close()
_, stderr = ffmpeg_proc.communicate()
if ffmpeg_proc.returncode != 0:
    print("FFmpeg error:", stderr.decode('utf-8', errors='ignore'))
    sys.exit(1)

print(f"Successfully generated {mp4_out} and {webp_out}")

# Generate optimized GIF
print(f"Generating optimized GIF: {gif_out}...")
gif_cmd = [
    'ffmpeg', '-y',
    '-i', mp4_out,
    '-filter_complex',
    'fps=20,scale=640:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:reserve_transparent=0[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3',
    gif_out
]
subprocess.run(gif_cmd, check=True)
print(f"Successfully generated {gif_out}")

mp4_size = os.path.getsize(mp4_out) / (1024 * 1024)
gif_size = os.path.getsize(gif_out) / (1024 * 1024)
print(f"macOS Assets ready: MP4 {mp4_size:.2f} MB | GIF {gif_size:.2f} MB")
