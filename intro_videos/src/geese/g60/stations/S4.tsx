// 60 秒〈字的雁陣〉S4・店裡還有（小節 8–9，f900–1157）　錨點 (2100,3000)，上臂
// 全片節奏最密的一站：小字先到 → 兩個小雁陣每隔兩拍從上方落下 → 其餘反拍（半拍）讓紋理詞輪流亮成墨色，
// 亮點左右交替一路往下，最後停在右下角（＝下一站「>」頂點的方向），帶著眼睛去 S5。
// 版面（站內座標 0–790 × 0–978）：小字靠左上 → 第一行往右錯 56px → 第二行再往右、右緣超出第一行（分鏡：第一行往左、第二行往右），
// 整組沿筆畫方向往右下走；字不貼站框左上角（鏡頭停留會往右下漂）。
import React from 'react';
import {C60} from '../../copy';
import {F, G, bar60, b60} from '../../theme';
import {Rise, StationBox, StationProps} from '../kit';
import {ST} from '../timeline';
import {FlockDrop, TexFlash} from './S4_parts';
import {Away} from './Away';
import {MoveBlur} from './S5_parts';

// 第 1 輪修正：小字跟著鏡頭到站（from+16），第一個小雁陣提前到第 2 拍落地（跟其他站「第 2 拍主字」一致），
// 到站後不再有 1 秒只剩紋理的空檔。
const T = {
	lead: ST.S4.from + 16, // f916「店裡還有」：鏡頭到站
	a: bar60(8, 2), // f932「廁所備衛生棉」落地
	b: bar60(9, 1), // f1029「零食櫃」落地（小節 9 正拍）
} as const;

const X0 = 64;
const LEAD = {x: X0, y: 226, size: 56};
const A = {x: X0 + 56, y: 440, size: 100}; // 6 字 → 寬 600，x 120–720
const B_SIZE = 110;
// 第二行往右：右緣比第一行再多出 30px（x 420–750）；上緣離第一行夠遠，落下路徑（上方 −120px 起）不會穿過第一行
const B = {size: B_SIZE, y: 696, x: A.x + Array.from(C60.S4.a).length * A.size + 30 - Array.from(C60.S4.b).length * B_SIZE};

// 反拍點綴：每半拍一個紋理詞亮起（全段 5 次）。左右交替、一路往下，最後停在右下角（下一站的方向）。
// 位置都避開兩個小雁陣的落下路徑，也不貼在文案行尾（免得被讀成同一句）。
// 第 1 輪修正：拿掉 beat 29.5 的「護」（緊接在「店裡還有」之後亮，會被讀成「店裡還有護…」），從第一行落地後才開始閃。
const FLASH: {beat: number; text: string; x: number; y: number}[] = [
	{beat: 30.5, text: C60.TEXTURE[3], x: 150, y: 604}, // f980 剪（左中，第一行落地後）
	{beat: 31.5, text: C60.TEXTURE[2], x: 590, y: 322}, // f1013 服務（右上）
	{beat: 32.5, text: C60.TEXTURE[5], x: 250, y: 842}, // f1045 染（左下，第二行落地後）
	{beat: 33.5, text: C60.TEXTURE[1], x: 560, y: 892}, // f1077 確認（右下）
	{beat: 34.5, text: C60.TEXTURE[4], x: 708, y: 940}, // f1109 燙（右下角）
];

export const S4: React.FC<StationProps> = ({f}) => {
	if (f < T.lead - 16) return null;
	return (
		<StationBox id="S4">
			{/* 整合：離站時帶方向模糊（跟其他站一致），鏡頭到 S5 後收字、拉遠揭曉再回來（見 Away.tsx） */}
			<Away f={f} next="S5">
				<MoveBlur f={f}>
					{FLASH.map((fl, i) => (
						<TexFlash key={i} f={f} at={b60(fl.beat)} text={fl.text} x={fl.x} y={fl.y} />
					))}

					{/* 店裡還有 */}
					<Rise f={f} at={T.lead - 3} dy={26} style={{position: 'absolute', left: LEAD.x, top: LEAD.y}}>
						<div style={{fontFamily: F.round, fontWeight: 500, fontSize: LEAD.size, lineHeight: 1.2, color: G.ink, whiteSpace: 'pre'}}>{C60.S4.lead}</div>
					</Rise>

					{/* 廁所備衛生棉：第一個小雁陣，從右上往左落 */}
					<FlockDrop f={f} text={C60.S4.a} land={T.a} size={A.size} glide={36} spread={12} style={{position: 'absolute', left: A.x, top: A.y}} />

					{/* 零食櫃：第二個小雁陣，從左上往右落，落在小節 9 正拍 */}
					<FlockDrop f={f} text={C60.S4.b} land={T.b} size={B.size} glide={-36} spread={16} style={{position: 'absolute', left: B.x, top: B.y}} />
				</MoveBlur>
			</Away>
		</StationBox>
	);
};
