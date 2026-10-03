// 安格斯 S2 小元件：路徑取樣（描線筆頭、沿引線移動）、貼文卡片、愛心、漏斗層
import React from 'react';
import {ANGUS} from '../../lib/theme';
import {E, alpha, clamp, lerp, mixHex, prog, pulseAt} from '../../lib/motion';

const C = ANGUS;

/* ------------------------------------------------------------------ */
/* 路徑：直線＋圓弧段，可以取樣任一進度的位置（給筆頭／小點沿線跑）        */
/* ------------------------------------------------------------------ */
export type PSeg =
	| {k: 'L'; x0: number; y0: number; x1: number; y1: number}
	| {k: 'A'; cx: number; cy: number; r: number; a0: number; a1: number};

const segLen = (s: PSeg) => (s.k === 'L' ? Math.hypot(s.x1 - s.x0, s.y1 - s.y0) : Math.abs(s.a1 - s.a0) * s.r);

export const pointAt = (segs: PSeg[], t: number): [number, number] => {
	const total = segs.reduce((a, s) => a + segLen(s), 0);
	let d = clamp(t) * total;
	for (let i = 0; i < segs.length; i++) {
		const s = segs[i];
		const L = segLen(s);
		if (d <= L || i === segs.length - 1) {
			const u = L > 0 ? clamp(d / L) : 0;
			if (s.k === 'L') return [lerp(s.x0, s.x1, u), lerp(s.y0, s.y1, u)];
			const a = lerp(s.a0, s.a1, u);
			return [s.cx + s.r * Math.cos(a), s.cy + s.r * Math.sin(a)];
		}
		d -= L;
	}
	return [0, 0];
};

const n2 = (v: number) => v.toFixed(2);

export const segsD = (segs: PSeg[]) => {
	const s0 = segs[0];
	const [sx, sy] = s0.k === 'L' ? [s0.x0, s0.y0] : [s0.cx + s0.r * Math.cos(s0.a0), s0.cy + s0.r * Math.sin(s0.a0)];
	let d = `M${n2(sx)},${n2(sy)}`;
	for (const s of segs) {
		if (s.k === 'L') d += ` L${n2(s.x1)},${n2(s.y1)}`;
		else {
			const x = s.cx + s.r * Math.cos(s.a1);
			const y = s.cy + s.r * Math.sin(s.a1);
			d += ` A${s.r},${s.r} 0 0 ${s.a1 > s.a0 ? 1 : 0} ${n2(x)},${n2(y)}`;
		}
	}
	return d;
};

/** 圓角矩形：從上緣正中間開始、順時針繞一圈 */
export const roundRectSegs = (x: number, y: number, w: number, h: number, r: number): PSeg[] => {
	const cx = x + w / 2;
	const P = Math.PI;
	return [
		{k: 'L', x0: cx, y0: y, x1: x + w - r, y1: y},
		{k: 'A', cx: x + w - r, cy: y + r, r, a0: -P / 2, a1: 0},
		{k: 'L', x0: x + w, y0: y + r, x1: x + w, y1: y + h - r},
		{k: 'A', cx: x + w - r, cy: y + h - r, r, a0: 0, a1: P / 2},
		{k: 'L', x0: x + w - r, y0: y + h, x1: x + r, y1: y + h},
		{k: 'A', cx: x + r, cy: y + h - r, r, a0: P / 2, a1: P},
		{k: 'L', x0: x, y0: y + h - r, x1: x, y1: y + r},
		{k: 'A', cx: x + r, cy: y + r, r, a0: P, a1: 1.5 * P},
		{k: 'L', x0: x + r, y0: y, x1: cx, y1: y},
	];
};

export const polySegs = (pts: [number, number][]): PSeg[] =>
	pts.slice(1).map((p, i) => ({k: 'L' as const, x0: pts[i][0], y0: pts[i][1], x1: p[0], y1: p[1]}));

