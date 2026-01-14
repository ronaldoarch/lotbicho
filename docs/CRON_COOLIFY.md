# ⏰ Configurar Cron Job no Coolify

## 📋 Opções Disponíveis

No Coolify, cron jobs podem ser configurados de **3 formas**:

---

## Opção 1: Via Terminal do Container (Recomendado)

### Passo 1: Acessar Terminal do Container

No painel do Coolify:
1. Vá em **Projects** → Selecione seu projeto
2. Clique em **Terminal** (ou **Shell**)
3. Isso abre um terminal dentro do container

### Passo 2: Instalar Cron (se necessário)

```bash
# Verificar se cron está instalado
which crond || which cron

# Se não estiver, instalar (depende da imagem base)
# Para imagens baseadas em Debian/Ubuntu:
apt-get update && apt-get install -y cron

# Para imagens Alpine:
apk add --no-cache dcron
```

### Passo 3: Criar Script de Liquidação

```bash
# Criar diretório para scripts
mkdir -p /app/scripts/cron
mkdir -p /app/logs

# Criar script
cat > /app/scripts/cron/liquidar.sh << 'EOF'
#!/bin/bash
curl -X POST http://localhost:3000/api/resultados/liquidar \
  -H "Content-Type: application/json" \
  -d '{"usarMonitor": true}' \
  >> /app/logs/cron-liquidacao.log 2>&1
EOF

# Dar permissão de execução
chmod +x /app/scripts/cron/liquidar.sh
```

### Passo 4: Configurar Cron Job

```bash
# Adicionar ao crontab
(crontab -l 2>/dev/null; echo "*/5 9-22 * * * /app/scripts/cron/liquidar.sh") | crontab -

# Verificar se foi adicionado
crontab -l

# Iniciar serviço cron
crond -f -d 8 &
# ou
cron
```

### Passo 5: Testar

```bash
# Executar manualmente
/app/scripts/cron/liquidar.sh

# Verificar logs
tail -f /app/logs/cron-liquidacao.log
```

---

## Opção 2: Via Dockerfile (Persistente)

### Modificar Dockerfile

Adicione ao final do `Dockerfile`:

```dockerfile
# Instalar cron
RUN apt-get update && apt-get install -y cron && rm -rf /var/lib/apt/lists/*

# Criar script de liquidação
RUN mkdir -p /app/scripts/cron /app/logs
COPY scripts/cron/liquidar.sh /app/scripts/cron/liquidar.sh
RUN chmod +x /app/scripts/cron/liquidar.sh

# Configurar cron job
RUN (crontab -l 2>/dev/null; echo "*/5 9-22 * * * /app/scripts/cron/liquidar.sh") | crontab -

# Iniciar cron no entrypoint
COPY scripts/start-with-cron.sh /app/scripts/start-with-cron.sh
RUN chmod +x /app/scripts/start-with-cron.sh

CMD ["/app/scripts/start-with-cron.sh"]
```

### Criar script de start com cron

```bash
# scripts/start-with-cron.sh
#!/bin/bash
set -e

# Iniciar cron em background
crond -f -d 8 &

# Executar comando original
exec "$@"
```

---

## Opção 3: Via API Externa (Mais Simples)

### Usar serviço externo de cron

Use um serviço como:
- **cron-job.org** (gratuito)
- **EasyCron** (gratuito)
- **UptimeRobot** (gratuito)

### Configurar no cron-job.org

1. Acesse https://cron-job.org
2. Crie conta gratuita
3. Adicione novo cron job:
   - **URL:** `https://seu-dominio.com/api/resultados/liquidar`
   - **Method:** POST
   - **Body:** `{"usarMonitor": true}`
   - **Headers:** `Content-Type: application/json`
   - **Schedule:** A cada 5 minutos (9h-22h)

### Exemplo de configuração:

```
URL: https://ig4o44cgogk084sc0g8884o4.agenciamidas.com/api/resultados/liquidar
Method: POST
Body: {"usarMonitor": true}
Headers: Content-Type: application/json
Schedule: */5 9-22 * * *
```

---

## Opção 4: Via Coolify Scheduled Tasks (Se disponível)

Algumas versões do Coolify têm **Scheduled Tasks**:

1. Vá em **Projects** → Seu projeto
2. Procure por **Scheduled Tasks** ou **Cron Jobs**
3. Adicione nova tarefa:
   - **Command:** `curl -X POST http://localhost:3000/api/resultados/liquidar -H "Content-Type: application/json" -d '{"usarMonitor": true}'`
   - **Schedule:** `*/5 9-22 * * *`

---

## ✅ Recomendação

### Para Coolify: **Opção 3 (API Externa)**

**Por quê?**
- ✅ Mais simples de configurar
- ✅ Não precisa modificar container
- ✅ Funciona mesmo se container reiniciar
- ✅ Logs externos
- ✅ Gratuito

### Configuração Rápida:

1. Acesse https://cron-job.org
2. Crie conta
3. Adicione cron job:
   ```
   URL: https://SEU-DOMINIO/api/resultados/liquidar
   Method: POST
   Body: {"usarMonitor": true}
   Headers: Content-Type: application/json
   Schedule: */5 9-22 * * *
   ```

---

## 🧪 Testar Manualmente

Antes de configurar o cron, teste manualmente:

```bash
# No terminal do Coolify
curl -X POST http://localhost:3000/api/resultados/liquidar \
  -H "Content-Type: application/json" \
  -d '{"usarMonitor": true}'
```

Se funcionar, pode configurar o cron job externo.

---

## 📝 Notas Importantes

1. **Horários de sorteio:** Ajuste o schedule conforme seus horários
2. **Frequência:** `*/5` = a cada 5 minutos. Pode ajustar para `*/1` (1 minuto) ou `*/10` (10 minutos)
3. **Monitoramento:** Configure alertas no serviço de cron externo
4. **Logs:** Verifique logs em `/app/logs/cron-liquidacao.log` ou no serviço externo

---

**Última atualização:** 2026-01-15
