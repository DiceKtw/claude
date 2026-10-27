# 雁沙龍形象片 交接說明（雲端 → Windows）

這份是給 Windows 上的 Claude Code 看的。雲端 session 做到 v2，因為雲端網路擋 IG／FB／Drive 下載，拿不到 logo 和設計師作品照，所以 v2 兩支都**沒有 logo、沒有實拍畫面**。使用者看完 v2 的原話：

> 完全看不到改了甚麼，我就說要放上實際畫面了，你這版兩個檔案甚至連LOGO都沒有，把目前進度拉到WINDOWS端繼續修正

所以 v3 的及格線只有三條，其他都排在後面：

1. **logo 要出現**：60 秒的 logo 時刻＋片尾、30 秒的名牌（鏡頭 C）＋片尾（鏡頭 J）、兩張封面。
2. **設計師的作品／工作畫面要放進去，而且要看得到**：佔那一段畫面的主要位置（建議 ≥ 畫面 40%），不是角落小圖。
3. **交片時讓使用者一眼看出改了什麼**：每個改動附「v2 同一格 vs v3 同一格」的對照截圖，不要只寫一串修正清單。

---

## 1. 拉下來、裝環境（在 Git Bash 裡跑）

```bash
git fetch origin claude/eloquent-hypatia-fs19ys
git checkout claude/eloquent-hypatia-fs19ys
git pull origin claude/eloquent-hypatia-fs19ys
cd intro_videos
npm ci
```

需要的東西：

| 工具 | 用途 | 沒有的話 |
|---|---|---|
| Node 18 以上（雲端用 22） | Remotion | 裝 Node LTS |
| ffmpeg、ffprobe 在 PATH | 輸出、對照圖、壞格掃描 | `winget install Gyan.FFmpeg`，重開終端機 |
| Python＋numpy | `tools/glitch_scan.py` | `pip install numpy` |
| Python＋numpy＋scipy | 只有要重新合成配樂才需要 | 配樂成品已經在 `audio/geese60.wav`、`audio/geese30.wav` |

- 第一次算圖時 Remotion 會自動下載 Chrome Headless Shell，不用自己裝瀏覽器。
- `remotion.config.ts`、`tools/sheet.mjs` 已經改成：有雲端的 Chromium 路徑才用，沒有就自動下載。
- `.gitattributes` 讓 `.sh`／`.py` 保持 LF 換行，Git Bash 才跑得動。

常用指令（都在 `intro_videos/` 底下）：

```bash
npx tsc --noEmit                         # 型別檢查
npx remotion studio src/index.ts         # 預覽，左邊選 Geese60 或 Geese30
# 單格原尺寸 PNG（scale 0.5 = 540×960）
node tools/sheet.mjs src/index.ts out/chk/ --frames=600,1200,2400 0.5 --comp=Geese60
# 縮圖總表：0～3599 每 60 格一張、10 欄、縮 0.2
node tools/sheet.mjs src/index.ts out/sheet60.png 0 3599 60 10 0.2 --comp=Geese60
# 正式輸出（算圖→掃壞格→補格→轉 BT.709→封配樂→再掃一次），第二個參數是併發數
bash tools/export.sh geese60 4           # → out/video/geese60_final.mp4
bash tools/export.sh geese30 4           # → out/video/geese30_final.mp4
```

v2 成品在 `deliverables/雁沙龍_形象_60秒_字的雁陣_v2.mp4`、`deliverables/雁沙龍_形象_30秒_一格一位_v2.mp4`，做對照圖時用 `ffmpeg -ss <秒> -i <v2.mp4> -frames:v 1 v2_fNNNN.png` 取同一格。

---

## 2. 素材放哪裡

```
intro_videos/public/geese/
  logo_ink.png      深墨色 logo，透明底，長邊 ≥ 1600px
  logo_white.png    白色 logo，透明底
  photos/NN_描述.jpg  設計師作品照、工作照（例：03_perm_wave.jpg）
  clips/NN_描述.mp4   短片（直式或可裁成直式，2–6 秒就好）
  SOURCES.md        每個檔的來源（IG 帳號／貼文網址／設計師是誰）、日期、有沒有拍到客人的臉
```

