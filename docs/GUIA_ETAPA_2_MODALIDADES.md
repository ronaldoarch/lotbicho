# Guia Completo: Etapa 2 das Modalidades (Seleção de Palpites)

Este guia explica em detalhes como funciona a **Etapa 2** do fluxo de apostas, onde o usuário seleciona os palpites (animais ou números) dependendo do tipo de modalidade escolhida.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Tipos de Modalidades](#tipos-de-modalidades)
3. [Modalidades Numéricas](#modalidades-numéricas)
4. [Modalidades de Animais](#modalidades-de-animais)
5. [Validações e Regras](#validações-e-regras)
6. [Fluxo de Dados](#fluxo-de-dados)
7. [Exemplos Práticos](#exemplos-práticos)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

A **Etapa 2** é onde o usuário define seus **palpites** após escolher uma modalidade na Etapa 1. O sistema detecta automaticamente se a modalidade é:

- **Numérica**: Usa `NumberCalculator` para digitar números
- **De Animais**: Usa `AnimalSelection` para selecionar animais/grupos

**Localização**: `/components/BetFlow.tsx` (case 2)

**Limite de Palpites**: Máximo de **10 palpites** por aposta

---

## 🔢 Tipos de Modalidades

### Detecção Automática

O sistema detecta o tipo de modalidade através do nome:

```typescript
// Em BetFlow.tsx
const isNumberModality = useMemo(() => {
  const modalityName = betData.modalityName || ''
  const numberModalities = [
    'Milhar',
    'Centena',
    'Dezena',
    'Milhar Invertida',
    'Centena Invertida',
    'Dezena Invertida',
    'Milhar/Centena',
    'Duque de Dezena',
    'Terno de Dezena',
  ]
  return numberModalities.includes(modalityName)
}, [betData.modalityName])
```

### Modalidades Numéricas

Usam `NumberCalculator` para digitar números:

- ✅ Milhar (4 dígitos)
- ✅ Centena (3 dígitos)
- ✅ Dezena (2 dígitos)
- ✅ Milhar Invertida (4 dígitos)
- ✅ Centena Invertida (3 dígitos)
- ✅ Dezena Invertida (2 dígitos)
- ✅ Milhar/Centena (3 ou 4 dígitos)
- ✅ Duque de Dezena (2 dígitos)
- ✅ Terno de Dezena (2 dígitos)

### Modalidades de Animais

Usam `AnimalSelection` para selecionar animais/grupos:

- ✅ Grupo (1 animal)
- ✅ Dupla de Grupo (2 animais)
- ✅ Terno de Grupo (3 animais)
- ✅ Quadra de Grupo (4 animais)
- ✅ Quina de Grupo (5 animais)
- ✅ Passe vai (2 animais)
- ✅ Passe vai e vem (2 animais)

---

## 🔢 Modalidades Numéricas

### Componente: `NumberCalculator`

**Localização**: `/components/NumberCalculator.tsx`

### Funcionamento

1. **Teclado Numérico**: Usuário digita números de 0-9
2. **Validação de Dígitos**: Sistema valida quantidade de dígitos conforme modalidade
3. **Auto-confirmação**: Quando atinge o limite de dígitos, adiciona automaticamente
4. **Múltiplos Palpites**: Permite até 10 palpites

### Mapeamento de Dígitos por Modalidade

```typescript
const MODALITY_DIGITS: Record<string, number> = {
  'Dezena': 2,
  'Centena': 3,
  'Milhar': 4,
  'Dezena Invertida': 2,
  'Centena Invertida': 3,
  'Milhar Invertida': 4,
  'Milhar/Centena': 4, // Aceita 3 ou 4 dígitos
  'Duque de Dezena': 2,
  'Terno de Dezena': 2,
}
```

### Caso Especial: Milhar/Centena

A modalidade **Milhar/Centena** aceita **3 ou 4 dígitos**:

```typescript
if (isMilharCentena) {
  if (currentNumber.length === 3 || currentNumber.length === 4) {
    handleConfirm() // Auto-confirma quando atinge 3 ou 4 dígitos
  }
}
```

### Interface do Usuário

1. **Display do Número Atual**:
   - Mostra dígitos preenchidos em azul
   - Mostra dígitos vazios como `_`
   - Exibe contador: `X/4 dígitos`

2. **Teclado Numérico**:
   - Botões de 0-9
   - Botão de backspace (⌫)
   - Botão "Limpar" para resetar

3. **Palpites Adicionados**:
   - Lista de palpites já confirmados
   - Botão de remover (🗑️) em cada palpite
   - Formato: `0001`, `1234`, etc. (com zeros à esquerda)

### Validações

```typescript
// Validação de limite de dígitos
if (isMilharCentena) {
  if (newNumber.length > 4) {
    setError('Máximo de 4 dígitos')
    return
  }
} else {
  if (newNumber.length > maxDigits) {
    setError(`Máximo de ${maxDigits} dígitos`)
    return
  }
}

// Validação final antes de confirmar
if (isMilharCentena) {
  if (currentNumber.length < 3 || currentNumber.length > 4) {
    setError('Milhar/Centena precisa de 3 ou 4 dígitos')
    return
  }
} else {
  if (currentNumber.length !== maxDigits) {
    setError(`${modalityName} precisa de exatamente ${maxDigits} dígitos`)
    return
  }
}
```

### Formatação

Números são formatados com zeros à esquerda:

```typescript
// Exemplo: "1" vira "0001" para Milhar
const formattedNumber = currentNumber.padStart(maxDigits, '0')
```

---

## 🐾 Modalidades de Animais

### Componente: `AnimalSelection`

**Localização**: `/components/AnimalSelection.tsx`

### Funcionamento

1. **Seleção de Animais**: Usuário clica nos animais desejados
2. **Agrupamento Automático**: Quando completa a quantidade necessária, adiciona o palpite
3. **Múltiplos Palpites**: Permite até 10 palpites
4. **Visualização**: Mostra animais selecionados e palpites confirmados

### Quantidade de Animais por Palpite

A função `getRequiredAnimalsPerBet()` determina quantos animais são necessários:

```typescript
function getRequiredAnimalsPerBet(modalityIdOrName: string | null): number {
  if (!modalityIdOrName) return 1

  const normalized = norm(modalityIdOrName)

  // Prioriza nome
  if (normalized.includes('dupla de grupo') || normalized === 'dupla') return 2
  if (normalized.includes('terno de grupo') || normalized === 'terno') return 3
  if (normalized.includes('quadra de grupo') || normalized === 'quadra') return 4
  if (normalized.includes('quina de grupo') || normalized === 'quina') return 5
  if (normalized === 'passe vai e vem') return 2
  if (normalized === 'passe vai') return 2

  return 1 // Grupo simples ou outras
}
```

### Tabela de Animais

O sistema possui **25 animais** organizados em grupos:

| ID | Nome | Grupo |
|----|------|-------|
| 1 | Avestruz | 1 |
| 2 | Águia | 2 |
| 3 | Burro | 3 |
| ... | ... | ... |
| 25 | Vaca | 25 |

**Localização**: `/data/animals.ts`

### Interface do Usuário

1. **Grid de Animais**:
   - Grid responsivo (2 colunas mobile, 3 tablet, 5 desktop)
   - Cada animal mostra nome e grupo
   - Animais selecionados ficam destacados em azul

2. **Palpite em Construção**:
   - Mostra animais selecionados no momento
   - Exibe contador: `01-02 (2/3)` para Terno de Grupo

3. **Palpites Confirmados**:
   - Lista de palpites já adicionados
   - Formato: `01-02-03` (IDs com zeros à esquerda)
   - Botão de remover (🗑️) em cada palpite

### Lógica de Seleção

```typescript
const handleToggle = (id: number) => {
  if (maxReached && !current.includes(id)) return
  
  setCurrent((prev) => {
    const exists = prev.includes(id)
    const next = exists 
      ? prev.filter((n) => n !== id) // Remove se já está selecionado
      : [...prev, id] // Adiciona se não está selecionado
    
    // Auto-confirma quando completa a quantidade necessária
    if (next.length === requiredPerBet) {
      onAddBet(next)
      return [] // Limpa seleção atual
    }
    
    // Não permite selecionar mais que o necessário
    if (next.length > requiredPerBet) return prev
    
    return next
  })
}
```

### Validações

- ✅ Máximo de 10 palpites
- ✅ Cada palpite precisa da quantidade exata de animais
- ✅ Não permite selecionar mais animais que o necessário
- ✅ Desabilita animais quando limite de palpites é atingido

---

## ✅ Validações e Regras

### Validação da Etapa 2

```typescript
// Em BetFlow.tsx
const animalsValid = betData.animalBets.length > 0 && betData.animalBets.length <= MAX_PALPITES
const numbersValid = betData.numberBets.length > 0 && betData.numberBets.length <= MAX_PALPITES
const step2Valid = isNumberModality ? numbersValid : animalsValid
```

### Regras Gerais

1. **Limite de Palpites**: Máximo de **10 palpites** por aposta
2. **Validação de Continuar**: Botão "Continuar" só habilita se:
   - Pelo menos 1 palpite foi adicionado
   - Não excede 10 palpites
3. **Limpeza ao Trocar Modalidade**: Ao trocar de modalidade na Etapa 1, os palpites são limpos

### Regras para Modalidades Numéricas

- ✅ Número deve ter exatamente a quantidade de dígitos da modalidade
- ✅ Milhar/Centena aceita 3 ou 4 dígitos
- ✅ Números são formatados com zeros à esquerda
- ✅ Não permite confirmar número incompleto

### Regras para Modalidades de Animais

- ✅ Cada palpite precisa da quantidade exata de animais
- ✅ Não permite selecionar mais animais que o necessário
- ✅ Animais podem ser removidos antes de completar o palpite
- ✅ Palpite é adicionado automaticamente quando completa a quantidade

---

## 🔄 Fluxo de Dados

### 1. Usuário Seleciona Modalidade (Etapa 1)

```
ModalitySelection → BetFlow
  ↓
setBetData({
  modality: id,
  modalityName: name,
  animalBets: [], // Limpa palpites anteriores
  numberBets: []  // Limpa palpites anteriores
})
  ↓
currentStep = 2
```

### 2. Sistema Detecta Tipo de Modalidade

```
BetFlow detecta tipo:
  ↓
isNumberModality = true/false
requiredAnimalsPerBet = 1-5
  ↓
Renderiza componente apropriado:
  - NumberCalculator (se numérica)
  - AnimalSelection (se animais)
```

### 3. Usuário Adiciona Palpites

**Para Números**:
```
NumberCalculator
  ↓
Usuário digita números
  ↓
handleNumberClick() → valida → adiciona dígito
  ↓
Quando completa → handleConfirm()
  ↓
onAddBet(formattedNumber)
  ↓
BetFlow atualiza: numberBets.push(number)
```

**Para Animais**:
```
AnimalSelection
  ↓
Usuário clica em animais
  ↓
handleToggle(id) → adiciona/remove animal
  ↓
Quando completa requiredPerBet → onAddBet(ids)
  ↓
BetFlow atualiza: animalBets.push(ids)
```

### 4. Validação para Próxima Etapa

```
Usuário clica "Continuar"
  ↓
handleNext() verifica step2Valid
  ↓
Se válido → currentStep = 3
Se inválido → não avança
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Apostar em Milhar

1. **Etapa 1**: Seleciona "Milhar"
2. **Etapa 2**: 
   - Sistema detecta: `isNumberModality = true`
   - Renderiza `NumberCalculator`
   - Usuário digita: `1` → `12` → `123` → `1234`
   - Sistema auto-confirma: adiciona `1234`
   - Usuário pode adicionar mais palpites (até 10)
3. **Resultado**: `numberBets = ['1234', '5678', ...]`

### Exemplo 2: Apostar em Terno de Grupo

1. **Etapa 1**: Seleciona "Terno de Grupo"
2. **Etapa 2**:
   - Sistema detecta: `isNumberModality = false`
   - Calcula: `requiredAnimalsPerBet = 3`
   - Renderiza `AnimalSelection`
   - Usuário clica: Avestruz (01) → Águia (02) → Burro (03)
   - Sistema auto-confirma: adiciona `[1, 2, 3]`
   - Usuário pode adicionar mais palpites (até 10)
3. **Resultado**: `animalBets = [[1, 2, 3], [4, 5, 6], ...]`

### Exemplo 3: Apostar em Milhar/Centena

1. **Etapa 1**: Seleciona "Milhar/Centena"
2. **Etapa 2**:
   - Sistema detecta: `isNumberModality = true`
   - Renderiza `NumberCalculator` com validação especial
   - Usuário digita: `1` → `12` → `123`
   - Sistema auto-confirma: adiciona `0123` (3 dígitos válido)
   - OU usuário continua: `1234`
   - Sistema auto-confirma: adiciona `1234` (4 dígitos válido)
3. **Resultado**: `numberBets = ['0123', '1234', ...]`

### Exemplo 4: Remover Palpite

**Para Números**:
- Clica no botão 🗑️ ao lado do palpite
- `onRemoveBet(index)` remove do array

**Para Animais**:
- Clica no botão 🗑️ ao lado do palpite
- `onRemoveBet(index)` remove do array

---

## 🔍 Troubleshooting

### Problema: Botão "Continuar" não habilita

**Possíveis Causas**:
1. Nenhum palpite foi adicionado
2. Modalidade não foi selecionada corretamente
3. Erro na validação

**Solução**:
1. Verifique se pelo menos 1 palpite foi adicionado
2. Verifique se `step2Valid` está retornando `true`
3. Verifique console do navegador para erros

### Problema: Número não confirma automaticamente

**Possíveis Causas**:
1. Número não atingiu quantidade de dígitos necessária
2. Modalidade Milhar/Centena precisa de 3 ou 4 dígitos
3. Erro na validação

**Solução**:
1. Verifique quantidade de dígitos da modalidade
2. Para Milhar/Centena, digite 3 ou 4 dígitos
3. Use botão "Confirmar" manualmente se necessário

### Problema: Animal não é adicionado ao palpite

**Possíveis Causas**:
1. Limite de 10 palpites atingido
2. Quantidade de animais não está completa
3. Animal já está selecionado

**Solução**:
1. Remova um palpite existente se necessário
2. Complete a quantidade necessária de animais
3. Verifique se animal não está duplicado

### Problema: Modalidade detectada incorretamente

**Possíveis Causas**:
1. Nome da modalidade não está na lista
2. `modalityName` não está sendo passado corretamente

**Solução**:
1. Verifique se nome da modalidade está correto
2. Adicione modalidade à lista `numberModalities` se necessário
3. Verifique se `betData.modalityName` está preenchido

### Problema: Quantidade de animais incorreta

**Possíveis Causas**:
1. Função `getRequiredAnimalsPerBet()` não reconhece modalidade
2. Nome da modalidade não está normalizado corretamente

**Solução**:
1. Verifique nome da modalidade no banco de dados
2. Adicione caso na função `getRequiredAnimalsPerBet()` se necessário
3. Verifique normalização do nome (sem acentos, lowercase)

---

## 📝 Notas Importantes

1. **Limpeza Automática**: Ao trocar de modalidade, os palpites são limpos automaticamente

2. **Formatação de Números**: Números são sempre formatados com zeros à esquerda (ex: `1` vira `0001`)

3. **Formatação de Animais**: IDs de animais são formatados com zeros à esquerda (ex: `1` vira `01`)

4. **Auto-confirmação**: 
   - Números: confirma quando atinge quantidade de dígitos
   - Animais: confirma quando atinge quantidade necessária

5. **Limite de Palpites**: Sempre 10, independente do tipo de modalidade

6. **Validação em Tempo Real**: Sistema valida enquanto usuário interage

---

## 🚀 Melhorias Futuras Sugeridas

1. **Histórico de Palpites**: Salvar palpites recentes para reutilizar
2. **Sugestões Inteligentes**: Sugerir números/animais baseado em padrões
3. **Validação de Números Válidos**: Validar se número existe no jogo
4. **Modo Rápido**: Permitir adicionar múltiplos palpites de uma vez
5. **Importar Palpites**: Permitir importar lista de palpites
6. **Estatísticas**: Mostrar estatísticas de palpites mais apostados

---

## 📚 Arquivos Relacionados

### Componentes Principais
- `/components/BetFlow.tsx` - Fluxo principal de apostas (Etapa 2)
- `/components/NumberCalculator.tsx` - Calculadora para modalidades numéricas
- `/components/AnimalSelection.tsx` - Seleção para modalidades de animais

### Dados Estáticos
- `/data/animals.ts` - Lista de 25 animais
- `/data/modalities.ts` - Lista de modalidades disponíveis

### Tipos
- `/types/bet.ts` - Tipos TypeScript relacionados a apostas

---

## 🔗 Relacionado

- [Guia de Cotações no Admin](./GUIA_COTACOES_ADMIN.md)
- [Guia de Regras do Backend](./manual-regras-backend.md)
- [Guia de Aposta Instantânea](./GUIA_APOSTA_INSTANTANEA.md)

---

**Última atualização**: Dezembro 2024
