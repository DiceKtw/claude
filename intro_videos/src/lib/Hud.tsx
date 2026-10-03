// 常駐紀錄框（HUD，唯讀）。只放在上方安全區（y 269–370），下方被 IG 介面蓋住，不放文字。
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Brand, F, FPS, SAFE, TOTAL, W} from './theme';
import {E, clamp, mixHex, prog, pulseAt, beatsFrom} from './motion';

export type HudMode = {from: number; mode: 'dark' | 'light'}; // dark = 深底（HUD 用亮色）
export type Chapter = {from: number; num: string; label: string};

const modeAt = (f: number, modes: HudMode[]) => {
	let m: 'dark' | 'light' = modes[0]?.mode ?? 'dark';
	for (const x of modes) if (f >= x.from) m = x.mode;
	return m;
};

const tc = (f: number) => {
	const fr = Math.max(0, Math.floor(f));
	const s = Math.floor(fr / FPS);
	const ff = fr % FPS;
	const p = (n: number) => String(n).padStart(2, '0');
	return `TC 00:00:${p(s)}:${p(ff)}`;
};

export const Hud: React.FC<{
	f: number;
	brand: Brand;
	label: string; // 左上品牌名
	modes: HudMode[];
	chapters: Chapter[];
	appear: number; // 開始出現的格數
	hideFrom?: number; // 從這格開始淡出（Akira 結尾金句卡）
	hideDur?: number;
	quiet?: boolean; // Akira：點不脈動、字距放大、章節用 —
	rightText?: (f: number) => string; // 右上文字（預設時間碼）
	showIndex?: boolean; // 右側第二列的章節序號
}> = ({f, brand, label, modes, chapters, appear, hideFrom, hideDur = 20, quiet = false, rightText, showIndex = true}) => {
	if (f < appear - 1) return null;
	const mode = modeAt(f, modes);
	const fg = mode === 'dark' ? brand.paper : brand.ink;
	const fgSoft = mode === 'dark' ? 'rgba(250,249,245,0.62)' : 'rgba(20,20,19,0.62)';
	const fade = hideFrom !== undefined ? 1 - prog(f, hideFrom, hideDur, E.inOutSine) : 1;
	if (fade <= 0) return null;

	const a = (k: number, dur = 14) => prog(f, appear + k, dur, quiet ? E.outCubic : E.outExpo);
	const arm = 26;
	const bw = quiet ? 1.5 : 2;
	const corners: [number, number, number, number][] = [
		[SAFE.left, SAFE.top, 1, 1],
		[SAFE.right, SAFE.top, -1, 1],
		[SAFE.left, SAFE.bottom, 1, -1],
		[SAFE.right, SAFE.bottom, -1, -1],
	];

	// 目前章節（換章時舊的往上收、新的從下面升起）
	let ci = 0;
	for (let i = 0; i < chapters.length; i++) if (f >= chapters[i].from) ci = i;
	const cur = chapters[ci];
	const prev = ci > 0 ? chapters[ci - 1] : undefined;
	const inP = prog(f, cur.from, quiet ? 22 : 14, quiet ? E.outCubic : E.outExpo);
	const outP = prev ? prog(f, cur.from - 2, 10, E.inExpo) : 1;

	const beats = beatsFrom(0, 60, 30);
	const dotScale = quiet ? 1 : pulseAt(f, beats, 10, 0.45);
	const progress = clamp(f / TOTAL);
	const idxText = `${String(ci + 1).padStart(2, '0')} / ${String(chapters.length).padStart(2, '0')}`;
	const track = quiet ? '0.3em' : '0.12em';

	const row1 = SAFE.top + 22;
	const row2 = SAFE.top + 62;

	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: fade}}>
			<svg width={W} height={1920} style={{position: 'absolute'}}>
				{corners.map(([x, y, sx, sy], i) => {
					const p = a(i * 2, 18);
					return (
						<g key={i} opacity={quiet ? 0.5 : 0.6}>
							<line x1={x} y1={y} x2={x + sx * arm * p} y2={y} stroke={fg} strokeWidth={bw} />
							<line x1={x} y1={y} x2={x} y2={y + sy * arm * p} stroke={fg} strokeWidth={bw} />
						</g>
					);
				})}
				{/* 右側進度軌 */}
				<line x1={SAFE.right - 230} y1={row2 + 14} x2={SAFE.right - 30} y2={row2 + 14} stroke={fgSoft} strokeWidth={1} opacity={a(10)} />
				<line
					x1={SAFE.right - 230}
					y1={row2 + 14}
					x2={SAFE.right - 230 + 200 * progress * a(10)}
					y2={row2 + 14}
					stroke={brand.accent}
					strokeWidth={quiet ? 1.5 : 3}
				/>
			</svg>

			{/* 左上：點＋品牌名 */}
			<div
				style={{
					position: 'absolute',
					left: SAFE.left + 30,
					top: row1 - 4,
					display: 'flex',
					alignItems: 'center',
					gap: 12,
					clipPath: `inset(0 ${(1 - a(4, 16)) * 100}% 0 0)`,
				}}
			>
				<div style={{width: 12, height: 12, borderRadius: 6, background: brand.accent, transform: `scale(${dotScale})`}} />
				<div style={{fontFamily: F.mono, fontSize: 21, color: fg, letterSpacing: track, whiteSpace: 'pre'}}>{label}</div>
			</div>

			{/* 右上：時間碼 */}
			<div
				style={{
					position: 'absolute',
					right: W - SAFE.right + 30,
					top: row1 - 4,
					fontFamily: F.mono,
					fontSize: 21,
					color: fgSoft,
					letterSpacing: quiet ? '0.2em' : '0.06em',
					opacity: a(6),
				}}
			>
				{rightText ? rightText(f) : tc(f)}
			</div>

			{/* 左側第二列：章節標籤 */}
			<div style={{position: 'absolute', left: SAFE.left + 30, top: row2 - 6, height: 34, overflow: 'hidden', width: 520}}>
				{prev && outP < 1 ? (
					<div style={{position: 'absolute', transform: `translateY(${-outP * 34}px)`, display: 'flex', gap: 12, alignItems: 'baseline'}}>
						<ChapterText ch={prev} fg={fg} accent={brand.accent} quiet={quiet} />
					</div>
				) : null}
				<div
					style={{
						position: 'absolute',
						transform: `translateY(${(1 - inP) * 34}px)`,
						opacity: quiet ? inP : 1,
						display: 'flex',
						gap: 12,
						alignItems: 'baseline',
					}}
				>
					<ChapterText ch={cur} fg={fg} accent={brand.accent} quiet={quiet} />
				</div>
			</div>

			{/* 右側第二列：章節序號 */}
			{showIndex ? <div
				style={{
					position: 'absolute',
					right: W - SAFE.right + 30,
					top: row2 + 22,
					fontFamily: F.mono,
					fontSize: 17,
					color: fgSoft,
					letterSpacing: '0.1em',
					opacity: a(12),
				}}
			>
				{idxText}
			</div> : null}
		</AbsoluteFill>
	);
};

const ChapterText: React.FC<{ch: Chapter; fg: string; accent: string; quiet: boolean}> = ({ch, fg, accent, quiet}) => (
	<>
		<span style={{fontFamily: F.mono, fontSize: 20, color: accent, letterSpacing: '0.08em'}}>
			{quiet ? `— ${ch.num}` : `§ ${ch.num}`}
		</span>
		<span style={{fontFamily: F.sans, fontSize: 24, fontWeight: 500, color: fg, letterSpacing: quiet ? '0.24em' : '0.06em'}}>
			{ch.label}
		</span>
	</>
);

/** HUD 換色時用的過渡色（給場景自己畫的元素參考） */
export const hudColor = (brand: Brand, mode: 'dark' | 'light', t = 1) =>
	mixHex(mode === 'dark' ? brand.ink : brand.paper, mode === 'dark' ? brand.paper : brand.ink, t);
