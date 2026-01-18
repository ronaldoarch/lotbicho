# 🚀 Comandos para Coolify - Pós Deploy

## 📋 Checklist Pós Deploy

### 1. Verificar Variáveis de Ambiente

No painel do Coolify, verifique se estas variáveis estão configuradas:

```env
DATABASE_URL=postgresql://...
AUTH_SECRET=...
BICHO_CERTO_API=https://...
NODE_ENV=production
```

### 2. Executar no Terminal do Coolify

#### Passo 1: Verificar se aplicação está rodando

```bash
# Verificar status
pm2 list
# ou
ps aux | grep node
```

#### Passo 2: Executar Migrações do Prisma

```bash
# Gerar Prisma Client
npx prisma generate

# Executar migrações (se houver novas)
npx prisma migrate deploy

# OU se não usar migrações, usar push
npx prisma db push
```

#### Passo 3: Verificar Conexão com Banco

```bash
# Testar conexão
npx prisma studio --browser none &
# Ou simplesmente verificar
npx prisma db pull
```

#### Passo 4: Testar Endpoints

```bash
# Testar endpoint de estatísticas
curl http://localhost:3000/api/resultados/liquidar

# Testar endpoint de status
curl http://localhost:3000/api/status

# Testar liquidação manual (forçar uso próprio)
curl -X POST http://localhost:3000/api/resultados/liquidar \
  -H "Content-Type: application/json" \
  -d '{"usarMonitor": false}'
```

#### Passo 5: Verificar Logs

```bash
# Ver logs da aplicação
pm2 logs lotbicho --lines 50

# Ou se não usar PM2
tail -f /var/log/nextjs/app.log
```

---

## 🔧 Comandos Úteis

### Verificar Banco de Dados

```bash
# Conectar ao banco via Prisma
npx prisma studio

# Ver tabelas
npx prisma db execute --stdin <<< "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
```

### Verificar Apostas Pendentes

```bash
# Via API
curl http://localhost:3000/api/resultados/liquidar | jq

# Via Prisma (se tiver acesso direto)
npx prisma db execute --stdin <<< "SELECT COUNT(*) as pendentes FROM \"Aposta\" WHERE status = 'pendente';"
```

### Testar Liquidação Manual

```bash
# Teste completo
curl -X POST http://localhost:3000/api/resultados/liquidar \
  -H "Content-Type: application/json" \
  -d '{
    "usarMonitor": false,
    "loteria": "PT Rio de Janeiro"
  }' | jq
```

---

## ⏰ Configurar Cron Job no Coolify

### Opção 1: Via Cron Job do Coolify

No painel do Coolify:
1. Vá em **Settings** → **Cron Jobs**
2. Adicione novo cron job:
   - **Command:** `curl -X POST http://localhost:3000/api/resultados/liquidar -H "Content-Type: application/json" -d '{"usarMonitor": true}'`
   - **Schedule:** `*/5 9-22 * * *` (a cada 5 minutos das 9h às 22h)
   - **Container:** Selecione seu container

### Opção 2: Via Script no Container

```bash
# Dentro do container, criar script
cat > /app/scripts/cron/liquidar.sh << 'EOF'
#!/bin/bash
curl -X POST http://localhost:3000/api/resultados/liquidar \
  -H "Content-Type: application/json" \
  -d '{"usarMonitor": true}'
EOF

chmod +x /app/scripts/cron/liquidar.sh

# Adicionar ao crontab do container
(crontab -l 2>/dev/null; echo "*/5 9-22 * * * /app/scripts/cron/liquidar.sh >> /app/logs/cron.log 2>&1") | crontab -
```

---

## 🐛 Troubleshooting

### Problema: Prisma não encontra banco

```bash
# Verificar variável DATABASE_URL
echo $DATABASE_URL

# Testar conexão
npx prisma db pull
```

### Problema: Migrações falham

```bash
# Verificar status das migrações
npx prisma migrate status

# Resetar (CUIDADO: apaga dados)
# npx prisma migrate reset

# Ou usar push (não cria histórico)
npx prisma db push
```

### Problema: Aplicação não inicia

```bash
# Verificar logs
pm2 logs --err

# Verificar variáveis
env | grep -E "DATABASE|AUTH|BICHO"

# Testar build localmente
npm run build
```

### Problema: Endpoint não responde

```bash
# Verificar se porta está correta
netstat -tulpn | grep 3000

# Testar endpoint diretamente
curl -v http://localhost:3000/api/resultados/liquidar
```

---

## ✅ Checklist Final

- [ ] Variáveis de ambiente configuradas no Coolify
- [ ] Migrações executadas (`npx prisma migrate deploy`)
- [ ] Aplicação rodando (`pm2 list` ou `ps aux | grep node`)
- [ ] Endpoint respondendo (`curl http://localhost:3000/api/resultados/liquidar`)
- [ ] Cron job configurado (se necessário)
- [ ] Logs sendo gerados corretamente
- [ ] Teste manual de liquidação executado

---

## 📞 Próximos Passos

1. **Monitorar primeiras execuções** do cron job
2. **Verificar logs** para garantir que está funcionando
3. **Ajustar frequência** do cron conforme necessário
4. **Configurar alertas** (se disponível no Coolify)

---

**Última atualização:** 2026-01-15
