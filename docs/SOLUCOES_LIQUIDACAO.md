# 🔧 Soluções Implementadas: Sistema de Liquidação de Apostas

**Última atualização:** 15 de Janeiro de 2026

Este documento detalha **como resolvemos os problemas críticos de liquidação** para que você possa implementar soluções similares em outros sistemas.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Problema 1: Mistura de Prêmios de Diferentes Horários](#problema-1-mistura-de-prêmios-de-diferentes-horários)
3. [Problema 2: Match de Nomes de Extrações](#problema-2-match-de-nomes-de-extrações)
4. [Problema 3: Normalização de Horários](#problema-3-normalização-de-horários)
5. [Problema 4: Filtro de Datas](#problema-4-filtro-de-datas)
6. [Problema 5: Agrupamento de Resultados](#problema-5-agrupamento-de-resultados)
7. [Problema 6: Verificação de Horário de Apuração](#problema-6-verificação-de-horário-de-apuração)
8. [Problema 7: Inferência de UF/Estado](#problema-7-inferência-de-ufestado)
9. [Checklist de Implementação](#checklist-de-implementação)

---

## 🎯 Visão Geral

O sistema de liquidação precisa:
1. **Buscar resultados** de uma API externa
2. **Filtrar resultados** por loteria, horário e data
3. **Agrupar resultados** por horário de sorteio
4. **Selecionar o horário correto** para cada aposta
5. **Conferir palpites** contra os resultados
6. **Calcular prêmios** e atualizar saldos

**Principais desafios resolvidos:**
- Nomes de loterias variam entre sistema interno e API externa
- Horários de apuração podem diferir dos horários internos
- Resultados podem vir em formatos diferentes (datas, horários)
- Múltiplos horários podem existir para a mesma loteria
- Resultados de loterias diferentes podem se misturar

---

## 🔴 Problema 1: Mistura de Prêmios de Diferentes Horários

### Sintoma
Sistema pegava o 1º prêmio de todos os resultados e depois o 2º prêmio de outro horário, misturando resultados de diferentes sorteios.

### Causa Raiz
O código estava ordenando todos os resultados e pegando os primeiros N prêmios, sem agrupar por horário de sorteio primeiro.

### Solução Implementada

**Passo 1: Agrupar resultados por horário ANTES de selecionar prêmios**

```typescript
// ❌ ERRADO (antes)
const resultadosOrdenados = resultadosFiltrados
  .sort((a, b) => (a.position || 0) - (b.position || 0))
const primeiroPremio = resultadosOrdenados[0]
const segundoPremio = resultadosOrdenados[1]
// Problema: mistura resultados de diferentes horários

// ✅ CORRETO (agora)
// 1. Agrupar por horário primeiro
const resultadosPorHorario = new Map<string, ResultadoItem[]>()

resultadosFiltrados.forEach((r) => {
  if (r.position && r.milhar) {
    const horarioKey = r.horario || r.drawTime || 'sem-horario'
    if (!resultadosPorHorario.has(horarioKey)) {
      resultadosPorHorario.set(horarioKey, [])
    }
    resultadosPorHorario.get(horarioKey)!.push(r)
  }
})

// 2. Selecionar o horário correto para a aposta
let horarioSelecionado: string | null = null
let resultadosDoHorario: ResultadoItem[] = []

// 3. Fazer match com horário da aposta
const horarioAposta = aposta.horario?.trim()
if (horarioAposta && horarioAposta !== 'null') {
  for (const [horarioKey, resultados] of resultadosPorHorario.entries()) {
    if (horarioKey.toLowerCase().includes(horarioAposta.toLowerCase()) ||
        horarioAposta.toLowerCase().includes(horarioKey.toLowerCase())) {
      horarioSelecionado = horarioKey
      resultadosDoHorario = resultados
      break
    }
  }
}

// 4. SÓ DEPOIS ordenar e pegar prêmios do horário selecionado
resultadosDoHorario.sort((a, b) => (a.position || 0) - (b.position || 0))
const primeiroPremio = resultadosDoHorario[0]
const segundoPremio = resultadosDoHorario[1]
```

**Passo 2: Seleção inteligente de horário quando não há match exato**

```typescript
// Se não encontrou match exato, buscar o horário mais próximo
if (resultadosDoHorario.length === 0) {
  // Buscar extração para obter horários possíveis
  const extracao = extracoes.find(e => e.id === parseInt(aposta.loteria))
  
  if (extracao) {
    // Coletar todos os horários possíveis da extração
    const horariosPossiveis: string[] = []
    if (extracao.time) horariosPossiveis.push(extracao.time)
    if (extracao.closeTime) horariosPossiveis.push(extracao.closeTime)
    
    // Tentar match com cada horário possível
    for (const horarioPossivel of horariosPossiveis) {
      for (const [horarioKey, resultados] of resultadosPorHorario.entries()) {
        if (horarioKey.includes(horarioPossivel) || horarioPossivel.includes(horarioKey)) {
          horarioSelecionado = horarioKey
          resultadosDoHorario = resultados
          break
        }
      }
      if (resultadosDoHorario.length > 0) break
    }
  }
  
  // Fallback: usar o horário com mais resultados (geralmente é o mais recente)
  if (resultadosDoHorario.length === 0) {
    let maxResultados = 0
    for (const [horarioKey, resultados] of resultadosPorHorario.entries()) {
      if (resultados.length > maxResultados) {
        maxResultados = resultados.length
        horarioSelecionado = horarioKey
        resultadosDoHorario = resultados
      }
    }
  }
}
```

### Arquivos Modificados
- `app/api/resultados/liquidar/route.ts` (linhas 854-1061)

### Lições Aprendidas
1. **Sempre agrupar por dimensão crítica antes de processar** (horário, data, loteria)
2. **Selecionar o grupo correto antes de extrair dados** (não processar todos os grupos juntos)
3. **Implementar fallbacks inteligentes** quando match exato não é encontrado

---

## 🔴 Problema 2: Match de Nomes de Extrações

### Sintoma
Extrações não encontravam resultados porque a API externa retorna nomes diferentes:
- Sistema: "PT RIO" → API: "PT Rio de Janeiro"
- Sistema: "PT SP" → API: "PT-SP/Bandeirantes"
- Sistema: "LOOK" → API: "LOOK Goiás"

### Causa Raiz
Match exato ou muito restritivo entre nomes cadastrados e nomes da API externa.

### Solução Implementada

**Passo 1: Criar lista de nomes possíveis para cada extração**

```typescript
// Buscar extração por ID
const extracao = extracoes.find(e => e.id === parseInt(aposta.loteria))

if (extracao) {
  const nomeBase = extracao.name.toLowerCase().trim()
  const nomesPossiveis: string[] = [
    nomeBase,
    extracao.name, // Nome original
    nomeBase.replace(/\s+/g, ' '), // Normalizar espaços
    nomeBase.replace(/\s+/g, '-'), // Com hífen
    nomeBase.replace(/\s+/g, '/'), // Com barra
  ]
  
  // Adicionar variações específicas baseadas em nomes REAIS da API
  if (nomeBase.includes('pt rio')) {
    nomesPossiveis.push(
      'pt rio de janeiro',  // Formato exato da API
      'pt-rio',
      'pt-rio de janeiro',
      'mpt-rio',
      'mpt rio',
      'maluquinha rj',
      'maluquinha rio de janeiro',
      'maluquinha'
    )
  }
  
  if (nomeBase.includes('pt sp')) {
    nomesPossiveis.push(
      'pt-sp/bandeirantes',  // Formato exato da API
      'pt-sp bandeirantes',
      'pt sp bandeirantes',
      'bandeirantes',
      'band',
      'pt sp (band)',
      'pt-sp'
    )
  }
  
  if (nomeBase.includes('look')) {
    nomesPossiveis.push(
      'look goiás',
      'look goias',
      'look-go',
      'look'
    )
  }
  
  if (nomeBase.includes('lotep')) {
    nomesPossiveis.push(
      'pt paraiba/lotep',  // Formato exato da API
      'pt paraiba',
      'pt paraíba',
      'pt-pb',
      'lotep'
    )
  }
  
  if (nomeBase.includes('lotece')) {
    nomesPossiveis.push(
      'lotece',
      'pt ceara',
      'pt ceará'
    )
  }
}
```

**Passo 2: Match flexível com múltiplas estratégias**

```typescript
resultadosFiltrados = resultadosFiltrados.filter((r) => {
  const rLoteria = (r.loteria?.toLowerCase() || '').trim()
  
  // Normalizar ambos os lados
  const normalizar = (str: string) => 
    str.toLowerCase().trim().replace(/\s+/g, ' ').replace(/\//g, '/')
  const rLoteriaNormalizada = normalizar(rLoteria)
  
  const match = nomesPossiveis.some(nome => {
    const nomeLower = normalizar(nome)
    
    // 1. Match exato
    if (rLoteriaNormalizada === nomeLower) return true
    
    // 2. Match por inclusão (um contém o outro)
    if (rLoteriaNormalizada.includes(nomeLower) || 
        nomeLower.includes(rLoteriaNormalizada)) return true
    
    // 3. Match por palavras-chave principais
    const palavrasNome = nomeLower.split(/\s+|-|\//).filter(p => p.length > 2)
    const palavrasLoteria = rLoteriaNormalizada.split(/\s+|-|\//).filter(p => p.length > 2)
    
    // Se pelo menos 2 palavras-chave principais coincidem
    if (palavrasNome.length >= 2 && palavrasLoteria.length >= 2) {
      const palavrasComuns = palavrasNome.filter(p => 
        palavrasLoteria.some(pl => pl.includes(p) || p.includes(pl))
      )
      if (palavrasComuns.length >= 2) return true
    }
    
    // 4. Match por palavra-chave significativa única
    const palavrasSignificativas = [
      'bandeirantes', 'lotep', 'lotece', 'look', 'nacional', 'federal',
      'maluquinha', 'maluca', 'rio', 'janeiro', 'bahia', 'paraiba',
      'paraíba', 'ceara', 'ceará', 'goias', 'goiás', 'sp', 'são paulo'
    ]
    
    const temPalavraSignificativa = palavrasSignificativas.some(palavra => {
      return nomeLower.includes(palavra) && rLoteriaNormalizada.includes(palavra)
    })
    if (temPalavraSignificativa) return true
    
    return false
  })
  
  return match
})
```

**Passo 3: Fallback para match mais flexível se não encontrar**

```typescript
// Se não encontrou resultados, tentar match mais flexível
if (resultadosFiltrados.length === 0 && antes > 0) {
  const palavrasChave = loteriaNome.toLowerCase()
    .split(/\s+|-|\//)
    .filter(p => p.length > 2)
  
  if (palavrasChave.length > 0) {
    resultadosFiltrados = resultados.filter((r) => {
      const rLoteria = (r.loteria?.toLowerCase() || '').trim()
      return palavrasChave.some(palavra => rLoteria.includes(palavra))
    })
  }
  
  // Se ainda não encontrou, tentar sem filtro de loteria
  if (resultadosFiltrados.length === 0) {
    resultadosFiltrados = resultados // Usar todos os resultados
  }
}
```

### Arquivos Modificados
- `app/api/resultados/liquidar/route.ts` (linhas 448-676)

### Lições Aprendidas
1. **Criar mapeamento de variações conhecidas** baseado em análise real da API
2. **Implementar múltiplas estratégias de match** (exato, inclusão, palavras-chave)
3. **Sempre ter fallback** para casos não previstos
4. **Normalizar strings** antes de comparar (lowercase, espaços, caracteres especiais)

---

## 🔴 Problema 3: Normalização de Horários

### Sintoma
Resultados vinham com horários diferentes dos horários internos:
- Resultado: "20:40" → Sistema interno: "20:15"
- Resultado: "10:40" → Sistema interno: "10:00"

### Causa Raiz
A API externa retorna horários de apuração reais, mas o sistema usa horários internos de fechamento.

### Solução Implementada

**Passo 1: Normalizar horários na API de resultados (entrada)**

```typescript
// app/api/resultados/route.ts

/**
 * Normaliza o horário do resultado para o horário correto de fechamento da extração
 */
function normalizarHorarioResultado(loteriaNome: string, horarioResultado: string): string {
  if (!loteriaNome || !horarioResultado) return horarioResultado
  
  const nomeNormalizado = loteriaNome.toUpperCase().trim()
  const horarioNormalizado = horarioResultado.replace(/[h:]/g, ':')
    .replace(/^(\d{1,2}):(\d{2})$/, (_, h, m) => {
      return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
    })
  
  const [horaResultado, minutoResultado] = horarioNormalizado.split(':').map(Number)
  if (isNaN(horaResultado) || isNaN(minutoResultado)) return horarioResultado
  
  const minutosResultado = horaResultado * 60 + minutoResultado
  
  // Buscar todas as extrações com esse nome
  const extracoesComMesmoNome = extracoes.filter(e => 
    e.name.toUpperCase() === nomeNormalizado && e.active
  )
  
  if (extracoesComMesmoNome.length === 0) {
    return horarioResultado
  }
  
  let melhorMatch: { extracao: typeof extracoes[0], diferenca: number } | null = null
  
  // Para cada extração, verificar se o horário do resultado corresponde ao horário real
  for (const extracao of extracoesComMesmoNome) {
    const horarioReal = getHorarioRealApuracao(extracao.name, extracao.time)
    
    if (horarioReal) {
      // Verificar match exato com closeTimeReal
      const [horaFim, minutoFim] = horarioReal.closeTimeReal.split(':').map(Number)
      const minutosFim = horaFim * 60 + minutoFim
      
      if (minutosResultado === minutosFim) {
        return extracao.time // Retorna horário interno normalizado
      }
      
      // Verificar se está dentro do intervalo de apuração
      const [horaInicio, minutoInicio] = horarioReal.startTimeReal.split(':').map(Number)
      const minutosInicio = horaInicio * 60 + minutoInicio
      
      if (minutosResultado >= minutosInicio && minutosResultado <= minutosFim) {
        const diferenca = Math.abs(minutosResultado - minutosFim)
        if (!melhorMatch || diferenca < melhorMatch.diferenca) {
          melhorMatch = { extracao, diferenca }
        }
      }
    }
  }
  
  // Se encontrou match dentro do intervalo, retornar o melhor
  if (melhorMatch) {
    return melhorMatch.extracao.time
  }
  
  // Fallback: match aproximado com horário interno (dentro de 30 minutos)
  for (const extracao of extracoesComMesmoNome) {
    const [horaExtracao, minutoExtracao] = extracao.time.split(':').map(Number)
    if (isNaN(horaExtracao) || isNaN(minutoExtracao)) continue
    
    const minutosExtracao = horaExtracao * 60 + minutoExtracao
    const diferenca = Math.abs(minutosResultado - minutosExtracao)
    
    if (diferenca <= 30) {
      return extracao.time
    }
  }
  
  return horarioResultado // Retorna original se não encontrar
}

// Usar na transformação dos resultados
const resultadoNormalizado: ResultadoItem = {
  ...resultadoOriginal,
  horario: normalizarHorarioResultado(resultadoOriginal.loteria, resultadoOriginal.horario),
  drawTime: normalizarHorarioResultado(resultadoOriginal.loteria, resultadoOriginal.horario),
}
```

**Passo 2: Simplificar lógica de liquidação (agora que horários já vêm normalizados)**

```typescript
// app/api/resultados/liquidar/route.ts

// IMPORTANTE: Agora que os resultados já vêm normalizados com o horário correto,
// podemos fazer match direto com o horário da aposta
const horarioAposta = aposta.horario?.trim()

if (horarioAposta && horarioAposta !== 'null') {
  for (const [horarioKey, resultados] of resultadosPorHorario.entries()) {
    const horarioKeyLower = horarioKey.toLowerCase().trim()
    const horarioApostaLower = horarioAposta.toLowerCase().trim()
    
    // Match exato
    if (horarioKeyLower === horarioApostaLower) {
      horarioSelecionado = horarioKey
      resultadosDoHorario = resultados
      break
    }
    
    // Match por início (ex: "20:15" matcha "20:15:00")
    if (horarioKeyLower.startsWith(horarioApostaLower) || 
        horarioApostaLower.startsWith(horarioKeyLower)) {
      horarioSelecionado = horarioKey
      resultadosDoHorario = resultados
      break
    }
  }
}
```

### Arquivos Modificados
- `app/api/resultados/route.ts` (função `normalizarHorarioResultado`)
- `app/api/resultados/liquidar/route.ts` (simplificação do match de horários)

### Lições Aprendidas
1. **Normalizar dados na entrada** (API de resultados) em vez de normalizar em cada uso
2. **Usar mapeamento de horários reais** para fazer a conversão correta
3. **Simplificar lógica downstream** após normalização centralizada

---

## 🔴 Problema 4: Filtro de Datas

### Sintoma
Apostas não encontravam resultados porque datas vinham em formatos diferentes:
- Aposta: "2026-01-14" (ISO)
- Resultado: "14/01/2026" (brasileiro)

### Causa Raiz
Comparação direta entre formatos diferentes sem normalização.

### Solução Implementada

```typescript
if (aposta.dataConcurso && resultadosFiltrados.length > 0) {
  const dataAposta = aposta.dataConcurso.toISOString().split('T')[0]
  // Normalizar data da aposta para formato DD/MM/YYYY também
  const [anoAposta, mesAposta, diaAposta] = dataAposta.split('-')
  const dataApostaFormatada = `${diaAposta}/${mesAposta}/${anoAposta}`
  
  resultadosFiltrados = resultadosFiltrados.filter((r) => {
    if (!r.date && !r.dataExtracao) return false
    
    const dataResultado = r.date || r.dataExtracao || ''
    
    // 1. Comparar formato ISO: 2026-01-14
    const dataResultadoISO = dataResultado.split('T')[0]
    if (dataResultadoISO === dataAposta) return true
    
    // 2. Comparar formato brasileiro: 14/01/2026
    if (dataResultado === dataApostaFormatada) return true
    
    // 3. Comparação parcial (apenas dia/mês/ano)
    const matchBR = dataResultado.match(/(\d{2})\/(\d{2})\/(\d{4})/)
    if (matchBR) {
      const [_, dia, mes, ano] = matchBR
      const dataResultadoISO = `${ano}-${mes}-${dia}`
      if (dataResultadoISO === dataAposta) return true
    }
    
    // 4. Comparação reversa (ano-mês-dia vs dia/mês/ano)
    const matchISO = dataResultado.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (matchISO) {
      const [_, ano, mes, dia] = matchISO
      const dataResultadoFormatada = `${dia}/${mes}/${ano}`
      if (dataResultadoFormatada === dataApostaFormatada) return true
    }
    
    return false
  })
}
```

### Arquivos Modificados
- `app/api/resultados/liquidar/route.ts` (linhas 768-814)

### Lições Aprendidas
1. **Sempre normalizar formatos antes de comparar**
2. **Suportar múltiplos formatos** (ISO, brasileiro, parcial)
3. **Usar regex para extrair componentes** quando necessário

---

## 🔴 Problema 5: Agrupamento de Resultados

### Sintoma
Resultados de loterias diferentes (ex: LOTEP e LOTECE) eram agrupados juntos porque tinham o mesmo horário.

### Causa Raiz
Chave de agrupamento usava apenas horário, sem incluir identificador da loteria.

### Solução Implementada

```typescript
// lib/resultados-helpers.ts

export function groupResultsByDrawTime(
  items: ResultadoItem[]
): Map<string, ResultadoItem[]> {
  const groups = new Map<string, ResultadoItem[]>()
  
  for (const item of items) {
    // IMPORTANTE: Incluir nome da loteria na chave para evitar misturar tabelas diferentes
    // Exemplo: LOTEP (PB) e LOTECE (CE) devem ser agrupados separadamente mesmo com mesmo horário
    const loteriaKey = item.loteria || ''
    const drawTimeKey = item.drawTime?.trim() || 'Resultado'
    const key = `${loteriaKey}|${drawTimeKey}` // Chave composta
    
    const list = groups.get(key) ?? []
    list.push(item)
    groups.set(key, list)
  }
  
  return groups
}
```

### Arquivos Modificados
- `lib/resultados-helpers.ts` (função `groupResultsByDrawTime`)

### Lições Aprendidas
1. **Usar chaves compostas** quando múltiplas dimensões são importantes
2. **Incluir identificador único** (loteria) na chave de agrupamento

---

## 🔴 Problema 6: Verificação de Horário de Apuração

### Sintoma
Apostas sendo liquidadas antes do horário correto de apuração.

### Causa Raiz
Sistema não verificava se já havia passado o horário de apuração antes de liquidar.

### Solução Implementada

```typescript
function jaPassouHorarioApuracao(
  extracaoId: number | string | null,
  dataConcurso: Date | null,
  horarioAposta: string | null = null,
  loteriaNome: string | null = null
): boolean {
  if (!extracaoId || !dataConcurso) {
    return true // Permite liquidar se não tem dados suficientes
  }
  
  // Buscar extração
  const extracao = extracoes.find(e => e.id === Number(extracaoId))
  if (!extracao) return true
  
  // Buscar horário REAL de apuração
  const nomeExtracao = loteriaNome || extracao.name || ''
  const horarioExtracao = horarioAposta || extracao.time || ''
  
  const horarioReal = getHorarioRealApuracao(nomeExtracao, horarioExtracao)
  
  if (!horarioReal) return true
  
  // Verificar se o dia da semana tem sorteio
  const diaSemana = dataConcurso.getDay()
  if (!temSorteioNoDia(horarioReal, diaSemana)) {
    return false // Não pode liquidar se não tem sorteio neste dia
  }
  
  // Obter horário atual em Brasília
  const agoraUTC = new Date()
  const agoraBrasiliaStr = agoraUTC.toLocaleString('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  // Converter para Date
  const [dataPart, horaPart] = agoraBrasiliaStr.split(', ')
  const [mes, dia, ano] = dataPart.split('/')
  const [horaAtual, minutoAtual] = horaPart.split(':')
  const agora = new Date(
    parseInt(ano), parseInt(mes) - 1, parseInt(dia),
    parseInt(horaAtual), parseInt(minutoAtual), 0
  )
  
  // Criar data/hora de apuração inicial
  const [horas, minutos] = horarioReal.startTimeReal.split(':').map(Number)
  const dataApuracaoInicial = new Date(
    dataConcurso.getFullYear(),
    dataConcurso.getMonth(),
    dataConcurso.getDate(),
    horas, minutos, 0
  )
  
  // Comparar datas (sem hora)
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
  const dataConcursoSemHora = new Date(
    dataConcurso.getFullYear(),
    dataConcurso.getMonth(),
    dataConcurso.getDate()
  )
  
  if (dataConcursoSemHora.getTime() === hoje.getTime()) {
    // Mesmo dia: verificar se já passou o horário inicial
    return agora >= dataApuracaoInicial
  } else if (dataConcursoSemHora.getTime() < hoje.getTime()) {
    // Dia passado: já pode liquidar
    return true
  } else {
    // Dia futuro: não pode liquidar ainda
    return false
  }
}

// Usar antes de liquidar
if (!jaPassouHorarioApuracao(aposta.loteria, aposta.dataConcurso, aposta.horario)) {
  console.log(`⏸️  Pulando aposta ${aposta.id} - aguardando apuração`)
  continue // Pular esta aposta
}
```

### Arquivos Modificados
- `app/api/resultados/liquidar/route.ts` (função `jaPassouHorarioApuracao`)

### Lições Aprendidas
1. **Sempre verificar horário de apuração** antes de liquidar
2. **Usar timezone correto** (Brasília) para comparações
3. **Verificar dia da semana** para loterias com dias específicos
4. **Usar horário inicial** (startTimeReal) para permitir liquidação assim que resultado pode estar disponível

---

## 🔴 Problema 7: Inferência de UF/Estado

### Sintoma
Resultados de Paraíba (LOTEP) apareciam junto com resultados de Ceará (LOTECE).

### Causa Raiz
Inferência de UF não priorizava palavras-chave específicas e mapeamentos conhecidos.

### Solução Implementada

```typescript
// app/api/resultados/route.ts

const EXTRACAO_UF_MAP: Record<string, string> = {
  'lotep': 'PB',
  'lotece': 'CE',
  'pt paraiba/lotep': 'PB',
  'pt paraiba': 'PB',
  'pt ceara': 'CE',
  'pt ceará': 'CE',
}

function inferUfFromName(name?: string | null) {
  if (!name) return undefined
  
  const key = normalizeText(name)
  
  // IMPORTANTE: Verificar EXTRACAO_UF_MAP primeiro para evitar confusão
  if (EXTRACAO_UF_MAP[key]) {
    return EXTRACAO_UF_MAP[key]
  }
  
  // Verificar palavras-chave específicas
  if (key.includes('lotep') || key.includes('paraiba') || key.includes('paraíba')) {
    return 'PB'
  }
  if (key.includes('lotece') || key.includes('ceara') || key.includes('ceará')) {
    return 'CE'
  }
  
  // Fallback para mapeamentos gerais
  return (
    UF_ALIASES[key] ||
    LOTERIA_UF_MAP[key] ||
    (key.length === 2 ? key.toUpperCase() : undefined)
  )
}
```

### Arquivos Modificados
- `app/api/resultados/route.ts` (função `inferUfFromName`)

### Lições Aprendidas
1. **Priorizar mapeamentos específicos** antes de mapeamentos gerais
2. **Usar palavras-chave específicas** para casos conhecidos
3. **Criar mapeamento explícito** para evitar ambiguidades

---

## ✅ Checklist de Implementação

Para implementar um sistema de liquidação robusto em outro sistema:

### 1. Estrutura de Dados
- [ ] Definir estrutura de resultados (loteria, horário, data, posição, milhar)
- [ ] Definir estrutura de apostas (loteria, horário, data, palpites)
- [ ] Criar mapeamento de nomes de loterias (interno → API externa)

### 2. Normalização de Dados
- [ ] Normalizar horários na entrada (API de resultados)
- [ ] Normalizar formatos de data (ISO ↔ brasileiro)
- [ ] Normalizar nomes de loterias (lowercase, espaços, caracteres especiais)

### 3. Filtragem de Resultados
- [ ] Filtrar por loteria (com match flexível)
- [ ] Filtrar por horário (usando horários normalizados)
- [ ] Filtrar por data (suportando múltiplos formatos)

### 4. Agrupamento e Seleção
- [ ] Agrupar resultados por loteria + horário + data
- [ ] Selecionar grupo correto para cada aposta
- [ ] Implementar fallbacks quando match exato não é encontrado

### 5. Validações
- [ ] Verificar horário de apuração antes de liquidar
- [ ] Verificar dia da semana para loterias específicas
- [ ] Validar formato de dados antes de processar

### 6. Logs e Debug
- [ ] Logar cada etapa do processo (filtros, agrupamentos, seleções)
- [ ] Logar exemplos quando não encontra resultados
- [ ] Logar horários e datas usadas para comparação

### 7. Tratamento de Erros
- [ ] Fallback quando extração não é encontrada
- [ ] Fallback quando resultado não é encontrado
- [ ] Timeout para chamadas de API externa

---

## 📚 Referências

- **Código de Liquidação**: `/app/api/resultados/liquidar/route.ts`
- **API de Resultados**: `/app/api/resultados/route.ts`
- **Helpers de Resultados**: `/lib/resultados-helpers.ts`
- **Horários Reais**: `/data/horarios-reais-apuracao.ts`
- **Extrações**: `/data/extracoes.ts`
- **Troubleshooting**: `/docs/TROUBLESHOOTING_LIQUIDACAO.md`

---

**Última atualização:** 15 de Janeiro de 2026
