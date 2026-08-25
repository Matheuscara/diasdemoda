#!/usr/bin/env bash
# buildad <slug> [formatos] — gera um anúncio Dias de Moda em vídeo (HyperFrames + SFX)
# a partir de specs/<slug>.json, + ROTEIRO.md de narração.
# Saída: videos/<slug>/renders/<slug>-{9x16,1x1,16x9}.mp4  e  videos/<slug>/ROTEIRO.md
#
# Uso:  tools/buildad.sh ad-primeira-impressao            (3 formatos)
#       tools/buildad.sh ad-primeira-impressao portrait   (só 9:16)
#       tools/buildad.sh                                   (lista as specs)

source ~/.hf_env 2>/dev/null

SELF="$(cd "$(dirname "$0")" && pwd)"; M="$(dirname "$SELF")"   # .../marketing
SK="$HOME/.claude/skills/product-launch-video/scripts"
SH="$M/videos/_base"                                            # fontes/gsap/frame.md compartilhados
CLEAN="$M/assets/sfx-clean"                                     # biblioteca SFX tratada

slug="${1:-}"
if [ -z "$slug" ]; then
  echo "uso: tools/buildad.sh <slug> [portrait|square|landscape]"
  echo "specs disponíveis:"; ls "$M/specs"/*.json 2>/dev/null | xargs -n1 basename | sed 's/\.json$//;s/^/  - /'
  exit 1
fi
spec="$M/specs/$slug.json"
[ -f "$spec" ] || { echo "✗ spec não encontrada: $spec"; exit 1; }

VDIR="$M/videos/$slug"; mkdir -p "$VDIR/renders"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

declare -A SUF=( [portrait]=9x16 [square]=1x1 [landscape]=16x9 )
ONLY="${2:-}"
ASPECTS=(portrait square landscape)
[ -n "$ONLY" ] && ASPECTS=("$ONLY")
echo "▶ buildad $slug  (→ videos/$slug/)"

for asp in "${ASPECTS[@]}"; do
  OUT="$TMP/$asp"; rm -rf "$OUT"; mkdir -p "$OUT"
  node "$M/tools/genad.mjs" "$spec" "$OUT" "$SH" "$CLEAN" "$asp" >/dev/null || { echo "  ✗ genad falhou ($asp)"; exit 1; }
  (
    cd "$OUT" || exit 1
    node "$SK/assemble-index.mjs" --storyboard ./STORYBOARD.md --hyperframes . --audio-meta ./audio_meta_sfx.json >/dev/null 2>&1
    node "$SK/transitions.mjs" inject --storyboard ./STORYBOARD.md --hyperframes . >/dev/null 2>&1
    err=$(npx --yes hyperframes check 2>&1 | grep -oE "[0-9]+ error\(s\)" | head -1 || true)
    timeout 900 npx --yes hyperframes render --docker --skill=product-launch-video --quality high --output out.mp4 >/dev/null 2>&1
    docker run --rm -v "$OUT:/w" alpine chown "$(id -u):$(id -g)" /w/out.mp4 >/dev/null 2>&1 || true
    echo "$err" > .err
  )
  err="$(cat "$OUT/.err" 2>/dev/null || echo '?')"; rm -f "$OUT/.err"
  if [ ! -f "$OUT/out.mp4" ]; then echo "  ✗ render falhou ($asp)"; exit 1; fi
  cp "$OUT/out.mp4" "$VDIR/renders/$slug-${SUF[$asp]}.mp4"
  dur=$(ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "$OUT/out.mp4" 2>/dev/null)
  printf "  %-9s %-4s  %s  %ss  → renders/%s-%s.mp4\n" "$asp" "${SUF[$asp]}" "${err:-check ok}" "${dur%.*}" "$slug" "${SUF[$asp]}"
  [ "$asp" = portrait ] && cp "$OUT/ROTEIRO.md" "$VDIR/ROTEIRO.md" 2>/dev/null
done

echo "✓ $slug pronto em videos/$slug/"
