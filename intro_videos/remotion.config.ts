import fs from 'node:fs';
import {Config} from '@remotion/cli/config';

// 雲端 Linux 環境：用 Playwright 內建的 headless Chromium（不另外下載）＋軟體 GL。
// Windows／Mac：這個路徑不存在 → 交給 Remotion 第一次算圖時自動下載 Chrome Headless Shell。
const CLOUD_CHROMIUM = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
if (fs.existsSync(CLOUD_CHROMIUM)) {
	Config.setBrowserExecutable(CLOUD_CHROMIUM);
	Config.setChromiumOpenGlRenderer('swangle');
}
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
