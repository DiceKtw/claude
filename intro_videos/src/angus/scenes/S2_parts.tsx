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

/** 折線畫到進度 t 為止的 points 字串（虛線直接用 dasharray，不用 mask，算圖比較快） */
export const partialPoly = (pts: [number, number][], t: number) => {
	const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
	let d = clamp(t) * lens.reduce((a, b) => a + b, 0);
	const out: [number, number][] = [pts[0]];
	for (let i = 0; i < lens.length; i++) {
		if (d >= lens[i]) {
			out.push(pts[i + 1]);
			d -= lens[i];
			continue;
		}
		const u = lens[i] > 0 ? d / lens[i] : 0;
		out.push([lerp(pts[i][0], pts[i + 1][0], u), lerp(pts[i][1], pts[i + 1][1], u)]);
		break;
	}
	return out.map((p) => `${n2(p[0])},${n2(p[1])}`).join(' ');
};

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
/* 貼文卡片：「作品」＝胸像剪影（paper 淡色）＋accent 髮型（四款輪流）     */
/* 一眼看得出是頭髮：鮑伯、長直髮、短髮、包頭；＋兩條短線＋右下愛心          */
/* ------------------------------------------------------------------ */
export const CARD_W = 312;
export const CARD_H = 250;

// 胸像（局部座標：原點＝照片底邊中點，往上是負）
const SHOULDER_D = 'M-80,0 C-76,-30 -44,-44 0,-44 C44,-44 76,-30 80,0 Z';
export const HAIR = {
	bob: {
		d: 'M-42,-50 C-48,-96 -34,-124 0,-126 C34,-124 48,-96 42,-50 L30,-50 C30,-72 28,-90 22,-100 C10,-96 -10,-92 -26,-80 L-28,-50 Z',
		strand: 'M-30,-66 Q-26,-106 12,-118',
	},
	long: {
		d: 'M-42,-8 C-50,-70 -44,-124 0,-126 C44,-124 50,-70 42,-8 L28,-8 C30,-60 26,-92 18,-104 C8,-100 4,-106 0,-112 C-4,-106 -8,-100 -18,-104 C-26,-92 -30,-60 -28,-8 Z',
		strand: 'M0,-124 L0,-112',
	},
	pixie: {
		d: 'M-28,-76 C-34,-106 -18,-124 4,-124 C28,-124 38,-104 30,-80 C26,-92 14,-100 -2,-100 C-14,-98 -22,-90 -28,-76 Z',
		strand: 'M-18,-108 Q2,-120 24,-108',
	},
	updo: {
		d: 'M-27,-90 C-31,-112 -16,-122 0,-122 C16,-122 31,-112 27,-90 C16,-102 -16,-102 -27,-90 Z',
		strand: 'M-16,-108 Q0,-116 16,-108',
		bun: true,
	},
} as const;
type HairKey = keyof typeof HAIR;

/** 胸像＋髮型（給 FeedCard 和 S6 的回憶符號共用） */
export const Bust: React.FC<{x: number; y: number; hair: HairKey; s?: number; body?: boolean}> = ({x, y, hair, s = 1, body = true}) => {
	const h = HAIR[hair];
	return (
		<g transform={`translate(${x} ${y}) scale(${s})`}>
			{body ? (
				<>
					<path d={SHOULDER_D} fill={alpha(C.paper, 0.12)} />
					<rect x={-11} y={-60} width={22} height={20} fill={alpha(C.paper, 0.16)} />
					<ellipse cx={0} cy={-82} rx={24} ry={30} fill={alpha(C.paper, 0.2)} />
				</>
			) : null}
			<path d={h.d} fill={C.accent} />
			{'bun' in h ? <circle cx={2} cy={-132} r={15} fill={C.accent} /> : null}
			<path d={h.strand} fill="none" stroke={alpha(C.ink, 0.45)} strokeWidth={3} strokeLinecap="round" />
		</g>
	);
};

// 每張作品：髮型、胸像左右位置、兩條短線長度
const WORKS: {hair: HairKey; dx: number; l1: number; l2: number}[] = [
	{hair: 'bob', dx: -40, l1: 150, l2: 96},
	{hair: 'long', dx: 34, l1: 120, l2: 168},
	{hair: 'pixie', dx: 0, l1: 176, l2: 84},
	{hair: 'updo', dx: -22, l1: 138, l2: 110},
];

export const FeedCard: React.FC<{k: number; x: number; y: number; f: number; likeAt: number}> = ({k, x, y, f, likeAt}) => {
	const w = WORKS[k % WORKS.length];
	const px = x + 12;
	const py = y + 12;
	const pw = CARD_W - 24;
	const ph = 152;
	const clipId = `angS2ph${k}`;
	return (
		<g>
			<rect x={x} y={y} width={CARD_W} height={CARD_H} rx={18} fill={alpha(C.paper, 0.1)} stroke={alpha(C.paper, 0.4)} strokeWidth={1.5} />
			<clipPath id={clipId}>
				<rect x={px} y={py} width={pw} height={ph} rx={10} />
			</clipPath>
			<rect x={px} y={py} width={pw} height={ph} rx={10} fill={alpha(C.paper, 0.06)} />
			<g clipPath={`url(#${clipId})`}>
				<Bust x={px + pw / 2 + w.dx} y={py + ph} hair={w.hair} />
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
