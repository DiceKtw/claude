#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Akira｜川沙龍老闆　介紹影片　原創配樂＋全部音效（numpy / scipy 從零合成，不用任何取樣音檔）

用法（在 intro_videos/ 底下）：
    python3 tools/score_akira.py              # 合成 → 母帶 → out/audio/akira.wav，並跑驗證、輸出圖
    python3 tools/score_akira.py --no-verify  # 只合成

規格：48 kHz、立體聲、24-bit PCM、剛好 1,440,000 樣本（30.000 秒 = 1800 格 @60fps）
      120 BPM：1 拍 = 30 格 = 24000 樣本；第 f 格 = 第 f*800 樣本
      響度 -14 LUFS（integrated），true peak <= -1.0 dBTP
      確定性：所有雜訊都來自固定 seed 的 numpy Generator，每次執行輸出相同

概念：「設計師的研究筆記」——安靜、溫暖、極簡。D 大調，和聲與旋律全部原創。
  0–240      前奏：鉛筆在紙上的沙沙聲（跟著 DrawPath 的筆速、筆尖位置與彎度起伏）＋極淡的空氣墊音（半秒內淡入）；
             文案 tick 60／90（10/3：文案提前一拍半）、量測 tick 150／170；216 細線掃下的「嘶」
  240        主段進來：Rhodes A9sus4（一拍）＋ sub 脈衝 → 270 Dmaj9 落拍（名字）
  360–600    Bm9 → Gmaj9 → A9sus4，規格列四個固定音高 tick（不往上爬）
  600–960    Dmaj9 → F#m7 → Bm9 → Gmaj9 → A9sus4；線稿沙沙聲（主線三筆＋頸後、閉眼、兩道髮流四筆短線）、量測 tick、
             720 起極輕的 hi-hat、735 起切分的 Rhodes 旋律（全落在反拍，讓開拍點上的 tick）
  960–1200   三張卡：柔和 tick ＋ Rhodes 上行三音 A4 → C#5 → E5；1050 輕上行琶音；1080 Bm9 落在匯點；
             960 起刷鼓（2、4 拍，很輕）
  1200–1416  月曆：每 4 格一個時鐘般的小 tick（-28 dBFS，rng(7) 留空的第 4、16、27 天不響，跟 S4_parts.tsx 同一套規則），
             hi-hat、刷鼓與旋律都讓位給時鐘（B4 長音之後留白；音樂在 3.2–6 kHz 挖約 10 dB）
  1416       鼓與 sub 退出，只留 1380 起的 Rhodes 長音（A9sus4，最高音 D5）
  1460/1500  Bm9、Gmaj9（溫暖的和弦，最高音 C#5 → B4）
  1532–1572  筆在片尾描出落款（S0 髮絲線的縮小版）：極輕的鉛筆沙沙聲
  1580       最後的 D6/9 和弦（最高音 A4），D5 → C#5 → B4 → A4 一路下行收住；餘韻
  1770–1794  全部升餘弦淡出，1794 格起數位靜音（Reels 循環接回開頭）