**logo**：使用者選了「用重描版」。重描版在使用者的 Google Drive（從 FB 民生店大頭貼重描的高解析透明檔，形狀已跟原圖比對過）：

- `雁_logo_深墨_高解析.png`（Drive ID `1cyhdWOR_Iv0KoTrQjgNrYwfnj04y7wc7`）→ 存成 `logo_ink.png`
- `雁_logo_白_高解析.png`（Drive ID `1NIM3h6uh66OJqLjyjpx3v0uqaFpLSlcp`）→ 存成 `logo_white.png`
- 還有銅棕版 `雁_logo_銅棕_高解析.png`（`1kDARgD4o2YvhS-XxbceBSmPvZoibT57o`），目前不用。
- 客戶規則（10/23）：logo **形狀不能改**，可以換顏色或渲染方式；logo **不能被畫面切到**。

**設計師畫面**：使用者原話是「希望畫面可以用一些他們設計師的畫面，你可以從官方IG上面或是設計師的IG作品集找可以用的畫面當素材」。官方 IG 是 @geese.model_hair；Wenwen、Johnson 兩位設計師的 IG 也寫高雄雁沙龍。挑素材的原則：

- 一看就懂在拍什麼：剪髮手部特寫、燙／染過程、完成的髮型（背面、側面）、洗髮台、店內。客戶最常用的退件詞是「意味不明」：看不出在拍什麼的空鏡、只有牆面、同一顆頭並排，都被退過。
- 客人的臉：清楚拍到臉的，要先跟使用者確認有沒有同意，沒把握就挑背面或側面。在 SOURCES.md 標出來。
- 不要有別家浮水印、文字貼圖。
- 解析度：要放大到半個畫面以上的，寬至少 1080px。

`logoSrc()` 已經接好：`logo_ink.png` 一放進去，60 秒的 logo 時刻／片尾、30 秒的 C／J 就會自動改用 logo 圖（沒有檔案時才用店名文字代替）。但版面是照文字版設計的，放進 logo 後**一定要看過大小、位置**再調。

---

## 3. 實拍畫面怎麼放進去（建議，看到素材再調）

新的共用元件 `src/geese/media.tsx`（已寫好、過型別檢查）：

```tsx
import {PhotoFrame, mediaSrc, listMedia} from '../../media';
// 在 at 那一格從下往上擦出、停到 until 慢推 4%；檔案還沒到時 Studio 會顯示虛線框＋檔名，正式算圖不畫
<PhotoFrame f={f} file="geese/photos/03_perm.jpg" at={ST.S2.from + 20} until={ST.S2.to} x={0} y={420} w={790} h={560} focus="50% 30%" />
// 短片也一樣，副檔名是 .mp4 就自動用 OffthreadVideo（靜音）播
<PhotoFrame f={f} file="geese/clips/01_cut.mp4" at={...} until={...} x y w h trim={30} />
```

照片也要守全片的規矩：**每一格都會動**（客戶規則：除了片尾資訊卡和 logo 時刻，靜止超過 1 秒要改），出現、換張都要落在拍上。不要做成照片投影片或素材拼貼，照片要跟字的動態系統一起動。

### 60 秒〈字的雁陣〉

整支一鏡到底：鏡頭沿著一個「>」形的字地圖走 8 站，最後拉遠看到整張地圖排成雁陣，再出 logo 和片尾。每一站的內容寫在 `src/geese/g60/stations/S1.tsx`～`S8.tsx`，用 `StationBox`，站內座標 0–790 × 0–978（鏡頭停在那站時＝畫面上的閱讀窗 x 90–880、y 270–1248）。

建議做法：照片放在**站點的世界座標裡**（放在 `StationBox` 裡），鏡頭移動時照片跟著字一起移動，像地圖上的一部分。閱讀窗下方（y 1248 以下）到畫面底部也可以放照片，照片被 IG 介面蓋到一點沒關係，字不行。

