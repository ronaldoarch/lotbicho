# 🔍 Guia de Diagnóstico: Liquidação Parou de Funcionar

## 📋 Endpoints de Diagnóstico

### 1. Verificar Status das Apostas

**No terminal do Coolify ou via curl:**

```bash
curl http://localhost:3000/api/resultados/liquidar/status
```

**Ou se estiver acessando externamente:**

```bash
curl https://seu-dominio.com/api/resultados/liquidar/status
```

**Resposta esperada:**
```json
{
  "contadores": {
    "pendentes": 5,
    "pendentesMinusculo": 0,
    "liquidadas": 10,
    "perdidas": 2,
    "total": 17
  },
  "statusUnicos": ["pendente", "liquidado", "perdida"],
  "exemplosPendentes": [...],
  "exemplosOutrosStatus": [...]
}
```

### 2. Diagnóstico Detalhado

**No terminal do Coolify:**

```bash
curl http://localhost:3000/api/resultados/liquidar/debug
```

**Resposta esperada:**
```json
{
  "totalApostasPendentes": 5,
  "diagnosticos": [
    {
      "apostaId": 123,
      "loteria": "1",
      "horario": "20:15",
      "dataConcurso": "2026-01-18",
      "problemas": [],
      "informacoes": [
        "Extração encontrada: PT SP",
        "Horário real de apuração: 20:00 - 20:15",
        "✅ Já passou o horário de apuração inicial",
        "Resultados encontrados: 7 resultado(s) em 1 horário(s)"
      ]
    }
  ]
}
```

### 3. Testar Liquidação Manualmente

**No terminal do Coolify:**

```bash
curl -X POST http://localhost:3000/api/resultados/liquidar
```

**Resposta esperada:**
```json
{
  "message": "Liquidação concluída",
  "processadas": 5,
  "liquidadas": 3,
  "premioTotal": 150.50,
  "fonte": "proprio"
}
```

---

## 🔍 Problemas Comuns e Soluções

### Problema 1: `processadas: 0, liquidadas: 0`

**Possíveis causas:**

1. **Nenhuma aposta pendente**
   - Verificar: `curl http://localhost:3000/api/resultados/liquidar/status`
   - Se `pendentes: 0`, não há apostas para liquidar

2. **Apostas com status diferente**
   - Verificar: `statusUnicos` no endpoint de status
   - Se houver `PENDENTE` (maiúsculo), pode ser problema de case sensitivity
   - **Solução**: Verificar se o schema do Prisma está correto

3. **Horário de apuração não passou**
   - Verificar: `curl http://localhost:3000/api/resultados/liquidar/debug`
   - Se aparecer "Ainda não passou o horário de apuração", aguardar

4. **Resultados não encontrados**
   - Verificar: `curl http://localhost:3000/api/resultados/liquidar/debug`
   - Se aparecer "Nenhum resultado disponível", verificar:
     - Se o bichocerto.com está acessível
     - Se a data do concurso está correta
     - Se o código da loteria está mapeado corretamente

### Problema 2: Erro ao buscar resultados

**Sintomas:**
- Erro 504 ou timeout
- Mensagem "Erro ao buscar resultados oficiais"

**Soluções:**

1. **Verificar conectividade com bichocerto.com**
   ```bash
   curl -I https://bichocerto.com
   ```

2. **Verificar variável de ambiente**
   ```bash
   # No terminal do Coolify
   echo $BICHOCERTO_PHPSESSID
   ```

3. **Verificar logs do container**
   - No Coolify, vá em "Logs"
   - Procure por erros relacionados a `bichocerto-parser`

### Problema 3: Apostas não batem com resultados

**Sintomas:**
- `processadas > 0` mas `liquidadas = 0`
- Logs mostram "Nenhum resultado encontrado para..."

**Soluções:**

1. **Verificar match de loteria**
   - Verificar se o nome da loteria na aposta corresponde ao nome no resultado
   - Usar endpoint de debug para ver detalhes

2. **Verificar match de horário**
   - Verificar se o horário da aposta corresponde ao horário do resultado
   - Pode haver diferença de alguns minutos (tolerância configurada)

3. **Verificar match de data**
   - Verificar se a data do concurso está correta
   - Formato esperado: `YYYY-MM-DD`

---

## 🛠️ Comandos Úteis no Terminal do Coolify

### Verificar se a aplicação está rodando

```bash
curl http://localhost:3000/api/health
# ou
curl http://localhost:3000
```

### Ver logs em tempo real

No Coolify, vá em "Logs" e filtre por:
- `liquidar`
- `resultados`
- `aposta`

### Verificar variáveis de ambiente

```bash
# No terminal do Coolify
env | grep -E "(DATABASE|BICHOCERTO|AUTH)"
```

### Testar conexão com banco

```bash
# No terminal do Coolify
npx prisma studio
# ou
npx prisma db pull
```

---

## 📊 Checklist de Diagnóstico

- [ ] Verificar se há apostas pendentes (`/api/resultados/liquidar/status`)
- [ ] Verificar diagnóstico detalhado (`/api/resultados/liquidar/debug`)
- [ ] Verificar se o cron job está executando (Coolify Scheduled Tasks)
- [ ] Verificar logs do cron job (última execução)
- [ ] Verificar se há resultados disponíveis (`/api/resultados`)
- [ ] Verificar conectividade com bichocerto.com
- [ ] Verificar variáveis de ambiente
- [ ] Verificar logs da aplicação (erros recentes)

---

## 🚨 Ações Imediatas

1. **Executar diagnóstico:**
   ```bash
   curl http://localhost:3000/api/resultados/liquidar/status
   curl http://localhost:3000/api/resultados/liquidar/debug
   ```

2. **Verificar logs do cron:**
   - No Coolify, vá em "Scheduled Tasks"
   - Clique em "Liquidação Lot Bicho"
   - Veja "Recent executions" e clique em "Download Logs"

3. **Testar liquidação manualmente:**
   ```bash
   curl -X POST http://localhost:3000/api/resultados/liquidar
   ```

4. **Verificar logs da aplicação:**
   - No Coolify, vá em "Logs"
   - Procure por erros relacionados a liquidação

---

**Última atualização**: 18/01/2026
