// 60 秒〈字的雁陣〉S6・附設夜間洗髮（小節 13–15，f1543–1929）　錨點 (2100,5000)，下臂（往左錯）
// f1559「附設」從右側滑進（右上）→ f1575「夜間洗髮」⑤樓梯落字（全片第 2 次，方向跟 S3 相反：一字一階往左下）
// → 小節 14–15 每拍一個字「踩一下」（字重 900→800→900＋下沉 24px），從最高的「髮」一階一階往左下踩到「夜」，
//   走兩趟；最後一步落在左下角，鏡頭接著往左下去 S7。
// 版面（站內座標 0–790 × 0–978）：下臂的樓梯往左下走——「附設」在右上，「夜間洗髮」從右上的「髮」往左下排到「夜」
// （每個字往左一格就往下 40px，跟短筆畫「/」同方向），每行字本身仍由左往右讀。
// 鏡頭停留會往左下漂（字往右上走 42/60px）＋慢推 1.2%，所以右緣 ≤ 740、上緣 ≥ 300。
import React from 'react';
import {C60} from '../../copy';
import {F, G, bar60} from '../../theme';
import {StairDrop, StationBox, StationProps} from '../kit';
import {E, prog} from '../../../lib/motion';
import {ST} from '../timeline';
import {MoveBlur} from './S5_parts';
import {StairSteps} from './S6_parts';

// 第 1 輪修正：「附設」跟著鏡頭到站（from+16）從右側滑進，「夜間洗髮」提前到第 2 拍（跟其他站「第 2 拍主字」一致），
// 到站後不再有 1 秒只剩紋理的空檔。
const T = {
	lead: ST.S6.from + 16, // f1559 附設：鏡頭到站
	big: bar60(13, 2), // f1575 夜間洗髮
} as const;

const SIZE = 170;
const STEP = -40; // 往右一字就往上 40px（＝往左一字往下 40px）
const STAGGER = 3;
const DUR = 12;
const DROP_AT = T.big - 3;
const N = Array.from(C60.S6.big).length;
const LANDED = DROP_AT + (N - 1) * STAGGER + DUR + 1; // 四個字都落定的下一格，換成可以踩的版本

const X = 50; // 「夜」左緣
const TOP = 515; // 「夜」的字框上緣（「髮」在它上面 120px）
const RIGHT = X + N * SIZE; // 「髮」右緣（站內 730）
const LEAD = 80; // 附設（60→80px：到站那半拍的主角）
const LEAD_TOP = TOP - 234; // 附設墨約在 y 293–365，離「髮」的墨 50px

// 小節 14–15 共 8 拍：髮 → 洗 → 間 → 夜，走兩趟
const STEPS = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => ({beat: bar60(14 + Math.floor(k / 4), (k % 4) + 1), i: N - 1 - (k % 4)}));

export const S6: React.FC<StationProps> = ({f}) => {
	if (f < T.lead - 8) return null;
	const wordStyle: React.CSSProperties = {position: 'absolute', left: X, top: TOP, width: N * SIZE};
	// 附設：到站那半拍從右側滑進 40px（outExpo 14 格）
	const lp = prog(f, T.lead - 3, 14, E.outExpo);
	const leadBox: React.CSSProperties = {position: 'absolute', right: 790 - RIGHT, top: LEAD_TOP, opacity: lp, transform: `translateX(${((1 - lp) * 40).toFixed(2)}px)`};
	const leadText: React.CSSProperties = {fontFamily: F.round, fontWeight: 500, fontSize: LEAD, lineHeight: 1.2, whiteSpace: 'pre'};
	return (
		<StationBox id="S6">
			<MoveBlur f={f}>
				{/* 夜間洗髮：落下 → 落定後換成會踩的同一排字 */}
				{f < LANDED ? (
					<StairDrop f={f} text={C60.S6.big} start={DROP_AT} size={SIZE} dir={-1} step={STEP} stagger={STAGGER} dur={DUR} style={wordStyle} />
				) : (
					<StairSteps f={f} text={C60.S6.big} size={SIZE} step={STEP} steps={STEPS} dip={24} style={wordStyle} />
				)}

				{/* 附設：右上，右緣對齊「髮」。畫在落字之上、外圍一圈雁黃描邊：「髮」從上方落下時是從「附設」後面滑過去，
				    兩塊墨不會糊在一起（先畫一層雁黃粗描邊當襯底，再疊實心墨字） */}
				{lp > 0 ? (
					<div style={leadBox}>
						<div style={{...leadText, position: 'absolute', right: 0, top: 0, color: G.yellow, WebkitTextStroke: `20px ${G.yellow}`}}>{C60.S6.lead}</div>
						<div style={{...leadText, position: 'relative', color: G.ink}}>{C60.S6.lead}</div>
					</div>
				) : null}
			</MoveBlur>
		</StationBox>
	);
};
