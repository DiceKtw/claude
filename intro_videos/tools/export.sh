#!/usr/bin/env bash
# 輸出完整影片：算圖（無聲）→ 轉成上架用的 BT.709 limited range → 封入配樂 → 驗證
# 用法：tools/export.sh angus|akira [concurrency=2]
set -euo pipefail
cd "$(dirname "$0")/.."
B=$1; C=${2:-2}
COMP=$( [ "$B" = angus ] && echo Angus || echo Akira )
mkdir -p out/video
npx remotion render src/index.ts "$COMP" "out/video/${B}_silent.mp4" --muted --codec=h264 --crf=14 --concurrency="$C" --log=error
# Remotion 用 JPEG 畫格 → 輸出被標成 full range BT.601；這裡轉成一般播放器／IG 預期的 BT.709 limited range
ffmpeg -y -loglevel error -i "out/video/${B}_silent.mp4" -i "out/audio/${B}.wav" -map 0:v -map 1:a \
  -vf "scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709:flags=accurate_rnd+full_chroma_int,format=yuv420p" \
  -c:v libx264 -preset slow -crf 17 -profile:v high -level 4.2 -r 60 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "out/video/${B}_final.mp4"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt,color_range,color_space,nb_frames,duration -of compact "out/video/${B}_final.mp4"
ls -la "out/video/${B}_final.mp4"
