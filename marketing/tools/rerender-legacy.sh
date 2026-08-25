#!/usr/bin/env bash
# rerender-legacy.sh — re-rasteriza as artes ESCRITAS À MÃO (não guiadas por spec):
#   - posts fixados  instagram/posts/*.html        → PNG 1080x1350
#   - destaques      instagram/destaques/**/*.html  → PNG 1080x1920
#   - logos          instagram/logo/{wordmark,perfil,perfil-rosa}.html → PNG (wordmark transparente)
# Posts/anúncios NOVOS são guiados por spec: use tools/buildpost.sh e tools/buildad.sh.
# Uso: tools/rerender-legacy.sh [posts|destaques|logos]   (sem argumento = tudo)
source ~/.hf_env 2>/dev/null
SELF="$(cd "$(dirname "$0")" && pwd)"; M="$(dirname "$SELF")"
IG="$M/instagram"
CHR="$(command -v chromium || echo "$PUPPETEER_EXECUTABLE_PATH")"

shot() { # <html> <png> <w> <h> [transparent]
  local extra=""; [ "${5:-}" = t ] && extra="--default-background-color=00000000"
  "$CHR" --headless=new --no-sandbox --disable-gpu --hide-scrollbars --allow-file-access-from-files \
    --force-device-scale-factor=2 --window-size="$3,$4" --virtual-time-budget=4000 $extra \
    --screenshot="$2" "file://$1" >/dev/null 2>&1
  printf "  %s\n" "${2#$IG/}"
}

do_posts() { for h in "$IG/posts"/*.html; do [ -e "$h" ] || continue; shot "$h" "${h%.html}.png" 1080 1350; done; }
do_destaques() { while IFS= read -r h; do shot "$h" "${h%.html}.png" 1080 1920; done < <(find "$IG/destaques" -name '*.html'); }
do_logos() {
  shot "$IG/logo/wordmark.html"    "$IG/logo/logo-wordmark.png"    1200 1200 t
  shot "$IG/logo/perfil.html"      "$IG/logo/logo-perfil.png"      1200 1200
  shot "$IG/logo/perfil-rosa.html" "$IG/logo/logo-perfil-rosa.png" 1200 1200
}

case "${1:-all}" in
  posts) do_posts ;;
  destaques) do_destaques ;;
  logos) do_logos ;;
  all) do_posts; do_destaques; do_logos ;;
  *) echo "uso: tools/rerender-legacy.sh [posts|destaques|logos]"; exit 1 ;;
esac
echo "✓ re-render concluído."
