// 安格斯 S4 成果 1064–1320（paper 底）
// 座標軸 → 紅色平線回來了（收入 +0%）→ 1110 落拍往上彎 → 成長曲線一路畫到右上（間距圖淡點）
// → 1170 技術球撞上頂端 → 三條量測引線 16 分音符連發 → 文案落拍 1200／1230 → 球每拍在頂端小跳
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SceneProps, useG} from '../../lib/Master';
import {ANGUS, F} from '../../lib/theme';
import {E, alpha, beatsFrom, clamp, lerp, mixHex, prog} from '../../lib/motion';
import {Abs, ImpactFlicks, Leader, MaskRise, Push, Svg, drift, ghostFrames} from '../../lib/components';
import {OutWrap} from '../../lib/transitions';
import {TR} from '../timeline';
import {S3} from './S3';
import {Marker} from './S1_parts';
import {
	BALL_R,
	BEND_AT,
	BEND_X,
	CH,
	CURVE_START,
	FLAT_Y,
	MonoTag,
	READS,
	RULER_X,
	TIP,
	TIP_AT,
	UpTick,
	curveAt,
	dipAt,
	headU,
	hopAt,
	linePath,
	passFrame,
	squashAt,
} from './S4_parts';

const C = ANGUS;
const RED = C.alert ?? C.accent;

// 版面參考：淡格線
const GRID_X = [300, 460, 620, 780, 940];
const GRID_Y = [1044, 938, 832, 726, 620];
// 軸上刻度
const TICK_X = [220, 300, 380, 460, 540, 620, 700, 780, 860, 940];
const TICK_Y = [1097, 1044, 991, 938, 885, 832, 779, 726, 673, 620];
// 間距圖：曲線畫出時每 4 格留一個淡點
const SPACING = beatsFrom(BEND_AT, 16, 4); // 1110…1170
const LINE1_AT = 1200; // 主文案第 1 行落拍
const LINE2_AT = 1230; // 第 2 行落拍（＋螢光筆底條）
const SLIDE = TR.slideS3; // S3 往左甩出（1064–1080），在 S4 上層重畫

// 軸線頭（畫出進度）
const vHead = (f: number) => lerp(CH.base, CH.top, prog(f, 1080, 20, E.outExpo)); // 縱軸由下往上
const hHead = (f: number) => lerp(CH.x0, CH.x1, prog(f, 1082, 20, E.outExpo)); // 橫軸由左往右
const rulerHead = (f: number) => lerp(CH.base, 640, prog(f, 1150, 22, E.outExpo));

