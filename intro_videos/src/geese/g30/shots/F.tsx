// 30 秒〈一格一位〉鏡頭 F・從頭到尾（小節 7–8，f675–900）
// f675 硬切：一個閉合的高直排墨框（價目表的一格，不出血、有頭有尾）從上緣往下伸到底（硬切那格正在最快）＝一次燙染。
// 「設計師」小框在硬切那格還在 E 的老位置（句子裡「設計師」的正下方），立刻跳進框頂、同時放大成框裡的主角；
// 之後每一拍往下走一階（拍前 1 格起跑，最快那格在拍上），框裡的字有慣性；最後一拍落到框底、彈一下，
// 接 f876–899 跟配樂一起吸一口氣。框右側上下「從頭」「到尾」；第 8 小節正拍左邊兩欄直排由上往下寫出來。
import React from 'react';
import {E, clamp, lerp} from '../../../lib/motion';
import {C30} from '../../copy';
import {G} from '../../theme';
import {SH, ShotProps, bar30} from '../kit';
import {PaperFast, ring} from './A_parts';
import {TAG_E6} from './E_parts';
import {Blur, TAG, TagBox, VCol, vColH, vel} from './F_parts';

const T0 = SH.F.from; // 675
const BOX = {x: 390, y: 270, w: 300, bottom: 1248, b: 10}; // 閉合的長框（閱讀窗的上下緣）
const BIG = {w: 200, h: 520, size: 96, border: 10}; // 跳進框裡之後的「設計師」
const TAG_X = BOX.x + (BOX.w - BIG.w) / 2; // 440：框裡正中
const Y_TOP = BOX.y + 20; // 290：小框起點（上緣）
const Y_BOT = BOX.bottom - BOX.b - BIG.h; // 720：小框終點（下緣貼框底）
const LAB = {x: 720, size: 140};
const TOP_Y = Y_TOP;
const BOT_Y = BOX.bottom - BOX.b - vColH(C30.F.bottom, LAB.size); // 「到尾」跟框底對齊
const BEAT2 = bar30(7, 2); // 703：「到尾」落位
const STEPS = [bar30(7, 3), bar30(7, 4), bar30(8, 1), bar30(8, 2), bar30(8, 3), bar30(8, 4)]; // 731…872：每拍往下一階
const LINE_AT = bar30(8, 1); // 788
const LAND = STEPS[STEPS.length - 1];
const SENT = {size: 60, x: 268, pitch: 90, y: 560}; // 左邊兩欄直排（欄距 0.5em）
const CREEP = LAND + 6 - BEAT2; // 175px：等速下移的總量（其餘 255px 分 6 拍走）

/** 長框下緣：提前 4 格起跑（outQuart），硬切那格已伸到一半、還在最快的段落 */
const railBottom = (f: number) => lerp(BOX.y + BOX.b, BOX.bottom, E.outQuart(clamp((f - (T0 - 4)) / 28)));

/** 硬切起：從 E 的位置跳進框頂（拍前 1 格起跑）。橫向與放大先甩（outExpo），縱向 outQuart */
const JUMP = 24;
const jumpP = (f: number) => E.outQuart(clamp((f - (T0 + 1)) / JUMP));
const grow = (f: number) => E.outExpo(clamp((f - (T0 - 1)) / 20));
const tagX = (f: number) => lerp(TAG_E6.x, TAG_X, grow(f));

/** 小框的位置（上緣 y） */
const tagY = (f: number) => {
	if (f < BEAT2) {
		const p = jumpP(f);
		// 進框後落定：多沉一點再彈回
		return lerp(TAG_E6.y, Y_TOP, p) + 12 * ring(f - (T0 + 1 + JUMP * 0.7), 0.4, 6);
	}
	// 每格等速往下 1px（整數像素，不會固定幾格停一下），到 f878 停（接配樂吸氣）；
	// 再加上每拍一階（拍前 1 格起跑，outExpo 12 格：走得最快的那格落在拍上）
	const creep = clamp(f - BEAT2, 0, CREEP);
	let stair = 0;
	for (const b of STEPS) stair += E.outExpo(clamp((f - (b - 1)) / 12)) / STEPS.length;
	// 落底：多沉一點再彈回
	const land = 14 * ring(f - (LAND + 2), 0.42, 6);
	return Y_TOP + creep + (Y_BOT - Y_TOP - CREEP) * stair + land;
};

