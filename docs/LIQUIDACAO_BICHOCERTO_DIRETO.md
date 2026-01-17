# 💰 Liquidação com Endpoints Diretos do bichocerto.com

## 📋 Resumo

A liquidação agora usa **endpoints diretos do bichocerto.com** para buscar resultados, garantindo correspondência exata por **horário** entre apostas e resultados.

---

## 🎯 Como Funciona

### Fluxo de Liquidação

1. **Buscar Apostas Pendentes**
   - Filtra apostas com `status: 'pendente'`
   - Opcionalmente filtra por loteria, data, horário

2. **Agrupar por Loteria/Data**
   - Agrupa apostas por combinação `loteria|data`
   - Exemplo: `ln|2026-01-17`, `sp|2026-01-17`

3. **Buscar Resultados por Loteria**
   - Para cada combinação `loteria|data`, busca resultados do bichocerto.com
   - Usa código da loteria (`ln`, `sp`, `ba`, etc) e data (`YYYY-MM-DD`)
   - Retorna resultados **organizados por horário**

4. **Correspondência por Horário**
   - Para cada aposta, busca resultados do **mesmo horário**
   - Valida que horário do resultado corresponde ao horário da aposta
   - Só liquida quando há correspondência exata

5. **Liquidação**
   - Verifica se resultado está completo (7 posições)
   - Calcula prêmios
   - Atualiza saldo do usuário
   - Marca aposta como liquidada

---

## 🔍 Correspondência por Horário

### Por que é importante?

Cada extração tem múltiplos horários no mesmo dia. Por exemplo:
- **Nacional**: 02h, 08h, 10h, 12h, 15h, 17h, 21h, 23h
- **PT-SP**: 08h20, 10h40, 12h20, 13h40, 15h30, 17h40, 19h20, 20h40

Uma aposta feita para **Nacional 23h** só pode ser liquidada com o resultado de **23h**, não com outros horários.

### Como funciona a correspondência?

1. **Aposta tem horário**: `horario: "23:00"`
2. **Resultado tem horário**: `horario: "23:00"`
3. **Match exato**: `"23:00" === "23:00"` ✅
4. **Match por início**: `"23:00:00".startsWith("23:00")` ✅
5. **Diferença pequena**: `< 15 minutos` ✅ (tolerância)

### Validações

```typescript
// 1. Verificar se horário corresponde
if (horarioAposta && horarioSelecionado) {
  const matchExato = horarioAposta === horarioSelecionado
  const matchPorInicio = horarioSelecionado.startsWith(horarioAposta)
  
  // 2. Verificar diferença em minutos
  const diferencaMinutos = Math.abs(minutosAposta - minutosSelecionado)
  
  if (diferencaMinutos > 15) {
    // Não é o mesmo horário - não liquidar
    continue
  }
}
```

---

## 📊 Estrutura de Dados

### Resultados Organizados por Horário

```typescript
{
  resultadosPorHorario: {
    "23:00": [
      { position: "1º", milhar: "2047", grupo: "7", ... },
      { position: "2º", milhar: "2881", grupo: "8", ... },
      ...
    ],
    "21:00": [
      { position: "1º", milhar: "1234", grupo: "1", ... },
      ...
    ]
  }
}
```

### Aposta Pendente

```typescript
{
  id: 123,
  loteria: "1", // ID da extração ou nome
  horario: "23:00",
  dataConcurso: "2026-01-17",
  modalidade: "MILHAR",
  aposta: "2047",
  status: "pendente"
}
```

### Match

```typescript
// 1. Mapear loteria da aposta para código
const codigoLoteria = mapearCodigoLoteria(aposta.loteria) // "ln"

// 2. Buscar resultados dessa loteria/data
const resultados = await buscarResultadosParaLiquidacao("ln", "2026-01-17")

// 3. Filtrar por horário
const resultadosDoHorario = resultados.resultadosPorHorario["23:00"]

// 4. Liquidar com esses resultados
```

---

## 🔧 Funções Principais

### `buscarResultadosParaLiquidacao()`

Busca resultados de uma loteria específica para uma data, retornando organizados por horário.

```typescript
const resultado = await buscarResultadosParaLiquidacao(
  "ln",              // código loteria
  "2026-01-17",      // data
  phpsessid          // opcional: para histórico
)

// Retorna:
{
  erro: null,
  resultadosPorHorario: {
    "23:00": [...],
    "21:00": [...],
    ...
  }
}
```

### `mapearCodigoLoteria()`

Converte ID de extração ou nome para código do bichocerto.com.

```typescript
mapearCodigoLoteria("1")        // "ln" (Nacional)
mapearCodigoLoteria("NACIONAL")  // "ln"
mapearCodigoLoteria("PT SP")     // "sp"
```

---

