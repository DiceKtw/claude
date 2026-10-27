// 30 秒〈一格一位〉鏡頭 C・名牌（小節 3）：logo 第一次出現
// f225 硬切：高直排墨框從上方拉門落下（硬切那格正在最快）→ 框停住、裡面的 logo／「雁」因慣性多沉一下再彈回
// 拍 2「雁沙龍」直排逐字落位；拍 3 英文＋地區 Mono 小標；之後兩區反向微漂
import React from 'react';
import {Img} from 'remotion';
import {DirBlur} from '../../../lib/components';
import {E, clamp, prog} from '../../../lib/motion';
import {C30} from '../../copy';
import {F, G} from '../../theme';
import {Line, SH, ShotProps, VBox, bar30, logoSrc, slideIn} from '../kit';
import {Glyph, PaperFast, ring} from './A_parts';

const T0 = SH.C.from; // 225
const BOX = {x: 236, y: 290, w: 320, h: 830};
const NAME = {x: 590, y: 300, size: 150};
const DROP_AT = T0 - 5; // 拉門提前 5 格起跑：最快那格在硬切前一格，硬切那格框已落下大半、還帶著速度
const NAME_AT = bar30(3, 2); // 253
const EN_AT = bar30(3, 3); // 281

export const C: React.FC<ShotProps> = ({f}) => {
	const off = slideIn(f, DROP_AT, 'top', 1200);
	const vy = slideIn(f + 0.5, DROP_AT, 'top', 1200).y - slideIn(f - 0.5, DROP_AT, 'top', 1200).y;
	// 框往下停住，裡面的東西多沉一下再彈回
	const sink = 30 * ring(f - (DROP_AT + 8), 0.33, 8);
	// 之後：框跟名字反方向慢漂
	const drift = prog(f, T0 + 12, SH.C.to - T0 - 12, E.inOutSine);
	const logo = logoSrc('ink');
	const name = Array.from(C30.C.name);
	const step = NAME.size * 1.04;

	return (
		<>
			<PaperFast />
			{/* 名牌框 */}
			<div style={{position: 'absolute', inset: 0, transform: `translateY(${(drift * 14).toFixed(2)}px)`}}>
				<DirBlur y={Math.min(22, Math.abs(vy) * 0.08)} style={{position: 'absolute', left: BOX.x - 20, top: BOX.y + off.y - 20, width: BOX.w + 40, height: BOX.h + 40}}>
					<VBox x={20} y={20} w={BOX.w} h={BOX.h} fill={G.paper} style={{overflow: 'hidden'}}>
						<div style={{position: 'absolute', inset: 0, transform: `translateY(${sink.toFixed(2)}px)`}}>
							{logo ? (
								<Img
									src={logo}
									style={{position: 'absolute', left: '15%', width: '70%', top: '50%', transform: 'translateY(-50%)', objectFit: 'contain'}}
								/>
							) : (
								<Glyph ch={name[0]} x={(BOX.w - 20) / 2} y={(BOX.h - 20) / 2} size={260} />
							)}
						</div>
					</VBox>
				</DirBlur>
			</div>
			{/* 雁沙龍：直排逐字落位，由下往上堆（龍→沙→雁，錯 3 格）：每個字往下落時，它上方的格子都還空著，不會疊字 */}
			<div style={{position: 'absolute', inset: 0, transform: `translateY(${(drift * -16).toFixed(2)}px)`}}>
				{name.map((ch, i) => {
					const s = NAME_AT - 3 + (name.length - 1 - i) * 3;
					if (f < s) return null;
					const y = (ff: number) => -80 * (1 - E.outExpo(clamp((ff - s) / 12)));
					const v = y(f + 0.5) - y(f - 0.5);
					return (
						<Glyph
							key={i}
							ch={ch}
							x={NAME.x + NAME.size / 2}
							y={NAME.y + step * i + step / 2 + y(f)}
							size={NAME.size}
							blur={{x: 0, y: Math.abs(v) * 0.22}}
						/>
					);
				})}
			</div>
			{/* 英文名＋地區 */}
			<Line
				x={90}
				y={1156}
				text={C30.C.en}
				size={34}
				weight={500}
				color={G.pencil}
				f={f}
				at={EN_AT - 2}
				style={{fontFamily: F.mono, width: 790, textAlign: 'center', letterSpacing: '0.02em'}}
			/>
		</>
	);
};
