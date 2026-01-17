# 📋 Especificações do Sistema - Lot Bicho

## 🖥️ Especificações da VPS Recomendadas

### Mínimas Recomendadas
- **CPU**: 4 vCPU cores (recomendado: 8+ cores)
- **RAM**: 8 GB (recomendado: 16 GB+)
- **Armazenamento**: 100 GB SSD/NVMe (recomendado: 300 GB+)
- **Sistema Operacional**: Ubuntu 22.04 LTS ou superior
- **Rede**: Conexão estável com IP público

### Recomendadas para Produção
- **CPU**: 16 vCPU cores
- **RAM**: 64 GB
- **Armazenamento**: 300 GB NVMe ou 600 GB SSD
- **Snapshots**: 3 snapshots automáticos
- **Sistema Operacional**: Ubuntu 22.04 LTS

---

## 🔧 Requisitos de Software

### Node.js
- **Versão**: Node.js 20.x ou superior
- **Gerenciador de Pacotes**: npm (incluído com Node.js)

### Banco de Dados
- **PostgreSQL**: Versão 14+ ou superior
- **Espaço inicial**: ~1 GB (cresce conforme uso)

### Outros Requisitos
- **OpenSSL**: Para geração de chaves de autenticação
- **cURL**: Para testes e scripts
- **Git**: Para clonar repositório

---

## 📦 Stack Tecnológica

### Frontend/Backend
- **Next.js**: 14.0.0+
- **React**: 18.2.0+
- **TypeScript**: 5.2.2+
- **Tailwind CSS**: 3.3.5+

### Banco de Dados
- **Prisma**: 5.0.0+ (ORM)
- **PostgreSQL**: Driver nativo via Prisma

### Dependências Principais
- `@prisma/client`: ^5.0.0
- `qrcode.react`: ^4.2.0
- `swiper`: ^11.0.0

---

## 🔐 Variáveis de Ambiente Necessárias

### Obrigatórias

```bash
# Banco de Dados PostgreSQL
DATABASE_URL=postgresql://usuario:senha@host:5432/nome_banco

# Autenticação (gerar com: openssl rand -hex 32)
AUTH_SECRET=sua-chave-secreta-aqui-minimo-32-caracteres

# Ambiente
NODE_ENV=production
PORT=3000
```

### Opcionais (mas recomendadas)

```bash
# API Externa - Monitor de Resultados
BICHO_CERTO_API=https://seu-monitor.com/api/resultados

# Receba Online - Gateway de Pagamento PIX
RECEBA_API_KEY=sua-api-key-aqui
RECEBA_PLATFORM_ID=seu-platform-id-aqui
RECEBA_BASE_URL=https://api.receba.online
# ou para sandbox: https://sandbox.receba.online

# URL da Aplicação (para webhooks e links internos)
NEXT_PUBLIC_APP_URL=https://seu-dominio.com

# Bônus de Primeiro Depósito (opcional)
BONUS_FIRST_DEPOSIT_PERCENT=50
BONUS_FIRST_DEPOSIT_LIMIT=100
BONUS_ROLLOVER_MULTIPLIER=3
```

---

## 🐳 Configuração Docker (Coolify)

### Dockerfile
O sistema já possui um Dockerfile configurado que:
- Usa Node.js 20 (imagem: `node:20-bullseye-slim`)
- Instala dependências do sistema (openssl, ca-certificates, curl)
- Gera Prisma Client automaticamente
- Faz build da aplicação Next.js
- Expõe porta 3000
- Cria volumes para uploads

### Portas
- **Aplicação**: 3000 (HTTP)
- **PostgreSQL**: 5432 (interno, não precisa expor)

### Volumes Necessários
- `/app/public/uploads` - Para banners, logos e stories

---

## 🗄️ Configuração do Banco de Dados

### Criar Banco de Dados PostgreSQL

```sql
-- Conectar ao PostgreSQL
psql -U postgres

-- Criar banco de dados
CREATE DATABASE lotbicho;

-- Criar usuário (opcional, mas recomendado)
CREATE USER lotbicho_user WITH PASSWORD 'senha_segura_aqui';
GRANT ALL PRIVILEGES ON DATABASE lotbicho TO lotbicho_user;

-- Conceder permissões no schema
\c lotbicho
GRANT ALL ON SCHEMA public TO lotbicho_user;
```

### Tabelas Criadas Automaticamente
O sistema cria automaticamente as seguintes tabelas via Prisma:
- `Banner`
- `Story`
- `Modalidade`
- `Promocao`
- `Extracao`
- `Cotacao`
- `Tema`
- `Configuracao`
- `Gateway`
- `Usuario`
- `Aposta`
- `Saque`
- `Transacao`

---

## 🚀 Configuração no Coolify

### 1. Criar Aplicação

1. **Tipo**: Docker Compose ou Dockerfile
2. **Repositório**: 
   - URL: `https://SEU_TOKEN@github.com/ronaldoarch/lotbicho.git`
   - Ou configurar Deploy Key SSH
3. **Branch**: `main` ou `master`

### 2. Configurar Variáveis de Ambiente

No painel do Coolify, adicionar todas as variáveis listadas acima na seção "Environment Variables".

### 3. Configurar Porta

- **Porta Interna**: 3000
- **Porta Externa**: 3000 (ou configurar proxy reverso)