## 📝 Exemplo Completo

### Cenário: Liquidar aposta Nacional 23h

```typescript
// 1. Aposta pendente
const aposta = {
  id: 123,
  loteria: "1", // ID da Nacional
  horario: "23:00",
  dataConcurso: "2026-01-17",
  modalidade: "MILHAR",
  aposta: "2047"
}

// 2. Mapear loteria
const codigoLoteria = mapearCodigoLoteria(aposta.loteria) // "ln"

// 3. Buscar resultados
const dataStr = aposta.dataConcurso.toISOString().split('T')[0] // "2026-01-17"
const resultado = await buscarResultadosParaLiquidacao(codigoLoteria, dataStr)

// 4. Filtrar por horário
const resultadosDoHorario = resultado.resultadosPorHorario["23:00"]

// 5. Verificar se resultado está completo
if (resultadosDoHorario.length < 7) {
  console.log("Resultado incompleto - aguardando")
  return
}

// 6. Verificar correspondência de horário
if (aposta.horario !== "23:00") {
  console.log("Horário não corresponde")
  return
}

// 7. Liquidar
const milhares = resultadosDoHorario.map(r => parseInt(r.milhar))
const grupos = milhares.map(m => milharParaGrupo(m))

// Verificar se aposta ganhou
const resultadoOficial = { prizes: milhares, groups: grupos }
const conferencia = conferirPalpite(aposta.modalidade, aposta.aposta, resultadoOficial)

if (conferencia.acertou) {
  // Calcular prêmio e atualizar saldo
  const premio = calcularValorPorPalpite(...)
  // Atualizar aposta e saldo
}
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

```bash
# Ativar busca direta do bichocerto.com (default: true)
USAR_BICHOCERTO_DIRETO=true

# Opcional: PHPSESSID para acesso histórico
BICHOCERTO_PHPSESSID=seu_phpsessid_aqui
```

### Fallback

Se `USAR_BICHOCERTO_DIRETO=false`, usa API interna como fallback:
- Busca via `/api/resultados` (que pode usar bichocerto.com ou API antiga)
- Mantém compatibilidade com sistema antigo

---

## 🐛 Troubleshooting

### Problema: Aposta não liquida mesmo com resultado disponível

**Verificar:**
1. Se horário da aposta corresponde ao horário do resultado
2. Se loteria está mapeada corretamente
3. Se resultado está completo (7 posições)
4. Se já passou horário de apuração

**Logs para debug:**
```
🔍 Buscando resultados: ln - 2026-01-17 (1 aposta(s))
   ✅ ln 2026-01-17: 8 horário(s), 56 resultado(s)
🕐 Horários para match: [23:00]
📋 Horários disponíveis nos resultados:
   - "23:00": 7 resultado(s)
✅ Match exato encontrado: "23:00"
```

### Problema: Resultado não encontrado

**Verificar:**
1. Se data está dentro do intervalo permitido (últimos 10 dias sem PHPSESSID)
2. Se código da loteria está correto
3. Se PHPSESSID está válido (se usando histórico)

**Solução:**
- Verificar logs de busca
- Testar endpoint diretamente
- Verificar mapeamento de loteria

---

## 📊 Performance

### Otimizações

1. **Agrupamento**: Busca resultados por `loteria|data` ao invés de buscar tudo
2. **Paralelismo**: Busca múltiplas loterias em paralelo
3. **Cache**: Resultados organizados por horário facilitam busca

### Exemplo de Performance

```
📊 Buscando resultados para 3 combinação(ões) de loteria/data
🔍 Buscando resultados: ln - 2026-01-17 (5 aposta(s))
🔍 Buscando resultados: sp - 2026-01-17 (3 aposta(s))
🔍 Buscando resultados: ba - 2026-01-17 (2 aposta(s))
   ✅ ln 2026-01-17: 8 horário(s), 56 resultado(s)
   ✅ sp 2026-01-17: 8 horário(s), 56 resultado(s)
   ✅ ba 2026-01-17: 5 horário(s), 35 resultado(s)
📊 Total de resultados obtidos para liquidação: 147
```

---

## ✅ Vantagens

1. **Correspondência Exata**: Garante que aposta é liquidada com resultado do horário correto
2. **Performance**: Busca apenas loterias necessárias
3. **Confiabilidade**: Usa fonte oficial (bichocerto.com)
4. **Organização**: Resultados já vêm organizados por horário
5. **Validação**: Múltiplas validações antes de liquidar

---

## 🔗 Referências

- Parser: `lib/bichocerto-parser.ts`
- Liquidação: `app/api/resultados/liquidar/route.ts`
- Migração: `docs/MIGRACAO_BICHOCERTO_DIRETO.md`
- Endpoints: `docs/endpoints-loterias.md`
