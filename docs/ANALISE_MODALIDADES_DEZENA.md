# Análise das Modalidades de Dezena

## 📋 Modalidades Identificadas

### 1. Duque de Dezena
- **Status**: ✅ Existe no sistema
- **Localização**: `data/modalities.ts` (id: 6)
- **Cotação**: 1x R$ 300.00
- **Implementação**: Parcialmente implementada

### 2. Terno de Dezena
- **Status**: ✅ Existe no sistema
- **Localização**: `data/modalities.ts` (id: 7)
- **Cotação**: 1x R$ 5000.00
- **Implementação**: Parcialmente implementada

### 3. Quadra de Dezena
- **Status**: ❌ NÃO EXISTE no sistema
- **Regra**: Similar ao duque ou terno de dezena, mas precisa acertar 4 dezenas
- **Ação necessária**: Criar modalidade

### 4. Duque de Dezena EMD
- **Status**: ❌ NÃO EXISTE no sistema
- **Regra**: Para apuração valem os 2 primeiros dígitos, os 2 do meio ou os 2 últimos dígitos
- **Exemplo**: Resultado 1234 → acerta com dezenas 12, 23 e 34
- **Ação necessária**: Criar modalidade com lógica específica

---

## 🔍 Análise das Regras

### Regra 1: Quadra de Dezena

**Descrição**: Similar ao duque ou terno de dezena, porém tem que acertar 4 dezenas.

**Lógica esperada**:
- O jogador aposta em 4 dezenas (ex: 12, 23, 34, 45)
- Essas 4 dezenas devem aparecer nas posições selecionadas (ex: 1º ao 7º)
- Se todas as 4 dezenas aparecerem → ganha

**Comparação com outras modalidades**:
- **Duque de Dezena**: Aposta 2 dezenas, ambas devem aparecer
- **Terno de Dezena**: Aposta 3 dezenas, todas devem aparecer
- **Quadra de Dezena**: Aposta 4 dezenas, todas devem aparecer

### Regra 2: Duque de Dezena EMD

**Descrição**: Para apuração valem os 2 primeiros dígitos, os 2 do meio ou os 2 últimos dígitos.

**Exemplo detalhado**:
- Resultado: `1234`
- Dezenas válidas extraídas:
  - **12** (primeiros 2 dígitos)
  - **23** (meio: posições 2-3)
  - **34** (últimos 2 dígitos)

**Lógica de extração**:
```typescript
function extrairDezenasEMD(milhar: string): string[] {
  // milhar sempre tem 4 dígitos (ex: "1234")
  const dezenas: string[] = []
  
  // Primeiros 2 dígitos: "12"
  dezenas.push(milhar.substring(0, 2))
  
  // Meio (posições 2-3): "23"
  dezenas.push(milhar.substring(1, 3))
  
  // Últimos 2 dígitos: "34"
  dezenas.push(milhar.substring(2, 4))
  
  return dezenas // ["12", "23", "34"]
}
```

**Regra de acerto**:
- O jogador aposta em 2 dezenas (ex: 12 e 34)
- Para cada prêmio no intervalo selecionado:
  - Extrair as 3 dezenas EMD do prêmio
  - Se ambas as dezenas apostadas estiverem entre as 3 dezenas EMD → acertou esse prêmio
- Contar quantos prêmios acertou
- Prêmio = acertos × odd × valor_unitário

---

## ⚠️ Problemas Identificados

### 1. Duque de Dezena e Terno de Dezena

**Problema**: Essas modalidades existem no sistema, mas não há implementação específica no `bet-rules-engine.ts`.

**Evidência**:
- Existem em `data/modalities.ts`
- Aparecem em `components/NumberCalculator.tsx` e `components/BetFlow.tsx`
- **MAS** não há mapeamento no `modalityMap` da liquidação (`app/api/resultados/liquidar/route.ts`)
- **E** não há função específica de conferência no `bet-rules-engine.ts`

**Impacto**: Essas modalidades provavelmente não estão funcionando corretamente na liquidação.

### 2. Quadra de Dezena