export const F: React.FC<ShotProps> = ({f}) => {
	const bot = railBottom(f);
	const vb = vel(railBottom, f);
	const ty = tagY(f);
	const tx = tagX(f);
	const g = grow(f);
	const tw = lerp(TAG.w, BIG.w, g);
	const th = lerp(TAG.h, BIG.h, g);
	// 框裡的字：慣性（落後 2.5 格的位置差）
	const lag = clamp((tagY(f - 2.5) - ty) * 0.45, -22, 22);
	const tv = vel(tagY, f);
	const tvx = vel(tagX, f);

	// 「從頭」：跟著長框一起掉下來；「到尾」：拍 2 落位
	const lab = (at: number, ff: number) => -70 * (1 - E.outExpo(clamp((ff - at) / 14)));
	const topOff = (ff: number) => lab(T0 - 3, ff);
	const botOff = (ff: number) => lab(BEAT2 - 3, ff);

	// 左邊兩欄：由上往下寫出來（第二欄晚 3 格）
	const col = (k: number) => E.outExpo(clamp((f - (LINE_AT - 3 + k * 3)) / 14));
	const [c1, c2] = C30.F.line.replace('，', '，\n').split('\n');

	// 全程：標籤跟左欄反向等速微漂（視差，不是移鏡）
	const drift = clamp((f - T0) / (SH.F.to - T0));
	const labW = LAB.size * 1.1;

	return (
		<>
			<PaperFast />
			{/* 長框：上緣＋兩根直線＋往下伸的下緣（只有下緣帶模糊） */}
			<div style={{position: 'absolute', left: BOX.x, top: BOX.y, width: BOX.w, height: BOX.b, background: G.ink}} />
			<div style={{position: 'absolute', left: BOX.x, top: BOX.y, width: BOX.b, height: Math.max(0, bot - BOX.y), background: G.ink}} />
			<div style={{position: 'absolute', left: BOX.x + BOX.w - BOX.b, top: BOX.y, width: BOX.b, height: Math.max(0, bot - BOX.y), background: G.ink}} />
			<Blur y={Math.min(4, Math.abs(vb) * 0.05)} w={BOX.w} h={BOX.b} style={{position: 'absolute', left: BOX.x, top: bot - BOX.b, width: BOX.w, height: BOX.b}}>
				<div style={{width: '100%', height: '100%', background: G.ink}} />
			</Blur>

			{/* 從頭／到尾（框右側上下兩端） */}
			<div style={{position: 'absolute', inset: 0, transform: `translateY(${(drift * -10).toFixed(2)}px)`}}>
				<Blur y={Math.abs(vel(topOff, f)) * 0.2} w={labW} h={vColH(C30.F.top, LAB.size)} style={{position: 'absolute', left: LAB.x, top: TOP_Y + topOff(f)}}>
					<VCol text={C30.F.top} x={0} y={0} size={LAB.size} style={{position: 'relative'}} />
				</Blur>
				{f >= BEAT2 - 3 ? (
					<Blur y={Math.abs(vel(botOff, f)) * 0.2} w={labW} h={vColH(C30.F.bottom, LAB.size)} style={{position: 'absolute', left: LAB.x, top: BOT_Y + botOff(f)}}>
						<VCol text={C30.F.bottom} x={0} y={0} size={LAB.size} style={{position: 'relative'}} />
					</Blur>
				) : null}
			</div>

			{/* 左邊：從頭到尾，設計師自己操作。（兩欄直排，由上往下寫出） */}
			{f >= LINE_AT - 3 ? (
				<div style={{position: 'absolute', inset: 0, transform: `translateY(${(drift * 10).toFixed(2)}px)`}}>
					{[c1, c2].map((t, k) => {
						const p = col(k);
						return (
							<VCol
								key={k}
								text={t}
								x={SENT.x - k * SENT.pitch}
								y={SENT.y - (1 - p) * 24}
								size={SENT.size}
								weight={500}
								style={{clipPath: `inset(0 0 ${((1 - p) * 100).toFixed(2)}% 0)`}}
							/>
						);
					})}
				</div>
			) : null}

			{/* 設計師：跳進框、放大，之後每拍往下一階 */}
			<Blur x={Math.min(12, Math.abs(tvx) * 0.2)} y={Math.min(12, Math.abs(tv) * 0.2)} w={tw} h={th} style={{position: 'absolute', left: tx, top: ty, width: tw, height: th}}>
				<TagBox x={0} y={0} w={tw} h={th} size={lerp(56, BIG.size, g)} border={lerp(8, BIG.border, g)} lag={lag} />
			</Blur>
		</>
	);
};
