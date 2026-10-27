// 30 秒〈一格一位〉鏡頭 G・評論（小節 9–10，f900–1125）
// f900 硬切（旋律進來）：「4.9」直排三段（4／．／9）疊成一根巨柱，上下裁出畫面；Anybody 可變字寬從寬擠到最窄 50%（硬切那格正在擠）。
// 拍 2（f928）：「★」從上方掉下來（outBack），落在 4.9 右上方。
// 第 10 小節正拍：巨柱收回閱讀窗——4 留在左上、9 從底下甩上來接在右邊，橫排成約 360px 高的「4.9」；
// ★ 縮小飛進下面那行「Google 4.9★」的最後一格；拍 2 第二行「2,400+ 則評論（2026.09）」。
import React from 'react';
import {E, clamp, lerp} from '../../../lib/motion';
import {C30} from '../../copy';
import {F, G as COL} from '../../theme';
import {SH, ShotProps, bar30} from '../kit';
import {PaperFast} from './A_parts';
import {Blur, vel} from './F_parts';

const T0 = SH.G.from; // 900
const STAR_AT = bar30(9, 2); // 928
const FOLD_AT = bar30(10, 1); // 1013
const L2_AT = bar30(10, 2); // 1041

// Anybody 900、字寬 50% 的量測（em）：墨的上緣 0.100、數字中心 0.4385、小數點中心 0.714；「4.9」總寬 0.957
const CAP_TOP = 0.1;
const CY_EM = [0.4385, 0.714, 0.4395];
const X_EM = [0.2, 0.4945, 0.7735]; // 墨的水平中心（從字串起點量）
const ADV = 0.957;
const CH = Array.from(C30.G.num); // ['4', '.', '9']

// 直排巨柱
const SZ = 1350;
const STACK_CX = 335;
const STACK_CY = [362, 960, 1558];
// 收回後（橫排）
const FS = 530; // 字高約 359px
const FIN_X0 = 485 - (ADV * FS) / 2;
const FIN_TOP = 455;
const FIN_CX = X_EM.map((x) => FIN_X0 + x * FS);
const FIN_CY = CY_EM.map((c) => FIN_TOP + (c - CAP_TOP) * FS);
// 下面兩行：靠左對齊在 4 的左緣（齊頭）
const XL = Math.round(FIN_X0 + 0.005 * FS);
const L1_TEXT_W = 282; // 「Google 4.9」（圓體 56＋Anybody 60% 64）的排版寬（算圖量測），★ 接在後面
const L1 = {top: FIN_TOP + 0.677 * FS + 58, size: 56, h: 72};
const L2 = {top: L1.top + L1.h + 16, h: 84};
// ★
const STAR = {size: 300, cx: 738, cy: 430};
const STAR_FIN = {cx: XL + L1_TEXT_W + L1.size / 2, cy: L1.top + L1.h / 2 + 1};

/** 單一數字（以墨的中心定位）。縮放直接換字級算，不用 transform：元件跟模糊範圍都跟著變小（效能） */
const Num: React.FC<{ch: string; cx: number; cy: number; cyEm: number; size: number; stretch: number; sy?: number; blur?: {x: number; y: number}}> = ({
	ch,
	cx,
	cy,
	cyEm,
	size,
	stretch,
	sy = 1,
	blur,
}) => {
	const w = size * 1.1;
	const box: React.CSSProperties = {position: 'absolute', left: cx - w / 2, top: cy - cyEm * size, width: w, height: size};
	const el = (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				textAlign: 'center',
				fontFamily: F.num,
				fontWeight: 900,
				fontStretch: `${stretch.toFixed(2)}%`,
				fontSize: size,
				lineHeight: `${size}px`,
				color: COL.ink,
				whiteSpace: 'pre',
				transform: sy !== 1 ? `scale(${(1 / Math.sqrt(sy)).toFixed(4)}, ${sy.toFixed(4)})` : undefined,
				transformOrigin: `${w / 2}px ${cyEm * size}px`,
			}}
		>
			{ch}
		</div>
	);
	if (!blur || (Math.abs(blur.x) < 0.25 && Math.abs(blur.y) < 0.25)) return <div style={box}>{el}</div>;
	return (
		<Blur x={blur.x} y={blur.y} w={w} h={size} style={box}>
			{el}
		</Blur>
	);
};

