// 安格斯：場景排程、轉場、HUD（唯讀；這個檔不 import 任何場景，開發 entry 只 import 自己的場景）
import React from 'react';
import {Master, SceneDef, SceneProps} from '../lib/Master';
import {Hud} from '../lib/Hud';
import {Grain} from '../lib/components';
import {ANGUS} from '../lib/theme';
import {T, TR} from './timeline';

export const ANGUS_META: Omit<SceneDef, 'C'>[] = [
	{id: 'S0', ...T.S0, enter: TR.cut, exit: TR.cut},
	{id: 'S1', ...T.S1, enter: TR.irisS1, exit: TR.blindsS1},
	{id: 'S2', ...T.S2, enter: TR.cut, exit: TR.cut},
	{id: 'S3', ...T.S3, enter: TR.fillS3, exit: TR.slideS3},
	{id: 'S4', ...T.S4, enter: TR.cut, exit: TR.cut},
	{id: 'S5', ...T.S5, enter: TR.cut, exit: TR.cut},
	{id: 'S6', ...T.S6, enter: TR.cut, exit: TR.cut},
];

// HUD 換色：等轉場剛好蓋滿的那一格才換
const MONTAGE_MODES = (['dark', 'light', 'light', 'dark', 'light', 'light', 'dark', 'light'] as const).map((mode, i) => ({
	from: 1320 + i * 15,
	mode,
}));

export const angusOverlay = (f: number) => (
	<>
		<Hud
			f={f}
			brand={ANGUS}
			label="雁沙龍 · ANGUS COACHING"
			appear={196}
			modes={[
				{from: 0, mode: 'dark'},
				{from: 238, mode: 'light'},
				{from: 598, mode: 'dark'},
				{from: 838, mode: 'light'},
				{from: 1078, mode: 'light'},
				...MONTAGE_MODES,
				{from: 1440, mode: 'dark'},
			]}
			chapters={[
				{from: 0, num: '00', label: '問題'},
				{from: 240, num: '01', label: '檔案'},
				{from: 600, num: '02', label: '行銷'},
				{from: 840, num: '03', label: '經營'},
				{from: 1080, num: '04', label: '成果'},
				{from: 1320, num: '05', label: '關鍵字'},
				{from: 1440, num: '06', label: '聯絡'},
			]}
			hideFrom={1772}
			hideDur={16}
		/>
		<Grain f={f} opacity={0.06} />
	</>
);

export const buildAngus = (map: Record<string, React.FC<SceneProps>>): SceneDef[] =>
	ANGUS_META.filter((m) => map[m.id]).map((m) => ({...m, C: map[m.id]}));

export const AngusDev: React.FC<{map: Record<string, React.FC<SceneProps>>}> = ({map}) => (
	<Master scenes={buildAngus(map)} overlay={angusOverlay} />
);
