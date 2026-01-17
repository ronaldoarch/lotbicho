# 🔗 Guia de Integração - Bot de Liquidação Automática

## 📋 Visão Geral

Este guia mostra como integrar seu sistema com um bot externo de liquidação automática. O bot recebe apostas do seu sistema e envia liquidações de volta quando os resultados saem.

---

## 🚀 Configuração Inicial

### **1. Configurar Variáveis de Ambiente**

No arquivo `.env` ou nas variáveis de ambiente do servidor:

```bash
# URL da API do bot (onde enviar apostas)
BOT_API_URL=https://seu-bot.com

# Chave de API (opcional, para autenticação)
BOT_API_KEY=sua-chave-secreta-aqui

# Ativar uso do bot para liquidação (true/false)
USAR_BOT_LIQUIDACAO=true

# URL do seu site (para o bot enviar liquidações de volta)
NEXT_PUBLIC_APP_URL=https://seu-site.com
```

### **2. Verificar se Bot Está Rodando**

Acesse: `https://seu-bot.com/api/status`

Você deve ver:
```json
{
  "bot_ativo": true,
  "bot_disponivel": true,
  ...
}
```

---

## 📤 Como Funciona

### **Fluxo de Integração:**

1. **Usuário faz aposta** → Sistema cria aposta no banco
2. **Sistema envia aposta para bot** → Bot recebe e armazena
3. **Bot monitora resultados** → Bot verifica resultados automaticamente
4. **Bot liquida apostas** → Bot calcula ganhos/perdas
5. **Bot envia liquidação** → Sistema recebe via webhook
6. **Sistema atualiza aposta** → Status e saldo são atualizados

---

## 📥 Endpoint para Receber Liquidações

### **URL:**
```
POST https://seu-site.com/api/liquidacoes/receber
```

### **Formato que o Bot Envia:**

```json
{
  "aposta_id_externo": "123",
  "aposta_id_bot": 456,
  "status": "ganhou",
  "valor_ganho": 180.0,
  "resultado": {
    "numero": "1234",
    "animal": "Cavalo",
    "posicao": 1
  },
  "timestamp": "2026-01-16T11:35:00Z",
  "detalhes": {
    "tipo_aposta": "grupo",
    "multiplicador": 18.0
  }
}
```

### **O que o Sistema Faz:**

1. ✅ Busca a aposta pelo `aposta_id_externo`
2. ✅ Atualiza status (`liquidado` ou `perdida`)
3. ✅ Se ganhou, credita no saldo do usuário
4. ✅ Cria transação de ganho
5. ✅ Salva resultado oficial nos detalhes

---

## 🔧 Configuração do Bot

### **No Bot, Configure:**

```bash
# URL da API do seu site (onde o bot vai enviar liquidações)
export SITE_API_URL="https://seu-site.com/api/liquidacoes/receber"

# Chave de API (se usar autenticação)
export SITE_API_KEY="sua-chave-secreta-aqui"
```

---

## 💻 Código de Integração

### **Envio Automático**

O sistema já está configurado para enviar apostas automaticamente para o bot quando:

- `USAR_BOT_LIQUIDACAO=true`
- `BOT_API_URL` está configurado
- A aposta não é instantânea

### **Envio Manual (Opcional)**

```typescript
import { enviarApostaParaBot, converterApostaParaBot } from '@/lib/bot-integration'

// Converter aposta do sistema para formato do bot
const apostaBot = converterApostaParaBot(aposta)

// Enviar para bot
const resultado = await enviarApostaParaBot(apostaBot)

if (resultado.sucesso) {
  console.log('Aposta enviada:', resultado.aposta_id_bot)
}
```

---

## 🧪 Testar Integração

### **1. Criar uma aposta de teste:**

```bash
curl -X POST https://seu-site.com/api/apostas \
  -H "Content-Type: application/json" \
  -H "Cookie: lotbicho_session=seu-token" \
  -d '{
    "modalidade": "Grupo",
    "valor": 10.0,
    "loteria": "25",
    "horario": "20:45",
    "detalhes": {
      "betData": {
        "modalityName": "Grupo",
        "animalBets": [[1, 2]],
        "position": "1-7",
        "amount": 10.0
      }
    }
  }'
```

### **2. Verificar se foi enviada para o bot:**

Verifique os logs do sistema. Você deve ver:
```
✅ Aposta 123 enviada para bot: 456
```

### **3. Simular liquidação do bot:**

