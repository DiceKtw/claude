// 30 秒〈一格一位〉鏡頭 F・從頭到尾（小節 7–8，f675–900）
// f675 硬切：一根直排長墨框從畫面上緣往下伸到下緣（硬切那格正在最快）＝一次燙染；
// 框頂「從頭」、框底「到尾」；「設計師」小框在硬切那格還在 E 的老位置（右下），
// 立刻離開崗位、拋物線跳進長框頂端，接著沿長框一路往下走：
// 整體 inOutSine，每拍被拽一下（頓挫），框裡的字有慣性；第 8 小節正拍左邊兩欄直排由上往下寫出來；
// 最後一拍小框落到底、彈一下。
import React from 'react';
import {E, clamp, lerp} from '../../../lib/motion';
import {C30} from '../../copy';
import {G} from '../../theme';
import {SH, ShotProps, bar30} from '../kit';
import {PaperFast, ring} from './A_parts';
import {TAG as E_TAG} from './E_parts';
import {Blur, TAG, TagBox, VCol, vColH, vel} from './F_parts';

const T0 = SH.F.from; // 675
const RAIL = {x: 420, w: 140, b: 10}; // 長框
const TAG_X = RAIL.x + (RAIL.w - TAG.w) / 2; // 小框在長框正中
const Y_TOP = 290; // 小框起點（上緣）
const Y_BOT = 960; // 小框終點（下緣 1240，閱讀窗內）
const LAB = {x: 592, size: 112};
const TOP_Y = Y_TOP;
const BOT_Y = Y_BOT + TAG.h - vColH(C30.F.bottom, LAB.size); // 「到尾」跟小框終點底部對齊
const BEAT2 = bar30(7, 2); // 703：「到尾」落位
const STEPS = [bar30(7, 3), bar30(7, 4), bar30(8, 1), bar30(8, 2), bar30(8, 3), bar30(8, 4)]; // 731…872：每拍拽一下
const LINE_AT = bar30(8, 1); // 788
const LAND = STEPS[STEPS.length - 1];

/** 長框下緣：提前 4 格起跑（outQuart），硬切那格已伸到一半、還在最快的段落 */
const railBottom = (f: number) => lerp(-20, 1940, E.outQuart(clamp((f - (T0 - 4)) / 28)));

/** 硬切起：從 E 的常駐位置跳進長框頂端（拍前 1 格起跑）。橫向先甩（outExpo），縱向晚 2 格（outQuart），路徑不壓到「從頭」 */
const JUMP = 24;
const jumpP = (f: number) => E.outQuart(clamp((f - (T0 + 1)) / JUMP));
const tagX = (f: number) => lerp(E_TAG.x, TAG_X, E.outExpo(clamp((f - (T0 - 1)) / 20)));

/** 小框的位置（上緣 y） */
const tagY = (f: number) => {
	if (f < BEAT2) {
		const p = jumpP(f);
		// 進框後落定：多沉一點再彈回
		return lerp(E_TAG.y, Y_TOP, p) + 12 * ring(f - (T0 + 1 + JUMP * 0.7), 0.4, 6);
	}
	// 整體 inOutSine ＋ 每拍頓挫（拍前 1 格起跑，outExpo 12 格：拽得最快的那格落在拍上）
	const smooth = E.inOutSine(clamp((f - BEAT2) / (LAND + 6 - BEAT2)));
	let stair = 0;
	for (const b of STEPS) stair += E.outExpo(clamp((f - (b - 1)) / 12)) / STEPS.length;
	const u = 0.5 * smooth + 0.5 * stair;
	// 落底：多沉一點再彈回
	const land = 14 * ring(f - (LAND + 2), 0.42, 6);
	return Y_TOP + (Y_BOT - Y_TOP) * u + land;
};

