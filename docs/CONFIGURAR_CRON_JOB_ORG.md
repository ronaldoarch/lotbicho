# 📝 Guia Passo a Passo: Configurar Cron Job no cron-job.org

## 🎯 Configuração Completa

### Passo 1: Preencher Campos Básicos

#### **Title** (Título)
```
Liquidação Automática - Lot Bicho
```
ou
```
Liquidar Apostas Pendentes
```

#### **URL*** (Obrigatório)
```
https://ig4o44cgogk084sc0g8884o4.agenciamidas.com/api/resultados/liquidar
```
⚠️ **IMPORTANTE:** 
- Use `https://` (não `http://`)
- Use a URL pública do seu servidor Coolify
- Não use `localhost`

#### **Enable job** (Toggle)
✅ **Deixar ATIVADO** (toggle laranja)

#### **Save responses in job history** (Toggle)
✅ **Recomendado ATIVAR** para ver histórico de execuções

---

### Passo 2: Configurar Método HTTP

Clique na aba **"ADVANCED"** (ao lado de COMMON) e configure:

#### **Request method**
Selecione: **POST**

#### **Request headers**
Adicione header:
```
Content-Type: application/json
```

#### **Request body**
```
{"usarMonitor": true}
```

---

### Passo 3: Configurar Schedule (Horário)

Na aba **COMMON**, em **"Execution schedule"**:

#### Opção Recomendada: **"Every X minutes"**

1. Selecione **"Every 15 minutes"** (ou ajuste conforme necessário)
2. No dropdown ao lado, escolha:
   - **5 minutes** (a cada 5 minutos) ← Recomendado
   - **10 minutes** (a cada 10 minutos)
   - **15 minutes** (a cada 15 minutos)

#### Opção Alternativa: Horários Específicos

Se quiser executar apenas após horários de sorteio:

1. Selecione **"Every day at X : XX"**
2. Configure múltiplos horários:
   - 9:30 (após sorteio da manhã)
   - 12:00 (após sorteio do meio-dia)
   - 15:00 (após sorteio da tarde)
   - 18:00 (após sorteio da noite)
   - 22:00 (após sorteio da coruja)

**Nota:** Para múltiplos horários, você precisará criar múltiplos cron jobs.

---

### Passo 4: Verificar Próximas Execuções

Na seção **"Next executions"** à direita, você verá quando o cron job será executado.

Exemplo:
- 3:00 AM
- 3:05 AM
- 3:10 AM
- 3:15 AM
- ...

---

### Passo 5: Salvar

Clique no botão **"Create cronjob"** (ou **"Save"**) no final do formulário.

---

## ✅ Configuração Completa Recomendada

### Campos na Aba COMMON:
```
Title: Liquidação Automática - Lot Bicho
URL: https://ig4o44cgogk084sc0g8884o4.agenciamidas.com/api/resultados/liquidar
Enable job: ✅ ATIVADO
Save responses in job history: ✅ ATIVADO
Execution schedule: Every 5 minutes
```

### Campos na Aba ADVANCED:
```
Request method: POST
Request headers: Content-Type: application/json
Request body: {"usarMonitor": true}
```

---

## 🧪 Testar Antes de Salvar

### Opção 1: Testar Manualmente no Terminal

Antes de criar o cron job, teste se a URL funciona:

```bash
curl -X POST https://ig4o44cgogk084sc0g8884o4.agenciamidas.com/api/resultados/liquidar \
  -H "Content-Type: application/json" \
  -d '{"usarMonitor": true}'
```

Se retornar JSON com `processadas`, `liquidadas`, etc., está funcionando!

### Opção 2: Usar Botão "Test" no cron-job.org

Alguns serviços têm um botão "Test" para testar antes de salvar.

---

## 📊 Monitorar Execuções

Após criar o cron job:

1. Vá em **"Cronjobs"** → Selecione seu job
2. Veja **"Job history"** para ver execuções passadas
3. Verifique se está retornando status 200 (sucesso)

---

## 🔧 Ajustes Finais

### Se quiser executar apenas em horários específicos:

Crie múltiplos cron jobs, um para cada horário:
- Job 1: `Every day at 9 : 30`
- Job 2: `Every day at 12 : 00`
- Job 3: `Every day at 15 : 00`
- Job 4: `Every day at 18 : 00`
- Job 5: `Every day at 22 : 00`

### Se quiser executar continuamente:

Use `Every 5 minutes` e o sistema tentará liquidar a cada 5 minutos.

---

## ⚠️ Troubleshooting

### Erro: "Connection refused" ou "Timeout"
- Verifique se a URL está correta
- Verifique se o servidor está acessível publicamente
- Teste a URL no navegador primeiro

### Erro: "404 Not Found"
- Verifique se o endpoint `/api/resultados/liquidar` existe
- Verifique se está usando a URL completa correta

### Erro: "401 Unauthorized"
- Verifique se não precisa de autenticação
- Se precisar, adicione header `Authorization` na aba ADVANCED

---

**Última atualização:** 2026-01-15
