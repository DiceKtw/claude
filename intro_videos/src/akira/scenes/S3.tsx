// Akira S3 經驗 936–1200（全域格數）
// 研究筆記的第三頁：三張經驗卡每拍一張升進預先畫好的虛線版位（960／990／1020），
// 三條細線從卡的右緣出發、沿右側走線、在下方匯成一點（1050–1080），文案落在 1110／1140。
// 936–960 由 Master 從左往右細線掃入（掃入時虛線版位已經在，掃過去就看得到）；1176 起 S4 溶接蓋上。
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SceneProps, useG} from '../../lib/Master';
import {AKIRA, F} from '../../lib/theme';
import {E, clamp, prog} from '../../lib/motion';
import {DrawPath, MaskRise, Push, Svg, Vignette} from '../../lib/components';
import {InfoCard, P, arcPts, cubicPts, poly} from './S3_parts';

const C = AKIRA;

// 時間（全域格數）
const CARD_B = [960, 990, 1020]; // 三張卡的拍點
const LINE_T0 = [1050, 1053, 1056]; // 三條線起筆（錯開 3 格）
const LINE_DUR = [30, 24, 18]; // 線越長畫越久（筆速一致）→ 最長那條在 1080 拍抵達匯點
const DOT = 1074; // 匯點小圓淡入（1080 拍已站穩）
const L1 = 1103; // 「把經驗，變成」：quiet 版是線性淡入，提前 7 格，1110 拍那格第一個字已六成以上、位置九成
const L2 = 1133; // 「一個適合你的答案」：1140 拍
const HOLD = 1140; // 定格：卡片錯開相位上下漂 ±2px
const PUSH0 = 960; // 慢推從第一張卡落定就開始，1080–1103 匯點之後到文案之前也不會停住
const PUSH1 = 1200;

// 版面
const CARD = {x: 110, w: 860, h: 170};
const CARD_Y = [420, 615, 810];
const CARDS = [
	{idx: '01', tag: 'HAIR', title: '髮質', note: '軟・硬・細・粗'},
	{idx: '02', tag: 'FACE', title: '臉型', note: '圓・長・方・心形'},
	{idx: '03', tag: 'LIFE', title: '生活習慣', note: '上班・運動・整理時間'},
];
const MEET: P = [540, 1030]; // 匯點
// 走線：外圈套內圈（卡 1 走最外圈），右側直線 10px 一道、下方橫線 10px 一道，轉角同心
const LANE_X = [1006, 996, 986];
const LANE_Y = [1024, 1014, 1004];
const R_TOP = 12;
const R_BOT = [36, 26, 16];
const MERGE_X = 730; // 從這裡開始收攏
const TY1 = 1068;
const TY2 = 1146;

const cardDy = (g: number, i: number) => {
	const amp = 2 * prog(g, HOLD, 30, E.inOutSine);
	return amp * Math.sin(((g - HOLD) / 120) * Math.PI * 2 + (i * Math.PI * 2) / 3);
};

const route = (i: number, dy: number) => {
	const sy = CARD_Y[i] + CARD.h / 2 + dy;
	const xv = LANE_X[i];
	const yh = LANE_Y[i];
	const rb = R_BOT[i];
	const pts: P[] = [
		[970, sy],
		...arcPts(xv - R_TOP, sy + R_TOP, R_TOP, -Math.PI / 2, 0, 8),
		...arcPts(xv - rb, yh - rb, rb, 0, Math.PI / 2, 12),
		...cubicPts([MERGE_X, yh], [MERGE_X - 100, yh], [MEET[0] + 90, MEET[1]], MEET, 28),
	];
	return poly(pts);
};

export const S3: React.FC<SceneProps> = ({from}) => {
	const g = useG(from);

	const dys = [0, 1, 2].map((i) => cardDy(g, i));
	const lines = [0, 1, 2].map((i) => ({r: route(i, dys[i]), p: prog(g, LINE_T0[i], LINE_DUR[i], E.inOutSine)}));
	const dotP = prog(g, DOT, 12, E.outCubic);

	return (
		<AbsoluteFill style={{background: C.ink}}>
			<Push f={g} from={PUSH0} to={PUSH1} amount={0.016} originX={540} originY={820}>
				{/* 版位：虛線圓角框（卡片還沒來之前就畫好，Master 掃入時看得到；卡升進來就蓋住） */}
				<Svg>
					{CARD_Y.map((y, i) => {
						// 卡升起時版位還在（看得出「卡落進格子」），站穩後版位收掉，定格漂動時不會露出虛線
						const gone = prog(g, CARD_B[i] + 8, 18, E.inOutSine);
						if (gone >= 1) return null;
						return (
							<rect
								key={i}
								x={CARD.x + 0.75}
								y={y + 0.75}
								width={CARD.w - 1.5}
								height={CARD.h - 1.5}
								rx={18}
								fill="none"
								stroke={C.muted}
								strokeWidth={C.hairline}
								strokeDasharray="6 7"
								opacity={0.34 * (1 - gone)}
							/>
						);
					})}
				</Svg>

				{/* 三張經驗卡 */}
				{CARDS.map((c, i) => (
					<InfoCard key={c.idx} f={g} b={CARD_B[i]} x={CARD.x} y={CARD_Y[i]} w={CARD.w} h={CARD.h} idx={c.idx} tag={c.tag} title={c.title} note={c.note} dy={dys[i]} />
				))}

				{/* 三條細線匯成一點 */}
				<Svg>
					{lines.map(({r, p}, i) => {
						if (p <= 0) return null;
						const start = r.at(0);
						const tip = r.at(p);
						const tipOp = clamp((g - LINE_T0[i]) / 3) * clamp((LINE_T0[i] + LINE_DUR[i] - g) / 4);
						const portOp = prog(g, LINE_T0[i] - 2, 10, E.outCubic);
						return (
							<g key={i}>
								<DrawPath d={r.d} p={p} color={C.accent} width={C.hairline} />
								{/* 出口：卡右緣上的小空心圈 */}
								<circle cx={start[0]} cy={start[1]} r={4.5} fill={C.ink} stroke={C.accent} strokeWidth={C.hairline} opacity={portOp} />
								{tipOp > 0 ? <circle cx={tip[0]} cy={tip[1]} r={3} fill={C.accent} opacity={tipOp} /> : null}
							</g>
						);
					})}
					{dotP > 0 ? <circle cx={MEET[0]} cy={MEET[1]} r={5} fill={C.accent} opacity={dotP} /> : null}
				</Svg>

				{/* 文案（置中，接在匯點正下方） */}
				<div style={{position: 'absolute', left: 0, top: TY1, width: 1080, display: 'flex', justifyContent: 'center'}}>
					<MaskRise segments="把經驗，變成" start={L1} f={g} size={64} color={C.paper} weight={700} family={F.sans} quiet stagger={3} dur={16} lineHeight={1.18} />
				</div>
				<div style={{position: 'absolute', left: 0, top: TY2, width: 1080, display: 'flex', justifyContent: 'center'}}>
					<MaskRise
						segments={[{text: '一個'}, {text: '適合你', color: C.accent, weight: 700}, {text: '的答案'}]}
						start={L2}
						f={g}
						size={64}
						color={C.paper}
						weight={700}
						family={F.sans}
						quiet
						stagger={3}
						dur={16}
						lineHeight={1.18}
					/>
				</div>
			</Push>
			<Vignette strength={0.35} />
		</AbsoluteFill>
	);
};
