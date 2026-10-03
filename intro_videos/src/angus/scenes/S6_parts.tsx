// 安格斯 S6 小元件：回憶符號（細線小圖）、匯聚路徑、輸入框、圓鈕
import React from 'react';
import {ANGUS} from '../../lib/theme';
import {E, alpha, clamp, lerp, prog} from '../../lib/motion';
import {Spark} from '../../lib/components';
import {BALL} from '../timeline';

const C = ANGUS;

export const CORE = {x: 540, y: 720} as const; // 匯聚中心
export const BLOOM_AT = 1500;
export const STAR_TOP = {x: 540, y: 520} as const; // 星芒移上去的位置
export const BOX = {cx: 540, cy: 1006, w: 820, h: 110} as const; // 輸入框
export const BTN = {x: BOX.cx + BOX.w / 2 - BOX.h / 2, y: BOX.cy, r: 38} as const;
export const PRESS_AT = 1690;
// 收尾：橘點落回 S0 地平線的正中央（S0 第 0 格就是從這一點長出地平線，循環時接得上）
export const BLINK = {x: 540, ground: BALL.ground, r: BALL.r} as const;

/* ------------------------------------------------------------------ */
/* 回憶符號：前面出現過的東西縮成小符號（細線畫），局部座標約 ±45px          */
/* ------------------------------------------------------------------ */
const LW = 2.5;
const SymBall: React.FC = () => (
	<g>
		<circle cx={0} cy={-6} r={16} fill={C.accent} />
		<line x1={-34} y1={22} x2={34} y2={22} stroke={C.paper} strokeWidth={LW} strokeLinecap="round" />
	</g>
);
const SymPhone: React.FC = () => (
	<g fill="none" stroke={C.paper} strokeWidth={LW}>
		<rect x={-24} y={-42} width={48} height={84} rx={11} />
		<line x1={-7} y1={-32} x2={7} y2={-32} strokeLinecap="round" />
		<rect x={-14} y={-18} width={28} height={22} rx={4} strokeWidth={2} />
		<path d="M -8 4 A 8 8 0 0 1 8 4" stroke={C.accent} strokeWidth={2.5} />
	</g>
);
const SymFunnel: React.FC = () => (
	<g fill="none" stroke={C.paper} strokeWidth={LW} strokeLinejoin="round">
		{[0, 1, 2].map((i) => {
			const y0 = -34 + i * 24;
			const tw = 74 - i * 20;
			const bw = tw - 14;
			return <polygon key={i} points={`${-tw / 2},${y0} ${tw / 2},${y0} ${bw / 2},${y0 + 18} ${-bw / 2},${y0 + 18}`} stroke={i === 2 ? C.accent : C.paper} />;
		})}
	</g>
);
const SymCards: React.FC = () => (
	<g fill="none" stroke={C.paper} strokeWidth={LW}>
		{[-1, 0, 1].map((k) => (
			<rect key={k} x={k * 27 - 11} y={-17} width={22} height={34} rx={4} />
		))}
		<rect x={-34} y={-12} width={5} height={5} fill={C.accent} stroke="none" />
	</g>
);
const SymCurve: React.FC = () => (
	<g fill="none" strokeWidth={LW} strokeLinecap="round" strokeLinejoin="round">
		<polyline points="-36,-34 -36,32 38,32" stroke={C.paper} />
		<path d="M -30 24 L -4 24 C 14 24 24 8 32 -30" stroke={C.accent} strokeWidth={3} />
	</g>
);
const SymStar: React.FC = () => <Spark cx={0} cy={0} size={74} rays={1} color={C.accent} core={5} rayWidth={0.12} />;

export const SYMBOLS: {C: React.FC; x: number; y: number}[] = [
	{C: SymBall, x: 180, y: 452},
	{C: SymPhone, x: 905, y: 470},
	{C: SymFunnel, x: 130, y: 770},
	{C: SymCards, x: 950, y: 810},
	{C: SymCurve, x: 236, y: 1130},
	{C: SymStar, x: 856, y: 1146},
];
export const ABSORB = SYMBOLS.map((_, i) => 1452 + i * 4); // 每 4 格吸收一個
const DEPART = 1434; // 刀前就已經出發（第一格就在動）

/** 符號 i 在格數 f 的位置、縮放、旋轉（沿彎曲路徑加速掉進中心） */
export const symAt = (i: number, f: number) => {
	const s = SYMBOLS[i];
	const A = ABSORB[i];
	const t = clamp((f - DEPART) / (A - DEPART));
	const e = E.inCubic(t);
	// 二次貝茲：控制點＝起點繞中心轉 62°（全部順時針捲進去）
	const dx = s.x - CORE.x;
	const dy = s.y - CORE.y;
	const a = (62 * Math.PI) / 180;
	const cx = CORE.x + (dx * Math.cos(a) - dy * Math.sin(a)) * 0.82;
	const cy = CORE.y + (dx * Math.sin(a) + dy * Math.cos(a)) * 0.82;
	const x = (1 - e) * (1 - e) * s.x + 2 * (1 - e) * e * cx + e * e * CORE.x;
	const y = (1 - e) * (1 - e) * s.y + 2 * (1 - e) * e * cy + e * e * CORE.y;
	return {x, y, scale: lerp(1.3, 0.2, e), rot: (f - 1440) * 1.5 + 220 * e, t};
};

