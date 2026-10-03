// Akira S0 鉤子 0–240（全域格數）
// 一支筆在墨黑紙上描一條線：沿著淡淡的尺規基線進來，在 x≈380 抬起、變成一縷髮絲輪廓。
// 描完之後打上設計師的量測標註（R 180／0.4 mm）。文案「好看，藏在細節裡。」落在 60／90 拍上（10/3 審片：
// 原本 120／150 才出字，前 2 秒只有一條細線，Reels 滑到的人看不到任何訊息；提前一拍半，筆在文案下方繼續描）。
// f0 不再是全黑：尺規基線一開場就畫到四成，第一格就有東西。
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SceneProps, useG} from '../../lib/Master';
import {AKIRA, F} from '../../lib/theme';
import {E, alpha, clamp, lerp, prog} from '../../lib/motion';
import {DrawPath, MaskRise, Push, Svg, Vignette, drift} from '../../lib/components';
import {MonoTag, cubAt, cubCurv, cubsD, sampler, strandCubs} from './S0_parts';

const C = AKIRA;

// 時間（全域格數）
const DRAW0 = 10; // 描線開始
const DRAW1 = 150; // 描線結束
const L1 = 53; // 「好看，」起跑：quiet 版是線性淡入，提前 7 格，60 拍那格第一個字已六成以上、位置九成
const L2 = 83; // 「藏在細節裡。」同理，90 拍站穩大半
const TAG_R = 150; // R 180
const TAG_W = 170; // 0.4 mm
const HOLD = 150; // 定格段開始
const HOLD_END = 240; // 定格慢推一路推到 S1 掃過結束（216 時約 1.02）

// 尺規基線（裝飾：淡、細，筆從這裡出發）
const RULE_Y = 980;

// 版面
const TX = 110;
const TY1 = 396;
const TY2 = 526;

// 量測標註的位置：在曲線最彎處（頂點右側的捲曲）找曲率最大的點
const STATIC = strandCubs(0);
const CURL = (() => {
	let best = {k: 0, seg: 3, t: 0.5};
	for (const seg of [2, 3, 4]) {
		for (let i = 2; i <= 98; i++) {
			const t = i / 100;
			const k = cubCurv(STATIC[seg], t);
			if (Math.abs(k) > Math.abs(best.k)) best = {k, seg, t};
		}
	}
	const c = STATIC[best.seg];
	const P = cubAt(c, best.t);
	const P2 = cubAt(c, Math.min(1, best.t + 0.001));
	const P0 = cubAt(c, Math.max(0, best.t - 0.001));
	const tx = P2[0] - P0[0];
	const ty = P2[1] - P0[1];
	const tl = Math.hypot(tx, ty);
	const N: [number, number] = [-ty / tl, tx / tl];
	const R = 1 / Math.abs(best.k);
	const sgn = Math.sign(best.k);
	const cx = P[0] + (N[0] * sgn) * R;
	const cy = P[1] + (N[1] * sgn) * R;
	return {P, cx, cy, R, ang: Math.atan2(P[1] - cy, P[0] - cx)};
})();

const arcD = (cx: number, cy: number, r: number, a0: number, a1: number) => {
	const x0 = cx + Math.cos(a0) * r;
	const y0 = cy + Math.sin(a0) * r;
	const x1 = cx + Math.cos(a1) * r;
	const y1 = cy + Math.sin(a1) * r;
	return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
};

// 筆寬標註的取樣點：在基線段上
const WIDTH_X = 214;

