// 60 秒〈字的雁陣〉S8・命定設計師（小節 19–21，f2314–2700）　錨點 (700,7000)，短筆畫尾端（往左錯）
// 第 1 輪修正：主從重排成三列樓梯（往左下錯，跟短筆畫同方向）——
//   「想找你的命定設計師，」60px／500 當引言（跟 S4「店裡還有」、S6「附設」同一個角色）
//   「歡迎來」「雁沙龍。」各 190px／900 當主字（其他站的主字是 190–230px）。
// f2346 引言整行由右上往左順著筆勢飛進（inOutExpo 20 格；後面的字各晚 0.38 格起飛，飛行中拉成一道斜梯隊，落地壓回一行），
//   落地後沿飛行方向再滑 30px 到定位（停留中不死）
// → f2443（小節 20 正拍）「歡迎來」「雁沙龍」兩列整句浮上來（kit 的 Rise，兩列錯 3 格；不再用「雁」領頭的倒 V——落陣全片只用 2 次）
// → f2571（小節 21 正拍）句點「。」彈到最大（outBack），句子蓋上最後一個點；小節 21 交給 Texture 變密，f2684 起拉遠。
// 拉遠揭曉時，「>」的收筆剛好停在「雁沙龍」上。
// 版面（站內座標）：引言 x 150、主字兩列 x 100 → 40（往左錯）；停留時字往右上漂 42/60px，「。」的墨右緣 ≈ 740，最後一格仍在閱讀窗內。
import React from 'react';
import {C60} from '../../copy';
import {F, G, bar60} from '../../theme';
import {Rise, StationBox, StationProps} from '../kit';
import {ST} from '../timeline';
import {CamBlur} from './S7_parts';
import {DotPop, FlightLine} from './S8_parts';

const T = {
	a: bar60(19, 2), // f2346 想找你的命定設計師，落地
	b: bar60(20, 1), // f2443 歡迎來／雁沙龍
	dot: bar60(21, 1), // f2571 。（最後一小節正拍，句子蓋上句點）
	hold: ST.REVEAL.from - 16, // f2684 鏡頭開始拉遠
} as const;

const A = 60; // 引言
const B = 190; // 主字
const X = {a: 150, b1: 100, b2: 40} as const;
const Y = {a: 300, b1: 392, b2: 600} as const;
const B_CHARS = Array.from(C60.S8.b);
const DOT = B_CHARS.length - 1; // 「。」
const ROW1 = B_CHARS.slice(0, 3).join(''); // 歡迎來
const ROW2 = B_CHARS.slice(3, DOT).join(''); // 雁沙龍
const big: React.CSSProperties = {fontFamily: F.round, fontWeight: 900, fontSize: B, lineHeight: 1, color: G.ink, whiteSpace: 'pre'};

export const S8: React.FC<StationProps> = ({f}) => {
	if (f < T.a - 20) return null;
	return (
		<StationBox id="S8">
			<CamBlur f={f} box={{x: 0, y: 240, w: 790, h: 600}}>
				<FlightLine f={f} text={C60.S8.a} x={X.a} y={Y.a} size={A} weight={500} start={T.a - 18} lag={0.38} from={{dx: 960, dy: -220}} creep={{from: T.a + 4, to: T.hold, px: 30}} />
				<Rise f={f} at={T.b - 3} dy={36} dur={16} style={{position: 'absolute', left: X.b1, top: Y.b1}}>
					<div style={big}>{ROW1}</div>
				</Rise>
				<Rise f={f} at={T.b} dy={36} dur={16} style={{position: 'absolute', left: X.b2, top: Y.b2}}>
					<div style={big}>{ROW2}</div>
				</Rise>
				<DotPop f={f} ch={B_CHARS[DOT]} x={X.b2 + 3 * B} y={Y.b2} size={B} hit={T.dot} origin="50% 50%" />
			</CamBlur>
		</StationBox>
	);
};
