// 雁沙龍兩支片的全部文案（唯讀）。畫面上的字只能用這裡的字串，不准自己加字、改字、加數字。
// 事實來源見 geese_brand/research.json（2026 年資料；Google 評論為 2026-09-19 截圖）。

export const C60 = {
	S1: {big: '先報價', sub: '確認價位之後，才開始服務。', flow: ['報價', '確認', '服務']},
	S2: {big: '燙・染', sub: '全程設計師操作', key: '設計師'},
	S3: {big: '每個月', sub: '都安排課程，精進技術', tag: '年度教育課程：剪髮・燙髮・染髮', ev: '不定期辦活動', evSub: '像是剪髮講座、陶藝課'},
	S4: {lead: '店裡還有', a: '廁所備衛生棉', b: '零食櫃'},
	S5: {brand: 'Google', num: '4.9', star: '★', note: '¹', count: '2,400+ 則評論', foot: '¹ 2026.09 查詢・Google 評論'},
	S6: {lead: '附設', big: '夜間洗髮'},
	S7: {big: '上班開心', sub: '是我們的文化', tag: '雁｜生活係髮廊'},
	S8: {a: '想找你的命定設計師，', b: '歡迎來雁沙龍。'},
	END: {
		name: '雁沙龍',
		en: 'GEESE MODEL HAIR SALON',
		night: '附設夜間洗髮',
		addr: '高雄市新興區民生一路 259 號',
		tel: '預約 07-281-3636',
		ig: 'IG @geese.model_hair',
	},
	// 工作語言紋理字（深黃、低對比，填滿筆畫）
	TEXTURE: ['報價', '確認', '服務', '剪', '燙', '染', '護', 'S', 'M', 'L', 'XL'],
} as const;

export const C30 = {
	A: {hour: '1 小時', ke: '客', line: '一個小時，只約一位。'},
	B: {line: '不會同一個時段，塞好幾位讓你等。'},
	C: {name: '雁沙龍', en: 'GEESE MODEL HAIR SALON｜高雄・新興區'},
	D: {line: '老實說，忙起來稍微等一下是正常的。'},
	E: {a: '燙', b: '染', tag: '設計師', line: '燙、染，全程設計師操作。'},
	F: {top: '從頭', bottom: '到尾', line: '從頭到尾，設計師自己操作。'},
	G: {num: '4.9', star: '★', line: 'Google 4.9★', count: '2,400+ 則評論（2026.09）'},
	H: {line: '晚上，附設夜間洗髮。'},
	I: {ni: '你', line: '這一個小時，只約你。'},
	J: {tel: '預約 07-281-3636', addr: '雁沙龍｜高雄市新興區民生一路 259 號', ig: 'IG @geese.model_hair'},
} as const;

const flat = (o: unknown): string[] =>
	typeof o === 'string' ? [o] : Array.isArray(o) ? o.flatMap(flat) : o && typeof o === 'object' ? Object.values(o).flatMap(flat) : [];
export const ALL_TEXT = [...flat(C60), ...flat(C30), '0123456789'];
