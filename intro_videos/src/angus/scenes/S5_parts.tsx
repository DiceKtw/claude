// 安格斯 S5 小元件：蒙太奇 8 刀的「小技法」（每種只用一次）
import React from 'react';
import {ANGUS, F} from '../../lib/theme';
import {E, alpha, clamp, lerp, prog} from '../../lib/motion';
import {DrawPath, Ring} from '../../lib/components';

const C = ANGUS;

export const CUT = 15;
export const CUT0 = 1320;
export const WORD = {cx: 540, cy: 780, size: 240} as const; // 大字中心
export const TAG_Y = 952; // 等寬編號中線
export const WORDS = ['行銷', '定價', '回客', '團隊', '品牌', '口碑', '預約', '收入'] as const;

type P = {g: number; s: number; fg: string};

/* 1 行銷：網點（halftone 圓點陣），一道波由左到右掃過，掃過的點放大；越右邊越大 */
const HT = {x0: 46, y0: 446, pitch: 28, cols: 36, rows: 25};
export const Halftone: React.FC<P> = ({g, s}) => {
	const front = lerp(-260, 1340, prog(g, s - 3, 15, E.outCubic));
	const dots: React.ReactNode[] = [];
	for (let r = 0; r < HT.rows; r++) {
		const y = HT.y0 + r * HT.pitch;
		const off = r % 2 === 0 ? 0 : HT.pitch / 2;
		// 跟大字中心的垂直距離：中間的帶狀最密
		const band = 1 - clamp(Math.abs(y - WORD.cy) / 360);
		for (let c = 0; c < HT.cols; c++) {
			const x = HT.x0 + c * HT.pitch + off;
			const behind = (front - x) / 220;
			if (behind <= 0) continue;
			const k = E.outBack(clamp(behind));
			const base = 1.4 + 9.6 * Math.pow(clamp((x - 40) / 1000), 1.3) * (0.35 + 0.65 * band);
			const rr = base * k;
			if (rr < 0.4) continue;
			dots.push(<circle key={`${r}-${c}`} cx={x} cy={y} r={rr.toFixed(2)} />);
		}
	}
	return <g fill={alpha(C.accent, 0.85)}>{dots}</g>;
};

/* 2 定價：價格標籤細線框（尖頭＋穿孔）＋刻度尺從左畫到右 */
const TAG = {x0: 168, x1: 880, y0: 640, y1: 920, r: 22};
const tagD = (() => {
	const {x0, x1, y0, y1, r} = TAG;
	const tip = x0 - 0;
	const nx = x0 + 120; // 尖頭斜邊結束
	return [
		`M ${tip} ${WORD.cy}`,
		`L ${nx} ${y0}`,
		`L ${x1 - r} ${y0}`,
		`Q ${x1} ${y0} ${x1} ${y0 + r}`,
		`L ${x1} ${y1 - r}`,
		`Q ${x1} ${y1} ${x1 - r} ${y1}`,
		`L ${nx} ${y1}`,
		'Z',
	].join(' ');
})();
const RULER = {x0: 168, x1: 880, y: 1018};
export const PriceTag: React.FC<P> = ({g, s, fg}) => {
	const p = prog(g, s - 2, 12, E.outExpo);
	const hole = prog(g, s + 4, 8, E.outBack);
	const rp = prog(g, s, 13, E.outExpo);
	const head = lerp(RULER.x0, RULER.x1, rp);
	const ticks: React.ReactNode[] = [];
	for (let i = 0; i <= 50; i++) {
		const x = RULER.x0 + ((RULER.x1 - RULER.x0) * i) / 50;
		if (x > head + 0.5) break;
		const major = i % 10 === 0;
		const mid = i % 5 === 0;
		const grow = clamp((head - x) / 40);
		const h = (major ? 26 : mid ? 16 : 9) * E.outBack(grow);
		ticks.push(<line key={i} x1={x} y1={RULER.y} x2={x} y2={RULER.y + h} stroke={fg} strokeWidth={major ? 2.5 : 1.5} />);
	}
	return (
		<g>
			<DrawPath d={tagD} p={p} color={fg} width={3} />
			{hole > 0 ? <circle cx={TAG.x0 + 62} cy={WORD.cy} r={13 * hole} fill="none" stroke={fg} strokeWidth={3} /> : null}
			{rp > 0 ? <line x1={RULER.x0} y1={RULER.y} x2={head} y2={RULER.y} stroke={fg} strokeWidth={2.5} /> : null}
			{ticks}
			{rp > 0 ? <rect x={head - 5} y={RULER.y - 5} width={10} height={10} fill={fg} transform={`rotate(45 ${head} ${RULER.y})`} /> : null}
		</g>
	);
};