export const S4: React.FC<SceneProps> = ({from}) => {
	const g = useG(from);

	/* ---------- 軸 ---------- */
	const vy = vHead(g);
	const hx = hHead(g);

	/* ---------- 紅色平線 → 成長曲線 ---------- */
	const flatP = prog(g, 1086, 20, E.outExpo);
	const dip = dipAt(g);
	const u = headU(g);
	const d = linePath(flatP, u, dip);
	// 顏色從彎點往兩邊變：曲線先變 accent，平線跟著變
	const cHead = prog(g, BEND_AT + 2, 22, E.inOutSine);
	const cBend = prog(g, BEND_AT + 6, 26, E.inOutSine);
	const cTail = prog(g, BEND_AT + 14, 30, E.inOutSine);
	const head = curveAt(u);
	const headV = Math.hypot(curveAt(headU(g + 0.5)).x - curveAt(headU(g - 0.5)).x, curveAt(headU(g + 0.5)).y - curveAt(headU(g - 0.5)).y);
	const penK = g >= CURVE_START ? prog(g, CURVE_START, 6, E.outBack) : 0;

	// 技術球：撞頂後留在端點，每拍小跳（S0 那顆球終於爬到收入曲線的頂端）
	const atTip = g >= TIP_AT;
	const sq = squashAt(g);
	const ballX = atTip ? TIP.x : head.x;
	const ballY = atTip ? TIP.y - hopAt(g) : head.y;
	const ballRx = BALL_R * penK * (1 + 0.32 * sq);
	const ballRy = BALL_R * penK * (1 - 0.3 * sq);

	// 收入 +0%：彎上去之後劃掉、退成灰（ink 62%，手機上還讀得到）
	const tagK = prog(g, BEND_AT + 8, 16, E.inOutSine);
	const tagCol = mixHex(RED, C.ink, tagK);
	const tagOp = lerp(1, 0.62, tagK);
	const strikeP = prog(g, BEND_AT + 6, 12, E.outExpo);

	// 筆頭下方的時間游標（虛線落到橫軸）
	const cursorOp = prog(g, CURVE_START, 6, E.outCubic) * (1 - prog(g, TIP_AT + 2, 16, E.inOutSine));

	/* ---------- 視差、定格 ---------- */
	const chartDx = drift(g, LINE1_AT - 4, 1320, -8);
	const textDx = drift(g, LINE1_AT - 4, 1320, 8);
	const markP = prog(g, LINE2_AT + 2, 16, E.outExpo);

	return (
		<AbsoluteFill style={{background: C.paper}}>
			<Push f={g} from={LINE1_AT} to={1320} amount={0.02} originX={540} originY={860}>
				<AbsoluteFill style={{transform: `translateX(${chartDx.toFixed(2)}px)`}}>
					<Svg>
						<defs>
							<linearGradient id="angS4line" gradientUnits="userSpaceOnUse" x1={CH.x0} y1={0} x2={TIP.x} y2={0}>
								<stop offset={0} stopColor={mixHex(RED, C.accent, cTail)} />
								<stop offset={(BEND_X - CH.x0) / (TIP.x - CH.x0)} stopColor={mixHex(RED, C.accent, cBend)} />
								<stop offset={1} stopColor={mixHex(RED, C.accent, cHead)} />
							</linearGradient>
						</defs>

						{/* 淡格線（S3 往左甩出時就開始長） */}
						{GRID_X.map((x, j) => {
							const p = prog(g, 1064 + j * 2, 26, E.outExpo);
							if (p <= 0) return null;
							return <line key={`gx${j}`} x1={x} y1={CH.base} x2={x} y2={lerp(CH.base, CH.top, p)} stroke={alpha(C.ink, 0.07)} strokeWidth={1} />;
						})}
						{GRID_Y.map((y, j) => {
							const p = prog(g, 1068 + j * 2, 26, E.outExpo);
							if (p <= 0) return null;
							return <line key={`gy${j}`} x1={CH.x1} y1={y} x2={lerp(CH.x1, CH.x0, p)} y2={y} stroke={alpha(C.ink, 0.07)} strokeWidth={1} />;
						})}

						{/* 座標軸 */}
						{g >= 1080 ? <line x1={CH.x0} y1={CH.base} x2={CH.x0} y2={vy} stroke={C.ink} strokeWidth={2} strokeLinecap="square" /> : null}
						{g >= 1082 ? <line x1={CH.x0} y1={CH.base} x2={hx} y2={CH.base} stroke={C.ink} strokeWidth={2} strokeLinecap="square" /> : null}
						{TICK_X.map((x) => {
							if (hx < x - 0.5) return null;
							const t = prog(g, passFrame(hHead, x, 1082, 1110), 8, E.outBack);
							return <line key={`tx${x}`} x1={x} y1={CH.base} x2={x} y2={CH.base + 9 * t} stroke={C.ink} strokeWidth={2} />;
						})}
						{TICK_Y.map((y) => {
							if (vy > y + 0.5) return null;
							const t = prog(g, passFrame((f) => -vHead(f), -y, 1080, 1110), 8, E.outBack);
							return <line key={`ty${y}`} x1={CH.x0} y1={y} x2={CH.x0 - 9 * t} y2={y} stroke={C.ink} strokeWidth={2} />;
						})}
						{/* 軸端小箭頭 */}
						{prog(g, 1094, 8, E.outBack) > 0 ? (
							<g transform={`translate(${CH.x0} ${CH.top - 2}) scale(${prog(g, 1094, 8, E.outBack)})`}>
								<polyline points="-7,8 0,0 7,8" fill="none" stroke={C.ink} strokeWidth={2} />
							</g>
						) : null}
						{prog(g, 1097, 8, E.outBack) > 0 ? (
							<g transform={`translate(${CH.x1 + 2} ${CH.base}) scale(${prog(g, 1097, 8, E.outBack)})`}>
								<polyline points="-8,-7 0,0 -8,7" fill="none" stroke={C.ink} strokeWidth={2} />
							</g>
						) : null}

						{/* 右側量測細軸 */}
						{g >= 1150 ? (
							<g>
								<line x1={RULER_X} y1={CH.base} x2={RULER_X} y2={rulerHead(g)} stroke={alpha(C.ink, 0.35)} strokeWidth={1.5} />
								{Array.from({length: 18}, (_, k) => CH.base - 14 - k * 28).map((y, k) => {
									const ry = rulerHead(g);
									if (ry > y) return null;
									const len = clamp((y - ry) / 24);
									return (
										<line
											key={k}
											x1={RULER_X}
											y1={y}
											x2={RULER_X - (k % 3 === 0 ? 10 : 5) * len}
											y2={y}
											stroke={alpha(C.ink, 0.3)}
											strokeWidth={1.5}
										/>
									);
								})}
							</g>
						) : null}

						{/* 筆頭的時間游標：虛線落到橫軸＋橫軸上的小方塊 */}
						{cursorOp > 0.01 && u > 0 ? (
							<g opacity={cursorOp}>
								<line x1={head.x} y1={head.y + 12} x2={head.x} y2={CH.base - 4} stroke={alpha(C.ink, 0.28)} strokeWidth={1.5} strokeDasharray="4 6" />
								<rect x={head.x - 4} y={CH.base - 4} width={8} height={8} fill={C.ink} />
							</g>
						) : null}

						{/* 平線＋成長曲線（一條路徑，顏色從彎點往兩邊變） */}
						{flatP > 0 ? <path d={d} fill="none" stroke="url(#angS4line)" strokeWidth={8} strokeLinecap="butt" strokeLinejoin="round" /> : null}
						{/* 平線起點小端帽 */}
						{flatP > 0 ? (
							<line
								x1={CH.x0 + 1}
								y1={FLAT_Y - 9 * prog(g, 1085, 8, E.outBack)}
								x2={CH.x0 + 1}
								y2={FLAT_Y + 9 * prog(g, 1085, 8, E.outBack)}
								stroke={mixHex(RED, C.accent, cTail)}
								strokeWidth={2}
							/>
						) : null}

						{/* 間距圖：每 4 格留一個淡點（招牌手法，只用這一次） */}
						{SPACING.map((F0) => {
							if (g < F0) return null;
							const p = curveAt(headU(F0));
							const k = prog(g, F0, 7, E.outBack);
							return <circle key={F0} cx={p.x} cy={p.y} r={5.5 * k} fill={alpha(C.ink, 0.3)} />;
						})}

						{/* 技術球（筆頭）＋快的時候拖殘影 */}
						{penK > 0 && !atTip && headV > 6
							? ghostFrames(g, 3, 1.1).map((gh, i) => {
									const p = curveAt(headU(gh.f));
									return <circle key={i} cx={p.x} cy={p.y} r={BALL_R * 0.94} fill={C.accent} opacity={gh.o * clamp((headV - 6) / 20)} />;
								})
							: null}
						{penK > 0 ? <ellipse cx={ballX} cy={ballY} rx={Math.max(0.01, ballRx)} ry={Math.max(0.01, ballRy)} fill={C.accent} /> : null}
						{/* 1170 撞頂那一格：球頂踢出小撇 */}
						<ImpactFlicks x={TIP.x} y={TIP.y - BALL_R + 2} f={g} start={TIP_AT - 1} dur={11} color={C.accent} width={3} spread={14} len={18} />

						{/* 量測引線：曲線上的點 → 右側細軸，每拍一條 */}
						{READS.map((r) => {
							const dot = prog(g, r.b - 1, 9, E.outBack);
							const lp = prog(g, r.b, 12, E.outExpo);
							const ul = prog(g, r.b + 2, 14, E.outExpo);
							if (dot <= 0) return null;
							const ulX0 = r.x - 150;
							return (
								<g key={r.b}>
									<Leader x1={r.x + 10} y1={r.y} x2={RULER_X} y2={r.y} p={lp} color={alpha(C.ink, 0.55)} width={2} dash="6 7" dotStart={false} />
									{ul > 0 ? <line x1={r.x - 10} y1={r.y} x2={lerp(r.x - 10, ulX0, ul)} y2={r.y} stroke={C.ink} strokeWidth={2} /> : null}
									<circle cx={r.x} cy={r.y} r={8 * dot} fill={C.paper} stroke={C.ink} strokeWidth={2.5} />
									<UpTick x={RULER_X} y={r.y} f={g} at={r.b + 5} />
								</g>
							);
						})}
					</Svg>

					{/* 軸端等寬小標 */}
					<MonoTag x={CH.x1} y={CH.base + 34} p={prog(g, 1096, 14, E.outExpo)} color={alpha(C.ink, 0.6)} align="right">
						時間 →
					</MonoTag>
					<MonoTag x={CH.x0 + 16} y={CH.top + 6} p={prog(g, 1094, 10, E.outExpo)} color={alpha(C.ink, 0.6)}>
						↑
					</MonoTag>

					{/* 收入 +0%（呼應 S0），彎上去之後被劃掉 */}
					<Abs x={CH.x0 + 16} y={FLAT_Y - 58} style={{opacity: tagOp}}>
						<MaskRise segments="收入 +0%" start={1092} f={g} size={34} color={tagCol} weight={500} family={F.mono} stagger={2} dur={14} />
					</Abs>
					{strikeP > 0 ? (
						<Svg>
							<line
								x1={CH.x0 + 16 + 86}
								y1={FLAT_Y - 58 + 21}
								x2={CH.x0 + 16 + 86 + 68 * strikeP}
								y2={FLAT_Y - 58 + 21}
								stroke={C.ink}
								strokeWidth={2.5}
							/>
						</Svg>
					) : null}

					{/* 量測標籤：收入 ↑／客戶 ↑／業績 ↑ */}
					{READS.map((r) => (
						<div key={r.b} style={{position: 'absolute', right: 1080 - (r.x - 22), top: r.y - 8 - 34 * 1.18}}>
							<MaskRise
								segments={r.text + ' ↑'}
								start={r.b - 2}
								f={g}
								size={34}
								color={C.ink}
								weight={700}
								family={F.sans}
								stagger={2}
								dur={14}
							/>
						</div>
					))}
				</AbsoluteFill>

				{/* 文案（主角）：1200／1230 正拍落下；第 2 行 ink 字＋accent 螢光筆底條（米白底上不用橘字） */}
				<AbsoluteFill style={{transform: `translateX(${textDx.toFixed(2)}px)`}}>
					<Abs x={110} y={398}>
						<MaskRise
							segments="收入、客戶、業績，"
							start={LINE1_AT - 4}
							f={g}
							size={84}
							color={C.ink}
							weight={900}
							family={F.display}
							stagger={2}
							style={{fontFeatureSettings: '"halt"'}}
						/>
					</Abs>
					<Abs x={110} y={494}>
						<Marker p={markP} size={84} color={C.accent}>
							<MaskRise segments="一起往上" start={LINE2_AT - 4} f={g} size={84} color={C.ink} weight={900} family={F.display} stagger={3} />
						</Marker>
					</Abs>
				</AbsoluteFill>
			</Push>

			{/* 整合修正：Master 的 z-index 讓 S4（108）疊在 S3（107）上面，S3 往左甩出整段被蓋掉。
			    1064–1080 在 S4 最上層用同一個 OutWrap／同一組轉場參數重畫 S3 甩出，S4 從右邊露出來。 */}
			{SLIDE.type === 'slide' && g < SLIDE.t1 ? (
				<OutWrap f={g} tr={SLIDE}>
					<S3 from={from} host />
				</OutWrap>
			) : null}
		</AbsoluteFill>
	);
};
