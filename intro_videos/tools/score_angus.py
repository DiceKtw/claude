#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
安格斯｜介紹影片　原創配樂＋全部音效（numpy / scipy 從零合成，不用任何取樣音檔）

用法（在 intro_videos/ 底下）：
    python3 tools/score_angus.py              # 合成 → 母帶 → out/audio/angus.wav，並跑驗證、輸出圖
    python3 tools/score_angus.py --no-verify  # 只合成

規格：48 kHz、立體聲、24-bit PCM、剛好 1,440,000 樣本（30.000 秒 = 1800 格 @60fps）
      120 BPM：1 拍 = 30 格 = 24000 樣本；第 f 格 = 第 f*800 樣本
      響度 -14 LUFS（integrated），true peak <= -1.0 dBTP
      確定性：所有雜訊都來自固定 seed 的 numpy Generator，每次執行輸出相同

配樂結構（F 大調，旋律與和聲全部原創）：
  0–240      前奏：只有木琴/馬林巴（球的音效本身就是旋律）＋輕墊音 Dm(add9)，落地音一路往上爬
  240        drop：大鼓四拍＋反拍拍手＋反拍貝斯＋馬林巴切分伴奏（F → Am7 → B♭maj7 → C7 → Dm7 …）
  480        馬林巴主旋律進來；S3（840–1080）旋律讓位給翻卡木琴音
  1320–1440  蒙太奇：全八分音符推進（貝斯、馬林巴和弦、木魚），1425 重擊
  1440–1500  抽掉鼓與貝斯，C7sus4 上行琶音＋上升滑音＋6 個「噗」
  1500       回來：大重拍＋shimmer（F → Am7 → B♭maj7 → C7）
  1740       最後一個 F(add9) 和弦重拍（馬林巴滾奏餘韻），1788 前淡出，1790 一聲「啵」，1797 起數位靜音
