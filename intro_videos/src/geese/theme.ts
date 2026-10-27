// 雁沙龍形象影片・共用規格（唯讀：場景／站點檔不准改這裡）
// 兩支片：60 秒〈字的雁陣〉（112 BPM、一鏡到底）、30 秒〈一格一位〉（128 BPM、每拍硬切）
export const W = 1080;
export const H = 1920;
export const FPS = 60;

// 色票（全片只用這幾色、平塗，不用漸層、光暈、陰影）
export const G = {
	yellow: '#EED64F', // 雁黃（色相約 51°，跟安格斯 #FFB13B 的 36° 分開）
	yellowDeep: '#D6BB2C', // 深黃：60 秒的工作語言紋理字（低對比底紋）
	ink: '#1E1A17', // 墨：取自雁 logo
	paper: '#F3EEE3', // 價目紙
	pencil: '#8C857A', // 鉛筆灰：Mono 小標（只放在紙底上）
} as const;

// 字型（Chiron GoRound TC 可變字重 200–900；Anybody 可變字寬 50–150％＋字重 100–900）
export const F = {
	round: '"Chiron GoRound TC", "Noto Sans CJK TC", sans-serif',
	num: '"Anybody", "Chiron GoRound TC", sans-serif',
	mono: '"JetBrains Mono", "Chiron GoRound TC", monospace',
} as const;

// Reels 閱讀窗：要讀的字只能放在這裡（避開上 14％、下 35％、右側按鈕列）
export const READ = {left: 90, right: 880, top: 270, bottom: 1248, cx: 485, cy: 759} as const;

// 節拍換算（四捨五入到整數格）
export const BPM60 = 112;
export const BPM30 = 128;
/** 60 秒：第 n 拍（從 0 起算）的格數。1 拍 ≈ 32.14 格，1 小節 ≈ 128.57 格，28 小節＝3600 格 */
export const b60 = (n: number) => Math.round((n * 3600) / 112);
/** 60 秒：第 bar 小節（1 起算）第 beat 拍（1 起算）的格數 */
export const bar60 = (bar: number, beat = 1) => b60((bar - 1) * 4 + (beat - 1));
/** 30 秒：第 n 拍（從 0 起算）的格數。1 拍 = 28.125 格，1 小節 = 112.5 格，16 小節＝1800 格 */
export const b30 = (n: number) => Math.round((n * 1800) / 64);
export const bar30 = (bar: number, beat = 1) => b30((bar - 1) * 4 + (beat - 1));

export const TOTAL60 = 3600;
export const TOTAL30 = 1800;
