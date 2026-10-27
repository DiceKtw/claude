// 30 秒〈一格一位〉鏡頭 D・老實話（小節 4）
// f338 硬切回黃格（縮在上半部，硬切那格還在收小）；拍 2 一行細字落下，
// 格子裡的「客」只被震得歪 1° 再回正——小字推不動格子
import React from 'react';
import {E, prog} from '../../../lib/motion';
import {C30} from '../../copy';
import {F, G} from '../../theme';
import {Cell, SH, ShotProps, bar30} from '../kit';
import {Glyph, PaperFast, ring} from './A_parts';

const T0 = SH.D.from; // 338
const CELL = {x: 330, y: 300, s: 320};
const LINE_AT = bar30(4, 2); // 366
const LINE_Y = 760;

// 歪 1°：衰減正弦的最大值正規化成 1
const TW = 0.3;
const TT = 15;
const PEAK = (() => {
	let m = 0;
	for (let t = 0; t < 60; t += 0.25) m = Math.max(m, ring(t, TW, TT));
	return m;
})();

export const D: React.FC<ShotProps> = ({f}) => {
	// 硬切那格：格子正從大一點收回來（像是從開場那一格縮過來）
	const shrink = 1 + 0.1 * (1 - prog(f, T0 - 3, 16, E.outExpo));
	// 細字：提前 3 格起跑，從上方輕輕落下
	const ls = LINE_AT - 3;
	const lp = prog(f, ls, 14, E.outExpo);
	// 落地（拍 2）那一下：「客」歪 1° 再回正
	const tilt = (1 * ring(f - LINE_AT, TW, TT)) / PEAK;
	// 全程：格子微微往上、字微微往下（反向慢漂）
	const drift = prog(f, T0, SH.D.to - T0, E.inOutSine);
	const keSize = 226;

	return (
		<>
			<PaperFast />
			<div
				style={{
					position: 'absolute',
					inset: 0,
					transform: `translateY(${(drift * -10).toFixed(2)}px) scale(${shrink.toFixed(4)})`,
					transformOrigin: `${CELL.x + CELL.s / 2}px ${CELL.y + CELL.s / 2}px`,
				}}
			>
				<Cell f={f} x={CELL.x} y={CELL.y} size={CELL.s} fillAt={-100}>
					<Glyph ch={C30.A.ke} x={(CELL.s - 20) / 2} y={(CELL.s - 20) / 2} size={keSize} rot={tilt} origin="50% 92%" />
				</Cell>
			</div>
			{f >= ls ? (
				<div
					lang="zh-Hant-TW"
					style={{
						position: 'absolute',
						left: 90,
						width: 790,
						top: LINE_Y - 44 * (1 - lp) + drift * 10,
						textAlign: 'center',
						fontFamily: F.round,
						fontWeight: 300,
						fontSize: 44,
						lineHeight: '60px',
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
