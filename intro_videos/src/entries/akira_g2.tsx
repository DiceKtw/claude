// 開發用 entry：只打包這一組的場景（別組的檔壞掉不影響這裡）
// 單格：npx remotion still src/entries/akira_g2.tsx Dev out/stills/akira_g2/f0600.png --frame=600 --log=error
// 總表：node tools/sheet.mjs src/entries/akira_g2.tsx out/stills/akira_g2/sheet.png <起> <迄> <每幾格> [欄數=6] [縮放=0.3]
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {AkiraDev} from '../akira/defs';
import {FPS, H, TOTAL, W} from '../lib/theme';
import {S3} from '../akira/scenes/S3';
import {S4} from '../akira/scenes/S4';
import {S5} from '../akira/scenes/S5';

const C: React.FC = () => <AkiraDev map={{S3, S4, S5}} />;
registerRoot(() => <Composition id="Dev" component={C} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />);
