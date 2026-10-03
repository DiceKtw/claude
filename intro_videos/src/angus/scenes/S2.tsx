// 安格斯 S2 行銷 584–840（ink 底）
// 手機 feed 每拍推一張作品卡 → 按讚 → 小點沿引線流進漏斗 → 第 3 顆落進「預約」(750)
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SceneProps, useG} from '../../lib/Master';
import {ANGUS, F} from '../../lib/theme';
import {E, alpha, clamp, lerp, mixHex, prog, pulseAt} from '../../lib/motion';
import {Abs, DirBlur, DrawPath, Glint, ImpactFlicks, MaskRise, Push, Ring, Svg, drift, ghostFrames} from '../../lib/components';
import {PHONE, SCREEN} from '../timeline';
import {CARD_H, CARD_W, FUNNEL, FeedCard, FunnelDim, FunnelLayer, layerMid, layerTop, pointAt, polySegs, roundRectSegs, segsD} from './S2_parts';

const C = ANGUS;

// 時間（全域格數）
const CARD_BEATS = [630, 660, 690, 720]; // 貼文推上來
const LAYER_BEATS = [660, 690, 720]; // 漏斗三層長出來
const LIKES = [648, 678, 708, 749]; // 每張卡的愛心被按（最後一張跟「預約」同一拍）
// 小點：沿引線 16 格 → 從漏斗頂沿中線落下 24 格（inOutQuart），落在當時漏斗的最底層
const DROPS = [
	{depart: 650, fall: 666, land: 690, layer: 0},
	{depart: 680, fall: 696, land: 720, layer: 1},
	{depart: 710, fall: 726, land: 750, layer: 2},
];
const HIT = 750; // 第 3 顆落進「預約」

// feed 版面
const PITCH = 270; // 卡片間距（250 高＋20 縫）
const SLOT_TOP = SCREEN.y + SCREEN.h - 20 - CARD_H; // 最新一張停的位置
const FEED_TOP = 470; // feed 上緣（上方是聽筒＋分隔線）
const CARD_X = SCREEN.x + (SCREEN.w - CARD_W) / 2;

const PHONE_SEGS = roundRectSegs(PHONE.x, PHONE.y, PHONE.w, PHONE.h, PHONE.r);
const PHONE_D = segsD(PHONE_SEGS);
const PEN0: [number, number] = [PHONE.x + PHONE.w / 2, PHONE.y];
const EAR_Y = 434;

const LEADER_Y0 = 600;
const FUNNEL_IN_Y = 506; // 小點進漏斗的位置（漏斗頂上方一點）

const LABELS = ['曝光', '私訊', '預約'];

