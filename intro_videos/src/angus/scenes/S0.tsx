// 安格斯 S0 鉤子 0–240（ink 底）：技術球一直彈得很高，收入線一動不動
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SceneProps, useG} from '../../lib/Master';
import {ANGUS, F} from '../../lib/theme';
import {E, alpha, clamp, lerp, prog, pulseAt} from '../../lib/motion';
import {DrawPath, ImpactFlicks, Leader, MaskRise, Push, Svg, Vignette, ghostFrames} from '../../lib/components';
import {BALL} from '../timeline';
import {
	APEX,
	APEX_Y,
	DROP_Y,
	GC,
	GROUND,
	LANDS,
	HANDOFF,
	LAUNCH,
	MonoWipe,
	RollDigit,
	ballShape,
	ballY,
	chargeAt,
	dentAt,
	horizonPath,
} from './S0_parts';

const C = ANGUS;
const AXIS_X = 500; // 右側細直軸
const AXIS_TOP = 740;
const RED_X0 = 560;
const RED_X1 = 960;
const LABEL_RIGHT = 952; // 收入標籤右緣（推近 1.02 後仍在 970 內）
const TEXT_X = 116; // 主文案左緣（推近後仍 ≥ 110）

export const S0: React.FC<SceneProps> = ({from}) => {
	const g = useG(from);
	const red = C.alert ?? C.accent;

	/* ---------- 地平線 ---------- */
	const hp = prog(g, 6, 24, E.outExpo);
	const half = 420 * hp;
	const dent = dentAt(g);
	const seed = prog(g, 0, 6, E.outBack) * (1 - prog(g, 10, 10, E.inOutSine));
	const ticks = Array.from({length: 15}, (_, i) => 120 + i * 60);

	/* ---------- 紅色收入線（之後完全不動） ---------- */
	const rp = prog(g, 14, 22, E.outExpo);
	const capL = prog(g, 13, 8, E.outBack);
	const capR = prog(g, 22, 9, E.outBack);

	/* ---------- 球 ---------- */
	const sh = ballShape(g);
	const onGround = sh.y >= GC - 0.5;
	const ry = BALL.r * sh.sy;
	const rx = BALL.r * sh.sx;
	const shake = g >= 218 && g < LAUNCH ? 1.6 * Math.sin(g * 2.7) * chargeAt(g) : 0;
	const cx = BALL.x + shake;
	const cy = sh.y + BALL.r - ry + (onGround ? dent : 0);
	// 殘影看「剛剛那一格」的速度：落地那格也帶著下墜的拖影
	const speed = Math.abs(ballY(g) - ballY(g - 1));
	const ghostK = clamp((speed - 16) / 24);

	/* ---------- 一開始的定位環＋「技術」 ---------- */
	const ringP = prog(g, 26, 16, E.outExpo);
	const ringFade = 1 - prog(g, 46, 10, E.inOutSine);
	const crossP = prog(g, 33, 9, E.outExpo);
	const leadP = prog(g, 30, 10, E.outExpo);
	const tagP = prog(g, 33, 10, E.outExpo);
	const R0 = 42;
	const ringD = `M ${BALL.x} ${DROP_Y - R0} a ${R0} ${R0} 0 1 1 0 ${R0 * 2} a ${R0} ${R0} 0 1 1 0 ${-R0 * 2}`;

	/* ---------- 右側刻度軸＋頂點量測 ---------- */
	const axP = prog(g, 50, 22, E.outExpo);
	const axTop = lerp(GROUND, AXIS_TOP, axP);
	const axTicks = Array.from({length: 11}, (_, k) => GC - 33 * k);
	const nodeR = 5 * prog(g, APEX[0] - 2, 9, E.outBack) * pulseAt(g, APEX.map((a) => a - 1), 10, 0.7);
	const lvP = prog(g, 64, 10, E.outExpo); // 標籤先擦好，75 只換數字

	return (
		<AbsoluteFill style={{background: C.ink}}>
			<Push f={g} from={0} to={240} amount={0.02} originX={BALL.x} originY={GC}>
				<Svg>
					{/* 地平線：從中心點往兩邊畫出 */}
					{seed > 0.01 ? <circle cx={540} cy={GROUND} r={3.2 * seed} fill={alpha(C.paper, 0.55)} /> : null}
					{hp > 0.001 ? (
						<path
							d={horizonPath(540 - half, 540 + half, dent)}
							fill="none"
							stroke={alpha(C.paper, 0.3)}
							strokeWidth={1.5}
							strokeLinecap="round"
						/>
					) : null}
					{ticks.map((x) => {
						const k = clamp((half - Math.abs(x - 540)) / 36);
						if (k <= 0) return null;
						return (
							<line key={x} x1={x} y1={GROUND + 5} x2={x} y2={GROUND + 5 + 8 * E.outBack(k)} stroke={alpha(C.paper, 0.22)} strokeWidth={1.5} />
						);
					})}

					{/* 紅色收入線 */}
					{rp > 0 ? (
						<line x1={RED_X0} y1={GROUND} x2={lerp(RED_X0, RED_X1, rp)} y2={GROUND} stroke={red} strokeWidth={4} strokeLinecap="butt" />
					) : null}
					{capL > 0 ? <line x1={RED_X0} y1={GROUND - 9 * capL} x2={RED_X0} y2={GROUND + 9 * capL} stroke={red} strokeWidth={2} /> : null}
					{capR > 0 ? <line x1={RED_X1} y1={GROUND - 9 * capR} x2={RED_X1} y2={GROUND + 9 * capR} stroke={red} strokeWidth={2} /> : null}

					{/* 定位環（彈出時）＋十字記號 */}
					{ringFade > 0 ? (
						<g opacity={ringFade}>
							<DrawPath d={ringD} p={ringP} color={C.paper} width={1.5} />
							{[0, 90, 180, 270].map((deg) => {
								const a = (deg * Math.PI) / 180;
								const r1 = R0 + 4;
								const r2 = R0 + 4 + 10 * crossP;
								if (crossP <= 0) return null;
								return (
									<line
										key={deg}
										x1={BALL.x + Math.cos(a) * r1}
										y1={DROP_Y + Math.sin(a) * r1}
										x2={BALL.x + Math.cos(a) * r2}
										y2={DROP_Y + Math.sin(a) * r2}
										stroke={alpha(C.paper, 0.6)}
										strokeWidth={1.5}
									/>
								);
							})}
							<Leader x1={BALL.x + R0 + 18} y1={DROP_Y} x2={BALL.x + 106} y2={DROP_Y} p={leadP} color={alpha(C.paper, 0.6)} width={1.5} dash="4 5" />
						</g>
					) : null}

					{/* 刻度軸（量球心高度，頂點剛好第 10 格） */}
					{axP > 0 ? (
						<g>
							<line x1={AXIS_X} y1={GROUND} x2={AXIS_X} y2={axTop} stroke={alpha(C.paper, 0.3)} strokeWidth={1.5} />
							{axTicks.map((y, k) => {
								if (y < axTop) return null;
								const major = k === 10;
								const len = clamp((y - axTop) / 30);
								return (
									<line
										key={k}
										x1={AXIS_X - (major ? 12 : 7) * len}
										y1={y}
										x2={AXIS_X + (major ? 12 : 0) * len}
										y2={y}
										stroke={alpha(C.paper, major ? 0.55 : 0.25)}
										strokeWidth={1.5}
									/>
								);
							})}
						</g>
					) : null}

					{/* 頂點量測虛線：從球射到軸、再收進軸裡 */}
					{APEX.map((a) => {
						const head = prog(g, a - 4, 8, E.outExpo);
						const tail = prog(g, a + 4, 14, E.inOutSine);
						if (head <= 0 || tail >= 1) return null;
						const xs = BALL.x + 30;
						return (
							<g key={a}>
								<line
									x1={lerp(xs, AXIS_X, tail)}
									y1={APEX_Y}
									x2={lerp(xs, AXIS_X, head)}
									y2={APEX_Y}
									stroke={alpha(C.paper, 0.6)}
									strokeWidth={1.5}
									strokeDasharray="5 6"
								/>
								{tail < 0.05 ? <circle cx={xs} cy={APEX_Y} r={2.5} fill={alpha(C.paper, 0.6)} /> : null}
							</g>
						);
					})}
					{nodeR > 0.05 ? <circle cx={AXIS_X} cy={APEX_Y} r={nodeR} fill={C.accent} /> : null}

					{/* 落地衝擊小撇 */}
					{LANDS.map((L) => (
						<ImpactFlicks key={L} x={BALL.x} y={GROUND} f={g} start={L - 1} dur={11} color={C.paper} width={3} spread={40} len={34} />
					))}
					<ImpactFlicks x={BALL.x} y={GROUND} f={g} start={LAUNCH - 1} dur={10} color={C.paper} width={2.5} spread={38} len={26} />

					{/* 殘影 */}
					{ghostK > 0
						? ghostFrames(g, 3, 1.2).map((gh, i) => (
								<circle key={i} cx={BALL.x} cy={ballY(gh.f)} r={BALL.r * 0.94} fill={C.accent} opacity={gh.o * ghostK} />
							))
						: null}

					{/* 球 */}
					{sh.pop > 0.001 && g < HANDOFF ? <ellipse cx={cx} cy={cy} rx={Math.max(0.01, rx)} ry={Math.max(0.01, ry)} fill={C.accent} /> : null}
				</Svg>

				{/* 一開始球旁邊的「技術」 */}
				<MonoWipe x={BALL.x + 116} y={DROP_Y} p={tagP} color={alpha(C.paper, 0.6)} opacity={ringFade}>
					技術
				</MonoWipe>

				{/* 軸旁邊的「技術 Lv.N」 */}
				<MonoWipe x={AXIS_X + 22} y={APEX_Y} p={lvP} color={C.paper}>
					<span style={{color: alpha(C.paper, 0.6)}}>技術 </span>
					<span>Lv.</span>
					<RollDigit f={g} at={APEX} values={['1', '2', '3', '4', '5']} size={26} color={C.accent} />
				</MonoWipe>

				{/* 收入 +0% */}
				<div style={{position: 'absolute', right: 1080 - LABEL_RIGHT, top: GROUND - 50}}>
					<MaskRise segments="收入 +0%" start={30} f={g} size={26} color={red} weight={500} family={F.mono} stagger={2} dur={14} />
				</div>

				{/* 主文案 */}
				<div style={{position: 'absolute', left: TEXT_X, top: 420}}>
					<MaskRise segments="技術很好，" start={116} f={g} size={110} color={C.paper} weight={900} family={F.display} stagger={3} />
				</div>
				<div style={{position: 'absolute', left: TEXT_X, top: 548}}>
					<MaskRise
						segments={[{text: '收入卻'}, {text: '沒變', color: red}, {text: '？'}]}
						start={146}
						f={g}
						size={110}
						color={C.paper}
						weight={900}
						family={F.display}
						stagger={3}
					/>
				</div>
			</Push>
			<Vignette strength={0.45} />
		</AbsoluteFill>
	);
};