"""
import argparse
import os
import re
import subprocess
import sys
import wave

import numpy as np
from scipy import signal
from scipy.ndimage import maximum_filter1d, minimum_filter1d

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'out', 'audio')
OUT_WAV = os.path.join(OUT_DIR, 'angus.wav')

SR = 48000
FPS = 60
SPF = SR // FPS  # 每格 800 樣本
N = 1_440_000  # 1800 格
BEAT_F = 30  # 1 拍 = 30 格
S16 = SPF * BEAT_F // 4  # 16 分音符 = 6000 樣本

TARGET_LUFS = -14.0
LIMIT_CEIL_DB = -1.5  # 限幅器內部天花板（留 0.5 dB 給 true peak 量測差）
HUM_PEAK_DBFS = -18.0  # 14 格的負面低音嗡：最終檔案中的峰值
MUSIC_GAIN = 0.85  # 音樂床相對音效的總量

rng = np.random.default_rng(20261003)  # 固定 seed：確定性


def S(frame):
    """格數 → 樣本位置"""
    return int(round(frame * SPF))


def sec(x):
    return int(round(x * SR))


def tv(n):
    return np.arange(n) / SR


def noise(n):
    return rng.standard_normal(n)


_NOTE = dict(C=0, D=2, E=4, F=5, G=7, A=9, B=11)


def hz(name):
    m = re.fullmatch(r'([A-G])([b#]?)(-?\d)', name)
    semis = _NOTE[m.group(1)] + {'': 0, 'b': -1, '#': 1}[m.group(2)]
    midi = 12 * (int(m.group(3)) + 1) + semis
    return 440.0 * 2 ** ((midi - 69) / 12)


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


def burst(n, lo, hi, tau, head=0.002):
    """以開頭峰值正規化的濾波雜訊爆裂（瞬態從第 0 樣本開始）"""
    z = bp(noise(n), lo, hi)
    z = z / (np.max(np.abs(z[: max(8, sec(head))])) + 1e-12)
    return z * np.exp(-tv(n) / tau)


class Bus:
    def __init__(self):
        self.x = np.zeros((2, N))

    def add(self, sig, start, gain=1.0, pan=0.0):
        sig = np.asarray(sig, dtype=float)
        if sig.ndim == 1:
            th = (pan + 1) * np.pi / 4
            sig = np.vstack([sig * np.cos(th), sig * np.sin(th)]) * np.sqrt(2)
        if start >= N:
            return
        n = min(sig.shape[1], N - start)
        self.x[:, start : start + n] += gain * sig[:, :n]


# ----------------------------------------------------------------------------
# 樂器（全部是物理模態／加法合成）
# ----------------------------------------------------------------------------
def modal(f, ratios, amps, taus, knock_band, knock_amp, knock_tau, length, att=0.0008):
    n = sec(length)
    t = tv(n)
    s = np.zeros(n)
    for r, a, tau in zip(ratios, amps, taus):
        fq = f * r
        if fq >= 19000:
            continue
        s += a * np.sin(2 * np.pi * fq * t) * np.exp(-t / tau)
    if knock_amp > 0:
        m = min(n, sec(knock_tau * 10))
        s[:m] += knock_amp * burst(m, *knock_band, knock_tau)
    s *= ramp(n, att)
    return tail(s, 0.006)


def marimba(f, bright=1.0, decay=1.0):
    """馬林巴：1 : 3.93 : 9.2 的木琴條模態，低音區共鳴長"""
    tau = float(np.clip(0.8 * (262 / f) ** 0.8, 0.09, 1.5)) * decay
    return modal(f, (1.0, 3.93, 9.2), (1.0, 0.30 * bright, 0.07 * bright),
                 (tau, tau * 0.2, tau * 0.06), (1200, 4500), 0.10 * bright, 0.0012, min(tau * 5, 4.0))


def xylo(f, bright=1.0, decay=1.0):
    """木琴：1 : 3 : 6.1 模態，短、亮、敲擊感強"""
    tau = float(np.clip(0.40 * (523 / f) ** 0.6, 0.07, 0.9)) * decay
    return modal(f, (1.0, 3.0, 6.1, 10.3), (1.0, 0.45 * bright, 0.15 * bright, 0.05 * bright),
                 (tau, tau * 0.32, tau * 0.12, tau * 0.06), (2500, 9000), 0.18 * bright, 0.0008,
                 min(tau * 5, 3.0))


def bell(f, decay=1.0):
    """小鈴（自由金屬條模態 1 : 2.76 : 5.40 : 8.93）"""
    return modal(f, (1.0, 2.76, 5.40, 8.93), (1.0, 0.32, 0.14, 0.06),
                 (1.0 * decay, 0.35 * decay, 0.15 * decay, 0.07 * decay), (4000, 12000), 0.08, 0.0006,
                 3.0 * decay)


def marimba_roll(f, dur, rate=13.0, seed_off=0.0):
    """馬林巴滾奏：同一音以 rate 次/秒反覆輕敲，力度漸弱 → 和弦餘韻"""
    n = sec(dur + 1.5)
    out = np.zeros(n)
    k = 0
    while True:
        t0 = k / rate + seed_off
        if t0 >= dur:
            break
        s0 = sec(t0)
        v = (1.0 if k == 0 else 0.42) * np.exp(-t0 / (dur * 0.55))
        m = marimba(f, bright=0.8 if k == 0 else 0.45)
        m = m[: n - s0]
        out[s0 : s0 + len(m)] += v * m
        k += 1
    return tail(out, 0.05)


def pad(freqs, dur, att=0.15, rel=0.35, fc=1300.0):
    """暖墊音：每個音 3 支微走音的帶限鋸齒波（加法合成）＋慢顫音，左右展開"""
    n = sec(dur + rel)
    t = tv(n)
    L = np.zeros(n)
    R = np.zeros(n)
    for i, f in enumerate(freqs):
        for v, (cents, pan) in enumerate(((-7, -0.7), (0, 0.0), (7, 0.7))):
            fv = f * 2 ** (cents / 1200)
            vib = 1 + 0.0012 * np.sin(2 * np.pi * (0.23 + 0.07 * v + 0.05 * i) * t + 1.3 * i + 2.1 * v)
            ph = osc_phase(fv * vib)
            s = np.zeros(n)
            for k in range(1, 31):
                if k * fv > 6000:
                    break
                a = (1 / k) / (1 + (k * fv / fc) ** 4)
                if a < 0.003:
                    break
                s += a * np.sin(k * ph + 0.7 * k * (i + 1) * (v + 1))
            th = (pan + 1) * np.pi / 4
            L += s * np.cos(th)
            R += s * np.sin(th)
    env = ramp(n, att)
    k = sec(rel)
    env[n - k :] *= 0.5 + 0.5 * np.cos(np.pi * (np.arange(k) + 1) / k)
    st = hp(np.vstack([L, R]) * env, 140)
    return norm(st)


def bass(f, dur, decay=0.14):
    """彈撥感貝斯：正弦＋2、3 次諧波（手機喇叭也聽得到），tanh 輕飽和"""
    n = sec(dur + 0.03)
    t = tv(n)
    env = ramp(n, 0.002) * (0.3 + 0.7 * np.exp(-t / decay))
    k = sec(0.03)
    env[n - k :] *= 0.5 + 0.5 * np.cos(np.pi * (np.arange(k) + 1) / k)
    ph = 2 * np.pi * f * t
    s = np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)
    return np.tanh(1.4 * s * env) / np.tanh(1.4)


def kick(decay=0.26, click=0.25, punch=1.0):
    n = sec(0.55)
    t = tv(n)
    f = 50 + 100 * punch * np.exp(-t / 0.03) + 260 * np.exp(-t / 0.004)
    body = np.sin(osc_phase(f)) * np.exp(-np.maximum(t - 0.015, 0) / decay)
    clk = hp(noise(n), 2500)
    clk = clk / (np.max(np.abs(clk[:96])) + 1e-12) * np.exp(-t / 0.0011)
    s = (body + click * clk) * ramp(n, 0.0003)
    return tail(s, 0.03)


def clap(tail_s=0.12):
    n = sec(0.45)
    t = tv(n)
    nz = bp(noise(n), 900, 3200)
    nz = nz / np.std(nz)
    env = np.zeros(n)
    for ti, a in ((0.0, 1.0), (0.008, 0.75), (0.016, 0.65), (0.024, 0.9)):
        m = t >= ti
        env[m] += a * np.exp(-(t[m] - ti) / 0.0032)
    m = t >= 0.024
    env[m] += 0.45 * np.exp(-(t[m] - 0.024) / tail_s)
    return tail(norm(nz * env * ramp(n, 0.0002)), 0.02)


def hat(decay=0.035):
    n = sec(max(decay * 6, 0.05))
    s = hp(noise(n), 7000, 4) * np.exp(-tv(n) / decay) * ramp(n, 0.0003)
    return tail(norm(s), 0.005)


def shaker():
    n = sec(0.08)
    t = tv(n)
    s = bp(noise(n), 5000, 12000) * ramp(n, 0.006) * np.exp(-t / 0.025)
    return tail(norm(s), 0.005)


def crash(decay=0.9):
    n = sec(decay * 3.5)
    t = tv(n)
    nz = hp(noise(n), 3500)
    nz = nz / np.std(nz)
    met = sum(np.sin(2 * np.pi * f * t + p) for f, p in ((3150, 0.3), (4270, 1.1), (5590, 2.0), (6770, 0.6), (8130, 2.7)))
    s = lp((nz + 0.35 * met) * np.exp(-t / decay) * ramp(n, 0.0005), 11000)
    return tail(norm(s), 0.05)


def sub_boom(decay=0.5):
    n = sec(decay * 4)
    t = tv(n)
    f = 44 + 55 * np.exp(-t / 0.06)
    s = np.sin(osc_phase(f)) * np.exp(-t / decay) * ramp(n, 0.001)
    return tail(s, 0.05)


def woodblock(f):
    """蒙太奇短打擊：木魚模態＋小鼓身"""
    n = sec(0.16)
    t = tv(n)
    s = (np.sin(2 * np.pi * f * t) * np.exp(-t / 0.04)
         + 0.45 * np.sin(2 * np.pi * 2.42 * f * t) * np.exp(-t / 0.014)
         + 0.20 * np.sin(2 * np.pi * 4.1 * f * t) * np.exp(-t / 0.006))
    body = np.sin(osc_phase(110 + 70 * np.exp(-t / 0.02))) * np.exp(-t / 0.05) * 0.7
    clk = burst(n, 2500, 9000, 0.0007) * 0.35
    return tail(norm((s + body + clk) * ramp(n, 0.0003)), 0.01)


def whoosh(dur, f0, f1, width=0.6, peak=0.6, floor=0.35, att=0.008, pan0=0.0, pan1=0.0, flutter=0.0):
    """白噪＋隨時間掃頻的帶通（STFT 遮罩），起點有一小口氣讓起始對齊該格"""
    n = sec(dur)
    x = noise(n + 2048)
    nper, nov = 1024, 768
    fq, tt, Z = signal.stft(x, fs=SR, nperseg=nper, noverlap=nov)
    u = np.clip(tt / dur, 0, 1)
    fc = f0 * (f1 / f0) ** u
    lf = np.log2(np.maximum(fq, 1.0))[:, None] - np.log2(fc)[None, :]
    _, y = signal.istft(Z * np.exp(-0.5 * (lf / width) ** 2), fs=SR, nperseg=nper, noverlap=nov)
    y = y[:n]
    t = tv(n)
    uu = t / dur
    shape = np.where(uu < peak, (uu / peak) ** 1.2, ((1 - uu) / (1 - peak)) ** 1.6)
    env = np.maximum(shape, floor * np.exp(-uu * 4)) * ramp(n, att)
    if flutter:
        env *= 1 - 0.45 * (0.5 - 0.5 * np.cos(2 * np.pi * flutter * t))
    y = norm(tail(y * env, 0.015))
    th = (np.linspace(pan0, pan1, n) + 1) * np.pi / 4
    return np.vstack([y * np.cos(th), y * np.sin(th)]) * np.sqrt(2)


def slide(f0, f1, dur):
    """上行滑音（音高 riser）"""
    n = sec(dur)
    t = tv(n)
    u = t / dur
    f = f0 * (f1 / f0) ** (u ** 1.4)
    ph = osc_phase(f * (1 + 0.008 * u * np.sin(2 * np.pi * 6.0 * t)))
    s = np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
    s = s * ramp(n, 0.006) * (0.25 + 0.75 * u ** 1.6)
    return norm(tail(s, 0.02))


def shimmer(freqs, dur=1.8, grains=16, gap=0.021):
    """亮的閃音：開頭三個鐘音齊響＋高頻閃光（明確的起點），之後鐘音顆粒快速上行灑開＋空氣顫音"""
    n = sec(dur)
    t = tv(n)
    L = np.zeros(n)
    R = np.zeros(n)
    seq = list(freqs) + [f * 2 for f in freqs]

    def grain(f, m):
        tt = tv(m)
        return (np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.55)
                + 0.45 * np.sin(2 * np.pi * 2.76 * f * tt) * np.exp(-tt / 0.16)) * ramp(m, 0.0004)

    for j, f in enumerate(freqs[:3]):  # 起點：三音齊響
        g = grain(f, n) * 0.7
        th = (((j - 1) * 0.5) + 1) * np.pi / 4
        L += g * np.cos(th)
        R += g * np.sin(th)
    for i in range(1, grains):
        f = seq[i % len(seq)]
        s0 = sec(i * gap)
        m = n - s0
        g = grain(f, m) * 0.42 * (0.9 ** i)
        pan = (-0.75 if i % 2 else 0.75) * (0.4 + 0.6 * ((i * 37) % 11) / 10)
        th = (pan + 1) * np.pi / 4
        L[s0:] += g * np.cos(th)
        R[s0:] += g * np.sin(th)
    for ch in (L, R):
        air = hp(noise(n), 6500, 4)
        air = air / np.std(air) * ramp(n, 0.0003)
        ch += air * (0.10 * np.exp(-t / 0.5) * (1 + 0.5 * np.sin(2 * np.pi * 13 * t)) + 0.45 * np.exp(-t / 0.006))
    return norm(tail(np.vstack([L, R]), 0.1))


def tick(f=3600.0):
    n = sec(0.03)
    t = tv(n)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.0035) + 0.5 * burst(n, 5000, 14000, 0.0007)
    return tail(norm(s * ramp(n, 0.0002)), 0.003)


def tick_light(f=5600.0, ping=2640.0):
    """輕 tick：很高的「嗒」＋一點玻璃感短 ping，避開拍手頻帶也聽得到"""
    n = sec(0.06)
    t = tv(n)
    s = (np.sin(2 * np.pi * f * t) * np.exp(-t / 0.003) + 0.45 * np.sin(2 * np.pi * ping * t) * np.exp(-t / 0.018)
         + 0.6 * burst(n, 6000, 15000, 0.0006))
    return tail(norm(s * ramp(n, 0.0002)), 0.004)


def tickpop(f):
    n = sec(0.22)
    t = tv(n)
    ph = osc_phase(f * (1 + 0.45 * np.exp(-t / 0.006)))
    s = (np.sin(ph) * np.exp(-t / 0.06) + 0.22 * np.sin(2 * ph) * np.exp(-t / 0.02)
         + 0.08 * np.sin(3 * ph) * np.exp(-t / 0.01))
    tk = tick(min(f * 2.5, 7000))
    s[: len(tk)] += 0.35 * tk
    return tail(norm(s * ramp(n, 0.0003)), 0.01)


def paper():
    """紙片翻動「啪」：兩三下彼此錯開的高頻雜訊爆裂＋一點紙身"""
    n = sec(0.14)
    t = tv(n)
    nz = bp(noise(n), 1300, 7500)
    nz = nz / np.std(nz)
    env = np.exp(-t / 0.005)
    for ti, a, tau in ((0.012, 0.7, 0.010), (0.028, 0.35, 0.018)):
        m = t >= ti
        env[m] += a * np.exp(-(t[m] - ti) / tau)
    body = np.sin(osc_phase(300 - 120 * t / 0.14)) * np.exp(-t / 0.02)
    return tail(norm((nz * env + 1.2 * body) * ramp(n, 0.0003)), 0.01)


def puff(f):
    """「噗」：快速下滑的短正弦＋低通氣音"""
    n = sec(0.10)
    t = tv(n)
    s = np.sin(osc_phase(f * (1 + 1.1 * np.exp(-t / 0.005)))) * np.exp(-t / 0.028)
    air = lp(noise(n), 2000)
    air = air / np.std(air) * np.exp(-t / 0.007) * 0.25
    return tail(norm((s + air) * ramp(n, 0.0006)), 0.01)


def bloop(f0=380.0, f1=950.0):
    """「啵」：泡泡式上滑短音"""
    n = sec(0.07)
    t = tv(n)
    f = f0 + (f1 - f0) * (1 - np.exp(-t / 0.010))
    return tail(norm(np.sin(osc_phase(f)) * np.exp(-t / 0.015) * ramp(n, 0.0012)), 0.012)


def keyclick(i):
    n = sec(0.045)
    t = tv(n)
    clk = burst(n, 2200, 9000, 0.0018)
    th = np.sin(2 * np.pi * (175 + 23 * ((i * 5) % 7)) * t) * np.exp(-t / 0.009) * 0.6
    return tail(norm((clk + th) * ramp(n, 0.0002)), 0.004)


def hum(dur=0.42):
    """負面低音嗡：E2 + F2 小二度（4.9 Hz 拍頻），帶限鋸齒，音高微微往下沉"""
    n = sec(dur)
    t = tv(n)
    sag = 1 - 0.04 * t / dur
    s = np.zeros(n)
    for f in (hz('E2'), hz('F2')):
        ph = osc_phase(f * sag)
        for k in range(1, 12):
            s += (1 / k) / (1 + (k * f / 450) ** 2) * np.sin(k * ph)
    return tail(norm(s * ramp(n, 0.006) * np.exp(-t / 0.22)), 0.04)


def bounce_dong(f):
    """球落地「咚」：馬林巴＋木琴混音色＋落地小悶聲"""
    n_m = marimba(f, bright=1.1, decay=0.8)
    x = xylo(f, bright=0.6, decay=0.6)
    out = np.zeros(max(len(n_m), len(x)))
    out[: len(n_m)] += n_m
    out[: len(x)] += 0.35 * x
    m = sec(0.08)
    tt = tv(m)
    out[:m] += 0.45 * np.sin(osc_phase(150 - 50 * tt / 0.08)) * np.exp(-tt / 0.022) * ramp(m, 0.0005)
    return norm(out)


# ----------------------------------------------------------------------------
# 空間：合成殘響 IR、乒乓延遲、側鏈
# ----------------------------------------------------------------------------
def make_ir(rt=1.4, length=1.9, pre=0.014):
    n = sec(length)
    t = tv(n)
    ir = np.zeros((2, n))
    for c in range(2):
        x = noise(n) * np.exp(-6.91 * t / rt)
        xl = lp(x, 3200)
        w = np.clip(t / (rt * 0.45), 0, 1)
        x = x * (1 - w) + xl * w
        x[: sec(pre)] = 0
        x[sec(pre) : sec(pre) + sec(0.004)] *= ramp(sec(0.004), 0.004)
        ir[c] = x / np.sqrt(np.sum(x ** 2))
    return ir


def reverb(send, ir):
    mono = send.sum(axis=0) * 0.5
    side = (send[0] - send[1]) * 0.5
    L = signal.fftconvolve(mono + 0.6 * side, ir[0])[:N]
    R = signal.fftconvolve(mono - 0.6 * side, ir[1])[:N]
    return hp(np.vstack([L, R]), 180)


def pingpong(x, delay_s, fb=0.35, taps=4):
    d = sec(delay_s)
    out = np.zeros_like(x)
    src = x.sum(axis=0) * 0.5
    src = lp(hp(src, 300), 5000)
    for k in range(1, taps + 1):
        sh = d * k
        if sh >= N:
            break
        ch = (k + 1) % 2
        out[ch, sh:] += (fb ** (k - 1)) * src[: N - sh]
    return out


def duck_curve(starts, depth, rel=0.12, att=0.004):
    d = np.ones(N)
    L = sec(0.6)
    t = tv(L)
    seg = 1 - depth * np.where(t < att, t / att, np.exp(-(t - att) / rel))
    for s0 in starts:
        m = min(L, N - s0)
        d[s0 : s0 + m] = np.minimum(d[s0 : s0 + m], seg[:m])
    return d


# ----------------------------------------------------------------------------
# 編曲
# ----------------------------------------------------------------------------
# (起格, 迄格, 墊音, 馬林巴伴奏, 貝斯根音)
CHORDS = [
    (0, 240, ['D3', 'A3', 'E4', 'F4'], None, None),              # 前奏 Dm(add9)
    (240, 360, ['F3', 'C4', 'G4', 'A4'], ['F4', 'A4', 'C5'], 'F2'),   # F(add9)
    (360, 480, ['A3', 'E4', 'G4', 'C5'], ['E4', 'G4', 'C5'], 'A1'),   # Am7
    (480, 600, ['Bb3', 'D4', 'F4', 'A4'], ['D4', 'F4', 'A4'], 'Bb1'),  # B♭maj7
    (600, 720, ['Bb3', 'C4', 'E4', 'G4'], ['E4', 'G4', 'Bb4'], 'C2'),  # C7
    (720, 840, ['A3', 'C4', 'D4', 'F4'], ['F4', 'A4', 'C5'], 'D2'),   # Dm7
    (840, 960, ['Bb3', 'D4', 'F4', 'A4'], ['D4', 'F4', 'A4'], 'Bb1'),  # B♭maj7
    (960, 1020, ['G3', 'Bb3', 'D4', 'F4'], ['D4', 'F4', 'Bb4'], 'G1'),  # Gm7
    (1020, 1080, ['Bb3', 'C4', 'E4', 'G4'], ['E4', 'G4', 'Bb4'], 'C2'),  # C7
    (1080, 1200, ['A3', 'C4', 'D4', 'F4'], ['F4', 'A4', 'C5'], 'D2'),  # Dm7
    (1200, 1320, ['Bb3', 'D4', 'F4', 'A4'], ['D4', 'F4', 'A4'], 'Bb1'),  # B♭maj7
    (1320, 1380, ['G3', 'Bb3', 'D4', 'F4'], ['D5', 'F5', 'Bb5'], 'G1'),  # Gm7（蒙太奇）
    (1380, 1440, ['Bb3', 'C4', 'E4', 'G4'], ['E5', 'G5', 'Bb5'], 'C2'),  # C7（蒙太奇）
    (1440, 1500, ['Bb3', 'C4', 'F4', 'G4'], None, None),           # C7sus4 上升段（無鼓無貝斯）
    (1500, 1560, ['F3', 'C4', 'G4', 'A4'], ['F4', 'A4', 'C5'], 'F2'),
    (1560, 1620, ['A3', 'E4', 'G4', 'C5'], ['E4', 'G4', 'C5'], 'A1'),
    (1620, 1680, ['Bb3', 'D4', 'F4', 'A4'], ['D4', 'F4', 'A4'], 'Bb1'),
    (1680, 1740, ['Bb3', 'C4', 'E4', 'G4'], ['E4', 'G4', 'Bb4'], 'C2'),
    (1740, 1800, ['F3', 'C4', 'G4', 'A4'], None, 'F2'),            # 最後和弦 F(add9)
]


def chord_at(frame):
    for c in CHORDS:
        if c[0] <= frame < c[1]:
            return c
    return CHORDS[-1]


# 主旋律（馬林巴）：(小節起格, 16 分音符位置, 音名)
MELODY = [
    # B♭maj7（480）
    (480, 0, 'F5'), (480, 3, 'A5'), (480, 6, 'C6'), (480, 8, 'A5'), (480, 10, 'G5'), (480, 12, 'F5'), (480, 14, 'G5'),
    # C7（600）
    (600, 0, 'E5'), (600, 3, 'G5'), (600, 6, 'C6'), (600, 8, 'Bb5'), (600, 11, 'A5'), (600, 12, 'G5'),
    # Dm7（720）——750 讓給「叮咚」
    (720, 0, 'A5'), (720, 2, 'C6'), (720, 8, 'D6'), (720, 10, 'C6'), (720, 12, 'A5'), (720, 14, 'F5'),
    # B♭maj7（840）——之後讓給翻卡木琴
    (840, 0, 'D5'), (840, 2, 'F5'), (840, 4, 'A5'),
    # Gm7 → C7（960）
    (960, 4, 'Bb5'), (960, 6, 'A5'), (960, 8, 'G5'), (960, 10, 'E5'), (960, 12, 'G5'), (960, 14, 'Bb5'),
    # Dm7（1080）——1110 起讓給滑音
    (1080, 0, 'D6'), (1080, 2, 'C6'),
    # B♭maj7（1200）——後半小節往蒙太奇推
    (1200, 8, 'F5'), (1200, 10, 'A5'), (1200, 11, 'C6'), (1200, 12, 'D6'), (1200, 14, 'F6'),
    # 回來段（1500 起，每 60 格換和弦）
    (1500, 3, 'A5'), (1500, 6, 'C6'),
    (1560, 3, 'C6'), (1560, 6, 'G5'),
    (1620, 0, 'D6'), (1620, 2, 'C6'),
    # 往最後和弦的上行引句
    (1680, 4, 'E5'), (1680, 5, 'G5'), (1680, 6, 'Bb5'), (1680, 7, 'C6'),
]


def at(bar_frame, pos16):
    return S(bar_frame) + pos16 * S16


def build():
    music = {k: Bus() for k in ('kick', 'clap', 'hats', 'bass', 'pad', 'comp', 'mel', 'roll')}
    cue = Bus()  # 音效提示表上的全部事件
    cue_verb = Bus()  # 音效的殘響送出
    hum_bus = Bus()
    kicks = []
    cue_marks = []  # 用來讓旋律避開音效
    duck_marks = []  # 輕音效：觸發時把音樂壓低幾 dB（音效不被蓋掉）

    # 增益（混音前）
    KICK, CLAP, HAT, OHAT, SHK = 0.56, 0.24, 0.060, 0.050, 0.030
    BASS, PAD, COMP, MEL = 0.26, 0.13, 0.095, 0.19

    # ---------------- 墊音 ----------------
    for f0, f1, padn, _, _ in CHORDS:
        dur = (f1 - f0) / FPS
        if f0 == 0:
            p, g = pad([hz(x) for x in padn], dur, att=1.4, rel=0.3), PAD * 0.9
        elif f0 == 1440:
            p, g = pad([hz(x) for x in padn], dur, att=0.9, rel=0.25), PAD * 1.2
        elif f0 == 1740:
            p, g = pad([hz(x) for x in padn], 0.75, att=0.03, rel=0.6), PAD * 1.1
        else:
            p, g = pad([hz(x) for x in padn], dur, att=0.12, rel=0.35), PAD
        music['pad'].add(p, S(f0), g)

    # ---------------- 鼓組 ----------------
    heavy_frames = {240, 270, 1425, 1500, 1560, 1740}
    groove = list(range(240, 1440, BEAT_F)) + list(range(1500, 1740, BEAT_F))
    for f in groove:
        if f in heavy_frames:
            continue
        music['kick'].add(kick(), S(f), KICK)
        kicks.append(S(f))
    claps = [f for f in range(270, 1440, 60)] + [1530, 1590, 1650, 1710]
    for f in claps:
        if f in heavy_frames:
            continue
        g = CLAP * (0.6 if 1640 <= f <= 1680 else 1.0)  # 打字時讓開
        music['clap'].add(clap(), S(f), g, pan=0.05)
    # 反拍 hi-hat、16 分 shaker
    for f in range(240, 1320, BEAT_F):
        bar_pos = ((f - 240) // BEAT_F) % 4
        if bar_pos == 3 and ((f - 240) // 120) % 2 == 1:
            music['hats'].add(hat(0.12), S(f + 15), OHAT, pan=0.25)
        else:
            music['hats'].add(hat(), S(f + 15), HAT, pan=0.25)
        if f >= 600:
            for k in (1, 3):
                music['hats'].add(shaker(), S(f) + k * S16, SHK * (0.8 if k == 1 else 1.0), pan=-0.35)
    for k in range(16):  # 蒙太奇：16 分 hi-hat 推進
        music['hats'].add(hat(0.025), S(1320) + k * S16, HAT * (1.0 if k % 2 else 0.6), pan=0.25)
    for f in range(1500, 1620, BEAT_F):
        music['hats'].add(hat(), S(f + 15), HAT, pan=0.25)
        for k in (1, 3):
            music['hats'].add(shaker(), S(f) + k * S16, SHK, pan=-0.35)

    # ---------------- 貝斯（反拍；蒙太奇全八分）----------------
    def bass_note(sample, frame, octave_up=False, dur=0.2, g=1.0):
        root = chord_at(frame)[4]
        if root is None:
            return
        f = hz(root) * (2 if octave_up else 1)
        music['bass'].add(bass(f, dur), sample, BASS * g)

    for f in list(range(240, 1320, BEAT_F)) + list(range(1500, 1740, BEAT_F)):
        beat_in_bar = ((f - (240 if f < 1440 else 1500)) // BEAT_F) % 4
        bass_note(S(f + 15), f + 15, octave_up=(beat_in_bar == 3))
    for k in range(8):  # 蒙太奇八分
        f = 1320 + k * 15
        bass_note(S(f), f, octave_up=(k % 2 == 1), dur=0.17, g=0.95)
    music['bass'].add(bass(hz('F2'), 0.9, decay=0.5), S(1740), BASS * 1.1)

    # ---------------- 馬林巴切分伴奏 ----------------
    def comp_hits(start, end, pattern):
        for s in range(S(start), S(end), S16):
            pos = ((s - S(start)) // S16) % 16
            if pos not in pattern:
                continue
            frame = s / SPF
            notes = chord_at(frame)[3]
            if notes is None:
                continue
            vel = 1.0 if pos in (2, 10) else 0.75
            for i, nn in enumerate(notes):
                music['comp'].add(marimba(hz(nn), bright=0.7, decay=0.6), s, COMP * vel, pan=(i - 1) * 0.4)

    comp_hits(240, 1320, (2, 6, 10, 13))
    comp_hits(1500, 1740, (2, 6, 10, 13))
    for k in range(8):  # 蒙太奇：八分和弦推進，越來越強
        s = S(1320 + k * 15)
        notes = chord_at(1320 + k * 15)[3]
        for i, nn in enumerate(notes):
            music['comp'].add(marimba(hz(nn), bright=0.9, decay=0.5), s, COMP * (0.7 + 0.06 * k), pan=(i - 1) * 0.4)
    # 1440–1500：C7sus4 上行 16 分琶音
    for k, nn in enumerate(['C4', 'F4', 'G4', 'Bb4', 'C5', 'F5', 'G5', 'Bb5']):
        music['comp'].add(marimba(hz(nn), bright=1.0, decay=0.8), S(1440) + k * S16, COMP * (1.0 + 0.12 * k),
                          pan=-0.5 + k / 7)
    # 1440–1500 上升滑音（墊在下面）
    music['comp'].add(slide(hz('C4'), hz('C6'), 1.0), S(1440), 0.05, pan=0.0)

    # ---------------- 1740 最後和弦：馬林巴滾奏餘韻 ----------------
    for i, nn in enumerate(['F4', 'A4', 'C5', 'G5', 'A5']):
        music['roll'].add(marimba_roll(hz(nn), 0.75, rate=13 + i * 0.7, seed_off=i * 0.011), S(1740), 0.13,
                          pan=(i - 2) * 0.3)

    # ================= 音效提示表 =================
    def put(sig, frame, g, pan=0.0, verb=0.0, offset=0, duck=False):
        s0 = S(frame) + offset
        cue.add(sig, s0, g, pan)
        if verb:
            cue_verb.add(sig, s0, g * verb, pan)
        cue_marks.append(s0)
        if duck:
            duck_marks.append(s0)

    def heavy(frame, chord=None, clap_g=1.0, boom=True, crash_on=False, kick_g=1.0, chord_decay=1.3, boom_decay=0.5):
        s0 = S(frame)
        cue.add(kick(decay=0.32, click=0.35, punch=1.2), s0, KICK * 1.25 * kick_g)
        kicks.append(s0)
        if clap_g:
            put(clap(0.16), frame, 0.34 * clap_g, pan=0.05, verb=0.25)
        if boom:
            cue.add(sub_boom(boom_decay), s0, 0.40)
        if crash_on:
            put(crash(), frame, 0.10, pan=-0.2, verb=0.2)
        if chord:
            for i, nn in enumerate(chord):
                put(xylo(hz(nn), bright=1.0, decay=chord_decay), frame, 0.24, pan=(i - (len(chord) - 1) / 2) * 0.35, verb=0.35)
        cue_marks.append(s0)

    # S0（0–240：前奏，音樂只有墊音，音效就是主角）
    put(whoosh(0.40, 500, 3200, width=0.9, peak=0.45, floor=0.4, pan0=-0.15, pan1=0.15), 6, 0.13, verb=0.2)
    hum_bus.add(hum(0.42), S(14), 1.0, pan=0.0)
    put(xylo(hz('A6'), bright=1.0, decay=1.2), 22, 0.40, pan=0.1, verb=0.4)
    put(bell(hz('A7'), decay=0.4), 22, 0.05, pan=0.1, verb=0.3)
    for i, nn in enumerate(['D4', 'E4', 'F4', 'G4', 'A4', 'Bb4']):
        put(bounce_dong(hz(nn)), 60 + 30 * i, 0.42 + 0.02 * i, pan=0.05, verb=0.3)
    for f in range(75, 196, 30):
        put(tick_light(6200, 3520), f, 0.16, pan=0.2, verb=0.1)
    put(whoosh(0.24, 400, 6000, width=0.7, peak=0.45, floor=0.55, att=0.004), 228, 0.40, verb=0.25)  # 峰值≈234.5，對 iris 張最快那格

    # S1
    heavy(240, chord=None, clap_g=1.1, boom=True, crash_on=True)
    heavy(270, chord=['F5', 'A5', 'C6'], clap_g=1.25, boom=False, chord_decay=0.8)
    for i, nn in enumerate(['A5', 'C6', 'E6', 'G6']):  # 規格列每兩拍一列（360／420／480／540）
        put(tickpop(hz(nn)), 360 + 60 * i, 0.44, pan=-0.2 + 0.13 * i, verb=0.2, duck=True)
    put(whoosh(0.30, 2500, 700, width=0.7, peak=0.3, floor=0.45, pan0=0.4, pan1=-0.4, flutter=20.0), 584, 0.42,
        verb=0.15, duck=True)

    # S2
    for f in (630, 660, 690, 705):  # 第 4 張卡 705（八分反拍），720 留給主文案
        put(tick_light(), f, 0.30, pan=0.15, verb=0.1, duck=True)
    put(xylo(hz('A5'), bright=1.0, decay=1.1), 750, 0.50, pan=-0.1, verb=0.35, duck=True)
    put(xylo(hz('D6'), bright=1.0, decay=1.3), 757, 0.52, pan=0.1, verb=0.35)
    put(bell(hz('D7'), decay=0.7), 757, 0.10, pan=0.25, verb=0.4)
    put(whoosh(0.27, 350, 5000, width=0.7, peak=0.5, floor=0.55, att=0.004), 824, 0.45, verb=0.25, duck=True)  # 峰值≈832

    # S3
    for i, f in enumerate((878, 882, 886)):  # 三張卡落地壓扁（比翻卡低約 8 dB，翻卡還是主角）
        put(tick_light(4200 + 300 * i, 1760), f, 0.14, pan=0.25 - 0.25 * i, verb=0.05)
    for i, (f, nn) in enumerate(((900, 'D6'), (930, 'F6'), (960, 'Bb6'))):
        put(paper(), f, 0.32, pan=0.25 - 0.25 * i, verb=0.1, duck=True)
        put(xylo(hz(nn), bright=1.0, decay=1.1), f, 0.46, pan=0.25 - 0.25 * i, verb=0.35)
    put(whoosh(0.30, 2200, 600, width=0.7, peak=0.78, floor=0.15, pan0=0.6, pan1=-0.7), 1064, 0.42, verb=0.15, duck=True)  # 峰值≈1078

    # S4
    put(slide(hz('D4'), hz('D6'), 1.0), 1110, 0.26, pan=0.0, verb=0.3, duck=True)
    put(whoosh(1.0, 300, 6000, width=0.5, peak=0.95, floor=0.15), 1110, 0.12, verb=0.2)
    put(bounce_dong(hz('D5')), 1170, 0.46, pan=0.2, verb=0.3, duck=True)  # 技術球撞上曲線頂端（S0 落地 D4 的高八度）
    for i, (f, nn) in enumerate(((1177.5, 'D6'), (1185, 'F6'), (1192.5, 'A6'))):  # 三條讀數連發
        put(tickpop(hz(nn)), f, 0.42, pan=-0.15 + 0.15 * i, verb=0.2, duck=True)
    for i, nn in enumerate(('F5', 'A5', 'D6')):  # 1230「一起往上」＋螢光筆
        put(xylo(hz(nn), bright=1.0, decay=0.9), 1230, 0.20, pan=(i - 1) * 0.35, verb=0.3)

    # S5 蒙太奇
    for k, nn in enumerate(['G4', 'Bb4', 'D5', 'F5', 'G5', 'Bb5', 'C6']):
        put(woodblock(hz(nn)), 1320 + 15 * k, 0.50 + 0.02 * k, pan=(-0.3 if k % 2 else 0.3), verb=0.12, duck=True)
    heavy(1425, chord=['E5', 'G5', 'C6'], clap_g=1.3, boom=True, crash_on=True, kick_g=1.05, boom_decay=0.22)
    put(woodblock(hz('C5')), 1425, 0.45, verb=0.1)

    # S6
    for i, nn in enumerate(['C4', 'F4', 'G4', 'Bb4', 'C5', 'F5']):
        put(puff(hz(nn)), 1452 + 4 * i, 0.40 + 0.02 * i, pan=(-0.5 + 0.2 * i), verb=0.15, duck=True)
    heavy(1500, chord=['F5', 'A5', 'C6'], clap_g=1.2, boom=True, crash_on=True, kick_g=1.05)
    put(shimmer([hz('F6'), hz('A6'), hz('C7'), hz('G6')], dur=2.0, grains=20), 1500, 0.32, verb=0.5)
    heavy(1560, chord=['A5', 'C6', 'E6'], clap_g=1.2, boom=False)
    for i in range(10):  # 讓你的技術，值更多錢（10 字，every 2，1654 打完）
        put(keyclick(i), 1636 + 2 * i, 0.36 * (1.0 if i % 3 else 1.12), pan=-0.15 + 0.03 * i, verb=0.03, duck=True)
    put(xylo(hz('C7'), bright=1.0, decay=1.3), 1690, 0.42, pan=0.15, verb=0.4, duck=True)
    put(bell(hz('C7'), decay=0.6), 1690, 0.12, pan=0.15, verb=0.4)
    heavy(1740, chord=['F5', 'A5', 'C6'], clap_g=0.9, boom=True, crash_on=False, kick_g=0.95)
    put(bell(hz('F6'), decay=0.9), 1740, 0.08, pan=-0.1, verb=0.5)
    bloop_sig = bloop()  # 1790 落地壓扁「啵」——在淡出之後才加，不被收掉

    # ---------------- 旋律（避開音效）----------------
    cue_marks_arr = np.array(sorted(cue_marks))
    for bar, pos, nn in MELODY:
        s0 = at(bar, pos)
        near = np.min(np.abs(cue_marks_arr - s0)) if len(cue_marks_arr) else 10 ** 9
        vel = 0.5 if near < sec(0.045) else 1.0
        music['mel'].add(marimba(hz(nn), bright=1.0, decay=1.0), s0, MEL * vel, pan=0.12)

    return music, cue, cue_verb, hum_bus, kicks, bloop_sig, sorted(duck_marks)


# ----------------------------------------------------------------------------
# 混音與母帶
# ----------------------------------------------------------------------------
def true_peak_env(x):
    up = signal.resample_poly(x, 4, 1, axis=1)
    return np.abs(up).max(axis=0).reshape(-1, 4).max(axis=1)


def limiter(x, ceil_db=LIMIT_CEIL_DB, look=0.0015, rel=0.09):
    """前瞻式 true-peak 限幅器（4× 超取樣偵測），回傳 (輸出, 增益曲線)"""
    ceil = 10 ** (ceil_db / 20)
    g_req = np.minimum(1.0, ceil / np.maximum(true_peak_env(x), 1e-9))
    L = max(2, sec(look))
    g_min = minimum_filter1d(g_req, size=2 * L + 1)
    a = float(np.exp(-1.0 / (rel * SR)))
    # 釋放：增益往上回復走一階低通，往下立即跟上（逐樣本遞迴）
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
    # 起音平滑：過去 L 個樣本的移動平均（前面補 1，不在開頭造成假壓縮）
    gs = np.convolve(np.concatenate([np.ones(L - 1), g]), np.ones(L) / L, mode='valid')
    return x * gs, gs


def loudness(x):
    import pyloudnorm as pyln
    return pyln.Meter(SR).integrated_loudness(x.T)


def mixdown():
    music, cue, cue_verb, hum_bus, kicks, bloop_sig, duck_marks = build()
    ir = make_ir()
    kicks = sorted(kicks)

    # 側鏈：大鼓壓貝斯（低頻不糊）、輕壓墊音/伴奏；輕音效觸發時音樂讓開約 4 dB
    duck_bass = duck_curve(kicks, 0.75, rel=0.09)
    duck_soft = duck_curve(kicks, 0.35, rel=0.14)
    duck_mel = duck_curve(kicks, 0.15, rel=0.12)
    duck_cue = duck_curve(duck_marks, 0.40, rel=0.16, att=0.003)
    duck_cue_clap = duck_curve(duck_marks, 0.30, rel=0.12, att=0.003)

    mel = music['mel'].x * duck_mel * duck_cue
    comp = music['comp'].x * duck_soft * duck_cue
    padx = music['pad'].x * duck_soft * duck_cue
    roll = music['roll'].x
    bassx = hp(music['bass'].x, 32) * duck_bass
    kickx = music['kick'].x
    clapx = music['clap'].x * duck_cue_clap
    hatsx = music['hats'].x * duck_cue
    drums = kickx + clapx + hatsx

    m_send = 0.22 * mel + 0.14 * comp + 0.18 * padx + 0.30 * roll + 0.08 * clapx
    m_verb = reverb(m_send, ir)
    delay = pingpong(mel, 0.375, fb=0.4, taps=4) * 0.16
    music_mix = (mel + comp + padx + roll + bassx + drums + m_verb + delay) * MUSIC_GAIN

    c_verb = reverb(cue_verb.x, ir)
    cue_mix = cue.x + c_verb

    # 片尾：音樂 1752→1788 升餘弦淡出；音效 1760→1788
    def fade_env(a, b):
        e = np.ones(N)
        e[S(b) :] = 0.0
        k = S(b) - S(a)
        e[S(a) : S(b)] = 0.5 + 0.5 * np.cos(np.pi * np.arange(k) / k)
        return e

    music_mix *= fade_env(1752, 1788)
    cue_mix *= fade_env(1760, 1788)
    cue_mix[:, S(1790) : S(1790) + len(bloop_sig)] += 0.24 * bloop_sig[: N - S(1790)] * np.array([[1.0], [1.0]])

    # 母帶：增益 → true-peak 限幅，迭代到 -14 LUFS
    hum_x = hum_bus.x
    hum_peak = np.max(np.abs(hum_x))
    g = 1.0
    for it in range(8):
        h = (10 ** (HUM_PEAK_DBFS / 20)) / g / hum_peak
        pre = hp((music_mix + cue_mix + h * hum_x) * g, 22, 2)  # 去直流／次聲
        y, gcurve = limiter(pre)
        lu = loudness(y)
        diff = TARGET_LUFS - lu
        print(f'  母帶迭代 {it}: gain={20 * np.log10(g):+.2f} dB  LUFS={lu:.2f}  '
              f'最大壓縮={-20 * np.log10(gcurve.min()):.2f} dB')
        if abs(diff) < 0.03:
            break
        g *= 10 ** (diff / 20)

    # 收尾保險：1794 格後升餘弦到 0，1797 格起數位靜音；開頭 1 ms 淡入
    end = np.ones(N)
    k = S(1797) - S(1794)
    end[S(1794) : S(1797)] = 0.5 + 0.5 * np.cos(np.pi * np.arange(k) / k)
    end[S(1797) :] = 0.0
    y = y * end
    y[:, : sec(0.001)] *= ramp(sec(0.001), 0.001)

    stems = {
        'music': hp(music_mix, 22, 2) * g * gcurve * end,
        'cue': hp(cue_mix + h * hum_x, 22, 2) * g * gcurve * end,
        'gain_db': 20 * np.log10(g),
        'max_gr_db': -20 * np.log10(gcurve.min()),
        'hum_peak_dbfs': 20 * np.log10(np.max(np.abs(h * hum_x * g * gcurve)) + 1e-12),
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


# ----------------------------------------------------------------------------
# 驗證
# ----------------------------------------------------------------------------
EVENTS = (
    [(6, '地平線 咻', 'swell'), (14, '收入線 低音嗡', 'swell'), (22, '球彈出 叮', 'perc')]
    + [(f, f'球落地 咚 {i + 1}', 'perc') for i, f in enumerate(range(60, 211, 30))]
    + [(f, 'Lv tick', 'perc') for f in range(75, 196, 30)]
    + [(228, 'iris 咻上揚', 'swell'), (240, 'drop 大鼓+拍手+貝斯', 'perc'), (270, '安格斯 重拍', 'perc')]
    + [(f, '規格列 tick-pop', 'perc') for f in (360, 420, 480, 540)]
    + [(584, 'blinds 咻', 'swell')]
    + [(f, '貼文卡片 tick', 'perc') for f in (630, 660, 690, 705)]
    + [(750, '預約 叮咚+鈴', 'perc'), (824, '螢幕放大 咻上揚', 'swell')]
    + [(f, '卡片落地 輕 tick', 'perc') for f in (878, 882, 886)]
    + [(f, '翻卡 啪+木琴', 'perc') for f in (900, 930, 960)]
    + [(1064, '往左甩 咻', 'swell'), (1110, '紅線上彎 滑音 riser', 'swell')]
    + [(1170, '技術球撞頂 咚', 'perc')]
    + [(f, '量測 tick-pop', 'perc') for f in (1177.5, 1185, 1192.5)]
    + [(1230, '一起往上 木琴和弦', 'perc')]
    + [(1320 + 15 * k, f'蒙太奇 第{k + 1}刀', 'perc') for k in range(7)]
    + [(1425, '蒙太奇 第8刀 重擊', 'perc')]
    + [(1452 + 4 * i, f'吸入 噗 {i + 1}', 'perc') for i in range(6)]
    + [(1500, '星芒綻放 大重拍+shimmer', 'perc'), (1560, '名字 重拍', 'perc')]
    + [(1636 + 2 * i, f'打字 {i + 1}', 'perc') for i in range(10)]
    + [(1690, '按鈕 叮', 'perc'), (1740, '最後和弦 重拍', 'perc'), (1790, '眨眼 啵', 'perc')]
)


def _fb_ratio(mono, s0, W, search):
    """前後能量比：在每個位置 p 比較 [p, p+W) 與 [p-W, p) 的能量（dB）。
    階躍型起音在 p = 起點時比值最大，沒有視窗造成的偏移。"""
    lo, hi = s0 - search - W, s0 + search + W
    seg = mono[lo:hi] ** 2
    c = np.concatenate([[0.0], np.cumsum(seg)])
    p = np.arange(W, len(seg) - W + 1)
    eps = 1e-13 * W
    r = 10 * np.log10((c[p + W] - c[p] + eps) / (c[p] - c[p - W] + eps))
    pos = lo + p
    keep = np.abs(pos - s0) <= search
    r, pos = r[keep], pos[keep]
    k = int(np.argmax(r))
    return (pos[k] - s0) / SR * 1000.0, float(r[k])


_BANDS = {'全頻': None, '>2k': ('hp', 2000), '150-2k': ('bp', 150, 2000)}


def band_views(x):
    mono = x.sum(axis=0)
    out = {}
    for name, spec in _BANDS.items():
        if spec is None:
            out[name] = mono
        elif spec[0] == 'hp':
            out[name] = hp(mono, spec[1], 4)
        else:
            out[name] = bp(mono, spec[1], spec[2], 2)
    return out


def onset_in(views, s0, search=0.020, W=None):
    """在 s0±20 ms 內，用 4 ms 前後能量比找起點；取跳升最明顯的頻帶"""
    W = W or sec(0.004)
    best = None
    for name, mono in views.items():
        off, r = _fb_ratio(mono, s0, W, sec(search))
        if best is None or r > best[1]:
            best = (off, r, name)
    return best


def band_energy_jump(x, s0, w=0.020):
    mono = x.sum(axis=0)
    a = mono[s0 - sec(w) : s0]
    b = mono[s0 : s0 + sec(w)]
    return 10 * np.log10((np.mean(b ** 2) + 1e-14) / (np.mean(a ** 2) + 1e-14))


def verify(y, stems):
    print('\n================ 驗證 ================')
    # 1) 長度
    with wave.open(OUT_WAV, 'rb') as w:
        nfr, ch, sw, fs = w.getnframes(), w.getnchannels(), w.getsampwidth(), w.getframerate()
    print(f'[長度] {nfr} 樣本，{ch} 聲道，{sw * 8}-bit，{fs} Hz → {"OK" if nfr == N else "不符！"}')

    # 2) ffmpeg 量測
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', OUT_WAV, '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                       capture_output=True, text=True)
    txt = r.stderr
    summ = txt[txt.rfind('Summary:') :]
    I = float(re.search(r'I:\s+(-?[\d.]+) LUFS', summ).group(1))
    LRA = float(re.search(r'LRA:\s+(-?[\d.]+) LU', summ).group(1))
    TP = float(re.search(r'Peak:\s+(-?[\d.inf]+) dBFS', summ).group(1))
    print(f'[ffmpeg ebur128] Integrated = {I:.1f} LUFS，True peak = {TP:.1f} dBTP，LRA = {LRA:.1f} LU')
    print(f'[pyloudnorm]     Integrated = {loudness(y):.2f} LUFS；母帶增益 {stems["gain_db"]:+.2f} dB，'
          f'限幅最大壓縮 {stems["max_gr_db"]:.2f} dB；14 格低音嗡峰值 {stems["hum_peak_dbfs"]:.1f} dBFS')

    # 3) 開頭／結尾
    head = np.abs(y[:, :sec(0.005)]).max()
    first_nz = int(np.argmax(np.abs(y).max(axis=0) > 10 ** (-90 / 20)))
    last_nz = N - int(np.argmax(np.abs(y).max(axis=0)[::-1] > 0))
    print(f'[頭尾] 第 0 樣本 = {y[:, 0].tolist()}，前 5 ms 峰值 {20 * np.log10(head + 1e-12):.1f} dBFS，'
          f'第一個 > -90 dBFS 的樣本 {first_nz}；最後一個非零樣本 #{last_nz - 1}（第 {(last_nz - 1) / SPF:.2f} 格），'
          f'1797 格後峰值 {np.abs(y[:, S(1797):]).max():.1e}')
    rl = 20 * np.log10(np.sqrt(np.mean(y[0] ** 2)) / np.sqrt(np.mean(y[1] ** 2)))
    corr = float(np.corrcoef(y[0], y[1])[0, 1])
    print(f'[立體聲] L/R RMS 差 {rl:+.2f} dB，左右相關係數 {corr:.3f}，直流 {y.mean(axis=1).tolist()}')
    tail_rms = 20 * np.log10(np.sqrt(np.mean(y[:, S(1780) : S(1800)] ** 2)) + 1e-12)
    print(f'         1780–1800 格 RMS {tail_rms:.1f} dBFS')

    # 4) 音效提示表逐一對位
    cue, music = stems['cue'], stems['music']
    cue_hf = hp(cue, 2000)
    mix_hf = hp(y, 2000)
    cue_v = band_views(cue)
    mix_v = band_views(y)
    print('\n[對位] 格數 | 事件 | 音效分軌起點偏差（4ms 前後能量比, 頻帶） | 成品混音起點偏差 | 成品 ±20ms 能量跳升 | 音效/音樂比（事件後 60ms）')
    worst = 0.0
    worst_mix = 0.0
    rows = []
    for f, name, kind in EVENTS:
        s0 = S(f)
        off_c, rise_c, band_c = onset_in(cue_v, s0)
        off_m, rise_m, band_m = onset_in(mix_v, s0)
        jump = band_energy_jump(y, s0)
        jump_hf = band_energy_jump(mix_hf, s0)
        a = cue[:, s0 : s0 + sec(0.06)]
        b = music[:, s0 : s0 + sec(0.06)]
        ratio = 10 * np.log10((np.mean(a ** 2) + 1e-14) / (np.mean(b ** 2) + 1e-14))
        ah = cue_hf[:, s0 : s0 + sec(0.06)]
        bh = hp(music[:, s0 - 4096 : s0 + sec(0.06)], 2000)[:, 4096:]
        ratio_hf = 10 * np.log10((np.mean(ah ** 2) + 1e-14) / (np.mean(bh ** 2) + 1e-14))
        if kind == 'perc':
            worst = max(worst, abs(off_c))
        if kind == 'perc':
            worst_mix = max(worst_mix, abs(off_m))
        flag = '' if (kind != 'perc' or abs(off_c) <= 5.0) else '  <-- 超過 5 ms'
        rows.append((f, name, kind, off_c, off_m, jump, jump_hf, ratio, ratio_hf))
        print(f'  {f:7.1f} | {name:<18s} | {off_c:+6.2f} ms（{rise_c:+5.1f} dB, {band_c}）| {off_m:+6.2f} ms（{rise_m:+5.1f} dB, {band_m}）| '
              f'{jump:+5.1f} dB（>2k: {jump_hf:+5.1f}）| 全頻 {ratio:+5.1f} / >2k {ratio_hf:+5.1f} dB{flag}')
    print(f'  打擊類事件最大起點偏差：音效分軌 {worst:.2f} ms；成品混音 {worst_mix:.2f} ms')
    print('\n[咻／滑音整段] 事件全長內 音效/音樂 能量比（全頻 / >2k）')
    for f, nfr_ in ((6, 24), (14, 25), (228, 14), (584, 18), (824, 16), (1064, 17), (1110, 60)):
        a0, a1 = S(f), S(f + nfr_)
        r_all = 10 * np.log10(np.mean(cue[:, a0:a1] ** 2) / (np.mean(music[:, a0:a1] ** 2) + 1e-14) + 1e-14)
        r_hf = 10 * np.log10(np.mean(cue_hf[:, a0:a1] ** 2) / (np.mean(hp(music[:, a0 - 4096:a1], 2000)[:, 4096:] ** 2) + 1e-14) + 1e-14)
        print(f'  {f:5d}–{f + nfr_:<5d}: 全頻 {r_all:+5.1f} dB / >2k {r_hf:+5.1f} dB')
    return dict(I=I, TP=TP, LRA=LRA, frames=nfr, rows=rows, worst=worst, worst_mix=worst_mix)


def pictures(y):
    wav_png = os.path.join(OUT_DIR, 'angus_waveform.png')
    spec_png = os.path.join(OUT_DIR, 'angus_spectrum.png')
    subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', OUT_WAV, '-filter_complex',
                    'showwavespic=s=1800x500:split_channels=1:colors=0xFFB13B|0xFAF9F5:scale=sqrt', '-frames:v', '1', wav_png],
                   check=True)
    subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', OUT_WAV, '-lavfi',
                    'showspectrumpic=s=1800x700:legend=1:scale=log:fscale=log:color=intensity', '-frames:v', '1',
                    spec_png], check=True)

    # 附加：短時響度（400 ms 視窗）＋段落標記，方便看結構
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
        hop = SPF  # 每格一個點
        win = sec(0.4)
        pw = np.convolve(mono ** 2, np.ones(win) / win, mode='same')[::hop]
        db = 10 * np.log10(pw + 1e-12)
        fr = np.arange(len(db))
        fig, (ax, ax2) = plt.subplots(2, 1, figsize=(18, 10), dpi=100, sharex=True,
                                      gridspec_kw=dict(height_ratios=[1, 1.4]))
        ax.plot(fr, db, color='#141413', lw=1)
        ax.set_ylim(-70, 0)
        ax.set_xlim(0, 1800)
        for a, b, lab, col in ((0, 240, 'S0 前奏', '#ddd'), (240, 600, 'S1 drop', '#FFE2B5'), (600, 840, 'S2', '#FFF1DB'),
                               (840, 1080, 'S3', '#FFE2B5'), (1080, 1320, 'S4', '#FFF1DB'), (1320, 1440, 'S5 蒙太奇 8分', '#FFC97A'),
                               (1440, 1500, '吸入 無鼓', '#ddd'), (1500, 1740, 'S6 回來', '#FFE2B5'), (1740, 1800, '餘韻→靜音', '#eee')):
            ax.axvspan(a, b, color=col, alpha=0.6, lw=0)
            ax.text((a + b) / 2, -4, lab, ha='center', va='top', fontsize=9)
        for f, name, kind in EVENTS:
            ax.axvline(f, color='#FF4A4A' if kind == 'perc' else '#8A8578', lw=0.6, alpha=0.7)
        ax.set_ylabel('400ms RMS (dBFS)')
        ax.set_title('angus.wav 結構：短時能量＋音效提示表事件（紅=打擊類、灰=咻/滑音）')
        # 自己算的對數頻率頻譜（ffmpeg 6.1 的 showspectrumpic 對數軸在某些參數下會標錯）
        fq, tt, Z = signal.stft(mono, fs=SR, nperseg=4096, noverlap=4096 - 400)
        P = 20 * np.log10(np.abs(Z) + 1e-9)
        keep = (fq >= 30) & (fq <= 16000)
        ax2.pcolormesh(tt * FPS, fq[keep], P[keep], shading='auto', cmap='magma', vmin=-110, vmax=-20)
        ax2.set_yscale('log')
        ax2.set_ylim(30, 16000)
        ax2.set_ylabel('Hz（對數）')
        for f0 in (240, 1320, 1440, 1500, 1740):
            ax2.axvline(f0, color='#4FC3F7', lw=0.8)
        ax2.set_xlabel('格（60 fps）')
        fig.tight_layout()
        fig.savefig(os.path.join(OUT_DIR, 'angus_timeline.png'))
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
        print('圖：out/audio/angus_waveform.png、angus_spectrum.png、angus_timeline.png')


if __name__ == '__main__':
    main()