### 4. Configurar Volumes

- **Path no Host**: `/var/lib/coolify/storage/lotbicho/uploads`
- **Path no Container**: `/app/public/uploads`
- **Tipo**: Volume persistente

### 5. Health Check (Opcional)

- **Endpoint**: `/api/status`
- **Intervalo**: 30 segundos
- **Timeout**: 10 segundos

---

## 📁 Estrutura de Diretórios Necessários

```
/app
├── public/
│   └── uploads/
│       ├── banners/
│       ├── logos/
│       └── stories/
├── logs/ (opcional, para logs de liquidação)
└── scripts/
    └── cron/ (para scripts de cron job)
```

---

## ⏰ Configuração de Cron Jobs

### Script de Liquidação Automática

O sistema precisa de um cron job para liquidar apostas automaticamente após os sorteios.

**Frequência Recomendada**: A cada 1-5 minutos durante horários de sorteio (9h-22h)

**Script exemplo** (`/app/scripts/cron/liquidar.sh`):
```bash
#!/bin/bash
API_URL="http://localhost:3000"
curl -X POST "$API_URL/api/resultados/liquidar" \
  -H "Content-Type: application/json" \
  -d '{"usarMonitor": true}'
```

**Crontab**:
```bash
# Executa a cada 5 minutos durante horários de sorteio
*/5 9-22 * * * /app/scripts/cron/liquidar.sh
```

---

## 🔒 Segurança

### Recomendações

1. **Firewall**: Bloquear todas as portas exceto 80, 443 e 22 (SSH)
2. **SSL/TLS**: Configurar certificado SSL (Let's Encrypt via Coolify)
3. **AUTH_SECRET**: Usar chave forte gerada com `openssl rand -hex 32`
4. **Banco de Dados**: Não expor porta PostgreSQL publicamente
5. **Backups**: Configurar backups automáticos do banco de dados

---

## 📊 Recursos Estimados

### Uso de Memória
- **Aplicação Node.js**: ~200-500 MB (base)
- **PostgreSQL**: ~100-300 MB (base)
- **Sistema Operacional**: ~500 MB
- **Total Mínimo**: ~1 GB
- **Recomendado**: 4 GB+ para produção

### Uso de CPU
- **Idle**: <5%
- **Pico (muitos usuários)**: 20-40%
- **Build/Deploy**: 80-100% (temporário)

### Uso de Disco
- **Aplicação**: ~500 MB
- **Node Modules**: ~300 MB
- **Banco de Dados**: Cresce conforme uso (estimativa: 10-50 MB/mês inicial)
- **Uploads**: Depende do uso (banners, logos, stories)
- **Logs**: ~100 MB/mês

---

## 🧪 Comandos de Verificação

### Verificar se aplicação está rodando
```bash
curl http://localhost:3000/api/status
```

### Verificar conexão com banco
```bash
npx prisma db pull
```

### Verificar variáveis de ambiente
```bash
echo $DATABASE_URL
echo $AUTH_SECRET
```

### Ver logs da aplicação
```bash
# Se usando Docker/Coolify
docker logs lotbicho

# Se usando PM2
pm2 logs lotbicho
```

---

## 📝 Checklist de Configuração

### VPS
- [ ] Ubuntu 22.04 LTS instalado
- [ ] Node.js 20+ instalado
- [ ] PostgreSQL 14+ instalado e configurado
- [ ] Firewall configurado
- [ ] Acesso SSH configurado

### Coolify
- [ ] Coolify instalado e configurado
- [ ] Aplicação criada no Coolify
- [ ] Repositório conectado (com token ou deploy key)
- [ ] Variáveis de ambiente configuradas
- [ ] Volume para uploads configurado
- [ ] Porta 3000 exposta

### Banco de Dados
- [ ] Banco de dados criado
- [ ] Usuário criado com permissões
- [ ] DATABASE_URL configurada corretamente
- [ ] Migrações executadas (automático no start)

### Aplicação
- [ ] Build executado com sucesso
- [ ] Aplicação iniciando corretamente
- [ ] Health check respondendo
- [ ] Uploads funcionando

### Cron Jobs
- [ ] Script de liquidação criado
- [ ] Cron job configurado
- [ ] Permissões de execução configuradas
- [ ] Logs sendo gerados

---

## 🆘 Suporte e Troubleshooting

### Problemas Comuns

1. **Erro de conexão com banco**
   - Verificar DATABASE_URL
   - Verificar se PostgreSQL está rodando
   - Verificar firewall

2. **Erro no build**
   - Verificar logs do Coolify
   - Verificar se todas as dependências estão instaladas
   - Verificar espaço em disco

3. **Uploads não funcionam**
   - Verificar volume montado
   - Verificar permissões do diretório
   - Verificar espaço em disco

4. **Liquidação não executa**
   - Verificar cron job configurado
   - Verificar logs do script
   - Verificar se API está respondendo

---

## 📚 Documentação Adicional

- `COMO_CONFIGURAR_COLIFY.md` - Guia detalhado de configuração do Coolify
- `COMANDOS_COOLIFY.md` - Comandos úteis para terminal do Coolify
- `docs/GUIA_PRODUCAO.md` - Guia completo de produção
- `docs/CRON_COOLIFY.md` - Configuração de cron jobs no Coolify

---

**Última atualização**: 2026-01-15
