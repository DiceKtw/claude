# 介紹影片・共同工藝規則（兩支片都適用）

> 依據：大介 9/29 的 30 秒「Claude 動態履歷」研究（Drive `參考1_動態履歷.md`）。
> 規格：1080×1920 直式、60fps、120 BPM（1 拍 = 30 格、1 小節 = 120 格）、30 秒 = 1800 格。
> 所有格數都是**全域格數**。場景裡用 `const g = useG(from)` 取得全域格數。

## 檔案分工（重要）

- `src/lib/*`（theme、motion、components、Hud、transitions、Master）＝共用程式庫，**唯讀，不准改**。缺什麼元件就在自己的場景檔裡做。
- `src/<品牌>/timeline.ts`、`defs.tsx`、`Video.tsx`＝時間表與總裝，**唯讀**。轉場和 HUD 已經在總裝裡做好，場景不用自己做轉場、不用畫 HUD。
- 每個場景一個檔：`src/<品牌>/scenes/S*.tsx`，export 名稱固定（`S0`…），props 是 `{from}`。場景可以另外開 `S*_parts.tsx` 放小元件。
- 每組有自己的開發 entry：`src/entries/<品牌>_g*.tsx`，只打包這一組的場景。

## 怎麼算圖檢查（每個場景都要做）

```bash
cd /home/user/claude/intro_videos
npx remotion still src/entries/angus_g1.tsx Dev out/stills/angus_g1/f0270.png --frame=270 --log=error
# 一次算一串格數拼成總表：
node tools/sheet.mjs src/entries/angus_g1.tsx out/stills/angus_g1/sheet_S1.png 240 600 12   # 從 240 到 600、每 12 格一張（縮小 0.3 拼成總表）
node tools/sheet.mjs src/entries/angus_g1.tsx out/stills/angus_g1/ --frames=270,300,450   # 原尺寸單張
npx tsc --noEmit   # 型別檢查
```
算出來的 PNG 用 Read 工具親眼看。**沒看過算圖，不算完成。**

## 工藝規則

1. **系統，不是零件**：只用該品牌的色票（`ANGUS` / `AKIRA`）、`F` 字體、`STAGE` / `SAFE` 版面常數。不要新增顏色。
2. **安全區**：重要文字只放在 x 110–970、y 390–1240。y 269–370 是 HUD。y > 1248 只能放裝飾（線、形狀的一部分），不放字。
3. **不准線性移動**：除了等速慢轉和慢漂，全部用 `E` 裡的緩動。
4. **提前起跑**：要讓「最用力的那一格」落在拍點。大字提前 4 格起跑（落拍那格已升到 3/4），彈出物提前 1 格，形變提前 7 格。
5. **錯開**：兄弟元素錯開 2–4 格，沒有任何東西「一起」出現。前一個動作還沒結束，下一個已經開始。
6. **主從**：同一時間只有一個主角（大），旁邊跟著細小的東西。大動作之後留 1–2 格喘息。
7. **沒有一格是靜止的**：定格段落用 `Push` 慢推（1→1.018）、`drift` 視差（兩個區塊反方向漂 8–12px）、呼吸（大小 ±0.5%）、慢轉。
8. **快的東西要模糊**：垂直升起用 `MaskRise`（自帶模糊）；橫甩用 `DirBlur x`；快速落下的物體畫 3 個越來越淡的殘影（`ghostFrames`）。
9. **用專業工作語言當裝飾**：細線、點、小方塊、細圓環、虛線引線、等寬小標籤、打字游標、刻度。不要用 emoji、不要用現成 icon 貼圖。
10. **同一種手法一支片最多用 2 次**。不做點雲、故障、曲速、粒子爆炸這類炫技大招（有退件紀錄：技術流堆料）。
11. **不編造事實**：畫面上的字只能用分鏡裡寫好的文案。不要自己加數字、獎項、年資。
12. **確定性**：不准 `Math.random()`、`Date.now()`、計時器、CSS animation/transition。要亂數用 `rng(seed)`。
13. **字型**：中文一律 `F.display` / `F.sans`（思源黑體，雲端沒有勵字姚體，安格斯大標用 weight 900 代替）；等寬小標籤用 `F.mono`。
14. **效能**：一格算圖要在 1 秒內。不要在每格產生幾千個 DOM 節點；大量形狀用一個 `<Svg>` 畫。DirBlur 只包需要模糊的東西。

## 共用元件速查（src/lib/components.tsx）

| 元件 | 用途 |
|---|---|
| `MaskRise` | 逐字從基線遮罩升起（`quiet` = Akira：短位移＋淡入、無模糊）；`segments` 可讓某些字換色 |
| `Typewriter` | 打字＋方塊游標、熱墨色（剛打的字先是強調色）；`reserve` 讓靠右對齊時不跳 |
| `SpecRow` | 規格列 tick-pop（`quiet` = Akira 版） |
| `Spark` + `sparkRays` | 12 道光星芒，光芒不照順序噴出 |
| `Ring` | 震波細環 |
| `ImpactFlicks` | 接觸那格兩側各踢兩道細撇 |
| `Glint` | 細線掃光（頭快尾慢） |
| `Leader` | 虛線引線（量測線），可帶端點圓點 |
| `DrawPath` | SVG 路徑描線（可虛線） |
| `DirBlur` | 方向性動態模糊 |
| `Push` / `drift` | 慢推／視差 |
| `ghostFrames` | 殘影取樣 |
| `Svg` | 全畫面 SVG 圖層（座標＝畫面像素） |
| `Abs` | 絕對定位盒 |

動態工具（src/lib/motion.ts）：`E`（緩動）、`prog`、`tween`、`spr`、`burst`、`pulseAt`、`bounceHeight`、`rng`、`mixHex`、`alpha`、`beatsFrom`、`lerp`、`clamp`。
