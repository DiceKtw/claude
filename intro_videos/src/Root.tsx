import React from 'react';
import {Composition} from 'remotion';
import {AngusVideo} from './angus/Video';
import {AkiraVideo} from './akira/Video';
import {FPS, H, TOTAL, W} from './lib/theme';
import {Geese60Video} from './geese/g60/Video';
import {Geese30Video} from './geese/g30/Video';

export const Root: React.FC = () => (
	<>
		<Composition id="Angus" component={AngusVideo} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
		<Composition id="Akira" component={AkiraVideo} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
		<Composition id="Geese60" component={Geese60Video} durationInFrames={3600} fps={FPS} width={W} height={H} />
		<Composition id="Geese30" component={Geese30Video} durationInFrames={1800} fps={FPS} width={W} height={H} />
	</>
);
