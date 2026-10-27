// 60 秒〈字的雁陣〉S6 用的小元件：「夜間洗髮」落定之後的腳步（只給 S6.tsx 用）
import React from 'react';
import {E, prog} from '../../../lib/motion';
import {F, G} from '../../theme';

/** 一拍一步：拍點前 3 格踩下（字重 900→800、往下沉 dip px），拍點那格踩到底，之後 16 格放開（outBack：回彈時微微高過原位）。
 *  回傳 {w: 字重用的 0..1, y: 位移用的（可略小於 0＝回彈）} */
export const press = (f: number, beat: number) => {
	const down = prog(f, beat - 3, 3, E.outCubic);
	return {w: down * (1 - prog(f, beat + 1, 16, E.outCubic)), y: down * (1 - prog(f, beat + 1, 16, E.outBack))};
};

/** 跟 kit 的 StairDrop（dir −1）落定後一模一樣的排法：字 i 靠右 (n−1−i)×size、往下 i×step、lineHeight 1.1。
 *  StairDrop 落完之後換成這個，才能讓每個字各自「踩一下」（StairDrop 只能換字重、不能單字位移）。 */
export const StairSteps: React.FC<{
	f: number;
	text: string;
	size: number;
	step: number;
	steps: {beat: number; i: number}[];
	dip?: number;
	style?: React.CSSProperties;
}> = ({f, text, size, step, steps, dip = 12, style}) => {
	const chars = Array.from(text);
	return (
		<div style={{position: 'relative', whiteSpace: 'pre', ...style}}>
			{chars.map((ch, i) => {
				let w = 0;
				let y = 0;
				for (const s of steps) {
					if (s.i !== i || f < s.beat - 4 || f > s.beat + 20) continue;
					const p = press(f, s.beat);
					w = p.w;
					y = p.y;
				}
				return (
					<span
						key={i}
						style={{
							position: 'absolute',
							right: (chars.length - 1 - i) * size,
							top: i * step + y * dip,
							fontFamily: F.round,
							fontSize: size,
							fontWeight: Math.round(900 - 100 * w),
							color: G.ink,
							lineHeight: 1.1,
						}}
					>
						{ch}
					</span>
				);
			})}
		</div>
	);
};