const Star: React.FC<{cx: number; cy: number; scale: number; rot: number; blur?: {x: number; y: number}}> = ({cx, cy, scale, rot, blur}) => {
	const s = STAR.size;
	const box: React.CSSProperties = {position: 'absolute', left: cx - s / 2, top: cy - s / 2, width: s, height: s};
	const el = (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				textAlign: 'center',
				fontFamily: F.round,
				fontWeight: 900,
				fontSize: s,
				lineHeight: `${s}px`,
				color: COL.ink,
				transform: `rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(5)})`,
			}}
		>
			{C30.G.star}
		</div>
	);
	return blur ? (
		<Blur x={blur.x} y={blur.y} w={s} h={s} style={box}>
			{el}
		</Blur>
	) : (
		<div style={box}>{el}</div>
	);
};

/** 數字段用 Anybody 窄體、其他用圓體 */
const splitNum = (s: string) => s.split(/([0-9][0-9.,+]*)/).filter((x) => x.length > 0);
const isNum = (s: string) => /^[0-9]/.test(s);

export const G: React.FC<ShotProps> = ({f}) => {
	// 硬切起：每個字從寬擠到 50%（錯 2 格）
	const stretch = (i: number) => 50 + 42 * (1 - E.outExpo(clamp((f - (T0 - 3 + i * 2)) / 18)));
	// 巨柱慢慢往下沉
	const sink = (ff: number) => 26 * E.inOutSine(clamp((ff - (T0 + 6)) / (FOLD_AT - T0 - 6)));
	// 收回：4 先、小數點晚 2 格、9 晚 4 格（拍前 3 格起跑）
	const fold = (i: number, ff: number) => E.outExpo(clamp((ff - (FOLD_AT - 3 + i * 2)) / (14 + i * 2)));
	const posOf = (i: number, ff: number) => {
		const p = fold(i, ff);
		return {x: lerp(STACK_CX, FIN_CX[i], p), y: lerp(STACK_CY[i] + sink(ff), FIN_CY[i], p), s: lerp(1, FS / SZ, p)};
	};
	// 收好之後：數字往上、兩行往下，反向微漂（＋數字慢推）
	// （等速慢漂：收好後一路推到硬切，不在結尾減速停住）
	const after = clamp((f - (FOLD_AT + 14)) / (SH.G.to - FOLD_AT - 14));

	// 收好之後：整組 4.9 以左緣中點慢推 1→1.03（定格也不死；左緣不動，齊頭對齊不跑掉）
	const push = 1 + 0.03 * after;
	const GC = {x: XL, y: FIN_TOP + (0.677 * FS) / 2};
	const nums = CH.map((ch, i) => {
		const q = posOf(i, f);
		const vx = posOf(i, f + 0.5).x - posOf(i, f - 0.5).x;
		const vy = posOf(i, f + 0.5).y - posOf(i, f - 0.5).y;
		// 收回時甩得快：沿運動方向拉長（擠壓伸展）代替模糊（巨字整塊高斯模糊一格要 1 秒以上）
		const sp = Math.hypot(vx, vy);
		const sy = 1 + Math.min(0.16, sp * 0.0035);
		return (
			<Num
				key={i}
				ch={ch}
				cx={GC.x + (q.x - GC.x) * push}
				cy={GC.y + (q.y - GC.y) * push - after * 10}
				cyEm={CY_EM[i]}
				size={SZ * q.s * push}
				stretch={stretch(i)}
				sy={sy}
			/>
		);
	});

	// ★：拍 2 落下（outBack，拍前 6 格起跑：第一次碰到落點那格在拍上），收回時飛進第一行的最後一格
	const starDrop = (ff: number) => E.outBack(clamp((ff - (STAR_AT - 6)) / 16));
	const starFly = (ff: number) => E.outExpo(clamp((ff - (FOLD_AT + 1)) / 16));
	const starPos = (ff: number) => {
		const d = starDrop(ff);
		const k = starFly(ff);
		return {
			x: lerp(STAR.cx, STAR_FIN.cx, k),
			y: lerp(lerp(-260, STAR.cy, d), STAR_FIN.cy + after * 12, k),
			s: lerp(1, L1.size / STAR.size, k),
			r: lerp(-28, 0, d) + 7 * E.inOutSine(clamp((ff - STAR_AT) / (FOLD_AT - STAR_AT))) * (1 - k),
		};
	};
	const sp = starPos(f);
	const svx = starPos(f + 0.5).x - starPos(f - 0.5).x;
	const svy = starPos(f + 0.5).y - starPos(f - 0.5).y;
	const starLanded = starFly(f) >= 1;

	// 兩行字：上升 24px（outExpo 12 格）
	const rise = (at: number) => (1 - E.outExpo(clamp((f - at) / 12))) * 24;
	const l1At = FOLD_AT + 8; // 等 9 甩過去再出來
	const l2At = L2_AT - 3;
	const lineText = C30.G.line.slice(0, -C30.G.star.length); // 「Google 4.9」（★ 由飛進來的那顆補上）

	return (
		<>
			<PaperFast />
			{nums}
			{f >= l1At ? (
				<div
					lang="zh-Hant-TW"
					style={{
						position: 'absolute',
						left: XL,
						top: L1.top + rise(l1At) + after * 12,
						height: L1.h,
						display: 'flex',
						alignItems: 'baseline',
												color: COL.ink,
						whiteSpace: 'pre',
						lineHeight: `${L1.h}px`,
					}}
				>
					{splitNum(lineText).map((t, i) =>
						isNum(t) ? (
							<span key={i} style={{fontFamily: F.num, fontWeight: 900, fontStretch: '60%', fontSize: 64}}>
								{t}
							</span>
						) : (
							<span key={i} style={{fontFamily: F.round, fontWeight: 900, fontSize: L1.size}}>
								{t}
							</span>
						),
					)}
					<span style={{fontFamily: F.round, fontWeight: 900, fontSize: L1.size, opacity: starLanded ? 1 : 0}}>{C30.G.star}</span>
				</div>
			) : null}
			{f >= l2At ? (
				<div
					lang="zh-Hant-TW"
					style={{
						position: 'absolute',
						left: XL,
						top: L2.top + rise(l2At) + after * 12,
						height: L2.h,
						display: 'flex',
						alignItems: 'baseline',
												color: COL.ink,
						whiteSpace: 'pre',
						lineHeight: `${L2.h}px`,
					}}
				>
					{splitNum(C30.G.count).map((t, i) =>
						isNum(t) ? (
							// 評論數 64；括號裡的查詢日期是註記，跟旁邊的字一樣 48（主從）
							<span key={i} style={{fontFamily: F.num, fontWeight: 900, fontStretch: '55%', fontSize: i === 0 ? 64 : 48}}>
								{t}
							</span>
						) : (
							<span key={i} style={{fontFamily: F.round, fontWeight: 500, fontSize: 48}}>
								{t}
							</span>
						),
					)}
				</div>
			) : null}
			{f >= STAR_AT - 6 && !starLanded ? (
				<Star cx={sp.x} cy={sp.y} scale={sp.s} rot={sp.r} blur={{x: Math.min(12, Math.abs(svx) * 0.12), y: Math.min(16, Math.abs(svy) * 0.14)}} />
			) : null}
		</>
	);
};