低頻：整首沒有大鼓；sub 是唯一的低頻樂器（49–92 Hz），Rhodes 和聲全用無根音的開放排列（≥185 Hz）
並在 120 Hz 高通；S5 sub 退出後 Rhodes 才彈低音根音。
"""
import argparse
import os
import re
import subprocess
import wave

import numpy as np
from scipy import signal
from scipy.ndimage import minimum_filter1d

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'out', 'audio')
OUT_WAV = os.path.join(OUT_DIR, 'akira.wav')

SR = 48000
FPS = 60
SPF = SR // FPS  # 每格 800 樣本
N = 1_440_000  # 1800 格
BEAT = 30  # 1 拍 = 30 格

TARGET_LUFS = -14.0
TARGET_PYLN = -14.04  # pyloudnorm 與 ffmpeg ebur128 約差 0.05 LU：內部瞄準 -14.04，ffmpeg 量起來是 -14.0
LIMIT_CEIL_DB = -1.6  # 限幅器內部天花板（留餘量給 true peak 量測差）

rng = np.random.default_rng(20261003)  # 固定 seed：確定性


def S(frame):
    """格數 → 樣本位置（可接受半格）"""
    return int(round(frame * SPF))


def sec(x):
    return int(round(x * SR))


def tv(n):
    return np.arange(n) / SR


def noise(n):
    return rng.standard_normal(n)


def mhz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def db(x):
    return 20 * np.log10(np.maximum(x, 1e-12))


# ----------------------------------------------------------------------------
# 基本工具
# ----------------------------------------------------------------------------
def ramp(n, a):
    """升餘弦起音（第 0 個樣本 = 0，不爆音）"""
    e = np.ones(n)
    k = min(n, max(1, sec(a)))
    e[:k] = 0.5 - 0.5 * np.cos(np.pi * np.arange(k) / k)
    return e


def tail(x, a):
    """最後 a 秒升餘弦收尾（避免截斷爆音）"""
    x = np.array(x, dtype=float, copy=True)
    k = min(x.shape[-1], max(1, sec(a)))
    x[..., -k:] *= 0.5 + 0.5 * np.cos(np.pi * (np.arange(k) + 1) / k)
    return x


def _sos(kind, fc, order=2):
    return signal.butter(order, fc, btype=kind, fs=SR, output='sos')


def hp(x, fc, order=2):
    return signal.sosfilt(_sos('highpass', fc, order), x, axis=-1)


def lp(x, fc, order=2):
    return signal.sosfilt(_sos('lowpass', fc, order), x, axis=-1)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(_sos('bandpass', [lo, hi], order), x, axis=-1)


def osc_phase(freq):
    ph = 2 * np.pi * np.cumsum(freq) / SR
    return ph - ph[0]


def norm(x, peak=1.0):
    m = np.max(np.abs(x))
    return x * (peak / m) if m > 0 else x


def pink(n):
    """粉紅噪音（FFT 1/f 塑形），標準差 1"""
    X = np.fft.rfft(noise(n))
    f = np.arange(len(X), dtype=float)
    f[0] = 1.0
    y = np.fft.irfft(X / np.sqrt(f), n)
    return y / np.std(y)


def panlaw(pan):
    th = (np.asarray(pan) + 1) * np.pi / 4
    return np.cos(th) * np.sqrt(2), np.sin(th) * np.sqrt(2)


class Bus:
    def __init__(self):
        self.x = np.zeros((2, N))

    def add(self, sig, start, gain=1.0, pan=0.0):
        sig = np.asarray(sig, dtype=float)
        if sig.ndim == 1:
            gl, gr = panlaw(pan)
            sig = np.vstack([sig * gl, sig * gr])
        if start >= N:
            return
        n = min(sig.shape[1], N - start)
        self.x[:, start : start + n] += gain * sig[:, :n]


# ----------------------------------------------------------------------------
# 樂器
# ----------------------------------------------------------------------------
def rhodes(m, vel, hold, rel=0.16, bright=0.0):
    """電鋼琴（Rhodes 式）：兩組 2-op FM
       A：載波 1 : 調變 1，指數隨力度、快速衰減 → 溫暖的「吠音」與本體
       B：載波 1 : 調變 14（高音區自動降比）→ 音叉（tine）起音那一下的鐘聲
       按鍵縮放的自然衰減、放開琴鍵時制音器收掉；力度越大越亮；bright 讓高音的音叉起音更清楚"""
    f = mhz(m)
    dec = float(np.clip(2.8 * (220.0 / f) ** 0.6, 0.8, 6.0))
    n = sec(hold + rel + 0.05)
    t = tv(n)
    idx = (0.35 + 1.25 * vel) * np.exp(-t / 0.22) + 0.10
    a = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t))
    ratio = min(14.0, 7000.0 / f)
    idx_b = 0.9 * vel * np.exp(-t / 0.035)
    b = np.sin(2 * np.pi * f * 1.0007 * t + idx_b * np.sin(2 * np.pi * f * ratio * t))
    env_a = (0.82 * np.exp(-t / dec) + 0.18 * np.exp(-t / (dec * 0.25)))
    env_b = np.exp(-t / 0.28)
    s = env_a * a + (0.10 + 0.22 * vel + 0.30 * bright) * env_b * b
    # 制音器：hold 之後指數收掉
    h = sec(hold)
    if h < n:
        s[h:] *= np.exp(-(t[h:] - t[h]) / (rel / 3.0))
    s = lp(s, 1600 + 4200 * vel + 7000 * bright)
    s *= ramp(n, 0.0025)
    gain = vel ** 1.25 * (1.0 if f < 500 else (500.0 / f) ** 0.35)
    return tail(s * gain, 0.02)


def rhodes_chord(bus, frame, notes, vel, hold_frames, roll_ms=3.0, pan_spread=0.32, top_boost=1.15):
    """和弦：由低往高輕輕滾一下（第一個音剛好在該格），最高音略突出"""
    for i, m in enumerate(sorted(notes)):
        st = S(frame) + sec(i * roll_ms / 1000.0)
        v = vel * (top_boost if i == len(notes) - 1 else 1.0)
        v = min(v, 0.95)
        hold = max(0.05, hold_frames / FPS - i * roll_ms / 1000.0)
        pan = float(np.clip((m - 62) / 22.0, -1, 1)) * pan_spread
        bus.add(rhodes(m, v, hold), st, pan=pan)


def sub_pulse(f, length, acc):
    """低沉 sub 脈衝：正弦＋2、3 次諧波（手機喇叭聽得到），起點微微下滑（柔軟的脈衝，不是大鼓）"""
    n = sec(length)
    t = tv(n)
    ph = osc_phase(f * (1 + 0.06 * np.exp(-t / 0.018)))
    s = np.sin(ph) + 0.30 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
    env = ramp(n, 0.004) * (0.22 + 0.78 * np.exp(-t / 0.13))
    s = np.tanh(1.2 * s * env) / np.tanh(1.2)
    return tail(s * acc, 0.04)


def hat(decay=0.016):
    n = sec(0.09)
    t = tv(n)
    s = hp(noise(n), 7500, 4) * np.exp(-t / decay) * ramp(n, 0.0004)
    return tail(norm(s), 0.006)


def brush():
    """刷鼓：中頻帶通噪音，慢一點的起音（掃過的感覺），短尾"""
    n = sec(0.22)
    t = tv(n)
    s = bp(noise(n), 700, 3600)
    env = (1 - np.exp(-t / 0.012)) * np.exp(-t / 0.065)
    return tail(norm(s * env * ramp(n, 0.001)), 0.02)


def air_pad(midis, dur):
    """前奏的空氣墊音：每音兩支微走音正弦＋一點二次諧波，慢慢呼吸，左右展開"""
    n = sec(dur)
    t = tv(n)
    L = np.zeros(n)
    R = np.zeros(n)
    for i, m in enumerate(midis):
        f = mhz(m)
        for v, (cents, pan) in enumerate(((-4, -0.6), (4, 0.6))):
            fv = f * 2 ** (cents / 1200)
            am = 0.75 + 0.25 * np.sin(2 * np.pi * (0.11 + 0.05 * i + 0.03 * v) * t + 1.7 * i + 2.3 * v)
            s = (np.sin(2 * np.pi * fv * t + 0.9 * i + 1.3 * v) + 0.12 * np.sin(4 * np.pi * fv * t + 0.4 * i)) * am
            s *= 1.0 / (1 + i * 0.35)
            gl, gr = panlaw(pan * (0.5 + 0.15 * i))
            L += s * gl
            R += s * gr
    st = lp(np.vstack([L, R]), 2600)
    return norm(st)


# ------------------------------- 音效 -------------------------------------
def etick(f, tau=0.004, click=0.25, harm=0.30, length=0.04):
    """乾淨的電子 tick：短正弦＋一點二次諧波＋1 個樣本的脈衝經高通（確定性、乾淨的 click）"""
    n = sec(length)
    t = tv(n)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t / tau) + harm * np.sin(2 * np.pi * 2.0 * f * t) * np.exp(-t / (tau * 0.45))
    imp = np.zeros(n)
    imp[0] = 1.0
    c = hp(imp, 6000, 2)
    s = s * ramp(n, 0.0001) + click * c / (np.max(np.abs(c)) + 1e-12)
    return tail(norm(s), 0.004)


def hiss(dur, f0, f1, att_level=0.55, peak_at=0.45, width=0.65, pan0=0.0, pan1=0.0):
    """「嘶」：白噪音＋隨時間掃頻的帶通（STFT 遮罩）＋2 kHz 高通；
       起點 4 ms 先有一口氣（讓起點落在該格），然後膨起、收掉"""
    n = sec(dur)
    x = noise(n + 2048)
    nper, nov = 1024, 768
    fq, tt, Z = signal.stft(x, fs=SR, nperseg=nper, noverlap=nov)
    u = np.clip(tt / dur, 0, 1)
    fc = f0 * (f1 / f0) ** u
    lf = np.log2(np.maximum(fq, 1.0))[:, None] - np.log2(fc)[None, :]
    _, y = signal.istft(Z * np.exp(-0.5 * (lf / width) ** 2), fs=SR, nperseg=nper, noverlap=nov)
    y = hp(y[:n], 2000, 2)
    t = tv(n)
    uu = t / dur
    shape = np.where(uu < peak_at, att_level + (1 - att_level) * np.sin(0.5 * np.pi * uu / peak_at),
                     np.cos(0.5 * np.pi * (uu - peak_at) / (1 - peak_at)) ** 1.5)
    y = y * shape * ramp(n, 0.004)
    y = norm(tail(y, 0.03))
    gl, gr = panlaw(np.linspace(pan0, pan1, n))
    return np.vstack([y * gl, y * gr])


# 鉛筆：DrawPath 的路徑幾何（從場景檔抄來的座標，只用來算筆速／位置／彎度）
S0_STRAND = [
    [(-20, 980), (110, 980), (262, 982), (352, 966)],
    [(352, 966), (424, 953), (452, 896), (470, 820)],
    [(470, 820), (490, 736), (532, 678), (604, 672)],
    [(604, 672), (690, 665), (748, 724), (742, 806)],
    [(742, 806), (736, 884), (668, 922), (672, 1002)],
    [(672, 1002), (676, 1082), (784, 1132), (900, 1150)],
]
# S2（10/3 改成看得出是鮑伯的版本；座標同 S2_parts.tsx）
S2_FACE = [(797, 768), (800, 796), (798, 812), (820, 846), (846, 878), (838, 889), (814, 893), (818, 912), (809, 922),
           (815, 936), (803, 954), (812, 984), (798, 1006), (756, 1018), (724, 1034), (714, 1090), (718, 1150)]
S2_HAIR = [(736, 646), (668, 612), (586, 604), (506, 624), (444, 672), (408, 744), (396, 830), (400, 912), (402, 972),
           (414, 1010), (452, 1030), (530, 1042), (600, 1046), (648, 1040), (662, 1022), (650, 980), (638, 920),
           (646, 862), (672, 814), (704, 786)]
S2_BANG = [(736, 646), (774, 672), (796, 712), (804, 742), (800, 766)]
S2_NAPE = [(560, 1044), (566, 1090), (560, 1150)]
S2_EYE = [(764, 830), (776, 838), (790, 834)]
S2_STRAND_A = [(628, 616), (690, 634), (742, 672), (776, 724)]
S2_STRAND_B = [(492, 720), (468, 820), (470, 920), (498, 1000)]
# S5 落款：S0 髮絲線縮小 0.19 倍、搬到卡中軸（同 S5.tsx）
S5_SIGN = [[((x - 440) * 0.19 + 540, (y - 911) * 0.19 + 818) for x, y in c] for c in S0_STRAND]


def smooth_cubs(pts):
    """Catmull-Rom → 三次貝茲（同場景檔 smoothCubs，tension 1）"""
    out = []
    k = 1 / 6
    for i in range(len(pts) - 1):
        p0 = pts[max(0, i - 1)]
        p1 = pts[i]
        p2 = pts[i + 1]
        p3 = pts[min(len(pts) - 1, i + 2)]
        out.append([p1, (p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k),
                    (p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k), p2])
    return out


def path_samples(cubs, per=200):
    """貝茲路徑取密集點 → (累積弧長, x, 轉向角速度 |dθ/ds|)"""
    pts = []
    for c in cubs:
        a, b, cc, d = (np.array(p, dtype=float) for p in c)
        tt = np.linspace(0, 1, per, endpoint=False)[:, None]
        u = 1 - tt
        pts.append(u ** 3 * a + 3 * u * u * tt * b + 3 * u * tt * tt * cc + tt ** 3 * d)
    pts.append(np.array(cubs[-1][3], dtype=float)[None, :])
    P = np.vstack(pts)
    seg = np.diff(P, axis=0)
    ds = np.hypot(seg[:, 0], seg[:, 1])
    s = np.concatenate([[0.0], np.cumsum(ds)])
    ang = np.unwrap(np.arctan2(seg[:, 1], seg[:, 0]))
    dth = np.abs(np.diff(ang)) / np.maximum(ds[1:], 1e-6)
    curv = np.concatenate([[dth[0]], dth, [dth[-1]]])
    curv = np.convolve(curv, np.ones(15) / 15, mode='same')
    return s, P[:, 0], curv


def in_out_sine(u):
    return -(np.cos(np.pi * u) - 1) / 2


def pencil(strokes, vmax=None):
    """鉛筆在紙上的沙沙聲（濾過的粉紅噪音）
       strokes：[(起格, 止格, 路徑貝茲)]，筆的進度 = inOutSine（跟 DrawPath 一樣）
       音量 ∝ 筆速^0.75（px/s），亮度跟著筆速；彎得越急摩擦越亮；紙纖維的顆粒感＋零星小爆裂；
       左右位置跟著筆尖 x；每一筆起點有一下很輕的「落筆」"""
    info = []
    for f0, f1, cubs in strokes:
        s, xs, curv = path_samples(cubs)
        L = s[-1]
        dur = (f1 - f0) / FPS
        info.append((f0, f1, s, xs, curv, L, dur))
    if vmax is None:
        vmax = max(L / dur * np.pi / 2 for *_, L, dur in info)
    a0 = S(min(i[0] for i in info))
    a1 = S(max(i[1] for i in info)) + sec(0.05)
    n = a1 - a0
    env = np.zeros(n)
    bright = np.zeros(n)
    xpos = np.full(n, 540.0)
    wsum = np.zeros(n)
    taps = []
    for f0, f1, s, xs, curv, L, dur in info:
        i0, i1 = S(f0) - a0, S(f1) - a0
        m = i1 - i0
        u = np.arange(m) / m
        p = in_out_sine(u)
        speed = L * np.pi / 2 * np.sin(np.pi * u) / dur  # px/s
        sn = speed / vmax
        k = np.interp(p * L, s, curv)
        x = np.interp(p * L, s, xs)
        e = np.maximum(sn, 0.0) ** 0.75 + 0.05  # 筆一直貼著紙：留一點底
        e *= ramp(m, 0.006)
        e[-sec(0.012):] *= np.linspace(1, 0, sec(0.012))
        env[i0:i1] += e
        bright[i0:i1] += np.clip(0.55 * sn + 6.0 * np.minimum(k, 0.06), 0, 1) * e
        xpos[i0:i1] = np.where(wsum[i0:i1] > 0, 0.5 * (xpos[i0:i1] + x), x)
        wsum[i0:i1] += e
        taps.append(i0)
    bright = np.clip(bright / np.maximum(env, 1e-6), 0, 1)
    base = pink(n)
    dull = bp(base, 900, 3600)
    brite = bp(base, 2400, 9500)
    dull /= np.std(dull)
    brite /= np.std(brite)
    tex = dull * (1 - 0.65 * bright) + brite * (0.45 + 0.55 * bright)
    g1 = lp(noise(n), 55)
    g1 /= np.std(g1)
    g2 = lp(noise(n), 380)
    g2 /= np.std(g2)
    am = np.clip(1 + 0.45 * g1 + 0.25 * g2, 0.15, 2.4)
    sig = tex * am * env
    # 紙纖維的小爆裂：密度跟著筆速（確定性：rng 固定）
    rate = 30.0 * env / max(env.max(), 1e-9)
    hits = np.flatnonzero(rng.random(n) < rate / SR)
    hits = [h for h in hits if all(abs(h - i0) > sec(0.03) for i0 in taps)]  # 落筆前後 30 ms 不放爆裂
    cr = hp(np.exp(-tv(sec(0.002)) / 0.0004) * noise(sec(0.002)), 3000, 2)
    for h in hits:
        mm = min(len(cr), n - h)
        sig[h : h + mm] += 1.8 * env[h] * cr[:mm] * rng.uniform(0.4, 1.0)
    # 落筆：每一筆起點一下很輕的石墨「嗒」
    tt = tv(sec(0.012))
    tap = bp(noise(len(tt)), 1500, 7000) * np.exp(-tt / 0.0020) + 0.8 * np.sin(2 * np.pi * 1250 * tt) * np.exp(-tt / 0.003)
    tap = norm(tap * ramp(len(tt), 0.0002)) * 4.5
    for i0 in taps:
        sig[i0 : i0 + len(tap)] += tap[: n - i0]
    sig *= ramp(n, 0.003)
    sig = tail(sig, 0.02)
    pan = np.clip((xpos - 540) / 540 * 0.45, -0.45, 0.45)
    gl, gr = panlaw(pan)
    return np.vstack([sig * gl, sig * gr]), a0, env, vmax


# ----------------------------------------------------------------------------
# 空間：合成殘響 IR、乒乓延遲、側鏈（讓位）
# ----------------------------------------------------------------------------
def make_ir(rt=2.2, length=3.0, pre=0.020):
    n = sec(length)
    t = tv(n)
    ir = np.zeros((2, n))
    for c in range(2):
        x = noise(n) * np.exp(-6.91 * t / rt)
        xl = lp(x, 2600)
        w = np.clip(t / (rt * 0.4), 0, 1)
        x = x * (1 - w) + xl * w
        x[: sec(pre)] = 0
        x[sec(pre) : sec(pre) + sec(0.006)] *= ramp(sec(0.006), 0.006)
        ir[c] = x / np.sqrt(np.sum(x ** 2))
    return ir


def reverb(send, ir):
    mono = send.sum(axis=0) * 0.5
    side = (send[0] - send[1]) * 0.5
    L = signal.fftconvolve(mono + 0.6 * side, ir[0])[:N]
    R = signal.fftconvolve(mono - 0.6 * side, ir[1])[:N]
    return hp(np.vstack([L, R]), 200)


def pingpong(x, delay_s, fb=0.3, taps=3):
    d = sec(delay_s)
    out = np.zeros_like(x)
    src = lp(hp(x.sum(axis=0) * 0.5, 300), 3800)
    for k in range(1, taps + 1):
        sh = d * k
        if sh >= N:
            break
        ch = (k + 1) % 2
        out[ch, sh:] += (fb ** (k - 1)) * src[: N - sh]
    return out


def duck_curve(marks, rel=0.14, att=0.003):
    """marks：[(樣本位置, 深度)]；音效一響，音樂立刻讓開，之後慢慢回來"""
    d = np.ones(N)
    L = sec(0.7)
    t = tv(L)
    shape = np.where(t < att, t / att, np.exp(-(t - att) / rel))
    for s0, depth in marks:
        m = min(L, N - s0)
        d[s0 : s0 + m] = np.minimum(d[s0 : s0 + m], 1 - depth * shape[:m])
    return d


def fade_env(a, b, kind='out'):
    e = np.ones(N)
    k = S(b) - S(a)
    c = 0.5 + 0.5 * np.cos(np.pi * np.arange(k) / k)
    if kind == 'out':
        e[S(a) : S(b)] = c
        e[S(b) :] = 0.0
    else:
        e[: S(a)] = 0.0
        e[S(a) : S(b)] = 1 - c
    return e


# ----------------------------------------------------------------------------
# 編曲（全部原創）
# ----------------------------------------------------------------------------
# 和弦表：(格, 名稱, Rhodes 無根音排列, sub 根音 MIDI, 力度)
CHORDS = [
    (240, 'A9sus4', [55, 59, 62, 64], 33, 0.50),
    (270, 'Dmaj9', [54, 57, 61, 64], 38, 0.68),
    (360, 'Bm9', [54, 57, 61, 62], 35, 0.62),
    (480, 'Gmaj9', [54, 57, 59, 62], 31, 0.60),
    (540, 'A9sus4', [55, 59, 62, 64], 33, 0.58),
    (600, 'Dmaj9', [54, 57, 61, 64], 38, 0.58),
    (720, 'F#m7', [57, 61, 64, 66], 42, 0.56),
    (780, 'Bm9', [54, 57, 61, 62], 35, 0.56),
    (840, 'Gmaj9', [54, 57, 59, 62], 31, 0.56),
    (900, 'A9sus4', [55, 59, 62, 64], 33, 0.54),
    (960, 'Dmaj9', [54, 57, 61, 64], 38, 0.46),
    (1080, 'Bm9', [54, 57, 61, 62], 35, 0.60),
    (1140, 'Gmaj9', [54, 57, 59, 62], 31, 0.56),
    (1200, 'Em9', [55, 59, 62, 66], 40, 0.54),
    (1260, 'A9sus4', [55, 59, 62, 64], 33, 0.52),
    (1320, 'Gmaj9', [54, 57, 59, 62], 31, 0.54),
    (1380, 'A9sus4', [55, 59, 62, 64], 33, 0.54),  # 長音：一路響到 1460
]
CHORD_END = {1380: 1460}
SUB_END = 1416  # 鼓與 sub 在這格退出

# 伴奏的輕輕再按（只在沒有旋律的小節；全在反拍）
COMP = [315, 345, 405, 435, 465, 525, 585, 645, 675, 705, 1005]

# 旋律／卡片音／琶音：(格, MIDI, 力度, 持續格數)
MELODY = [
    # 第一句（735 起，全部落在反拍，讓開 750/780/810/840 的 tick）
    (735, 73, 0.50, 24), (765, 76, 0.52, 24), (795, 78, 0.54, 24), (825, 81, 0.56, 54),
    (885, 78, 0.50, 24), (915, 76, 0.50, 44),
    # 第二句（1095 起）
    (1095, 78, 0.50, 24), (1125, 76, 0.50, 24), (1155, 74, 0.50, 24), (1185, 71, 0.52, 100),
    (1305, 78, 0.52, 54), (1365, 76, 0.48, 14),  # 1185 的 B4 長音之後留白，讓月曆的時鐘 tick 被聽見
    (1380, 74, 0.56, 80),  # 1416 起「只留電鋼琴長音」的那個長音（D5）
]
CARD_NOTES = [(960, 69, 0.60, 118), (990, 73, 0.60, 88), (1020, 76, 0.62, 58)]  # 上行三音（踩著延音踏板，響到 1078）
ARP = [(1050 + 5 * k, m, 0.34 + 0.03 * k, 11) for k, m in enumerate([74, 76, 78, 81, 85, 88])]  # 很輕的上行琶音

# S5 金句卡：(格, 低音, 和弦, 力度, 持續格數)
END_CHORDS = [
    (1460, 47, [57, 61, 62, 66, 73], 0.58, 40),  # Bm9（最高音 C#5）
    (1500, 43, [57, 59, 62, 66, 71], 0.58, 80),  # Gmaj9（B4）
    (1580, 38, [50, 57, 61, 64, 66, 69], 0.56, 190),  # D6/9（A4），之後餘韻
]

# 月曆：30 天、每 4 格一天；rng(7) 選出的 3 天留空（同 S4_parts.tsx 的 mulberry32 演算法）
CAL_T0, CAL_STEP, CAL_DAYS = 1230, 4, 30


def mulberry32(seed):
    a = seed & 0xFFFFFFFF

    def r():
        nonlocal a
        a = (a + 0x6D2B79F5) & 0xFFFFFFFF
        t = a
        t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
        t ^= (t + (((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296

    return r


CAL_LEAD = 2  # 月曆從週三開始：前 2 格不屬於這個月


def open_days():
    """跟 S4_parts.tsx 的 OPEN_DAYS 完全同一套規則：三天不同列、不同星期（guard 500）→ [3, 15, 26]"""
    r = mulberry32(7)
    out = []
    guard = 0
    col = lambda k: (CAL_LEAD + k) % 7
    row = lambda k: (CAL_LEAD + k) // 7
    while len(out) < 3 and guard < 500:
        guard += 1
        k = 3 + int(np.floor(r() * (CAL_DAYS - 6)))
        if all(col(o) != col(k) and row(o) != row(k) for o in out):
            out.append(k)
    return sorted(out)


OPEN_DAYS = open_days()
CAL_TICKS = [CAL_T0 + CAL_STEP * k for k in range(CAL_DAYS) if k not in OPEN_DAYS]

# 音效 tick 的最終峰值（dBFS，母帶後）
TICK_DB = dict(text=-10.0, small=-17.0, spec=-11.0, note=-13.0, card=-15.0, cal=-28.0)


def chord_at(frame):
    cur = CHORDS[0]
    for c in CHORDS:
        if c[0] <= frame:
            cur = c
    return cur


def build():
    keys, mel, cards, arp, endb, sub, hats, brushes, pad = (Bus() for _ in range(9))

    # ---- 前奏墊音（0 → 淡入，240 起讓位給 Rhodes）----
    p = air_pad([57, 64, 71, 78], 7.5)  # A3 E4 B4 F#5
    pe = np.ones(p.shape[1])
    k_in = S(30)  # 10/3：半秒內淡入（原本 160 格，前 1 秒幾乎無聲）
    pe[:k_in] = (0.5 - 0.5 * np.cos(np.pi * np.arange(k_in) / k_in)) ** 1.5
    o0, o1 = S(250), S(420)
    pe[o0:o1] *= 0.5 + 0.5 * np.cos(np.pi * np.arange(o1 - o0) / (o1 - o0))
    pe[o1:] = 0.0
    pad.add(p * pe, 0)

    # ---- Rhodes 和弦 ----
    for i, (f, name, notes, root, vel) in enumerate(CHORDS):
        nxt = CHORD_END.get(f, CHORDS[i + 1][0] if i + 1 < len(CHORDS) else f + 120)
        rhodes_chord(keys, f, notes, vel, nxt - f)
    for f in COMP:
        notes = chord_at(f)[2]
        rhodes_chord(keys, f, sorted(notes)[-2:], 0.30, 12, pan_spread=0.5, top_boost=1.0)

    # ---- 旋律、卡片音、琶音（同一支 Rhodes 的高音區）----
    for bus, notes, br in ((mel, MELODY, 0.0), (cards, CARD_NOTES, 0.25), (arp, ARP, 0.6)):
        for f, m, v, d in notes:
            pan = 0.18 if (f // 30) % 2 else -0.12
            if bus is arp:
                pan = -0.3 + 0.12 * ((f - 1050) // 5)  # 琶音由左往右走（跟著三條線往匯點收）
            bus.add(rhodes(m, v, d / FPS, rel=0.2, bright=br), S(f), pan=pan)

    # ---- S5 溫暖的和弦（sub 退出後 Rhodes 自己彈低音）----
    for f, bass_m, notes, vel, d in END_CHORDS:
        endb.add(rhodes(bass_m, vel * 0.62, d / FPS, rel=0.4), S(f), pan=-0.05)
        rhodes_chord(endb, f, notes, vel, d, roll_ms=5.0, pan_spread=0.4)

    # ---- sub 脈衝：240 → 1410 每拍一下（1、3 拍重，270 落拍加重）----
    acc_by_beat = [1.0, 0.62, 0.85, 0.62]
    for f in range(240, 1381, BEAT):  # 最後一下 1380（A1）拉長，一路撐到 1416 退場
        root = chord_at(f)[3]
        acc = acc_by_beat[((f - 240) // BEAT) % 4] if f != 270 else 1.0
        if f == 240:
            acc = 0.85
        length = 0.47 if f < 1380 else (SUB_END - 1380) / FPS + 0.2
        sub.add(sub_pulse(mhz(root), length, acc), S(f))

    # ---- hi-hat：720 起反拍，月曆時段讓位給時鐘 tick，1416 前退出 ----
    for f in range(720 + 15, SUB_END, BEAT):
        if 1225 <= f <= 1350 or 936 <= f < 960:  # 月曆時段讓位給時鐘 tick；936 細線掃過時讓位給「嘶」
            continue
        v = 0.62 if ((f - 735) // BEAT) % 2 == 0 else 0.48
        hats.add(hat(), S(f), gain=v, pan=0.25)
    # 刷鼓：960 起 2、4 拍
    for f in range(990, SUB_END, 2 * BEAT):
        if 1225 <= f <= 1350:  # 月曆時段：hat 與刷鼓都讓位給時鐘 tick
            continue
        brushes.add(brush(), S(f), gain=0.7, pan=-0.15)

    # 1416：鼓與 sub 退出（40 ms 升餘弦收掉，之後全 0）
    for b in (sub, hats, brushes):
        b.x *= fade_env(SUB_END, SUB_END + 2.4)

    music = dict(keys=keys, mel=mel, cards=cards, arp=arp, end=endb, sub=sub, hats=hats, brush=brushes, pad=pad)

    # ======================= 音效 =======================
    cue = Bus()  # 以「最終 dBFS」為單位直接擺（母帶增益另外補償）
    cue_verb = Bus()
    duck_marks = []

    def put_tick(sig, f, level_db, pan=0.0, verb=0.05, depth=0.22):
        g = 10 ** (level_db / 20) / max(panlaw(pan))  # 聲像補償：較大聲那一聲道的峰值 = level_db
        cue.add(sig, S(f), gain=g, pan=pan)
        cue_verb.add(sig, S(f), gain=g * verb, pan=pan)
        if depth > 0:
            duck_marks.append((S(f), depth))

    t_text = etick(3520.0, tau=0.0042, click=0.22)  # A7
    t_small = etick(5274.0, tau=0.0026, click=0.18, harm=0.2, length=0.025)  # E8，更小
    t_spec = etick(3520.0, tau=0.0036, click=0.2)  # 規格列：音高固定
    t_note = etick(4699.0, tau=0.0032, click=0.2, harm=0.22)  # 量測標註
    t_card = etick(2349.0, tau=0.0070, click=0.10, harm=0.18, length=0.06)  # 柔和
    t_cal_a = etick(4186.0, tau=0.0016, click=0.3, harm=0.1, length=0.016)
    t_cal_b = etick(3951.0, tau=0.0016, click=0.3, harm=0.1, length=0.016)

    for f in (60, 90):  # 10/3：S0 文案提前到 60／90 落拍
        put_tick(t_text, f, TICK_DB['text'], pan=-0.25)
    for f, pan in ((150, 0.30), (170, 0.35)):
        put_tick(t_small, f, TICK_DB['small'], pan=pan, depth=0.0)
    for f in (360, 390, 420, 450):
        put_tick(t_spec, f, TICK_DB['spec'], pan=-0.15)
    for f, pan in ((750, -0.35), (780, -0.25), (810, 0.1), (840, -0.4)):
        put_tick(t_note, f, TICK_DB['note'], pan=pan)
    for f in (960, 990, 1020):
        put_tick(t_card, f, TICK_DB['card'], pan=0.0, verb=0.12)
    for i, f in enumerate(CAL_TICKS):
        k = (f - CAL_T0) // CAL_STEP
        put_tick(t_cal_a if k % 2 == 0 else t_cal_b, f, TICK_DB['cal'], pan=-0.3 + 0.6 * (k % 7) / 6, verb=0.0,
                 depth=0.0)

    # 「嘶」：216 細線往下掃（掃頻往下）、576 往上漂（往上）、936 由左往右（聲像跟著走）
    hiss_spec = [(216, 0.42, 9000, 3800, 0, 0, -26.0), (576, 0.42, 3200, 8500, 0, 0, -29.0),
                 (936, 0.42, 4200, 7600, -0.65, 0.65, -25.0)]
    for f, dur, f0, f1, p0, p1, lvl in hiss_spec:
        h = hiss(dur, f0, f1, pan0=p0, pan1=p1)
        g = 10 ** (lvl / 20)
        cue.add(h, S(f), gain=g)
        cue_verb.add(h, S(f), gain=g * 0.25)
        duck_marks.append((S(f), 0.12))

    # 鉛筆：S0 一筆（10–150），S2 主線三筆＋短線四筆（時間同 S2.tsx 的 STROKES），S5 落款一筆（1532–1572）
    s0_sig, s0_a, s0_env, _ = pencil([(10, 150, S0_STRAND)])
    s2_sig, s2_a, s2_env, _ = pencil([(600, 642, smooth_cubs(S2_FACE)), (636, 698, smooth_cubs(S2_HAIR)),
                                      (692, 712, smooth_cubs(S2_BANG)), (700, 712, smooth_cubs(S2_NAPE)),
                                      (708, 718, smooth_cubs(S2_EYE)), (712, 726, smooth_cubs(S2_STRAND_A)),
                                      (716, 730, smooth_cubs(S2_STRAND_B))])
    s5_sig, s5_a, s5_env, _ = pencil([(1532, 1572, S5_SIGN)])

    def rms_peak(x, w=0.05):
        m = (x ** 2).mean(axis=0)
        k = sec(w)
        return np.sqrt(np.convolve(m, np.ones(k) / k, mode='same').max())

    s0_sig *= 10 ** (-27.0 / 20) / rms_peak(s0_sig)  # 「極輕」：最快處 50 ms RMS ≈ -27 dBFS
    s2_sig *= 10 ** (-31.0 / 20) / rms_peak(s2_sig)  # 「更輕」
    s5_sig *= 10 ** (-34.0 / 20) / rms_peak(s5_sig)  # 片尾落款：最輕（小筆、慢）
    cue.add(s0_sig, s0_a)
    cue.add(s2_sig, s2_a)
    cue.add(s5_sig, s5_a)
    pencil_env = np.zeros(N)
    pencil_env[s2_a : s2_a + len(s2_env)] = s2_env / s2_env.max()

    pencil_curves = dict(s0=(s0_a, s0_env), s2=(s2_a, s2_env), s5=(s5_a, s5_env))
    return music, cue, cue_verb, duck_marks, pencil_env, pencil_curves


# ----------------------------------------------------------------------------
# 混音與母帶
# ----------------------------------------------------------------------------
def true_peak_env(x):
    up = signal.resample_poly(x, 4, 1, axis=1)
    return np.abs(up).max(axis=0).reshape(-1, 4).max(axis=1)


def limiter(x, ceil_db=LIMIT_CEIL_DB, look=0.0015, rel=0.08):
    """前瞻式 true-peak 限幅器（4× 超取樣偵測），回傳 (輸出, 增益曲線)"""
    ceil = 10 ** (ceil_db / 20)
    g_req = np.minimum(1.0, ceil / np.maximum(true_peak_env(x), 1e-9))
    L = max(2, sec(look))
    g_min = minimum_filter1d(g_req, size=2 * L + 1)
    if g_min.min() >= 1.0:
        return x.copy(), np.ones(N)
    a = float(np.exp(-1.0 / (rel * SR)))
    gm = g_min.tolist()
    g = [1.0] * N
    prev = 1.0
    for i in range(N):
        v = gm[i]
        if v < prev:
            prev = v
        elif prev < 1.0:
            prev = v + (prev - v) * a
        g[i] = prev
    g = np.asarray(g)
    gs = np.convolve(np.concatenate([np.ones(L - 1), g]), np.ones(L) / L, mode='valid')
    return x * gs, gs


def loudness(x):
    import pyloudnorm as pyln
    return pyln.Meter(SR).integrated_loudness(x.T)


def autopan(x, rate=3.1, depth=0.10):
    t = tv(N)
    m = depth * np.sin(2 * np.pi * rate * t)
    return np.vstack([x[0] * (1 + m), x[1] * (1 - m)])


MIX = dict(keys=1.00, mel=0.86, end=0.74, sub=0.60, hats=0.55, brush=0.28, pad=0.42)


def mixdown(verbose=True):
    music, cue, cue_verb, duck_marks, pencil_env, pencil_curves = build()
    ir = make_ir()

    # 音效讓位：tick／嘶一響，音樂（除了 sub）讓開；S2 鉛筆描線時音樂再退 ~2 dB
    duck = duck_curve(duck_marks)
    duck_pencil = 1 - 0.22 * np.convolve(pencil_env, np.ones(sec(0.08)) / sec(0.08), mode='same')
    duck_all = duck * duck_pencil

    def g(name):
        return MIX[name]

    keys = hp(music['keys'].x, 120, 2) * g('keys')
    mel_parts = {k: hp(music[k].x, 150, 2) * g('mel') for k in ('mel', 'cards', 'arp')}
    mel = mel_parts['mel'] + mel_parts['cards'] + mel_parts['arp']
    endb = hp(music['end'].x, 60, 2) * g('end')
    rh = autopan(keys + mel + endb)
    rh = np.tanh(1.15 * rh / 4.0) * 4.0 / 1.15  # 很輕的飽和（溫暖）
    sub = lp(music['sub'].x, 220, 2) * g('sub')
    hats = music['hats'].x * g('hats')
    brushes = music['brush'].x * g('brush')
    pad = music['pad'].x * g('pad')

    # 月曆時鐘 tick（-28 dBFS）那段：音樂在 3.2–6 kHz 挖掉約 6 dB，讓很小的 tick 不被 Rhodes 的音叉泛音蓋掉
    carve_w = fade_env(1222, 1228, 'in') * fade_env(1350, 1358)
    carve = lambda x: x - 0.68 * bp(x, 3200, 6000, 2) * carve_w
    rh = carve(rh)
    rh_d = rh * duck_all
    pad_d = pad * duck_all
    hats_d = hats * duck_all
    brush_d = brushes * duck_all
    sub_d = sub * (1 - 0.35 * (1 - duck_all))  # sub 只讓一點點

    send = 0.30 * hp(keys, 200) + 0.42 * hp(mel, 200) + 0.40 * hp(endb, 200) + 0.35 * pad + 0.10 * brushes
    send = autopan(send) * duck_all
    verb = carve(reverb(send, ir))
    delay = carve(pingpong(hp(mel, 200) * duck_all, 0.375, fb=0.32, taps=3) * 0.16)
    music_mix = rh_d + pad_d + hats_d + brush_d + sub_d + verb + delay

    c_verb = reverb(cue_verb.x, ir)
    cue_mix = lp(cue.x, 15000, 2) + c_verb  # 音效的 click／紙纖維爆裂收在 15 kHz 以下，乾淨不刺

    # 片尾：1770 → 1794 升餘弦淡出；1794 起數位靜音
    fo = fade_env(1770, 1794)
    music_mix = music_mix * fo
    cue_mix = cue_mix * fo

    # 母帶：音樂增益 → true-peak 限幅，迭代到 -14 LUFS；音效的位置以最終 dBFS 擺好，不跟著音樂增益動
    gm = 1.0
    lu = None
    for it in range(10):
        pre = hp(music_mix * gm + cue_mix, 25, 2)
        y, gcurve = limiter(pre)
        lu = loudness(y)
        diff = TARGET_PYLN - lu
        if verbose:
            print(f'  母帶迭代 {it}: 音樂增益={db(gm):+.2f} dB  LUFS={lu:.2f}  最大壓縮={-db(gcurve.min()):.2f} dB')
        if abs(diff) < 0.02:
            break
        gm *= 10 ** (diff / 20)

    # 頭尾保險：開頭 2 ms 淡入；1794 格起全為 0
    y[:, : sec(0.002)] *= ramp(sec(0.002), 0.002)
    y[:, S(1794) :] = 0.0

    stems = {
        'music': hp(music_mix * gm, 25, 2) * gcurve,
        'cue': hp(cue_mix, 25, 2) * gcurve,
        'sub': sub_d * gm * gcurve,
        'hats': (hats_d + brush_d) * gm * gcurve,
        'gain_db': db(gm),
        'max_gr_db': -db(gcurve.min()),
        'pencil': pencil_curves,
        'parts': {k: v * gm for k, v in dict(rhodes=rh_d, pad=pad_d, sub=sub_d, hats=hats_d, brush=brush_d,
                                               verb=verb, delay=delay).items()},
        # 驗證用：各 Rhodes 分組（乾聲、過母帶增益）
        'keys': keys * gm * gcurve,
        'mel': mel_parts['mel'] * gm * gcurve,
        'cards': mel_parts['cards'] * gm * gcurve,
        'arp': mel_parts['arp'] * gm * gcurve,
        'end': endb * gm * gcurve,
    }
    return y, stems


def write_wav24(path, y):
    y = np.clip(y, -1.0, 1.0 - 1.0 / 8388608)
    q = np.ascontiguousarray(np.round(y.T * 8388607).astype('<i4'))
    b = q.view(np.uint8).reshape(-1, 4)[:, :3].tobytes()
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(3)
        w.setframerate(SR)
        w.writeframes(b)


def read_wav24(path):
    with wave.open(path, 'rb') as w:
        n, ch, sw = w.getnframes(), w.getnchannels(), w.getsampwidth()
        raw = w.readframes(n)
    a = np.frombuffer(raw, dtype=np.uint8).reshape(-1, 3)
    v = (a[:, 0].astype(np.int32) | (a[:, 1].astype(np.int32) << 8) | (a[:, 2].astype(np.int32) << 16))
    v = np.where(v >= 1 << 23, v - (1 << 24), v)
    return (v.reshape(-1, ch).T / 8388608.0), n, ch, sw


# ----------------------------------------------------------------------------
# 驗證
# ----------------------------------------------------------------------------
# (格, 事件, 類型, 看哪個分軌) 類型：perc = 瞬態起點要對齊；swell = 起點對齊、能量膨起
EVENTS = (
    [(10, '描線 S0 落筆', 'swell', 'cue')]
    + [(60, '文案 1 tick', 'perc', 'cue'), (90, '文案 2 tick', 'perc', 'cue'), (150, '量測小 tick R 180', 'perc', 'cue'),
       (170, '量測小 tick 0.4 mm', 'perc', 'cue')]
    + [(216, '細線掃下 嘶', 'swell', 'cue'), (240, '主段：Rhodes 和弦', 'perc', 'keys'), (240, '主段：sub 脈衝', 'perc', 'sub'),
       (270, '名字：換和弦 Dmaj9', 'perc', 'keys')]
    + [(f, '規格列 tick', 'perc', 'cue') for f in (360, 390, 420, 450)]
    + [(576, '往上漂走 嘶', 'swell', 'cue'), (600, '描線 S2 第 1 筆', 'swell', 'cue'), (636, '描線 S2 第 2 筆', 'swell', 'cue'),
       (692, '描線 S2 第 3 筆', 'swell', 'cue'), (700, '描線 S2 頸後', 'swell', 'cue'), (708, '描線 S2 閉眼', 'swell', 'cue'),
       (712, '描線 S2 髮流 A', 'swell', 'cue'), (716, '描線 S2 髮流 B', 'swell', 'cue')]
    + [(f, '量測標註 tick', 'perc', 'cue') for f in (750, 780, 810, 840)]
    + [(936, '細線掃過 嘶', 'swell', 'cue')]
    + [(f, '卡片 tick', 'perc', 'cue') for f in (960, 990, 1020)]
    + [(f, f'卡片 Rhodes 音 {n}', 'perc', 'cards') for f, n in ((960, 'A4'), (990, 'C#5'), (1020, 'E5'))]
    + [(f, f'上行琶音 {i + 1}', 'perc', 'arp') for i, (f, *_r) in enumerate(ARP)]
    + [(f, f'月曆 tick 第{(f - CAL_T0) // CAL_STEP + 1}天', 'perc', 'cue') for f in CAL_TICKS]
    + [(1460, '金句 1：Bm9', 'perc', 'end'), (1500, '金句 2：Gmaj9', 'perc', 'end'), (1532, '描線 S5 落款', 'swell', 'cue'),
       (1580, '名字：最後和弦 D6/9', 'perc', 'end')]
)


def _fb_ratio(mono, s0, W, search):
    """前後能量比：每個位置 p 比較 [p, p+W) 與 [p-W, p) 的能量（dB）。階躍型起音在 p = 起點時最大。"""
    lo, hi = s0 - search - W, s0 + search + W
    seg = mono[lo:hi] ** 2
    c = np.concatenate([[0.0], np.cumsum(seg)])
    p = np.arange(W, len(seg) - W + 1)
    eps = 1e-14 * W
    r = 10 * np.log10((c[p + W] - c[p] + eps) / (c[p] - c[p - W] + eps))
    pos = lo + p
    keep = np.abs(pos - s0) <= search
    r, pos = r[keep], pos[keep]
    k = int(np.argmax(r))
    return (pos[k] - s0) / SR * 1000.0, float(r[k])


_BANDS = {'全頻': None, '<150': ('lp', 150), '150-2k': ('bp', 150, 2000), '>2k': ('hp', 2000), '>3.5k': ('hp', 3500)}


# 瞬態都看高頻（tick、嘶、鉛筆、Rhodes 音叉起音都有）；低於 150 Hz 的波形週期太長，不拿來找瞬態（sub 例外）
_BANDSET = {'cue': ('全頻', '>2k', '>3.5k'), 'sub': ('全頻', '<150'), 'keys': ('全頻', '>2k', '>3.5k'),
            'mel': ('全頻', '>2k', '>3.5k'), 'cards': ('全頻', '>2k', '>3.5k'), 'arp': ('全頻', '>2k', '>3.5k'), 'end': ('全頻', '>2k', '>3.5k'), 'mix': ('全頻', '>2k', '>3.5k')}


def band_views(x, which):
    mono = x.sum(axis=0)
    out = {}
    for name, spec in _BANDS.items():
        if name not in _BANDSET[which]:
            continue
        if spec is None:
            out[name] = mono
        elif spec[0] == 'hp':
            out[name] = hp(mono, spec[1], 4)
        elif spec[0] == 'lp':
            out[name] = lp(mono, spec[1], 4)
        else:
            out[name] = bp(mono, spec[1], spec[2], 2)
    return out


def onset_in(views, s0, search=0.020, W=None):
    """在 s0±20 ms 內，用 3 ms 前後能量比找起點；取跳升最明顯的頻帶"""
    W = W or sec(0.003)
    best = None
    for name, mono in views.items():
        off, r = _fb_ratio(mono, s0, W, sec(search))
        if best is None or r > best[1]:
            best = (off, r, name)
    return best


def tap_peak(mono, s0, search=0.020):
    """落筆（鉛筆起筆）用：±20 ms 內 1 ms 能量最大的位置（落筆那一下是整段最尖的峰）"""
    k = sec(0.001)
    lo = s0 - sec(search)
    seg = mono[lo : s0 + sec(search) + k] ** 2
    c = np.concatenate([[0.0], np.cumsum(seg)])
    e = c[k:] - c[:-k]
    i = int(np.argmax(e))
    return (lo + i - s0) / SR * 1000.0


def energy_jump(mono, s0, w=0.020):
    a = mono[s0 - sec(w) : s0]
    b = mono[s0 : s0 + sec(w)]
    return 10 * np.log10((np.mean(b ** 2) + 1e-15) / (np.mean(a ** 2) + 1e-15))


def ffmpeg_ebur128(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                       capture_output=True, text=True)
    txt = r.stderr
    summ = txt[txt.rfind('Summary:') :]
    I = float(re.search(r'I:\s+(-?[\d.]+) LUFS', summ).group(1))
    LRA = float(re.search(r'LRA:\s+(-?[\d.]+) LU', summ).group(1))
    TP = float(re.search(r'Peak:\s+(-?[\d.inf]+) dBFS', summ).group(1))
    return I, TP, LRA


def verify(y, stems):
    print('\n================ 驗證 ================')
    yy, nfr, ch, sw = read_wav24(OUT_WAV)
    print(f'[長度] {nfr} 樣本，{ch} 聲道，{sw * 8}-bit → {"OK（剛好 1,440,000）" if nfr == N else "不符！"}')

    I, TP, LRA = ffmpeg_ebur128(OUT_WAV)
    print(f'[ffmpeg ebur128] Integrated = {I:.1f} LUFS，True peak = {TP:.1f} dBTP，LRA = {LRA:.1f} LU')
    print(f'[pyloudnorm]     Integrated = {loudness(yy):.2f} LUFS；音樂增益 {stems["gain_db"]:+.2f} dB，'
          f'限幅最大壓縮 {stems["max_gr_db"]:.2f} dB')

    # 頭尾
    absmax = np.abs(yy).max(axis=0)
    first_nz = int(np.argmax(absmax > 10 ** (-90 / 20)))
    nzs = np.flatnonzero(absmax > 0)
    last_nz = int(nzs[-1]) if len(nzs) else -1
    print(f'[頭] 第 0 樣本 = {yy[:, 0].tolist()}，前 5 ms 峰值 {db(np.abs(yy[:, :sec(0.005)]).max()):.1f} dBFS，'
          f'第一個 > -90 dBFS 的樣本 #{first_nz}（第 {first_nz / SPF:.2f} 格）')
    print(f'[尾] 最後一個非零樣本 #{last_nz}（第 {last_nz / SPF:.2f} 格）；1794–1800 格峰值 {np.abs(yy[:, S(1794):]).max():.1e}')
    for a, b in ((1700, 1740), (1740, 1770), (1770, 1780), (1780, 1790), (1790, 1794)):
        print(f'      {a}–{b} 格 RMS {db(np.sqrt(np.mean(yy[:, S(a):S(b)] ** 2))):.1f} dBFS')
    rl = db(np.sqrt(np.mean(yy[0] ** 2)) / np.sqrt(np.mean(yy[1] ** 2)))
    corr = float(np.corrcoef(yy[0], yy[1])[0, 1])
    print(f'[立體聲] L/R RMS 差 {rl:+.2f} dB，左右相關 {corr:.3f}，直流 {np.round(yy.mean(axis=1), 6).tolist()}')

    # 段落響度
    import pyloudnorm as pyln
    meter = pyln.Meter(SR)
    print('[段落短時響度]')
    for a, b, lab in ((0, 240, 'S0 前奏'), (240, 600, 'S1 主段'), (600, 960, 'S2'), (960, 1200, 'S3'), (1200, 1416, 'S4'),
                      (1416, 1580, 'S5 只剩 Rhodes'), (1580, 1770, '最後和弦餘韻')):
        print(f'      {a:4d}–{b:<4d} {lab:<14s} {meter.integrated_loudness(yy[:, S(a):S(b)].T):6.1f} LUFS')

    # 音效提示表逐一對位
    cue, music = stems['cue'], stems['music']
    views = {k: band_views(stems[k] if k != 'mix' else yy, k) for k in ('cue', 'sub', 'keys', 'cards', 'arp', 'end', 'mix')}
    cue_hf = hp(cue.sum(axis=0), 2000, 4)
    mus_hf = hp(music.sum(axis=0), 2000, 4)
    cue_hf3 = hp(cue.sum(axis=0), 3500, 4)
    mus_hf3 = hp(music.sum(axis=0), 3500, 4)
    mix_full = yy.sum(axis=0)
    mix_hf = hp(mix_full, 2000, 4)
    mix_tick = bp(mix_full, 3700, 4500, 3)
    print('\n[對位] 格數 | 事件 | 分軌起點偏差（3ms 前後能量比、頻帶）| 成品混音起點偏差 | 成品 ±20ms 能量跳升（全頻 / >2k）| 音效:音樂（>2k，事件後 40ms）')
    worst = dict(stem=0.0, mix=0.0)
    rows = []
    for f, name, kind, src in EVENTS:
        s0 = S(f)
        off_s, rise_s, band_s = onset_in(views[src], s0)
        if '月曆' in name:  # 很小的時鐘 tick：成品裡用 tick 本身的頻帶（3.7–4.5 kHz）找
            off_m, rise_m = _fb_ratio(mix_tick, s0, sec(0.003), sec(0.020))
            band_m = '4k帶'
        else:
            off_m, rise_m, band_m = onset_in(views['mix'], s0)
        if '描線' in name:  # 鉛筆起筆：看落筆那一下的峰值位置
            off_s, band_s = tap_peak(views['cue']['>2k'], s0), '落筆峰'
            off_m, band_m = tap_peak(views['mix']['>2k'], s0), '落筆峰'
        j_full = energy_jump(mix_full, s0)
        j_hf = energy_jump(mix_hf, s0)
        if src == 'cue':
            hi3 = '月曆' in name or '小 tick' in name
            a = (cue_hf3 if hi3 else cue_hf)[s0 : s0 + sec(0.04)]
            b = (mus_hf3 if hi3 else mus_hf)[s0 : s0 + sec(0.04)]
            ratio = f'{10 * np.log10((np.mean(a ** 2) + 1e-15) / (np.mean(b ** 2) + 1e-15)):+5.1f} dB{"（>3.5k）" if hi3 else ""}'
        else:
            ratio = '  （音樂事件）'
        if kind == 'perc':
            worst['stem'] = max(worst['stem'], abs(off_s))
            worst['mix'] = max(worst['mix'], abs(off_m))
        flag = '' if (kind != 'perc' or abs(off_s) <= 5.0) else '  <-- 超過 5 ms'
        rows.append((f, name, kind, off_s, off_m, j_full, j_hf))
        print(f'  {f:5d} | {name:<22s} | {src:5s} {off_s:+6.2f} ms（{rise_s:+5.1f} dB, {band_s:>6s}）| '
              f'{off_m:+6.2f} ms（{rise_m:+5.1f} dB, {band_m:>6s}）| {j_full:+5.1f} / {j_hf:+5.1f} dB | {ratio}{flag}')
    print(f'  打擊類最大起點偏差：分軌 {worst["stem"]:.2f} ms；成品混音 {worst["mix"]:.2f} ms')

    # 鉛筆沙沙聲：量到的 >2k 能量包絡 vs 設計的筆速曲線
    print('\n[鉛筆] 成品 >2 kHz 的 50 ms RMS 包絡 與 筆速曲線 的相關係數')
    for key, (a0, env) in stems['pencil'].items():
        n = len(env)
        hop = SPF // 2
        m_mix = hp(yy.sum(axis=0)[a0 : a0 + n], 2000, 4) ** 2
        m_cue = cue_hf[a0 : a0 + n] ** 2
        k = sec(0.05)
        sm = np.sqrt(np.convolve(m_mix, np.ones(k) / k, mode='same'))[::hop]
        sc = np.sqrt(np.convolve(m_cue, np.ones(k) / k, mode='same'))[::hop]
        ev = env[::hop]
        r_mix = float(np.corrcoef(sm, ev)[0, 1])
        r_cue = float(np.corrcoef(sc, ev)[0, 1])
        hf_m = mus_hf[a0 : a0 + n]
        snr = 10 * np.log10(np.mean(m_cue) / (np.mean(hf_m ** 2) + 1e-15))
        print(f'  {key}: 格 {a0 / SPF:.0f}–{(a0 + n) / SPF:.0f}，r(成品) = {r_mix:.3f}，r(音效分軌) = {r_cue:.3f}，'
              f'>2k 音效:音樂 = {snr:+.1f} dB')

    # 嘶：整段能量
    print('\n[嘶] 事件 24 格內 >2 kHz 音效:音樂')
    for f in (216, 576, 936):
        a0, a1 = S(f), S(f + 24)
        r = 10 * np.log10(np.mean(cue_hf[a0:a1] ** 2) / (np.mean(mus_hf[a0:a1] ** 2) + 1e-15))
        L = stems['cue'][0, a0:a1]
        R = stems['cue'][1, a0:a1]
        h = len(L) // 2
        pan1 = db(np.sqrt(np.mean(L[:h] ** 2)) / np.sqrt(np.mean(R[:h] ** 2)))
        pan2 = db(np.sqrt(np.mean(L[h:] ** 2)) / np.sqrt(np.mean(R[h:] ** 2)))
        print(f'  {f}: {r:+.1f} dB；前半 L-R {pan1:+.1f} dB → 後半 L-R {pan2:+.1f} dB')

    # 1416 鼓與 sub 退出
    low = lp(yy.sum(axis=0), 120, 4)
    hi8 = hp(yy.sum(axis=0), 7000, 4)

    def rms(x, a, b):
        return db(np.sqrt(np.mean(x[S(a):S(b)] ** 2)))

    print(f'\n[1416 退場] <120 Hz：1386–1416 {rms(low, 1386, 1416):.1f} dBFS → 1422–1452 {rms(low, 1422, 1452):.1f} dBFS；'
          f'sub 分軌 1420 後峰值 {db(np.abs(stems["sub"][:, S(1420):]).max()):.1f} dBFS；'
          f'hi-hat/刷鼓分軌 1416 後峰值 {db(np.abs(stems["hats"][:, S(1416):]).max()):.1f} dBFS')
    print(f'             >7 kHz：1386–1416 {rms(hi8, 1386, 1416):.1f} dBFS → 1422–1452 {rms(hi8, 1422, 1452):.1f} dBFS')
    cal_pk = db(np.abs(stems['cue'][:, S(CAL_T0):S(1350)]).max())
    print(f'[月曆] 留空的日子（rng(7)）= 第 {[d + 1 for d in OPEN_DAYS]} 天（索引 {OPEN_DAYS}）；tick 共 {len(CAL_TICKS)} 個，'
          f'峰值 {cal_pk:.1f} dBFS')
    return dict(I=I, TP=TP, LRA=LRA, frames=nfr, rows=rows, worst=worst)


def pictures(y):
    wav_png = os.path.join(OUT_DIR, 'akira_waveform.png')
    spec_png = os.path.join(OUT_DIR, 'akira_spectrum.png')
    subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', OUT_WAV, '-filter_complex',
                    'showwavespic=s=1800x500:split_channels=1:colors=0xE8DCC8|0x8F877B:scale=sqrt', '-frames:v', '1',
                    wav_png], check=True)
    subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', OUT_WAV, '-lavfi',
                    'showspectrumpic=s=1800x700:legend=1:scale=log:color=intensity', '-frames:v', '1', spec_png],
                   check=True)
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        from matplotlib import font_manager
        for fp in ('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',):
            if os.path.exists(fp):
                font_manager.fontManager.addfont(fp)
        plt.rcParams['font.family'] = ['Noto Sans CJK TC', 'Noto Sans CJK JP', 'DejaVu Sans']
        mono = y.mean(axis=0)
        win = sec(0.4)
        pw = np.convolve(mono ** 2, np.ones(win) / win, mode='same')[::SPF]
        hfp = np.convolve(hp(mono, 2000, 4) ** 2, np.ones(sec(0.03)) / sec(0.03), mode='same')[::SPF // 4]
        fig, (ax, ax1, ax2) = plt.subplots(3, 1, figsize=(18, 12), dpi=100, sharex=True,
                                           gridspec_kw=dict(height_ratios=[1, 0.8, 1.4]))
        ax.plot(np.arange(len(pw)), 10 * np.log10(pw + 1e-12), color='#141210', lw=1)
        ax.set_ylim(-70, 0)
        ax.set_xlim(0, 1800)
        for a, b, lab, col in ((0, 240, 'S0 鉛筆＋空氣墊音', '#eee'), (240, 600, 'S1 Rhodes＋sub', '#efe4d0'),
                               (600, 960, 'S2 ＋hat／旋律', '#e8dcc8'), (960, 1200, 'S3 卡片音＋刷鼓', '#efe4d0'),
                               (1200, 1416, 'S4 月曆時鐘', '#e8dcc8'), (1416, 1580, 'S5 只剩 Rhodes', '#f4efe6'),
                               (1580, 1770, '最後和弦餘韻', '#f8f5ef'), (1770, 1800, '淡出', '#ddd')):
            ax.axvspan(a, b, color=col, alpha=0.8, lw=0)
            ax.text((a + b) / 2, -4, lab, ha='center', va='top', fontsize=9)
        for f, name, kind, src in EVENTS:
            ax.axvline(f, color='#b5452f' if src == 'cue' else '#2f6db5', lw=0.6, alpha=0.6)
        ax.set_ylabel('400ms RMS (dBFS)')
        ax.set_title('akira.wav 結構：短時能量＋音效提示表事件（紅＝音效、藍＝音樂事件）')
        ax1.plot(np.arange(len(hfp)) / 4, 10 * np.log10(hfp + 1e-14), color='#8f5a2f', lw=0.7)
        ax1.set_ylim(-95, -15)
        ax1.set_ylabel('>2kHz 30ms RMS')
        fq, tt, Z = signal.stft(mono, fs=SR, nperseg=4096, noverlap=4096 - 400)
        P = 20 * np.log10(np.abs(Z) + 1e-9)
        keep = (fq >= 30) & (fq <= 16000)
        ax2.pcolormesh(tt * FPS, fq[keep], P[keep], shading='auto', cmap='magma', vmin=-115, vmax=-25)
        ax2.set_yscale('log')
        ax2.set_ylim(30, 16000)
        ax2.set_ylabel('Hz（對數）')
        for f0 in (240, 600, 960, 1200, 1416, 1580, 1770):
            ax2.axvline(f0, color='#4FC3F7', lw=0.8)
        ax2.set_xlabel('格（60 fps）')
        fig.tight_layout()
        fig.savefig(os.path.join(OUT_DIR, 'akira_timeline.png'))
        plt.close(fig)
    except Exception as e:  # matplotlib 不在也不影響主流程
        print('timeline 圖略過：', e)
    return wav_png, spec_png


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--no-verify', action='store_true')
    args = ap.parse_args()
    os.makedirs(OUT_DIR, exist_ok=True)
    print('合成中…')
    y, stems = mixdown()
    assert y.shape == (2, N)
    write_wav24(OUT_WAV, y)
    print(f'寫出 {OUT_WAV}')
    if not args.no_verify:
        verify(y, stems)
        pictures(y)
        print('圖：out/audio/akira_waveform.png、akira_spectrum.png、akira_timeline.png')


if __name__ == '__main__':
    main()
