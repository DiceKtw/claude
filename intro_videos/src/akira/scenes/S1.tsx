// Akira S1 檔案 216–600（全域格數）
// 研究筆記的第一頁：標題 NOTE 01 — PROFILE → 名字 Akira 落在 270 → 副標 → 資訊卡 → 四列規格每拍一列。
// 216–240 由 Master 從上往下細線掃入；576 起 Master 讓整頁往上漂走淡出。
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SceneProps, useG} from '../../lib/Master';
import {AKIRA, F} from '../../lib/theme';
import {E, lerp, prog} from '../../lib/motion';
import {Glint, MaskRise, Push, SpecRow, Svg, Vignette, drift} from '../../lib/components';
import {NoteCard} from './S1_parts';

const C = AKIRA;

// 時間（全域格數）
// 整合：216–240 掃入時露出的 S1 原本是空的（230–246 只剩 HUD，240 主段進來那拍是空畫面），
// 標題提前到 236（240 拍已淡入近半）、細線從 240 拍起筆、排版輔助線 220 起就在描，掃入時看得到這一頁
const TITLE = 236;
const RULE0 = 240;
const RULE1 = 280;
const NAME = 262; // Akira 起跑（stagger 4：重心 270）
const SUB = 300;
const CARD0 = 326;
const CARD1 = 356;
const ROW_BEATS = [360, 390, 420, 450];
const ROW_LEAD = 2; // SpecRow quiet 的標籤從 b 才開始淡入：提前 2 格，拍點那格標籤已經看得到
const GLINT = 480;
const PUSH0 = 300;
const PUSH1 = 576;

// 版面
const X = 110;
const TITLE_Y = 400;
const RULE_Y = 452;
const NAME_Y = 470;
const SUB_Y = 732;
const CARD = {x: 110, y: 820, w: 860, h: 360};
const ROW_Y = [920, 990, 1060, 1130];
// 字體排印輔助線（裝飾）：Akira 的大寫高、x 高、基線（暖灰 1.5px、很淡），字升起前先畫好
const TYPE_GUIDES = [
	{y: 520, at: 220},
	{y: 568, at: 224},
	{y: 695, at: 222},
];
const ROWS: {label: string; value: string}[] = [
	{label: '沙龍', value: '川沙龍'},
	{label: '專長', value: '美感・髮型設計'},
	{label: '客人', value: '非常多'},
	{label: '經驗', value: '美髮知識豐富'},
];

export const S1: React.FC<SceneProps> = ({from}) => {
	const g = useG(from);

	// 標題：淡入＋往右移 12px
	const tP = prog(g, TITLE, 22, E.outCubic);
	// 標題下細線
	const rP = prog(g, RULE0, RULE1 - RULE0, E.inOutSine);
	// 副標：淡入＋上移 16px
	const sP = prog(g, SUB, 24, E.outCubic);
	// 資訊卡：下方 24px 淡入上移
	const cP = prog(g, CARD0, CARD1 - CARD0, E.outCubic);

	// 視差：主角往右、資訊卡往左
	const nameDx = drift(g, PUSH0, PUSH1, 6);
	const cardDx = drift(g, PUSH0, PUSH1, -8);

	return (
		<AbsoluteFill>
			{/* 底色往下多鋪 120px：576 起 Master 讓整頁往上漂 80px，下緣不露出黑邊 */}
			<div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920 + 120, background: C.ink}} />
			<Push f={g} from={PUSH0} to={PUSH1} amount={0.015} originX={540} originY={800}>
				{/* 標題 */}
				<div
					style={{
						position: 'absolute',
						left: X,
						top: TITLE_Y,
						fontFamily: F.mono,
						fontSize: 22,
						lineHeight: '30px',
						color: C.muted,
						letterSpacing: '0.3em',
						whiteSpace: 'pre',
						opacity: tP,
						transform: `translateX(${(tP - 1) * 12}px)`,
					}}
				>
					NOTE 01 — PROFILE
				</div>

				<Svg>
					{rP > 0 ? <line x1={X} y1={RULE_Y} x2={lerp(X, 970, rP)} y2={RULE_Y} stroke={C.muted} strokeWidth={C.hairline} /> : null}
					<Glint x0={X} x1={970} y={RULE_Y} f={g} start={GLINT} dur={60} color={C.accent} width={C.hairline} />
				</Svg>

				{/* 字體排印輔助線（跟著主角一起漂） */}
				<Svg style={{transform: `translateX(${nameDx * 0.5}px)`}}>
					{TYPE_GUIDES.map((gd) => {
						const p = prog(g, gd.at, 34, E.inOutSine);
						if (p <= 0) return null;
						const x1 = lerp(X, 970, p);
						return (
							<g key={gd.y} opacity={0.26}>
								<line x1={X - 14} y1={gd.y} x2={x1} y2={gd.y} stroke={C.muted} strokeWidth={C.hairline} />
								<line x1={X - 14} y1={gd.y - 6} x2={X - 14} y2={gd.y + 6} stroke={C.muted} strokeWidth={C.hairline} />
								{p >= 1 ? <line x1={970} y1={gd.y - 6} x2={970} y2={gd.y + 6} stroke={C.muted} strokeWidth={C.hairline} /> : null}
							</g>
						);
					})}
				</Svg>

				{/* 主角：Akira ＋ 副標 */}
				<div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `translateX(${nameDx}px)`}}>
					<div style={{position: 'absolute', left: X - 6, top: NAME_Y}}>
						<MaskRise segments="Akira" start={NAME} f={g} size={220} color={C.paper} weight={700} family={F.sans} quiet stagger={4} dur={24} lineHeight={1.18} />
					</div>
					<div
						style={{
							position: 'absolute',
							left: X,
							top: SUB_Y,
							fontFamily: F.sans,
							fontWeight: 500,
							fontSize: 44,
							lineHeight: '60px',
							color: C.accent,
							letterSpacing: '0.04em',
							whiteSpace: 'pre',
							opacity: sP,
							transform: `translateY(${(1 - sP) * 16}px)`,
						}}
					>
						川沙龍
					</div>
				</div>

				{/* 資訊卡＋規格列 */}
				{cP > 0 ? (
					<div
						style={{
							position: 'absolute',
							left: 0,
							top: 0,
							width: 1080,
							height: 1920,
							opacity: cP,
							transform: `translate(${cardDx}px, ${(1 - cP) * 24}px)`,
						}}
					>
						<NoteCard f={g} x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h} label="PROFILE" barAt={CARD0 + 12} labelAt={CARD0 + 16} />
						{ROWS.map((r, i) => (
							<SpecRow
								key={r.label}
								f={g}
								b={ROW_BEATS[i] - ROW_LEAD}
								x={150}
								y={ROW_Y[i]}
								width={780}
								label={r.label}
								value={r.value}
								brand={C}
								ink={C.paper}
								size={34}
								quiet
							/>
						))}
					</div>
				) : null}
			</Push>
			<Vignette strength={0.35} />
		</AbsoluteFill>
	);
};

