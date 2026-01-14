# 🔄 Guia Completo: Configuração do Cron Job para Liquidação Automática

**Última atualização:** 14 de Janeiro de 2026

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Como Funciona a Liquidação](#como-funciona-a-liquidação)
3. [Endpoint de Liquidação](#endpoint-de-liquidação)
4. [Opções de Configuração](#opções-de-configuração)
5. [Configuração Passo a Passo](#configuração-passo-a-passo)
6. [Monitoramento e Logs](#monitoramento-e-logs)
7. [Troubleshooting](#troubleshooting)
8. [Boas Práticas](#boas-práticas)

---

## 🎯 Visão Geral

O sistema de liquidação automática funciona através de um **cron job** que executa periodicamente (a cada 5 minutos) e chama o endpoint `/api/resultados/liquidar` para:

1. Buscar apostas pendentes
2. Buscar resultados oficiais das extrações
3. Conferir cada aposta contra os resultados
4. Calcular prêmios
5. Atualizar status das apostas (liquidado/perdida)
6. Creditar prêmios na carteira dos usuários

---

## 🔍 Como Funciona a Liquidação

### Fluxo de Execução

```
┌─────────────────┐
│  Cron Job       │
│  (a cada X min) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ POST /api/resultados/      │
│ liquidar                   │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 1. Buscar apostas pendentes │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 2. Verificar horário de    │
│    apuração (closeTime)     │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 3. Buscar resultados        │
│    oficiais                 │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 4. Filtrar resultados por   │
│    loteria/data/horário     │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 5. Conferir cada aposta     │
│    contra resultados        │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 6. Calcular prêmios         │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 7. Atualizar status e       │
│    creditar prêmios         │
└─────────────────────────────┘
```

### Verificação de Horário de Apuração

**IMPORTANTE**: O sistema só liquida apostas após o horário de apuração (`closeTime`) ter passado.

- **`realCloseTime`**: Quando fecha no site (para de aceitar apostas)
- **`closeTime`**: Quando acontece a apuração (quando os resultados são divulgados)

O cron job verifica se já passou o `closeTime` antes de liquidar cada aposta.

---

## 🌐 Endpoint de Liquidação

### URL

```
POST /api/resultados/liquidar
GET  /api/resultados/liquidar  # Retorna estatísticas
```

### Configurações Técnicas

- **maxDuration**: 120 segundos (2 minutos)
- **dynamic**: `force-dynamic` (não cacheia)
- **Fuso horário**: Horário de Brasília (GMT-3) para verificação de `closeTime`

### Requisição (Body Opcional)

```json
{
  "loteria": "16",           // Opcional: filtrar por loteria específica
  "dataConcurso": "2026-01-14",  // Opcional: filtrar por data
  "horario": "14:20",        // Opcional: filtrar por horário
  "usarMonitor": false       // Opcional: tentar usar sistema do monitor primeiro (default: false)
}
```

**Nota**: Se não enviar parâmetros, processa todas as apostas pendentes.

**Estratégia de Liquidação**:
- Se `usarMonitor: true`: Tenta usar endpoint do monitor primeiro (`${BICHO_CERTO_API}/api/resultados/liquidar`)
- Se monitor não disponível ou falhar: Usa implementação própria automaticamente
- Se `usarMonitor: false` ou não fornecido: Usa apenas implementação própria

### Resposta de Sucesso

```json
{
  "message": "Liquidação concluída",
  "processadas": 10,
  "liquidadas": 3,
  "premioTotal": 150.00,
  "fonte": "proprio",  // ou "monitor" se usado monitor
  "apostas": [
    {
      "id": 1,
      "status": "liquidado",
      "premio": 50.00
    }
  ]
}
```

**Campos da Resposta**:
- `message`: Mensagem de status
- `processadas`: Quantidade de apostas processadas
- `liquidadas`: Quantidade de apostas liquidadas (com prêmio)
- `premioTotal`: Valor total de prêmios creditados
- `fonte`: `"monitor"` se usado monitor, `"proprio"` se usado implementação própria
- `apostas`: Array com detalhes das apostas processadas (opcional)

### Resposta de Erro

```json
{
  "error": "Erro ao buscar resultados oficiais",
  "message": "A API de resultados demorou muito para responder.",
  "processadas": 0
}
```

### Timeout e Configurações

- **maxDuration**: 120 segundos (2 minutos) - tempo máximo para processar muitas apostas
- **Timeout de busca de resultados**: 30 segundos por tentativa
- **Timeout do script cron**: 60 segundos (`--max-time 60` no curl)
- **Fuso horário**: Horário de Brasília (GMT-3) - usado para verificação de `closeTime`

---

## ⚙️ Opções de Configuração

### Opção 1: Serviço Externo (Recomendado)

#### cron-job.org

**Vantagens**:
- ✅ Não depende do servidor
- ✅ Interface web amigável
- ✅ Logs e histórico
- ✅ Notificações por email

**Passos**:

1. Acesse [cron-job.org](https://cron-job.org)
2. Crie uma conta gratuita
3. Clique em "Create cronjob"
4. Preencha:
   - **Title**: Liquidação Lot Bicho
   - **Address**: `https://seu-dominio.com/api/resultados/liquidar`
   - **Schedule**: `*/5 * * * *` (a cada 5 minutos)
   - **Request Method**: POST
   - **Request Body**: `{}` (JSON vazio)
   - **Request Headers**: `Content-Type: application/json`
   - **Timeout**: 90 segundos
5. Salve e ative

**Exemplo de URL**:
```
https://ig4o44cgogk084sc0g8884o4.agenciamidas.com/api/resultados/liquidar
```

**⚠️ IMPORTANTE**: 
- Use HTTPS (não HTTP)
- Use o domínio completo (não localhost)
- Configure timeout de pelo menos 90 segundos

#### EasyCron

Similar ao cron-job.org, com interface alternativa.

### Opção 2: Cron Job no Servidor (Coolify/Docker)

#### Usando Dockerfile

Adicione ao seu `Dockerfile`:

```dockerfile
# Instalar cron
RUN apt-get update && apt-get install -y cron

# Copiar script de liquidação
COPY scripts/cron/liquidar.sh /app/scripts/cron/liquidar.sh
RUN chmod +x /app/scripts/cron/liquidar.sh

# Configurar crontab
RUN echo "*/10 * * * * /app/scripts/cron/liquidar.sh" | crontab -

# Iniciar cron
CMD cron && npm start
```

#### Usando Script Shell

Crie o arquivo `scripts/cron/liquidar.sh`:

```bash
#!/bin/bash

# Variáveis de ambiente
API_URL="${API_URL:-http://localhost:3000}"
ENDPOINT="${API_URL}/api/resultados/liquidar"

# Fazer requisição POST
curl -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -d '{}' \
  --max-time 120 \
  --silent \
  --show-error

# Log do resultado
echo "$(date): Liquidação executada"
```

**Tornar executável**:
```bash
chmod +x scripts/cron/liquidar.sh
```

**Configurar crontab**:
```bash
# Editar crontab
crontab -e

# Adicionar linha (executa a cada 5 minutos)
*/10 * * * * /app/scripts/cron/liquidar.sh >> /var/log/liquidacao.log 2>&1
```

### Opção 3: Terminal do Coolify

1. Acesse o terminal do container no Coolify
2. Execute:
```bash
# Editar crontab
crontab -e

# Adicionar linha
*/10 * * * * curl -X POST http://localhost:3000/api/resultados/liquidar -H "Content-Type: application/json" -d '{}' --max-time 120
```

**⚠️ Problema**: Esta configuração é perdida quando o container é recriado.

### Opção 4: PM2 com Cron

Se estiver usando PM2, pode criar um script Node.js:

```javascript
// scripts/cron-liquidar.js
const cron = require('node-cron');
const fetch = require('node-fetch');

const API_URL = process.env.API_URL || 'http://localhost:3000';

cron.schedule('*/10 * * * *', async () => {
  try {
    const response = await fetch(`${API_URL}/api/resultados/liquidar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(120000)
    });
    
    const data = await response.json();
    console.log(`[${new Date().toISOString()}] Liquidação:`, data);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erro na liquidação:`, error);
  }
});
```

---

## 📝 Configuração Passo a Passo

### Método Recomendado: cron-job.org

#### Passo 1: Obter URL do Endpoint

1. Acesse seu painel do Coolify
2. Encontre o domínio da aplicação (ex: `ig4o44cgogk084sc0g8884o4.agenciamidas.com`)
3. A URL completa será: `https://seu-dominio.com/api/resultados/liquidar`

#### Passo 2: Criar Conta no cron-job.org

1. Acesse [https://cron-job.org](https://cron-job.org)
2. Clique em "Sign Up" ou "Login"
3. Crie uma conta gratuita

#### Passo 3: Criar Cron Job

1. Clique em **"Create cronjob"**
2. Preencha os campos:

   **Basic Settings**:
   - **Title**: `Liquidação Lot Bicho`
   - **Address**: `https://seu-dominio.com/api/resultados/liquidar`
   - **Schedule**: `*/5 * * * *` (a cada 5 minutos)
   
   **Request Settings**:
   - **Request Method**: `POST`
   - **Request Body**: `{"usarMonitor": true}` (tenta monitor primeiro, fallback automático)
   - **Request Headers**: 
     ```
     Content-Type: application/json
     ```
   - **Timeout**: `90` (segundos) - recomendado mínimo 90s devido ao maxDuration de 120s
   
   **Notifications**:
   - Marque "Send email on failure" (opcional)
   - Adicione seu email

3. Clique em **"Create cronjob"**

#### Passo 4: Testar

1. Clique em **"Test"** no cron job criado
2. Verifique se retorna status 200
3. Verifique os logs do servidor para confirmar execução

#### Passo 5: Ativar

1. Certifique-se de que o cron job está **ativado** (toggle verde)
2. Aguarde alguns minutos
3. Verifique os logs do servidor para confirmar execuções periódicas

---

## 📊 Monitoramento e Logs

### Logs do Servidor

O endpoint gera logs detalhados:

```
📊 Total de apostas pendentes encontradas: 6
📋 Aposta 1 (ID: 1):
   - Loteria: 16
   - Horário: N/A
   - Data Concurso: 14/01/2026
   - Modalidade: Dupla de Grupo

🔄 Buscando resultados via API interna...
✅ Resultados obtidos com sucesso via API interna

⏰ Verificação de horário: PT SP (ID 46) - closeTime: 20:15
   Data apuração: 14/01/2026 20:15 (Brasília)
   Agora: 14/01/2026 19:57 (Brasília)
   ⏸️  Ainda não passou o horário de apuração

✅ Liquidação concluída
   Processadas: 6
   Liquidadas: 3
   Premio Total: R$ 150.00
   Fonte: proprio
```

### Logs do Script Cron

O script `liquidar.sh` gera logs em arquivo separado:

```
[2026-01-14 20:00:00] ==========================================
[2026-01-14 20:00:00] Iniciando liquidação automática...
[2026-01-14 20:00:05] ✅ Liquidação concluída com sucesso
[2026-01-14 20:00:05]    Processadas: 6
[2026-01-14 20:00:05]    Liquidadas: 3
[2026-01-14 20:00:05]    Prêmio total: R$ 150.00
[2026-01-14 20:00:05]    Fonte: proprio
[2026-01-14 20:00:05] Finalizando liquidação automática.
[2026-01-14 20:00:05] ==========================================
```

**Localização dos logs**:
- Script cron: `$LOG_DIR/liquidacao-YYYYMMDD.log` (ex: `scripts/logs/liquidacao-20260114.log`)
- Servidor: Logs do Next.js/PM2/Docker conforme configuração

### Verificar Status do Cron Job

#### No cron-job.org

1. Acesse o dashboard
2. Veja o histórico de execuções
3. Verifique status (sucesso/falha)
4. Veja tempo de resposta

#### No Servidor

```bash
# Ver logs do container
docker logs -f nome-do-container

# Ou no terminal do Coolify
tail -f /var/log/liquidacao.log
```

### Verificar Apostas Liquidadas

```bash
# No terminal do Coolify ou via API
curl http://localhost:3000/api/resultados/liquidar
```

Resposta:
```json
{
  "pendentes": 3,
  "liquidadas": 10,
  "perdidas": 5,
  "total": 18
}
```

---

## 🔧 Troubleshooting

### Problema 1: Cron Job Retorna 404

**Sintoma**: `404 Not Found` ao testar o cron job

**Soluções**:
1. Verifique se a URL está correta (use HTTPS, não HTTP)
2. Verifique se o domínio está acessível publicamente
3. Teste manualmente: `curl -X POST https://seu-dominio.com/api/resultados/liquidar`
4. Verifique se o servidor está rodando

### Problema 2: Timeout

**Sintoma**: Cron job falha com timeout

**Soluções**:
1. Aumente o timeout no cron-job.org para **mínimo 90 segundos** (recomendado: 120s)
   - O endpoint tem `maxDuration = 120` segundos
   - O script cron usa `--max-time 60`, mas serviços externos devem ter timeout maior
2. Verifique se a API de resultados externa está respondendo
3. Verifique logs do servidor para identificar gargalos
4. Se necessário, ajuste `maxDuration` no arquivo `app/api/resultados/liquidar/route.ts`

### Problema 3: Apostas Não Estão Sendo Liquidadas

**Sintoma**: Cron job executa mas não liquida apostas

**Verificações**:
1. Verifique se há apostas pendentes:
   ```bash
   curl http://localhost:3000/api/resultados/liquidar
   ```

2. Verifique logs do servidor:
   - Procure por "Total de apostas pendentes encontradas"
   - Verifique se há erros de filtro

3. Verifique horário de apuração:
   - Logs mostram "⏸️ Ainda não passou o horário de apuração"
   - Aguarde até passar o `closeTime`

4. Verifique se resultados estão disponíveis:
   - Logs mostram "Nenhum resultado encontrado"
   - Verifique se a API externa está retornando dados

### Problema 4: Fuso Horário Incorreto

**Sintoma**: Apostas sendo liquidadas antes da hora

**Solução**:
- O sistema já está configurado para usar horário de Brasília (GMT-3)
- Verifique logs para confirmar horários corretos
- Se necessário, ajuste `TZ` no servidor

### Problema 5: Erro ao Buscar Resultados

**Sintoma**: "Erro ao buscar resultados oficiais"

**Soluções**:
1. **Estratégia de busca**:
   - Primeiro tenta API interna (`/api/resultados`) - timeout 30s
   - Se falhar, tenta API externa (`BICHO_CERTO_API`) - timeout 30s
   - Verifique logs para ver qual tentativa falhou
2. Verifique variável de ambiente `BICHO_CERTO_API`:
   ```bash
   echo $BICHO_CERTO_API
   # Default: https://okgkgswwkk8ows0csow0c4gg.agenciamidas.com/api/resultados
   ```
3. Verifique timeout da requisição (30 segundos por tentativa)
4. Verifique logs para detalhes do erro:
   - `🔄 Buscando resultados via API interna...`
   - `🔄 Tentando API externa como fallback...`
   - `❌ Erro ao buscar resultados via API interna:`

---

## ✅ Boas Práticas

### 1. Frequência de Execução

**Configuração Atual**: A cada 5 minutos

- **Frequência atual**: `*/5 * * * *` (a cada 5 minutos)
- **Muito frequente** (1-2 min): Pode sobrecarregar o servidor e API externa
- **Muito espaçado** (30+ min): Usuários esperam muito pelos resultados

**Cron Expression**:
```
*/5 * * * *   # A cada 5 minutos (configuração atual recomendada)
*/10 * * * *  # A cada 10 minutos (alternativa mais conservadora)
*/15 * * * *  # A cada 15 minutos (alternativa para servidores com menos recursos)
```

**⚠️ Importante**: Com `maxDuration = 120s`, execuções muito frequentes podem sobrepor se uma execução demorar mais que 5 minutos.

### 2. Horários de Execução

**Configuração Atual**: Executar a cada 5 minutos durante todo o dia

- **Horário**: 24 horas (executa continuamente)
- **Frequência**: A cada 5 minutos
- **Verificação de horário**: Sistema verifica `closeTime` antes de liquidar cada aposta

**Cron Expression**:
```
*/5 * * * *  # A cada 5 minutos (configuração atual)
```

**Alternativa com horários específicos** (se quiser economizar recursos):
```
*/5 8-23 * * *  # A cada 5 minutos das 8h às 23h
```

**Nota**: Mesmo executando 24h, o sistema só liquida apostas após o `closeTime` ter passado, então é seguro executar continuamente.

### 3. Monitoramento

**Configure**:
- ✅ Notificações por email em caso de falha
- ✅ Logs centralizados
- ✅ Alertas para múltiplas falhas consecutivas

### 4. Backup e Recuperação

**Recomendado**:
- Manter backup do banco de dados
- Ter processo manual de liquidação como fallback
- Documentar procedimentos de recuperação

### 5. Testes

**Antes de colocar em produção**:
1. Teste manualmente o endpoint
2. Verifique logs detalhados
3. Teste com apostas de exemplo
4. Verifique cálculo de prêmios

---

## 📋 Checklist de Configuração

- [ ] Endpoint `/api/resultados/liquidar` está funcionando
- [ ] URL do endpoint está acessível publicamente (HTTPS)
- [ ] Cron job criado no serviço externo ou servidor
- [ ] Frequência configurada (`*/5 * * * *` - a cada 5 minutos)
- [ ] Request Body configurado: `{"usarMonitor": true}`
- [ ] Timeout configurado (mínimo 90 segundos, recomendado 120s)
- [ ] Headers configurados: `Content-Type: application/json`
- [ ] Notificações configuradas (opcional)
- [ ] Teste manual executado com sucesso
- [ ] Logs sendo monitorados (servidor e script cron)
- [ ] Variáveis de ambiente configuradas (`BICHO_CERTO_API`, etc.)
- [ ] Verificado que sistema usa horário de Brasília (GMT-3)

---

## 🔗 Referências

- **Endpoint de Liquidação**: `/app/api/resultados/liquidar/route.ts`
- **Script Shell**: `/scripts/cron/liquidar.sh`
- **Guia de Produção**: `/docs/GUIA_PRODUCAO.md`
- **Comandos Coolify**: `/docs/COMANDOS_COOLIFY.md`
- **Cron Coolify**: `/docs/CRON_COOLIFY.md`
- **Troubleshooting**: `/docs/TROUBLESHOOTING_LIQUIDACAO.md`

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do servidor
2. Verifique os logs do cron job (se usando serviço externo)
3. Teste o endpoint manualmente
4. Consulte `/docs/TROUBLESHOOTING_LIQUIDACAO.md`

---

**Última atualização:** 14 de Janeiro de 2026
