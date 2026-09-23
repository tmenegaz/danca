#!/usr/bin/env bash
# O gerador nao herda o locale de quem o chama (REGISTRO.md, 23/09/2026).
exigir_locale_utf8() {
  unset LC_ALL
  export PYTHONUTF8=1 PYTHONIOENCODING=utf-8
  local c
  for c in C.UTF-8 C.utf8 en_US.UTF-8; do
    if [ "$(LC_ALL=$c locale charmap 2>/dev/null)" = "UTF-8" ]; then
      export LC_ALL=$c LANG=$c
      return 0
    fi
  done
  echo "${0##*/}: sem locale UTF-8 — recuso gerar" >&2
  return 1
}