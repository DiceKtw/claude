// 開發用 entry（60 秒〈字的雁陣〉）：只打包這一組
// 總表：node tools/sheet.mjs src/entries/geese60_g2.tsx out/stills/geese60_g2/sheet.png <起> <迄> <每幾格> [欄數=6] [縮放=0.3]
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {G60} from '../geese/g60/defs';
import {S3} from '../geese/g60/stations/S3';
import {S4} from '../geese/g60/stations/S4';

const DevComp: React.FC = () => <G60 parts={{S3, S4}} />;
registerRoot(() => <Composition id="Dev" component={DevComp} durationInFrames={3600} fps={60} width={1080} height={1920} />);
