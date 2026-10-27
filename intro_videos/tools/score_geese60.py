#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
雁沙龍｜60 秒〈字的雁陣〉原創配樂（numpy / scipy 從零合成，不用任何取樣音檔；沒有額外音效，擊點全交給鼓）

用法（在 intro_videos/ 底下）：
    python3 tools/score_geese60.py              # 合成 → 混音 → 母帶 → 主檔＋分軌，跑驗證、輸出圖
    python3 tools/score_geese60.py --no-verify  # 只合成

輸出：out/audio/geese60.wav
      out/audio/geese60_stems/{drums,bass,keys,guitar}.wav（四軌已含母帶增益與限幅曲線，四軌相加＝主檔）
      out/audio/geese60_waveform.png、geese60_spectrum.png、geese60_timeline.png
規格：48 kHz、立體聲、24-bit PCM、剛好 2,880,000 樣本（60.000 秒＝3600 格 @60fps；第 f 格＝第 f×800 樣本）
      112 BPM：1 拍＝60/112 秒＝25714.2857… 樣本；拍點用精確值（不四捨五入到格），28 小節剛好 60 秒
      響度 -14 LUFS（integrated）、true peak ≤ -1.0 dBTP（ffmpeg ebur128 量）
      確定性：所有亂數都來自固定 seed 的 numpy Generator，每次輸出完全相同

曲風：溫暖的 nu-disco／French house。A♭ 大調；旋律、和聲、貝斯線全部原創。
  樂器：四拍大鼓（調到 A♭1；加木質「咚」與鼓槌 click，手機喇叭也聽得到拍子）、
        手指彈的電貝斯（加法合成：撥弦位置梳狀泛音、泛音各自衰減、微走音、指肉聲與撥弦 click、
        悶音 dead note、八度滑音；850 Hz「顆粒」讓手機喇叭聽得到貝斯線）、Karplus-Strong 悶音吉他刷弦（左右兩軌雙錄、下刷／上刷、刷弦時間差）、
        Rhodes（音叉＋拾音器不對稱非線性：2 次諧波約 −9 dB、力度越大越「吠」、衰減後變圓；
        8 分音符速的 Suitcase 立體聲顫音 ±22%＋chorus）、
        拍手、808 式金屬 hi-hat（開／合、會被下一下掐掉）、鈴鼓、沙鈴、crash。
  律動：16 分音符搖擺 55.5%；hat／吉他／貝斯 ghost 都有力度起伏與 ±2–3 ms 人手誤差；
        拍手往後坐 2.5 ms；大鼓與所有段落重拍精準落在拍上（不加誤差）。
  低頻：大鼓＋貝斯是唯一 120 Hz 以下的聲音，兩者都是單聲道；貝斯跟著大鼓 sidechain 讓位；
        其他樂器 140–220 Hz 以下高通；殘響送出前 300 Hz 高通。
  驗證（--no-verify 以外都會跑）：長度、ffmpeg 響度／true peak、段落點起音偵測（≤ 5 ms）、抽鼓／回來、
        濾波下沉、hi-hat 搖擺與人手誤差、頻段能量、立體聲各頻段相關、手機喇叭模擬響度、四軌相加＝主檔。

段落（小節 1 起算；括號是格數＝拍號 × 3600/112）：
  1–4    （f0–514）    鋪陳：只有大鼓＋貝斯。D♭maj9 → Cm7 → B♭m9 → E♭9sus4（IV–iii–ii–V，一直不回 I）；
                       第 0 格就是 disco 八度貝斯＋大鼓；小節 3 起加 ghost note 與經過音；f32 貝斯重音（先報價落地）；小節 4 第 1 拍（f386，S2「設計師」最重那格）貝斯重音；小節 4 尾巴上行過門
  5–10   （f514–1286） 進拍手（2、4 拍）＋ hi-hat ＋ Rhodes 和弦；小節 8（S4，最密）吉他悶音刷弦進來
  11     （f1286–1414）濾波上揚：鼓以外的高頻全部從 380 Hz 低通、帶共振一路掃到全開；拍手 16 分滾奏漸強
  12     （f1414）     頂點＝drop：crash＋濾波全開，和聲第一次回到主和弦 A♭maj9（「>」的頂點）
  12–15  副歌：A♭maj9 → Cm7 → Fm9 → D♭maj9；開放 hi-hat 在每個反拍、鈴鼓、Rhodes 切分 stab
  16–21  B 段（S7、S8）：一小節一個和弦 Fm9 → E♭/G → A♭maj9 → D♭maj9 → Cm7 → B♭m9；沙鈴＋Rhodes 原創旋律；
         小節 17 第 1、3 拍（f2057、f2121＝「上班開心」兩次字重呼吸）旋律落在長音
  22–23  （f2700–2957）拉遠揭曉：鼓全部抽掉，只留貝斯長音＋Rhodes 和弦（D♭maj9 → E♭13sus4）＋輕撥吉他分解和弦；
         小節 23 第 4 拍（f2925，地圖落定）E♭13 stab，之後留 3 個 16 分音符的空白
  24     （f2957）     正拍：鼓組回來＝logo 落地（crash＋大鼓＋A♭maj9）；最後一次副歌
  26     （f3246 起）  片尾資訊五行落陣：每半拍一個 Rhodes＋吉他 stab，頂音一路往上（B♭4 C5 E♭5 G5 B♭5）
  28     E♭13sus4 → 第 3 拍 E♭13 stab 後停住 → f3576（59.6 秒）最後一擊 A♭6/9（大鼓＋貝斯＋和弦＋掐掉的 crash）
         之後自然衰減，f3586–3598 升餘弦淡到無聲，f3598 起數位靜音
