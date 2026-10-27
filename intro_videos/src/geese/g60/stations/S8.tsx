// 60 秒〈字的雁陣〉S8・命定設計師（小節 19–21，f2314–2700）　錨點 (700,7000)，短筆畫尾端（往左錯）
// f2346「想找你的命定設計師，」整行由右上往左順著筆勢飛進（inOutExpo 20 格；後面的字各晚 0.38 格起飛，
//   飛行中拉成一道斜梯隊，落地壓回一行），落地後沿飛行方向再滑 20px 到定位（停留中不死）
// → f2443「歡迎來雁沙龍」由「雁」領頭往上浮，兩側一字晚 4 格（起飛那幾格是一個倒 V 的雁陣）
// → f2571（小節 21 正拍）句點「。」彈到最大（outBack），句子蓋上最後一個點；小節 21 交給 Texture 變密，f2684 起拉遠。
// 版面：第一行 70px（10 字＋停留漂移，76px 會超出閱讀窗右緣）、第二行 100px 往左錯 50px。
import React from 'react';
import {C60} from '../../copy';
import {bar60} from '../../theme';
import {StationBox, StationProps} from '../kit';
import {ST} from '../timeline';
import {CamBlur} from './S7_parts';
import {DotPop, FlightLine, LeadRise} from './S8_parts';

const T = {
	a: bar60(19, 2), // f2346 想找你的命定設計師，落地
	b: bar60(20, 1), // f2443 歡迎來雁沙龍
	dot: bar60(21, 1), // f2571 。（最後一小節正拍，句子蓋上句點）
	hold: ST.REVEAL.from - 16, // f2684 鏡頭開始拉遠
} as const;

const A = 70;
const B = 100;
const X = {a: 62, b: 12} as const;
const Y = {a: 404, b: 530} as const;
const B_CHARS = Array.from(C60.S8.b);
const DOT = B_CHARS.length - 1;
const LEAD = B_CHARS.indexOf('雁');

export const S8: React.FC<StationProps> = ({f}) => {
	if (f < T.a - 20) return null;
	return (
		<StationBox id="S8">
			<CamBlur f={f} box={{x: 0, y: 300, w: 790, h: 380}}>
				<FlightLine f={f} text={C60.S8.a} x={X.a} y={Y.a} size={A} start={T.a - 18} lag={0.38} from={{dx: 960, dy: -220}} creep={{from: T.a + 4, to: T.hold, px: 20}} />
				<LeadRise f={f} text={C60.S8.b} x={X.b} y={Y.b} size={B} start={T.b - 4} leader={LEAD} stagger={4} dy={90} dur={18} skip={[DOT]} />
				<DotPop f={f} ch={B_CHARS[DOT]} x={X.b + DOT * B} y={Y.b} size={B} hit={T.dot} origin="50% 50%" />
			</CamBlur>
		</StationBox>
	);
};
