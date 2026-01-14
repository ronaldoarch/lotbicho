#!/bin/bash
set -e

# Iniciar cron em background (se disponível)
if command -v crond &> /dev/null; then
  echo "🕐 Iniciando cron..."
  crond -f -d 8 &
elif command -v cron &> /dev/null; then
  echo "🕐 Iniciando cron..."
  cron &
fi

# Executar comando original (start da aplicação Next.js)
exec "$@"