```bash
curl -X POST https://seu-site.com/api/liquidacoes/receber \
  -H "Content-Type: application/json" \
  -d '{
    "aposta_id_externo": "123",
    "aposta_id_bot": 456,
    "status": "ganhou",
    "valor_ganho": 180.0,
    "resultado": {
      "numero": "1234",
      "animal": "Cavalo",
      "posicao": 1
    },
    "timestamp": "2026-01-16T11:35:00Z"
  }'
```

### **4. Verificar se foi liquidada:**

```bash
curl https://seu-site.com/api/apostas \
  -H "Cookie: lotbicho_session=seu-token"
```

A aposta deve ter `status: "liquidado"` e o saldo do usuário deve ter sido atualizado.

---

## 🔍 Verificar Status

### **Verificar se Bot Está Configurado:**

```typescript
import { verificarStatusBot } from '@/lib/bot-integration'

const status = await verificarStatusBot()
console.log('Bot disponível:', status.bot_disponivel)
```

### **Verificar Endpoint de Liquidação:**

```bash
curl https://seu-site.com/api/liquidacoes/receber
```

Deve retornar informações sobre o endpoint.

---

## ⚙️ Modos de Operação

### **Modo 1: Liquidação Interna (Padrão)**

```bash
USAR_BOT_LIQUIDACAO=false
# ou não definir a variável
```

- Sistema liquida apostas internamente
- Usa cron job `/api/resultados/liquidar`
- Não envia para bot externo

### **Modo 2: Liquidação por Bot**

```bash
USAR_BOT_LIQUIDACAO=true
BOT_API_URL=https://seu-bot.com
```

- Sistema envia apostas para bot
- Bot processa liquidação
- Bot envia liquidações de volta
- Sistema recebe e atualiza

### **Modo 3: Híbrido**

Você pode usar ambos:
- Apostas normais → Bot externo
- Apostas instantâneas → Sistema interno

---

## ⚠️ Tratamento de Erros

### **Erros Comuns:**

1. **Bot não está rodando:**
   - Verificar: `https://seu-bot.com/api/status`
   - Verificar logs do bot
   - Sistema continua funcionando normalmente (apostas ficam pendentes)

2. **Aposta não é enviada:**
   - Verificar `BOT_API_URL` está configurado
   - Verificar `USAR_BOT_LIQUIDACAO=true`
   - Verificar logs do sistema
   - Aposta é criada normalmente, apenas não é enviada para bot

3. **Liquidação não chega:**
   - Verificar se endpoint `/api/liquidacoes/receber` está funcionando
   - Verificar logs do bot
   - Verificar se resultado foi coletado pelo bot
   - Você pode liquidar manualmente usando `/api/resultados/liquidar`

---

## 🔒 Segurança

### **Autenticação (Opcional):**

Se o bot usar autenticação, configure:

```bash
BOT_API_KEY=sua-chave-secreta-aqui
```

O sistema enviará no header:
```
Authorization: Bearer sua-chave-secreta-aqui
```

### **Validação de Liquidações:**

O endpoint `/api/liquidacoes/receber` valida:
- ✅ Campos obrigatórios
- ✅ Aposta existe no banco
- ✅ Aposta não foi liquidada anteriormente
- ✅ Valores numéricos válidos

---

## 📊 Monitoramento

### **Logs do Sistema:**

O sistema registra:
- ✅ Quando aposta é enviada para bot
- ✅ Quando liquidação é recebida
- ⚠️ Erros ao enviar/receber
- 📊 Status de cada operação

### **Verificar Apostas Pendentes:**

```sql
SELECT id, usuarioId, valor, loteria, horario, status, detalhes->>'enviado_para_bot'
FROM "Aposta"
WHERE status = 'pendente'
ORDER BY createdAt DESC;
```

---

## 🎯 Vantagens da Integração com Bot

1. **Escalabilidade**: Bot pode processar muitas apostas
2. **Confiabilidade**: Bot monitora resultados 24/7
3. **Performance**: Não sobrecarrega seu servidor
4. **Flexibilidade**: Pode usar bot ou sistema interno
5. **Manutenção**: Bot é atualizado independentemente

---

## 📞 Suporte

Se tiver problemas:

1. Verificar logs do sistema
2. Verificar status do bot: `/api/status`
3. Verificar variáveis de ambiente
4. Testar endpoint de liquidação manualmente
5. Verificar se apostas estão sendo criadas corretamente

---

**Pronto!** Agora seu sistema está integrado com bot de liquidação automática! 🎉
