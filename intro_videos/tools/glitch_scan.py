# 掃單格閃爍／殘影（render glitch）：某一格跟前後兩格都差很多、但前後兩格彼此很像 → 列出來
# 用法：python3 glitch_scan.py <video.mp4>
# 判準（270x480 灰階、遮掉 HUD 列 y 240–400）：
#   d(prev,cur) > 400 px 且 d(cur,next) > 400 px 且 d(prev,next) < 0.35 * min(...)  → 單格閃
#   上緣 y<232 的亮度最大值比前後兩格都高 30 以上 → 上緣殘影（v2 的 672/684/706/715 就是這種）
import subprocess, sys
import numpy as np

src = sys.argv[1]
W, H = 270, 480
raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', src, '-vf', f'scale={W}:{H}:flags=area,format=gray',
                      '-f', 'rawvideo', '-'], capture_output=True).stdout
g = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.int16)
mask = np.ones((H, W), bool)
mask[60:100, :] = False


def c(a, b):
    return int(((np.abs(g[a] - g[b]) * mask) > 20).sum())


bad = []
top = g[:, 0:58, 20:250].max(axis=(1, 2))
for i in range(1, len(g) - 1):
    a, b, s = c(i - 1, i), c(i, i + 1), c(i - 1, i + 1)
    flash = min(a, b) > 400 and s < 0.35 * min(a, b)
    ghost = top[i] > max(top[i - 1], top[i + 1]) + 30
    if flash or ghost:
        bad.append((i, 'flash' if flash else '', 'top-ghost' if ghost else ''))
print('可疑格：', bad if bad else '無')
sys.exit(1 if bad else 0)
