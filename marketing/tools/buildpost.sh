#!/usr/bin/env bash
# buildpost <slug> — gera um post/carrossel de Instagram (Dias de Moda) a partir de
# specs/posts/<slug>.json e rasteriza cada tela pra PNG (1080x1350, 4:5).
# Saída: instagram/posts/<slug>/*.png + LEGENDA.md
# Uso: tools/buildpost.sh post-quem-somos   |   tools/buildpost.sh  (lista specs)
source ~/.hf_env 2>/dev/null
SELF="$(cd "$(dirname "$0")" && pwd)"; M="$(dirname "$SELF")"
CHR="$(command -v chromium || echo "$PUPPETEER_EXECUTABLE_PATH")"

slug="${1:-}"
if [ -z "$slug" ]; then
  echo "uso: tools/buildpost.sh <slug>"; echo "specs:"; ls "$M/specs/posts"/*.json 2>/dev/null | xargs -n1 basename | sed 's/\.json$//;s/^/  - /'; exit 1
fi
spec="$M/specs/posts/$slug.json"; [ -f "$spec" ] || { echo "✗ spec não achada: $spec"; exit 1; }

node "$M/tools/genpost.mjs" "$spec" "$M" || exit 1
D="$M/instagram/posts/$slug"
for html in "$D"/*.html; do
  png="${html%.html}.png"
  "$CHR" --headless=new --no-sandbox --disable-gpu --hide-scrollbars --allow-file-access-from-files \
    --force-device-scale-factor=2 --window-size=1080,1350 --virtual-time-budget=4000 \
    --screenshot="$png" "file://$html" >/dev/null 2>&1
  printf "  %s\n" "$(basename "$png")"
done
echo "✓ $slug pronto: $(ls "$D"/*.png | wc -l) telas + LEGENDA.md em instagram/posts/$slug/"
