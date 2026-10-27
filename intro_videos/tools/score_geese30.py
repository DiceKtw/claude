#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
雁沙龍｜30 秒〈一格一位〉原創配樂（numpy / scipy 從零合成，不用任何取樣音檔；沒有額外音效，擊點全交給鼓）

用法（在 intro_videos/ 底下）：
    python3 tools/score_geese30.py              # 合成 → 混音 → 母帶 → 主檔＋分軌，跑驗證、輸出圖
    python3 tools/score_geese30.py --no-verify  # 只合成

輸出：out/audio/geese30.wav
      out/audio/geese30_stems/{drums,bass,pluck}.wav（三軌已含母帶增益與限幅曲線，三軌相加＝主檔）
      out/audio/geese30_waveform.png、geese30_spectrum.png、geese30_timeline.png
規格：48 kHz、立體聲、24-bit PCM、剛好 1,440,000 樣本（30.000 秒＝1800 格 @60fps；第 f 格＝第 f×800 樣本）
      128 BPM：1 拍＝60/128 秒＝22,500 樣本（剛好整數）＝28.125 格；1 小節＝90,000 樣本＝112.5 格；16 小節＝30.000 秒
      拍點一律用精確樣本位置（不四捨五入到格）；響度 -14 LUFS（integrated）、true peak ≤ -1.0 dBTP（ffmpeg ebur128 量）
      確定性：所有亂數都來自固定 seed 的 numpy Generator，每次輸出完全相同

曲風：伸展台式 minimal tech-house（跟 60 秒的 112 BPM 暖 nu-disco 分開）。G 多利安小調；旋律、和聲、貝斯線全部原創。
  鼓：乾的四拍大鼓（調到 G1 49 Hz，飽和＋鼓皮 knock＋鼓槌 click，手機喇叭也聽得到拍子；不加殘響）、
      拍手（2、4 拍，往後坐 1.8 ms）、808 式金屬 hi-hat（反拍短開／drop 後開放、會被下一下掐掉；16 分 ghost 搖擺 56%）、
      沙鈴、手鼓（高／低 conga 調在 D4／G3，開放音＋悶音＋拍面 slap）、木質 rim（D6，小節 1–8 拍手後面那個 16 分）、
      crash（只在 drop、鼓回來、最後一擊）
  貝斯：單音合成貝斯——兩支微走音鋸齒波（加法合成，限頻不失真）經 4 極共振低通（每個音自己的濾波包絡）、
        同相 sub、起音音高微高、悶音 ghost note；混音時加一路 260–1500 Hz 平行破音（手機喇叭聽得到貝斯線）；
        前 8 小節是 G 持續音上的「問句／答句」動機，第 9 小節起跟和弦走
  pluck：小節 9（f900）才進。兩聲部 ±5 cent 左右分開的鋸齒／方波混合（濾波包絡、高泛音衰減較快）＋中間一支
         Karplus-Strong 撥弦（弦的質感）；原創旋律＋軟的和弦墊；dotted-8th 乒乓延遲＋板式殘響
  律動：16 分音符搖擺 56%；hat／沙鈴／手鼓／貝斯／旋律都有力度起伏與 ±1.5–3 ms 人手誤差（只加在反拍與 16 分上；
        正拍上的 hat／沙鈴跟大鼓同一下，不加誤差，避免 flam）；大鼓與所有段落重拍精準落在拍上
  低頻：大鼓＋貝斯是唯一 150 Hz 以下的聲音，兩者都是單聲道；貝斯跟著大鼓 sidechain 讓位；
        pluck 180 Hz 以下高通，殘響送出前 300 Hz 高通

段落（小節 1 起算；拍號 b 從 0 起算；格數＝b × 28.125）：
  1–2   （f0–225）    第 0 格就是大鼓正拍。大鼓＋拍手＋反拍短 hat＋rim＋貝斯問句／答句（G 持續音）
  3–4   （f225–450）  ＋沙鈴 16 分；小節 4（老實話）貝斯答句收成稀疏版
  5–6   （f450–675）  燙・染每拍硬切：＋16 分 ghost hat、手鼓；貝斯加悶音
  7–8   （f675–900）  從頭到尾：手鼓退出、rim 變密、貝斯濾波一路打開；小節 8 拍手滾奏漸強、貝斯上行，最後一個 16 分全部留空（吸氣）
  9     （f900）      drop＝「4.9」：crash＋pluck 旋律第一次進來＋和弦墊（Gm9），反拍 hat 打開
  9–12  Gm9 → Gm9 → E♭maj9 → Cm9；小節 11（晚上）手鼓換成稀疏版
  12 第 3 拍（f1293.75，分鏡 f1294）抽鼓 2 拍：大鼓／拍手／手鼓／沙鈴／貝斯全停（貝斯分軌在濾波之後才 1.5 ms 閘門硬切，切點精確），
        切的那一下有一個短的 D9sus4 stab，之後只剩 hi-hat 16 分→32 分滾奏漸強＋pluck D9sus4 上行琶音（畫面整列往下捲，不停）。
        抽鼓點＝拍 46 再 +100 樣本（2.08 ms）：精確拍點 f1293.75 與分鏡 f1294 格首的正中間，距兩邊各 2.08 ms
  13    （f1350）     鼓回來的正拍＝「客」換成「你」：crash＋大鼓＋旋律落在 B♭5（琶音頂音 A5 往上半音解決）
  13–15 Gm9 → E♭maj9 → Cm9｜F6/9（i–VI–iv–♭VII）；小節 15 最後一個 8 分音符留空
  16    最後一擊：大鼓＋crash＋貝斯 G1＋Gm6/9（E5 → D5 落下）。位置＝小節 16 正拍 1,350,000 再 +200 樣本：
        精確拍點是 f1687.5（格的正中間），分鏡寫 f1688；+200 樣本（4.17 ms）＝兩者正中間，起音距精確拍點與距 f1688 格首都是 4.17 ms。
        之後只留尾音，f1752–1796 升餘弦淡出，f1796 起數位靜音