"""
import argparse
import os
import re
import subprocess
import wave

import numpy as np
from scipy import signal
from scipy.ndimage import maximum_filter1d, minimum_filter1d

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'out', 'audio')
OUT_WAV = os.path.join(OUT_DIR, 'geese60.wav')
STEM_DIR = os.path.join(OUT_DIR, 'geese60_stems')
STEMS = ('drums', 'bass', 'keys', 'guitar')

SR = 48000
FPS = 60
SPF = SR // FPS  # 每格 800 樣本
N = 2_880_000  # 3600 格 = 60.000 秒
BPM = 112
BEAT = SR * 60.0 / BPM  # 25714.2857… 樣本（精確值）
S16 = BEAT / 4
PAD = SR * 3  # 匯流排尾巴餘量（最後裁掉）
SWING = 0.555  # 每個 8 分音符裡第一個 16 分音符佔 55.5%

FINAL_F = 3576  # 最後一擊（59.6 秒）
FADE_A, FADE_B = 3586, 3598  # 片尾淡出（升餘弦），之後數位靜音

TARGET_LUFS = -14.0
LIMIT_CEIL_DB = -1.6  # 限幅器內部天花板（4× 超取樣偵測；留餘量給 ffmpeg 的 true peak）


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


def wbeat(b0, st, swing=SWING):
    """從拍號 b0（必須在 16 分格點上）往後第 st 個 16 分音符 → 拍號"""
    bar = int(b0 // 4) + 1
    return step_beat(bar, int(round((b0 - bb(bar)) * 4)) + st, swing)


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


def shelf_lo(x, fc, gain_db):
    """RBJ 低架（S=1）"""
    A = 10 ** (gain_db / 40)
    w = 2 * np.pi * fc / SR
    al = np.sin(w) / 2 * np.sqrt(2)
    c = np.cos(w)
    b = np.array([A * ((A + 1) - (A - 1) * c + 2 * np.sqrt(A) * al), 2 * A * ((A - 1) - (A + 1) * c),
                  A * ((A + 1) - (A - 1) * c - 2 * np.sqrt(A) * al)])
    a = np.array([(A + 1) + (A - 1) * c + 2 * np.sqrt(A) * al, -2 * ((A - 1) + (A + 1) * c),
                  (A + 1) + (A - 1) * c - 2 * np.sqrt(A) * al])
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
    """四拍大鼓：本體正弦從 ~290 Hz 掃到 A♭1（51.9 Hz）＋飽和（3、5 次諧波讓手機喇叭也聽得到）
       ＋鼓皮「咚」（200–1100 Hz 短噪音）＋鼓槌 click（2.5–8 kHz，1.6 ms）"""
    n = sec(0.40)
    t = tv(n)
    f = 51.9 + 88.0 * np.exp(-t / 0.030) + 150.0 * np.exp(-t / 0.0035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    ph -= ph[0]
    body = np.sin(ph) * np.exp(-t / 0.19)
    body = np.tanh(2.4 * body) / np.tanh(2.4)
    m = sec(0.05)
    knock = np.zeros(n)
    knock[:m] = head_norm(bp(r.standard_normal(m), 250, 1400), sec(0.003)) * np.exp(-tv(m) / 0.008)
    click = np.zeros(n)
    c = sec(0.012)
    click[:c] = head_norm(bp(r.standard_normal(c), 2500, 8000), sec(0.001)) * np.exp(-tv(c) / 0.0016)
    tok = np.sin(2 * np.pi * 330 * t) * np.exp(-t / 0.012)  # 木質的「咚」：手機喇叭聽得到的那一下
    s = body + 0.20 * knock + 0.07 * click + 0.15 * tok
    s *= ramp(n, 0.0005)
    return tail(s * vel, 0.04)


def clap(r, vel=1.0):
    """拍手：4 下很密的手掌爆裂（7.5–10.5 ms 間隔，隨機）＋擴散尾巴，900–2900 Hz 為主；底下墊一點小鼓的「肉」"""
    n = sec(0.42)
    t = tv(n)
    z = r.standard_normal(n)
    offs = np.cumsum([0.0] + list(0.0075 + 0.003 * r.random(3)))
    env = np.zeros(n)
    for k, o in enumerate(offs):
        tt = t - o
        msk = tt >= 0
        env[msk] += (0.55 + 0.15 * k) * np.exp(-tt[msk] / 0.0035)
    tt = t - offs[-1]
    msk = tt >= 0
    env[msk] += 0.40 * np.exp(-tt[msk] / 0.080)
    fc = 1.0 + 0.05 * r.standard_normal()
    s = bp(z, 900 * fc, 2900 * fc, 2) * env + 0.22 * bp(z, 3000, 9000, 2) * env
    s = norm(s)
    body = 0.16 * np.sin(2 * np.pi * 196 * t) * np.exp(-t / 0.022) + 0.07 * np.sin(2 * np.pi * 338 * t) * np.exp(-t / 0.014)
    s = (s + body) * ramp(n, 0.0004)
    return tail(s * vel, 0.03)


_METAL = None


def metal_source():
    """808 式金屬音源：6 個不和諧方波（限頻加法合成）＋白噪音，先算好一段，每下 hat 取不同位置"""
    global _METAL
    if _METAL is None:
        r = np.random.default_rng(808)
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
    """hi-hat：closed（14–36 ms）、half（反拍稍微打開）、open（~0.2 s，會被下一下掐掉）；力度越大越亮、越長"""
    src = metal_source()
    tau = dict(closed=0.012 + 0.022 * vel, half=0.040 + 0.03 * vel, open=0.17 + 0.05 * vel)[kind]
    n = sec(length if length is not None else min(0.6, tau * 6 + 0.01))
    off = int(r.integers(0, len(src) - n - 1))
    t = tv(n)
    y = hp(src[off : off + n], 6800, 2)
    y = lp(y, 7000 + 5000 * vel, 1)
    env = np.exp(-t / tau) * ramp(n, 0.0003)
    y = y * env
    if length is not None:  # 掐掉：最後 8 ms 收掉
        y = tail(y, 0.008)
    return tail(y / 0.35 * vel ** 1.4, 0.004)


def tamb(r, vel):
    """鈴鼓：3 組鈴片在 6 ms 內先後響（高頻不和諧泛音＋噪音），短衰減"""
    n = sec(0.22)
    t = tv(n)
    s = np.zeros(n)
    for j in range(3):
        o = sec(r.random() * 0.006)
        m = n - o
        tt = t[:m]
        part = np.zeros(m)
        for f in r.uniform(5200, 11500, 7):
            part += np.sin(2 * np.pi * f * tt + r.random() * 6.28) * np.exp(-tt / r.uniform(0.03, 0.07))
        part += 1.2 * bp(r.standard_normal(m), 5000, 12000) * np.exp(-tt / 0.022)
        s[o:] += part * (1.0 - 0.25 * j)
    s = norm(s) * ramp(n, 0.0004)
    return tail(s * vel ** 1.3, 0.01)


def shaker(r, vel):
    """沙鈴：帶通噪音、起音慢一點（沙子撞上殼）"""
    n = sec(0.12)
    t = tv(n)
    s = bp(r.standard_normal(n), 3500, 10000)
    env = (1 - np.exp(-t / 0.004)) * np.exp(-t / 0.028)
    return tail(norm(s * env) * vel ** 1.3, 0.01)


def crash(r, vel=1.0, dur=2.8, choke=None):
    """crash：噪音經 14 個不和諧窄帶共振（金屬感）＋高頻 wash＋一點低頻「嗡」，左右各自獨立（自然的寬度）"""
    n = sec(dur)
    t = tv(n)
    out = np.zeros((2, n))
    for ch in range(2):
        z = r.standard_normal(n)
        m = np.zeros(n)
        for fc in np.exp(r.uniform(np.log(1800), np.log(12500), 14)):
            m += bp(z, fc * 0.975, fc * 1.025, 1)
        wash = hp(z, 4500, 2)
        low = bp(z, 380, 1400, 1)
        x = 0.55 * norm(m) + 0.45 * norm(wash)
        env = (1 - np.exp(-t / 0.0025)) * (0.5 * np.exp(-t / 0.20) + 0.5 * np.exp(-t / 1.15))
        out[ch] = x * env + 0.12 * norm(low) * np.exp(-t / 0.3) * (1 - np.exp(-t / 0.002))
    if choke is not None:
        c = sec(choke)
        k = sec(0.03)
        e = np.ones(n)
        e[c : c + k] = 0.5 + 0.5 * np.cos(np.pi * np.arange(k) / k)
        e[c + k :] = 0.0
        out *= e
    out *= ramp(n, 0.0003)
    return tail(norm(out) * vel, 0.05)


# ----------------------------------------------------------------------------
# 貝斯（手指彈的電貝斯，加法合成）
# ----------------------------------------------------------------------------
def bass_note(r, m, vel, dur, bright=0.7, slide=None, dead=False):
    """電貝斯一個音：
       泛音 k 的振幅 ∝ |sin(πkβ)|/k（β≈0.2 撥弦位置的梳狀）× 亮度斜率；高泛音衰減較快；弦的微不和諧（B=6e-5）；
       起音瞬間音高略高（弦張力）＋指肉「噗」聲；放開時左手悶掉；dead=左手悶住的打擊音（ghost note）"""
    f0 = mhz(m)
    rel = 0.018 if dead else 0.03
    n = sec(dur + 0.16)
    t = tv(n)
    cents = 10.0 * vel * np.exp(-t / 0.04) + r.normal(0, 1.2)
    fr = f0 * 2 ** (cents / 1200)
    if slide is not None:  # (目標音, 開始秒, 長度秒)
        tgt, t0, tl = slide
        u = np.clip((t - t0) / tl, 0, 1)
        u = u * u * (3 - 2 * u)
        fr = fr * 2 ** ((tgt - m) * u / 12)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    ph -= ph[0]
    K = int(min(12 if dead else 40, 4200 / f0))
    beta = float(np.clip(0.20 + 0.015 * r.standard_normal(), 0.15, 0.25))
    tilt = 0.035 + 0.22 * (1 - bright) + 0.10 * (1 - vel)
    tau1 = 0.045 if dead else 1.3
    s = np.zeros(n)
    for k in range(1, K + 1):
        a = abs(np.sin(np.pi * k * beta)) / k * np.exp(-(k - 1) * tilt)
        if a < 2e-4:
            continue
        tk = tau1 / (1 + 0.20 * (k - 1) ** 1.2)
        s += a * np.sin(k * np.sqrt(1 + 6e-5 * k * k) * ph) * np.exp(-t / tk)
    h = sec(dur)
    if h < n:
        s[h:] *= np.exp(-(t[h:] - t[h]) / rel)
    m_ = sec(0.05)
    thump = np.zeros(n)
    thump[:m_] = head_norm(lp(r.standard_normal(m_), 260, 2), sec(0.004)) * np.exp(-tv(m_) / 0.009)
    c_ = sec(0.012)
    pluck = np.zeros(n)
    pluck[:c_] = head_norm(bp(r.standard_normal(c_), 900, 3200), sec(0.001)) * np.exp(-tv(c_) / 0.0022)
    s = s + (0.55 if dead else 0.16) * thump + (0.03 if dead else 0.045) * vel * pluck
    s *= ramp(n, 0.0012)
    return tail(s * vel ** 1.3, 0.01)


# ----------------------------------------------------------------------------
# Rhodes
# ----------------------------------------------------------------------------
def rhodes(r, m, vel, hold, bright=0.0):
    """Rhodes 一個音：
       音叉振動（基音＋一點 2 次）經拾音器的不對稱軟飽和——力度大時「吠」（偶次＋奇次泛音），
       隨衰減自然變圓；起音加一點 FM 吠音、音叉高次模態的「叮」（~7.1 倍、11 ms）、毛氈槌「咚」；
       衰減時間依音高；放開琴鍵時制音器收掉"""
    f = mhz(m) * 2 ** (r.normal(0, 1.0) / 1200)
    rel = 0.085
    n = sec(hold + 0.45)
    t = tv(n)
    dec = float(np.clip(3.4 * (262.0 / f) ** 0.6, 1.0, 7.0))
    env = 0.28 * np.exp(-t / 0.30) + 0.72 * np.exp(-t / dec)
    h = min(n, sec(hold))
    if h < n:
        env[h:] *= np.exp(-(t[h:] - t[h]) / rel)
    ph = 2 * np.pi * f * t
    x = env * (np.sin(ph) + 0.18 * np.sin(2 * ph + 0.3))
    g = 1.0 + 2.4 * vel ** 1.5 + 0.8 * bright
    b = 0.28
    y = (np.tanh(g * (0.85 * x + b)) - np.tanh(g * b)) / (g * (1 - np.tanh(g * b) ** 2))
    idx = (0.25 + 1.0 * vel ** 2 + 0.5 * bright) * np.exp(-t / 0.08)
    bark = env * (np.sin(ph + idx * np.sin(ph)) - np.sin(ph))
    tr = min(7.1, 9000.0 / f)
    tine = (0.26 * vel ** 1.5 + 0.18 * bright) * min(1.0, (520.0 / f) ** 0.5) * np.sin(2 * np.pi * f * tr * t) * np.exp(-t / 0.011)
    m_ = sec(0.03)
    thump = np.zeros(n)
    thump[:m_] = head_norm(lp(r.standard_normal(m_), 900, 2), sec(0.003)) * np.exp(-tv(m_) / 0.005)
    s = y + 0.45 * bark + tine + 0.04 * vel * thump
    s *= ramp(n, 0.0015)
    s = lp(s, 2600 + 3800 * vel + 3000 * bright, 2)
    gain = vel ** 1.1 * (1.0 if f < 400 else (400.0 / f) ** 0.35)
    return tail(s * gain, 0.02)


# ----------------------------------------------------------------------------
# 吉他（Karplus-Strong）
# ----------------------------------------------------------------------------
def ks_pluck(r, f, tau, bright, n, pick=0.13):
    """Karplus-Strong 撥弦：延遲線＝一個週期（整數 L＋分數 w 用 2 點內插），迴圈增益 ρ 決定衰減；
       激發＝一段噪音（亮度＝一階低通）、撥弦位置梳狀。以 L 為區塊向量化計算（每個區塊只依賴前一個週期）。"""
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


GTR_KIND = dict(  # (衰減 τ 秒, 亮度, 時長秒, 力度倍率)
    mute=(0.030, 0.40, 0.11, 0.62),
    ghost=(0.020, 0.28, 0.08, 0.30),
    chank=(0.55, 0.62, None, 1.0),
    ring=(1.3, 0.55, None, 0.95),
    arp=(1.5, 0.48, None, 0.8),
)


def strum(r, notes, vel, kind, direction, hold=0.18):
    """刷弦：下刷由低到高、上刷由高到低，弦與弦之間差 4–7 ms；悶音刷帶刷弦噪音；chank＝短促開放和弦後左手悶掉"""
    tau, bright, length, vm = GTR_KIND[kind]
    order = sorted(notes) if direction > 0 else sorted(notes, reverse=True)
    if kind == 'ghost':
        order = order[-2:] if direction > 0 else order[:2]
    gap = (0.0058 if direction > 0 else 0.0044) * (1 + 0.2 * r.standard_normal())
    dur = length if length is not None else hold
    n_tot = sec(dur + 0.08 + len(order) * 0.008)
    out = np.zeros(n_tot)
    for i, m in enumerate(order):
        off = sec(max(0.0, i * gap + abs(r.normal(0, 0.0007))))
        v = vel * vm * (1 - 0.07 * i) * (1 + 0.06 * r.standard_normal())
        n = n_tot - off
        f = mhz(m) * 2 ** (r.normal(0, 3.0) / 1200)
        y = ks_pluck(r, f, tau * (1 + 0.15 * r.standard_normal()), bright * (0.6 + 0.6 * v), n, pick=r.uniform(0.10, 0.18))
        if length is None:  # 開放和弦：hold 秒後左手悶掉
            h = sec(hold)
            if h < n:
                y[h:] *= np.exp(-tv(n - h) / 0.014)
        out[off:] += y * v
    if kind in ('mute', 'ghost', 'chank'):
        k = sec(0.03)
        scr = head_norm(bp(r.standard_normal(k), 1500, 6500), sec(0.002)) * np.exp(-tv(k) / 0.0045)
        out[:k] += scr * vel * (0.35 if kind != 'ghost' else 0.18)
    out *= ramp(n_tot, 0.0006)
    return tail(out, 0.01)


# ----------------------------------------------------------------------------
# 效果
# ----------------------------------------------------------------------------
def make_ir(r, rt=1.4, length=2.2, pre=0.015, lo_mult=1.1, hi_mult=0.45):
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
            k = sec(r.uniform(0.002, 0.035))
            y[k] += r.uniform(-1, 1) * 3.0
        ir[ch] = np.concatenate([np.zeros(sec(pre)), y])[:n]
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def reverb(x, ir):
    out = np.zeros_like(x)
    for ch in range(2):
        out[ch] = signal.fftconvolve(x[ch], ir[ch])[: x.shape[1]]
    return out


def pingpong(x, delay_s, fb=0.32, taps=4):
    """左右交替的 dotted-8th 延遲（輸入取 mid）"""
    d = sec(delay_s)
    mono = 0.5 * (x[0] + x[1])
    out = np.zeros_like(x)
    g = 1.0
    for k in range(1, taps + 1):
        g *= fb if k > 1 else 1.0
        ch = (k + 1) % 2
        out[ch, k * d :] += g * mono[: -k * d]
    return lp(hp(out, 350, 2), 4200, 2)


def autopan(x, rate, depth, phase=0.0):
    t = tv(x.shape[1])
    mod = depth * np.sin(2 * np.pi * rate * t + phase)
    return np.vstack([x[0] * (1 + mod), x[1] * (1 - mod)])


def chorus(x, base=0.011, depth=0.0022, rate=0.45, mix=0.32):
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


SWEEP_A = bs(bb(11))  # 小節 11 正拍
SWEEP_B = bs(bb(12))  # 小節 12 正拍（頂點）


def sweep_lp(x, f0=380.0, f1=19000.0, q0=2.4, q1=0.75):
    """小節 11 的濾波上揚：時變共振低通（TPT 狀態變數濾波器，逐樣本更新係數），
       380 Hz → 19 kHz 指數掃頻（前慢後快），Q 2.4 → 0.75；頭 8 ms 從乾聲交叉淡入、尾 20 ms 交叉回乾聲。"""
    s0, s1 = int(round(SWEEP_A)), int(round(SWEEP_B))
    pre = sec(0.04)
    a = s0 - pre
    m = s1 - a
    u = np.clip((np.arange(m) - pre) / (s1 - s0), 0, 1)
    shp = u ** 2.6
    fc = f0 * (f1 / f0) ** shp
    q = q0 + (q1 - q0) * shp
    g = np.tan(np.pi * np.minimum(fc, 0.45 * SR) / SR)
    k = 1.0 / q
    a1 = 1.0 / (1.0 + g * (g + k))
    a2 = g * a1
    a3 = g * a2
    A1, A2, A3 = a1.tolist(), a2.tolist(), a3.tolist()
    y = x.copy()
    for ch in range(2):
        xs = x[ch, a : a + m].tolist()
        res = [0.0] * m
        ic1 = ic2 = 0.0
        for i in range(m):
            v3 = xs[i] - ic2
            v1 = A1[i] * ic1 + A2[i] * v3
            v2 = ic2 + A2[i] * ic1 + A3[i] * v3
            ic1 = 2 * v1 - ic1
            ic2 = 2 * v2 - ic2
            res[i] = v2
        res = np.asarray(res)
        w = np.ones(m)
        xi = sec(0.008)
        w[: pre - xi // 2] = 0.0
        w[pre - xi // 2 : pre + xi // 2] = 0.5 - 0.5 * np.cos(np.pi * np.arange(xi) / xi)
        xo = sec(0.020)
        w[m - xo :] = 0.5 + 0.5 * np.cos(np.pi * np.arange(xo) / xo)
        y[ch, a : a + m] = x[ch, a : a + m] * (1 - w) + res * w
    return y


# ----------------------------------------------------------------------------
# 編曲
# ----------------------------------------------------------------------------
# root＝貝斯根音（MIDI）；q＝和弦性質（貝斯的 3／5／7 度用）；v／c／b＝Rhodes 在主歌／副歌／B 段的排列；g＝吉他上四弦
CH = {
    'Dbmaj9': dict(root=37, q='maj', v=[53, 56, 60, 63], c=[56, 60, 63, 65, 72], b=[53, 56, 60, 63], g=[63, 65, 68, 72]),
    'Cm7': dict(root=36, q='min', v=[55, 58, 63, 67], c=[55, 58, 60, 63, 67], b=[55, 58, 60, 63], g=[63, 67, 70, 72]),
    'Bbm9': dict(root=34, q='min', v=[56, 60, 61, 65], c=[56, 60, 61, 65], b=[53, 56, 60, 61], g=[61, 65, 68, 72]),
    'Eb9sus4': dict(root=39, q='sus', v=[58, 61, 65, 68], c=[58, 61, 65, 68], b=[58, 61, 65, 68], g=[61, 65, 68, 70]),
    'Eb13sus4': dict(root=39, q='sus', v=[56, 61, 65, 70, 72], c=[56, 61, 65, 70, 72], b=[56, 61, 65, 70, 72], g=[61, 65, 68, 72]),
    'Eb13': dict(root=39, q='dom', v=[55, 61, 65, 72], c=[55, 61, 65, 72], b=[55, 61, 65, 72], g=[61, 67, 72, 75]),
    'Abmaj9': dict(root=32, q='maj', v=[56, 60, 63, 67, 70], c=[56, 60, 63, 67, 70], b=[56, 60, 63, 67, 70], g=[63, 67, 70, 72]),
    'Fm9': dict(root=29, q='min', v=[53, 56, 60, 63, 67], c=[53, 56, 60, 63, 68], b=[53, 56, 60, 63, 67], g=[63, 67, 68, 72]),
    'Eb/G': dict(root=31, q='slash', v=[55, 58, 63, 65], c=[55, 58, 63, 65], b=[55, 58, 63, 65], g=[63, 67, 70, 75]),
    'Ab69': dict(root=32, q='maj', v=[56, 60, 65, 70, 75], c=[56, 60, 65, 70, 75], b=[56, 60, 65, 70, 75], g=[65, 70, 72, 75]),
}
QI = dict(maj=(4, 7, 9), min=(3, 7, 10), sus=(5, 7, 10), dom=(4, 7, 10), slash=(3, 8, 10))  # (3 度, 5 度, 7 度/6 度)


def progression():
    """(起始拍號, 和弦, 拍數)"""
    V = ['Dbmaj9', 'Cm7', 'Bbm9', 'Eb9sus4']
    C = ['Abmaj9', 'Cm7', 'Fm9', 'Dbmaj9']
    seq = [(i * 2, V[i % 4], 2) for i in range(20)]  # 小節 1–10
    seq += [(40, 'Dbmaj9', 2), (42, 'Eb13sus4', 2)]  # 小節 11
    seq += [(44 + i * 2, C[i % 4], 2) for i in range(8)]  # 小節 12–15
    seq += [(60 + i * 4, c, 4) for i, c in enumerate(['Fm9', 'Eb/G', 'Abmaj9', 'Dbmaj9', 'Cm7', 'Bbm9'])]  # 16–21
    seq += [(84, 'Dbmaj9', 4), (88, 'Eb13sus4', 3), (91, 'Eb13', 1)]  # 22–23
    seq += [(92 + i * 2, C[i % 4], 2) for i in range(8)]  # 24–27
    seq += [(108, 'Eb13sus4', 2), (110, 'Eb13', 1.25), (FINAL_F * SPF / BEAT, 'Ab69', 0.75)]  # 28
    return seq


PROG = progression()


def chord_at(beat):
    cur = PROG[0][1]
    for b0, name, _ in PROG:
        if beat + 1e-6 >= b0:
            cur = name
    return cur


def section(beat):
    for lim, name in ((16, 'intro'), (40, 'verse'), (44, 'build'), (60, 'chorus'), (84, 'bsec'), (92, 'break'), (108, 'chorus2')):
        if beat < lim:
            return name
    return 'end'


# Rhodes 原創旋律（B 段，小節 16–21）：(小節, 16 分音符位置, 音, 長度[16 分], 力度)
MELODY = [
    (16, 6, 72, 2, 0.55), (16, 8, 75, 2, 0.62), (16, 10, 77, 4, 0.66), (16, 14, 75, 2, 0.50),
    (17, 0, 79, 5, 0.72), (17, 6, 77, 2, 0.55), (17, 8, 75, 3, 0.68), (17, 12, 70, 2, 0.50), (17, 14, 72, 2, 0.55),
    (18, 0, 75, 6, 0.64), (18, 6, 72, 2, 0.52), (18, 10, 70, 2, 0.50), (18, 12, 72, 4, 0.58),
    (19, 4, 77, 4, 0.66), (19, 8, 75, 2, 0.56), (19, 10, 72, 2, 0.52), (19, 12, 68, 4, 0.54),
    (20, 0, 70, 6, 0.62), (20, 6, 72, 2, 0.52), (20, 8, 75, 4, 0.62), (20, 12, 79, 4, 0.60),
    (21, 0, 77, 4, 0.64), (21, 4, 75, 2, 0.54), (21, 6, 73, 2, 0.52), (21, 8, 72, 8, 0.60),
]

# 片尾資訊五行（f3246 起每半拍一行）：Rhodes stab 頂音一路往上
END_STABS = [(101.0, [60, 63, 67, 70]), (101.5, [63, 67, 70, 72]), (102.0, [63, 67, 70, 75]), (102.5, [67, 70, 75, 79]),
             (103.0, [70, 72, 75, 82])]

GTR_PAT = dict(
    verse='x-x-X-xxx-x-X-xx',
    build='xxxxxxxxxxxxxxx.',
    chorus='x-xX-xX-x-xX-xX-',
    bsec='..x...X...x..X..',
    end26='x-x-X-X-X-X-X-x-',
    end28='x-xX-xX-X...X...',
)


def build():
    rs = np.random.default_rng
    rk, rc, rh, rp, rcr, rb, rkey, rgL, rgR, rH = (rs(s) for s in (11, 12, 13, 14, 15, 16, 17, 18, 19, 20))
    B = {k: Bus() for k in ('kick', 'clap', 'hats', 'perc', 'crash', 'bass', 'keys', 'mel', 'gtrL', 'gtrR', 'arp')}
    ms = lambda x: x * SR / 1000.0
    log = dict(kicks=[], hats=[], claps=[], bass=[], keys=[], gtr=[])

    # ---------------- 大鼓：小節 1–21、24–28 第 3 拍，每拍；最後一擊 ----------------
    for b in list(range(0, 84)) + list(range(92, 111)):
        v = 1.0 if b % 4 == 0 else 0.95 + 0.015 * rk.standard_normal()
        B['kick'].add(kick(rk, v), bs(b))
        log['kicks'].append(bs(b))
    B['kick'].add(kick(rk, 1.0), F(FINAL_F))
    log['kicks'].append(F(FINAL_F))

    # ---------------- 拍手：小節 5 起 2、4 拍；小節 11 滾奏；過門 ----------------
    claps = {}
    for b in list(range(17, 84)) + list(range(93, 110)):
        if b % 4 in (1, 3):
            claps[float(b)] = 0.86 if b % 4 == 1 else 0.9
    for i, st in enumerate(range(8, 15)):  # 小節 11 第 3–4 拍 16 分滾奏漸強（拉直，不搖擺）
        claps[step_beat(11, st, 0.5)] = 0.30 + 0.10 * i
    claps[step_beat(15, 15)] = 0.42  # 小節 15→16 小過門
    claps[step_beat(21, 15)] = 0.48  # 小節 21 → 抽鼓前最後一下
    claps[110.0] = 0.95  # 小節 28 第 3 拍 stab
    for b, v in sorted(claps.items()):
        v = v * (1 + 0.04 * rc.standard_normal())
        p = bs(b) + ms(2.5) + ms(rc.normal(0, 0.6))
        B['clap'].add(clap(rc, v), p)
        log['claps'].append((b, p, v))

    # ---------------- hi-hat：小節 5 起（22–23 抽掉；28 到第 3 拍反拍） ----------------
    ev = []
    for bar in range(5, 29):
        if bar in (22, 23):
            continue
        sct = section(bb(bar))
        for st in range(16):
            if bar == 28 and st >= 10:
                break
            if bar == 11 and st == 15:  # drop 前最後一個 16 分留空
                continue
            q = st % 4
            kind = 'closed'
            if sct == 'verse':
                v = (0.50, 0.26, 0.78, 0.32)[q]
                kind = 'half' if q == 2 else 'closed'
            elif sct == 'build':
                v = 0.30 + 0.55 * st / 15
                kind = 'open' if q == 2 else 'closed'
            elif sct == 'bsec':
                v = (0.44, 0.22, 0.72, 0.30)[q]
                kind = 'open' if (st == 14 and bar % 2 == 1) else ('half' if q == 2 else 'closed')
            else:
                v = (0.46, 0.24, 0.66, 0.30)[q]
                kind = 'open' if q == 2 else 'closed'
            beat = step_beat(bar, st)
            exact = bar == 5 and st == 0
            jit = 0.0 if exact else ms(rh.normal(0, 1.8))
            ev.append([bs(beat) + jit, float(np.clip(v * (1 + 0.08 * rh.standard_normal()), 0.08, 1.0)), kind, beat])
    for i, (p, v, kind, beat) in enumerate(ev):
        nxt = ev[i + 1][0] if i + 1 < len(ev) else p + SR
        length = None
        if kind == 'open':
            length = min(0.5, (nxt - p) / SR + 0.010)
        B['hats'].add(hat(rh, v, kind, length), p, pan=0.22)
        log['hats'].append((beat, p, v, kind))

    # ---------------- 鈴鼓（副歌）／沙鈴（B 段） ----------------
    for bar in list(range(12, 16)) + list(range(24, 28)):
        for st in range(16):
            v = (0.42, 0.20, 0.72, 0.28)[st % 4] * (1 + 0.08 * rp.standard_normal())
            B['perc'].add(tamb(rp, v), bs(step_beat(bar, st)) + ms(rp.normal(0, 2.0)), pan=-0.38)
    for bar in range(16, 22):
        for st in range(16):
            v = (0.40, 0.22, 0.62, 0.28)[st % 4] * (1 + 0.08 * rp.standard_normal())
            B['perc'].add(shaker(rp, v), bs(step_beat(bar, st)) + ms(rp.normal(0, 2.2)), pan=-0.32)

    # ---------------- crash ----------------
    for b, v in ((44, 1.0), (60, 0.5), (92, 1.0)):
        B['crash'].add(crash(rcr, v), bs(b))
    B['crash'].add(crash(rcr, 0.8, dur=0.6, choke=0.16), F(FINAL_F))

    # ---------------- 貝斯 ----------------
    def add_b(beat, m, v, steps, dead=False, slide=None, bright=0.75, exact=False):
        dur = steps * S16 / SR
        p = bs(beat) + (0.0 if exact else ms(rb.normal(0, 1.4)))
        v = float(np.clip(v * (1 + (0.0 if exact else 0.05 * rb.standard_normal())), 0.05, 1.0))
        B['bass'].add(bass_note(rb, m, v, dur, bright=bright, slide=slide, dead=dead), p)
        log['bass'].append((beat, p, m, v, dead))

    def approach(R, nxt):
        if nxt == R:
            return R + 7
        a = nxt - 1
        return a if a != R else nxt + 1

    for i, (b0, name, dur) in enumerate(PROG):
        sct = section(b0)
        R = CH[name]['root']
        nxt = CH[PROG[i + 1][1]]['root'] if i + 1 < len(PROG) else R
        q3, q5, q7 = QI[CH[name]['q']]
        if sct == 'intro':
            br = 0.80 + 0.12 * b0 / 16
            if b0 == 14:  # 小節 4 後半：上行過門進小節 5
                add_b(wbeat(b0, 0), R, 0.88, 1.5, bright=br)
                add_b(wbeat(b0, 2), R + 12, 0.78, 1.0, bright=br)
                add_b(wbeat(b0, 4), 32, 0.66, 0.9, bright=br)
                add_b(wbeat(b0, 5), 34, 0.72, 0.9, bright=br)
                add_b(wbeat(b0, 6), 36, 0.78, 0.9, bright=br)
                add_b(wbeat(b0, 7), 36, 0.30, 0.5, dead=True, bright=br)
            elif b0 < 8:  # 小節 1–2：disco 八度（根音／高八度），還沒有 ghost
                acc = 0.98 if b0 == 0 else 0.92
                add_b(wbeat(b0, 0), R, acc, 1.6, bright=br, exact=(b0 == 0))
                add_b(wbeat(b0, 2), R + 12, 0.80, 1.0, bright=br)
                add_b(wbeat(b0, 4), R, 0.95 if b0 == 0 else 0.84, 1.6, bright=br, exact=(b0 == 0))  # b0=0 的第 4 步＝f32（先報價落地）
                add_b(wbeat(b0, 6), R + 12, 0.78, 1.0, bright=br)
            else:
                acc = 1.0 if b0 == 12 else 0.9  # f386＝小節 4 第 1 拍
                add_b(wbeat(b0, 0), R, acc, 1.5, bright=br, exact=(b0 == 12))
                add_b(wbeat(b0, 2), R + 12, 0.78, 1.0, bright=br)
                add_b(wbeat(b0, 3), R + 12, 0.30, 0.5, dead=True, bright=br)
                add_b(wbeat(b0, 4), R, 0.82, 1.4, bright=br)
                add_b(wbeat(b0, 6), R + 12, 0.74, 0.9, bright=br)
                add_b(wbeat(b0, 7), approach(R, nxt), 0.58, 0.8, bright=br)
        elif sct == 'verse':
            ex = b0 == 16
            if b0 % 8 == 2:  # 每兩小節一次簡單版（呼吸）
                add_b(wbeat(b0, 0), R, 0.9, 1.5, exact=ex)
                add_b(wbeat(b0, 2), R + 12, 0.76, 1.0)
                add_b(wbeat(b0, 4), R, 0.84, 1.5)
                add_b(wbeat(b0, 6), R + 12, 0.74, 1.0)
            else:
                add_b(wbeat(b0, 0), R, 0.92, 1.5, exact=ex)
                add_b(wbeat(b0, 2), R + 12, 0.80, 1.0)
                add_b(wbeat(b0, 3), R + 12, 0.30, 0.5, dead=True)
                add_b(wbeat(b0, 4), R, 0.82, 1.4)
                add_b(wbeat(b0, 6), R + 12 if b0 % 8 != 6 else R + q5, 0.76, 0.9)
                add_b(wbeat(b0, 7), approach(R, nxt), 0.60, 0.8)
        elif sct == 'build':
            if b0 == 40:
                for st, m, v in ((0, R, 0.86), (2, R + 12, 0.8), (4, R, 0.84), (6, R + 12, 0.82)):
                    add_b(wbeat(b0, st), m, v, 1.2, bright=0.7)
            else:  # 小節 11 後半：E♭ 八度 → 最後一拍 16 分，第 4 拍反拍後留空（drop 前的吸氣）
                for st, m, v, l in ((0, R, 0.86, 1.2), (2, R + 12, 0.86, 1.0), (4, R, 0.84, 0.8), (5, R + 12, 0.80, 0.8),
                                    (6, R, 0.90, 0.8)):
                    add_b(wbeat(b0, st, 0.5), m, v, l, bright=0.75)
        elif sct in ('chorus', 'chorus2'):
            first = b0 in (44, 92)
            add_b(wbeat(b0, 0), R, 0.92 if first else 0.88, 1.6 if first else 1.2, exact=first, bright=0.85,
                  slide=(R + 12, 0.11, 0.07) if first else None)
            add_b(wbeat(b0, 2), R + 12, 0.95, 1.1, bright=0.85)
            add_b(wbeat(b0, 3), R + 12, 0.32, 0.5, dead=True, bright=0.85)
            add_b(wbeat(b0, 4), R, 0.80, 1.0, bright=0.85)
            add_b(wbeat(b0, 5), R, 0.50, 0.6, bright=0.85)
            add_b(wbeat(b0, 6), R + 12, 0.90, 1.0, bright=0.85)
            add_b(wbeat(b0, 7), approach(R, nxt), 0.62, 0.7, bright=0.85)
        elif sct == 'bsec':
            for st, m, v, l, d in ((0, R, 0.92, 2.0, False), (3, R, 0.30, 0.5, True), (4, R + 12, 0.85, 1.2, False),
                                   (6, R + q5, 0.70, 1.0, False), (8, R, 0.86, 1.6, False), (10, R + 12, 0.88, 1.1, False),
                                   (11, R + 12, 0.30, 0.5, True), (12, R + q7, 0.74, 1.0, False),
                                   (14, R + q5, 0.68, 1.0, False), (15, approach(R, nxt), 0.60, 0.8, False)):
                add_b(wbeat(b0, st), m, v, l, dead=d, bright=0.75, exact=(st == 0 and b0 == 60))
        elif sct == 'break':
            if name == 'Dbmaj9':  # 小節 22：長音（不全靜音），第 3 拍輕輕再彈一次
                add_b(84, 37, 0.74, 7.5, bright=0.6, exact=True)
                add_b(86, 37, 0.52, 5.5, bright=0.55)
                add_b(wbeat(84, 14), 36, 0.44, 1.8, bright=0.55)
            elif name == 'Eb13sus4':
                add_b(88, 39, 0.72, 11.0, bright=0.6, exact=True)
            else:  # f2925：地圖落定的 stab，之後空白
                add_b(91, 39, 0.92, 0.9, bright=0.8, exact=True)
        elif sct == 'end':
            if name == 'Eb13sus4':
                for st, m, v, l in ((0, 39, 0.9, 1.2), (2, 51, 0.92, 1.0), (3, 51, 0.3, 0.5), (4, 39, 0.82, 1.0),
                                    (6, 51, 0.88, 1.0)):
                    add_b(wbeat(b0, st), m, v, l, dead=(st == 3), bright=0.85)
            elif name == 'Eb13':
                add_b(110, 39, 0.95, 1.0, bright=0.85, exact=True)
                add_b(111, 39, 0.66, 0.8, bright=0.8, exact=True)  # 第 4 拍：撿拍音
            else:  # 最後一擊
                add_b(FINAL_F * SPF / BEAT, 32, 1.0, 0.30 * SR / S16, bright=0.9, exact=True)

    # ---------------- Rhodes 和弦 ----------------
    def add_k(beat, notes, vel, hold_beats, roll_ms=4.0, bright=0.0, exact=False, bus='keys', pos=None):
        p0 = bs(beat) if pos is None else pos
        if not exact:
            p0 += ms(rkey.normal(0, 2.0))
        hold = hold_beats * BEAT / SR
        for i, m in enumerate(sorted(notes)):
            st = p0 + ms(i * roll_ms * (1 + 0.15 * rkey.standard_normal()) if i else 0.0)
            v = float(np.clip(vel * (1.12 if i == len(notes) - 1 else 1.0) * (1 + 0.04 * rkey.standard_normal()), 0.05, 0.95))
            B[bus].add(rhodes(rkey, m, v, max(0.05, hold - i * roll_ms / 1000), bright), st, pan=float(np.clip((m - 63) / 20, -1, 1)) * 0.22)
        log['keys'].append((beat if pos is None else pos / BEAT, p0, notes, vel))

    for i, (b0, name, dur) in enumerate(PROG):
        sct = section(b0)
        c = CH[name]
        if sct == 'verse':
            add_k(b0, c['v'], 0.56 if b0 == 16 else 0.50, 1.35, exact=(b0 == 16), roll_ms=1.5 if b0 == 16 else 4.0)
            add_k(wbeat(b0, 6), c['v'], 0.40, 0.42)
        elif sct == 'build':
            for j in range(4):
                add_k(b0 + j * 0.5, c['v'] if name == 'Dbmaj9' else c['c'], 0.36 + 0.05 * j + (0.16 if b0 == 42 else 0.0), 0.3)
        elif sct in ('chorus', 'chorus2'):
            if b0 in (100, 102):  # 片尾資訊落陣：小節 26 改成每半拍往上爬的 stab
                if b0 == 100:
                    add_k(100, c['c'], 0.58, 0.34)
                    for bt, notes in END_STABS:
                        add_k(bt, notes, 0.52 + 0.03 * (bt - 101) * 2, 0.30, roll_ms=2.0, bright=0.15, exact=True)
                continue
            first = b0 in (44, 92)
            add_k(b0, c['c'], 0.62 if first else 0.58, 0.34 if not first else 0.9, exact=first, bright=0.1 if first else 0.0,
                  roll_ms=1.5 if first else 4.0)
            add_k(wbeat(b0, 3), c['c'], 0.46, 0.20)
            add_k(wbeat(b0, 6), c['c'], 0.55, 0.45)
        elif sct == 'bsec':
            add_k(b0, c['b'], 0.52, 1.35, exact=(b0 == 60))
            add_k(wbeat(b0, 6), c['b'], 0.38, 0.36)
            add_k(wbeat(b0, 8), c['b'], 0.48, 0.95, exact=(b0 == 64))  # 小節 17 第 3 拍＝f2121
            add_k(wbeat(b0, 14), c['b'], 0.40, 0.40)
        elif sct == 'break':
            if name == 'Dbmaj9':
                add_k(84, [49, 53, 56, 60, 63, 68], 0.56, 3.7, roll_ms=2.5, exact=True)
                add_k(86, [63, 65, 68, 72], 0.30, 1.7, roll_ms=12)
            elif name == 'Eb13sus4':
                add_k(88, c['c'], 0.50, 2.85, roll_ms=22, exact=True)
            else:
                add_k(91, c['c'], 0.70, 0.22, roll_ms=3, exact=True)
        elif sct == 'end':
            if name == 'Eb13sus4':
                add_k(b0, c['c'], 0.58, 0.34)
                add_k(wbeat(b0, 3), c['c'], 0.46, 0.2)
                add_k(wbeat(b0, 6), c['c'], 0.55, 0.45)
            elif name == 'Eb13':
                add_k(110, c['c'], 0.66, 0.40, exact=True)
            else:
                add_k(0, c['c'], 0.74, 0.24 * SR / BEAT, roll_ms=1.5, exact=True, pos=F(FINAL_F))

    for bar, st, m, l, v in MELODY:  # B 段旋律（Rhodes 高音區，音叉亮一點）
        beat = step_beat(bar, st)
        exact = (bar, st) in ((17, 0), (17, 8), (19, 4), (20, 0))
        add_k(beat, [m], v, l / 4 * 0.92, bright=0.35, exact=exact, bus='mel')

    # ---------------- 吉他：小節 8 起；22–23 換成輕撥分解和弦 ----------------
    def gtr_bar(bar, pat, take_rng, bus, late_ms, vel_scale=1.0, crescendo=False):
        for st, ch in enumerate(pat):
            if ch == '.':
                continue
            beat = step_beat(bar, st)
            name = chord_at(beat)
            notes = CH[name]['g']
            direction = 1 if st % 2 == 0 else -1
            if ch == 'X':
                kind, v, hold = 'chank', 0.80, 1.3 * S16 / SR
            elif ch == 'x':
                kind, v, hold = 'mute', 0.55, 0.0
            else:
                kind, v, hold = 'ghost', 0.40, 0.0
            if crescendo:
                v *= 0.55 + 0.5 * st / 15
            v *= vel_scale * (1 + 0.07 * take_rng.standard_normal())
            p = bs(beat) + ms(late_ms + take_rng.normal(0, 2.6))
            B[bus].add(strum(take_rng, notes, v, kind, direction, hold), p)
            if bus == 'gtrL':
                log['gtr'].append((beat, p, kind, v))

    for take, rg, late in (('gtrL', rgL, 0.0), ('gtrR', rgR, 4.0)):
        for bar in range(8, 29):
            if bar in (22, 23):
                continue
            sct = section(bb(bar))
            if bar == 26:
                pat = GTR_PAT['end26']
            elif bar == 28:
                pat = GTR_PAT['end28']
            else:
                pat = GTR_PAT[{'verse': 'verse', 'build': 'build', 'chorus': 'chorus', 'chorus2': 'chorus', 'bsec': 'bsec'}[sct]]
            gtr_bar(bar, pat, rg, take, late, vel_scale=0.9 if sct == 'verse' else 1.0, crescendo=(sct == 'build'))
        # 最後一擊：開放的 A♭6/9，讓它響
        B[take].add(strum(rg, CH['Ab69']['g'], 0.85, 'ring', 1, hold=0.26), F(FINAL_F) + ms(late))

    arp_notes = [(84 + j * 0.5, m) for j, m in enumerate([61, 65, 68, 72, 75, 72, 68, 65])]
    arp_notes += [(88 + j * 0.5, m) for j, m in enumerate([63, 68, 70, 73, 77, 73])]
    for j, (beat, m) in enumerate(arp_notes):
        v = (0.42 if j % 2 == 0 else 0.32) * (1 + 0.06 * rH.standard_normal())
        nxt_hold = 0.95 if beat < 88 else 0.85
        B['arp'].add(strum(rH, [m], v, 'arp', 1, hold=nxt_hold), bs(beat) + (0.0 if j in (0, 8) else ms(rH.normal(0, 3.0))))

    return B, log


# ----------------------------------------------------------------------------
# 混音
# ----------------------------------------------------------------------------
def lufs(x, a=None, b=None):
    import pyloudnorm as pyln
    seg = x[:, a:b] if a is not None else x
    return pyln.Meter(SR).integrated_loudness(seg.T)


# 各元件在參考段落要到的響度（LUFS，混音前）。參考段落：最後一次副歌（小節 24–27）
LEVELS = dict(kick=-20.5, drums_other=-25.5, bass=-20.0, keys=-23.5, mel=-26.0, guitar=-26.5)
REF = (int(bs(bb(24))), int(bs(bb(28))))
REF_B = (int(bs(bb(16))), int(bs(bb(22))))


def mixdown(B, log, verbose=True):
    L = N + PAD
    ir_r = np.random.default_rng(31)
    plate = make_ir(ir_r, rt=1.6, length=2.6, pre=0.018)
    room = make_ir(ir_r, rt=0.55, length=0.9, pre=0.006, hi_mult=0.55)
    kicks = log['kicks']
    duck_bass = duck_env(kicks, 0.45, rel=0.085)
    duck_keys = duck_env(kicks, 0.16, rel=0.14)
    duck_gtr = duck_env(kicks, 0.14, rel=0.12)
    duck_verb = duck_env(kicks, 0.28, rel=0.16)

    def cal(x, target, rng=REF):
        g = 10 ** ((target - lufs(x, *rng)) / 20)
        return x * g, g

    # ---- 鼓 ----
    kick = hp(B['kick'].x, 28, 2)
    kick, g_kick = cal(kick, LEVELS['kick'])
    clap = hp(B['clap'].x, 160, 2)
    hats = B['hats'].x
    perc = B['perc'].x
    crash_ = hp(B['crash'].x, 300, 2)
    other = lp(clap * 1.0 + hats * 0.27 + perc * 0.16 + crash_ * 0.16, 12000, 1)
    verb_in = hp(clap * 0.22 + hats * 0.05 + perc * 0.05 + crash_ * 0.04, 300, 2)
    other_v = other + (reverb(verb_in, plate) * 0.55 + reverb(hp(clap * 0.25 + hats * 0.10, 300, 2), room) * 0.6) * duck_verb
    other_v, g_other = cal(other_v, LEVELS['drums_other'])
    other_v = sweep_lp(other_v)

    # ---- 貝斯 ----
    bass = B['bass'].x[0].copy()  # 單聲道（pan=0 時左右相同）
    pk = np.max(np.abs(bass)) + 1e-12
    bass = sat(bass / pk * 0.9, 2.0, 0.12) * pk / 0.9
    bass = lp(bass, 3400, 2)
    bass = lp(bass, 6000, 1)
    bass = hp(bass, 32, 2)
    bass = shelf_lo(bass, 90, 1.5)
    bass = peq(bass, 250, -2.0, 1.0)
    bass = peq(bass, 850, 4.0, 0.8)  # 撥弦的「顆粒」：手機喇叭靠這段聽到貝斯線
    bass = bass * duck_bass
    bass = np.vstack([bass, bass])
    bass, g_bass = cal(bass, LEVELS['bass'])

    # ---- Rhodes ----
    def keys_chain(x):
        x = hp(x, 140, 2)
        pk = np.max(np.abs(x)) + 1e-12
        x = sat(x / pk * 0.8, 1.25, 0.05) * pk / 0.8
        x = peq(x, 280, -3.0, 0.9)  # 低中頻收一點（不糊）
        x = peq(x, 1800, 1.5, 0.8)
        x = lp(x, 7500, 2)
        x = autopan(x, 112 / 60 * 2, 0.22)  # 8 分音符速的立體聲顫音（Suitcase，深度 ±22%）
        return chorus(x)

    keys = keys_chain(B['keys'].x)
    keys, g_keys = cal(keys, LEVELS['keys'])
    mel = keys_chain(B['mel'].x)
    mel, g_mel = cal(mel, LEVELS['mel'], REF_B)
    keys_send = hp(keys * 0.30 + mel * 0.38, 300, 2)
    keys_all = (keys + mel) * duck_keys + reverb(keys_send, plate) * 0.5 * duck_verb + pingpong(mel, BEAT * 0.75 / SR, 0.3, 4) * 0.22
    keys_all = sweep_lp(keys_all)

    # ---- 吉他 ----
    def gtr_chain(x):
        x = hp(x, 220, 2)
        x = peq(x, 2600, 3.0, 0.9)
        x = peq(x, 450, -2.0, 1.0)
        x = lp(x, 7500, 2)
        pk = np.max(np.abs(x)) + 1e-12
        return sat(x / pk * 0.8, 1.3, 0.04) * pk / 0.8

    gL = gtr_chain(B['gtrL'].x[0])
    gR = gtr_chain(B['gtrR'].x[0])
    gl, gr = panlaw(-0.62)
    hl, hr = panlaw(0.62)
    gtr = np.vstack([gL * gl + gR * hl, gL * gr + gR * hr])
    arp = gtr_chain(B['arp'].x[0])
    al, ar = panlaw(-0.25)
    arp = np.vstack([arp * al, arp * ar])
    gtr, g_gtr = cal(gtr, LEVELS['guitar'])
    arp = arp * g_gtr * 1.15
    gsend = hp(gtr * 0.16 + arp * 0.35, 300, 2)
    gtr_all = gtr * duck_gtr + arp + reverb(gsend, room) * 0.6 * duck_verb + reverb(hp(arp * 0.3, 300, 2), plate) * 0.6 \
        + pingpong(arp, BEAT * 0.75 / SR, 0.28, 3) * 0.25
    gtr_all = sweep_lp(gtr_all)

    stems = dict(drums=kick + other_v, bass=bass, keys=keys_all, guitar=gtr_all)
    stems = {k: hp(v, 25, 2)[:, :N] for k, v in stems.items()}
    if verbose:
        print('  校準增益（dB）：' + '，'.join(f'{k} {db(g):+.1f}' for k, g in dict(kick=g_kick, drums_other=g_other, bass=g_bass, keys=g_keys,
                                                                                   mel=g_mel, guitar=g_gtr).items()))
    parts = dict(kick=kick[:, :N], other=other_v[:, :N], hats=hats[:, :N] * 0.27 * g_other)
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


def glue_gain(x, ratio=1.6, att=0.012, rel=0.20, hop=48):
    """匯流排黏合壓縮（連動：同一條增益曲線乘在每個分軌上）。門檻＝副歌 10 ms RMS 的 95 百分位 − 4 dB"""
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
    k = sec(0.001)
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
    if which == '>5k':
        return hp(mono, 5000, 4)
    if which == '>2k':
        return hp(mono, 2000, 4)
    if which == '<150':
        return lp(mono, 150, 4)
    if which == '1-4k':
        return bp(mono, 1000, 4000, 2)
    if which == '>1.5k':
        return hp(mono, 1500, 4)
    if which == '>3k':
        return hp(mono, 3000, 4)
    if which == 'mid':
        return bp(mono, 200, 2000, 2)
    raise ValueError(which)


def onset(x, s0, bands, search=0.020):
    """在 s0±20 ms 內用 3 ms 前後能量比找起點（先裁出前後 0.5 秒再濾波，省時間）；取跳升最明顯的頻帶"""
    a = max(0, s0 - sec(0.5))
    seg = x[..., a : s0 + sec(0.5)]
    best = None
    for b_ in bands:
        off, r = _fb_ratio(band(seg, b_), s0 - a, sec(0.003), sec(search))
        if best is None or r > best[1]:
            best = (off, r, b_)
    return best


def rms_db(x, a, b):
    return db(np.sqrt(np.mean(x[..., a:b] ** 2)))


# (名稱, 拍號或 None, 分鏡格數（None＝用精確拍點四捨五入，同 bar60/b60）, 看哪個分軌, 頻帶, 是否為分鏡指定的段落點)
CHECKS = [
    ('f0 開頭：大鼓＋貝斯第一下', 0.0, 0, 'drums', ('full',), True),
    ('f32 先報價落地（第 2 拍大鼓）', 1.0, None, 'drums', ('full',), False),
    ('f386 小節4第1拍 貝斯重音（設計師）', 12.0, None, 'bass', ('mid',), False),
    ('小節 5：hi-hat 進場', 16.0, None, 'drums', ('>5k',), True),
    ('小節 5：Rhodes 進場', 16.0, None, 'keys', ('>1.5k', '>3k'), True),
    ('小節 5 第 2 拍：第一下拍手', 17.0, None, 'drums', ('1-4k',), False),
    ('小節 12 頂點 drop：crash', 44.0, None, 'drums', ('>5k',), True),
    ('小節 12 頂點 drop：主和弦 A♭maj9', 44.0, None, 'keys', ('>1.5k', '>3k'), True),
    ('小節 17 第 1 拍旋律（上班開心 1）', 64.0, None, 'keys', ('>1.5k', '>3k'), False),
    ('小節 17 第 3 拍旋律（上班開心 2）', 66.0, None, 'keys', ('>1.5k', '>3k'), False),
    ('小節 22 抽鼓：和弦落拍', 84.0, None, 'keys', ('>1.5k', 'mid'), True),
    ('小節 22 抽鼓：貝斯落拍', 84.0, None, 'bass', ('mid',), True),
    ('小節 23 第 4 拍：地圖落定 stab', 91.0, None, 'keys', ('>1.5k', '>3k'), False),
    ('小節 24 正拍：鼓組回來＝logo', 92.0, None, 'drums', ('full', '>5k'), True),
    ('片尾資訊第 1 行', 101.0, None, 'keys', ('>1.5k', '>3k'), False),
    ('片尾資訊第 2 行', 101.5, None, 'keys', ('>1.5k', '>3k'), False),
    ('片尾資訊第 3 行', 102.0, None, 'keys', ('>1.5k', '>3k'), False),
    ('片尾資訊第 4 行', 102.5, None, 'keys', ('>1.5k', '>3k'), False),
    ('片尾資訊第 5 行', 103.0, None, 'keys', ('>1.5k', '>3k'), False),
    ('f3576 最後一擊', None, 3576, 'mix', ('full', '>2k'), True),
]


def sb_frame(beat, fr_sb):
    """分鏡格：有寫死的用寫死的；其他＝精確拍點格數四捨五入（JS Math.round：.5 進位）"""
    return fr_sb if fr_sb is not None else int(np.floor(bf(beat) + 0.5))


def verify(y, stems, parts, log, info):
    print('\n================ 驗證 ================')
    yy, nfr, ch, sw, fr = read_wav24(OUT_WAV)
    ok_len = nfr == N
    print(f'[長度] {nfr} 樣本、{ch} 聲道、{sw * 8}-bit、{fr} Hz → {"OK（剛好 2,880,000＝60.000 秒）" if ok_len else "不符！"}')
    for k in STEMS:
        _, n2, c2, s2, f2 = read_wav24(os.path.join(STEM_DIR, f'{k}.wav'))
        print(f'       分軌 {k:<6s} {n2} 樣本、{c2} 聲道、{s2 * 8}-bit、{f2} Hz')
    ssum = sum(read_wav24(os.path.join(STEM_DIR, f'{k}.wav'))[0] for k in STEMS)
    print(f'       四軌相加 − 主檔：最大誤差 {db(np.abs(ssum - yy).max()):.1f} dBFS（24-bit 量化等級）')

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
    print(f'[尾] 最後一個非零樣本 #{last_nz}（第 {last_nz / SPF:.2f} 格）；f{FADE_B}–3600 峰值 {np.abs(yy[:, F(FADE_B):]).max():.1e}')
    for a, b in ((3540, 3576), (3576, 3586), (3586, 3592), (3592, 3598)):
        print(f'      f{a}–{b} RMS {rms_db(yy, F(a), F(b)):6.1f} dBFS')

    # 段落響度
    print('[段落短時響度]')
    secs = [(0, 16, '1–4 鋪陳 大鼓＋貝斯'), (16, 28, '5–7 S3 拍手/hat/Rhodes'), (28, 40, '8–10 S4/S5 吉他進'),
            (40, 44, '11 濾波上揚'), (44, 60, '12–15 頂點/副歌'), (60, 84, '16–21 B 段'), (84, 92, '22–23 抽鼓（拉遠）'),
            (92, 108, '24–27 logo/最後副歌'), (108, 111.25, '28 收尾')]
    for a, b, lab in secs:
        print(f'      f{bf(a):6.0f}–{bf(b):<6.0f} {lab:<22s} {lufs(yy, int(bs(a)), int(bs(b))):6.1f} LUFS')

    # 段落點對位
    print('\n[對位] 精確拍點＝拍號 × 60/112 秒（不四捨五入到格）；分鏡格＝bar60()/b60() 四捨五入後畫面發生的那一格')
    print('  要求：起音距精確拍點 ≤ 5 ms；★＝分鏡指定的段落點，另外要求起音落在分鏡那一格（格首前 5 ms 到格首後 16.7 ms 內）')
    print('  事件                         | 精確拍點  | 分軌起音 − 精確拍點 | 成品混音 − 精確拍點 | 起音所在格 | 起音 − 分鏡格首')
    worst = 0.0
    worst_key = 0.0
    rows = []
    for name, beat, fr_sb, src, bands, key in CHECKS:
        exact = bs(beat) if beat is not None else F(fr_sb)
        sb = sb_frame(beat, fr_sb)
        s0 = int(round(exact))
        xs = yy if src == 'mix' else stems[src]
        off, rise, bnd = onset(xs, s0, bands)
        offm, risem, _ = onset(yy, s0, ('full', '>2k', '>5k'))
        t_on = s0 + off * SR / 1000
        fr_on = t_on / SPF
        d_ex = (t_on - exact) / SR * 1000
        vs_sb = (t_on - F(sb)) / SR * 1000
        worst = max(worst, abs(d_ex))
        if key:
            worst_key = max(worst_key, abs(d_ex))
        bad = abs(d_ex) > 5.0 or (key and not (-5.0 <= vs_sb < 1000.0 / FPS))
        rows.append(dict(name=name, exact_frame=exact / SPF, off_ms=d_ex, mix_ms=offm, frame=int(fr_on), sb=sb, vs_sb=vs_sb, key=key, ok=not bad))
        print(f'  {"★" if key else " "}{name:<27s} | f{exact / SPF:8.2f} | {src:<6s}{d_ex:+6.2f} ms（{rise:+5.1f} dB {bnd:>4s}）| '
              f'{offm:+6.2f} ms（{risem:+5.1f} dB）| f{int(fr_on):<5d} | f{sb}：{vs_sb:+6.2f} ms{"  <-- 超出" if bad else ""}')
    print(f'  全部事件：起音距精確拍點最大 {worst:.2f} ms；★段落點最大 {worst_key:.2f} ms（容許 ≤ 5 ms）；'
          f'★全部落在分鏡那一格：{all(r["ok"] for r in rows if r["key"])}')
    print('  註：「起音 − 分鏡格首」的 −8.3…+8.3 ms 是 112 BPM 拍點本來就不落在整格上（每拍 32.14 格），分鏡格是四捨五入；'
          '拍點照規格用精確值，所以聲音在該拍所在那一格內響起')

    # 濾波下沉（小節 11 正拍）：鼓以外 >1 kHz 能量最陡的下降點
    nond = stems['keys'] + stems['guitar'] + parts['other']
    s11 = int(round(bs(40)))
    seg = hp(nond.sum(axis=0)[s11 - sec(0.5) : s11 + sec(0.5)], 1000, 4)
    offd, rd = _fb_ratio(-0.0 + seg, sec(0.5), sec(0.005), sec(0.02), invert=True)
    print(f'  {"★"}小節 11 濾波下沉（鼓以外 >1 kHz 最陡下降）| f{bf(40):8.2f} | {offd:+6.2f} ms（{rd:+5.1f} dB）')
    rows.append(dict(name='小節 11 濾波下沉', exact_frame=bf(40), off_ms=offd, mix_ms=float('nan'), frame=int((s11 + offd * SR / 1000) / SPF),
                     sb=sb_frame(40, None), vs_sb=(s11 + offd * SR / 1000 - F(sb_frame(40, None))) / SR * 1000, key=True, ok=abs(offd) <= 5))

    # 抽鼓／回來
    dr = stems['drums']
    a22, a24 = int(bs(84)), int(bs(92))
    pre_db = rms_db(dr, a22 - int(BEAT * 4), a22)
    post_db = rms_db(dr, a22 + sec(0.15), a24 - sec(0.02))
    pk_dry = db(np.abs(parts['kick'][:, a22 + sec(0.02) : a24]).max())
    post_on = max(_fb_ratio(band(dr, '>2k'), s, sec(0.003), sec(0.02))[1] for s in range(a22 + sec(0.2), a24 - sec(0.05), sec(0.04)))
    back = rms_db(dr, a24, a24 + int(BEAT))
    print(f'\n[抽鼓] 鼓分軌 RMS：小節 21 {pre_db:.1f} dBFS → 小節 22–23 {post_db:.1f} dBFS（只剩殘響尾巴）；'
          f'大鼓在 f2700 之後峰值 {pk_dry:.1f} dBFS；小節 22–23 內最大起音比 {post_on:+.1f} dB（沒有新的鼓擊）')
    print(f'[回來] 小節 24 第 1 拍鼓分軌 RMS {back:.1f} dBFS（比抽鼓段高 {back - post_db:.1f} dB）')
    k22 = rms_db(stems['keys'], a22, a24)
    b22 = rms_db(stems['bass'], a22, a24)
    print(f'        抽鼓段仍有：keys {k22:.1f} dBFS、bass {b22:.1f} dBFS（不是全靜音）')

    # 濾波上揚
    def centroid(x, a, b):
        seg = x.sum(axis=0)[a:b]
        f, P = signal.welch(seg, SR, nperseg=4096)
        return float(np.sum(f * P) / np.sum(P))
    s11, s12 = int(bs(40)), int(bs(44))
    nonlow = stems['keys'] + stems['guitar'] + parts['other']
    cs = [centroid(nonlow, int(bs(b)), int(bs(b + 1))) for b in range(38, 46)]
    print('[濾波上揚] 鼓以外（keys＋guitar＋hat/拍手）每拍頻譜重心（Hz）：小節 10 第 3–4 拍 ' + ' '.join(f'{c:.0f}' for c in cs[:2])
          + ' | 小節 11 ' + ' '.join(f'{c:.0f}' for c in cs[2:6]) + ' | 小節 12 ' + ' '.join(f'{c:.0f}' for c in cs[6:]))
    hf = hp(yy.sum(axis=0), 5000, 4)
    print(f'           成品 >5 kHz：小節 11 第 1 拍 {rms_db(hf, s11, s11 + int(BEAT)):.1f} → 第 4 拍 '
          f'{rms_db(hf, s11 + int(3 * BEAT), s12):.1f} → 小節 12 第 1 拍 {rms_db(hf, s12, s12 + int(BEAT)):.1f} dBFS')

    # 律動
    print('\n[律動]')
    hats_m = band(parts['hats'], '>5k')
    devs = {0: [], 1: []}
    bars_sw = list(range(5, 11)) + list(range(16, 22))  # 主歌＋B 段（反拍是半開 hat，不會蓋住下一個 16 分）
    for bar in bars_sw:
        for st_ in range(16):
            g0 = int(round(bs(step_beat(bar, st_, 0.5))))  # 拉直的 16 分格點；在 ±25 ms 內找實際起音
            off, r_ = _fb_ratio(hats_m, g0, sec(0.0015), sec(0.025))
            if r_ > 6.0:
                devs[st_ % 2].append(off)
    ev_, od_ = np.array(devs[0]), np.array(devs[1])
    sw_meas = 50 + np.mean(od_) / (BEAT / 2 / SR * 1000) * 100
    print(f'  hi-hat（小節 5–10、16–21，以拉直 16 分格點 ±25 ms 找起音；偵測到 正 {len(ev_)}／反 {len(od_)} 個）：'
          f'反 16 分平均晚 {np.mean(od_):+.1f} ms（σ {np.std(od_):.1f}）→ 搖擺 {sw_meas:.1f}%（設定 {SWING * 100:.1f}%）；'
          f'正 16 分偏差平均 {np.mean(ev_):+.1f} ms、σ = {np.std(ev_):.1f} ms（人手誤差）')
    hv = np.array([v for (_, _, v, _) in log['hats']])
    gv = np.array([v for (_, _, k, v) in log['gtr']])
    bv = np.array([v for (_, _, _, v, d) in log['bass'] if not d])
    print(f'  力度變化（CV＝標準差/平均）：hat {np.std(hv) / np.mean(hv):.2f}、吉他 {np.std(gv) / np.mean(gv):.2f}、'
          f'貝斯 {np.std(bv) / np.mean(bv):.2f}；貝斯 ghost note {sum(1 for x in log["bass"] if x[4])} 個')
    kp = np.array(log['kicks'])
    kd = (kp - np.round(kp / BEAT) * BEAT)[:-1]
    print(f'  大鼓：{len(kp)} 下，對拍點最大誤差 {np.abs(kd).max() / SR * 1000:.3f} ms（四拍穩定，不加誤差）')

    # 頻段能量
    print('\n[頻段能量] 各段 RMS（dBFS，左右相加/2）')
    edges = [(20, 60, 'sub'), (60, 120, 'low'), (120, 250, 'lowmid'), (250, 500, 'mid-'), (500, 2000, 'mid'),
             (2000, 6000, 'pres'), (6000, 16000, 'air')]
    mono = 0.5 * yy.sum(axis=0)
    bands_x = {lab: bp(mono, lo, hi, 4) if lo > 20 else bp(mono, 20, hi, 4) for lo, hi, lab in edges}
    print('      段落                      ' + ''.join(f'{lab:>8s}' for _, _, lab in edges))
    for a_, b_, lab in secs:
        A, Bq = int(bs(a_)), int(bs(b_))
        print(f'      {lab:<24s}' + ''.join(f'{rms_db(bands_x[l], A, Bq):8.1f}' for _, _, l in edges))
    f, P = signal.welch(mono[int(bs(92)) : int(bs(108))], SR, nperseg=16384)
    print('  小節 24–27 1/1 倍頻程（相對 1 kHz，dB）：', end='')
    ref = None
    for fc in (31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000):
        m = (f >= fc / np.sqrt(2)) & (f < fc * np.sqrt(2))
        e = 10 * np.log10(np.sum(P[m]) + 1e-20)
        if fc == 1000:
            ref = e
        print(f' {fc:g}:{e:.1f}', end='')
    print()
    print('                              → ', end='')
    for fc in (31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000):
        m = (f >= fc / np.sqrt(2)) & (f < fc * np.sqrt(2))
        print(f' {fc:g}:{10 * np.log10(np.sum(P[m]) + 1e-20) - ref:+.1f}', end='')
    print()
    sub20 = 10 * np.log10(np.sum(P[f < 30]) / np.sum(P))
    print(f'  30 Hz 以下能量佔比 {sub20:.1f} dB；直流 {np.round(yy.mean(axis=1), 7).tolist()}')

    # 立體聲
    print('[立體聲] 各頻段左右相關（1＝單聲道）與 side/mid 能量比')
    for lo, hi, lab in ((25, 120, '<120 Hz'), (120, 1000, '120–1k'), (1000, 5000, '1k–5k'), (5000, 18000, '>5k')):
        Lb = bp(yy[0], lo, hi, 4)
        Rb = bp(yy[1], lo, hi, 4)
        c = float(np.corrcoef(Lb, Rb)[0, 1])
        sm = 10 * np.log10(np.sum((Lb - Rb) ** 2) / (np.sum((Lb + Rb) ** 2) + 1e-20) + 1e-20)
        print(f'      {lab:<8s} r = {c:.3f}  side/mid {sm:+.1f} dB')
    rl = db(np.sqrt(np.mean(yy[0] ** 2)) / np.sqrt(np.mean(yy[1] ** 2)))
    print(f'      左右 RMS 差 {rl:+.2f} dB')
    def phone(x):  # 手機喇叭：~300 Hz 以下 24 dB/oct 掉、2.5 kHz 稍微突出、10 kHz 以上掉
        return lp(peq(hp(x, 300, 4), 2500, 3.0, 0.7), 10000, 2)
    ph = phone(yy)
    print('[手機喇叭模擬] 各段響度（LUFS）：' + '，'.join(
        f'{lab.split()[0]} {lufs(ph, int(bs(a_)), int(bs(b_))):.1f}' for a_, b_, lab in secs))
    pk = db(np.abs(yy).max())
    print(f'[動態] 取樣峰值 {pk:.1f} dBFS；PLR（true peak − integrated）{TP - I:.1f} dB；LRA {LRA:.1f} LU')
    return dict(I=I, TP=TP, LRA=LRA, frames=nfr, rows=rows, worst=worst, swing=sw_meas)


def pictures(y, stems):
    wav_png = os.path.join(OUT_DIR, 'geese60_waveform.png')
    spec_png = os.path.join(OUT_DIR, 'geese60_spectrum.png')
    tl_png = os.path.join(OUT_DIR, 'geese60_timeline.png')
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
    win = sec(0.2)
    pw = np.convolve(mono ** 2, np.ones(win) / win, mode='same')[::SPF]
    ax.plot(np.arange(len(pw)), 10 * np.log10(pw + 1e-12), color='#1E1A17', lw=1)
    ax.set_ylim(-60, 0)
    ax.set_xlim(0, 3600)
    secs = [(0, 16, '鋪陳 大鼓＋貝斯', '#f3eedf'), (16, 40, '拍手/hat/Rhodes（8 起吉他）', '#efe3b0'), (40, 44, '濾波', '#e6d27a'),
            (44, 60, '頂點/副歌', '#EED64F'), (60, 84, 'B 段 旋律', '#efe3b0'), (84, 92, '抽鼓', '#f8f5ec'),
            (92, 108, 'logo/最後副歌', '#EED64F'), (108, 112, '收尾', '#efe3b0')]
    for a, b, lab, col in secs:
        ax.axvspan(bf(a), bf(b), color=col, alpha=0.9, lw=0)
        ax.text(bf((a + b) / 2), -3, lab, ha='center', va='top', fontsize=9)
    for name, beat, fr_sb, src, _, _ in CHECKS:
        x = bf(beat) if beat is not None else fr_sb
        ax.axvline(x, color='#b5452f', lw=0.7, alpha=0.7)
    ax.set_ylabel('200ms RMS (dBFS)')
    ax.set_title('geese60.wav 結構：短時能量＋段落點（紅線＝驗證事件）')
    ax = axes[1]
    for k, col, off in (('drums', '#1E1A17', 0), ('bass', '#8a5a00', -18), ('keys', '#b5452f', -36), ('guitar', '#2f6db5', -54)):
        s = stems[k].mean(axis=0)
        e = np.convolve(s ** 2, np.ones(sec(0.05)) / sec(0.05), mode='same')[:: SPF // 2]
        ax.plot(np.arange(len(e)) / 2, np.clip(10 * np.log10(e + 1e-12), -60, 0) + off, color=col, lw=0.6, label=k)
    ax.legend(loc='lower left', fontsize=8)
    ax.set_ylabel('分軌 50ms RMS（各差 18 dB 疊放）')
    ax = axes[2]
    hf = hp(mono, 5000, 4)
    e = np.convolve(hf ** 2, np.ones(sec(0.03)) / sec(0.03), mode='same')[:: SPF // 4]
    ax.plot(np.arange(len(e)) / 4, 10 * np.log10(e + 1e-14), color='#8f5a2f', lw=0.6)
    ax.set_ylim(-80, -10)
    ax.set_ylabel('>5kHz 30ms RMS')
    ax = axes[3]
    fq, tt, Z = signal.stft(mono, fs=SR, nperseg=4096, noverlap=4096 - 800)
    P = 20 * np.log10(np.abs(Z) + 1e-9)
    keep = (fq >= 30) & (fq <= 16000)
    ax.pcolormesh(tt * FPS, fq[keep], P[keep], shading='auto', cmap='magma', vmin=-110, vmax=-20)
    ax.set_yscale('log')
    ax.set_ylim(30, 16000)
    ax.set_ylabel('Hz（對數）')
    for b in (16, 40, 44, 60, 84, 92, 108):
        ax.axvline(bf(b), color='#4FC3F7', lw=0.8)
    ax.axvline(FINAL_F, color='#4FC3F7', lw=0.8)
    ax.set_xlabel('格（60 fps）')
    fig.tight_layout()
    fig.savefig(tl_png)
    plt.close(fig)
    return wav_png, spec_png, tl_png


def render(verbose=True):
    B, log = build()
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
