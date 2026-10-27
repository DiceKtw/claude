// 開發用 entry（60 秒〈字的雁陣〉）：只打包這一組
// 總表：node tools/sheet.mjs src/entries/geese60_g1.tsx out/stills/geese60_g1/sheet.png <起> <迄> <每幾格> [欄數=6] [縮放=0.3]
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {G60} from '../geese/g60/defs';
import {S1} from '../geese/g60/stations/S1';
import {S2} from '../geese/g60/stations/S2';

const DevComp: React.FC = () => <G60 parts={{S1, S2}} />;
registerRoot(() => <Composition id="Dev" component={DevComp} durationInFrames={3600} fps={60} width={1080} height={1920} />);
