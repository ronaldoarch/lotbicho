# 🚀 Guia Rápido de Produção

## ⚡ Setup Rápido

### 1. Variáveis de Ambiente

```bash
# Criar .env.production
DATABASE_URL=postgresql://user:pass@localhost:5432/lotbicho
AUTH_SECRET=$(openssl rand -hex 32)
BICHO_CERTO_API=https://seu-monitor.com/api/resultados
NODE_ENV=production
```

### 2. Banco de Dados

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
```

### 3. Build e Start

```bash
npm run build
npm start
```

### 4. Cron Job (Liquidação Automática)

```bash
# Editar crontab
crontab -e

# Adicionar (executa a cada 5 minutos durante horários de sorteio)
*/5 9-22 * * * /caminho/para/lotbicho/scripts/cron/liquidar.sh
```

---

## 📊 Como Funciona em Produção

### Fluxo Automático

```
1. Cron job executa a cada X minutos
   ↓
2. Chama POST /api/resultados/liquidar
   ↓
3. Tenta usar monitor (se usarMonitor=true)
   ├─ Monitor disponível? → Usa monitor ✅
   └─ Monitor indisponível? → Usa implementação própria ⚙️
   ↓
4. Busca apostas pendentes
   ↓
5. Busca resultados oficiais
   ↓
6. Confere cada aposta usando bet-rules-engine.ts
   ↓
7. Calcula prêmios
   ↓
8. Atualiza saldos dos usuários
   ↓
9. Marca apostas como liquidadas/perdidas
   ↓
10. Retorna estatísticas
```

### Endpoints Principais

- **GET `/api/resultados/liquidar`** - Ver estatísticas
- **POST `/api/resultados/liquidar`** - Executar liquidação
- **GET `/api/status`** - Status do monitor

### Monitoramento

```bash
# Ver estatísticas
curl http://localhost:3000/api/resultados/liquidar

# Ver logs
tail -f logs/liquidacao-$(date +%Y%m%d).log

# Ver status do monitor
curl http://localhost:3000/api/status
```

---

## 🔧 Comandos Úteis

### PM2 (Recomendado)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar
pm2 start ecosystem.config.js

# Ver logs
pm2 logs lotbicho

# Reiniciar
pm2 restart lotbicho

# Parar
pm2 stop lotbicho
```

### Docker

```bash
# Build
docker build -t lotbicho:latest .

# Run
docker run -d --name lotbicho --env-file .env.production -p 3000:3000 lotbicho:latest

# Logs
docker logs -f lotbicho
```

---

## 📝 Checklist

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados migrado
- [ ] Aplicação buildada
- [ ] Servidor rodando
- [ ] Cron job configurado
- [ ] Teste manual executado
- [ ] Logs funcionando

---

**Documentação completa:** `docs/GUIA_PRODUCAO.md`
