// 60 秒〈字的雁陣〉S5／S6 用的小元件（只給 S5.tsx、S6.tsx 用）
import React from 'react';
import {DirBlur} from '../../../lib/components';
import {E, Ease, clamp, prog} from '../../../lib/motion';
import {C60} from '../../copy';
import {F, G} from '../../theme';
import {camera} from '../camera';
import {moveBlurXY} from './S1_parts';

/** DirBlur 的外框一律撐滿站框，開關模糊時字不會跳位 */
export const FULL: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: '100%', height: '100%'};

/** 站與站之間 1 拍移鏡時（每格位移上百 px），站內的字跟著帶方向模糊；停留慢漂、拉遠揭曉時不模糊。
 *  係數跟紋理（Texture.tsx）一致（moveBlurXY），字和紋理同一格糊得一樣多；拉遠揭曉最快那幾格也一起糊。 */
export const MoveBlur: React.FC<{f: number; children: React.ReactNode}> = ({f, children}) => {
	const b = moveBlurXY(f, camera(f).zoom);
	return (
		<DirBlur x={b.x} y={b.y} style={FULL}>
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

const SLIDE = 260; // ★ 從右側 260px 水平滑進（30 秒片的 ★ 是從上方落下；兩支不用同一個動作）
const STAR_DUR = 14;
const JUMP = 70; // drop（f1414）時 ★ 被撐開的 4.9 彈起的高度

/** 主角列：4.9 ¹ ★
 *  ① 到站後第 2 拍（appearAt）4.9 先以字寬 50% 的窄字浮上來（看得到的東西被撐開才有物理感）；
 *  ② 拍點前 16 格開始往內吸（50→44%，像彈簧上緊）→ 拍點前 4 格放開，最寬 158% 那一格＝hit，再 20 格回到 150%
 *     （④字寬伸展，全片唯一）；¹ 掛在右上角跟著右緣走；
 *  ③ ★ 一拍後從右側水平滑進（outBack：第一次碰到位那格＝starHit，過衝轉成橫向壓扁）；
 *  ④ 小節 11 濾波上揚（build→drop）：字寬一路吸到 128%、★ 被壓扁到 90%（蓄力）；
 *     drop 那拍 3 格撐到 162%（最用力那格＝drop），★ 被彈起 70px、在 land 落地壓扁；之後 20 格回到 150%；
 *  ⑤ 小節 12 其餘三拍往外撐（150→156%），跟著 sidechain 推出去。 */
export const RatingRow: React.FC<{
	f: number;
	x: number;
	y: number;
	appearAt: number; // 窄字浮上來的格（拍點前 3 格）
	hit: number; // 撐到最寬那一格（拍點）
	starHit: number; // ★ 第一次碰到位那格（拍點）
	build: number; // 蓄力起點（小節 11 第 3 拍）
	drop: number; // drop 拍點（小節 12 正拍）
	land: number; // ★ 彈起後落地（小節 12 第 2 拍）
	pumps: readonly number[]; // 小節 12 其餘拍點（往外撐）
}> = ({f, x, y, appearAt, hit, starHit, build, drop, land, pumps}) => {
	const width = (ff: number) => {
		let w = 50 - 6 * prog(ff, hit - 16, 12, E.inCubic) + 114 * prog(ff, hit - 4, 4, E.outCubic) - 8 * prog(ff, hit, 20, E.outBack);
		w += -22 * prog(ff, build, drop - 3 - build, E.inCubic) + 34 * prog(ff, drop - 3, 3, E.outExpo) - 12 * prog(ff, drop, 20, E.outBack);
		let push = 0;
		for (const b of pumps) push = Math.max(push, prog(ff, b - 2, 2, E.outCubic) * (1 - prog(ff, b, 24, E.inOutSine)));
		return w + 6 * push;
	};
	const s = width(f);
	// 右緣速度（px／格）→ 橫向模糊；只在撐開那幾格明顯
	const edgeV = (width(f + 0.5) - width(f - 0.5)) * 0.0138 * NUM;
	const numOp = clamp((f - appearAt + 1) / 4);
	const numY = 30 * (1 - prog(f, appearAt, 14, E.outExpo));
	const noteOp = clamp((f - (hit - 3)) / 3);

	// ★ 從右側滑進
	const t0 = starHit - hitT(E.outBack) * STAR_DUR;
	const raw = (ff: number) => E.outBack(clamp((ff - t0) / STAR_DUR));
	const slideX = (ff: number) => SLIDE * (1 - Math.min(1, raw(ff)));
	const over = Math.max(0, raw(f) - 1); // 0 → 0.098：碰到位的過衝轉成橫向壓扁
	// drop：蓄力壓扁 → 彈起（拋物線）→ 落地壓扁
	const jumpY = (ff: number) => {
		const t = (ff - (drop - 1)) / (land - (drop - 1));
		return t > 0 && t < 1 ? -JUMP * 4 * t * (1 - t) : 0;
	};
	const squeeze = 0.1 * prog(f, build, drop - 3 - build, E.inCubic) * (1 - prog(f, drop - 3, 3, E.outExpo));
	const landSq = f >= land ? 1 - prog(f, land, 10, E.outCubic) : 0;
	const sx = 1 - over * 1.1 + 0.1 * landSq + 0.05 * squeeze;
	const sy = 1 + over * 0.7 - 0.14 * landSq - squeeze;
	const vx = slideX(f + 0.5) - slideX(f - 0.5);
	const vy = jumpY(f + 0.5) - jumpY(f - 0.5);
	const starOp = clamp((f - t0 + 1) / 2);

	if (numOp <= 0) return null;
	return (
		<DirBlur x={Math.abs(edgeV) * 0.1} style={FULL}>
			<div style={{position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'flex-start', whiteSpace: 'pre', color: G.ink}}>
				<span
					style={{
						fontFamily: F.num,
						fontWeight: 900,
						fontSize: NUM,
						fontStretch: `${s.toFixed(2)}%`,
						lineHeight: 1,
						opacity: numOp,
						transform: numY > 0.05 ? `translateY(${numY.toFixed(2)}px)` : undefined,
					}}
				>
					{C60.S5.num}
				</span>
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
					<DirBlur x={Math.abs(vx) * 0.13} y={Math.abs(vy) * 0.15} style={{marginLeft: STAR_ML, marginTop: ROW.baseline - STAR * 0.943}}>
						<span
							style={{
								display: 'block',
								fontFamily: F.round,
								fontWeight: 900,
								fontSize: STAR,
								lineHeight: 1,
								opacity: starOp,
								transformOrigin: '50% 94.3%',
								transform: `translate(${slideX(f).toFixed(2)}px, ${jumpY(f).toFixed(2)}px) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`,
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
