// 開發用 entry（30 秒〈一格一位〉）：只打包這一組
// 總表：node tools/sheet.mjs src/entries/geese30_g2.tsx out/stills/geese30_g2/sheet.png <起> <迄> <每幾格> [欄數=6] [縮放=0.3]
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {G30} from '../geese/g30/defs';
import {F} from '../geese/g30/shots/F';
import {G} from '../geese/g30/shots/G';
import {H} from '../geese/g30/shots/H';
import {I} from '../geese/g30/shots/I';
import {J} from '../geese/g30/shots/J';

const DevComp: React.FC = () => <G30 parts={{F, G, H, I, J}} />;
registerRoot(() => <Composition id="Dev" component={DevComp} durationInFrames={1800} fps={60} width={1080} height={1920} />);
