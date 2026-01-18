# 🚀 Guia de Produção - Sistema de Liquidação

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração de Variáveis de Ambiente](#configuração-de-variáveis-de-ambiente)
3. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
4. [Deploy da Aplicação](#deploy-da-aplicação)
5. [Configuração do Cron Job](#configuração-do-cron-job)
6. [Monitoramento e Logs](#monitoramento-e-logs)
7. [Manutenção](#manutenção)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requisitos

### Servidor
- Node.js 20+ instalado
- MySQL 8.0+ ou MariaDB 10.6+ configurado e acessível
- Acesso SSH ao servidor
- Permissões para criar cron jobs

### Variáveis de Ambiente Necessárias
- `DATABASE_URL` - URL de conexão do MySQL
- `AUTH_SECRET` - Chave secreta para autenticação
- `BICHO_CERTO_API` - URL da API do monitor (opcional)
- `RECEBA_API_KEY` - Chave da API Receba (se usar PIX)
- `RECEBA_PLATFORM_ID` - ID da plataforma Receba (se usar PIX)
- `RECEBA_BASE_URL` - URL base da API Receba (se usar PIX)

---

## ⚙️ Configuração de Variáveis de Ambiente

### 1. Criar arquivo `.env.production`

```bash
# Banco de Dados
DATABASE_URL=mysql://usuario:senha@localhost:3306/lotbicho

# Autenticação
AUTH_SECRET=sua-chave-secreta-aqui-gerar-com-openssl-rand-hex-32

# API do Monitor (opcional)
BICHO_CERTO_API=https://seu-monitor.com/api/resultados

# Receba Online (se usar PIX)
RECEBA_API_KEY=sua-api-key-aqui
RECEBA_PLATFORM_ID=seu-platform-id-aqui
RECEBA_BASE_URL=https://api.receba.online

# Ambiente
NODE_ENV=production
```

### 2. Gerar AUTH_SECRET

```bash
openssl rand -hex 32
```

---

## 🗄️ Configuração do Banco de Dados

### 1. Criar Banco de Dados

```bash
# Conectar ao MySQL
mysql -u root -p

# Criar banco de dados
CREATE DATABASE lotbicho CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Criar usuário (opcional, mas recomendado)
CREATE USER lotbicho_user WITH PASSWORD 'senha_segura';
GRANT ALL PRIVILEGES ON DATABASE lotbicho TO lotbicho_user;
```

### 2. Executar Migrações

```bash
# No diretório do projeto
npm install
npx prisma generate
npx prisma migrate deploy
# ou
npx prisma db push
```

### 3. Verificar Schema

```bash
npx prisma studio
# Abre interface web para verificar tabelas
```

---

## 🚀 Deploy da Aplicação

### Opção 1: Deploy Manual

```bash
# 1. Clonar repositório
git clone https://github.com/seu-usuario/lotbicho.git
cd lotbicho

# 2. Instalar dependências
npm ci --production

# 3. Gerar Prisma Client
npx prisma generate

# 4. Executar migrações
npx prisma migrate deploy

# 5. Build da aplicação
npm run build

# 6. Iniciar servidor
npm start
```

### Opção 2: Usando PM2 (Recomendado)

```bash
# 1. Instalar PM2 globalmente
npm install -g pm2

# 2. Criar arquivo ecosystem.config.js
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'lotbicho',
    script: 'npm',
    args: 'start',
    cwd: '/caminho/para/lotbicho',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
}
EOF

# 3. Iniciar aplicação
pm2 start ecosystem.config.js

# 4. Salvar configuração PM2
pm2 save

# 5. Configurar PM2 para iniciar no boot
pm2 startup
# Seguir instruções exibidas
```

### Opção 3: Usando Docker

```bash
# 1. Criar Dockerfile (já existe)
# 2. Build da imagem
docker build -t lotbicho:latest .

# 3. Executar container
docker run -d \
  --name lotbicho \
  -p 3000:3000 \
  --env-file .env.production \
  lotbicho:latest
```

### Opção 4: Usando Coolify (já configurado)

O sistema já está configurado para Coolify. Basta:
1. Conectar repositório no Coolify
2. Configurar variáveis de ambiente
3. Deploy automático

---

## ⏰ Configuração do Cron Job

### Estratégia Recomendada: Híbrida

O cron job deve tentar usar o monitor primeiro, com fallback automático.

### 1. Criar Script de Liquidação

```bash
# Criar diretório para scripts
mkdir -p /caminho/para/lotbicho/scripts/cron

# Criar script
cat > /caminho/para/lotbicho/scripts/cron/liquidar.sh << 'EOF'
#!/bin/bash

# Configurações
API_URL="http://localhost:3000"
LOG_FILE="/caminho/para/lotbicho/logs/liquidacao.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Criar diretório de logs se não existir
mkdir -p $(dirname "$LOG_FILE")

# Executar liquidação
echo "[$DATE] Iniciando liquidação..." >> "$LOG_FILE"

RESPONSE=$(curl -s -X POST "$API_URL/api/resultados/liquidar" \
  -H "Content-Type: application/json" \
  -d '{"usarMonitor": true}' \
  -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | grep -oP 'HTTP_CODE:\K\d+')
BODY=$(echo "$RESPONSE" | sed 's/HTTP_CODE:.*//')

if [ "$HTTP_CODE" = "200" ]; then
  echo "[$DATE] ✅ Liquidação concluída: $BODY" >> "$LOG_FILE"
else
  echo "[$DATE] ❌ Erro na liquidação (HTTP $HTTP_CODE): $BODY" >> "$LOG_FILE"
fi

echo "[$DATE] Finalizando liquidação." >> "$LOG_FILE"
EOF

# Dar permissão de execução
chmod +x /caminho/para/lotbicho/scripts/cron/liquidar.sh
```

### 2. Configurar Cron Job

```bash
# Editar crontab
crontab -e

# Adicionar linha (executa a cada 1 minuto após horários de sorteio)
# Ajustar horários conforme seus sorteios
*/1 9-22 * * * /caminho/para/lotbicho/scripts/cron/liquidar.sh

# Ou mais específico (a cada 5 minutos durante horários de sorteio)
*/5 9-22 * * * /caminho/para/lotbicho/scripts/cron/liquidar.sh

# Ou apenas após horários específicos (exemplo: após 9h30, 12h, 15h, 18h, 22h)
31 9,12,15,18,22 * * * /caminho/para/lotbicho/scripts/cron/liquidar.sh
```

### 3. Verificar Cron Job

```bash
# Listar cron jobs
crontab -l

# Ver logs do cron
grep CRON /var/log/syslog
# ou
journalctl -u cron
```

### 4. Testar Script Manualmente

```bash
# Executar script manualmente
/caminho/para/lotbicho/scripts/cron/liquidar.sh

# Verificar logs
tail -f /caminho/para/lotbicho/logs/liquidacao.log
```

---

## 📊 Monitoramento e Logs

### 1. Logs da Aplicação

```bash
# Se usando PM2
pm2 logs lotbicho

# Se usando Docker
docker logs -f lotbicho

# Se usando sistema de logs
tail -f /var/log/lotbicho/app.log
```

### 2. Monitorar Liquidação

```bash
# Ver estatísticas de liquidação
curl http://localhost:3000/api/resultados/liquidar

# Resposta:
# {
#   "pendentes": 10,
#   "liquidadas": 150,
#   "perdidas": 50,
#   "total": 210
# }
```

### 3. Verificar Status do Monitor

```bash
# Verificar se monitor está disponível
curl http://localhost:3000/api/status
```

### 4. Alertas (Opcional)

Criar script para alertar se liquidação falhar:

```bash
cat > /caminho/para/lotbicho/scripts/cron/verificar-liquidacao.sh << 'EOF'
#!/bin/bash

LOG_FILE="/caminho/para/lotbicho/logs/liquidacao.log"
ALERT_EMAIL="admin@seusite.com"

# Verificar última execução (últimas 10 linhas)
LAST_RUN=$(tail -10 "$LOG_FILE" | grep -c "✅")

if [ "$LAST_RUN" -eq 0 ]; then
  # Enviar alerta (ajustar comando conforme seu sistema de email)
  echo "Liquidação não executada com sucesso nas últimas tentativas" | \
    mail -s "Alerta: Problema na Liquidação" "$ALERT_EMAIL"
fi
EOF

chmod +x /caminho/para/lotbicho/scripts/cron/verificar-liquidacao.sh

# Adicionar ao cron (executa a cada hora)
0 * * * * /caminho/para/lotbicho/scripts/cron/verificar-liquidacao.sh
```

---

## 🔧 Manutenção

### 1. Atualizar Código

```bash
# Pull das atualizações
git pull origin main

# Instalar novas dependências
npm ci --production

# Executar migrações (se houver)
npx prisma migrate deploy

# Rebuild
npm run build

# Reiniciar aplicação
pm2 restart lotbicho
# ou
docker restart lotbicho
```

### 2. Backup do Banco de Dados

```bash
# Criar script de backup
cat > /caminho/para/lotbicho/scripts/backup-db.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/caminho/para/backups"
DATE=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="$BACKUP_DIR/lotbicho_$DATE.sql"

mkdir -p "$BACKUP_DIR"

# Backup
pg_dump -U lotbicho_user lotbicho > "$BACKUP_FILE"

# Comprimir
gzip "$BACKUP_FILE"

# Manter apenas últimos 7 dias
find "$BACKUP_DIR" -name "lotbicho_*.sql.gz" -mtime +7 -delete
EOF

chmod +x /caminho/para/lotbicho/scripts/backup-db.sh

# Adicionar ao cron (backup diário às 2h da manhã)
0 2 * * * /caminho/para/lotbicho/scripts/backup-db.sh
```

### 3. Limpeza de Logs

```bash
# Script para limpar logs antigos
cat > /caminho/para/lotbicho/scripts/limpar-logs.sh << 'EOF'
#!/bin/bash

LOG_DIR="/caminho/para/lotbicho/logs"

# Manter apenas últimos 30 dias
find "$LOG_DIR" -name "*.log" -mtime +30 -delete
EOF

chmod +x /caminho/para/lotbicho/scripts/limpar-logs.sh

# Adicionar ao cron (executa semanalmente)
0 3 * * 0 /caminho/para/lotbicho/scripts/limpar-logs.sh
```

---

## 🐛 Troubleshooting

### Problema: Liquidação não executa

**Verificar:**
1. Cron job está configurado?
   ```bash
   crontab -l
   ```

2. Script tem permissão de execução?
   ```bash
   ls -la /caminho/para/lotbicho/scripts/cron/liquidar.sh
   chmod +x /caminho/para/lotbicho/scripts/cron/liquidar.sh
   ```

3. API está respondendo?
   ```bash
   curl http://localhost:3000/api/resultados/liquidar
   ```

### Problema: Erro de conexão com banco

**Verificar:**
1. Banco está rodando?
   ```bash
   sudo systemctl status mysql
   ```

2. Variável DATABASE_URL está correta?
   ```bash
   echo $DATABASE_URL
   ```

3. Usuário tem permissões?
   ```bash
   psql -U lotbicho_user -d lotbicho -c "SELECT 1;"
   ```

### Problema: Monitor não responde

**Solução:**
- Sistema usa fallback automático para implementação própria
- Verificar logs para ver qual fonte está sendo usada
- Se monitor estiver offline, sistema continua funcionando

### Problema: Apostas não são liquidadas

**Verificar:**
1. Há apostas pendentes?
   ```bash
   curl http://localhost:3000/api/resultados/liquidar
   ```

2. Resultados estão disponíveis?
   ```bash
   curl http://localhost:3000/api/resultados
   ```

3. Logs mostram erros?
   ```bash
   tail -100 /caminho/para/lotbicho/logs/liquidacao.log
   ```

---

## 📋 Checklist de Produção

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados criado e migrado
- [ ] Aplicação buildada e rodando
- [ ] Cron job configurado
- [ ] Scripts de backup configurados
- [ ] Monitoramento configurado
- [ ] Logs sendo gerados
- [ ] Teste manual de liquidação executado
- [ ] Documentação atualizada

---

## 🎯 Próximos Passos

1. **Testar em ambiente de staging** antes de produção
2. **Monitorar primeiras execuções** do cron job
3. **Ajustar frequência** do cron conforme necessário
4. **Configurar alertas** para problemas críticos
5. **Documentar procedimentos** específicos do seu ambiente

---

**Última atualização:** 2026-01-15
