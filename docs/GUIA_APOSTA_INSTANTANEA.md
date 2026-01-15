# ⚡ Guia Completo: Sistema de Apostas Instantâneas

**Última atualização:** 14 de Janeiro de 2026

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Como Funciona](#como-funciona)
3. [Fluxo Completo](#fluxo-completo)
4. [Geração de Resultados](#geração-de-resultados)
5. [Conferência e Cálculo de Prêmios](#conferência-e-cálculo-de-prêmios)
6. [Status da Aposta](#status-da-aposta)
7. [Diferenças entre Aposta Normal e Instantânea](#diferenças-entre-aposta-normal-e-instantânea)
8. [Exemplos Práticos](#exemplos-práticos)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

As **Apostas Instantâneas** são apostas que são liquidadas **imediatamente** após serem criadas, sem precisar aguardar resultados oficiais de extrações. O sistema gera um resultado aleatório no momento da aposta e confere o palpite contra esse resultado.

### Características Principais

- ✅ **Liquidação imediata**: Resultado conhecido na hora
- ✅ **Sem espera**: Não depende de extrações oficiais
- ✅ **Disponível 24h**: Pode apostar a qualquer momento
- ✅ **Mesmas modalidades**: Todas as modalidades disponíveis
- ✅ **Mesmas regras**: Mesma lógica de premiação

---

## 🔄 Como Funciona

### Identificação de Aposta Instantânea

Uma aposta é considerada instantânea quando:

```typescript
const isInstant = detalhes?.betData?.instant === true
```

O campo `instant: true` vem do frontend quando o usuário seleciona a loteria **"INSTANTANEA"**.

### Processo de Liquidação

```
┌─────────────────┐
│ Usuário cria    │
│ aposta          │
│ instantânea     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ 1. Validar saldo e          │
│    debitar valor            │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 2. Gerar resultado          │
│    instantâneo aleatório     │
│    (7 milhares)              │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 3. Conferir cada palpite    │
│    contra resultado         │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 4. Calcular prêmios         │
│    totais                    │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 5. Creditar prêmios no      │
│    saldo (se houver)        │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ 6. Atualizar status:        │
│    - "liquidado" se ganhou   │
│    - "perdida" se não ganhou │
└─────────────────────────────┘
```

---

## 📊 Fluxo Completo

### Passo 1: Criação da Aposta

Quando o usuário cria uma aposta instantânea:

```typescript
// Frontend envia:
{
  loteria: "INSTANTANEA",
  detalhes: {
    betData: {
      instant: true,  // ← Marca como instantânea
      modality: "Dupla de Grupo",
      animalBets: [[12, 13]],
      position: "1-3",
      amount: 10.00,
      divisionType: "all"
    }
  }
}
```

### Passo 2: Validação e Débito

```typescript
// 1. Verificar saldo disponível
const totalDisponivel = usuario.saldo + usuario.bonus

// 2. Calcular valor total da aposta
const valorTotalAposta = calcularValorTotalAposta(
  valorDigitado,
  qtdPalpites,
  divisionType
)

// 3. Debitar do saldo/bônus
if (valorTotalAposta > totalDisponivel) {
  throw new Error('Saldo insuficiente')
}

// Débito: primeiro saldo, depois bônus
let debitarSaldo = Math.min(saldoDisponivel, valorTotalAposta)
let debitarBonus = valorTotalAposta - debitarSaldo
```

### Passo 3: Geração do Resultado Instantâneo

```typescript
// Gerar resultado aleatório
const resultadoInstantaneo = gerarResultadoInstantaneo(Math.max(pos_to, 7))

// Função gerarResultadoInstantaneo():
function gerarResultadoInstantaneo(qtdPremios: number = 7): InstantResult {
  const prizes: number[] = []
  
  for (let i = 0; i < qtdPremios; i++) {
    // Gera número aleatório de 0000 a 9999
    const milhar = Math.floor(Math.random() * 10000)
    prizes.push(milhar)
  }
  
  const groups = prizes.map((milhar) => milharParaGrupo(milhar))
  
  return {
    prizes,  // [1234, 5678, 9012, ...]
    groups,  // [9, 20, 3, ...]
  }
}
```

**Exemplo de resultado gerado**:
```json
{
  "prizes": [1234, 5678, 9012, 3456, 7890, 2345, 6789],
  "groups": [9, 20, 3, 14, 20, 6, 17]
}
```

### Passo 4: Conferência dos Palpites

Para cada palpite, o sistema confere contra o resultado:

```typescript
// Para modalidades de grupo
for (const animalBet of betData.animalBets) {
  const grupos = animalBet.map((animalId) => {
    const animal = ANIMALS.find((a) => a.id === animalId)
    return animal.group
  })
  
  const conferencia = conferirPalpite(
    resultadoInstantaneo,
    modalityType,
    { grupos },
    pos_from,
    pos_to,
    valorPorPalpite,
    divisionType,
    modalityName
  )
  
  premioTotal += conferencia.totalPrize
}

// Para modalidades numéricas
for (const numero of numberBets) {
  const conferencia = conferirPalpite(
    resultadoInstantaneo,
    modalityType,
    { numero },
    pos_from,
    pos_to,
    valorPorPalpite,
    divisionType,
    modalityName
  )
  
  premioTotal += conferencia.totalPrize
}
```

### Passo 5: Atualização do Saldo

```typescript
if (isInstant) {
  // Aposta instantânea: debita e credita na mesma transação
  const saldoFinal = usuario.saldo - debitarSaldo + premioTotal
  const bonusFinal = usuario.bonus - debitarBonus
  
  await tx.usuario.update({
    where: { id: user.id },
    data: {
      saldo: saldoFinal,
      bonus: bonusFinal,
      rolloverAtual: usuario.rolloverAtual + valorTotalAposta,
    },
  })
}
```

### Passo 6: Determinação do Status

```typescript
let statusFinal: string
if (isInstant) {
  // Aposta instantânea: liquidado se ganhou, perdida se não ganhou
  statusFinal = premioTotal > 0 ? 'liquidado' : 'perdida'
} else {
  // Aposta normal: pendente até ser liquidada pelo cron
  statusFinal = status || 'pendente'
}
```

### Passo 7: Salvamento da Aposta

```typescript
const created = await tx.aposta.create({
  data: {
    usuarioId: user.id,
    loteria: "INSTANTANEA",
    valor: valorTotalAposta,
    retornoPrevisto: premioTotal > 0 ? premioTotal : 0,
    status: statusFinal,  // "liquidado" ou "perdida"
    detalhes: {
      ...detalhes,
      resultadoInstantaneo: resultadoInstantaneo,  // ← Salva o resultado gerado
      premioTotal,
      valorDigitado,
      valorTotalAposta,
    },
  },
})
```

---

## 🎲 Geração de Resultados

### Função `gerarResultadoInstantaneo()`

```typescript
export function gerarResultadoInstantaneo(qtdPremios: number = 7): InstantResult {
  const prizes: number[] = []
  
  for (let i = 0; i < qtdPremios; i++) {
    // Gera número aleatório de 0000 a 9999
    const milhar = Math.floor(Math.random() * 10000)
    prizes.push(milhar)
  }
  
  const groups = prizes.map((milhar) => milharParaGrupo(milhar))
  
  return {
    prizes,
    groups,
  }
}
```

### Quantidade de Prêmios

A quantidade de prêmios gerados depende da posição selecionada:

```typescript
// Se posição for 1-5, gera 7 prêmios (mínimo)
// Se posição for 1-7, gera 7 prêmios
const qtdPremios = Math.max(pos_to, 7)
```

**Razão**: Garante que sempre há prêmios suficientes para conferir todas as posições.

### Aleatoriedade

- **Geração**: Usa `Math.random()` do JavaScript
- **Range**: 0000 a 9999 (10.000 possibilidades)
- **Distribuição**: Uniforme (cada número tem mesma probabilidade)

---

## 💰 Conferência e Cálculo de Prêmios

### Mesma Lógica de Apostas Normais

A conferência usa **exatamente a mesma lógica** das apostas normais:

1. **Calcula unidades**: Baseado em modalidade e posições
2. **Calcula valor unitário**: Valor por palpite ÷ unidades
3. **Busca cotação**: Tenta dinâmica primeiro, depois tabela fixa
4. **Calcula prêmio por unidade**: Odd × valor unitário
5. **Calcula prêmio total**: Acertos × prêmio por unidade

### Exemplo: Dupla de Grupo

**Aposta**:
- Modalidade: Dupla de Grupo
- Palpites: Grupos 12-13
- Posição: 1º ao 3º
- Valor: R$ 10,00
- Divisão: "Para todos"

**Resultado gerado**:
```json
{
  "prizes": [1234, 5678, 9012, 3456, 7890, 2345, 6789],
  "groups": [9, 20, 3, 14, 20, 6, 17]
}
```

**Conferência**:
- Grupos nas posições 1-3: [9, 20, 3]
- Grupos apostados: [12, 13]
- Ambos presentes? ❌ Não
- Acertos: 0
- Prêmio: R$ 0,00
- Status: `"perdida"`

**Se resultado fosse**:
```json
{
  "groups": [12, 20, 13, ...]
}
```

**Conferência**:
- Grupos nas posições 1-3: [12, 20, 13]
- Grupos apostados: [12, 13]
- Ambos presentes? ✅ Sim
- Acertos: 1 (nas 3 posições = 3 unidades)
- Prêmio: 3 × (R$ 10,00 ÷ 3) × 16 = R$ 160,00
- Status: `"liquidado"`

---

## 📍 Status da Aposta

### Regras de Status

| Condição | Status | Descrição |
|----------|--------|-----------|
| `premioTotal > 0` | `"liquidado"` | Aposta ganhou, prêmio creditado |
| `premioTotal === 0` | `"perdida"` | Aposta não ganhou |

### ⚠️ Importante

**Antes (Bug corrigido)**:
```typescript
// ❌ ERRADO - marcava todas como liquidado
status: isInstant ? 'liquidado' : (status || 'pendente')
```

**Agora (Correto)**:
```typescript
// ✅ CORRETO - verifica se ganhou
if (isInstant) {
  statusFinal = premioTotal > 0 ? 'liquidado' : 'perdida'
}
```

---

## 🔀 Diferenças entre Aposta Normal e Instantânea

| Aspecto | Aposta Normal | Aposta Instantânea |
|---------|---------------|-------------------|
| **Resultado** | Resultado oficial da extração | Resultado aleatório gerado |
| **Liquidação** | Aguarda cron job (5 min) | Imediata (na criação) |
| **Status inicial** | `"pendente"` | `"liquidado"` ou `"perdida"` |
| **Prêmio** | Creditado pelo cron | Creditado na criação |
| **Dependência** | Extração oficial | Nenhuma |
| **Horário** | Após `closeTime` | Qualquer momento |
| **Resultado salvo** | Não | Sim (`resultadoInstantaneo`) |

### Fluxo Comparativo

**Aposta Normal**:
```
Criar → Status: "pendente" → Aguardar cron → Liquidar → Status: "liquidado"/"perdida"
```

**Aposta Instantânea**:
```
Criar → Gerar resultado → Conferir → Status: "liquidado"/"perdida" (imediato)
```

---

## 📝 Exemplos Práticos

### Exemplo 1: Dupla de Grupo - Ganhou

**Aposta**:
```json
{
  "loteria": "INSTANTANEA",
  "modalidade": "Dupla de Grupo",
  "palpites": [[12, 13]],
  "posição": "1-3",
  "valor": 10.00,
  "divisão": "all"
}
```

**Resultado gerado**:
```json
{
  "prizes": [1234, 5678, 9012],
  "groups": [9, 20, 12]  // Grupo 12 presente, mas falta 13
}
```

**Conferência**:
- Grupos 1-3: [9, 20, 12]
- Apostados: [12, 13]
- ❌ Não ganhou (falta grupo 13)

**Resultado**:
- Status: `"perdida"`
- Prêmio: R$ 0,00
- Saldo: Debitado R$ 10,00

---

### Exemplo 2: Dupla de Grupo - Ganhou

**Aposta**:
```json
{
  "loteria": "INSTANTANEA",
  "modalidade": "Dupla de Grupo",
  "palpites": [[12, 13]],
  "posição": "1-3",
  "valor": 10.00,
  "divisão": "all"
}
```

**Resultado gerado**:
```json
{
  "prizes": [1234, 5678, 9012],
  "groups": [9, 12, 13]  // Ambos grupos presentes!
}
```

**Conferência**:
- Grupos 1-3: [9, 12, 13]
- Apostados: [12, 13]
- ✅ Ganhou! Ambos presentes

**Cálculo**:
- Unidades: 1 × 3 = 3
- Valor unitário: R$ 10,00 ÷ 3 = R$ 3,33
- Cotação: 16x
- Prêmio por unidade: R$ 3,33 × 16 = R$ 53,33
- Prêmio total: 3 × R$ 53,33 = R$ 160,00

**Resultado**:
- Status: `"liquidado"`
- Prêmio: R$ 160,00
- Saldo: Debitado R$ 10,00 + Creditado R$ 160,00 = +R$ 150,00

---

### Exemplo 3: Milhar - Ganhou

**Aposta**:
```json
{
  "loteria": "INSTANTANEA",
  "modalidade": "Milhar",
  "palpites": ["1234"],
  "posição": "1-5",
  "valor": 10.00,
  "divisão": "all"
}
```

**Resultado gerado**:
```json
{
  "prizes": [1234, 5678, 9012, 3456, 7890],
  "groups": [9, 20, 3, 14, 20]
}
```

**Conferência**:
- Milhar 1234 aparece na posição 1
- ✅ Ganhou!

**Cálculo**:
- Unidades: 1 × 5 = 5
- Valor unitário: R$ 10,00 ÷ 5 = R$ 2,00
- Cotação: 6000x
- Prêmio por unidade: R$ 2,00 × 6000 = R$ 12.000,00
- Prêmio total: 1 × R$ 12.000,00 = R$ 12.000,00

**Resultado**:
- Status: `"liquidado"`
- Prêmio: R$ 12.000,00
- Saldo: Debitado R$ 10,00 + Creditado R$ 12.000,00 = +R$ 11.990,00

---

## 🔧 Troubleshooting

### Problema 1: Aposta Instantânea Marcada como "Ganhou" Quando Perdeu

**Sintoma**: Status mostra `"liquidado"` mas não ganhou prêmio.

**Causa**: Bug antigo que marcava todas como `"liquidado"`.

**Solução**: Já corrigido. Agora verifica `premioTotal > 0`:
```typescript
statusFinal = premioTotal > 0 ? 'liquidado' : 'perdida'
```

### Problema 2: Resultado Não Aparece na Interface

**Sintoma**: Usuário não vê o resultado instantâneo.

**Verificação**:
1. Verificar se `resultadoInstantaneo` está salvo em `detalhes`
2. Verificar se frontend está renderizando:
   ```tsx
   {selecionada.detalhes?.resultadoInstantaneo && (
     <div>
       {selecionada.detalhes.resultadoInstantaneo.prizes?.map(...)}
     </div>
   )}
   ```

### Problema 3: Prêmio Não Foi Creditado

**Sintoma**: Status `"liquidado"` mas saldo não aumentou.

**Verificação**:
1. Verificar logs da transação
2. Verificar se `premioTotal > 0` foi calculado corretamente
3. Verificar se atualização do saldo foi executada:
   ```typescript
   const saldoFinal = usuario.saldo - debitarSaldo + premioTotal
   ```

### Problema 4: Resultado Parece Não Ser Aleatório

**Sintoma**: Resultados muito similares ou padrões.

**Explicação**:
- `Math.random()` é pseudo-aleatório mas suficiente para apostas
- Se necessário, pode usar biblioteca de criptografia para maior aleatoriedade
- Cada aposta gera resultado independente

---

## 📋 Resumo Técnico

### Arquivos Envolvidos

- **`app/api/apostas/route.ts`**: Criação e liquidação de apostas instantâneas
- **`lib/bet-rules-engine.ts`**: Função `gerarResultadoInstantaneo()` e `conferirPalpite()`
- **`app/api/lottery/route.ts`**: Lista de loterias (inclui "INSTANTANEA")
- **`app/minhas-apostas/page.tsx`**: Exibição do resultado instantâneo

### Funções Principais

1. **`gerarResultadoInstantaneo(qtdPremios)`**: Gera resultado aleatório
2. **`conferirPalpite(resultado, modalidade, palpite, ...)`**: Confere palpite
3. **`calcularValorTotalAposta(...)`**: Calcula valor total
4. **`calcularValorPorPalpite(...)`**: Calcula valor por palpite

### Estrutura de Dados

```typescript
interface InstantResult {
  prizes: number[]  // Milhares sorteados [1234, 5678, ...]
  groups: number[]  // Grupos correspondentes [9, 20, ...]
}

interface ApostaDetalhes {
  resultadoInstantaneo?: InstantResult
  premioTotal: number
  valorDigitado: number
  valorTotalAposta: number
  betData: {
    instant: boolean
    // ... outros campos
  }
}
```

---

## ✅ Checklist de Funcionalidades

- [x] Geração de resultado aleatório
- [x] Conferência contra resultado gerado
- [x] Cálculo de prêmios (mesma lógica de apostas normais)
- [x] Débito e crédito na mesma transação
- [x] Status correto (`liquidado` se ganhou, `perdida` se não ganhou)
- [x] Salvamento do resultado gerado
- [x] Exibição do resultado na interface
- [x] Suporte a todas as modalidades
- [x] Suporte a todas as posições
- [x] Suporte a divisão "para cada" e "para todos"

---

## 🔗 Referências

- **Criação de Apostas**: `/app/api/apostas/route.ts`
- **Geração de Resultados**: `/lib/bet-rules-engine.ts` (função `gerarResultadoInstantaneo`)
- **Conferência**: `/lib/bet-rules-engine.ts` (função `conferirPalpite`)
- **Troubleshooting**: `/docs/TROUBLESHOOTING_LIQUIDACAO.md` (Problema 14)
- **Guia de Regras**: `/docs/GUIA_COMPLETO_REGRAS.md`

---

**Última atualização:** 14 de Janeiro de 2026
