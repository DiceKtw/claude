// 30 秒〈一格一位〉鏡頭 I・回到那一格（小節 13–14，f1350–1575）
// f1350 鼓回來的正拍硬切回開場構圖：同一格、同一個位置，裡面的「客」直接換成「你」（全片唯一一次字替換）。
// 黃色在硬切那格正由下往上灌（第二次黃格填色：這一次填的是「你」的那一格），「你」被灌進來的黃頂一下再落定。
// 拍 2：右邊直排黑框從上方拉門落下（跟開場從下方上來相反），框裡的字因慣性多走一點再彈回。
// 鼓回來的兩小節不站著：「你」每拍脈動（小節 13 拍 3、4 先 1.04 起頭，小節 14 每拍 1.065，outBack），
// 整格跟著大鼓一起被震一下、框裡的直排字每拍被震 7–8px；格子跟框反向等速微漂。
import React from 'react';
import {DirBlur} from '../../../lib/components';
import {E, clamp} from '../../../lib/motion';
import {C30} from '../../copy';
import {G} from '../../theme';
import {Cell, SH, ShotProps, VBox, bar30, slideIn} from '../kit';
import {CELL, Glyph, HourLabel, PaperFast, VB, VText, hourPos, ring} from './A_parts';

const T0 = SH.I.from; // 1350
const FILL_AT = T0 + 3; // 硬切那格黃色已灌到一半多、還在往上衝；3 格後滿
const VB_AT = bar30(13, 2) - 5; // 拉門提前 5 格起跑：撞停（進度 0.96）那格落在拍 2（1378）後不到 1 格
const VB_DIST = VB.y + VB.h + 60; // 從畫面上方外面落下
// 小節 14 每拍 1.065；框落定後的小節 13 拍 3、4 先輕一點（1.04），一路推到片尾不斷（304px 的字邊緣約動 6–10px）
const PULSES = [
	{b: bar30(13, 3), a: 0.04},
	{b: bar30(13, 4), a: 0.04},
	...[1, 2, 3, 4].map((k) => ({b: bar30(14, k), a: 0.065})),
];
const NI = 304; // 跟開場留下來那個「客」一樣大

/** 每拍脈動：拍前 3 格起跑 outBack 到 1+a（最大那格在拍上），再 inOutSine 回 1 */
const pulse = (f: number) => {
	let s = 0;
	for (const {b, a} of PULSES) {
		const up = E.outBack(clamp((f - (b - 3)) / 6));
		const down = E.inOutSine(clamp((f - (b + 3)) / 18));
		s = Math.max(s, a * (up - down));
	}
	return 1 + s;
};

export const I: React.FC<ShotProps> = ({f}) => {
	// 「你」：被灌進來的黃往上頂一下，像浮在水面上晃兩下才定（衰減彈簧，約 40 格），一路接到拍 2 框進來
	const t = f - (T0 - 2);
	const hit = 1 + 0.07 * ring(t + 5, 0.3, 11);
	const lift = -18 * ring(t, 0.3, 12);
	const sc = hit * pulse(f);

	// 直排黑框：拉門從上方落下；框停住後裡面的字多沉一下再彈回
	const off = slideIn(f, VB_AT, 'top', VB_DIST);
	const vy = slideIn(f + 0.5, VB_AT, 'top', VB_DIST).y - slideIn(f - 0.5, VB_AT, 'top', VB_DIST).y;
	let lag = 26 * ring(f - (VB_AT + 8), 0.36, 7);
	for (const {b} of PULSES) lag += 10 * ring(f - b, 0.36, 7);
	// 整格（「1 小時」＋格子）跟著大鼓一起被震一下：脈動的 40%，以格子中心為準
	const cellPulse = 1 + 0.4 * (pulse(f) - 1);

	// 全程：格子往下、框往上，反向等速微漂（視差，不是移鏡）
	const drift = clamp((f - T0) / (SH.I.to - T0));
	const hp = hourPos(CELL);

	return (
		<>
			<PaperFast />
			<div
				style={{
					position: 'absolute',
					inset: 0,
					transform: `translateY(${(drift * 36).toFixed(2)}px) scale(${cellPulse.toFixed(4)})`,
					transformOrigin: `${CELL.x + CELL.s / 2}px ${CELL.y + CELL.s / 2}px`,
				}}
			>
				<HourLabel x={hp.x} y={hp.y} />
				<Cell f={f} x={CELL.x} y={CELL.y} size={CELL.s} fillAt={FILL_AT}>
					<Glyph ch={C30.I.ni} x={(CELL.s - 20) / 2} y={(CELL.s - 20) / 2 + lift} size={NI} scale={sc} origin="50% 60%" />
				</Cell>
			</div>
			{f >= VB_AT ? (
				<div style={{position: 'absolute', inset: 0, transform: `translateY(${(drift * -40).toFixed(2)}px)`}}>
					<DirBlur y={Math.min(30, Math.abs(vy) * 0.18)} style={{position: 'absolute', left: VB.x - 20, top: VB.y + off.y - 20, width: VB.w + 40, height: VB.h + 40}}>
						<VBox x={20} y={20} w={VB.w} h={VB.h} fill={G.paper} style={{overflow: 'hidden'}}>
							<VText text={C30.I.line.replace('，', '，\n')} size={98} lh={1.28} dy={lag} />
						</VBox>
					</DirBlur>
				</div>
			) : null}
		</>
	);
};
