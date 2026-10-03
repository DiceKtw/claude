// Akira S4 信任 1176–1440（全域格數）
// 研究筆記的第四頁：一張月曆線稿先描出來（外框 → 橫線由上往下 → 直線由左往右，1200–1240），
// 1230–1350 每 4 格預約一天（米白 15% 填色＋中心小點；剛填的那格先亮一圈細框再退掉，像游標一路走過去），
// rng(7) 挑的 3 天留空（只有空心小圈），文案落在 1360／1390。
// 1176–1200 由 Master 溶接進場；1416 起 S5 溶接蓋上。
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SceneProps, useG} from '../../lib/Master';
import {AKIRA, F} from '../../lib/theme';
import {E, alpha, prog} from '../../lib/motion';
import {DrawPath, MaskRise, Push, Svg, Vignette, drift} from '../../lib/components';
import {FadeRise, monoStyle} from './S3_parts';
import {CAL, COL_W, DAYS, LEAD, N_DAYS, OPEN_DAYS, ROW_H, ROW_Y0, TRAIL_FROM, cellBox, hatch} from './S4_parts';

const C = AKIRA;

// 時間（全域格數）
// 整合：1176–1200 溶接露出的 S4 原本到 1196 才有東西（1194–1201 幾乎全黑），
// 線稿整段提前 12 格：溶接中段外框已在描，S3 的卡淡出時月曆同時長出來；直線剛好在 1200 拍起筆
const FRAME0 = 1184; // 外框起筆
const FRAME_DUR = 18;
const HL0 = 1194; // 橫線：由上往下每 3 格一條
const VL0 = 1200; // 直線：由左往右每 3 格一條
const LINE_DUR = 14;
const HEAD0 = 1202; // 欄頭小字：跟著直線由左往右
const HATCH0 = 1214; // 不屬於這個月的格子：淡斜線
const LEGEND = 1227; // 右上 RESERVED（提前 3 格，1230 拍那格已看得到）
const FILL0 = 1230; // 每 4 格預約一天
const FILL_STEP = 4;
const L1 = 1353; // 「客人一直回來，」（1360 站穩大半；quiet 線性淡入，提前 7 格）
const L2 = 1383; // 「是因為信任」（1390）
const PUSH0 = 1200;
const PUSH1 = 1440;
const DRIFT0 = 1350;
const DRIFT1 = 1440;

// 版面
const TX = 110;
const TY1 = 1048;
const TY2 = 1132;
const INSET = 6;

const OPEN = new Set(OPEN_DAYS);
const RECT_D = `M ${CAL.x0} ${CAL.y0} H ${CAL.x1} V ${CAL.y1} H ${CAL.x0} Z`;