/** 一個回憶符號（含殘影） */
export const RecallSymbol: React.FC<{i: number; g: number}> = ({i, g}) => {
	const A = ABSORB[i];
	if (g >= A) return null;
	const pop = prog(g, 1437 + i * 1.5, 9, E.outBack);
	if (pop <= 0) return null;
	const Sym = SYMBOLS[i].C;
	const now = symAt(i, g);
	const prev = symAt(i, g - 1);
	const speed = Math.hypot(now.x - prev.x, now.y - prev.y);
	const gk = clamp((speed - 6) / 26);
	const one = (p: {x: number; y: number; scale: number; rot: number}, op: number, key: string) => (
		<g key={key} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.rot.toFixed(1)}) scale(${(p.scale * pop).toFixed(3)})`} opacity={op}>
			<Sym />
		</g>
	);
	return (
		<g>
			{gk > 0 ? [1, 2, 3].map((k) => one(symAt(i, g - k * 1.2), 0.32 * (1 - (k - 1) / 3) * gk, `g${k}`)) : null}
			{one(now, 1, 'now')}
		</g>
	);
};

/* ------------------------------------------------------------------ */
/* 中心準星（匯聚的目標），1500 綻放時收掉                                 */
/* ------------------------------------------------------------------ */
export const Reticle: React.FC<{g: number}> = ({g}) => {
	const p = prog(g, 1441, 12, E.outExpo);
	const out = prog(g, BLOOM_AT - 3, 5, E.inCubic);
	if (p <= 0 || out >= 1) return null;
	const col = alpha(C.paper, 0.28);
	const r0 = 30;
	const r1 = 30 + 44 * p;
	return (
		<g opacity={1 - out}>
			{[0, 90, 180, 270].map((deg) => {
				const a = (deg * Math.PI) / 180;
				return (
					<line
						key={deg}
						x1={CORE.x + Math.cos(a) * r0}
						y1={CORE.y + Math.sin(a) * r0}
						x2={CORE.x + Math.cos(a) * r1}
						y2={CORE.y + Math.sin(a) * r1}
						stroke={col}
						strokeWidth={1.5}
					/>
				);
			})}
		</g>
	);
};

/* ------------------------------------------------------------------ */
/* 吸完之後的蓄力：細環往內收、環上 8 個刻度越轉越快                       */
/* ------------------------------------------------------------------ */
export const Inhale: React.FC<{g: number}> = ({g}) => {
	const t0 = ABSORB[ABSORB.length - 1] + 2;
	const k = prog(g, t0, BLOOM_AT - 1 - t0, E.inCubic);
	const op = prog(g, t0, 6, E.outCubic) * (1 - prog(g, BLOOM_AT - 2, 2, E.linear));
	if (op <= 0) return null;
	const r = lerp(170, 26, k);
	const spin = 25 * (g - t0) * 0.5 + 300 * k * k;
	return (
		<g opacity={op}>
			<circle cx={CORE.x} cy={CORE.y} r={r} fill="none" stroke={alpha(C.paper, 0.35)} strokeWidth={1.5} />
			<g transform={`translate(${CORE.x} ${CORE.y}) rotate(${spin.toFixed(1)})`}>
				{Array.from({length: 8}, (_, j) => {
					const a = (j * 45 * Math.PI) / 180;
					return (
						<line
							key={j}
							x1={Math.cos(a) * r}
							y1={Math.sin(a) * r}
							x2={Math.cos(a) * (r - 10)}
							y2={Math.sin(a) * (r - 10)}
							stroke={alpha(C.paper, 0.6)}
							strokeWidth={2}
						/>
					);
				})}
			</g>
		</g>
	);
};

/* ------------------------------------------------------------------ */
/* 輸入框圓鈕：accent 圓＋細線箭頭；1690 被按下（縮 0.85 再回彈）           */
/* ------------------------------------------------------------------ */
export const pressScale = (g: number) =>
	g < PRESS_AT ? 1 - 0.15 * prog(g, PRESS_AT - 4, 4, E.inCubic) : 0.85 + 0.15 * prog(g, PRESS_AT, 14, E.outBack);

export const SendButton: React.FC<{g: number; pop: number}> = ({g, pop}) => {
	if (pop <= 0) return null;
	const s = pop * pressScale(g);
	return (
		<g transform={`translate(${BTN.x} ${BTN.y}) scale(${s.toFixed(4)})`}>
			<circle r={BTN.r} fill={C.accent} />
			<g stroke={C.ink} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round">
				<line x1={-13} y1={0} x2={12} y2={0} />
				<polyline points="2,-10 13,0 2,10" />
			</g>
		</g>
	);
};
