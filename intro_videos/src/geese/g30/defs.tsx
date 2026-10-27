// 30 秒〈一格一位〉總裝（唯讀；這個檔不 import 任何鏡頭，開發 entry 只 import 自己那組）
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {G} from '../theme';
import {ensureGeeseFonts} from '../fonts';
import {ALL_TEXT} from '../copy';
import {SH, SHOTS, ShotId, ShotProps} from './kit';

ensureGeeseFonts(ALL_TEXT);

export type Parts30 = Partial<Record<ShotId, React.FC<ShotProps>>>;

/** 全部硬切：每一格只畫當下那一個鏡頭（全域格數傳進去） */
export const G30: React.FC<{parts: Parts30}> = ({parts}) => {
	const f = useCurrentFrame();
	let cur: ShotId | null = null;
	for (const id of SHOTS) if (f >= SH[id].from && f < SH[id].to) cur = id;
	const C = cur ? parts[cur] : undefined;
	return <AbsoluteFill style={{background: G.paper}}>{C ? <C f={f} /> : null}</AbsoluteFill>;
};
