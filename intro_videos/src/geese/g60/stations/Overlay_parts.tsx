// 60 秒〈字的雁陣〉Overlay 用的小元件（只給 Overlay.tsx 用）：雁 logo／店名字標、片尾資訊行
import React from 'react';
import {Img} from 'remotion';
import {E, Ease, clamp, prog} from '../../../lib/motion';
import {C60} from '../../copy';
import {F, G} from '../../theme';
import {VDrop} from '../kit';

/* ------------------------------------------------------------------ */
/* 落陣的「第一次碰到位」：kit 的 VDrop 用 8% 過衝 backOut，                */
/* 領頭字在 land 前 (1−t*)×dur 格就已經到位（≥97%）。要讓碰到位那格＝拍點，  */
/* land 就要往後放這麼多格。                                               */
/* ------------------------------------------------------------------ */
const backOut8: Ease = (t) => {
	const u = clamp(t) - 1;
	return 1 + 2.2 * u * u * u + 1.2 * u * u;
};
const reachT = (ease: Ease, v = 0.97) => {
	for (let i = 0; i <= 400; i++) if (ease(i / 400) >= v) return i / 400;
	return 1;
};
export const landFor = (beat: number, dur: number) => beat + Math.round(dur * (1 - reachT(backOut8)));

/* ------------------------------------------------------------------ */
/* 店名字標（沒有 logo 檔時用）：雁沙龍＋GEESE MODEL HAIR SALON              */
/* 尺寸以 scale 1 計：寬 WM.w、高 WM.h；內部置中                           */
/* ------------------------------------------------------------------ */
export const WM = {big: 240, en: 44, gap: 26, w: 720, h: 240 + 26 + 44} as const;

export const WordMark: React.FC<{f: number; at: number}> = ({f, at}) => {
	const chars = Array.from(C60.END.name);
	// 疊溶 6 格、兄弟錯 2 格；同時往下落定 14px（鼓組回來＝落地）
	const piece = (i: number) => {
		const s = at - 3 + i * 2;
		return {o: prog(f, s, 6, E.outExpo), y: -14 * (1 - prog(f, s, 18, E.outExpo))};
	};
	const en = piece(chars.length + 1);
	return (
		<div style={{position: 'absolute', left: 0, top: 0, width: WM.w, height: WM.h}}>
			<div style={{display: 'flex', justifyContent: 'center', height: WM.big}}>
				{chars.map((ch, i) => {
					const p = piece(i);
					return (
						<span
							key={i}
							style={{
								display: 'block',
								fontFamily: F.round,
								fontWeight: 900,
								fontSize: WM.big,
								lineHeight: 1,
								color: G.ink,
								opacity: p.o,
								transform: `translateY(${p.y.toFixed(2)}px)`,
							}}
						>
							{ch}
						</span>
					);
				})}
			</div>
			<div
				style={{
					marginTop: WM.gap,
					textAlign: 'center',
					fontFamily: F.num,
					fontWeight: 900,
					fontStretch: '75%',
					fontSize: WM.en,
					lineHeight: 1,
					letterSpacing: '0.12em',
					// 字距 0.12em 會在最後一個字後面多出一段，往右補半段才真的置中
					paddingLeft: '0.12em',
					whiteSpace: 'pre',
					color: G.ink,
					opacity: en.o,
					transform: `translateY(${en.y.toFixed(2)}px)`,
				}}
			>
				{C60.END.en}
			</div>
		</div>
	);
};

/** 雁 logo（客戶重描檔，形狀不准改）：box 內等比塞滿，pos＝objectPosition */
export const LogoImg: React.FC<{src: string; w: number; h: number; pos: string; opacity: number}> = ({src, w, h, pos, opacity}) => (
	<Img src={src} style={{position: 'absolute', left: 0, top: 0, width: w, height: h, objectFit: 'contain', objectPosition: pos, opacity}} />
);

/* ------------------------------------------------------------------ */
/* 片尾資訊行：一行由一或兩段 VDrop 組成（不同字級／字體的段落基線對齊）      */
/* ------------------------------------------------------------------ */
export type Part = {text: string; size: number; weight: number; family: string; stretch?: number; tracking?: number};
export type InfoLine = {parts: Part[]; x: number; y: number; beat: number; dx: number};

const DUR = 16;
export const InfoRow: React.FC<{f: number; line: InfoLine}> = ({f, line}) => {
	if (f < line.beat - DUR - 4) return null;
	return (
		<div style={{position: 'absolute', left: line.x, top: line.y, display: 'flex', alignItems: 'baseline', whiteSpace: 'pre'}}>
			{line.parts.map((p, i) => {
				const n = Array.from(p.text).length;
				// 長的行 V 字張得小一點（外側字的過衝才不會撞到上一行）
				const spread = Math.min(0.2, 0.9 / Math.max(1, n));
				return (
					<VDrop
						key={i}
						f={f}
						text={p.text}
						land={landFor(line.beat + i * 3, DUR)}
						size={p.size}
						weight={p.weight}
						family={p.family}
						from={{dx: line.dx, dy: 170}}
						spread={spread}
						stagger={n > 8 ? 1 : 2}
						dur={DUR}
						tracking={p.tracking ?? 0}
						style={{fontStretch: p.stretch ? `${p.stretch}%` : undefined, marginLeft: i ? Math.round(p.size * 0.32) : 0}}
					/>
				);
			})}
		</div>
	);
};
