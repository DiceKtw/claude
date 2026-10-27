// 60 秒〈字的雁陣〉S5・Google 4.9★（小節 10–12，f1157–1543）　錨點 (2800,4000)＝「>」頂點
// f1189 GOOGLE 擦出 → f1221 4.9 字寬從 50% 撐到 150%（¹ 掛在右上角被撐出去）→ f1254 ★ 從上方落下站上基線
// → f1286 2,400+ 則評論 → f1350 註腳 → 小節 12 鏡頭停在頂點，4.9 每拍吸一口（字寬 150→142→150）。
// 版面（站內座標 0–790 × 0–978）：這站是「>」的頂點，字塊本身也排成一個小「>」：
//   GOOGLE 與 4.9 靠左起筆 → ★ 是全站最右的一點（頂點）→ 評論數與 ★ 靠右對齊 → 註腳折回左下（下一站的方向）。
// 鏡頭停留會往右下漂 42/60px＋慢推 1.2%，所以左緣 ≥ 50；字塊上下置中在閱讀窗（停留中段）；右緣 ≤ 777。
import React from 'react';
import {C60} from '../../copy';
import {F, G, bar60} from '../../theme';
import {MonoTag, Rise, StationBox, StationProps} from '../kit';
import {MoveBlur, ROW, RatingRow} from './S5_parts';
import {Away} from './Away';

const T = {
	brand: bar60(10, 2), // f1189 GOOGLE
	num: bar60(10, 3), // f1221 4.9 撐開
	star: bar60(10, 4), // f1254 ★ 碰地
	count: bar60(11, 1), // f1286 2,400+ 則評論
	foot: bar60(11, 3), // f1350 註腳
	pumps: [bar60(12, 1), bar60(12, 2), bar60(12, 3), bar60(12, 4)], // f1414 / 1446 / 1479 / 1511
} as const;

const X0 = 50; // 左緣（GOOGLE、4.9、註腳）
const ROW_X = X0 - ROW.inkLeft; // 讓 4 的墨左緣對齊 X0
const Y = {brand: 272, row: 316, count: 560, foot: 772} as const;
const RIGHT = ROW_X + ROW.starRight; // ★ 墨右緣（全站最右）
const COUNT_SIZE = 88;

export const S5: React.FC<StationProps> = ({f}) => {
	if (f < T.brand - 6) return null;
	return (
		<StationBox id="S5">
			{/* 整合：鏡頭到 S6 後收字（右上角不留半截註腳），拉遠揭曉再回來（見 Away.tsx） */}
			<Away f={f} next="S6">
				<MoveBlur f={f}>
					{/* GOOGLE：Mono 小標擦出 */}
					<MonoTag f={f} at={T.brand - 2} text={C60.S5.brand} size={40} style={{position: 'absolute', left: X0 - 2, top: Y.brand, lineHeight: 1}} />

					{/* 4.9 ¹ ★ */}
					<RatingRow f={f} x={ROW_X} y={Y.row} stretchAt={T.num - 3} starHit={T.star} pumps={T.pumps} />

					{/* 2,400+ 則評論：右緣對齊 ★，數字先到、則評論晚 3 格 */}
					<div style={{position: 'absolute', right: 790 - RIGHT - 2, top: Y.count, display: 'flex', alignItems: 'baseline', whiteSpace: 'pre', color: G.ink}}>
						<Rise f={f} at={T.count - 3} dy={26}>
							<div style={{fontFamily: F.num, fontWeight: 900, fontSize: COUNT_SIZE, fontStretch: '125%', lineHeight: 1}}>{C60.S5.count.split(' ')[0]}</div>
						</Rise>
						<Rise f={f} at={T.count} dy={26} style={{marginLeft: 18}}>
							<div style={{fontFamily: F.round, fontWeight: 500, fontSize: 56, lineHeight: 1}}>{C60.S5.count.split(' ').slice(1).join(' ')}</div>
						</Rise>
					</div>

					{/* 註腳：折回左下 */}
					<MonoTag f={f} at={T.foot - 2} text={C60.S5.foot} size={34} style={{position: 'absolute', left: X0 - 2, top: Y.foot, lineHeight: 1, opacity: 0.7}} />
				</MoveBlur>
			</Away>
		</StationBox>
	);
};