| 站 | 時間（格，60fps） | 內容 | 建議配的畫面 |
|---|---|---|---|
| S1 | 0–256 | 先報價 → 確認 → 服務 | 設計師跟客人在鏡子前討論 |
| S2 | 257–513 | 燙・染 全程設計師操作 | **燙、染過程**（最合適的一站） |
| S3 | 514–899 | 每個月都安排課程、講座、陶藝課 | 上課／講座照（有才放） |
| S4 | 900–1156 | 廁所備衛生棉、零食櫃 | 零食櫃（有才放，沒有就保持文字） |
| S5 | 1157–1542 | Google 4.9★ 2,400+ 則評論 | **作品集快速換 3–4 張**，每拍換一張 |
| S6 | 1543–1928 | 附設夜間洗髮 | 洗髮台、晚上的店面 |
| S7 | 1929–2313 | 上班開心 | 團隊、店內氣氛 |
| S8 | 2314–2699 | 想找你的命定設計師，歡迎來雁沙龍 | **設計師工作中**，2–3 個畫面 |
| 拉遠 | 2700–2956 | 整張字地圖 | 照片也一起縮在地圖裡 |
| logo | 2957–3213 | logo 時刻（`stations/Overlay.tsx`） | logo 圖 |
| 片尾 | 3214–3599 | 地址、電話、IG、附設夜間洗髮 | logo 縮到左上 |

改動站點版面時，先把文字往上或往旁邊讓位，再放照片。鏡頭在 `camera.ts`（每站停留時沿筆畫方向慢漂約 60px、推 1.2%）。

### 30 秒〈一格一位〉

全部硬切、切點都在拍上，紙底＋墨色粗框（借雁價目表的黑框直排）＋「那一格」填黃。鏡頭表在 `src/geese/g30/kit.tsx` 的 `SH`，每個鏡頭一個檔 `shots/A.tsx`～`J.tsx`。

建議做法：**墨框就是照片的窗**。框裡原本是字或黃色，改成照片在框裡被擦出來，字壓在框外或框上。

| 鏡頭 | 時間（格） | 內容 | 建議配的畫面 |
|---|---|---|---|
| A | 0–112 | 6 個「客」擠一格 → 剩 1 個 | 保持文字（開場鉤子） |
| B | 113–224 | 不會一個時段塞好幾位 | 保持文字 |
| C | 225–337 | 名牌 | **logo** |
| D | 338–449 | 忙起來稍等是正常的 | 保持文字 |
| E | 450–674 | 燙・染（每拍硬切） | **「燙」「染」兩個框裡各放過程照** |
| F | 675–899 | 從頭到尾 | **洗→剪→吹的過程，每拍一張硬切** |
| G | 900–1124 | Google 4.9★ | 作品集排成格子，一格一格亮 |
| H | 1125–1349 | 晚上，附設夜間洗髮 | 洗髮台 |
| I | 1350–1574 | 「客」換成「你」 | 那一格裡放一張完成的髮型 |
| J | 1575–1799 | 片尾（電話、地址、IG） | **logo** |

### 封面

`src/geese/g60/stations/Cover.tsx`、`src/geese/g30/shots/Cover.tsx`。兩張都要放 logo；30 秒的封面可以放一張作品照。輸出：

```bash
node tools/sheet.mjs src/entries/geese_covers.tsx out/cover60/ --frames=0 1 --comp=Cover60
node tools/sheet.mjs src/entries/geese_covers.tsx out/cover30/ --frames=0 1 --comp=Cover30
```

---

## 4. 還沒決定的文案（先問使用者，使用者說「照建議」就照括號改）

所有畫面上的字都在 `src/geese/copy.ts`，只改這個檔。**新增的字一定要加進 copy.ts**（`ALL_TEXT` 會先把字型載好，不然算圖時字會晚一格才出現，變成閃爍）。

60 秒：
1. 「都安排課程，精進技術」少了主詞、偏公文腔 →（「設計師每個月都要上課」）
2. 「上班開心，是我們的文化」比較像寫給應徵者看 →（「所以來剪頭髮，氣氛不會很緊繃」）
3. 「像是剪髮講座、陶藝課」：客人能參加嗎？只是內部活動 →（「也會一起去聽剪髮講座、上陶藝課」）

30 秒：
4. 「不會同一個時段，塞好幾位讓你等」像保證不用等，跟「忙起來稍等是正常的」打架 →（「不會一個時段塞好幾位，讓你等很久」）
5. 「從頭到尾，設計師自己操作」跟上一段重複 →（拿掉這句，只留畫面）
6. 「晚上，附設夜間洗髮」偏招牌腔 →（「晚上也能來洗頭」）

