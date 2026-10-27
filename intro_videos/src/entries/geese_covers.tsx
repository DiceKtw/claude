// 雁沙龍兩張封面（1 格）：
//   node tools/sheet.mjs src/entries/geese_covers.tsx out/cover60/ --frames=0 1 --comp=Cover60
//   node tools/sheet.mjs src/entries/geese_covers.tsx out/cover30/ --frames=0 1 --comp=Cover30
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Cover as Cover60} from '../geese/g60/stations/Cover';
import {Cover as Cover30} from '../geese/g30/shots/Cover';

const Root: React.FC = () => (
	<>
		<Composition id="Cover60" component={Cover60} durationInFrames={1} fps={60} width={1080} height={1920} />
		<Composition id="Cover30" component={Cover30} durationInFrames={1} fps={60} width={1080} height={1920} />
	</>
);
registerRoot(Root);