/* 3 回客：一個圓形箭頭（細線）繞一圈 */
const LOOP_R = 318;
export const LoopArrow: React.FC<P> = ({g, s, fg}) => {
	const p = prog(g, s - 2, 14, E.outCubic);
	if (p <= 0) return null;
	const a0 = -100; // 起點角度（度）
	const sweep = 330 * p;
	const pt = (deg: number, r = LOOP_R) => {
		const a = (deg * Math.PI) / 180;
		return [WORD.cx + Math.cos(a) * r, WORD.cy + Math.sin(a) * r];
	};
	const [sx, sy] = pt(a0);
	const [ex, ey] = pt(a0 + sweep);
	const large = sweep > 180 ? 1 : 0;
	const d = `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${LOOP_R} ${LOOP_R} 0 ${large} 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`;
	// 箭頭：沿切線方向
	const ah = ((a0 + sweep) * Math.PI) / 180;
	const tx = -Math.sin(ah);
	const ty = Math.cos(ah);
	const nx = Math.cos(ah);
	const ny = Math.sin(ah);
	const L = 26;
	const w = 15;
	const head = `${(ex - tx * L + nx * w).toFixed(1)},${(ey - ty * L + ny * w).toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)} ${(ex - tx * L - nx * w).toFixed(1)},${(ey - ty * L - ny * w).toFixed(1)}`;
	return (
		<g>
			<path d={d} fill="none" stroke={fg} strokeWidth={3} strokeLinecap="round" />
			<circle cx={sx} cy={sy} r={6} fill={fg} />
			{sweep > 8 ? <polyline points={head} fill="none" stroke={fg} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /> : null}
			<circle cx={ex} cy={ey} r={9} fill={C.accent} />
		</g>
	);
};

/* 4 團隊：5 個小圓點排成一列，逐個亮起 */
export const TeamDots: React.FC<P> = ({g, s, fg}) => {
	const y = 1036;
	const gap = 64;
	const line = prog(g, s - 1, 12, E.outExpo);
	return (
		<g>
			{line > 0 ? (
				<line x1={WORD.cx - gap * 2} y1={y} x2={lerp(WORD.cx - gap * 2, WORD.cx + gap * 2, line)} y2={y} stroke={alpha(fg, 0.35)} strokeWidth={2} />
			) : null}
			{[0, 1, 2, 3, 4].map((i) => {
				const x = WORD.cx + (i - 2) * gap;
				const ring = prog(g, s - 2 + i, 6, E.outBack);
				const on = prog(g, s + 1 + i * 2, 7, E.outBack);
				return (
					<g key={i}>
						{ring > 0 ? <circle cx={x} cy={y} r={14 * ring} fill={C.ink} stroke={alpha(fg, 0.5)} strokeWidth={2} /> : null}
						{on > 0 ? <circle cx={x} cy={y} r={14 * on} fill={C.accent} /> : null}
					</g>
				);
			})}
		</g>
	);
};

/* 5 品牌：字距從很開收攏（文字本身在 S5 處理），旁邊兩根對齊細線跟著收 */
// 第一格就在收（起點提前半格），但還看得到很開的字距
export const brandTracking = (g: number, s: number) => lerp(1.25, 0.02, prog(g, s - 0.5, 12, E.outExpo));
export const KernGuides: React.FC<P & {halfW: number}> = ({g, s, fg, halfW}) => {
	const op = 1 - prog(g, s + 9, 5, E.inOutSine) * 0.5;
	return (
		<g opacity={op}>
			{[-1, 1].map((dir) => {
				const x = WORD.cx + dir * (halfW + 26);
				return (
					<g key={dir}>
						<line x1={x} y1={WORD.cy - 150} x2={x} y2={WORD.cy + 150} stroke={fg} strokeWidth={2} />
						<line x1={x} y1={WORD.cy - 150} x2={x - dir * 18} y2={WORD.cy - 150} stroke={fg} strokeWidth={2} />
						<line x1={x} y1={WORD.cy + 150} x2={x - dir * 18} y2={WORD.cy + 150} stroke={fg} strokeWidth={2} />
					</g>
				);
			})}
		</g>
	);
};

