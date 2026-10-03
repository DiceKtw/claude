// 開發用 entry：只打包這一組的場景（別組的檔壞掉不影響這裡）
// 單格：npx remotion still src/entries/angus_g3.tsx Dev out/stills/angus_g3/f0600.png --frame=600 --log=error
// 總表：node tools/sheet.mjs src/entries/angus_g3.tsx out/stills/angus_g3/sheet.png <起> <迄> <每幾格> [欄數=6] [縮放=0.3]
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {AngusDev} from '../angus/defs';
import {FPS, H, TOTAL, W} from '../lib/theme';
import {S4} from '../angus/scenes/S4';
import {S5} from '../angus/scenes/S5';
import {S6} from '../angus/scenes/S6';

const C: React.FC = () => <AngusDev map={{S4, S5, S6}} />;
registerRoot(() => <Composition id="Dev" component={C} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />);
