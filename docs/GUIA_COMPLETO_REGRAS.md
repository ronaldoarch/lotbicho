# 📚 Guia Completo: Regras das Modalidades, Cálculos e Lógica de Premiação

**Última atualização:** 14 de Janeiro de 2026

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Modalidades Disponíveis](#modalidades-disponíveis)
3. [Sistema de Posições](#sistema-de-posições)
4. [Tipos de Divisão de Valor](#tipos-de-divisão-de-valor)
5. [Cálculo de Valores](#cálculo-de-valores)
6. [Lógica de Premiação](#lógica-de-premiação)
7. [Conversões e Grupos](#conversões-e-grupos)
8. [Modalidades Especiais](#modalidades-especiais)
9. [Exemplos Práticos](#exemplos-práticos)
10. [Tabela de Cotações](#tabela-de-cotações)

---

## 🎯 Visão Geral

O sistema de apostas do Jogo do Bicho funciona com base em:
- **Modalidades**: Tipo de aposta (Grupo, Milhar, Dupla de Grupo, etc.)
- **Posições**: Intervalo de prêmios onde a aposta é válida (1º, 1º-3º, 1º-5º, 1º-7º)
- **Divisão de Valor**: Como o valor é distribuído entre os palpites
- **Cotações Dinâmicas**: Multiplicadores que variam conforme configuração

---

## 🎲 Modalidades Disponíveis

### Modalidades de Grupo

#### 1. **Grupo** (1 grupo)
- **Descrição**: Aposta em um único grupo (animal)
- **Exemplo**: Apostar no grupo 12 (Elefante)
- **Posições válidas**: 1º, 1º-3º, 1º-5º, 1º-7º
- **Cotação**: 1x R$ 18.00

#### 2. **Dupla de Grupo** (2 grupos)
- **Descrição**: Aposta em dois grupos que devem aparecer nas posições selecionadas
- **Exemplo**: Apostar nos grupos 12-13 (Elefante e Leão)
- **Posições válidas**: 1º, 1º-3º, 1º-5º, 1º-7º
- **Cotação**: 1x R$ 16.00
- **Regra**: Ambos os grupos devem estar presentes nas posições selecionadas

#### 3. **Terno de Grupo** (3 grupos)
- **Descrição**: Aposta em três grupos que devem aparecer nas posições selecionadas
- **Exemplo**: Apostar nos grupos 12-13-14 (Elefante, Leão e Gato)
- **Posições válidas**: 1º, 1º-3º, 1º-5º, 1º-7º
- **Cotação**: 1x R$ 150.00
- **Regra**: Todos os três grupos devem estar presentes nas posições selecionadas

#### 4. **Quadra de Grupo** (4 grupos)
- **Descrição**: Aposta em quatro grupos que devem aparecer nas posições selecionadas
- **Exemplo**: Apostar nos grupos 12-13-14-15
- **Posições válidas**: 1º, 1º-3º, 1º-5º, 1º-7º
- **Cotação**: 1x R$ 1000.00
- **Regra**: Todos os quatro grupos devem estar presentes nas posições selecionadas

### Modalidades Numéricas

#### 5. **Dezena** (2 dígitos)
- **Descrição**: Aposta nos últimos 2 dígitos de um milhar
- **Exemplo**: Apostar "23" (aparece em milhares terminados em 23)
- **Posições válidas**: 1º, 1º-3º, 1º-5º, 1º-7º
- **Cotação**: 1x R$ 60.00
- **Limite**: Apenas 2 dígitos (00-99)

#### 6. **Centena** (3 dígitos)
- **Descrição**: Aposta nos últimos 3 dígitos de um milhar
- **Exemplo**: Apostar "123" (aparece em milhares terminados em 123)
- **Posições válidas**: 1º, 1º-3º, 1º-5º, 1º-7º
- **Cotação**: 1x R$ 600.00
- **Limite**: Apenas 3 dígitos (000-999)

#### 7. **Milhar** (4 dígitos)
- **Descrição**: Aposta no milhar completo
- **Exemplo**: Apostar "1234" (deve aparecer exatamente 1234)
- **Posições válidas**: 1º, 1º-3º, 1º-5º
- **Cotação**: 1x R$ 6000.00
- **Limite**: Apenas 4 dígitos (0000-9999)

### Modalidades Invertidas

#### 8. **Dezena Invertida** (2 dígitos)
- **Descrição**: Aposta nos últimos 2 dígitos em qualquer ordem
- **Exemplo**: Apostar "23" → aceita "23" e "32"
- **Posições válidas**: 1º, 1º-3º, 1º-5º, 1º-7º
- **Cotação**: 1x R$ 60.00
- **Combinações**: Gera todas as permutações distintas dos dígitos

#### 9. **Centena Invertida** (3 dígitos)
- **Descrição**: Aposta nos últimos 3 dígitos em qualquer ordem
- **Exemplo**: Apostar "123" → aceita "123", "132", "213", "231", "312", "321"
- **Posições válidas**: 1º, 1º-3º, 1º-5º, 1º-7º
- **Cotação**: 1x R$ 600.00
- **Combinações**: Gera todas as permutações distintas dos dígitos

#### 10. **Milhar Invertida** (4 dígitos)
- **Descrição**: Aposta no milhar completo em qualquer ordem
- **Exemplo**: Apostar "1234" → aceita todas as permutações de 1,2,3,4
- **Posições válidas**: 1º, 1º-3º, 1º-5º
- **Cotação**: 1x R$ 6000.00
- **Combinações**: Gera todas as permutações distintas dos dígitos

### Modalidades Combinadas

#### 11. **Milhar/Centena**
- **Descrição**: Aposta que ganha se acertar o milhar OU a centena
- **Exemplo**: Apostar "1234" → ganha se aparecer "1234" ou "234"
- **Posições válidas**: 1º, 1º-3º, 1º-5º
- **Cotação**: 1x R$ 3300.00

### Modalidades de Passe

#### 12. **Passe vai** (1º → 2º)
- **Descrição**: O grupo do 1º prêmio deve passar para o 2º prêmio
- **Exemplo**: Se 1º é grupo 12 e 2º é grupo 12 → ganha
- **Posições fixas**: Apenas 1º-2º
- **Cotação**: 1x R$ 90.00
- **Regra**: Grupo do 1º deve ser igual ao grupo do 2º

#### 13. **Passe vai e vem** (1º ↔ 2º)
- **Descrição**: O grupo do 1º deve passar para o 2º OU vice-versa
- **Exemplo**: Se 1º é grupo 12 e 2º é grupo 12 → ganha
- **Posições fixas**: Apenas 1º-2º
- **Cotação**: 1x R$ 90.00
- **Regra**: Aceita ambas as ordens (12→12 ou 12→12)

---

## 📍 Sistema de Posições

### Posições Padrão

1. **1º Prêmio**: Apenas o primeiro lugar
2. **1º ao 3º**: Primeiro, segundo e terceiro lugares
3. **1º ao 5º**: Primeiro ao quinto lugar
4. **1º ao 7º**: Primeiro ao sétimo lugar

### Posições Personalizadas

O sistema também aceita posições personalizadas:
- **Formato**: "1", "2", "3", "4", "5", "6", "7" (individual)
- **Formato**: "1-3", "1-5", "1-7", "2-5", etc. (intervalo)
- **Validação**: Apenas números de 1 a 7, intervalo deve ser crescente

### Cálculo de Quantidade de Posições

```typescript
qtdPosicoes = pos_to - pos_from + 1

Exemplos:
- 1º ao 3º: pos_from=1, pos_to=3 → qtdPosicoes = 3
- 1º ao 5º: pos_from=1, pos_to=5 → qtdPosicoes = 5
- 1º ao 7º: pos_from=1, pos_to=7 → qtdPosicoes = 7
```

---

## 💰 Tipos de Divisão de Valor

### 1. **"Para cada palpite"** (`divisionType: 'each'`)

**Descrição**: O valor digitado é aplicado a CADA palpite individualmente.

**Fórmula**:
```
Valor por palpite = Valor digitado
Valor total = Valor digitado × Quantidade de palpites
```

**Exemplo**:
- Valor digitado: R$ 10,00
- Quantidade de palpites: 3
- Valor por palpite: R$ 10,00
- Valor total da aposta: R$ 30,00

### 2. **"Para todos os palpites"** (`divisionType: 'all'`)

**Descrição**: O valor digitado é dividido entre TODOS os palpites.

**Fórmula**:
```
Valor por palpite = Valor digitado ÷ Quantidade de palpites
Valor total = Valor digitado
```

**Exemplo**:
- Valor digitado: R$ 30,00
- Quantidade de palpites: 3
- Valor por palpite: R$ 10,00
- Valor total da aposta: R$ 30,00

---

## 🧮 Cálculo de Valores

### Função: `calcularValorTotalAposta()`

Calcula o valor total que será debitado da carteira do usuário.

```typescript
function calcularValorTotalAposta(
  valorDigitado: number,
  qtdPalpites: number,
  divisaoTipo: 'all' | 'each'
): number {
  if (divisaoTipo === 'each') {
    return valorDigitado * qtdPalpites
  } else {
    return valorDigitado
  }
}
```

### Função: `calcularValorPorPalpite()`

Calcula quanto cada palpite individual vale.

```typescript
function calcularValorPorPalpite(
  valorDigitado: number,
  qtdPalpites: number,
  divisaoTipo: 'all' | 'each'
): number {
  if (divisaoTipo === 'each') {
    return valorDigitado
  } else {
    return valorDigitado / qtdPalpites
  }
}
```

### Cálculo de Unidades

Para modalidades numéricas (especialmente invertidas), o sistema calcula unidades:

```typescript
// Para modalidades normais
unidades = 1 × qtdPosicoes

// Para modalidades invertidas
unidades = permutacoes × qtdPosicoes

// Valor unitário
valorUnitario = valorPorPalpite ÷ unidades
```

**Exemplo - Dezena Invertida "23"**:
- Permutações: ["23", "32"] = 2
- Posições: 1º-5º = 5
- Unidades: 2 × 5 = 10
- Se valor por palpite = R$ 10,00
- Valor unitário: R$ 10,00 ÷ 10 = R$ 1,00

---

## 🏆 Lógica de Premiação

### 1. Busca de Cotação Dinâmica

O sistema primeiro tenta buscar a cotação da configuração (`MODALITIES`):

```typescript
function buscarCotacaoDinamica(modalityName: string): number | null {
  // Busca em MODALITIES: "1x R$ 16.00" → extrai 16
  // Retorna o multiplicador numérico
}
```

**Exemplo**:
- Modalidade: "Dupla de Grupo"
- Valor em MODALITIES: "1x R$ 16.00"
- Multiplicador extraído: 16

### 2. Busca de Odd (Fallback)

Se não encontrar cotação dinâmica, usa tabela fixa:

```typescript
function buscarOdd(
  modalidade: ModalityType,
  pos_from: number,
  pos_to: number,
  modalityName?: string
): number {
  // Primeiro tenta buscarCotacaoDinamica()
  // Se não encontrar, usa oddsTable fixa
}
```

### 3. Cálculo de Prêmio por Unidade

```typescript
premioUnidade = odd × valorUnitario
```

**Exemplo**:
- Odd: 16 (Dupla de Grupo)
- Valor unitário: R$ 1,00
- Prêmio por unidade: R$ 16,00

### 4. Cálculo de Prêmio Total

```typescript
premioTotal = acertos × premioUnidade
```

**Exemplo**:
- Acertos: 2
- Prêmio por unidade: R$ 16,00
- Prêmio total: R$ 32,00

---

## 🔄 Conversões e Grupos

### Conversão Dezena → Grupo

Cada grupo contém 4 dezenas consecutivas:

```
Grupo 1:  01, 02, 03, 04  (Avestruz)
Grupo 2:  05, 06, 07, 08  (Águia)
Grupo 3:  09, 10, 11, 12  (Burro)
...
Grupo 25: 97, 98, 99, 00  (Vaca)
```

**Fórmula**:
```typescript
function dezenaParaGrupo(dezena: number): number {
  if (dezena === 0) return 25  // 00 pertence ao grupo 25
  return Math.floor((dezena - 1) / 4) + 1
}
```

### Conversão Milhar → Grupo

Extrai os últimos 2 dígitos do milhar e converte para grupo:

```typescript
function milharParaGrupo(milhar: number): number {
  const dezena = milhar % 100  // Últimos 2 dígitos
  return dezenaParaGrupo(dezena)
}
```

**Exemplos**:
- Milhar 1234 → Dezena 34 → Grupo 9 (Cobra)
- Milhar 5678 → Dezena 78 → Grupo 20 (Peru)
- Milhar 9900 → Dezena 00 → Grupo 25 (Vaca)

---

## 🎯 Modalidades Especiais

### Passe vai

**Regra**: O grupo do 1º prêmio deve ser igual ao grupo do 2º prêmio.

**Exemplo**:
- Resultado: 1º = 1234 (grupo 9), 2º = 5678 (grupo 20)
- Aposta: Passe vai grupo 9
- Resultado: ❌ Perdeu (grupos diferentes)

**Exemplo**:
- Resultado: 1º = 1234 (grupo 9), 2º = 9876 (grupo 9)
- Aposta: Passe vai grupo 9
- Resultado: ✅ Ganhou (mesmo grupo)

### Passe vai e vem

**Regra**: Aceita ambas as ordens (1º→2º ou 2º→1º).

**Exemplo**:
- Resultado: 1º = 1234 (grupo 9), 2º = 5678 (grupo 20)
- Aposta: Passe vai e vem grupos 9-20
- Resultado: ❌ Perdeu (grupos diferentes)

**Exemplo**:
- Resultado: 1º = 1234 (grupo 9), 2º = 9876 (grupo 9)
- Aposta: Passe vai e vem grupos 9-9
- Resultado: ✅ Ganhou (mesmo grupo)

---

## 📊 Exemplos Práticos

### Exemplo 1: Dupla de Grupo - "Para cada palpite"

**Aposta**:
- Modalidade: Dupla de Grupo
- Palpites: [12-13, 14-15, 16-17]
- Posição: 1º ao 3º
- Valor digitado: R$ 10,00
- Divisão: "Para cada palpite"

**Cálculos**:
```
Quantidade de palpites: 3
Valor por palpite: R$ 10,00
Valor total: R$ 10,00 × 3 = R$ 30,00

Quantidade de posições: 3 (1º, 2º, 3º)
Unidades por palpite: 1 × 3 = 3
Valor unitário: R$ 10,00 ÷ 3 = R$ 3,33

Cotação: 16x
Prêmio por unidade: R$ 3,33 × 16 = R$ 53,33
```

**Resultado**: Se acertar 1 palpite nas 3 posições:
```
Acertos: 3 unidades
Prêmio total: 3 × R$ 53,33 = R$ 160,00
```

### Exemplo 2: Milhar - "Para todos os palpites"

**Aposta**:
- Modalidade: Milhar
- Palpites: ["1234", "5678", "9012"]
- Posição: 1º ao 5º
- Valor digitado: R$ 30,00
- Divisão: "Para todos os palpites"

**Cálculos**:
```
Quantidade de palpites: 3
Valor total: R$ 30,00
Valor por palpite: R$ 30,00 ÷ 3 = R$ 10,00

Quantidade de posições: 5 (1º ao 5º)
Unidades por palpite: 1 × 5 = 5
Valor unitário: R$ 10,00 ÷ 5 = R$ 2,00

Cotação: 6000x
Prêmio por unidade: R$ 2,00 × 6000 = R$ 12.000,00
```

**Resultado**: Se acertar 1 milhar em 1 posição:
```
Acertos: 1 unidade
Prêmio total: 1 × R$ 12.000,00 = R$ 12.000,00
```

### Exemplo 3: Dezena Invertida - "Para cada palpite"

**Aposta**:
- Modalidade: Dezena Invertida
- Palpites: ["23", "45"]
- Posição: 1º ao 5º
- Valor digitado: R$ 10,00
- Divisão: "Para cada palpite"

**Cálculos**:
```
Quantidade de palpites: 2
Valor por palpite: R$ 10,00
Valor total: R$ 10,00 × 2 = R$ 20,00

Permutações de "23": ["23", "32"] = 2
Permutações de "45": ["45", "54"] = 2

Quantidade de posições: 5
Unidades por palpite "23": 2 × 5 = 10
Unidades por palpite "45": 2 × 5 = 10

Valor unitário "23": R$ 10,00 ÷ 10 = R$ 1,00
Valor unitário "45": R$ 10,00 ÷ 10 = R$ 1,00

Cotação: 60x
Prêmio por unidade: R$ 1,00 × 60 = R$ 60,00
```

**Resultado**: Se acertar "23" em 2 posições e "45" em 1 posição:
```
Acertos "23": 2 unidades × R$ 60,00 = R$ 120,00
Acertos "45": 1 unidade × R$ 60,00 = R$ 60,00
Prêmio total: R$ 180,00
```

---

## 📈 Tabela de Cotações

### Cotações Dinâmicas (de `MODALITIES`)

| Modalidade | Cotação |
|------------|---------|
| Grupo | 1x R$ 18.00 |
| Dupla de Grupo | 1x R$ 16.00 |
| Terno de Grupo | 1x R$ 150.00 |
| Quadra de Grupo | 1x R$ 1000.00 |
| Dezena | 1x R$ 60.00 |
| Centena | 1x R$ 600.00 |
| Milhar | 1x R$ 6000.00 |
| Dezena Invertida | 1x R$ 60.00 |
| Centena Invertida | 1x R$ 600.00 |
| Milhar Invertida | 1x R$ 6000.00 |
| Milhar/Centena | 1x R$ 3300.00 |
| Passe vai | 1x R$ 90.00 |
| Passe vai e vem | 1x R$ 90.00 |

### Tabela de Odds Fixa (Fallback)

A tabela fixa é usada quando a cotação dinâmica não está disponível. Os valores variam conforme a posição:

**Exemplo - Dupla de Grupo**:
- 1º: 180x
- 1º-3º: 180x
- 1º-5º: 180x
- 1º-7º: 180x

**Exemplo - Milhar**:
- 1º: 5000x
- 1º-3º: 5000x
- 1º-5º: 5000x

---

## 🔍 Fluxo Completo de Liquidação

### Passo 1: Buscar Apostas Pendentes
```typescript
apostasPendentes = buscarApostasComStatus('pendente')
```

### Passo 2: Buscar Resultados Oficiais
```typescript
resultados = buscarResultadosOficiais(loteria, data, horario)
```

### Passo 3: Para Cada Aposta

#### 3.1. Verificar Horário de Apuração
```typescript
if (!jaPassouHorarioApuracao(extracaoId, dataConcurso, horarioAposta)) {
  // Pular aposta - ainda não passou o horário
  continue
}
```

#### 3.2. Filtrar Resultados
```typescript
resultadosFiltrados = filtrarPorLoteria(resultados, loteriaAposta)
resultadosFiltrados = filtrarPorData(resultadosFiltrados, dataAposta)
resultadosFiltrados = filtrarPorHorario(resultadosFiltrados, horarioAposta)
```

#### 3.3. Converter Resultados
```typescript
milhares = extrairMilhares(resultadosFiltrados)
grupos = milhares.map(m => milharParaGrupo(m))
```

#### 3.4. Conferir Cada Palpite

**Para modalidades numéricas**:
```typescript
conferencia = conferirNumero(
  milhares,
  numeroApostado,
  modalidade,
  pos_from,
  pos_to
)
```

**Para modalidades de grupo**:
```typescript
conferencia = conferirGrupo(
  milhares,
  gruposApostados,
  modalidade,
  pos_from,
  pos_to
)
```

#### 3.5. Calcular Prêmio
```typescript
odd = buscarOdd(modalidade, pos_from, pos_to, modalityName)
valorUnitario = calcularValorUnitario(valorPorPalpite, unidades)
premioUnidade = odd × valorUnitario
premioTotal = conferencia.hits × premioUnidade
```

#### 3.6. Atualizar Status
```typescript
if (premioTotal > 0) {
  status = 'liquidado'
  // Creditar prêmio na carteira
} else {
  status = 'perdida'
}
```

---

## ⚠️ Regras Importantes

### Validações

1. **Saldo Insuficiente**: O sistema valida se o usuário tem saldo suficiente antes de criar a aposta
2. **Horário de Apuração**: Apostas só são liquidadas após o horário de apuração (`closeTime`)
3. **Posição Obrigatória**: O usuário deve selecionar uma posição antes de confirmar
4. **Limites de Dígitos**: 
   - Dezena: apenas 2 dígitos
   - Centena: apenas 3 dígitos
   - Milhar: apenas 4 dígitos

### Comportamentos Especiais

1. **Apostas Instantâneas**: São liquidadas imediatamente após criação
2. **Apostas Normais**: Ficam pendentes até serem liquidadas pelo cron job
3. **Múltiplas Extrações**: Sistema identifica extração correta usando horário da aposta
4. **Fuso Horário**: Todas as comparações usam horário de Brasília (GMT-3)

---

## 📝 Notas Técnicas

### Estrutura de Dados

```typescript
interface BetData {
  modality: string
  modalityName: string
  animalBets?: number[][]  // Para modalidades de grupo
  numberBets?: string[]    // Para modalidades numéricas
  position: string         // Ex: "1-5", "1st"
  customPositionValue?: string  // Ex: "1-3", "7"
  amount: number           // Valor digitado pelo usuário
  divisionType: 'all' | 'each'
}
```

### Funções Principais

- `calcularValorTotalAposta()`: Calcula valor total a ser debitado
- `calcularValorPorPalpite()`: Calcula valor por palpite individual
- `conferirPalpite()`: Confere se palpite ganhou
- `buscarCotacaoDinamica()`: Busca cotação da configuração
- `buscarOdd()`: Busca multiplicador (dinâmico ou fixo)
- `jaPassouHorarioApuracao()`: Verifica se já pode liquidar

---

## 🔗 Referências

- **Arquivo de Regras**: `/docs/manual-regras-backend.md`
- **Motor de Regras**: `/lib/bet-rules-engine.ts`
- **Parser de Posições**: `/lib/position-parser.ts`
- **Dados de Modalidades**: `/data/modalities.ts`
- **Dados de Animais**: `/data/animals.ts`

---

**Última atualização:** 14 de Janeiro de 2026