/* 6 口碑：三圈同心細環往外擴 */
export const WordRings: React.FC<P> = ({g, s, fg}) => (
	<g>
		{[0, 1, 2].map((k) => (
			<Ring key={k} cx={WORD.cx} cy={WORD.cy} f={g} start={s - 3 + k * 3} dur={20} r0={190} r1={560} w0={3.5 - k * 0.6} color={fg} />
		))}
	</g>
);

/* 7 預約：月曆小格子一格一格打勾 */
const CAL = {cols: 7, rows: 2, cell: 46, gap: 8, y: 1000};
export const Calendar: React.FC<P> = ({g, s, fg}) => {
	const w = CAL.cols * CAL.cell + (CAL.cols - 1) * CAL.gap;
	const x0 = WORD.cx - w / 2;
	const frame = prog(g, s - 2, 8, E.outExpo);
	const cells: React.ReactNode[] = [];
	for (let r = 0; r < CAL.rows; r++)
		for (let c = 0; c < CAL.cols; c++) {
			const i = r * CAL.cols + c;
			const x = x0 + c * (CAL.cell + CAL.gap);
			const y = CAL.y + 18 + r * (CAL.cell + CAL.gap);
			const box = prog(g, s - 2 + i * 0.4, 6, E.outBack);
			const tk = prog(g, s + 1 + i, 4, E.outCubic);
			cells.push(
				<g key={i}>
					{box > 0 ? (
						<rect
							x={x + (CAL.cell / 2) * (1 - box)}
							y={y + (CAL.cell / 2) * (1 - box)}
							width={CAL.cell * box}
							height={CAL.cell * box}
							fill={tk > 0 ? alpha(C.accent, 0.16) : 'none'}
							stroke={alpha(fg, 0.45)}
							strokeWidth={1.5}
						/>
					) : null}
					{tk > 0 ? (
						<DrawPath
							d={`M ${x + 11} ${y + 24} L ${x + 20} ${y + 33} L ${x + 36} ${y + 13}`}
							p={tk}
							color={C.accent}
							width={4}
						/>
					) : null}
				</g>,
			);
		}
	return (
		<g>
			{frame > 0 ? (
				<g>
					<line x1={x0} y1={CAL.y} x2={lerp(x0, x0 + w, frame)} y2={CAL.y} stroke={fg} strokeWidth={3} />
					{[0.2, 0.8].map((k) =>
						frame >= k ? <line key={k} x1={x0 + w * k} y1={CAL.y - 10} x2={x0 + w * k} y2={CAL.y + 6} stroke={fg} strokeWidth={3} strokeLinecap="round" /> : null,
					)}
				</g>
			) : null}
			{cells}
		</g>
	);
};

/* 8 收入：從 1.4 倍砸下＋畫面震 6 格 */
// 整合修正：著地 1427 → 1426，配樂重擊在 1425，聲音只比畫面早 1 格（原本早 2 格）；1425 切進來那格仍在 1.24 倍往下砸
export const SLAM = {land: 1426, from: 1.4} as const;
export const slamScale = (f: number) => {
	// 刀的第一格（1425）就已經在加速往下砸，1426 著地
	const t = clamp((f - (SLAM.land - 3.5)) / 3.5);
	return lerp(SLAM.from, 1, E.inCubic(t));
};
const SHAKE: [number, number][] = [
	[14, -9],
	[-11, 7],
	[8, -6],
	[-6, 4],
	[3, -2],
	[-1, 1],
];
export const shakeAt = (f: number) => {
	const i = Math.floor(f) - SLAM.land;
	if (i < 0 || i >= SHAKE.length) return [0, 0];
	return SHAKE[i];
};

/* 等寬編號：`01 / 08`，兩側短線 */
export const CutTag: React.FC<{g: number; s: number; i: number; fg: string}> = ({g, s, i, fg}) => {
	const p = prog(g, s - 1, 8, E.outExpo);
	const txt = `${String(i + 1).padStart(2, '0')} / 08`;
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				width: 1080,
				top: TAG_Y - 16,
				height: 32,
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				gap: 18,
			}}
		>
			<div style={{width: 40 * p, height: 2, background: alpha(fg, 0.5)}} />
			<div style={{fontFamily: F.mono, fontSize: 22, lineHeight: '32px', color: alpha(fg, 0.7), letterSpacing: '0.12em', whiteSpace: 'pre'}}>{txt}</div>
			<div style={{width: 40 * p, height: 2, background: alpha(fg, 0.5)}} />
		</div>
	);
};
