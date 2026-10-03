import React from 'react';
import {Composition} from 'remotion';
import {AngusVideo} from './angus/Video';
import {AkiraVideo} from './akira/Video';
import {FPS, H, TOTAL, W} from './lib/theme';

export const Root: React.FC = () => (
	<>
		<Composition id="Angus" component={AngusVideo} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
		<Composition id="Akira" component={AkiraVideo} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
	</>
);
