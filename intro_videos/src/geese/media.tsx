// 雁沙龍實拍素材（logo、設計師作品照、短片）的共用元件。
// 檔案放在 public/geese/ 底下才會出現；檔案還沒到時：Studio 裡顯示虛線框＋預定檔名，正式算圖時什麼都不畫。
import React from 'react';
import {Img, OffthreadVideo, Sequence, getRemotionEnvironment, getStaticFiles, staticFile} from 'remotion';
import {E, clamp, prog} from '../lib/motion';
import {F, G} from './theme';

/** public/ 底下有這個檔才回傳網址，沒有就回傳 null */
export const mediaSrc = (rel: string) => (getStaticFiles().some((s) => s.name === rel) ? staticFile(rel) : null);

/** 列出某個資料夾裡的檔名（照檔名排序），例如 listMedia('geese/photos/') */
export const listMedia = (prefix: string) =>
	getStaticFiles()
		.map((s) => s.name)
		.filter((n) => n.startsWith(prefix))
		.sort();

const isVideoFile = (rel: string) => /\.(mp4|mov|webm|m4v)$/i.test(rel);

type Reveal = 'up' | 'down' | 'left' | 'right' | 'none';

/**
 * 實拍畫面框：at 那一格開始用 clip 擦出來（10 格 outExpo），之後整段慢推 push（預設 4%）。
 * file 是 public/ 底下的相對路徑，例如 'geese/photos/01_bob.jpg' 或 'geese/clips/03_cut.mp4'。
 * 短片從 at 那一格開始播，trim 是從素材第幾格開始（60fps 的格數）。
 */
export const PhotoFrame: React.FC<{
	f: number;
	file: string;
	at: number;
	until: number; // 這張停到第幾格（慢推的終點）
	x: number;
	y: number;
	w: number;
	h: number;
	border?: number; // 墨框粗細（0 = 不要框）
	reveal?: Reveal;
	push?: number;
	focus?: string; // object-position，例如 '50% 30%'（臉偏上時往上對）
	trim?: number;
	style?: React.CSSProperties;
}> = ({f, file, at, until, x, y, w, h, border = 10, reveal = 'up', push = 0.04, focus = '50% 50%', trim = 0, style}) => {
	const src = mediaSrc(file);
	if (!src) {
		if (!getRemotionEnvironment().isStudio) return null;
		return (
			<div style={{position: 'absolute', left: x, top: y, width: w, height: h, boxSizing: 'border-box', border: `4px dashed ${G.pencil}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.mono, fontSize: 22, color: G.pencil, padding: 12, textAlign: 'center', wordBreak: 'break-all', ...style}}>
				缺素材：public/{file}
			</div>
		);
	}
	if (f < at) return null;
	const p = prog(f, at, 10, E.outExpo);
	const cut = (1 - p) * 100;
	const clip =
		reveal === 'up' ? `inset(${cut}% 0 0 0)` : reveal === 'down' ? `inset(0 0 ${cut}% 0)` : reveal === 'left' ? `inset(0 0 0 ${cut}%)` : reveal === 'right' ? `inset(0 ${cut}% 0 0)` : 'none';
	const scale = 1 + push * (1 - clamp((f - at) / Math.max(1, until - at)));
	const media: React.CSSProperties = {width: '100%', height: '100%', objectFit: 'cover', objectPosition: focus, transform: `scale(${scale.toFixed(4)})`};
	return (
		<div style={{position: 'absolute', left: x, top: y, width: w, height: h, boxSizing: 'border-box', border: border ? `${border}px solid ${G.ink}` : undefined, overflow: 'hidden', clipPath: clip, background: G.ink, ...style}}>
			{isVideoFile(file) ? (
				<Sequence from={at} layout="none">
					<OffthreadVideo src={src} muted trimBefore={trim || undefined} style={media} />
				</Sequence>
			) : (
				<Img src={src} style={media} />
			)}
		</div>
	);
};
