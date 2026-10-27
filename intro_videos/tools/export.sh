#!/usr/bin/env bash
# 輸出完整影片：
#   1. Remotion 整支算圖（無聲）
#   2. 掃描壞格（Remotion 整支算圖偶發的單格閃爍／上緣殘影，單格算圖不會有）
#   3. 壞格用單格算圖（renderStill）重算，在轉色彩那一步換回去
#   4. 轉成上架用的 BT.709 limited range、封入配樂
#   5. 成品再掃一次，還有壞格就失敗
# 用法：tools/export.sh angus|akira|geese60|geese30 [concurrency=2]
set -euo pipefail
cd "$(dirname "$0")/.."
B=$1; C=${2:-2}
case "$B" in
  angus) COMP=Angus ;;
  akira) COMP=Akira ;;
  geese60) COMP=Geese60 ;;
  geese30) COMP=Geese30 ;;
  *) echo "未知的片名：$B（angus|akira|geese60|geese30）"; exit 2 ;;
esac
PATCH=out/video/patch_${B}
# Python 指令：Linux／Mac 是 python3；Windows（Git Bash）通常是 python 或 py（python3 可能是商店的空殼）
PY=""
for c in python3 python py; do
  if command -v "$c" >/dev/null 2>&1 && "$c" -c "import numpy" >/dev/null 2>&1; then PY=$c; break; fi
done
[ -n "$PY" ] || { echo "找不到裝了 numpy 的 Python（pip install numpy）"; exit 2; }
# 配樂：先找 out/audio（重新合成過的），沒有就用進版控的 audio/
AUD=out/audio/${B}.wav
[ -f "$AUD" ] || AUD=audio/${B}.wav
[ -f "$AUD" ] || { echo "找不到配樂 ${B}.wav（python tools/score_${B}.py 可重新合成）"; exit 2; }
# 細線掃場（lineWipe）的線每格都在動，會被誤判成殘影 → 略過
IGN=$( [ "$B" = akira ] && echo "216-240,936-960" || echo "" )
mkdir -p out/video
npx remotion render src/index.ts "$COMP" "out/video/${B}_silent.mp4" --muted --codec=h264 --crf=14 --concurrency="$C" --log=error

# 2. 掃描壞格
rm -rf "$PATCH"; mkdir -p "$PATCH"
BAD=$("$PY" tools/glitch_scan.py "out/video/${B}_silent.mp4" "$IGN" | "$PY" -c "import sys,re; print(','.join(re.findall(r'\((\d+),', sys.stdin.read())))" || true)
echo "壞格：${BAD:-無}"

# 3. 單格重算
FR=()
if [ -n "$BAD" ]; then
  node tools/sheet.mjs src/index.ts "$PATCH/" --frames="$BAD" 1 --comp="$COMP" > /dev/null
  IFS=',' read -r -a FR <<< "$BAD"
fi

# 4. 換格＋轉色彩＋封配樂（Remotion 用 JPEG 畫格 → 輸出被標成 full range BT.601；轉成 BT.709 limited range）
args=(-y -loglevel error -i "out/video/${B}_silent.mp4" -i "$AUD")
for n in "${FR[@]}"; do args+=(-i "$PATCH/f$(printf %04d "$n").png"); done
fc="[0:v]scale=in_range=pc:in_color_matrix=bt601:flags=accurate_rnd+full_chroma_int,format=gbrp[v0]"
prev=v0
for i in "${!FR[@]}"; do
  n=${FR[$i]}; k=$((i+2))
  fc+=";[$k:v]format=gbrp[s$i];[$prev][s$i]overlay=0:0:enable='eq(n\,$n)':eof_action=repeat[v$((i+1))]"
  prev=v$((i+1))
done
fc+=";[$prev]scale=out_range=tv:out_color_matrix=bt709:flags=accurate_rnd+full_chroma_int,format=yuv420p[vout]"
ffmpeg "${args[@]}" -filter_complex "$fc" -map "[vout]" -map 1:a \
  -c:v libx264 -preset slow -crf 17 -profile:v high -level 4.2 -r 60 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "out/video/${B}_final.mp4"

# 5. 驗證
"$PY" tools/glitch_scan.py "out/video/${B}_final.mp4" "$IGN"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt,color_range,color_space,nb_frames,duration -of compact "out/video/${B}_final.mp4"
ls -la "out/video/${B}_final.mp4"