export const F: React.FC<ShotProps> = ({f}) => {
	const bot = railBottom(f);
	const vb = vel(railBottom, f);
	const ty = tagY(f);
	const tx = tagX(f);
	// 框裡的字：慣性（落後 2.5 格的位置差）
	const lag = clamp((tagY(f - 2.5) - ty) * 0.45, -18, 18);
	const tv = vel(tagY, f);
	const tvx = vel(tagX, f);

	// 「從頭」：跟著長框一起掉下來；「到尾」：拍 2 落位
	const lab = (at: number, ff: number) => -70 * (1 - E.outExpo(clamp((ff - at) / 14)));
	const topOff = (ff: number) => lab(T0 - 3, ff);
	const botOff = (ff: number) => lab(BEAT2 - 3, ff);

	// 左邊兩欄：由上往下寫出來（第二欄晚 3 格）
	const col = (k: number) => E.outExpo(clamp((f - (LINE_AT - 3 + k * 3)) / 14));
	const [c1, c2] = C30.F.line.replace('，', '，\n').split('\n');

	// 全程：標籤跟左欄反向微漂（視差，不是移鏡）
	const drift = E.inOutSine(clamp((f - T0) / (SH.F.to - T0)));

	return (
		<>
			<PaperFast />
			{/* 長框：兩根直線＋往下伸的下緣（只有下緣帶模糊） */}
			<div style={{position: 'absolute', left: RAIL.x, top: 0, width: RAIL.b, height: Math.max(0, bot), background: G.ink}} />
			<div style={{position: 'absolute', left: RAIL.x + RAIL.w - RAIL.b, top: 0, width: RAIL.b, height: Math.max(0, bot), background: G.ink}} />
			{bot < 1930 ? (
				<Blur y={Math.min(4, Math.abs(vb) * 0.05)} w={RAIL.w} h={RAIL.b} style={{position: 'absolute', left: RAIL.x, top: bot - RAIL.b, width: RAIL.w, height: RAIL.b}}>
					<div style={{width: '100%', height: '100%', background: G.ink}} />
				</Blur>
			) : null}

			{/* 從頭／到尾 */}
			<div style={{position: 'absolute', inset: 0, transform: `translateY(${(drift * -8).toFixed(2)}px)`}}>
				<Blur y={Math.abs(vel(topOff, f)) * 0.2} w={LAB.size * 1.1} h={vColH(C30.F.top, LAB.size)} style={{position: 'absolute', left: LAB.x, top: TOP_Y + topOff(f)}}>
					<VCol text={C30.F.top} x={0} y={0} size={LAB.size} style={{position: 'relative'}} />
				</Blur>
				{f >= BEAT2 - 3 ? (
					<Blur y={Math.abs(vel(botOff, f)) * 0.2} w={LAB.size * 1.1} h={vColH(C30.F.bottom, LAB.size)} style={{position: 'absolute', left: LAB.x, top: BOT_Y + botOff(f)}}>
						<VCol text={C30.F.bottom} x={0} y={0} size={LAB.size} style={{position: 'relative'}} />
					</Blur>
				) : null}
			</div>

			{/* 左邊：從頭到尾，設計師自己操作。（兩欄直排，由上往下寫出） */}
			{f >= LINE_AT - 3 ? (
				<div style={{position: 'absolute', inset: 0, transform: `translateY(${(drift * 8).toFixed(2)}px)`}}>
					{[c1, c2].map((t, k) => {
						const p = col(k);
						return (
							<VCol
								key={k}
								text={t}
								x={322 - k * 58}
								y={620 - (1 - p) * 24}
								size={48}
								weight={500}
								style={{clipPath: `inset(0 0 ${((1 - p) * 100).toFixed(2)}% 0)`}}
							/>
						);
					})}
				</div>
			) : null}

			{/* 設計師：沿長框往下走 */}
			<Blur x={Math.min(12, Math.abs(tvx) * 0.2)} y={Math.min(12, Math.abs(tv) * 0.2)} w={TAG.w} h={TAG.h} style={{position: 'absolute', left: tx, top: ty, width: TAG.w, height: TAG.h}}>
				<TagBox x={0} y={0} lag={lag} />
			</Blur>
		</>
	);
};
