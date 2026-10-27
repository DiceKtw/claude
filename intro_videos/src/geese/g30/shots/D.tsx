// 30 秒〈一格一位〉鏡頭 D・老實話（小節 4）
// f338 硬切回黃格（縮在上半部）：硬切那格格子正從開場那一格的大小（420）收回 320，同時下面一行字已經在往上升。
// 物理梗「小字推不動格子」：拍 2 那行字往上頂、撞到格子下緣被彈回，格子一動不動，只有格裡的「客」被震得歪 1° 再回正；
// 拍 3、拍 4 字再頂兩次（一次比一次小），「客」的餘震跟著遞減。一路動到 f450 硬切。
import React from 'react';
import {E, clamp, prog} from '../../../lib/motion';
import {C30} from '../../copy';
import {F, G} from '../../theme';
import {Cell, SH, ShotProps, bar30} from '../kit';
import {Glyph, PaperFast, ring} from './A_parts';

const T0 = SH.D.from; // 338
const CELL = {x: 330, y: 300, s: 320};
const LINE_AT = T0 + 3; // 341：硬切那格字已經在升，3 格後落定（停留約 1.85 秒）
const LINE_Y = 640; // 字框上緣；字的墨上緣約在格子下緣（620）下方 30px
const LINE = {size: 50, lh: 68};
// 頂格子：拍 2 最用力，拍 3、4 遞減
const SHOVES = [
	{b: bar30(4, 2), a: 1}, // 366
	{b: bar30(4, 3), a: 0.55}, // 394
	{b: bar30(4, 4), a: 0.3}, // 422
];
const GAP = 28; // 字的上緣到格子下緣的距離（約 31px）：頂上去停在格框下 3px，看起來是撞到、不會壓到框上

// 歪 1°：衰減正弦的最大值正規化成 1
const TW = 0.3;
const TT = 15;
const PEAK = (() => {
	let m = 0;
	for (let t = 0; t < 60; t += 0.25) m = Math.max(m, ring(t, TW, TT));
	return m;
})();

/** 字往上頂一次：拍前 3 格加速撞上去（拍上那格撞到格框），被彈回、往下多退一點再回到原位 */
const shove = (t: number) => {
	if (t < -3) return 0;
	if (t < 0) return -GAP * E.inCubic((t + 3) / 3);
	return -GAP * Math.cos(0.3 * t) * Math.exp(-t / 14);
};

// 細字：提前 6 格起跑，從下方升上來（硬切那格已經在動）
const LS = LINE_AT - 6;
// 全程：整組等速往上慢漂（一路推到 f450 硬切，不減速）。取整數像素：每約 5.6 格整組一起上移 1px，不會前後抖
const driftAt = (f: number) => Math.round(-20 * clamp((f - T0) / (SH.D.to - T0)));
const lineRaw = (f: number) => {
	let push = 0;
	for (const {b, a} of SHOVES) push += a * shove(f - b);
	return LINE_Y + 60 * (1 - prog(f, LS, 12, E.outExpo)) + push - 20 * clamp((f - T0) / (SH.D.to - T0));
};
/** 字的位置取整數像素＋遲滯（變化不到 1px 就不動）：
 *  字會吸附整數像素，彈跳折返點附近連續值在 .5 上下來回，會變成「下 1px、下一格又回來」的單格跳動。仍是格數的純函數。 */
const lineY = (f: number) => {
	let q = Math.round(lineRaw(LS));
	for (let k = LS + 1; k <= f; k++) {
		const v = lineRaw(k);
		if (Math.abs(v - q) >= 1) q = Math.round(v);
	}
	return q;
};

export const D: React.FC<ShotProps> = ({f}) => {
	// 硬切那格：格子從開場那一格的大小（420/320）收回來（outExpo 20 格，約 f350 落定）
	const shrink = 1 + 0.3125 * (1 - prog(f, T0 - 3, 20, E.outExpo));
	// 每次撞上：「客」歪一下再回正（最大 1°，遞減）
	let tilt = 0;
	for (const {b, a} of SHOVES) tilt += (a * ring(f - b, TW, TT)) / PEAK;
	const keSize = 226;

	return (
		<>
			<PaperFast />
			<div style={{position: 'absolute', inset: 0, transform: `translateY(${driftAt(f)}px)`}}>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						transform: `scale(${shrink.toFixed(4)})`,
						transformOrigin: `${CELL.x + CELL.s / 2}px ${CELL.y + CELL.s / 2}px`,
					}}
				>
					<Cell f={f} x={CELL.x} y={CELL.y} size={CELL.s} fillAt={-100}>
						<Glyph ch={C30.A.ke} x={(CELL.s - 20) / 2} y={(CELL.s - 20) / 2} size={keSize} rot={tilt} origin="50% 92%" />
					</Cell>
				</div>
			</div>
			{f >= LS ? (
				<div
					lang="zh-Hant-TW"
					style={{
						position: 'absolute',
						left: 90,
						width: 790,
						top: lineY(f),
						textAlign: 'center',
						fontFamily: F.round,
						fontWeight: 500,
						fontSize: LINE.size,
						lineHeight: `${LINE.lh}px`,
						color: G.ink,
						whiteSpace: 'pre',
					}}
				>
					{C30.D.line}
				</div>
			) : null}
		</>
	);
};
