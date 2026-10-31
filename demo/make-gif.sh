#!/usr/bin/env bash
# Turns the two recordings of demo/demo.spec.ts into imgs/demo.gif, side by side.
# Run via `npm run demo:gif`. Tunables: DEMO_FPS (default 12), DEMO_WIDTH (default 1400).
set -euo pipefail

cd "$(dirname "$0")/.."
MANIFEST=test-results/demo/manifest.json
OUT=imgs/demo.gif
FPS=${DEMO_FPS:-12}
WIDTH=${DEMO_WIDTH:-1400}
MAX_BYTES=$((8 * 1024 * 1024))

command -v ffmpeg >/dev/null || { echo "ffmpeg not found (brew install ffmpeg)" >&2; exit 1; }
[[ -f $MANIFEST ]] || { echo "$MANIFEST missing, run the demo spec first" >&2; exit 1; }

read_manifest() { node -e "const m=require('./$MANIFEST'); console.log($1)"; }
DURATION=$(read_manifest "m.durationSeconds")
LEFT=$(read_manifest "m.videos[0].path")
LEFT_OFFSET=$(read_manifest "m.videos[0].offsetSeconds")
RIGHT=$(read_manifest "m.videos[1].path")
RIGHT_OFFSET=$(read_manifest "m.videos[1].offsetSeconds")

# Trim both to the scene, put a thin divider between them, then build an optimised
# palette for the whole clip so the GIF keeps the UI colours without banding.
FILTER="[0:v]setpts=PTS-STARTPTS,pad=iw+6:ih:0:0:color=0x9e9e9e[l];\
[1:v]setpts=PTS-STARTPTS[r];\
[l][r]hstack=inputs=2,fps=${FPS},scale=${WIDTH}:-1:flags=lanczos,split[a][b];\
[a]palettegen=max_colors=128:stats_mode=diff[p];\
[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle"

ffmpeg -hide_banner -loglevel error -y \
    -ss "$LEFT_OFFSET" -t "$DURATION" -i "$LEFT" \
    -ss "$RIGHT_OFFSET" -t "$DURATION" -i "$RIGHT" \
    -filter_complex "$FILTER" -loop 0 "$OUT"

BYTES=$(wc -c <"$OUT" | tr -d ' ')
echo "Wrote $OUT ($((BYTES / 1024)) KB, ${DURATION}s)"
if ((BYTES > MAX_BYTES)); then
    echo "Warning: over 8 MB; try DEMO_FPS=10 or DEMO_WIDTH=1200" >&2
fi
