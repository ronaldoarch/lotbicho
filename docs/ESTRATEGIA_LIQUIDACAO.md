# 🎯 Estratégia de Liquidação de Apostas

## 📋 Visão Geral

O sistema suporta **duas abordagens** para liquidação de apostas:

1. **Sistema do Monitor** (se disponível)
2. **Implementação Própria** (fallback)

## 🔄 Como Funciona

### Endpoint: `POST /api/resultados/liquidar`

O endpoint implementa uma estratégia híbrida:

```typescript
// Estratégia automática
POST /api/resultados/liquidar
{
  "usarMonitor": true  // Tenta monitor primeiro, fallback para próprio
}

// Forçar uso próprio
POST /api/resultados/liquidar
{
  "usarMonitor": false  // Usa apenas implementação própria
}
```

### Fluxo de Decisão

```
1. Recebe requisição com usarMonitor=true
   ↓
2. Tenta chamar monitor: POST {SOURCE_ROOT}/api/resultados/liquidar
   ↓
3. Monitor disponível e responde OK?
   ├─ SIM → Retorna resultado do monitor ✅
   └─ NÃO → Continua com implementação própria ⚙️
   ↓
4. Implementação própria:
   - Busca apostas pendentes
   - Busca resultados oficiais
   - Confere usando bet-rules-engine.ts
   - Atualiza saldos
   - Retorna resultado
```

## 📊 Comparação das Abordagens

### Sistema do Monitor

**Vantagens:**
- ✅ Já testado e em produção
- ✅ Pode ter regras específicas do negócio
- ✅ Centralizado (se múltiplos sistemas usam)
- ✅ Possivelmente mais rápido (otimizado)

**Desvantagens:**
- ❌ Dependência externa
- ❌ Menos controle sobre regras
- ❌ Pode não estar disponível sempre
- ❌ Dificuldade de debug

**Quando usar:**
- Monitor está disponível e funcionando
- Você confia nas regras do monitor
- Quer centralizar a lógica de liquidação

### Implementação Própria

**Vantagens:**
- ✅ Controle total sobre regras
- ✅ Não depende de serviços externos
- ✅ Fácil de debugar e modificar
- ✅ Usa nosso motor de regras (`bet-rules-engine.ts`)
- ✅ Integrado com nosso banco de dados

**Desvantagens:**
- ❌ Precisa manter e atualizar
- ❌ Pode ter bugs não descobertos
- ❌ Duplicação de lógica (se monitor também faz)

**Quando usar:**
- Monitor não está disponível
- Precisa de regras customizadas
- Quer independência do monitor
- Desenvolvimento/testes locais

## 🚀 Recomendação

### Estratégia Recomendada: **Híbrida**

```typescript
// Em produção: tentar monitor primeiro
POST /api/resultados/liquidar
{
  "usarMonitor": true
}

// Em desenvolvimento: usar próprio
POST /api/resultados/liquidar
{
  "usarMonitor": false
}
```

### Por quê?

1. **Resiliência**: Se monitor cair, sistema continua funcionando
2. **Flexibilidade**: Pode escolher qual usar conforme necessidade
3. **Desenvolvimento**: Pode testar regras sem depender do monitor
4. **Migração**: Pode migrar gradualmente do monitor para próprio

## 🔧 Configuração

### Variáveis de Ambiente

```env
# URL do monitor (usado para tentar liquidação via monitor)
BICHO_CERTO_API=https://okgkgswwkk8ows0csow0c4gg.agenciamidas.com/api/resultados
```

### Cron Job

```bash
# Executar a cada 1 minuto após horários de sorteio
# Tenta monitor primeiro, fallback automático
*/1 * * * * curl -X POST http://localhost:3000/api/resultados/liquidar \
  -H "Content-Type: application/json" \
  -d '{"usarMonitor": true}'
```

## 📝 Exemplos de Uso

### Exemplo 1: Usar Monitor (Produção)

```bash
curl -X POST http://localhost:3000/api/resultados/liquidar \
  -H "Content-Type: application/json" \
  -d '{
    "usarMonitor": true,
    "loteria": "PT Rio de Janeiro",
    "horario": "09:30"
  }'
```

**Resposta (se monitor disponível):**
```json
{
  "message": "Liquidação concluída",
  "processadas": 10,
  "liquidadas": 3,
  "premioTotal": 150.50,
  "fonte": "monitor"
}
```

**Resposta (se monitor indisponível):**
```json
{
  "message": "Liquidação concluída",
  "processadas": 10,
  "liquidadas": 3,
  "premioTotal": 150.50,
  "fonte": "proprio"
}
```

### Exemplo 2: Forçar Uso Próprio

```bash
curl -X POST http://localhost:3000/api/resultados/liquidar \
  -H "Content-Type: application/json" \
  -d '{
    "usarMonitor": false,
    "loteria": "PT Rio de Janeiro"
  }'
```

### Exemplo 3: Verificar Estatísticas

```bash
curl http://localhost:3000/api/resultados/liquidar
```

**Resposta:**
```json
{
  "pendentes": 25,
  "liquidadas": 150,
  "perdidas": 50,
  "total": 225
}
```

## 🔍 Debugging

### Verificar se Monitor Está Disponível

```bash
# Verificar status do monitor
curl http://localhost:3000/api/status

# Tentar verificar agora
curl -X POST http://localhost:3000/api/verificar-agora
```

### Logs

O sistema registra automaticamente:
- ✅ Quando usa monitor: `"✅ Liquidação processada pelo monitor"`
- ⚠️ Quando monitor não disponível: `"⚠️ Monitor não disponível, usando implementação própria"`
- ❌ Erros: `"Erro ao processar aposta X"`

## 🎯 Decisão Final

### Use Monitor se:
- ✅ Monitor está estável e confiável
- ✅ Regras do monitor atendem suas necessidades
- ✅ Quer centralizar lógica de liquidação
- ✅ Tem múltiplos sistemas usando o mesmo monitor

### Use Implementação Própria se:
- ✅ Precisa de regras customizadas
- ✅ Quer independência do monitor
- ✅ Monitor não está disponível
- ✅ Está em desenvolvimento/testes

### Use Híbrida (Recomendado) se:
- ✅ Quer resiliência (fallback automático)
- ✅ Quer flexibilidade para escolher
- ✅ Está migrando gradualmente
- ✅ Quer testar ambas as abordagens

## 📞 Próximos Passos

1. **Testar ambas abordagens** em ambiente de desenvolvimento
2. **Comparar resultados** para garantir consistência
3. **Configurar cron job** com estratégia híbrida
4. **Monitorar logs** para ver qual está sendo usado
5. **Ajustar estratégia** conforme necessidade

---

**Última atualização:** 2026-01-15
