#!/bin/bash

# Script de liquidação automática para cron job
# 
# Uso: Adicionar ao crontab para execução periódica
# Exemplo: */5 9-22 * * * /caminho/para/lotbicho/scripts/cron/liquidar.sh

# Configurações
API_URL="${API_URL:-http://localhost:3000}"
LOG_DIR="${LOG_DIR:-$(dirname "$0")/../logs}"
LOG_FILE="$LOG_DIR/liquidacao-$(date '+%Y%m%d').log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Criar diretório de logs se não existir
mkdir -p "$LOG_DIR"

# Função de log
log() {
  echo "[$DATE] $1" >> "$LOG_FILE"
}

# Iniciar liquidação
log "=========================================="
log "Iniciando liquidação automática..."

# Executar liquidação (tenta monitor primeiro, fallback automático)
RESPONSE=$(curl -s -X POST "$API_URL/api/resultados/liquidar" \
  -H "Content-Type: application/json" \
  -d '{"usarMonitor": true}' \
  -w "\nHTTP_CODE:%{http_code}" \
  --max-time 60)

# Extrair código HTTP e corpo da resposta
HTTP_CODE=$(echo "$RESPONSE" | grep -oP 'HTTP_CODE:\K\d+' || echo "000")
BODY=$(echo "$RESPONSE" | sed 's/HTTP_CODE:.*//')

# Verificar resultado
if [ "$HTTP_CODE" = "200" ]; then
  # Parsear resposta JSON (se disponível)
  PROCESSADAS=$(echo "$BODY" | grep -oP '"processadas":\s*\K\d+' || echo "0")
  LIQUIDADAS=$(echo "$BODY" | grep -oP '"liquidadas":\s*\K\d+' || echo "0")
  PREMIO=$(echo "$BODY" | grep -oP '"premioTotal":\s*\K[\d.]+' || echo "0")
  FONTE=$(echo "$BODY" | grep -oP '"fonte":\s*"\K[^"]+' || echo "desconhecida")
  
  log "✅ Liquidação concluída com sucesso"
  log "   Processadas: $PROCESSADAS"
  log "   Liquidadas: $LIQUIDADAS"
  log "   Prêmio total: R$ $PREMIO"
  log "   Fonte: $FONTE"
else
  log "❌ Erro na liquidação (HTTP $HTTP_CODE)"
  log "   Resposta: $BODY"
fi

log "Finalizando liquidação automática."
log "=========================================="

# Retornar código de saída apropriado
if [ "$HTTP_CODE" = "200" ]; then
  exit 0
else
  exit 1
fi
