// 60 秒〈字的雁陣〉S5／S6 用的小元件（只給 S5.tsx、S6.tsx 用）
import React from 'react';
import {DirBlur} from '../../../lib/components';
import {E, Ease, clamp, prog} from '../../../lib/motion';
import {C60} from '../../copy';
import {F, G} from '../../theme';
import {camVelocity} from '../camera';
import {ST} from '../timeline';
import {stretchPct} from '../kit';

/** DirBlur 的外框一律撐滿站框，開關模糊時字不會跳位 */
export const FULL: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: '100%', height: '100%'};

/** 站與站之間 1 拍移鏡時（每格位移上百 px），站內的字跟著帶方向模糊；停留慢漂、拉遠揭曉時不模糊 */
export const MoveBlur: React.FC<{f: number; children: React.ReactNode}> = ({f, children}) => {
	const v = f < ST.REVEAL.from - 20 ? camVelocity(f) : {vx: 0, vy: 0};
	return (
		<DirBlur x={Math.abs(v.vx) * 0.09} y={Math.abs(v.vy) * 0.09} style={FULL}>
			{children}
		</DirBlur>
	);
};

/** ease 第一次到達 1 的 t（outBack 約 0.369）：用來讓「第一次撞到位」那一格對準拍點 */
export const hitT = (ease: Ease) => {
	let lo = 0;
	let hi = 1;
	for (let i = 0; i < 40; i++) {
		const m = (lo + hi) / 2;
		if (ease(m) < 1) lo = m;
		else hi = m;
	}
	return hi;
};

/* ------------------------------------------------------------------ */
/* S5 主角列：4.9 ¹ ★                                                     */
/* 字的量測（Anybody 900，單位 em，lineHeight 1）：                         */
/*   數字頂 0.0967、基線 0.783；字寬 150% 時「4.9」前進寬 2.337、墨右緣 2.28；  */
/*   前進寬隨字寬約成線性（50% 時 0.957）。                                  */
/*   ¹（Anybody 900、字寬 100%）：墨 0.027–0.354、前進寬 0.38、墨頂 0.0967。  */
/*   ★（Chiron 900）：墨 0.04–0.96、墨頂 0.063、墨底 0.943。                 */
/* ------------------------------------------------------------------ */
export const NUM = 240; // 4.9 字級：撐到 150% 後墨寬 ≈ 547px（約畫寬 51%）
export const NOTE = 140; // ¹ 字級：字形本身就是上標，墨高 ≈ 42px
export const STAR = 130; // ★ 字級：墨高 ≈ 114px（數字高的 7 成），站在數字同一條基線上
const NOTE_ML = -5.5; // 9 的墨右緣 → ¹ 墨左緣 ≈ 12px
const STAR_ML = -1; // ¹ 墨右緣 → ★ 墨左緣 ≈ 8px
export const ROW = {
	digitTop: NUM * 0.0967,
	baseline: NUM * 0.783,
	inkLeft: NUM * 0.0367,
	// ★ 墨右緣（相對列的左緣，字寬 150% 停好時）
	starRight: NUM * 2.337 + NOTE_ML + NOTE * 0.38 + STAR_ML + STAR * 0.96,
} as const;

const DROP = 200; // ★ 從上方 200px 落下
const STAR_DUR = 16;

/** 主角列：4.9 從字寬 50% 撐到 150%（④字寬伸展，全片唯一），¹ 掛在右上角被撐開的右緣帶著走；
 *  ★ 一拍後從上方落下站上同一條基線（outBack：第一次碰地那格＝拍點，過衝的部分轉成落地壓扁）；
 *  小節 12 每拍「吸一口」：拍點那格字寬縮到 142%，再用一拍慢慢鼓回 150%（像 house 的 sidechain），¹ 和 ★ 跟著右緣被拉回、推出。 */
export const RatingRow: React.FC<{
	f: number;
	x: number;
	y: number;
	stretchAt: number; // 字寬伸展起跑格（拍點前 3 格）
	starHit: number; // ★ 碰地那格（拍點）
	pumps: readonly number[]; // 小節 12 的四個拍點
}> = ({f, x, y, stretchAt, starHit, pumps}) => {
	const width = (ff: number) => {
		const base = stretchPct(ff, stretchAt, 16);
		let duck = 0;
		for (const b of pumps) duck = Math.max(duck, prog(ff, b - 2, 2, E.outCubic) * (1 - prog(ff, b, 24, E.inOutSine)));
		return base - 8 * duck;
	};
	const s = width(f);
	// 右緣速度（px／格）→ 橫向模糊；只在撐開那幾格明顯
	const edgeV = (width(f + 0.5) - width(f - 0.5)) * 0.0138 * NUM;
	const numOp = clamp((f - (stretchAt - 1)) / 2);
	const noteOp = clamp((f - (stretchAt + 2)) / 3);

	// ★ 落下
	const t0 = starHit - hitT(E.outBack) * STAR_DUR;
	const raw = (ff: number) => E.outBack(clamp((ff - t0) / STAR_DUR));
	const starY = (ff: number) => -DROP * (1 - Math.min(1, raw(ff)));
	const over = Math.max(0, raw(f) - 1); // 0 → 0.098
	const vy = starY(f + 0.5) - starY(f - 0.5);
	const starOp = clamp((f - t0 + 1) / 2);

	if (numOp <= 0) return null;
	return (
		<DirBlur x={Math.abs(edgeV) * 0.1} style={FULL}>
			<div style={{position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'flex-start', whiteSpace: 'pre', color: G.ink}}>
				<span style={{fontFamily: F.num, fontWeight: 900, fontSize: NUM, fontStretch: `${s.toFixed(2)}%`, lineHeight: 1, opacity: numOp}}>{C60.S5.num}</span>
				<span
					style={{
						fontFamily: F.num,
						fontWeight: 900,
						fontSize: NOTE,
						lineHeight: 1,
						marginLeft: NOTE_ML,
						marginTop: ROW.digitTop - NOTE * 0.0967,
						opacity: noteOp,
					}}
				>
					{C60.S5.note}
				</span>
				{f >= t0 - 1 ? (
					<DirBlur y={Math.abs(vy) * 0.15} style={{marginLeft: STAR_ML, marginTop: ROW.baseline - STAR * 0.943}}>
						<span
							style={{
								display: 'block',
								fontFamily: F.round,
								fontWeight: 900,
								fontSize: STAR,
								lineHeight: 1,
								opacity: starOp,
								transformOrigin: '50% 94.3%',
								transform: `translateY(${starY(f).toFixed(2)}px) scale(${(1 + over * 0.7).toFixed(4)}, ${(1 - over * 1.1).toFixed(4)})`,
							}}
						>
							{C60.S5.star}
						</span>
					</DirBlur>
				) : null}
			</div>
		</DirBlur>
	);
};
