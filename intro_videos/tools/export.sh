#!/usr/bin/env bash
# 輸出完整影片：
#   1. Remotion 整支算圖（無聲）
#   2. 掃描壞格（Remotion 整支算圖偶發的單格閃爍／上緣殘影，單格算圖不會有）
#   3. 壞格用單格算圖（renderStill）重算，在轉色彩那一步換回去
#   4. 轉成上架用的 BT.709 limited range、封入配樂
#   5. 成品再掃一次，還有壞格就失敗
# 用法：tools/export.sh angus|akira [concurrency=2]
set -euo pipefail
cd "$(dirname "$0")/.."
B=$1; C=${2:-2}
COMP=$( [ "$B" = angus ] && echo Angus || echo Akira )
PATCH=out/video/patch_${B}
mkdir -p out/video
npx remotion render src/index.ts "$COMP" "out/video/${B}_silent.mp4" --muted --codec=h264 --crf=14 --concurrency="$C" --log=error

# 2. 掃描壞格
rm -rf "$PATCH"; mkdir -p "$PATCH"
BAD=$(python3 tools/glitch_scan.py "out/video/${B}_silent.mp4" | python3 -c "import sys,re; print(','.join(re.findall(r'\((\d+),', sys.stdin.read())))" || true)
echo "壞格：${BAD:-無}"

# 3. 單格重算
FR=()
if [ -n "$BAD" ]; then
  node tools/sheet.mjs src/index.ts "$PATCH/" --frames="$BAD" 1 --comp="$COMP" > /dev/null
  IFS=',' read -r -a FR <<< "$BAD"
fi

# 4. 換格＋轉色彩＋封配樂（Remotion 用 JPEG 畫格 → 輸出被標成 full range BT.601；轉成 BT.709 limited range）
args=(-y -loglevel error -i "out/video/${B}_silent.mp4" -i "out/audio/${B}.wav")
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
python3 tools/glitch_scan.py "out/video/${B}_final.mp4"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt,color_range,color_space,nb_frames,duration -of compact "out/video/${B}_final.mp4"
ls -la "out/video/${B}_final.mp4"
