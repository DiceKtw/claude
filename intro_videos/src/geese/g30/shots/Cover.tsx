// 30 秒〈一格一位〉封面（另外輸出 PNG，不進影片）
// 開場構圖放大成海報：紙底；右邊兩欄直排巨字（C30.A.line），左邊那一格（黃底墨框、格裡一個「客」）。
// 字是「一個字一格」排的：那一格的大小剛好等於一個字格，對齊在「只約一位」的「位」旁邊——一位＝這一格。
// 標點只佔半格高、字形縮成 0.55 倍（在字格正中，不會像兩顆大黑點），整欄放得進 IG 格狀縮圖 3:4 的裁切範圍（y 240–1680），上下各留約 80px。
// 左上角一個「雁沙龍」直排名牌框（跟 C 段名牌同一個版式）：被分享出去時看得出是哪家店，也平衡左上的空白。
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ALL_TEXT, C30} from '../../copy';
import {ensureGeeseFonts} from '../../fonts';
import {F, G} from '../../theme';
import {PaperFast} from './A_parts';

ensureGeeseFonts(ALL_TEXT);

const S = 285; // 巨字字級（一個字格）
const PUNCT = 0.5; // 標點佔的字格高
const PUNCT_SIZE = 0.55; // 標點字形的字級（字格的倍數）
const isPunct = (ch: string) => /[，。、]/.test(ch);
const COL_GAP = 26;
const RIGHT = 1030; // 右欄右緣
// 兩欄：直排由右往左讀（第一欄在右）
const COLS = C30.A.line.replace('，', '，\n').split('\n');
const colH = (t: string) => Array.from(t).reduce((h, ch) => h + (isPunct(ch) ? PUNCT : 1) * S, 0);
const TOP = Math.round((1920 - Math.max(...COLS.map(colH))) / 2);
// 那一格：一個字格大小，跟左欄的「位」同一列
const LEFT_COL = COLS[1];
const WEI = Array.from(LEFT_COL).findIndex((ch) => ch === '位');
const CELL = {x: 60, y: TOP + WEI * S, s: S, b: 10};
// 名牌框：左上角，上緣齊巨字欄的上緣
const NAME = {x: 60, y: TOP, w: 170, h: 420, size: 110};

/** 一欄直排：每個字自己一格（直排字形，標點自動用直排位置） */
const Column: React.FC<{text: string; x: number}> = ({text, x}) => {
	let y = TOP;
	return (
		<>
			{Array.from(text).map((ch, i) => {
				const h = (isPunct(ch) ? PUNCT : 1) * S;
				const fs = (isPunct(ch) ? PUNCT_SIZE : 1) * S;
				const top = y;
				y += h;
				return (
					<div key={i} style={{position: 'absolute', left: x, top, width: S, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
						<div
							lang="zh-Hant-TW"
							style={{
								writingMode: 'vertical-rl',
								textOrientation: 'upright',
								fontFamily: F.round,
								fontWeight: 900,
								fontSize: fs,
								lineHeight: `${fs}px`,
								width: fs,
								height: fs,
								flex: 'none',
								color: G.ink,
								whiteSpace: 'pre',
							}}
						>
							{ch}
						</div>
					</div>
				);
			})}
		</>
	);
};

export const Cover: React.FC = () => {
	const inner = CELL.s - 2 * CELL.b;
	const ke = Math.round(inner * 0.74);
	return (
		<AbsoluteFill>
			<PaperFast />
			{/* 右欄：一個小時，　左欄：只約一位。 */}
			<Column text={COLS[0]} x={RIGHT - S} />
			<Column text={COLS[1]} x={RIGHT - 2 * S - COL_GAP} />
			{/* 名牌：雁沙龍（直排墨框） */}
			<div
				style={{
					position: 'absolute',
					left: NAME.x,
					top: NAME.y,
					width: NAME.w,
					height: NAME.h,
					boxSizing: 'border-box',
					border: `10px solid ${G.ink}`,
					background: G.paper,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<div
					lang="zh-Hant-TW"
					style={{writingMode: 'vertical-rl', textOrientation: 'upright', fontFamily: F.round, fontWeight: 900, fontSize: NAME.size, lineHeight: 1.05, letterSpacing: '0.04em', color: G.ink, whiteSpace: 'pre'}}
				>
					{C30.C.name}
				</div>
			</div>
			{/* 那一格 */}
			<div style={{position: 'absolute', left: CELL.x, top: CELL.y, width: CELL.s, height: CELL.s, boxSizing: 'border-box', border: `${CELL.b}px solid ${G.ink}`, background: G.yellow}}>
				<div
					lang="zh-Hant-TW"
					style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.round, fontWeight: 900, fontSize: ke, lineHeight: 1, color: G.ink}}
				>
					{C30.A.ke}
				</div>
			</div>
		</AbsoluteFill>
	);
};
