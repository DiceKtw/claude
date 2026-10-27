// 30 秒〈一格一位〉鏡頭 J・片尾（小節 15–16，f1575–1800）
// f1575 硬切：那一格（左緣不動）往右撐開、往下壓扁成預約框（硬切那格正在撐），框裡的「預約 07-281-3636」被撐開的框一路揭出來。
// 拍 2：框上方 logo（第二次出現；沒有檔案就是「雁沙龍」字標）逐字落位；拍 3 地址；拍 4 IG。
// 第 16 小節正拍最後一擊：框裡的黃先往下沉乾（吸一口氣），再 4 格由下往上灌滿——滿的那格在拍上（第三次黃格填色）；
// 之後整張慢漂放大 1% 到最後一格。
import React from 'react';
import {Img} from 'remotion';
import {E, clamp, lerp} from '../../../lib/motion';
import {C30} from '../../copy';
import {F, G} from '../../theme';
import {Line, SH, ShotProps, bar30, logoSrc} from '../kit';
import {CELL, Glyph, PaperFast} from './A_parts';
import {Blur, VCol, vColH, vel} from './F_parts';

const T0 = SH.J.from; // 1575
const BOX = {x: 90, y: 600, w: 790, h: 300, b: 10};
const LOGO_AT = bar30(15, 2); // 1603
const ADDR_AT = bar30(15, 3); // 1631
const IG_AT = bar30(15, 4); // 1659
const HIT = bar30(16, 1); // 1688
const DRAIN = 10; // 沉乾要幾格（拍前 14 格開始）
const LOGO = {x: 90, y: 330, h: 160};
const WORD = 150; // 字標字級

// 「預約 07-281-3636」：預約（直排 48）＋電話（Anybody 900、字寬 75%、120）
const [TEL_LABEL, ...TEL_REST] = C30.J.tel.split(' ');
const TEL_NUM = TEL_REST.join(' ');
const NUM_W = 640; // 120px、字寬 75% 的電話排版寬（算圖量測）
const LAB_W = 48 * 1.05;
const GAP = 30;
const CONTENT_X = BOX.x + BOX.b + (BOX.w - 2 * BOX.b - (LAB_W + GAP + NUM_W)) / 2;
const MID_Y = BOX.y + BOX.h / 2;

/** 框的形狀：從開場那一格撐成預約框（左緣不動），提前 3 格起跑 */
const shape = (f: number) => {
	// 26 格：收尾的餘勢一路接到拍 2 字標落下，中間不停住
	const p = E.outExpo(clamp((f - (T0 - 3)) / 26));
	return {
		x: BOX.x,
		y: lerp(CELL.y, BOX.y, p),
		w: lerp(CELL.s, BOX.w, p),
		h: lerp(CELL.s, BOX.h, p),
	};
};

/** 黃的水位（0–1，從底部算）：最後一擊前沉乾，再 4 格灌滿 */
const level = (f: number) => {
	const d0 = HIT - 4 - DRAIN;
	if (f < d0) return 1;
	if (f < HIT - 4) return 1 - E.inCubic(clamp((f - d0) / DRAIN));
	return E.outCubic(clamp((f - (HIT - 4)) / 4));
};

export const J: React.FC<ShotProps> = ({f}) => {
	const s = shape(f);
	const sw = vel((ff) => shape(ff).w, f);
	const lv = level(f);
	const logo = logoSrc('ink');

	// 最後一擊後：整張以閱讀窗中心慢漂放大 1%（被擊中先推一下，之後等速慢漂到最後一格，不停住）
	const zt = clamp((f - HIT) / (SH.J.to - 1 - HIT));
	const zoom = 1 + 0.01 * (0.35 * E.outCubic(zt) + 0.65 * zt);
	// 最後一擊前的等速慢漂：字標往上、地址兩行往下（反向視差）
	const pre = clamp((f - (T0 + 14)) / (HIT - T0 - 14));
	const upY = -18 * pre;
	const downY = 14 * pre;

	// 字標：逐字從上方落位（錯 3 格，拍前 3 格起跑）
	const word = Array.from(C30.C.name);
	const drop = (i: number, ff: number) => -70 * (1 - E.outExpo(clamp((ff - (LOGO_AT - 3 + i * 3)) / 12)));

	return (
		<>
			<PaperFast />
			<div style={{position: 'absolute', inset: 0, transform: `scale(${zoom.toFixed(5)})`, transformOrigin: '485px 760px'}}>
				{/* logo（第二次出現）／沒有檔案時的字標 */}
				{logo ? (
					f >= LOGO_AT - 3 ? (
						<Blur y={Math.abs(vel((ff) => drop(0, ff), f)) * 0.2} w={LOGO.h * 3} h={LOGO.h} style={{position: 'absolute', left: LOGO.x, top: LOGO.y + drop(0, f) + upY, height: LOGO.h}}>
							<Img src={logo} style={{height: LOGO.h, width: 'auto', display: 'block'}} />
						</Blur>
					) : null
				) : (
					word.map((ch, i) => {
						if (f < LOGO_AT - 3 + i * 3) return null;
						return (
							<Blur
								key={i}
								y={Math.min(14, Math.abs(vel((ff) => drop(i, ff), f)) * 0.22)}
								w={WORD}
								h={WORD}
								style={{position: 'absolute', left: LOGO.x + i * WORD * 1.02, top: LOGO.y + (LOGO.h - WORD) / 2 + drop(i, f) + upY, width: WORD, height: WORD}}
							>
								<Glyph ch={ch} x={WORD / 2} y={WORD / 2} size={WORD} />
							</Blur>
						);
					})
				)}

				{/* 預約框（黃底墨框）：框撐開時把裡面的字揭出來 */}
				<Blur x={Math.min(10, Math.abs(sw) * 0.12)} w={BOX.w} h={BOX.h} style={{position: 'absolute', left: s.x, top: s.y, width: s.w, height: s.h}}>
					<div style={{position: 'absolute', inset: 0, boxSizing: 'border-box', border: `${BOX.b}px solid ${G.ink}`, overflow: 'hidden', background: G.paper}}>
						<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: `${(lv * 100).toFixed(2)}%`, background: G.yellow}} />
						{/* 內容釘在最後的位置（換算成框內座標），框是窗：框撐開時一路揭出來 */}
						<VCol text={TEL_LABEL} x={CONTENT_X - s.x - BOX.b} y={MID_Y - vColH(TEL_LABEL, 48) / 2 - s.y - BOX.b} size={48} />
						<div
							style={{
								position: 'absolute',
								left: CONTENT_X + LAB_W + GAP - s.x - BOX.b,
								top: MID_Y - 0.4385 * 120 - s.y - BOX.b,
								fontFamily: F.num,
								fontWeight: 900,
								fontStretch: '75%',
								fontSize: 120,
								lineHeight: '120px',
								color: G.ink,
								whiteSpace: 'pre',
							}}
						>
							{TEL_NUM}
						</div>
					</div>
				</Blur>

				{/* 地址、IG */}
				<Line x={BOX.x} y={BOX.y + BOX.h + 44 + downY} text={C30.J.addr} size={40} weight={500} f={f} at={ADDR_AT - 3} />
				<Line x={BOX.x} y={BOX.y + BOX.h + 112 + downY} text={C30.J.ig} size={36} weight={500} f={f} at={IG_AT - 3} style={{fontFamily: F.mono}} />
			</div>
		</>
	);
};
