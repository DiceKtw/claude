// Akira S0 小元件＋幾何工具（S2 也會用到這裡的貝茲取樣）
import React from 'react';
import {AKIRA, F} from '../../lib/theme';
import {E, clamp, prog} from '../../lib/motion';

export type Pt = [number, number];
export type Cub = [Pt, Pt, Pt, Pt];

const C = AKIRA;

/* ------------------------------------------------------------------ */
/* 三次貝茲：取點、切線、曲率                                             */
/* ------------------------------------------------------------------ */
export const cubAt = ([a, b, c, d]: Cub, t: number): Pt => {
	const u = 1 - t;
	const k0 = u * u * u;
	const k1 = 3 * u * u * t;
	const k2 = 3 * u * t * t;
	const k3 = t * t * t;
	return [k0 * a[0] + k1 * b[0] + k2 * c[0] + k3 * d[0], k0 * a[1] + k1 * b[1] + k2 * c[1] + k3 * d[1]];
};

const cubD1 = ([a, b, c, d]: Cub, t: number): Pt => {
	const u = 1 - t;
	return [
		3 * u * u * (b[0] - a[0]) + 6 * u * t * (c[0] - b[0]) + 3 * t * t * (d[0] - c[0]),
		3 * u * u * (b[1] - a[1]) + 6 * u * t * (c[1] - b[1]) + 3 * t * t * (d[1] - c[1]),
	];
};

const cubD2 = ([a, b, c, d]: Cub, t: number): Pt => {
	const u = 1 - t;
	return [6 * u * (c[0] - 2 * b[0] + a[0]) + 6 * t * (d[0] - 2 * c[0] + b[0]), 6 * u * (c[1] - 2 * b[1] + a[1]) + 6 * t * (d[1] - 2 * c[1] + b[1])];
};

/** 帶正負號的曲率（正 = 往右彎，螢幕座標） */
export const cubCurv = (c: Cub, t: number) => {
	const [x1, y1] = cubD1(c, t);
	const [x2, y2] = cubD2(c, t);
	return (x1 * y2 - y1 * x2) / Math.pow(x1 * x1 + y1 * y1, 1.5);
};

const r1 = (v: number) => Math.round(v * 10) / 10;
export const cubsD = (cs: Cub[], close = false) =>
	`M ${r1(cs[0][0][0])} ${r1(cs[0][0][1])} ` +
	cs.map(([, b, c, d]) => `C ${r1(b[0])} ${r1(b[1])} ${r1(c[0])} ${r1(c[1])} ${r1(d[0])} ${r1(d[1])}`).join(' ') +
	(close ? ' Z' : '');

/** 把一串點用 Catmull-Rom 轉成平順的三次貝茲（手繪感的路徑好調） */
export const smoothCubs = (pts: Pt[], tension = 1): Cub[] => {
	const out: Cub[] = [];
	for (let i = 0; i < pts.length - 1; i++) {
		const p0 = pts[Math.max(0, i - 1)];
		const p1 = pts[i];
		const p2 = pts[i + 1];
		const p3 = pts[Math.min(pts.length - 1, i + 2)];
		const k = tension / 6;
		out.push([p1, [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k], [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k], p2]);
	}
	return out;
};

/** 依弧長取點：at(p) 回傳整條路徑長度比例 p 處的點與切線角 */
export const sampler = (cs: Cub[], n = 48) => {
	const pts: {x: number; y: number; s: number; seg: number; t: number}[] = [];
	let s = 0;
	let prev = cubAt(cs[0], 0);
	pts.push({x: prev[0], y: prev[1], s: 0, seg: 0, t: 0});
	cs.forEach((c, si) => {
		for (let i = 1; i <= n; i++) {
			const t = i / n;
			const q = cubAt(c, t);
			s += Math.hypot(q[0] - prev[0], q[1] - prev[1]);
			pts.push({x: q[0], y: q[1], s, seg: si, t});
			prev = q;
		}
	});
	const len = s;
	const at = (p: number) => {
		const target = clamp(p) * len;
		let lo = 0;
		let hi = pts.length - 1;
		while (hi - lo > 1) {
			const mid = (lo + hi) >> 1;
			if (pts[mid].s < target) lo = mid;
			else hi = mid;
		}
		const A = pts[lo];
		const B = pts[hi];
		const k = B.s > A.s ? (target - A.s) / (B.s - A.s) : 0;
		return {x: A.x + (B.x - A.x) * k, y: A.y + (B.y - A.y) * k, ang: Math.atan2(B.y - A.y, B.x - A.x)};
	};
	return {len, at, pts};
};

/* ------------------------------------------------------------------ */
/* S0 的髮絲曲線（原創）：左緣外水平進來 → x≈380 往上彎 → 頂點 → S 形流到右下  */
/* endDx：曲線末端往右漂（定格段的 drift）                                 */
/* ------------------------------------------------------------------ */
export const strandCubs = (endDx = 0): Cub[] => [
	[[-20, 980], [110, 980], [262, 982], [352, 966]],
	[[352, 966], [424, 953], [452, 896], [470, 820]],
	[[470, 820], [490, 736], [532, 678], [604, 672]],
	[[604, 672], [690, 665], [748, 724], [742, 806]],
	[[742, 806], [736, 884], [668, 922], [672 + endDx * 0.15, 1002]],
	[[672 + endDx * 0.15, 1002], [676 + endDx * 0.3, 1082], [784 + endDx * 0.7, 1132], [900 + endDx, 1150]],
];

/* ------------------------------------------------------------------ */
/* 量測小字（F.mono 20、暖灰、全大寫、字距 0.3em）：淡入＋上移 16px        */
/* ------------------------------------------------------------------ */
export const MonoTag: React.FC<{
	f: number;
	start: number;
	x: number;
	y: number; // 文字盒上緣
	text: string;
	size?: number;
	color?: string;
	tracking?: number;
	dur?: number;
	align?: 'left' | 'right';
	rise?: number;
}> = ({f, start, x, y, text, size = 20, color = C.muted, tracking = 0.3, dur = 20, align = 'left', rise = 16}) => {
	const p = prog(f, start, dur, E.outCubic);
	if (p <= 0) return null;
	return (
		<div
			style={{
				position: 'absolute',
				left: align === 'left' ? x : undefined,
				right: align === 'right' ? 1080 - x : undefined,
				top: y,
				fontFamily: F.mono,
				fontSize: size,
				lineHeight: `${size * 1.3}px`,
				color,
				letterSpacing: `${tracking}em`,
				whiteSpace: 'pre',
				opacity: p,
				transform: `translateY(${(1 - p) * rise}px)`,
			}}
		>
			{text}
		</div>
	);
};
