// 動態工具（唯讀）。規則：除了等速旋轉和慢漂，任何東西都不准線性移動。
// 每一格都是「格數的純函數」：不用 Math.random、不用計時器、不用 CSS 動畫。
import {Easing, spring} from 'remotion';
import {FPS} from './theme';

export type Ease = (t: number) => number;

export const E = {
	linear: (t: number) => t,
	outExpo: Easing.bezier(0.16, 1, 0.3, 1), // 主角進場：很快開始、很慢停好
	outBack: Easing.bezier(0.34, 1.56, 0.64, 1), // 彈出：超過約 10% 再回來（Akira 禁用）
	inExpo: Easing.bezier(0.7, 0, 0.84, 0), // 離場：慢起、加速衝出
	inOutExpo: Easing.bezier(0.87, 0, 0.13, 1),
	inOutQuart: Easing.bezier(0.76, 0, 0.24, 1),
	inOutSine: Easing.bezier(0.37, 0, 0.63, 1), // 呼吸、漂移、描線
	outCubic: Easing.bezier(0.33, 1, 0.68, 1),
	outQuart: Easing.bezier(0.25, 1, 0.5, 1),
	inCubic: Easing.bezier(0.32, 0, 0.67, 0),
} satisfies Record<string, Ease>;

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

/** start 起 dur 格的進度 0→1（套緩動、夾在 0..1） */
export const prog = (f: number, start: number, dur: number, ease: Ease = E.outExpo) =>
	ease(clamp((f - start) / Math.max(1, dur)));

/** 在 [f0,f1] 之間把 v0 補到 v1 */
export const tween = (
	f: number,
	[f0, f1]: [number, number],
	[v0, v1]: [number, number],
	ease: Ease = E.outExpo,
) => v0 + (v1 - v0) * prog(f, f0, f1 - f0, ease);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** 彈簧（Akira 用 damping 18–22，不准有明顯回彈） */
export const spr = (
	f: number,
	start: number,
	cfg: {damping?: number; stiffness?: number; mass?: number} = {},
) =>
	spring({
		frame: f - start,
		fps: FPS,
		config: {damping: cfg.damping ?? 14, stiffness: cfg.stiffness ?? 160, mass: cfg.mass ?? 1},
	});

/** 爆發型彈簧：帶初速度離開，一出手就是最快（星芒光芒、衝擊） */
export const burst = (f: number, start: number, dur = 18, overshoot = 0.12) => {
	const t = clamp((f - start) / dur);
	if (t <= 0) return 0;
	if (t >= 1) return 1;
	// 1 - e^{-kt} 加上一個衰減正弦的過衝
	const base = 1 - Math.exp(-6 * t);
	const os = overshoot * Math.sin(Math.PI * t) * Math.exp(-2 * t) * 2.2;
	return clamp(base / (1 - Math.exp(-6)) + os, 0, 1 + overshoot);
};

/** 每拍脈動：在每個拍點 b 之後 dur 格內 1→peak→1 */
export const pulseAt = (f: number, beats: number[], dur = 10, peak = 0.15) => {
	let s = 0;
	for (const b of beats) {
		const t = (f - b) / dur;
		if (t >= 0 && t <= 1) s = Math.max(s, Math.sin(Math.PI * Math.pow(t, 0.6)));
	}
	return 1 + peak * s;
};

/** 速度（每格位移），給動態模糊用：用中央差分 */
export const velocity = (fn: (f: number) => number, f: number) => (fn(f + 0.5) - fn(f - 0.5));

/** 固定亂數（mulberry32），同一個 seed 永遠同一串 */
export const rng = (seed: number) => {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};

const hex = (h: string) => {
	const s = h.replace('#', '');
	const n = parseInt(s.length === 3 ? s.split('').map((c) => c + c).join('') : s, 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** 兩個色碼之間漸變 */
export const mixHex = (a: string, b: string, t: number) => {
	const [r1, g1, b1] = hex(a);
	const [r2, g2, b2] = hex(b);
	const k = clamp(t);
	const c = (x: number, y: number) => Math.round(x + (y - x) * k);
	return `rgb(${c(r1, r2)},${c(g1, g2)},${c(b1, b2)})`;
};

/** 色碼加透明度 */
export const alpha = (h: string, a: number) => {
	const [r, g, b] = hex(h);
	return `rgba(${r},${g},${b},${clamp(a)})`;
};

/** 拍點表：從 start 起每 step 格一個，共 n 個 */
export const beatsFrom = (start: number, n: number, step = 30) =>
	Array.from({length: n}, (_, i) => start + i * step);

/** 重力拋物線：在 land 格落地、每次彈跳週期 period 格、彈高 h，回傳離地高度（>=0） */
export const bounceHeight = (f: number, lands: number[], h: number) => {
	for (let i = 0; i < lands.length - 1; i++) {
		const a = lands[i];
		const b = lands[i + 1];
		if (f >= a && f <= b) {
			const t = (f - a) / (b - a);
			return 4 * h * t * (1 - t);
		}
	}
	return 0;
};
