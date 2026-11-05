#!/usr/bin/env bash
# Calcula e carimba a versão. Única fonte: versao.json (major/minor).
set -euo pipefail
MAJOR=$(grep -o -E '"major": *[0-9]+' versao.json | grep -o -E '[0-9]+$')
MINOR=$(grep -o -E '"minor": *[0-9]+' versao.json | grep -o -E '[0-9]+$')
[ -n "$MAJOR" ] && [ -n "$MINOR" ] || { echo "versao.json inválido"; exit 1; }
BASE=$(git log -1 --format=%H -- versao.json 2>/dev/null || true)
if [ -n "$BASE" ]; then PATCH=$(git rev-list --count "$BASE"..HEAD); else PATCH=0; fi
N="$MAJOR.$MINOR.$PATCH"
B=$(date -u +%y%m%d%H%M)
# trava: nunca publicar versão menor que a que está no ar
URL="${SITE_URL:-https://${GITHUB_REPOSITORY_OWNER:-x}.github.io/${GITHUB_REPOSITORY#*/}}/version.json"
LIVE=$(curl -fsS --max-time 15 "$URL" 2>/dev/null || true)
LN=$(printf '%s' "$LIVE" | grep -o -E '"name": *"[0-9.]+"' | grep -o -E '[0-9]+(\.[0-9]+)+' || true)
if [ -n "$LN" ]; then
  LOWEST=$(printf '%s\n%s\n' "$LN" "$N" | sort -V | head -1)
  if [ "$LOWEST" = "$N" ] && [ "$LN" != "$N" ]; then
    echo "ERRO: a versão $N é menor que a que já está no ar ($LN). Aumente major/minor em versao.json."; exit 1
  fi
  echo "No ar: $LN -> nova: $N"
else echo "Versão no ar não encontrada (primeira publicação?). Nova: $N"; fi
sed -i -E "s/BUILD=\"[0-9]+\"/BUILD=\"$B\"/" sw.js
sed -i -E "s/APPV=[0-9]+,APPN=\"[^\"]*\"/APPV=$B,APPN=\"$N\"/" app.js
printf '{"build":%s,"name":"%s","major":%s,"minor":%s,"patch":%s,"min":0,"notes":""}\n' "$B" "$N" "$MAJOR" "$MINOR" "$PATCH" > version.json
# confere que os três lugares ficaram iguais
grep -q "BUILD=\"$B\"" sw.js && grep -q "APPV=$B,APPN=\"$N\"" app.js && grep -q "\"name\":\"$N\"" version.json || { echo "ERRO: carimbo inconsistente"; exit 1; }
echo "Versão $N (build $B) carimbada."