/* ------------------------------------------------------------------ */
/* 線條愛心（自己畫的，中心在 0,0，約 24×21）                              */
/* ------------------------------------------------------------------ */
export const HEART_D =
	'M0,9 C-2,7 -12,1 -12,-5 C-12,-9.5 -8.5,-12 -6,-12 C-3,-12 -1,-10.5 0,-8 C1,-10.5 3,-12 6,-12 C8.5,-12 12,-9.5 12,-5 C12,1 2,7 0,9 Z';

export const Heart: React.FC<{x: number; y: number; f: number; likeAt: number}> = ({x, y, f, likeAt}) => {
	const liked = f >= likeAt;
	const s = pulseAt(f, [likeAt - 1], 11, 0.5);
	const rp = prog(f, likeAt, 16, E.outExpo);
	const ringOn = f >= likeAt && f < likeAt + 16;
	return (
		<g>
			{ringOn ? (
				<circle cx={x} cy={y - 1} r={lerp(10, 27, rp)} fill="none" stroke={C.accent} strokeWidth={Math.max(0.01, 2.2 * (1 - rp))} />
			) : null}
			<g transform={`translate(${x} ${y}) scale(${s})`}>
				<path
					d={HEART_D}
					fill={liked ? C.accent : 'none'}
					stroke={liked ? C.accent : alpha(C.paper, 0.55)}
					strokeWidth={2}
					strokeLinejoin="round"
				/>
			</g>
		</g>
	);
};

/* ------------------------------------------------------------------ */
/* 貼文卡片：抽象「作品」＝ accent 半圓（髮型輪廓）＋兩條短線＋右下愛心     */
/* ------------------------------------------------------------------ */
export const CARD_W = 312;
export const CARD_H = 250;

// 每張作品的小變化（髮型輪廓的大小、位置、傾斜、兩條短線長度）
const WORKS = [
	{dx: -46, rx: 62, ry: 62, tilt: 0, l1: 150, l2: 96},
	{dx: 34, rx: 74, ry: 54, tilt: -8, l1: 120, l2: 168},
	{dx: 0, rx: 66, ry: 66, tilt: 6, l1: 176, l2: 84},
	{dx: -22, rx: 58, ry: 70, tilt: -4, l1: 138, l2: 110},
];

export const FeedCard: React.FC<{k: number; x: number; y: number; f: number; likeAt: number}> = ({k, x, y, f, likeAt}) => {
	const w = WORKS[k % WORKS.length];
	const px = x + 12;
	const py = y + 12;
	const pw = CARD_W - 24;
	const ph = 152;
	const hx = px + pw / 2 + w.dx; // 髮型中心
	const hy = py + ph; // 坐在照片底
	const domeD = `M${hx - w.rx},${hy} A${w.rx},${w.ry} 0 0 1 ${hx + w.rx},${hy} Z`;
	// 輪廓裡面一道分線（ink 細弧）
	const partD = `M${hx - w.rx * 0.55},${hy - w.ry * 0.18} Q${hx - w.rx * 0.1},${hy - w.ry * 0.95} ${hx + w.rx * 0.5},${hy - w.ry * 0.62}`;
	const strandD = `M${hx + w.rx * 0.05},${hy - w.ry * 0.12} Q${hx + w.rx * 0.3},${hy - w.ry * 0.62} ${hx + w.rx * 0.72},${hy - w.ry * 0.4}`;
	const clipId = `angS2ph${k}`;
	return (
		<g>
			<rect x={x} y={y} width={CARD_W} height={CARD_H} rx={18} fill={alpha(C.paper, 0.1)} stroke={alpha(C.paper, 0.4)} strokeWidth={1.5} />
			<clipPath id={clipId}>
				<rect x={px} y={py} width={pw} height={ph} rx={10} />
			</clipPath>
			<rect x={px} y={py} width={pw} height={ph} rx={10} fill={alpha(C.paper, 0.06)} />
			<g clipPath={`url(#${clipId})`}>
				<g transform={`rotate(${w.tilt} ${hx} ${hy})`}>
					<path d={domeD} fill={C.accent} />
					<path d={partD} fill="none" stroke={alpha(C.ink, 0.55)} strokeWidth={3} strokeLinecap="round" />
					<path d={strandD} fill="none" stroke={alpha(C.ink, 0.35)} strokeWidth={2.5} strokeLinecap="round" />
				</g>
			</g>
			<line x1={px + 4} y1={y + 192} x2={px + 4 + w.l1} y2={y + 192} stroke={alpha(C.paper, 0.38)} strokeWidth={6} strokeLinecap="round" />
			<line x1={px + 4} y1={y + 216} x2={px + 4 + w.l2} y2={y + 216} stroke={alpha(C.paper, 0.22)} strokeWidth={6} strokeLinecap="round" />
			<Heart x={x + CARD_W - 32} y={y + 206} f={f} likeAt={likeAt} />
		</g>
	);
};

