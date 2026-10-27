// 開發用 entry（60 秒〈字的雁陣〉）：只打包這一組
// 總表：node tools/sheet.mjs src/entries/geese60_g4.tsx out/stills/geese60_g4/sheet.png <起> <迄> <每幾格> [欄數=6] [縮放=0.3]
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {G60} from '../geese/g60/defs';
import {S7} from '../geese/g60/stations/S7';
import {S8} from '../geese/g60/stations/S8';

const DevComp: React.FC = () => <G60 parts={{S7, S8}} />;
registerRoot(() => <Composition id="Dev" component={DevComp} durationInFrames={3600} fps={60} width={1080} height={1920} />);