"""
import argparse
import os
import re
import subprocess
import time
import wave

import numpy as np
from scipy import signal
from scipy.ndimage import minimum_filter1d

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'out', 'audio')
OUT_WAV = os.path.join(OUT_DIR, 'geese30.wav')
STEM_DIR = os.path.join(OUT_DIR, 'geese30_stems')
STEMS = ('drums', 'bass', 'pluck')

SR = 48000
FPS = 60
SPF = SR // FPS  # 每格 800 樣本
N = 1_440_000  # 1800 格 = 30.000 秒
BPM = 128
BEAT = SR * 60.0 / BPM  # 22500.0 樣本（精確，剛好整數）
S16 = BEAT / 4
PAD = SR * 3  # 匯流排尾巴餘量（最後裁掉）
SWING = 0.56  # 每個 8 分音符裡第一個 16 分音符佔 56%

DROP_BEAT = 32.0  # 小節 9 正拍 = f900
CUT_BEAT = 46.0  # 小節 12 第 3 拍 = f1293.75（分鏡 f1294）
BACK_BEAT = 48.0  # 小節 13 正拍 = f1350
FINAL_BEAT = 60.0  # 小節 16 正拍 = f1687.5（分鏡 f1688）
FINAL_NUDGE = 200  # 樣本：精確拍點（1,350,000）與 f1688 格首（1,350,400）的正中間，距兩邊各 4.17 ms
FINAL_POS = FINAL_BEAT * BEAT + FINAL_NUDGE
CUT_NUDGE = 100  # 樣本：抽鼓點放在精確拍點（1,035,000）與 f1294 格首（1,035,200）的正中間，距兩邊各 2.08 ms
CUT_POS = CUT_BEAT * BEAT + CUT_NUDGE
FADE_A, FADE_B = 1752, 1796  # 片尾淡出（升餘弦，格），之後數位靜音

TARGET_LUFS = -14.0
LIMIT_CEIL_DB = -1.5  # 限幅器內部天花板（4× 超取樣偵測；留餘量給 ffmpeg 的 true peak）


# ----------------------------------------------------------------------------
# 時間
# ----------------------------------------------------------------------------
def F(frame):
    """格數 → 樣本位置"""
    return int(round(frame * SPF))


def bs(beat):
    """拍號（0 起算，可為小數）→ 樣本位置（浮點，精確）"""
    return beat * BEAT


def bf(beat):
    """拍號 → 格數（浮點）"""
    return beat * BEAT / SPF


def bb(bar, beat=1):
    """第 bar 小節第 beat 拍（都從 1 起算）→ 拍號"""
    return (bar - 1) * 4 + (beat - 1)


def step_beat(bar, step, swing=SWING):
    """第 bar 小節第 step 個 16 分音符（0–15）→ 拍號；奇數步依 swing 往後推"""
    q, r = divmod(int(step), 4)
    return bb(bar) + q + (0.0, swing * 0.5, 0.5, 0.5 + swing * 0.5)[r]


def sb_frame(beat):
    """分鏡格＝bar30()/b30() 的算法：精確格數四捨五入（JS Math.round：.5 進位）"""
    return int(np.floor(bf(beat) + 0.5))


# ----------------------------------------------------------------------------
# 基本工具
# ----------------------------------------------------------------------------
def sec(x):
    return int(round(x * SR))


def tv(n):
    return np.arange(n) / SR


def mhz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def db(x):
    return 20 * np.log10(max(float(x), 1e-12))


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
    return signal.sosfilt(_sos('lowpass', min(fc, 0.45 * SR), order), x, axis=-1)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(_sos('bandpass', [lo, min(hi, 0.45 * SR)], order), x, axis=-1)


def peq(x, fc, gain_db, q=0.8):
    """RBJ 峰值等化"""
    A = 10 ** (gain_db / 40)
    w = 2 * np.pi * fc / SR
    al = np.sin(w) / (2 * q)
    b = np.array([1 + al * A, -2 * np.cos(w), 1 - al * A])
    a = np.array([1 + al / A, -2 * np.cos(w), 1 - al / A])
    return signal.lfilter(b / a[0], a / a[0], x, axis=-1)


def shelf(x, fc, gain_db, kind='low'):
    """RBJ 架式等化（S=1）"""
    A = 10 ** (gain_db / 40)
    w = 2 * np.pi * fc / SR
    al = np.sin(w) / 2 * np.sqrt(2)
    c = np.cos(w)
    sa = 2 * np.sqrt(A) * al
    if kind == 'low':
        b = [A * ((A + 1) - (A - 1) * c + sa), 2 * A * ((A - 1) - (A + 1) * c), A * ((A + 1) - (A - 1) * c - sa)]
        a = [(A + 1) + (A - 1) * c + sa, -2 * ((A - 1) + (A + 1) * c), (A + 1) + (A - 1) * c - sa]
    else:
        b = [A * ((A + 1) + (A - 1) * c + sa), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - sa)]
        a = [(A + 1) - (A - 1) * c + sa, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - sa]
    b, a = np.array(b), np.array(a)
    return signal.lfilter(b / a[0], a / a[0], x, axis=-1)


def norm(x, peak=1.0):
    m = np.max(np.abs(x))
    return x * (peak / m) if m > 0 else x


def panlaw(pan):
    th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    return np.cos(th) * np.sqrt(2), np.sin(th) * np.sqrt(2)


def head_norm(z, k):
    """以開頭 k 個樣本的峰值正規化（瞬態從第 0 樣本開始）"""
    return z / (np.max(np.abs(z[: max(4, k)])) + 1e-12)


class Bus:
    def __init__(self):
        self.x = np.zeros((2, N + PAD))

    def add(self, sig, pos, gain=1.0, pan=0.0):
        p = int(round(pos))
        sig = np.asarray(sig, dtype=float)
        if sig.ndim == 1:
            gl, gr = panlaw(pan)
            sig = np.vstack([sig * gl, sig * gr])
        if p < 0:
            sig = sig[:, -p:]
            p = 0
        n = min(sig.shape[1], self.x.shape[1] - p)
        if n > 0:
            self.x[:, p : p + n] += gain * sig[:, :n]


# ----------------------------------------------------------------------------
# 鼓
# ----------------------------------------------------------------------------
def kick(r, vel=1.0):
    """乾的 tech-house 大鼓：本體從 ~384 Hz 掃到 G1（49 Hz），短 hold 後衰減；飽和出 3、5 次諧波（手機喇叭聽得到）
       ＋鼓皮 knock（160–1100 Hz）＋鼓槌 click（3–9 kHz、1.2 ms）"""
    n = sec(0.34)
    t = tv(n)
    f = 49.0 + 105.0 * np.exp(-t / 0.026) + 230.0 * np.exp(-t / 0.0032)
    ph = 2 * np.pi * np.cumsum(f) / SR
    ph -= ph[0]
    env = np.where(t < 0.010, 1.0, np.exp(-(t - 0.010) / 0.14))
    body = np.tanh(2.3 * np.sin(ph) * env) / np.tanh(2.3)
    m = sec(0.04)
    knock = np.zeros(n)
    knock[:m] = head_norm(bp(r.standard_normal(m), 160, 1100), sec(0.002)) * np.exp(-tv(m) / 0.006)
    c = sec(0.010)
    click = np.zeros(n)
    click[:c] = head_norm(bp(r.standard_normal(c), 3000, 9000), sec(0.0008)) * np.exp(-tv(c) / 0.0012)
    s = body + 0.24 * knock + 0.07 * click
    s *= ramp(n, 0.0003)
    return tail(s * vel, 0.03)


def clap(r, vel=1.0):
    """拍手：4 下很密的手掌爆裂（6.5–10 ms 間隔，隨機）＋擴散尾巴，950–3200 Hz 為主；底下墊一點「肉」"""
    n = sec(0.36)
    t = tv(n)
    z = r.standard_normal(n)
    offs = np.cumsum([0.0] + list(0.0065 + 0.0035 * r.random(3)))
    env = np.zeros(n)
    for k, o in enumerate(offs):
        tt = t - o
        msk = tt >= 0
        env[msk] += (0.5 + 0.17 * k) * np.exp(-tt[msk] / 0.0032)
    tt = t - offs[-1]
    msk = tt >= 0
    env[msk] += 0.42 * np.exp(-tt[msk] / 0.060)
    fc = 1.0 + 0.05 * r.standard_normal()
    s = bp(z, 950 * fc, 3200 * fc, 2) * env + 0.25 * bp(z, 3500, 9500, 2) * env
    s = norm(s)
    body = 0.14 * np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.020) + 0.06 * np.sin(2 * np.pi * 312 * t) * np.exp(-t / 0.012)
    s = (s + body) * ramp(n, 0.0004)
    return tail(s * vel, 0.03)


_METAL = None


def metal_source():
    """808 式金屬音源：6 個不和諧方波（限頻加法合成）＋白噪音，先算好一段，每下 hat 取不同位置"""
    global _METAL
    if _METAL is None:
        r = np.random.default_rng(3808)
        n = sec(1.5)
        t = tv(n)
        s = np.zeros(n)
        for f in (205.3, 304.4, 369.6, 522.7, 540.0, 800.0):
            ph = 2 * np.pi * f * t + r.random() * 2 * np.pi
            for k in range(1, int(19000 / f) + 1, 2):
                s += np.sin(k * ph) / k
        s = norm(s)
        _METAL = 0.7 * s + 0.3 * r.standard_normal(n) * 0.5
    return _METAL


def hat(r, vel, kind='closed', length=None):
    """hi-hat：closed（11–30 ms）、short（反拍短開 40–60 ms）、open（~0.15 s，會被下一下掐掉）；力度越大越亮、越長"""
    src = metal_source()
    tau = dict(closed=0.011 + 0.019 * vel, short=0.036 + 0.026 * vel, open=0.12 + 0.05 * vel)[kind]
    n = sec(length if length is not None else min(0.6, tau * 6 + 0.01))
    off = int(r.integers(0, len(src) - n - 1))
    t = tv(n)
    y = hp(src[off : off + n], 5200, 2)
    y = lp(y, 7500 + 5500 * vel, 1)
    env = np.exp(-t / tau) * ramp(n, 0.0003)
    y = y * env
    if length is not None:  # 掐掉：最後 8 ms 收掉
        y = tail(y, 0.008)
    return tail(y / 0.35 * vel ** 1.4, 0.004)


def shaker(r, vel):
    """沙鈴：帶通噪音、起音慢一點（沙子撞上殼）"""
    n = sec(0.11)
    t = tv(n)
    s = bp(r.standard_normal(n), 3000, 11000)
    env = (1 - np.exp(-t / 0.004)) * np.exp(-t / 0.024)
    return tail(norm(s * env) * vel ** 1.3, 0.01)


def conga(r, drum, vel, mute=False):
    """手鼓：鼓皮基頻（起音音高微高、往下沉）＋兩個不和諧鼓皮模態（1.59×、2.14×）＋拍面 slap；悶音＝短、slap 多"""
    f0 = {'hi': 293.7, 'lo': 196.0}[drum] * 2 ** (r.normal(0, 6) / 1200)
    n = sec(0.12 if mute else 0.32)
    t = tv(n)
    f = f0 * (1 + 0.16 * np.exp(-t / 0.008))
    ph = 2 * np.pi * np.cumsum(f) / SR
    ph -= ph[0]
    tau = 0.035 if mute else (0.13 if drum == 'hi' else 0.17)
    body = (np.sin(ph) * np.exp(-t / tau) + 0.22 * np.sin(1.59 * ph + 0.4) * np.exp(-t / (0.45 * tau))
            + 0.10 * np.sin(2.14 * ph + 1.1) * np.exp(-t / (0.3 * tau)))
    k = sec(0.02)
    slap = np.zeros(n)
    slap[:k] = head_norm(bp(r.standard_normal(k), 1200, 6000), sec(0.0015)) * np.exp(-tv(k) / (0.0045 if mute else 0.0025))
    s = body + (0.55 if mute else 0.25) * slap
    s = np.tanh(1.3 * s) / np.tanh(1.3)
    s *= ramp(n, 0.0004)
    return tail(s * vel ** 1.2, 0.01)


def rim(r, vel):
    """木質 rim（類木魚）：兩個阻尼模態 D6（1175 Hz）＋不和諧 2.76×＋低一點的「殼」聲（480 Hz）＋撞擊 click"""
    n = sec(0.09)
    t = tv(n)
    f1 = 1174.7 * 2 ** (r.normal(0, 8) / 1200)
    s = (np.sin(2 * np.pi * f1 * t) * np.exp(-t / 0.013) + 0.45 * np.sin(2 * np.pi * 2.76 * f1 * t + 0.7) * np.exp(-t / 0.006)
         + 0.30 * np.sin(2 * np.pi * 480 * t + 0.3) * np.exp(-t / 0.009))
    k = sec(0.01)
    s[:k] += 0.5 * head_norm(bp(r.standard_normal(k), 3000, 9000), sec(0.0008)) * np.exp(-tv(k) / 0.0009)
    s *= ramp(n, 0.0003)
    return tail(s * vel ** 1.3, 0.008)


def crash(r, vel=1.0, dur=2.6):
    """crash：噪音經 14 個不和諧窄帶共振（金屬感）＋高頻 wash，左右各自獨立（自然的寬度）"""
    n = sec(dur)
    t = tv(n)
    out = np.zeros((2, n))
    for ch in range(2):
        z = r.standard_normal(n)
        m = np.zeros(n)
        for fc in np.exp(r.uniform(np.log(1900), np.log(12500), 14)):
            m += bp(z, fc * 0.975, fc * 1.025, 1)
        wash = hp(z, 4800, 2)
        x = 0.55 * norm(m) + 0.45 * norm(wash)
        env = (1 - np.exp(-t / 0.0012)) * (0.5 * np.exp(-t / 0.18) + 0.5 * np.exp(-t / 1.05))
        out[ch] = x * env
    out *= ramp(n, 0.0003)
    return tail(norm(out) * vel, 0.05)


# ----------------------------------------------------------------------------
# 貝斯（單音合成貝斯，加法合成）
# ----------------------------------------------------------------------------
def _lp4(x, q):
    """4 極共振低通的振幅響應（2 極共振 × 2 極 Butterworth），x＝頻率/截止頻率"""
    return 1.0 / np.sqrt((1 - x * x) ** 2 + (x / q) ** 2) / np.sqrt(1 + x ** 4)


def bass_note(r, m, vel, dur, cut=0.5, dead=False, hard=False, decay=None):
    """一個貝斯音：兩支鋸齒（第二支 +8 cent、0.45 倍、只到一半泛音）＋同相 sub，
       泛音 k 的振幅 = (1/k) × 4 極共振低通(k·f0 / fc(t))；fc(t) = 底 + 包絡 × exp(-t/τ)（cut 越大越亮、越長）；
       起音音高高 9 cent 往下沉；dead＝悶音 ghost（短、暗、帶指肉「噗」）；hard＝在 dur 處 3 ms 硬切（抽鼓用）；
       decay＝不撐住、整個音以 decay 秒時間常數自然衰減（最後一擊）"""
    f0 = mhz(m) * 2 ** (r.normal(0, 1.5) / 1200)
    rel = 0.003 if hard else (0.010 if dead else 0.016)
    n = sec(dur) + sec(rel * 7) + 1
    t = tv(n)
    cents = 9.0 * vel * np.exp(-t / 0.025)
    fr = f0 * 2 ** (cents / 1200)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    ph -= ph[0]
    if dead:
        fc = 160 + 520 * vel * np.exp(-t / 0.012)
        K = int(min(14, 1500 / f0))
    else:
        fc = (220 + 600 * cut) + (500 + 1800 * cut) * vel * np.exp(-t / (0.045 + 0.05 * cut))
        K = int(min(70, 5200 / f0))
    q = 1.5
    det = 2 ** (8 / 1200)
    td = slice(None, None, 64)
    s = np.zeros(n)
    for k in range(1, K + 1):
        sign = 1.0 if k % 2 else -1.0
        H = _lp4(k * f0 / fc, q)
        if H[td].max() / k < 2e-4:
            continue
        s += sign / k * H * np.sin(k * ph)
        if k <= K // 2:
            H2 = _lp4(k * f0 * det / fc, q)
            s += 0.45 * sign / k * H2 * np.sin(k * det * ph)
    s += (0.25 if dead else 0.45) * np.sin(ph)  # sub（同相）
    env = (0.78 + 0.22 * np.exp(-t / 0.07)) if not dead else np.exp(-t / 0.028)
    if decay is not None:
        env = 0.35 * np.exp(-t / 0.08) + 0.65 * np.exp(-t / decay)
    h = sec(dur)
    if h < n:
        env = env.copy()
        env[h:] *= np.exp(-(t[h:] - t[h]) / rel)
    s = s * env
    if dead:
        k_ = sec(0.03)
        th = np.zeros(n)
        th[: min(k_, n)] = (head_norm(lp(r.standard_normal(k_), 300, 2), sec(0.003)) * np.exp(-tv(k_) / 0.008))[: min(k_, n)]
        s += 0.35 * th
    s *= ramp(n, 0.0025 if not dead else 0.0015)
    return tail(s * vel ** 1.2, 0.002 if hard else 0.006)


# ----------------------------------------------------------------------------
# pluck（兩聲部加法合成＋Karplus-Strong）
# ----------------------------------------------------------------------------
def ks_pluck(r, f, tau, bright, n, pick=0.13):
    """Karplus-Strong 撥弦：延遲線＝一個週期（整數 L＋分數 w 用 2 點內插），迴圈增益 ρ 決定衰減；
       激發＝一段噪音（亮度＝一階低通）、撥弦位置梳狀。以 L 為區塊向量化計算。"""
    D = SR / f
    L = int(D)
    w = D - L
    e = r.standard_normal(L)
    a = np.exp(-2 * np.pi * (700 + 7000 * bright) / SR)
    e = signal.lfilter([1 - a], [1, -a], e)
    p = max(1, int(round(pick * L)))
    e = e - np.concatenate([np.zeros(p), e[:-p]])
    e -= e.mean()
    e *= 0.5 / (np.sqrt(np.mean(e ** 2)) + 1e-12)
    rho = np.exp(-1.0 / (f * tau))
    y = np.zeros(n + L + 2)
    y[1 : L + 1] = e[: min(L, n + 1)]
    i = L + 1
    while i < n + 1:
        j = min(i + L, n + 1)
        y[i:j] = rho * ((1 - w) * y[i - L : j - L] + w * y[i - L - 1 : j - L - 1])
        i = j
    return y[1 : n + 1]


def pluck_note(r, m, vel, hold, bright=0.6, tau=0.30, attack=0.0012, ks_mix=0.32, rel=0.07):
    """pluck 一個音（立體聲）：左右兩聲部（−5／+5 cent，泛音初相位隨機）＝鋸齒與方波混合（偶次泛音 0.62 倍＝溫暖、略空心），
       經 4 極低通，fc(t) = f0×(1.3+0.6·亮度) + 包絡×exp(-t/55ms) + 慢包絡；高泛音衰減較快（弦的物理）；
       中間一支 Karplus-Strong 撥弦給「弦」的顆粒；hold 之後 rel 秒收掉"""
    n = sec(min(hold, tau * 4.5) + 6 * rel) + 1
    t = tv(n)
    td = t[::64]
    out = np.zeros((2, n))
    for ch, det in ((0, -5.0), (1, 5.0)):
        f0 = mhz(m) * 2 ** ((det + r.normal(0, 1.0)) / 1200)
        K = int(min(42, 9500 / f0))
        fc = f0 * (1.3 + 0.6 * bright) + (500 + 4800 * bright) * vel * np.exp(-t / 0.055) + 700 * bright * np.exp(-t / 0.35)
        fcd = fc[::64]
        ph0 = r.uniform(0, 2 * np.pi, K + 1)
        ph0[1] = 0.0
        s = np.zeros(n)
        for k in range(1, K + 1):
            w = (1.0 / k) * (1.0 if k % 2 else 0.62)
            rate = (1.0 + 0.11 * (k - 1)) / tau
            ad = w * _lp4(k * f0 / fcd, 0.9) * np.exp(-td * rate)
            idx = np.flatnonzero(ad > 1.5e-4)
            if len(idx) == 0:
                continue
            nk = min(n, (idx[-1] + 2) * 64)
            x = k * f0 / fc[:nk]
            s[:nk] += w * _lp4(x, 0.9) * np.exp(-t[:nk] * rate) * np.sin(2 * np.pi * k * f0 * t[:nk] + ph0[k])
        out[ch] = s
    if ks_mix > 0:
        f0 = mhz(m) * 2 ** (r.normal(0, 1.0) / 1200)
        ks = ks_pluck(r, f0, tau * 1.1, 0.35 + 0.4 * bright, n, pick=r.uniform(0.10, 0.18))
        ks = lp(ks, 2500 + 4000 * bright * vel, 2)
        out += ks_mix * ks * (1.0 / (np.max(np.abs(ks[: sec(0.02)])) + 1e-9)) * 0.5
    env = ramp(n, attack)
    h = sec(hold)
    if h < n:
        env[h:] *= np.exp(-(t[h:] - t[h]) / rel)
    out *= env
    return tail(out * vel ** 1.15, 0.01)


# ----------------------------------------------------------------------------
# 效果
# ----------------------------------------------------------------------------
def make_ir(r, rt=1.4, length=2.2, pre=0.015, lo_mult=1.0, hi_mult=0.45):
    """立體聲殘響脈衝：左右各自的噪音、三個頻帶不同衰減（高頻衰減快＝溫暖）、早期反射"""
    n = sec(length)
    t = tv(n)
    ir = np.zeros((2, n))
    for ch in range(2):
        z = r.standard_normal(n)
        lo = lp(z, 500, 2)
        hi = hp(z, 4000, 2)
        mid = z - lo - hi
        ex = lambda T: np.exp(-6.91 * t / T)
        y = lo * ex(rt * lo_mult) + mid * ex(rt) + hi * ex(rt * hi_mult)
        y *= 1 - np.exp(-t / 0.008)
        for _ in range(7):
            k = sec(r.uniform(0.002, 0.030))
            y[k] += r.uniform(-1, 1) * 3.0
        ir[ch] = np.concatenate([np.zeros(sec(pre)), y])[:n]
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def reverb(x, ir):
    out = np.zeros_like(x)
    for ch in range(2):
        out[ch] = signal.fftconvolve(x[ch], ir[ch])[: x.shape[1]]
    return out


def pingpong(x, delay_s, fb=0.32, taps=4):
    """左右交替的延遲（輸入取 mid），350 Hz–4.2 kHz（越反彈越暗）"""
    d = sec(delay_s)
    mono = 0.5 * (x[0] + x[1])
    out = np.zeros_like(x)
    g = 1.0
    src = mono
    for k in range(1, taps + 1):
        g *= fb if k > 1 else 1.0
        ch = (k + 1) % 2
        src = lp(src, 5200, 1) if k > 1 else src
        out[ch, k * d :] += g * src[: -k * d]
    return lp(hp(out, 350, 2), 4200, 2)


def chorus(x, base=0.010, depth=0.0018, rate=0.37, mix=0.28):
    n = x.shape[1]
    idx = np.arange(n, dtype=float)
    out = np.empty_like(x)
    for ch in range(2):
        d = (base + depth * np.sin(2 * np.pi * rate * idx / SR + ch * np.pi / 2)) * SR
        pos = np.clip(idx - d, 0, n - 1)
        i0 = pos.astype(int)
        fr = pos - i0
        i1 = np.minimum(i0 + 1, n - 1)
        out[ch] = x[ch] * (1 - mix) + mix * (x[ch, i0] * (1 - fr) + x[ch, i1] * fr)
    return out


def duck_env(kicks, depth, rel=0.10, att=0.003, length=N + PAD):
    """sidechain：每下大鼓前 2 ms 開始往下壓 depth，之後指數回來"""
    env = np.zeros(length)
    k = sec(0.6)
    tt = tv(k)
    shape = np.where(tt < att, tt / att, np.exp(-(tt - att) / rel))
    for p in kicks:
        s0 = int(round(p)) - sec(0.002)
        a = max(0, s0)
        seg = env[a : s0 + k]
        np.maximum(seg, shape[a - s0 : a - s0 + len(seg)], out=seg)
    return 1 - depth * env


def sat(x, drive, bias=0.0):
    """不對稱軟飽和（小訊號增益 = 1；bias ≠ 0 產生偶次泛音＝溫暖）"""
    d0 = np.tanh(drive * bias)
    return (np.tanh(drive * (x + bias)) - d0) / (drive * (1 - d0 ** 2))


# ----------------------------------------------------------------------------
# 編曲
# ----------------------------------------------------------------------------
# 和弦墊（pluck 軟音、長衰減；根音交給貝斯）：(拍號, 名稱, 拍數, 音)
CHORDS = [
    (32, 'Gm9', 4, [58, 62, 65, 69]),
    (36, 'Gm9', 4, [58, 62, 65, 69]),
    (40, 'Ebmaj9', 4, [55, 58, 62, 65]),
    (44, 'Cm9', 2, [55, 58, 62, 63]),
    (46, 'D9sus4', 2, [57, 60, 62, 67]),
    (48, 'Gm9', 4, [58, 62, 65, 69]),
    (52, 'Ebmaj9', 4, [55, 58, 62, 65]),
    (56, 'Cm9', 2, [55, 58, 62, 63]),
    (58, 'F6/9', 2, [55, 57, 60, 62]),
]
FINAL_CHORD = [55, 58, 62, 64, 69]  # Gm6/9：G3 B♭3 D4 E4 A4（多利安的大六度＝暖、不悲）
ROOT = {'Gm9': 31, 'Ebmaj9': 39, 'Cm9': 36, 'D9sus4': 38, 'F6/9': 41}

# 原創旋律（G 多利安）：(小節, 16 分位置, 音, 長度[16 分], 力度, 精確落拍)
MELODY = [
    # 小節 9（Gm9）drop＝「4.9」；第 2 拍（f928 ★落下）重音
    (9, 0, 74, 3, 0.92, True), (9, 3, 72, 1, 0.55, False), (9, 4, 74, 2, 0.82, True), (9, 6, 77, 3, 0.74, False),
    (9, 10, 74, 1, 0.60, False), (9, 11, 72, 2, 0.60, False), (9, 14, 70, 2, 0.66, False),
    # 小節 10（Gm9）：f1012「4.9」縮回
    (10, 0, 67, 3, 0.76, True), (10, 3, 70, 1, 0.50, False), (10, 4, 72, 2, 0.62, False), (10, 6, 74, 2, 0.70, False),
    (10, 8, 77, 4, 0.74, False), (10, 12, 76, 2, 0.56, False), (10, 14, 74, 2, 0.60, False),
    # 小節 11（E♭maj9）晚上
    (11, 0, 79, 3, 0.84, True), (11, 3, 77, 1, 0.54, False), (11, 4, 74, 2, 0.70, False), (11, 6, 70, 3, 0.66, False),
    (11, 10, 74, 1, 0.58, False), (11, 11, 77, 2, 0.62, False), (11, 14, 75, 2, 0.64, False),
    # 小節 12 前半（Cm9）
    (12, 0, 74, 3, 0.80, False), (12, 3, 72, 1, 0.54, False), (12, 4, 70, 2, 0.64, False), (12, 6, 67, 2, 0.58, False),
    # 小節 13（Gm9）鼓回來＝「你」：琶音頂音 A5 往上半音落在 B♭5
    (13, 0, 82, 3, 0.94, True), (13, 3, 81, 1, 0.55, False), (13, 4, 79, 2, 0.78, False), (13, 6, 77, 3, 0.72, False),
    (13, 10, 74, 1, 0.60, False), (13, 11, 77, 2, 0.62, False), (13, 14, 79, 2, 0.66, False),
    # 小節 14（E♭maj9）：「你」每拍脈動 → 旋律每拍都有音
    (14, 0, 79, 2, 0.78, False), (14, 3, 77, 1, 0.50, False), (14, 4, 74, 2, 0.68, False), (14, 6, 70, 2, 0.62, False),
    (14, 8, 74, 3, 0.72, False), (14, 11, 72, 1, 0.50, False), (14, 12, 70, 2, 0.62, False), (14, 14, 72, 2, 0.60, False),
    # 小節 15（Cm9 → F6/9）片尾
    (15, 0, 74, 3, 0.80, True), (15, 3, 75, 1, 0.52, False), (15, 4, 74, 2, 0.66, False), (15, 6, 72, 2, 0.60, False),
    (15, 8, 69, 3, 0.66, False), (15, 11, 72, 1, 0.50, False), (15, 12, 74, 2, 0.64, False), (15, 14, 76, 2, 0.66, False),
]
# 小節 12 後半（抽鼓）D9sus4 上行琶音：直的 16 分音符，漸強
ARP = [62, 67, 69, 72, 74, 76, 79, 81]

# 手鼓兩小節型：(16 分位置, 鼓, 力度, 悶音)
CONGA_A = [(3, 'hi', 0.45, True), (6, 'hi', 0.72, False), (10, 'lo', 0.80, False), (11, 'lo', 0.42, True), (14, 'hi', 0.66, False)]
CONGA_B = [(2, 'hi', 0.50, True), (6, 'hi', 0.74, False), (9, 'hi', 0.45, True), (10, 'lo', 0.82, False),
           (13, 'hi', 0.56, False), (15, 'lo', 0.40, True)]
CONGA_NIGHT = [(6, 'hi', 0.62, False), (10, 'lo', 0.70, False), (14, 'hi', 0.50, True)]

# 貝斯（前 8 小節，G 持續音上的動機）：(16 分位置, 音, 力度, 長度[16 分], 悶音)
B_CALL = [(2, 31, 0.95, 1.5, False), (3, 31, 0.48, 0.6, True), (6, 43, 0.80, 1.0, False), (10, 31, 0.92, 1.5, False),
          (11, 34, 0.62, 0.8, False), (13, 36, 0.74, 2.6, False)]
B_RESP = [(2, 31, 0.95, 1.5, False), (3, 31, 0.48, 0.6, True), (6, 41, 0.78, 1.0, False), (10, 31, 0.90, 1.2, False),
          (12, 29, 0.70, 1.0, False), (14, 38, 0.76, 1.4, False)]
B_RESP_SPARSE = [(2, 31, 0.90, 1.6, False), (6, 43, 0.72, 1.0, False), (10, 31, 0.86, 1.6, False), (14, 29, 0.70, 1.8, False)]
B_BUILD = [(2, 31, 0.95, 1.5, False), (3, 31, 0.48, 0.6, True), (6, 43, 0.80, 1.0, False), (8, 31, 0.82, 1.0, False),
           (10, 34, 0.84, 1.0, False), (12, 36, 0.86, 0.9, False), (13, 38, 0.88, 0.9, False), (14, 41, 0.92, 0.9, False)]
# 貝斯濾波開度（每小節）
B_CUT = {1: 0.44, 2: 0.44, 3: 0.48, 4: 0.42, 5: 0.56, 6: 0.56, 7: 0.55, 8: 0.75, 9: 0.66, 10: 0.66, 11: 0.56, 12: 0.60,
         13: 0.72, 14: 0.70, 15: 0.64, 16: 0.50}


def bass_drop(R, nxt=None, half=None):
    """第 9 小節起的滾動貝斯型；half='a'＝只前半小節，'b'＝只後半；nxt＝下一個根音（第 15 步的經過音）"""
    pat = [(2, R, 0.95, 1.4, False), (3, R, 0.45, 0.5, True), (6, R + 12, 0.84, 1.0, False), (7, R, 0.40, 0.5, True),
           (10, R, 0.92, 1.4, False), (13, R + 12, 0.60, 0.8, False), (14, R + 7, 0.78, 1.0, False)]
    if nxt is not None and nxt != R:
        pat.append((15, nxt - 1 if nxt - 1 != R else nxt + 2, 0.56, 0.7, False))
    if half == 'a':
        pat = [p for p in pat if p[0] < 8]
    elif half == 'b':
        pat = [p for p in pat if p[0] >= 8]
    return pat


def build():
    rs = np.random.default_rng
    rk, rc, rh, rp, rcg, rcr, rb, rpl, rch = (rs(s) for s in (301, 302, 303, 304, 305, 306, 307, 308, 309))
    B = {k: Bus() for k in ('kick', 'clap', 'hats', 'shaker', 'conga', 'rim', 'crash', 'bass', 'mel', 'chord')}
    ms = lambda x: x * SR / 1000.0
    log = dict(kicks=[], claps=[], hats=[], bass=[], mel=[], conga=[], shaker=[], rim=[])
    rr = rs(310)

    # ---------------- 大鼓：每拍；抽鼓（拍 46–47）不打；最後一擊 ----------------
    for b in range(0, 60):
        if CUT_BEAT <= b < BACK_BEAT:
            continue
        v = 1.0 if b % 4 == 0 else float(0.96 + 0.012 * rk.standard_normal())
        B['kick'].add(kick(rk, v), bs(b))
        log['kicks'].append(bs(b))
    B['kick'].add(kick(rk, 1.0), FINAL_POS)
    log['kicks'].append(FINAL_POS)

    # ---------------- 拍手：2、4 拍；小節 4 輕一點；小節 8 滾奏；抽鼓不打 ----------------
    claps = {}
    for b in range(60):
        if b % 4 in (1, 3) and not (CUT_BEAT <= b < BACK_BEAT):
            claps[float(b)] = (0.86 if b % 4 == 1 else 0.90) * (0.84 if 12 <= b < 16 else 1.0)
    for st, v in ((8, 0.30), (10, 0.42), (12, 0.88), (13, 0.52), (14, 0.68)):  # 小節 8 後半滾奏漸強（拉直）
        claps[step_beat(8, st, 0.5)] = v
    for b, v in sorted(claps.items()):
        v = v * (1 + 0.04 * rc.standard_normal())
        p = bs(b) + ms(1.8) + ms(rc.normal(0, 0.5))
        B['clap'].add(clap(rc, v), p)
        log['claps'].append((b, p, v))

    # ---------------- hi-hat ----------------
    ev = []
    for bar in range(1, 16):
        for st in range(16):
            if bar == 8 and st == 15:  # drop 前吸氣
                continue
            if bar == 15 and st >= 14:  # 最後一擊前留空
                continue
            if bar == 12 and st >= 8:  # 抽鼓：另外滾
                continue
            q = st % 4
            beat = step_beat(bar, st)
            if q == 2:
                kind = 'short' if bar <= 8 else 'open'
                v = 0.72 if st != 14 else 0.80
            elif bar >= 5:
                v = {0: 0.28, 1: 0.50, 3: 0.42}[q]
                kind = 'closed'
            else:
                continue
            if bar == 8:
                v *= 0.75 + 0.45 * st / 15
            jit = 0.0 if q == 0 else ms(rh.normal(0, 1.6))  # 正拍上的 hat 跟大鼓同一下，不加誤差（避免 flam）
            ev.append([bs(beat) + jit, float(np.clip(v * (1 + 0.08 * rh.standard_normal()), 0.08, 1.0)), kind, beat])
    # 抽鼓 2 拍：16 分（拍 46）→ 32 分（拍 47）closed hat 滾奏漸強；第一下精確落在拍 46
    roll = [CUT_BEAT + j / 4 for j in range(4)] + [CUT_BEAT + 1 + j / 8 for j in range(8)]
    for j, beat in enumerate(roll):
        v = 0.56 if j == 0 else 0.30 + 0.56 * j / (len(roll) - 1)  # 第一下是切的那一下（重音），之後從弱漸強
        jit = 0.0 if j == 0 else ms(rh.normal(0, 0.8))
        ev.append([bs(beat) + CUT_NUDGE + jit, float(v * (1 + (0.0 if j == 0 else 0.04) * rh.standard_normal())), 'closed', beat])
    ev.sort(key=lambda e: e[0])
    for i, (p, v, kind, beat) in enumerate(ev):
        nxt = ev[i + 1][0] if i + 1 < len(ev) else p + SR
        length = min(0.5, (nxt - p) / SR + 0.010) if kind == 'open' else None
        B['hats'].add(hat(rh, v, kind, length), p, pan=0.20)
        log['hats'].append((beat, p, v, kind))

    # ---------------- 沙鈴：小節 3 起（抽鼓、吸氣、最後留空不打） ----------------
    for bar in range(3, 16):
        for st in range(16):
            if (bar == 8 and st == 15) or (bar == 15 and st >= 14) or (bar == 12 and st >= 8):
                continue
            v = (0.36, 0.20, 0.58, 0.26)[st % 4] * (1 + 0.08 * rp.standard_normal())
            if bar in (3, 4):
                v *= 0.85
            p = bs(step_beat(bar, st)) + (0.0 if st % 4 == 0 else ms(rp.normal(0, 2.0)))  # 正拍不加誤差（跟大鼓同一下）
            B['shaker'].add(shaker(rp, v), p, pan=-0.35)
            log['shaker'].append((step_beat(bar, st), p, v))

    # ---------------- 手鼓：小節 5–6、9–10、13–14；小節 11 稀疏版 ----------------
    for bar in (5, 6, 9, 10, 11, 13, 14):
        pat = CONGA_NIGHT if bar == 11 else (CONGA_A if bar % 2 == 1 else CONGA_B)
        for st, drum, v, mute in pat:
            v = float(v * (1 + 0.07 * rcg.standard_normal()))
            p = bs(step_beat(bar, st)) + ms(rcg.normal(0, 2.5))
            B['conga'].add(conga(rcg, drum, v, mute), p, pan=0.42 if drum == 'hi' else -0.28)
            log['conga'].append((step_beat(bar, st), p, v))

    # ---------------- rim：小節 1–8，每拍 2、4 的「a」（拍手後面那個 16 分，搖擺）；小節 7–8 多加第 3 步 ----------------
    for bar in range(1, 9):
        steps = [(7, 0.62), (15, 0.55)] if bar < 7 else [(3, 0.42), (7, 0.62), (11, 0.46), (15, 0.55)]
        for st, v in steps:
            if bar == 8 and st == 15:
                continue
            v = float(v * (1 + 0.08 * rr.standard_normal()))
            p = bs(step_beat(bar, st)) + ms(rr.normal(0, 1.8))
            B['rim'].add(rim(rr, v), p, pan=-0.30)
            log['rim'].append((step_beat(bar, st), p, v))

    # ---------------- crash：drop、鼓回來、最後一擊 ----------------
    B['crash'].add(crash(rcr, 1.0), bs(DROP_BEAT))
    B['crash'].add(crash(rcr, 1.0), bs(BACK_BEAT))
    B['crash'].add(crash(rcr, 0.85, dur=2.0), FINAL_POS)

    # ---------------- 貝斯 ----------------
    def add_b(bar, st, m, v, steps, dead=False, exact=False, hard_until=None, straight=False, cut=None):
        beat = step_beat(bar, st, 0.5 if straight else SWING)
        cut = B_CUT[bar] if cut is None else cut
        p = bs(beat) + (0.0 if exact else ms(rb.normal(0, 1.2)))
        v = float(np.clip(v * (1 + (0.0 if exact else 0.05 * rb.standard_normal())), 0.05, 1.0))
        if hard_until is not None:
            dur = (hard_until - p) / SR
        else:
            dur = steps * S16 / SR
        B['bass'].add(bass_note(rb, m, v, dur, cut=cut, dead=dead, hard=hard_until is not None), p)
        log['bass'].append((beat, p, m, v, dead))

    for bar in range(1, 9):
        if bar == 8:
            pat = B_BUILD
        elif bar == 4:
            pat = B_RESP_SPARSE
        elif bar % 2 == 1:
            pat = B_CALL
        else:
            pat = B_RESP
        if bar in (5, 6):  # 燙・染：多兩個悶音
            pat = sorted(pat + [(7, 31, 0.40, 0.5, True), (15, 31, 0.42, 0.5, True)])
        for st, m, v, l, d in pat:
            cut = {7: 0.55 + 0.15 * st / 15, 8: 0.70 + 0.25 * st / 15}.get(bar)  # 小節 7–8 濾波一路打開
            add_b(bar, st, m, v, l, dead=d, straight=(bar == 8 and st >= 12), cut=cut)
    # 第 9 小節起跟和弦
    plan = {9: ('Gm9', 'Gm9'), 10: ('Gm9', 'Ebmaj9'), 11: ('Ebmaj9', 'Cm9'), 13: ('Gm9', 'Gm9'), 14: ('Ebmaj9', 'Cm9')}
    for bar, (cname, nname) in plan.items():
        for st, m, v, l, d in bass_drop(ROOT[cname], ROOT[nname]):
            add_b(bar, st, m, v, l, dead=d)
    # 小節 12：前半 Cm9，第 6 步 D2 一直撐到拍 46（抽鼓）硬切
    for st, m, v, l, d in [(2, 36, 0.92, 1.4, False), (3, 36, 0.45, 0.5, True)]:
        add_b(12, st, m, v, l, dead=d)
    add_b(12, 6, 38, 0.86, 2.0, hard_until=CUT_POS)
    # 小節 15：Cm9 → F6/9 → 第 13 步 D2（V 的根音）→ 最後一擊 G1；第 14–15 步留空
    for st, m, v, l, d in [(2, 36, 0.92, 1.4, False), (3, 36, 0.45, 0.5, True), (6, 48, 0.80, 1.0, False),
                           (10, 41, 0.90, 1.4, False), (13, 38, 0.74, 1.0, False)]:
        add_b(15, st, m, v, l, dead=d)
    # 最後一擊：G1 長音（自然衰減）
    B['bass'].add(bass_note(rb, 31, 0.92, 1.75, cut=0.5, decay=0.42), FINAL_POS)
    log['bass'].append((FINAL_BEAT, FINAL_POS, 31, 0.92, False))

    # ---------------- pluck 旋律 ----------------
    def add_m(beat, m, v, hold_s, exact, pos=None, bright=0.6, tau=0.30):
        p = (bs(beat) if pos is None else pos) + (0.0 if exact else ms(rpl.normal(0, 1.5)))
        v = float(np.clip(v * (1 + (0.0 if exact else 0.05 * rpl.standard_normal())), 0.05, 1.0))
        B['mel'].add(pluck_note(rpl, m, v, hold_s, bright=bright, tau=tau), p)
        log['mel'].append((beat, p, m, v))

    for bar, st, m, l, v, exact in MELODY:
        add_m(step_beat(bar, st), m, v, l * S16 / SR * 0.92, exact, bright=0.60 + 0.28 * v)
    for j, m in enumerate(ARP):  # 抽鼓琶音（第一下精確落在抽鼓點；第一下重一點，之後漸強）
        add_m(CUT_BEAT + j / 4, m, 0.50 if j == 0 else 0.34 + 0.07 * j, S16 / SR * 0.85, j == 0, pos=bs(CUT_BEAT + j / 4) + CUT_NUDGE,
              bright=0.45 + 0.05 * j, tau=0.22)
    add_m(FINAL_BEAT, 74, 0.86, 1.4, True, pos=FINAL_POS, bright=0.7, tau=0.55)  # 最後一擊頂音 D5

    # ---------------- 和弦墊（軟、長衰減、暗）；抽鼓那一下是短 stab；段落點和弦不滾奏（整齊落拍） ----------------
    for b0, name, nb, notes in CHORDS:
        exact = b0 in (DROP_BEAT, BACK_BEAT, CUT_BEAT)
        p0 = (CUT_POS if b0 == CUT_BEAT else bs(b0)) + (0.0 if exact else ms(rch.normal(0, 2.0)))
        v0 = 0.40 if b0 in (DROP_BEAT, BACK_BEAT) else 0.32
        for i, m in enumerate(sorted(notes)):
            st = p0 + (ms(i * 5.0 * (1 + 0.15 * rch.standard_normal())) if i and not exact else 0.0)
            v = float(v0 * (1 + 0.05 * rch.standard_normal()))
            if b0 == CUT_BEAT:  # 切的那一下：短、亮一點的 stab（之後交給延遲回音）
                B['chord'].add(pluck_note(rch, m, 0.46, 0.16, bright=0.45, tau=0.30, attack=0.0015, ks_mix=0.25, rel=0.08), st)
            else:
                B['chord'].add(pluck_note(rch, m, v, nb * BEAT / SR * 0.96, bright=0.22, tau=0.85, attack=0.004, ks_mix=0.18,
                                          rel=0.12), st)
    for m in FINAL_CHORD:  # 最後一擊：五個音同時落下
        B['chord'].add(pluck_note(rch, m, 0.50, 1.6, bright=0.3, tau=0.9, attack=0.0015, ks_mix=0.22, rel=0.3), FINAL_POS)

    return B, log


# ----------------------------------------------------------------------------
# 混音
# ----------------------------------------------------------------------------
def lufs(x, a=None, b=None):
    import pyloudnorm as pyln
    seg = x[:, a:b] if a is not None else x
    return pyln.Meter(SR).integrated_loudness(seg.T)


# 各元件在參考段落要到的響度（LUFS，混音前）。參考段落：鼓回來後（小節 13–14）
LEVELS = dict(kick=-20.0, drums_other=-22.5, bass=-20.5, mel=-22.0, chord=-28.0)
REF = (int(bs(bb(13))), int(bs(bb(15))))


def mixdown(B, log, verbose=True):
    ir_r = np.random.default_rng(331)
    plate = make_ir(ir_r, rt=1.5, length=2.4, pre=0.020)
    room = make_ir(ir_r, rt=0.45, length=0.8, pre=0.005, hi_mult=0.55)
    kicks = log['kicks']
    duck_bass = duck_env(kicks[:-1], 0.50, rel=0.085)  # 最後一擊的貝斯不讓位
    duck_pl = duck_env(kicks, 0.14, rel=0.13)
    duck_verb = duck_env(kicks, 0.30, rel=0.15)

    def cal(x, target, rng=REF):
        g = 10 ** ((target - lufs(x, *rng)) / 20)
        return x * g, g

    # ---- 鼓 ----
    kick = hp(B['kick'].x, 30, 2)
    kick, g_kick = cal(kick, LEVELS['kick'])
    clap = peq(hp(B['clap'].x, 180, 2), 2600, 2.0, 0.8)
    hats = B['hats'].x
    shk = B['shaker'].x
    cg = hp(B['conga'].x, 150, 2)
    rm = hp(B['rim'].x, 300, 2)
    crash_ = hp(B['crash'].x, 320, 2)
    other = lp(clap * 1.0 + hats * 0.40 + shk * 0.22 + cg * 0.42 + rm * 0.20 + crash_ * 0.15, 14000, 1)
    other = shelf(other, 6000, 2.0, 'high')
    verb_in = hp(clap * 0.20 + hats * 0.04 + shk * 0.05 + cg * 0.16 + rm * 0.10, 300, 2)
    other_v = other + reverb(verb_in, room) * 0.75 * duck_verb + reverb(hp(clap * 0.10 + crash_ * 0.02, 300, 2), plate) * 0.5 * duck_verb
    other_v, g_other = cal(other_v, LEVELS['drums_other'])

    # ---- 貝斯 ----
    bass = B['bass'].x[0].copy()  # 單聲道
    pk = np.max(np.abs(bass)) + 1e-12
    bass = sat(bass / pk * 0.9, 2.2, 0.12) * pk / 0.9
    growl = bp(bass, 260, 1500, 2)  # 平行破音：只取 260–1500 Hz 再推一次（手機喇叭聽得到的貝斯線）
    gk = np.max(np.abs(growl)) + 1e-12
    growl = sat(growl / gk * 1.2, 2.6, 0.18) * gk / 1.2
    bass = bass + 0.55 * lp(growl, 2400, 2)
    bass = lp(bass, 4200, 2)
    bass = hp(bass, 30, 2)
    bass = peq(bass, 240, -2.0, 1.0)
    bass = peq(bass, 820, 4.5, 0.7)  # 手機喇叭靠這段聽到貝斯線
    bass = bass * duck_bass
    bass = np.vstack([bass, bass])
    bass, g_bass = cal(bass, LEVELS['bass'])

    # ---- pluck ----
    def pl_chain(x, hpf=180):
        x = hp(x, hpf, 2)
        pk = np.max(np.abs(x)) + 1e-12
        x = sat(x / pk * 0.8, 1.2, 0.05) * pk / 0.8
        x = peq(x, 320, -2.5, 0.9)
        x = peq(x, 3500, 2.5, 0.8)
        x = lp(x, 11000, 2)
        return chorus(x)

    mel = pl_chain(B['mel'].x)
    mel, g_mel = cal(mel, LEVELS['mel'])
    chord = pl_chain(B['chord'].x, 170)
    chord = lp(chord, 3200, 2)
    chord, g_chord = cal(chord, LEVELS['chord'])
    send = hp(mel * 0.26 + chord * 0.45, 300, 2)
    pluck = (mel + chord) * duck_pl + reverb(send, plate) * 0.55 * duck_verb + pingpong(mel, BEAT * 0.75 / SR, 0.30, 4) * 0.24

    stems = dict(drums=kick + other_v, bass=bass, pluck=pluck)
    stems = {k: hp(v, 22, 2)[:, :N] for k, v in stems.items()}
    # 抽鼓：貝斯分軌在所有濾波之後才關閘（拍 46 起 1.5 ms 升餘弦 → 0，到拍 48 前都沒有貝斯音），切點精確、沒有高通濾波的拖尾
    a, k = int(round(CUT_POS)), sec(0.0015)
    gate = np.ones(N)
    gate[a : a + k] = 0.5 + 0.5 * np.cos(np.pi * np.arange(k) / k)
    gate[a + k : int(bs(BACK_BEAT)) - sec(0.002)] = 0.0
    stems['bass'] = stems['bass'] * gate
    if verbose:
        print('  校準增益（dB）：' + '，'.join(f'{k} {db(g):+.1f}' for k, g in dict(kick=g_kick, drums_other=g_other, bass=g_bass,
                                                                                   mel=g_mel, chord=g_chord).items()))
    parts = dict(kick=kick[:, :N], other=other_v[:, :N], hats=hats[:, :N] * 0.40 * g_other)
    return stems, parts


# ----------------------------------------------------------------------------
# 母帶
# ----------------------------------------------------------------------------
def true_peak_env(x):
    up = signal.resample_poly(x, 4, 1, axis=1)
    return np.abs(up).max(axis=0).reshape(-1, 4).max(axis=1)


def limiter(x, ceil_db=LIMIT_CEIL_DB, look=0.0015, rel=0.08):
    """前瞻式 true-peak 限幅器（4× 超取樣偵測），回傳 (輸出, 增益曲線)"""
    ceil = 10 ** (ceil_db / 20)
    g_req = np.minimum(1.0, ceil / np.maximum(true_peak_env(x), 1e-9))
    Lk = max(2, sec(look))
    g_min = minimum_filter1d(g_req, size=2 * Lk + 1)
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
    gs = np.convolve(np.concatenate([np.ones(Lk - 1), g]), np.ones(Lk) / Lk, mode='valid')
    return x * gs, gs


def glue_gain(x, ratio=1.5, att=0.010, rel=0.18, hop=48):
    """匯流排黏合壓縮（連動：同一條增益曲線乘在每個分軌上）。門檻＝參考段 10 ms RMS 的 95 百分位 − 4 dB"""
    mono = 0.5 * (x[0] + x[1])
    k = sec(0.010)
    pw = np.convolve(mono ** 2, np.ones(k) / k, mode='same')[::hop]
    lvl = 10 * np.log10(pw + 1e-12)
    a, b = REF[0] // hop, REF[1] // hop
    thr = np.percentile(lvl[a:b], 95) - 4.0
    over = lvl - thr
    knee = 6.0
    gr = np.where(over <= -knee / 2, 0.0, np.where(over >= knee / 2, (1 / ratio - 1) * over, (1 / ratio - 1) * (over + knee / 2) ** 2 / (2 * knee)))
    aa = np.exp(-hop / (att * SR))
    ar = np.exp(-hop / (rel * SR))
    out = np.empty_like(gr)
    g = 0.0
    for i, v in enumerate(gr.tolist()):
        g = aa * g + (1 - aa) * v if v < g else ar * g + (1 - ar) * v
        out[i] = g
    gain = 10 ** (out / 20)
    return np.interp(np.arange(N), np.arange(len(gain)) * hop, gain), thr


def fade_env():
    e = np.ones(N)
    k = sec(0.0005)
    e[:k] = 0.5 - 0.5 * np.cos(np.pi * np.arange(k) / k)
    a, b = F(FADE_A), F(FADE_B)
    e[a:b] = 0.5 + 0.5 * np.cos(np.pi * np.arange(b - a) / (b - a))
    e[b:] = 0.0
    return e


def master(stems, verbose=True, target=TARGET_LUFS, ceil_db=LIMIT_CEIL_DB):
    """target＝pyloudnorm 要瞄準的值（跟 ffmpeg 量的差會在 main 裡修正）"""
    mix = sum(stems.values())
    g_glue, thr = glue_gain(mix)
    fe = fade_env()
    gm = 10 ** ((target - lufs(mix * g_glue * fe)) / 20)
    for it in range(10):
        pre = mix * g_glue * gm * fe
        y, gl = limiter(pre, ceil_db)
        lu = lufs(y)
        if verbose:
            print(f'  母帶迭代 {it}: 增益 {db(gm):+.2f} dB  LUFS={lu:.2f}  限幅最大壓縮 {-db(gl.min()):.2f} dB  '
                  f'黏合最大壓縮 {-db(g_glue.min()):.2f} dB')
        if abs(target - lu) < 0.015:
            break
        gm *= 10 ** ((target - lu) / 20)
    total = g_glue * gm * fe * gl
    if verbose:
        grl = -20 * np.log10(np.maximum(gl, 1e-9))
        print(f'  限幅：壓縮 >1 dB 的時間 {np.mean(grl > 1) * 100:.2f}%、>2 dB {np.mean(grl > 2) * 100:.2f}%、>3 dB {np.mean(grl > 3) * 100:.3f}%')
    out = {k: v * total for k, v in stems.items()}
    y = sum(out.values())
    return y, out, dict(gain_db=db(gm), lim_db=-db(gl.min()), glue_db=-db(g_glue.min()), glue_thr=thr, total=total)


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
        n, ch, sw, fr = w.getnframes(), w.getnchannels(), w.getsampwidth(), w.getframerate()
        raw = w.readframes(n)
    a = np.frombuffer(raw, dtype=np.uint8).reshape(-1, 3)
    v = a[:, 0].astype(np.int32) | (a[:, 1].astype(np.int32) << 8) | (a[:, 2].astype(np.int32) << 16)
    v = np.where(v >= 1 << 23, v - (1 << 24), v)
    return v.reshape(-1, ch).T / 8388608.0, n, ch, sw, fr


def ffmpeg_ebur128(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                       capture_output=True, text=True)
    txt = r.stderr
    summ = txt[txt.rfind('Summary:') :]
    I = float(re.search(r'I:\s+(-?[\d.]+) LUFS', summ).group(1))
    LRA = float(re.search(r'LRA:\s+(-?[\d.]+) LU', summ).group(1))
    TP = float(re.search(r'Peak:\s+(-?[\d.inf]+) dBFS', summ).group(1))
    return I, TP, LRA


# ----------------------------------------------------------------------------
# 驗證
# ----------------------------------------------------------------------------
def _fb_ratio(mono, s0, W, search, invert=False):
    """前後能量比：每個位置 p 比較 [p, p+W) 與 [p-W, p) 的能量（dB）。階躍型起音在 p = 起點時最大；
       invert=True 找能量最陡的下降點（回傳的 dB 為正＝下降量）。"""
    lo, hi = s0 - search - W, s0 + search + W
    seg = mono[max(0, lo) : hi] ** 2
    if lo < 0:
        seg = np.concatenate([np.zeros(-lo), seg])
    c = np.concatenate([[0.0], np.cumsum(seg)])
    p = np.arange(W, len(seg) - W + 1)
    eps = 1e-14 * W
    r = 10 * np.log10((c[p + W] - c[p] + eps) / (c[p] - c[p - W] + eps))
    pos = lo + p
    keep = np.abs(pos - s0) <= search
    r, pos = r[keep], pos[keep]
    if invert:
        r = -r
    k = int(np.argmax(r))
    return (pos[k] - s0) / SR * 1000.0, float(r[k])


def band(x, which):
    mono = x.sum(axis=0) if x.ndim == 2 else x
    if which == 'full':
        return mono
    lo_hi = {'>5k': (5000, None), '>2k': (2000, None), '<150': (None, 150), '1-4k': (1000, 4000), '>1.5k': (1500, None),
             'mid': (200, 2000), '60-150': (60, 150)}[which]
    lo, hi = lo_hi
    if lo is None:
        return lp(mono, hi, 4)
    if hi is None:
        return hp(mono, lo, 4)
    return bp(mono, lo, hi, 2)


def onset(x, s0, bands, search=0.020, W=0.003):
    """在 s0±20 ms 內用 3 ms 前後能量比找起點（先裁出前後 0.5 秒再濾波）；取跳升最明顯的頻帶"""
    a = max(0, s0 - sec(0.5))
    seg = x[..., a : s0 + sec(0.5)]
    best = None
    for b_ in bands:
        off, r = _fb_ratio(band(seg, b_), s0 - a, sec(W), sec(search))
        if best is None or r > best[1]:
            best = (off, r, b_)
    return best


def flux_onset(x, s0, search=0.025, nfft=1024, hop=48):
    """第二種偵測（跟能量比無關）：線性振幅頻譜通量（Hann 1024 點＝21 ms、1 ms hop），在 s0±25 ms 內找通量最大的窗中心。
       已知偏差：打擊樂瞬態的通量峰值會比實際起音早約 0.5–2 ms（Hann 窗上升沿）；窗再短會被貝斯的單一週期干擾。回傳 (ms, 峰值/中位數 dB)"""
    mono = x.sum(axis=0) if x.ndim == 2 else x
    a = int(s0 - search * SR - nfft)
    seg = mono[max(0, a) : int(s0 + search * SR + nfft)]
    if a < 0:
        seg = np.concatenate([np.zeros(-a), seg])
    win = np.hanning(nfft)
    starts = np.arange(0, len(seg) - nfft, hop)
    frames = np.stack([seg[i : i + nfft] * win for i in starts])
    mag = np.abs(np.fft.rfft(frames, axis=1))
    fl = np.maximum(np.diff(mag, axis=0), 0).sum(axis=1)
    centers = a + starts[1:] + nfft // 2
    keep = np.abs(centers - s0) <= search * SR
    k = int(np.argmax(np.where(keep, fl, -1)))
    return (centers[k] - s0) / SR * 1000.0, db(fl[k] / (np.median(fl[keep]) + 1e-12))


def thresh_onset(x, s0, lead=0.020, rise_db=9.0):
    """第三種偵測（最字面的定義，像在波形編輯器裡看）：依序試 全頻／>2 kHz／<150 Hz（2 階、延遲小），
       第一個超過「前面 lead 秒內峰值 + rise_db」的樣本（從 s0−4 ms 開始找）；三個頻帶都沒有越過就回傳 (None, None)"""
    mono = x.sum(axis=0) if x.ndim == 2 else x
    a = int(s0 - sec(0.3))
    raw = mono[a : int(s0 + sec(0.05))]
    i0 = int(s0 - a)
    for lab, seg in (('全頻', raw), ('>2 kHz', hp(raw, 2000, 4)), ('<150 Hz', lp(raw, 150, 2))):
        pre = np.abs(seg[i0 - sec(lead) - sec(0.004) : i0 - sec(0.004)]).max()
        hit = np.abs(seg[i0 - sec(0.004) :]) > pre * 10 ** (rise_db / 20)
        if hit.any():
            idx = i0 - sec(0.004) + int(np.argmax(hit))
            return (a + idx - s0) / SR * 1000.0, lab
    return None, None


def rms_db(x, a, b):
    return db(np.sqrt(np.mean(x[..., a:b] ** 2)))


# (名稱, 精確樣本位置, 分鏡格, 看哪個分軌, 頻帶, 是否為分鏡指定的段落點)
def checks():
    c = [
        ('f0 開頭：大鼓第一下', 0.0, 0, 'drums', ('full',), True),
        ('f28 第 2 拍：拍手（5 個客飛出）', bs(1), sb_frame(1), 'drums', ('1-4k',), False),
        ('f56 第 3 拍：大鼓（黃格填滿）', bs(2), sb_frame(2), 'drums', ('full',), False),
        ('f225 小節 3 硬切（名牌）', bs(8), sb_frame(8), 'drums', ('full',), False),
        ('f450 小節 5 燙（手鼓/16 分 hat 進）', bs(16), sb_frame(16), 'drums', ('full',), False),
        ('f675 小節 7 從頭到尾', bs(24), sb_frame(24), 'drums', ('full',), False),
        ('f900 drop：pluck 旋律進場', bs(DROP_BEAT), 900, 'pluck', ('full', '>1.5k'), True),
        ('f900 drop：crash', bs(DROP_BEAT), 900, 'drums', ('>5k',), True),
        ('f928 ★落下：旋律重音', bs(33), sb_frame(33), 'pluck', ('>1.5k', 'mid'), False),
        ('f1012 小節 10：4.9 縮回（旋律）', bs(36), sb_frame(36), 'pluck', ('>1.5k', 'mid'), False),
        ('f1294 抽鼓：hat 滾奏第一下', CUT_POS, 1294, 'drums', ('>5k',), True),
        ('f1294 抽鼓：stab＋琶音第一下', CUT_POS, 1294, 'pluck', ('>1.5k', 'mid'), True),
        ('f1294 抽鼓（成品 >150 Hz）', CUT_POS, 1294, 'mix', ('>2k', '>1.5k'), True),
        ('f1350 鼓回來的正拍（大鼓）', bs(BACK_BEAT), 1350, 'drums', ('full', '60-150'), True),
        ('f1350 鼓回來：旋律 B♭5', bs(BACK_BEAT), 1350, 'pluck', ('>1.5k', 'mid'), True),
        ('f1350 鼓回來：成品低頻', bs(BACK_BEAT), 1350, 'mix', ('<150',), True),
        ('f1688 最後一擊（成品）', FINAL_POS, 1688, 'mix', ('full', '>2k'), True),
        ('f1688 最後一擊（pluck 和弦）', FINAL_POS, 1688, 'pluck', ('>1.5k', 'mid'), True),
    ]
    return c


def verify(y, stems, parts, log, info):
    print('\n================ 驗證 ================')
    yy, nfr, ch, sw, fr = read_wav24(OUT_WAV)
    ok_len = nfr == N
    print(f'[長度] {nfr} 樣本、{ch} 聲道、{sw * 8}-bit、{fr} Hz → {"OK（剛好 1,440,000＝30.000 秒）" if ok_len else "不符！"}')
    for k in STEMS:
        _, n2, c2, s2, f2 = read_wav24(os.path.join(STEM_DIR, f'{k}.wav'))
        print(f'       分軌 {k:<6s} {n2} 樣本、{c2} 聲道、{s2 * 8}-bit、{f2} Hz')
    ssum = sum(read_wav24(os.path.join(STEM_DIR, f'{k}.wav'))[0] for k in STEMS)
    print(f'       三軌相加 − 主檔：最大誤差 {db(np.abs(ssum - yy).max()):.1f} dBFS（24-bit 量化等級）')

    I, TP, LRA = ffmpeg_ebur128(OUT_WAV)
    print(f'[ffmpeg ebur128] Integrated = {I:.1f} LUFS，True peak = {TP:.1f} dBTP，LRA = {LRA:.1f} LU')
    print(f'[pyloudnorm]     Integrated = {lufs(yy):.2f} LUFS；母帶增益 {info["gain_db"]:+.2f} dB，'
          f'黏合壓縮最大 {info["glue_db"]:.2f} dB，限幅最大 {info["lim_db"]:.2f} dB')

    # 頭尾
    absmax = np.abs(yy).max(axis=0)
    first_nz = int(np.argmax(absmax > 0))
    first_60 = int(np.argmax(absmax > 10 ** (-60 / 20)))
    nzs = np.flatnonzero(absmax > 0)
    last_nz = int(nzs[-1]) if len(nzs) else -1
    print(f'[頭] 第 0 樣本 = {yy[:, 0].tolist()}；第一個非零樣本 #{first_nz}；第一個 > -60 dBFS #{first_60}'
          f'（{first_60 / SR * 1000:.2f} ms）；前 10 ms 峰值 {db(np.abs(yy[:, :sec(0.01)]).max()):.1f} dBFS')
    print(f'[尾] 最後一個非零樣本 #{last_nz}（第 {last_nz / SPF:.2f} 格）；f{FADE_B}–1800 峰值 {np.abs(yy[:, F(FADE_B):]).max():.1e}')
    for a, b in ((1660, 1687), (1688, 1720), (1720, 1752), (1752, 1774), (1774, 1796)):
        print(f'      f{a}–{b} RMS {rms_db(yy, F(a), F(b)):6.1f} dBFS')

    secs = [(0, 8, '1–2 開場 鼓＋貝斯'), (8, 16, '3–4 ＋沙鈴'), (16, 24, '5–6 燙染 ＋手鼓'), (24, 32, '7–8 從頭到尾 build'),
            (32, 40, '9–10 drop 4.9'), (40, 46, '11–12a 晚上'), (46, 48, '12b 抽鼓'), (48, 56, '13–14 鼓回來 你'),
            (56, 60, '15 片尾'), (60, 64, '16 最後一擊＋尾音')]
    print('[每小節響度 LUFS] ' + ' '.join(f'{b}:{lufs(yy, int(bs(bb(b))), int(bs(bb(b + 1)))):.1f}' for b in range(1, 16)))
    print('[段落短時響度]')
    for a, b, lab in secs:
        print(f'      f{bf(a):6.1f}–{bf(b):<7.1f} {lab:<20s} {lufs(yy, int(bs(a)), min(N, int(bs(b)))):6.1f} LUFS')

    # 段落點對位
    print('\n[對位] 精確拍點＝拍號 × 22,500 樣本（128 BPM，不四捨五入到格）；分鏡格＝bar30()/b30() 四捨五入後畫面發生的那一格')
    print('  要求：起音距精確拍點 ≤ 5 ms；★＝分鏡指定的段落點，另外要求起音距分鏡格首 ≤ 5 ms 或落在該格內（格首後 16.7 ms 內）')
    print('  事件                              | 精確位置  | 分軌起音 − 精確 | 成品起音 − 精確 | 起音所在格 | 起音 − 分鏡格首')
    worst = 0.0
    rows = []
    for name, exact, sb, src, bands, key in checks():
        if name.startswith('f1688'):
            ref = bs(FINAL_BEAT)  # 精確拍點（音樂上的小節 16 正拍）
        elif name.startswith('f1294'):
            ref = bs(CUT_BEAT)  # 精確拍點（小節 12 第 3 拍）
        else:
            ref = exact
        s0 = int(round(exact))
        xs = yy if src == 'mix' else stems[src]
        off, rise, bnd = onset(xs, s0, bands)
        offm, risem, _ = onset(yy, s0, ('full', '>2k', '>5k', '<150'))
        t_on = s0 + off * SR / 1000
        d_ex = (t_on - ref) / SR * 1000
        vs_sb = (t_on - F(sb)) / SR * 1000
        worst = max(worst, abs(d_ex))
        bad = abs(d_ex) > 5.0 or (key and not (-5.0 <= vs_sb < 1000.0 / FPS))
        rows.append(dict(name=name, exact_frame=ref / SPF, off_ms=d_ex, mix_ms=(s0 + offm * SR / 1000 - ref) / SR * 1000,
                         frame=int(t_on // SPF), sb=sb, vs_sb=vs_sb, key=key, ok=not bad, rise=rise))
        print(f'  {"★" if key else " "}{name:<32s} | f{ref / SPF:8.2f} | {src:<5s}{d_ex:+6.2f} ms（{rise:+5.1f} dB {bnd:>5s}）| '
              f'{rows[-1]["mix_ms"]:+6.2f} ms（{risem:+5.1f} dB）| f{int(t_on // SPF):<5d} | f{sb}：{vs_sb:+6.2f} ms{"  <-- 超出" if bad else ""}')

    # 第二種偵測：成品的線性頻譜通量（獨立交叉檢查四個段落點）
    print('\n[交叉檢查] 成品用另外兩種偵測找起音（線性頻譜通量 1 ms 解析度、已知偏早 0.5–2 ms；門檻穿越 1 樣本解析度）：')
    yh = hp(yy, 150, 4)
    flux_rows = []
    for lab, pos, ref, sb in (('f900 drop', bs(DROP_BEAT), bs(DROP_BEAT), 900), ('f1294 抽鼓（stab＋hat＋琶音）', CUT_POS, bs(CUT_BEAT), 1294),
                              ('f1350 鼓回來', bs(BACK_BEAT), bs(BACK_BEAT), 1350), ('f1688 最後一擊', FINAL_POS, bs(FINAL_BEAT), 1688)):
        for blab, sig in (('全頻', yy), ('>150 Hz', yh)):
            off, pk = flux_onset(sig, int(round(pos)))
            t_on = pos + off * SR / 1000
            e1, e2 = (t_on - ref) / SR * 1000, (t_on - F(sb)) / SR * 1000
            flux_rows.append((lab, blab, e1, e2))
            print(f'      {lab:<26s} 通量 {blab:<8s} 起音 − 精確拍點 {e1:+6.2f} ms；− f{sb} 格首 {e2:+6.2f} ms'
                  f'（峰值高出中位數 {pk:.1f} dB）{"" if abs(e1) <= 5 and abs(e2) <= 5 else "  <-- 超出"}')
        off, tb = thresh_onset(yy, int(round(pos)))
        if off is None:
            print(f'      {lab:<26s} 門檻 +9 dB：三個頻帶都沒有越過（n/a）')
            continue
        t_on = int(round(pos)) + off * SR / 1000
        e1, e2 = (t_on - ref) / SR * 1000, (t_on - F(sb)) / SR * 1000
        print(f'      {lab:<26s} 門檻 {tb} +9 dB 起音 − 精確拍點 {e1:+6.2f} ms；− f{sb} 格首 {e2:+6.2f} ms'
              f'（第 {int(t_on)} 樣本）{"" if abs(e1) <= 5 and abs(e2) <= 5 else "  <-- 超出"}')

    # 抽鼓（拍 46–48）：貝斯在拍 46 硬切（最陡下降點）、沒有新的大鼓、hat 還在滾
    s46, s48 = int(bs(CUT_BEAT)), int(bs(BACK_BEAT))

    def half_drop(sig, W):
        """包絡（Hilbert 振幅、置中 W 秒移動平均＝對稱，不偏移）跌破「拍 46 前 60–15 ms 平均」一半的第一個樣本；回傳 (ms, 降幅 dB)"""
        a0, a1 = s46 - sec(0.25), s46 + sec(0.25)
        e = np.abs(signal.hilbert(sig[a0:a1]))
        k = max(1, sec(W))
        e = np.convolve(e, np.ones(k) / k, mode='same')
        pre = np.mean(e[sec(0.25) - sec(0.06) : sec(0.25) - sec(0.015)])
        i0 = sec(0.25) - sec(0.02)
        idx = i0 + int(np.argmax(e[i0:] < 0.5 * pre))
        post = np.mean(e[sec(0.25) + sec(0.03) : sec(0.25) + sec(0.1)])
        return (a0 + idx - s46) / SR * 1000, db(pre / max(post, 1e-12))

    for lab, sig, W in (('貝斯分軌 包絡 50% 點', stems['bass'].sum(axis=0), 0.0005),
                        ('成品 <150 Hz 包絡 50% 點', signal.sosfiltfilt(_sos('lowpass', 150, 4), yy.sum(axis=0)), 0.0137)):
        offd, rd = half_drop(sig, W)
        t_d = s46 + offd * SR / 1000
        vs_sb = (t_d - F(1294)) / SR * 1000
        okd = abs(offd) <= 5.0 and -5.0 <= vs_sb < 1000.0 / FPS
        rows.append(dict(name='f1294 抽鼓：' + lab, exact_frame=bf(CUT_BEAT), off_ms=offd, mix_ms=offd, frame=int(t_d // SPF), sb=1294,
                         vs_sb=vs_sb, key=True, ok=okd, rise=-rd))
        print(f'  ★f1294 抽鼓：{lab:<22s}| f{bf(CUT_BEAT):8.2f} | {offd:+6.2f} ms（之後降 {rd:4.1f} dB，{W * 1000:.1f} ms 窗）| '
              f'{"":>17s}| f{int(t_d // SPF):<5d} | f1294：{vs_sb:+6.2f} ms{"" if okd else "  <-- 超出"}')
    kick_low = band(stems['drums'], '60-150')
    new_hits = db(np.abs(kick_low[s46 + sec(0.06) : s48 - sec(0.003)]).max())
    pre_low = rms_db(kick_low, s46 - int(2 * BEAT), s46)
    cut_low = rms_db(kick_low, s46 + sec(0.06), s48 - sec(0.005))
    hf = band(stems['drums'], '>5k')
    pre_hf = rms_db(hf, s46 - int(2 * BEAT), s46)
    cut_hf = rms_db(hf, s46, s48)
    print(f'\n[抽鼓] 鼓分軌 60–150 Hz（大鼓）：拍 44–46 {pre_low:.1f} → 拍 46–48 {cut_low:.1f} dBFS（{cut_low - pre_low:+.1f} dB）；'
          f'抽鼓段內 60–150 Hz 峰值 {new_hits:.1f} dBFS（沒有新的大鼓）')
    print(f'       鼓分軌 >5 kHz（hat）：拍 44–46 {pre_hf:.1f} → 拍 46–48 {cut_hf:.1f} dBFS（hat 繼續滾，不靜音）')
    print(f'       抽鼓段成品 RMS {rms_db(yy, s46, s48):.1f} dBFS；貝斯分軌 {rms_db(stems["bass"], s46 + sec(0.02), s48):.1f} dBFS；'
          f'pluck 分軌 {rms_db(stems["pluck"], s46, s48):.1f} dBFS')
    back = rms_db(stems['drums'], s48, s48 + int(BEAT))
    print(f'[回來] 拍 48 第 1 拍鼓分軌 RMS {back:.1f} dBFS（比抽鼓段 {rms_db(stems["drums"], s46, s48):.1f} 高 '
          f'{back - rms_db(stems["drums"], s46, s48):.1f} dB）')

    # 律動
    print('\n[律動]')
    hats_m = band(parts['hats'], '>5k')
    devs = {0: [], 1: []}
    for bar in list(range(5, 8)) + [9, 10, 11, 13, 14]:
        for st_ in range(16):
            if st_ % 2 == 0 and st_ % 4 == 2:
                continue  # 反拍開放 hat 會蓋住後面，只量 16 分 ghost 與正拍
            g0 = int(round(bs(step_beat(bar, st_, 0.5))))
            off, r_ = _fb_ratio(hats_m, g0, sec(0.0015), sec(0.025))
            if r_ > 6.0:
                devs[st_ % 2].append(off)
    ev_, od_ = np.array(devs[0]), np.array(devs[1])
    sw_meas = 50 + np.mean(od_) / (BEAT / 2 / SR * 1000) * 100
    print(f'  hi-hat（以拉直 16 分格點 ±25 ms 找起音；偵測到 正 {len(ev_)}／反 {len(od_)} 個）：'
          f'反 16 分平均晚 {np.mean(od_):+.1f} ms（σ {np.std(od_):.1f}）→ 搖擺 {sw_meas:.1f}%（設定 {SWING * 100:.1f}%）；'
          f'正 16 分偏差平均 {np.mean(ev_):+.1f} ms、σ = {np.std(ev_):.1f} ms（人手誤差）')
    hv = np.array([v for (_, _, v, _) in log['hats']])
    sv = np.array([v for (_, _, v) in log['shaker']])
    cv = np.array([v for (_, _, v) in log['conga']])
    bv = np.array([v for (_, _, _, v, d) in log['bass'] if not d])
    mv = np.array([v for (_, _, _, v) in log['mel']])
    cvf = lambda a: np.std(a) / np.mean(a)
    print(f'  力度變化（CV＝標準差/平均）：hat {cvf(hv):.2f}、沙鈴 {cvf(sv):.2f}、手鼓 {cvf(cv):.2f}、貝斯 {cvf(bv):.2f}、旋律 {cvf(mv):.2f}；'
          f'貝斯 ghost note {sum(1 for x in log["bass"] if x[4])} 個')
    kp = np.array(log['kicks'][:-1])
    kd = kp - np.round(kp / BEAT) * BEAT
    print(f'  大鼓：{len(kp) + 1} 下，對拍點最大誤差 {np.abs(kd).max() / SR * 1000:.3f} ms（四拍穩定，不加誤差；最後一擊另計 +4.17 ms）')
    sm = np.array([p - bs(b) for (b, p, _, _, _) in log['bass']])
    print(f'  貝斯時間誤差 σ {np.std(sm) / SR * 1000:.2f} ms；旋律時間誤差 σ '
          f'{np.std([p - bs(b) for (b, p, _, _) in log["mel"][:-1]]) / SR * 1000:.2f} ms')

    # 頻段能量
    print('\n[頻段能量] 各段 RMS（dBFS，左右相加/2）')
    edges = [(20, 60, 'sub'), (60, 120, 'low'), (120, 250, 'lowmid'), (250, 500, 'mid-'), (500, 2000, 'mid'),
             (2000, 6000, 'pres'), (6000, 16000, 'air')]
    mono = 0.5 * yy.sum(axis=0)
    bands_x = {lab: bp(mono, max(lo, 20), hi, 4) for lo, hi, lab in edges}
    print('      段落                    ' + ''.join(f'{lab:>8s}' for _, _, lab in edges))
    for a_, b_, lab in secs:
        A, Bq = int(bs(a_)), min(N, int(bs(b_)))
        print(f'      {lab:<22s}' + ''.join(f'{rms_db(bands_x[l], A, Bq):8.1f}' for _, _, l in edges))
    f, P = signal.welch(mono[int(bs(48)) : int(bs(56))], SR, nperseg=16384)
    ref = None
    line = '  小節 13–14 1/1 倍頻程（相對 1 kHz，dB）：'
    vals = []
    for fc in (31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000):
        m = (f >= fc / np.sqrt(2)) & (f < fc * np.sqrt(2))
        e = 10 * np.log10(np.sum(P[m]) + 1e-20)
        vals.append((fc, e))
        if fc == 1000:
            ref = e
    print(line + ' '.join(f'{fc:g}:{e - ref:+.1f}' for fc, e in vals))
    sub30 = 10 * np.log10(np.sum(P[f < 30]) / np.sum(P))
    print(f'  30 Hz 以下能量佔比 {sub30:.1f} dB；直流 {np.round(yy.mean(axis=1), 7).tolist()}')
    # 低頻乾淨：150 Hz 以下各分軌能量佔比
    for k in STEMS:
        lo_e = rms_db(band(stems[k], '<150'), int(bs(48)), int(bs(56)))
        print(f'      {k:<6s} <150 Hz {lo_e:6.1f} dBFS（小節 13–14）')

    # 立體聲
    print('[立體聲] 各頻段左右相關（1＝單聲道）與 side/mid 能量比（小節 9–15）')
    A9, A16 = int(bs(32)), int(bs(60))
    for lo, hi, lab in ((25, 150, '<150 Hz'), (150, 1000, '150–1k'), (1000, 5000, '1k–5k'), (5000, 18000, '>5k')):
        Lb = bp(yy[0, A9:A16], lo, hi, 4)
        Rb = bp(yy[1, A9:A16], lo, hi, 4)
        c = float(np.corrcoef(Lb, Rb)[0, 1])
        smr = 10 * np.log10(np.sum((Lb - Rb) ** 2) / (np.sum((Lb + Rb) ** 2) + 1e-20) + 1e-20)
        print(f'      {lab:<8s} r = {c:.3f}  side/mid {smr:+.1f} dB')
    rl = db(np.sqrt(np.mean(yy[0] ** 2)) / np.sqrt(np.mean(yy[1] ** 2)))
    print(f'      左右 RMS 差 {rl:+.2f} dB；整段 mono 相容（L+R 響度 − 立體聲響度）'
          f'{lufs(np.vstack([mono, mono])) - lufs(yy):+.2f} LU')

    def phone(x):  # 手機喇叭：~300 Hz 以下 24 dB/oct 掉、2.5 kHz 稍微突出、10 kHz 以上掉
        return lp(peq(hp(x, 300, 4), 2500, 3.0, 0.7), 10000, 2)
    ph = phone(yy)
    print('[手機喇叭模擬] 各段響度（LUFS）：' + '，'.join(
        f'{lab.split()[0]} {lufs(ph, int(bs(a_)), min(N, int(bs(b_)))):.1f}' for a_, b_, lab in secs[:-1]))
    pb = phone(stems['bass'])
    print(f'  貝斯在手機上（300 Hz 以下濾掉）仍有 {lufs(pb, int(bs(48)), int(bs(56))):.1f} LUFS（原本 {lufs(stems["bass"], int(bs(48)), int(bs(56))):.1f}）')
    pk = db(np.abs(yy).max())
    print(f'[動態] 取樣峰值 {pk:.1f} dBFS；PLR（true peak − integrated）{TP - I:.1f} dB；LRA {LRA:.1f} LU')
    return dict(I=I, TP=TP, LRA=LRA, frames=nfr, rows=rows, worst=worst, swing=sw_meas)


def pictures(y, stems):
    wav_png = os.path.join(OUT_DIR, 'geese30_waveform.png')
    spec_png = os.path.join(OUT_DIR, 'geese30_spectrum.png')
    tl_png = os.path.join(OUT_DIR, 'geese30_timeline.png')
    subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', OUT_WAV, '-filter_complex',
                    'showwavespic=s=1800x500:split_channels=1:colors=0xD6BB2C|0x1E1A17:scale=sqrt', '-frames:v', '1',
                    wav_png], check=True)
    subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', OUT_WAV, '-lavfi',
                    'showspectrumpic=s=1800x700:legend=1:scale=log:color=intensity:fscale=log', '-frames:v', '1', spec_png],
                   check=True)
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from matplotlib import font_manager
    for fp in ('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',):
        if os.path.exists(fp):
            font_manager.fontManager.addfont(fp)
    plt.rcParams['font.family'] = ['Noto Sans CJK TC', 'Noto Sans CJK JP', 'DejaVu Sans']
    fig, axes = plt.subplots(4, 1, figsize=(20, 15), dpi=90, sharex=True, gridspec_kw=dict(height_ratios=[1, 1.2, 0.7, 1.5]))
    ax = axes[0]
    mono = y.mean(axis=0)
    win = sec(0.1)
    pw = np.convolve(mono ** 2, np.ones(win) / win, mode='same')[::SPF]
    ax.plot(np.arange(len(pw)), 10 * np.log10(pw + 1e-12), color='#1E1A17', lw=1)
    ax.set_ylim(-60, 0)
    ax.set_xlim(0, 1800)
    secs = [(0, 8, '開場 鼓＋貝斯', '#f3eedf'), (8, 16, '＋沙鈴', '#efe8d0'), (16, 24, '燙染 ＋手鼓', '#efe3b0'),
            (24, 32, 'build', '#e6d27a'), (32, 40, 'drop 4.9（pluck）', '#EED64F'), (40, 46, '晚上', '#efe3b0'),
            (46, 48, '抽鼓', '#f8f5ec'), (48, 56, '鼓回來 你', '#EED64F'), (56, 60, '片尾', '#efe3b0'), (60, 64, '尾音', '#f8f5ec')]
    for a, b, lab, col in secs:
        ax.axvspan(bf(a), bf(b), color=col, alpha=0.9, lw=0)
        ax.text(bf((a + b) / 2), -3, lab, ha='center', va='top', fontsize=9)
    for name, exact, sb, *_ in checks():
        ax.axvline(exact / SPF, color='#b5452f', lw=0.7, alpha=0.7)
    ax.set_ylabel('100ms RMS (dBFS)')
    ax.set_title('geese30.wav 結構：短時能量＋段落點（紅線＝驗證事件）')
    ax = axes[1]
    for k, col, off in (('drums', '#1E1A17', 0), ('bass', '#8a5a00', -20), ('pluck', '#b5452f', -40)):
        s = stems[k].mean(axis=0)
        e = np.convolve(s ** 2, np.ones(sec(0.03)) / sec(0.03), mode='same')[:: SPF // 2]
        ax.plot(np.arange(len(e)) / 2, np.clip(10 * np.log10(e + 1e-12), -60, 0) + off, color=col, lw=0.6, label=k)
    ax.legend(loc='lower left', fontsize=8)
    ax.set_ylabel('分軌 30ms RMS（各差 20 dB 疊放）')
    ax = axes[2]
    hf = hp(mono, 5000, 4)
    e = np.convolve(hf ** 2, np.ones(sec(0.02)) / sec(0.02), mode='same')[:: SPF // 4]
    ax.plot(np.arange(len(e)) / 4, 10 * np.log10(e + 1e-14), color='#8f5a2f', lw=0.6)
    ax.set_ylim(-80, -10)
    ax.set_ylabel('>5kHz 20ms RMS')
    ax = axes[3]
    fq, tt, Z = signal.stft(mono, fs=SR, nperseg=4096, noverlap=4096 - 400)
    P = 20 * np.log10(np.abs(Z) + 1e-9)
    keep = (fq >= 30) & (fq <= 16000)
    ax.pcolormesh(tt * FPS, fq[keep], P[keep], shading='auto', cmap='magma', vmin=-110, vmax=-20)
    ax.set_yscale('log')
    ax.set_ylim(30, 16000)
    ax.set_ylabel('Hz（對數）')
    for b in (8, 16, 24, 32, 40, 46, 48, 56):
        ax.axvline(bf(b), color='#4FC3F7', lw=0.8)
    ax.axvline(FINAL_POS / SPF, color='#4FC3F7', lw=0.8)
    ax.set_xlabel('格（60 fps）')
    fig.tight_layout()
    fig.savefig(tl_png)
    plt.close(fig)
    return wav_png, spec_png, tl_png


def render(verbose=True):
    t0 = time.time()
    B, log = build()
    if verbose:
        print(f'  合成 {time.time() - t0:.1f} s')
    stems, parts = mixdown(B, log, verbose)
    return stems, parts, log


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--no-verify', action='store_true')
    args = ap.parse_args()
    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(STEM_DIR, exist_ok=True)
    print('合成中…')
    stems, parts, log = render()
    print('母帶…')
    target, ceil = TARGET_LUFS, LIMIT_CEIL_DB
    for attempt in range(4):
        y, out, info = master(stems, target=target, ceil_db=ceil)
        assert y.shape == (2, N)
        write_wav24(OUT_WAV, y)
        I, TP, _ = ffmpeg_ebur128(OUT_WAV)
        print(f'  ffmpeg：{I:.2f} LUFS、{TP:.2f} dBTP（pyloudnorm 瞄準 {target:.2f}、限幅天花板 {ceil:.2f}）')
        if abs(I - TARGET_LUFS) <= 0.05 and TP <= -1.0:
            break
        target += TARGET_LUFS - I
        if TP > -1.0:
            ceil -= TP + 1.0 + 0.1
    for k in STEMS:
        write_wav24(os.path.join(STEM_DIR, f'{k}.wav'), out[k])
    print(f'寫出 {OUT_WAV}\n     {STEM_DIR}/{{{",".join(STEMS)}}}.wav')
    if not args.no_verify:
        res = verify(y, out, {k: v * info['total'] for k, v in parts.items()}, log, info)
        pics = pictures(y, out)
        print('圖：' + '、'.join(pics))
        return res
    return None


if __name__ == '__main__':
    main()
