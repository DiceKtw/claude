// 安格斯 S1 檔案 228–600（paper 底）：名字落拍、星芒每拍喀一聲、規格列 tick-pop
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SceneProps, useG} from '../../lib/Master';
import {ANGUS, F, STAGE} from '../../lib/theme';
import {E, alpha, lerp, prog} from '../../lib/motion';
import {Glint, MaskRise, Push, SpecRow, Svg, drift} from '../../lib/components';
import {T, TR} from '../timeline';
import {IrisRim, Marker, MonoTitle, irisActive} from './S1_parts';

const C = ANGUS;
const X = STAGE.left; // 110
const LINE_Y = 440;
const HERO_TOP = 448; // 字面上緣≈478（離細線 38）
const SUB_TOP = 740; // 跟名字留 40 左右的氣口
const ROWS = [
	{index: '01', label: '沙龍', value: '雁沙龍'},
	{index: '02', label: '角色', value: '美髮人的教練'},
	{index: '03', label: '專長', value: '網路行銷・店務經營'},
	{index: '04', label: '目標', value: '幫美髮人提高收入'},
];
const ROW_Y = [862, 942, 1022, 1102]; // 分鏡 850…1090 整組下移 12，讓副標有氣口
// 每兩拍一列：每列有 1 秒單獨被讀，最後一列 540 打完約 562，接 584 百葉窗（不再留 2 秒空檔）
const ROW_B = [360, 420, 480, 540];

// 整合修正：Master 的 z-index 讓 S2 疊在 S1 上面，所以 S1 的百葉窗甩出（584–600）改由 S2 在上層重畫（host）。
// Master 排的這一份在甩出期間整個被 S2 蓋住，不用再算（省掉 6 條全畫面模糊）。
const BL = TR.blindsS1;
const OUT_FROM = BL.type === 'blinds' ? BL.t0 : T.S1.to;

export const S1: React.FC<SceneProps & {host?: boolean}> = ({from, host}) => {
	const g = useG(from);
	if (!host && g >= OUT_FROM) return null;

	// 240 drop 那一格細線正在衝：線頭先是 accent 3px＋筆頭點，畫完退回 ink 25%
	const lineP = prog(g, 239, 28, E.outExpo);
	const hot = 1 - prog(g, 250, 14, E.inOutSine);
	const upper = drift(g, 300, 600, 12); // 主角區塊往右
	const lower = drift(g, 300, 600, -16); // 規格列往左
	// 副標「美髮人的教練」：ink 字＋accent 螢光筆底條（米白底上不用橘字）
	const markP = prog(g, 312, 16, E.outExpo);

	return (
		<AbsoluteFill style={{background: irisActive(g) ? undefined : C.paper}}>
			<Push f={g} from={300} to={600} amount={0.026} originX={540} originY={800}>
				{/* 標題下細線＋第一列出來時掃光一次（不跟著漂） */}
				<Svg>
					{lineP > 0 ? (
						<line x1={X} y1={LINE_Y} x2={lerp(X, STAGE.right, lineP)} y2={LINE_Y} stroke={alpha(C.ink, 0.25)} strokeWidth={1.5} />
					) : null}
					{lineP > 0 && hot > 0 ? (
						<g opacity={hot}>
							<line x1={X} y1={LINE_Y} x2={lerp(X, STAGE.right, lineP)} y2={LINE_Y} stroke={C.accent} strokeWidth={3} />
							<circle cx={lerp(X, STAGE.right, lineP)} cy={LINE_Y} r={6} fill={C.accent} />
						</g>
					) : null}
					<Glint x0={X} x1={STAGE.right} y={LINE_Y} f={g} start={360} dur={40} color={C.accent} width={2} />
				</Svg>

				{/* 主角區塊：標題、名字、星芒、副標 */}
				<AbsoluteFill style={{transform: `translateX(${upper.toFixed(2)}px)`}}>
					<MonoTitle
						g={g}
						x={X}
						y={400 - 6}
						start={238}
						dur={12}
						text="(01) — PROFILE / 個人檔案"
						size={24}
						color={alpha(C.ink, 0.6)}
						cursor={C.accent}
					/>
					<div style={{position: 'absolute', left: X, top: HERO_TOP}}>
						<MaskRise segments="安格斯" start={266} f={g} size={230} color={C.ink} weight={900} family={F.display} stagger={4} />
					</div>
					<div style={{position: 'absolute', left: X, top: SUB_TOP, display: 'flex'}}>
						<MaskRise
							segments={[{text: '雁沙龍'}, {text: ' ／ ', color: C.muted}]}
							start={300}
							f={g}
							size={46}
							color={C.ink}
							weight={700}
							family={F.sans}
							stagger={1}
							dur={16}
						/>
						<Marker p={markP} size={46} color={C.accent}>
							<MaskRise segments="美髮人的教練" start={306} f={g} size={46} color={C.ink} weight={700} family={F.sans} stagger={1} dur={16} />
						</Marker>
					</div>
				</AbsoluteFill>

				{/* 規格列（往左漂） */}
				<AbsoluteFill style={{transform: `translateX(${lower.toFixed(2)}px)`}}>
					{ROWS.map((r, i) => (
						<SpecRow
							key={r.index}
							f={g}
							b={ROW_B[i]}
							x={X}
							y={ROW_Y[i]}
							width={STAGE.right - X}
							index={r.index}
							label={r.label}
							value={r.value}
							brand={C}
							ink={C.ink}
							labelColor={alpha(C.ink, 0.62)}
							size={36}
						/>
					))}
				</AbsoluteFill>
			</Push>

			{/* iris 228–240：圓的內緣一圈橘（球撐開成新畫面）；這段的 paper 底也在這裡畫 */}
			<Svg>
				<IrisRim g={g} color={C.accent} fill={C.paper} />
			</Svg>
		</AbsoluteFill>
	);
};