**Problema**: Modalidade não existe no sistema.

**Ação necessária**:
1. Adicionar em `data/modalities.ts`
2. Adicionar em `components/NumberCalculator.tsx` (2 dígitos)
3. Adicionar em `components/BetFlow.tsx`
4. Criar função de conferência no `bet-rules-engine.ts`
5. Adicionar mapeamento na liquidação

### 3. Duque de Dezena EMD

**Problema**: Modalidade não existe e requer lógica específica de extração.

**Ação necessária**:
1. Criar modalidade completa
2. Implementar função `extrairDezenasEMD()`
3. Criar função de conferência específica
4. Adicionar mapeamento na liquidação

---

## 📝 Recomendações de Implementação

### Prioridade 1: Corrigir Duque/Terno de Dezena

1. Adicionar mapeamento na liquidação:
```typescript
const modalityMap: Record<string, ModalityType> = {
  // ... existentes
  'Duque de Dezena': 'DUQUE_DEZENA',
  'Terno de Dezena': 'TERNO_DEZENA',
}
```

2. Criar tipo no `bet-rules-engine.ts`:
```typescript
export type ModalityType =
  // ... existentes
  | 'DUQUE_DEZENA'
  | 'TERNO_DEZENA'
  | 'QUADRA_DEZENA'
  | 'DUQUE_DEZENA_EMD'
```

3. Criar função de conferência:
```typescript
export function conferirDuqueDezena(
  resultado: number[],
  dezenasApostadas: string[], // ["12", "34"]
  pos_from: number,
  pos_to: number
): PrizeCalculation {
  // Verificar se ambas as dezenas aparecem nas posições
  // Similar a conferirDuplaGrupo, mas com dezenas
}
```

### Prioridade 2: Implementar Quadra de Dezena

1. Adicionar em `data/modalities.ts`:
```typescript
{ id: 17, name: 'Quadra de Dezena', value: '1x R$ 10000.00', hasLink: false },
```

2. Implementar função de conferência:
```typescript
export function conferirQuadraDezena(
  resultado: number[],
  dezenasApostadas: string[], // ["12", "23", "34", "45"]
  pos_from: number,
  pos_to: number
): PrizeCalculation {
  // Verificar se todas as 4 dezenas aparecem nas posições
}
```

### Prioridade 3: Implementar Duque de Dezena EMD

1. Criar função de extração:
```typescript
export function extrairDezenasEMD(milhar: string): string[] {
  const milharStr = milhar.padStart(4, '0')
  return [
    milharStr.substring(0, 2), // Primeiros 2
    milharStr.substring(1, 3), // Meio
    milharStr.substring(2, 4),  // Últimos 2
  ]
}
```

2. Criar função de conferência:
```typescript
export function conferirDuqueDezenaEMD(
  resultado: number[],
  dezenasApostadas: string[], // ["12", "34"]
  pos_from: number,
  pos_to: number
): PrizeCalculation {
  let hits = 0
  
  for (let pos = pos_from - 1; pos < pos_to && pos < resultado.length; pos++) {
    const premio = resultado[pos]
    const premioStr = premio.toString().padStart(4, '0')
    const dezenasEMD = extrairDezenasEMD(premioStr)
    
    // Verificar se ambas as dezenas apostadas estão nas dezenas EMD
    const ambasPresentes = dezenasApostadas.every(dezena => 
      dezenasEMD.includes(dezena)
    )
    
    if (ambasPresentes) {
      hits++
    }
  }
  
  return { hits, prizePerUnit: 0, totalPrize: 0 }
}
```

---

## 🎯 Próximos Passos

1. ✅ Verificar se Duque/Terno de Dezena estão funcionando
2. ⚠️ Corrigir implementação de Duque/Terno de Dezena se necessário
3. ➕ Adicionar Quadra de Dezena
4. ➕ Adicionar Duque de Dezena EMD
5. ✅ Testar todas as modalidades
6. ✅ Atualizar documentação

---

**Última atualização**: 17/01/2026  
**Status**: Análise completa - Aguardando implementação
