// 開發用 entry（30 秒〈一格一位〉）：只打包這一組
// 總表：node tools/sheet.mjs src/entries/geese30_g1.tsx out/stills/geese30_g1/sheet.png <起> <迄> <每幾格> [欄數=6] [縮放=0.3]
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {G30} from '../geese/g30/defs';
import {A} from '../geese/g30/shots/A';
import {B} from '../geese/g30/shots/B';
import {C} from '../geese/g30/shots/C';
import {D} from '../geese/g30/shots/D';
import {E} from '../geese/g30/shots/E';

const DevComp: React.FC = () => <G30 parts={{A, B, C, D, E}} />;
registerRoot(() => <Composition id="Dev" component={DevComp} durationInFrames={1800} fps={60} width={1080} height={1920} />);