export const S0: React.FC<SceneProps> = ({from}) => {
	const g = useG(from);

	// --- 主線：髮絲曲線 ---
	const endDx = drift(g, HOLD, HOLD_END, 7);
	const cubs = strandCubs(endDx);
	const d = cubsD(cubs);
	const samp = sampler(cubs);
	const p = prog(g, DRAW0, DRAW1 - DRAW0, E.inOutSine);
	const tip = samp.at(p);
	const tipOn = g >= DRAW0 ? 1 : 0;
	const guideOp = prog(g, DRAW0, 16, E.outCubic) * (1 - prog(g, DRAW1 - 6, 24, E.inOutSine));

	// --- 尺規基線（f0 已經畫到四成，之後從左邊淡淡畫完） ---
	const ruleP = 0.4 + 0.6 * prog(g, 0, 40, E.outCubic);
	const ruleX1 = lerp(0, 1080, ruleP);
	const ticks: number[] = [];
	for (let x = 40; x <= 1040; x += 40) ticks.push(x);

	// --- R 180：最彎處外側的弧線 ---
	const rArc = CURL.R + 30;
	// 標註：拍點那格要看得到變化 → outCubic（一出手最快）、提前 3 格起跑
	const rP = prog(g, TAG_R - 3, 22, E.outCubic);
	const rA0 = CURL.ang - 0.62;
	const rA1 = CURL.ang + 0.62;
	const rTagX = CURL.cx + Math.cos(CURL.ang) * (rArc + 20);
	const rTagY = CURL.cy + Math.sin(CURL.ang) * (rArc + 20);
	const rCenterOp = prog(g, TAG_R + 1, 18, E.outCubic);

	// --- 0.4 mm：筆寬標註（圈住線、虛線引線拉到標籤） ---
	const wP = prog(g, TAG_W - 3, 20, E.outCubic);
	const wLead = prog(g, TAG_W - 1, 20, E.outCubic);
	const wx = WIDTH_X;
	const wy = RULE_Y;
	const lx1 = wx + 54;
	const ly1 = wy + 58;

	return (
		<AbsoluteFill style={{background: C.ink}}>
			<Push f={g} from={HOLD} to={HOLD_END} amount={0.022} originX={540} originY={860}>
				<Svg>
					{/* 尺規基線＋刻度（裝飾，極淡） */}
					{ruleP > 0 ? (
						<g>
							<line x1={0} y1={RULE_Y} x2={ruleX1} y2={RULE_Y} stroke={alpha(C.muted, 0.45)} strokeWidth={C.hairline} />
							{ticks.map((x, i) => {
								if (x > ruleX1) return null;
								const tp = clamp((ruleX1 - x) / 60);
								const tall = i % 5 === 4 ? 14 : 7;
								return <line key={x} x1={x} y1={RULE_Y + 6} x2={x} y2={RULE_Y + 6 + tall * tp} stroke={alpha(C.muted, 0.4)} strokeWidth={C.hairline} />;
							})}
						</g>
					) : null}

					{/* R 180 量測弧線＋圓心十字 */}
					{rP > 0 ? (
						<g>
							<DrawPath d={arcD(CURL.cx, CURL.cy, rArc, rA0, rA1)} p={rP} color={C.muted} width={C.hairline} cap="butt" />
							{[rA0, rA1].map((a, i) => (
								<line
									key={i}
									x1={CURL.cx + Math.cos(a) * (rArc - 7)}
									y1={CURL.cy + Math.sin(a) * (rArc - 7)}
									x2={CURL.cx + Math.cos(a) * (rArc + 7)}
									y2={CURL.cy + Math.sin(a) * (rArc + 7)}
									stroke={C.muted}
									strokeWidth={C.hairline}
									opacity={i === 0 ? clamp(rP * 4) : clamp((rP - 0.85) * 7)}
								/>
							))}
							<g opacity={rCenterOp * 0.8}>
								<line x1={CURL.cx - 7} y1={CURL.cy} x2={CURL.cx + 7} y2={CURL.cy} stroke={C.muted} strokeWidth={C.hairline} />
								<line x1={CURL.cx} y1={CURL.cy - 7} x2={CURL.cx} y2={CURL.cy + 7} stroke={C.muted} strokeWidth={C.hairline} />
								<line
									x1={CURL.cx}
									y1={CURL.cy}
									x2={lerp(CURL.cx, CURL.cx + Math.cos(CURL.ang) * (rArc - 10), rCenterOp)}
									y2={lerp(CURL.cy, CURL.cy + Math.sin(CURL.ang) * (rArc - 10), rCenterOp)}
									stroke={C.muted}
									strokeWidth={C.hairline}
									strokeDasharray="4 6"
								/>
							</g>
						</g>
					) : null}

					{/* 0.4 mm 筆寬標註 */}
					{wP > 0 ? (
						<g>
							<DrawPath d={`M ${wx + 13} ${wy} A 13 13 0 1 1 ${wx + 12.99} ${wy - 0.5}`} p={wP} color={C.muted} width={C.hairline} cap="butt" />
							{wLead > 0 ? (
								<line
									x1={wx + 9}
									y1={wy + 9}
									x2={lerp(wx + 9, lx1, wLead)}
									y2={lerp(wy + 9, ly1, wLead)}
									stroke={C.muted}
									strokeWidth={C.hairline}
									strokeDasharray="4 6"
								/>
							) : null}
						</g>
					) : null}

					{/* 筆尖的定位細線（像繪圖機的游標，極淡，描完就收） */}
					{guideOp > 0 ? (
						<g opacity={guideOp}>
							<line x1={tip.x} y1={RULE_Y + 6} x2={tip.x} y2={RULE_Y + 30} stroke={C.muted} strokeWidth={C.hairline} />
							<line x1={tip.x} y1={0} x2={tip.x} y2={1920} stroke={alpha(C.muted, 0.12)} strokeWidth={1} />
						</g>
					) : null}

					{/* 主線（米白 4px 描線） */}
					<DrawPath d={d} p={p} color={C.accent} width={C.line} />
					{/* 筆尖 Ø8 */}
					{tipOn ? <circle cx={tip.x} cy={tip.y} r={4} fill={C.accent} /> : null}
				</Svg>

				{/* 量測小字 */}
				<MonoTag f={g} start={TAG_R - 2} x={rTagX + 4} y={rTagY - 14} text="R 180" />
				<MonoTag f={g} start={TAG_W + 1} x={lx1 + 8} y={ly1 - 4} text="0.4 mm" />

				{/* 文案（主角） */}
				<div style={{position: 'absolute', left: TX, top: TY1}}>
					<MaskRise segments="好看，" start={L1} f={g} size={104} color={C.paper} weight={500} family={F.sans} quiet stagger={3} dur={16} lineHeight={1.15} />
				</div>
				<div style={{position: 'absolute', left: TX, top: TY2}}>
					<MaskRise
						segments={[{text: '藏在'}, {text: '細節', color: C.accent, weight: 700}, {text: '裡。'}]}
						start={L2}
						f={g}
						size={104}
						color={C.paper}
						weight={500}
						family={F.sans}
						quiet
						stagger={3}
						dur={16}
						lineHeight={1.15}
					/>
				</div>
			</Push>
			<Vignette strength={0.35} />
		</AbsoluteFill>
	);
};