兩支共同：
7. 預約只放電話。要不要加「IG 私訊也能約」或 LINE？要先確認店家真的有接。

文字風格規則（客戶）：不要像 AI 寫的。不要對仗、不要金句收尾、不要每行等長，「不是…而是」預設不用。

---

## 5. 事實規則（只能用有出處的）

可以用：高雄市新興區民生一路 259 號、07-281-3636、IG @geese.model_hair、Google 4.9★ 2,400+ 則評論（2026.09 查詢）、附設夜間洗髮、先報價再服務、一小時只約一位（全店）、燙染全程設計師操作、每月教育課程（例：剪髮講座、陶藝課）、不定期活動、廁所備衛生棉、零食櫃、「上班開心是我們的文化」（IG 簡介）、「生活係髮廊」。

不能用：舊分店（鹽埕、明誠）、營業時間（說法有四種對不上）、「小臉專家」、「雁之懶人燙」、RUIENCY、丁平龍、員工姓名、LINE 群組內部內容、「零等待」（店家原話是「忙起來稍微等一下是正常的」）。

完整查核在 repo 根目錄的 `geese_brand/research.json`。

---

## 6. 已知小問題（v3 一起修）

60 秒：
- S5「4.9」用 Anybody 的字寬伸展，但字型只支援 50%–150%，程式裡寫的 162%／44% 沒效果；落下的收尾太早、第 12 小節的拍點脈衝看不到。
- S2 畫面角落會露出 S1「服務」兩個字的邊。
- 拉遠時的動態模糊被筆刷遮罩切掉（順序要換）。
- 「落陣」（VDrop）飛進來的弧線有幾格跑到 y 1248 以下。
- `S5_parts.tsx` 在 v2 輸出後又改過，原始碼比 v2 成品新。

30 秒：
- G：「4.9」的小數點對在 4 的直線下方；f1007–1009 收合時字黏在一起（伸展不管方向都套在 Y 軸）；高點早了 3.5 格。
- H：鼓抽掉的第一拍有 16 格完全不動。
- D：硬切前 7 格幾乎不動。

---

## 7. 程式規矩（不要破壞）

- 每一格都要能單獨算（Remotion 會平行、跳著算）：動畫只能由 `f`（目前格數）算出來，不能用 `useState`／`useEffect` 做動畫、不能用 `Math.random()`（要亂數用 `src/lib/motion.ts` 的 `rng(seed)`）、不能用 CSS transition／animation。
- 節拍：60 秒 112 BPM，`bar60(小節, 拍)`；30 秒 128 BPM，`bar30(小節, 拍)`（`src/geese/theme.ts`）。重拍要對在動作的高峰，通常提前 1–4 格起跑。
- 色票、字型都在 `theme.ts`：黃 `#EED64F`、墨 `#1E1A17`、紙 `#F3EEE3`；字型 Chiron GoRound TC、Anybody、JetBrains Mono（都在 `public/fonts`，不靠系統字型）。
- 逐格分鏡：`STORYBOARD_geese60.md`、`STORYBOARD_geese30.md`（部分段落已經跟程式不一樣，以程式為準）。
- 共用檔（`kit.tsx`、`camera.ts`、`world.ts`、`timeline.ts`）改了會影響全片，改之前先看整支總表。

---

## 8. 交片

1. 輸出 `bash tools/export.sh geese60 4`、`bash tools/export.sh geese30 4`，兩支都要「壞格：無」、最後一次掃描乾淨。
2. 複製到 `deliverables/雁沙龍_形象_60秒_字的雁陣_v3.mp4`、`deliverables/雁沙龍_形象_30秒_一格一位_v3.mp4`，封面 `..._封面_v3.png`。
3. 做一張對照圖：v2 vs v3 同一格並排（至少：S2、S5、S8、logo 時刻、30 秒的 C、E、J），存成 `deliverables/雁沙龍_v2_v3_對照.png`，給使用者看的時候先給這張。
4. commit、push 到 `claude/eloquent-hypatia-fs19ys`（不要推到別的 branch，不要開 PR）。
