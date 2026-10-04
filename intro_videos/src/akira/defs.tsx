// Akira：場景排程、轉場、HUD（唯讀；這個檔不 import 任何場景，開發 entry 只 import 自己的場景）
import React from 'react';
import {Master, SceneDef, SceneProps} from '../lib/Master';
import {Hud} from '../lib/Hud';
import {Grain} from '../lib/components';
import {AKIRA} from '../lib/theme';
import {T, TR} from './timeline';

export const AKIRA_META: Omit<SceneDef, 'C'>[] = [
	{id: 'S0', ...T.S0, enter: TR.cut, exit: TR.cut},
	{id: 'S1', ...T.S1, enter: TR.wipeDownS1, exit: TR.liftS1},
	{id: 'S2', ...T.S2, enter: TR.cut, exit: TR.cut},
	{id: 'S3', ...T.S3, enter: TR.wipeRightS3, exit: TR.cut},
	{id: 'S4', ...T.S4, enter: TR.dissolveS4, exit: TR.cut},
	{id: 'S5', ...T.S5, enter: TR.dissolveS5, exit: TR.cut},
];

export const akiraOverlay = (f: number) => (
	<>
		<Hud
			f={f}
			brand={AKIRA}
			label="川沙龍 · AKIRA"
			appear={200}
			quiet
			showIndex={false}
			modes={[{from: 0, mode: 'dark'}]}
			chapters={[
				{from: 0, num: '00', label: '細節'},
				{from: 240, num: '01', label: '檔案'},
				{from: 600, num: '02', label: '美感'},
				{from: 960, num: '03', label: '經驗'},
				{from: 1200, num: '04', label: '回頭客'},
			]}
			hideFrom={1416}
			hideDur={24}
			rightText={(f) => `NOTE ${f < 240 ? '00' : f < 600 ? '01' : f < 960 ? '02' : f < 1200 ? '03' : '04'} / 04`}
		/>
		<Grain f={f} opacity={0.05} />
	</>
);

export const buildAkira = (map: Record<string, React.FC<SceneProps>>): SceneDef[] =>
	AKIRA_META.filter((m) => map[m.id]).map((m) => ({...m, C: map[m.id]}));

export const AkiraDev: React.FC<{map: Record<string, React.FC<SceneProps>>}> = ({map}) => (
	<Master scenes={buildAkira(map)} overlay={akiraOverlay} />
);
