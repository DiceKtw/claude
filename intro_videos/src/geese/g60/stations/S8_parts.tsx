// 60 秒〈字的雁陣〉S8 用的小元件（只給 S8.tsx 用）
import React from 'react';
import {DirBlur} from '../../../lib/components';
import {E, clamp, prog} from '../../../lib/motion';
import {F, G} from '../../theme';
import {FULL} from './S7_parts';

const word: React.CSSProperties = {position: 'absolute', top: 0, fontFamily: F.round, fontWeight: 900, color: G.ink, lineHeight: 1, whiteSpace: 'pre'};

/**
 * 整行順著筆勢由右往左飛進（inOutExpo）：領頭的是最左邊的字，後面每個字晚 lag 格起飛，
 * 飛行中整行被拉開成一道往右上斜的梯隊（像「/」短筆畫的方向），落地時後面的字追上、壓回一行。
 */
export const FlightLine: React.FC<{
	f: number;
	text: string;
	x: number;
	y: number;
	size: number;
	start: number; // 領頭字起飛格
	dur?: number;
	lag?: number;
	from: {dx: number; dy: number};
	creep?: {from: number; to: number; px: number}; // 落地後沿飛行方向慢慢滑行（滑行量 px，結束在 x）
}> = ({f, text, x, y, size, start, dur = 20, lag = 0.45, from, creep}) => {
	const chars = Array.from(text);
	const p = (i: number, ff: number) => E.inOutExpo(clamp((ff - start - i * lag) / dur));
	const glide = (ff: number) => (creep ? creep.px * (1 - prog(ff, creep.from, creep.to - creep.from, E.inOutSine)) : 0);
	if (f < start - 1) return null;
	const mid = Math.floor(chars.length / 2);
	const vx = from.dx * (p(mid, f - 0.5) - p(mid, f + 0.5));
	const vy = from.dy * (p(mid, f - 0.5) - p(mid, f + 0.5));
	const g = glide(f);
	return (
		<div style={{position: 'absolute', left: 0, top: y - 40, width: 790, height: size + 80}}>
			<DirBlur x={Math.abs(vx) * 0.11} y={Math.abs(vy) * 0.11} style={FULL}>
				{chars.map((ch, i) => {
					const q = 1 - p(i, f);
					return (
						<span key={i} style={{...word, fontSize: size, left: x + i * size + g + from.dx * q, top: 40 + from.dy * q}}>
							{ch}
						</span>
					);
				})}
			</DirBlur>
		</div>
	);
};

/**
 * 「雁」領頭的上浮：中間的「雁」先起飛，兩側往外每遠一個字晚 stagger 格（像雁群起飛），每字 outExpo 浮上 dy。
 * skip：不在這裡畫的字（索引），留給別的元件。
 */
export const LeadRise: React.FC<{
	f: number;
	text: string;
	x: number;
	y: number;
	size: number;
	start: number; // 領頭字起跑格
	leader: number;
	stagger?: number;
	dy?: number;
	dur?: number;
	skip?: number[];
}> = ({f, text, x, y, size, start, leader, stagger = 3, dy = 44, dur = 16, skip = []}) => {
	const chars = Array.from(text);
	if (f < start - 1) return null;
	return (
		<div style={{position: 'absolute', left: x, top: y, width: chars.length * size, height: size}}>
			{chars.map((ch, i) => {
				if (skip.includes(i)) return null;
				const s0 = start + Math.abs(i - leader) * stagger;
				const t = prog(f, s0, dur, E.outExpo);
				return (
					<span key={i} style={{...word, fontSize: size, left: i * size, opacity: clamp((f - s0 + 1) / 4), transform: `translateY(${((1 - t) * dy).toFixed(2)}px)`}}>
						{ch}
					</span>
				);
			})}
		</div>
	);
};

/** 句點「。」在拍點那格彈到最大（outBack 過衝約 10%），像蓋上最後一個點 */
export const DotPop: React.FC<{f: number; ch: string; x: number; y: number; size: number; hit: number; dur?: number; origin: string}> = ({f, ch, x, y, size, hit, dur = 12, origin}) => {
	const s0 = hit - Math.round(dur * 0.573);
	if (f < s0) return null;
	const s = E.outBack(clamp((f - s0) / dur));
	return <span style={{...word, fontSize: size, left: x, top: y, transformOrigin: origin, transform: `scale(${s.toFixed(4)})`}}>{ch}</span>;
};
