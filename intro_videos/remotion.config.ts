import {Config} from '@remotion/cli/config';

// 雲端環境用 Playwright 內建的 headless Chromium，不另外下載
Config.setBrowserExecutable('/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setChromiumOpenGlRenderer('swangle');