export const S4: React.FC<SceneProps> = ({from}) => {
	const g = useG(from);

	const frameP = prog(g, FRAME0, FRAME_DUR, E.inOutSine);
	const hY = Array.from({length: CAL.rows}, (_, r) => ROW_Y0 + r * ROW_H); // 欄頭分隔線＋4 條列分隔線
	const vX = Array.from({length: CAL.cols - 1}, (_, c) => CAL.x0 + (c + 1) * COL_W);
	const hatchP = prog(g, HATCH0, 20, E.outCubic);
	const legendP = prog(g, LEGEND, 20, E.outCubic);

	const calDx = drift(g, DRIFT0, DRIFT1, -6);
	const txtDx = drift(g, DRIFT0, DRIFT1, 8);

	const outCells = [...Array.from({length: LEAD}, (_, i) => i), ...Array.from({length: CAL.cols * CAL.rows - TRAIL_FROM}, (_, i) => TRAIL_FROM + i)];

	return (
		<AbsoluteFill style={{background: C.ink}}>
			<Push f={g} from={PUSH0} to={PUSH1} amount={0.018} originX={540} originY={800}>
				<AbsoluteFill style={{transform: `translateX(${calDx}px)`}}>
					<Svg>
						{/* 不屬於這個月的格子：淡斜線（月曆的慣用記號） */}
						{hatchP > 0
							? outCells.map((i) => {
									const b = cellBox(i);
									return (
										<g key={`h${i}`} opacity={0.2 * hatchP}>
											{hatch(b.x + 10, b.y + 10, b.w - 20, b.h - 20, 14).map(([x1, y1, x2, y2], k) => (
												<line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.muted} strokeWidth={C.hairline} />
											))}
										</g>
									);
								})
							: null}

						{/* 一天一天預約上去 */}
						{Array.from({length: N_DAYS}, (_, k) => {
							const t = FILL0 + k * FILL_STEP;
							if (g < t - 1) return null;
							const b = cellBox(LEAD + k);
							const open = OPEN.has(k);
							const fillP = prog(g, t - 1, 10, E.outCubic);
							const dotP = prog(g, t + 1, 10, E.outCubic);
							const hot = 1 - prog(g, t - 1, 22, E.outCubic);
							const rx = b.x + INSET;
							const ry = b.y + INSET;
							const rw = b.w - INSET * 2;
							const rh = b.h - INSET * 2;
							return (
								<g key={`d${k}`}>
									{!open ? <rect x={rx} y={ry} width={rw} height={rh} rx={6} fill={C.accent} opacity={0.15 * fillP} /> : null}
									{hot > 0.01 ? (
										<rect x={rx} y={ry} width={rw} height={rh} rx={6} fill="none" stroke={open ? C.muted : C.accent} strokeWidth={C.hairline} opacity={hot * (open ? 0.7 : 0.9)} />
									) : null}
									{open ? (
										<circle cx={b.cx} cy={b.cy} r={4} fill="none" stroke={C.muted} strokeWidth={C.hairline} opacity={dotP} />
									) : (
										<circle cx={b.cx} cy={b.cy} r={3} fill={C.accent} opacity={dotP} />
									)}
								</g>
							);
						})}

						{/* 線稿：外框 → 橫線 → 直線（全部 1.5px 暖灰） */}
						<DrawPath d={RECT_D} p={frameP} color={C.muted} width={C.hairline} cap="butt" />
						{hY.map((y, r) => (
							<DrawPath key={`hl${r}`} d={`M ${CAL.x0} ${y} H ${CAL.x1}`} p={prog(g, HL0 + r * 3, LINE_DUR, E.outCubic)} color={C.muted} width={C.hairline} cap="butt" />
						))}
						{vX.map((x, c) => (
							<DrawPath key={`vl${c}`} d={`M ${x} ${CAL.y0} V ${CAL.y1}`} p={prog(g, VL0 + c * 3, LINE_DUR, E.outCubic)} color={C.muted} width={C.hairline} cap="butt" />
						))}
					</Svg>

					{/* 欄頭 */}
					{DAYS.map((d, c) => (
						<FadeRise key={d} f={g} start={HEAD0 + c * 3} dur={18} rise={16} style={{left: CAL.x0 + c * COL_W, top: CAL.y0 + (CAL.head - 25) / 2, width: COL_W, display: 'flex', justifyContent: 'center'}}>
							<div style={{...monoStyle(18, 0.2), lineHeight: '25px', paddingLeft: '0.2em'}}>{d}</div>
						</FadeRise>
					))}

					{/* 右上圖例：RESERVED */}
					{legendP > 0 ? (
						<div
							style={{
								position: 'absolute',
								right: 1080 - CAL.x1,
								top: 388,
								display: 'flex',
								alignItems: 'center',
								gap: 14,
								opacity: legendP,
								transform: `translateY(${(1 - legendP) * 16}px)`,
							}}
						>
							<svg width={22} height={22} style={{overflow: 'visible'}}>
								<rect x={0.75} y={0.75} width={20.5} height={20.5} rx={4} fill={alpha(C.accent, 0.15)} stroke={C.muted} strokeWidth={C.hairline} />
								<circle cx={11} cy={11} r={3} fill={C.accent} />
							</svg>
							<div style={{...monoStyle(20, 0.3), marginRight: '-0.3em'}}>RESERVED</div>
						</div>
					) : null}
				</AbsoluteFill>

				{/* 文案 */}
				<AbsoluteFill style={{transform: `translateX(${txtDx}px)`}}>
					<div style={{position: 'absolute', left: TX, top: TY1}}>
						<MaskRise segments="客人一直回來，" start={L1} f={g} size={68} color={C.paper} weight={700} family={F.sans} quiet stagger={3} dur={16} lineHeight={1.18} />
					</div>
					<div style={{position: 'absolute', left: TX, top: TY2}}>
						<MaskRise
							segments={[{text: '是因為'}, {text: '信任', color: C.accent, weight: 700}]}
							start={L2}
							f={g}
							size={68}
							color={C.paper}
							weight={700}
							family={F.sans}
							quiet
							stagger={3}
							dur={16}
							lineHeight={1.18}
						/>
					</div>
				</AbsoluteFill>
			</Push>
			<Vignette strength={0.35} />
		</AbsoluteFill>
	);
};
