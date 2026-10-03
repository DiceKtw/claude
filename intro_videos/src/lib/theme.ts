// 共用規格（唯讀：場景檔不准改這裡，要改請回報總設計）
export const W = 1080;
export const H = 1920;
export const FPS = 60;
export const BPM = 120;
export const BEAT = 30; // 1 拍 = 30 格
export const BAR = 120; // 1 小節 = 120 格
export const TOTAL = 1800; // 30 秒

// Reels 安全區：上 14%、下 35%、左右 6% 不放重要文字
export const SAFE = {
	top: 269,
	bottom: 1248,
	left: 65,
	right: 1015,
} as const;

// 主內容區（HUD 佔 y 269–370，內容從 y 390 開始）
export const STAGE = {
	top: 390,
	bottom: 1240,
	left: 110,
	right: 970,
	cx: 540,
} as const;

export const beat = (n: number) => n * BEAT;
export const bar = (n: number) => n * BAR;

// 字體（雲端環境沒有勵字姚體，安格斯大標用思源黑體 Black 代替）
export const F = {
	display: '"Noto Sans CJK TC", "Noto Sans CJK JP", sans-serif',
	sans: '"Noto Sans CJK TC", "Noto Sans CJK JP", sans-serif',
	serif: '"Noto Serif CJK TC", serif',
	mono: '"JetBrains Mono", monospace',
} as const;

export type Brand = {
	key: 'angus' | 'akira';
	ink: string; // 深底
	paper: string; // 亮底／亮字
	accent: string; // 唯一強調色
	alert?: string; // 只用在「問題」
	muted: string; // 暖灰
	card: string; // 深色資訊卡
	line: number; // 主線寬
	hairline: number; // 細線寬
	displayWeight: number;
};

export const ANGUS: Brand = {
	key: 'angus',
	ink: '#141413',
	paper: '#FAF9F5',
	accent: '#FFB13B',
	alert: '#FF4A4A',
	muted: '#8A8578',
	card: '#141413',
	line: 3,
	hairline: 2,
	displayWeight: 900,
};

export const AKIRA: Brand = {
	key: 'akira',
	ink: '#141210',
	paper: '#f2ede4',
	accent: '#e8dcc8',
	muted: '#8f877b',
	card: '#1d1a17',
	line: 4,
	hairline: 1.5,
	displayWeight: 700,
};