export const S2: React.FC<SceneProps> = ({from}) => {
	const g = useG(from);

	// --- feed 捲動 ---
	const scrollAt = (f: number) => CARD_BEATS.reduce((a, b) => a + PITCH * prog(f, b - 2, 14, E.outExpo), 0);
	const scroll = scrollAt(g);
	const vScroll = scrollAt(g + 0.5) - scrollAt(g - 0.5);

	// --- 視差：漏斗往左、文案往右（手機不動，S3 要從螢幕框放大） ---
	const fdx = drift(g, 690, 840, -10);
	const tdx = drift(g, 716, 840, 8);
	const fcx = FUNNEL.cx + fdx;

	// --- 手機外框描線 ---
	const drawP = prog(g, 600, 32, E.inOutSine);
	const markIn = prog(g, 587, 10, E.outBack);
	const markOut = prog(g, 601, 10, E.outCubic);
	// 筆頭（accent 點）：起點待命 → 沿外框繞一圈 → 落到聽筒位置拉成短線
	let pen: [number, number] = PEN0;
	if (g >= 600 && g < 632) pen = pointAt(PHONE_SEGS, drawP);
	const penDrop = prog(g, 632, 6, E.outCubic);
	const earK = prog(g, 635, 12, E.outBack);
	const earCol = mixHex(C.accent, C.paper, prog(g, 636, 10, E.outCubic));
	const penY = g >= 632 ? lerp(PEN0[1], EAR_Y, penDrop) : pen[1];
	const penX = g >= 632 ? PEN0[0] : pen[0];
	const penR = 6 * (g < 600 ? markIn : 1) * pulseAt(g, [594], 10, 0.35);

	// --- 引線（手機右緣 → 漏斗頂），跟漏斗一起漂 ---
	const leaderPts: [number, number][] = [
		[PHONE.x + PHONE.w, LEADER_Y0],
		[516, LEADER_Y0],
		[516, 488],
		[fcx, 488],
		[fcx, FUNNEL_IN_Y],
	];
	const LEADER = polySegs(leaderPts);
	const leaderP = prog(g, DROPS[0].depart, 16, E.inOutSine);

	// --- 小點位置 ---
	const dotPos = (f: number, d: (typeof DROPS)[number]): [number, number] | null => {
		if (f < d.depart) return null;
		if (f < d.fall) return pointAt(LEADER, prog(f, d.depart, 16, E.inOutSine));
		const landY = layerTop(d.layer) + FUNNEL.h - 16;
		const t = clamp((f - d.fall) / 24);
		return [fcx, lerp(FUNNEL_IN_Y, landY, E.inOutQuart(t))];
	};

	// --- 螢幕被 accent 填滿（接 S3 的 fill 轉場） ---
	const fillK = prog(g, 804, 20, E.inOutSine);
	const glassK = prog(g, 608, 24, E.inOutSine);

	return (
		<AbsoluteFill style={{background: C.ink}}>
			<Push f={g} from={600} to={840} amount={0.018} originX={SCREEN.x + SCREEN.w / 2} originY={SCREEN.y + SCREEN.h / 2}>
				{/* 設計系統底：細點陣，慢慢往上漂 */}
				<Svg>
					<defs>
						<pattern id="angS2grid" width={40} height={40} patternUnits="userSpaceOnUse" patternTransform={`translate(20 ${(-14 * (g - 584)) / 256})`}>
							<circle cx={20} cy={20} r={1.4} fill={alpha(C.paper, 0.1)} />
						</pattern>
					</defs>
					<rect x={0} y={0} width={1080} height={1920} fill="url(#angS2grid)" />
					{/* 螢幕玻璃：蓋掉點陣 */}
					<rect x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} rx={SCREEN.r} fill={C.ink} opacity={glassK} />
					<rect x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} rx={SCREEN.r} fill={alpha(C.paper, 0.04 * glassK)} />
				</Svg>

				{/* feed：卡片從螢幕底部推上來 */}
				<div
					style={{
						position: 'absolute',
						left: SCREEN.x,
						top: SCREEN.y,
						width: SCREEN.w,
						height: SCREEN.h,
						clipPath: `inset(${FEED_TOP - SCREEN.y}px 0 0 0 round 0 0 ${SCREEN.r}px ${SCREEN.r}px)`,
					}}
				>
					<DirBlur y={Math.abs(vScroll) * 0.12} style={{position: 'absolute', inset: 0}}>
						<svg
							width={SCREEN.w}
							height={SCREEN.h}
							viewBox={`${SCREEN.x} ${SCREEN.y} ${SCREEN.w} ${SCREEN.h}`}
							style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}
						>
							{CARD_BEATS.map((_, k) => {
								const y = SLOT_TOP + PITCH * (k + 1) - scroll;
								if (y >= SCREEN.y + SCREEN.h - 2 || y + CARD_H < FEED_TOP) return null;
								return <FeedCard key={k} k={k} x={CARD_X} y={y} f={g} likeAt={LIKES[k]} />;
							})}
						</svg>
					</DirBlur>
				</div>

				<Svg>
					{/* 手機外框：從上方中間順時針描一圈 */}
					<DrawPath d={PHONE_D} p={drawP} color={C.paper} width={3} />
					{/* 起點定位記號（584 起就在，等著被畫） */}
					<g opacity={markIn * (1 - markOut)}>
						<line x1={PEN0[0] - 22} y1={PEN0[1]} x2={PEN0[0] - 10} y2={PEN0[1]} stroke={alpha(C.paper, 0.5)} strokeWidth={1.5} />
						<line x1={PEN0[0] + 10} y1={PEN0[1]} x2={PEN0[0] + 22} y2={PEN0[1]} stroke={alpha(C.paper, 0.5)} strokeWidth={1.5} />
						<line x1={PEN0[0]} y1={PEN0[1] - 22} x2={PEN0[0]} y2={PEN0[1] - 10} stroke={alpha(C.paper, 0.5)} strokeWidth={1.5} />
						<line x1={PEN0[0]} y1={PEN0[1] + 10} x2={PEN0[0]} y2={PEN0[1] + 22} stroke={alpha(C.paper, 0.5)} strokeWidth={1.5} />
						<circle cx={PEN0[0]} cy={PEN0[1]} r={15} fill="none" stroke={alpha(C.paper, 0.3)} strokeWidth={1} />
					</g>
					{/* 筆頭 → 聽筒 */}
					{g < 635 ? (
						<circle cx={penX} cy={penY} r={penR} fill={C.accent} />
					) : (
						<line
							x1={PEN0[0] - 28 * earK}
							y1={EAR_Y}
							x2={PEN0[0] + 28 * earK}
							y2={EAR_Y}
							stroke={earCol}
							strokeWidth={lerp(12, 5, clamp(earK))}
							strokeLinecap="round"
						/>
					)}
					{/* feed 上緣分隔線 */}
					<line
						x1={CARD_X}
						y1={FEED_TOP - 1}
						x2={lerp(CARD_X, CARD_X + CARD_W, prog(g, 640, 18, E.outExpo))}
						y2={FEED_TOP - 1}
						stroke={alpha(C.paper, 0.16)}
						strokeWidth={1.5}
						opacity={g >= 640 ? 1 : 0}
					/>

					{/* 引線：第 1 顆小點當筆頭把它畫出來 */}
					<DrawPath d={segsD(LEADER)} p={leaderP} color={alpha(C.paper, 0.55)} width={2} cap="butt" dash="6 7" />
					{leaderP > 0 ? <circle cx={leaderPts[0][0]} cy={leaderPts[0][1]} r={4 * prog(g, 650, 8, E.outBack)} fill={C.paper} /> : null}

					{/* 漏斗 */}
					{LAYER_BEATS.map((b, i) => (
						<FunnelLayer key={i} i={i} f={g} b={b} cx={fcx} hit={i === 2 ? HIT : undefined} />
					))}
					{LAYER_BEATS.map((b, i) => (
						<FunnelDim key={i} i={i} f={g} b={b} x={fcx + 234} />
					))}
				</Svg>

				{/* 漏斗層裡的字 */}
				{LAYER_BEATS.map((b, i) => {
					const hitK = i === 2 ? prog(g, HIT - 1, 5, E.outCubic) : 0;
					return (
						<Abs key={i} x={fcx - 50} y={layerMid(i) - 27} style={{width: 100, display: 'flex', justifyContent: 'center'}}>
							<MaskRise
								segments={LABELS[i]}
								start={b + 2}
								f={g}
								size={44}
								color={mixHex(C.paper, C.accent, hitK)}
								weight={700}
								family={F.sans}
								stagger={3}
								dur={14}
							/>
						</Abs>
					);
				})}

				<Svg>
					{/* 流動小點（殘影＋本體） */}
					{DROPS.map((d, i) => {
						const p = dotPos(g, d);
						if (!p) return null;
						const absorbed = i < 2 ? prog(g, d.land + 3, 10, E.inCubic) : 0;
						if (absorbed >= 1) return null;
						const landed = g >= d.land;
						const pop = landed ? pulseAt(g, [d.land - 1], 10, i === 2 ? 0.9 : 0.6) : 1;
						const beatPulse = i === 2 ? pulseAt(g, [780, 810], 10, 0.4) : 1;
						const ghosts = landed
							? []
							: ghostFrames(g, 3, 1.2)
									.map((gf) => ({q: dotPos(gf.f, d), o: gf.o}))
									.filter((x) => x.q && Math.hypot(x.q[0] - p[0], x.q[1] - p[1]) > 5);
						return (
							<g key={i} opacity={1 - absorbed}>
								{ghosts.map((x, j) => (
									<circle key={j} cx={x.q![0]} cy={x.q![1]} r={5 * (1 - j * 0.15)} fill={C.accent} opacity={x.o} />
								))}
								<circle cx={p[0]} cy={p[1]} r={5 * pop * beatPulse * (1 - absorbed * 0.6)} fill={C.accent} />
							</g>
						);
					})}
					{/* 750：落進「預約」 */}
					<Ring cx={fcx} cy={layerMid(2)} f={g} start={HIT} dur={42} r0={72} r1={260} w0={3} color={C.accent} />
					<ImpactFlicks x={fcx} y={layerTop(2) + FUNNEL.h - 16} f={g} start={HIT} dur={11} color={C.accent} width={3} spread={12} len={16} />

					{/* 780：手機外框上緣掃光 */}
					<Glint x0={PHONE.x + PHONE.r} x1={PHONE.x + PHONE.w - PHONE.r} y={PHONE.y} f={g} start={780} dur={32} color={C.accent} width={3} />

					{/* 804–824：螢幕被 accent 填滿 */}
					{fillK > 0 ? (
						<rect x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} rx={SCREEN.r} fill={C.accent} opacity={fillK} />
					) : null}
				</Svg>

				{/* 文案 */}
				<Abs x={110 + tdx} y={1118}>
					<MaskRise
						segments={[{text: '把作品，變成'}, {text: '預約', color: C.accent}]}
						start={716}
						f={g}
						size={92}
						color={C.paper}
						weight={900}
						family={F.display}
						stagger={3}
					/>
				</Abs>
			</Push>
		</AbsoluteFill>
	);
};