/* ------------------------------------------------------------------ */
/* 漏斗層：梯形描邊（不填色），從上緣中點長出來                            */
/* ------------------------------------------------------------------ */
export const FUNNEL = {cx: 755, top: 520, h: 120, gap: 24, widths: [420, 320, 220]} as const;
const TAPER = (100 * FUNNEL.h) / (FUNNEL.h + FUNNEL.gap); // 每層底比頂窄多少（整個漏斗斜率一致）

export const layerTop = (i: number) => FUNNEL.top + i * (FUNNEL.h + FUNNEL.gap);
export const layerMid = (i: number) => layerTop(i) + FUNNEL.h / 2;

export const FunnelLayer: React.FC<{
	i: number;
	f: number;
	b: number; // 長出來的拍點
	cx: number;
	hit?: number; // 被小點打中的格（只有「預約」那層）
}> = ({i, f, b, cx, hit}) => {
	const top = layerTop(i);
	const wT = FUNNEL.widths[i];
	const wB = wT - TAPER;
	const h = FUNNEL.h;
	// 彈出物提前 1 格起跑：先往下展開、再橫向 outBack 彈開
	const sy = prog(f, b - 1, 9, E.outExpo);
	const sx = lerp(0.18, 1, prog(f, b - 1, 15, E.outBack));
	if (sy <= 0) return null;
	const k = hit !== undefined ? prog(f, hit - 1, 5, E.outCubic) : 0;
	const pop = hit !== undefined ? pulseAt(f, [hit - 1], 14, 0.07) : 1;
	const stroke = mixHex(C.paper, C.accent, k);
	const pts = [
		[cx - wT / 2, top],
		[cx + wT / 2, top],
		[cx + wB / 2, top + h],
		[cx - wB / 2, top + h],
	]
		.map((p) => p.map(n2).join(','))
		.join(' ');
	const my = top + h / 2;
	return (
		<g transform={`translate(${cx} ${my}) scale(${pop}) translate(${-cx} ${-my})`}>
			<g transform={`translate(${cx} ${top}) scale(${sx} ${sy}) translate(${-cx} ${-top})`}>
				<polygon
					points={pts}
					fill={k > 0 ? alpha(C.accent, 0.1 * k) : 'none'}
					stroke={stroke}
					strokeWidth={lerp(2, 3, k)}
					strokeLinejoin="round"
					vectorEffect="non-scaling-stroke"
				/>
			</g>
		</g>
	);
};

/** 漏斗右側的尺寸線（技術圖語言）：每層一段，上下兩端小橫槓 */
export const FunnelDim: React.FC<{i: number; f: number; b: number; x: number}> = ({i, f, b, x}) => {
	const top = layerTop(i);
	const h = FUNNEL.h;
	const a = prog(f, b + 3, 10, E.outCubic);
	const d = prog(f, b + 4, 16, E.outExpo);
	if (a <= 0) return null;
	return (
		<g opacity={0.5 * a}>
			<line x1={x - 7} y1={top} x2={x + 7} y2={top} stroke={C.paper} strokeWidth={1.5} />
			<line x1={x} y1={top + 4} x2={x} y2={top + 4 + (h - 8) * d} stroke={C.paper} strokeWidth={1} strokeDasharray="2 5" />
			{d >= 1 ? <line x1={x - 7} y1={top + h} x2={x + 7} y2={top + h} stroke={C.paper} strokeWidth={1.5} /> : null}
		</g>
	);
};
