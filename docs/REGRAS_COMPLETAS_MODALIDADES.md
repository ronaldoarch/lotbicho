# 📚 Regras Completas de Todas as Modalidades - Jogo do Bicho

**Última atualização:** 15 de Janeiro de 2026

Este documento contém **todas as regras, cálculos e posições** para cada modalidade do sistema, incluindo a diferença entre "Para cada palpite" e "Para todos os palpites".

---

## 📋 Índice

1. [Conceitos Fundamentais](#conceitos-fundamentais)
2. [Divisão de Valores: "Para cada" vs "Para todos"](#divisão-de-valores-para-cada-vs-para-todos)
3. [Fórmula Padrão de Cálculo](#fórmula-padrão-de-cálculo)
4. [Tabela de Grupos e Dezenas](#tabela-de-grupos-e-dezenas)
5. [Modalidades de Grupo](#modalidades-de-grupo)
6. [Modalidades de Número](#modalidades-de-número)
7. [Modalidades Invertidas](#modalidades-invertidas)
8. [Modalidades Especiais](#modalidades-especiais)
9. [Tabela de Odds (Multiplicadores)](#tabela-de-odds-multiplicadores)
10. [Exemplos Práticos Completos](#exemplos-práticos-completos)

---

## 🎯 Conceitos Fundamentais

### Palpite
Um **palpite** é uma combinação fechada que o usuário escolhe:
- **Grupo simples**: `Grupo 05` (Cachorro)
- **Dupla de grupo**: `01-06` (Avestruz + Cabra)
- **Terno de grupo**: `05-14-23` (Cachorro + Gato + Urso)
- **Quadra de grupo**: `01-02-03-04` (4 grupos)
- **Milhar**: `2580`
- **Dezena**: `27`
- **Centena**: `384`

### Posição
A **posição** é o intervalo de prêmios onde o palpite é válido:

| Posição | Descrição | `pos_from` | `pos_to` | `qtd_posicoes` |
|---------|-----------|------------|----------|----------------|
| 1º | Apenas 1º prêmio | 1 | 1 | 1 |
| 1º ao 3º | Do 1º ao 3º prêmio | 1 | 3 | 3 |
| 1º ao 5º | Do 1º ao 5º prêmio | 1 | 5 | 5 |
| 1º ao 7º | Do 1º ao 7º prêmio | 1 | 7 | 7 |

**Fórmula:**
```typescript
qtd_posicoes = pos_to - pos_from + 1
```

### Unidade de Aposta
Uma **unidade** é a combinação de:
- **1 combinação** do palpite × **1 posição**

**Fórmula:**
```typescript
unidades = qtd_combinacoes × qtd_posicoes
```

---

## 💰 Divisão de Valores: "Para cada" vs "Para todos"

### "Para cada palpite" (`divisionType: 'each'`)

O valor digitado é o valor de **cada palpite individual**.

**Fórmulas:**
```typescript
valor_por_palpite = valor_digitado
valor_total_jogo = valor_por_palpite × qtd_palpites
```

**Exemplo:**
- 4 palpites de R$ 10,00 cada
- Valor total do jogo = R$ 40,00

### "Para todos os palpites" (`divisionType: 'all'`)

O valor digitado é o valor **total do jogo**, dividido igualmente entre os palpites.

**Fórmulas:**
```typescript
valor_total_jogo = valor_digitado
valor_por_palpite = valor_total_jogo ÷ qtd_palpites
```

**Exemplo:**
- 4 palpites e valor digitado R$ 10,00
- Cada palpite vale R$ 2,50
- Valor total do jogo = R$ 10,00

### Comparação Visual

| Divisão | Valor Digitado | Qtd Palpites | Valor por Palpite | Valor Total |
|---------|----------------|--------------|-------------------|-------------|
| **Para cada** | R$ 10,00 | 4 | R$ 10,00 | R$ 40,00 |
| **Para todos** | R$ 10,00 | 4 | R$ 2,50 | R$ 10,00 |

**⚠️ IMPORTANTE:** A partir daqui, **todos os cálculos são feitos "por palpite"**, sempre usando `valor_por_palpite`.

---

## 📐 Fórmula Padrão de Cálculo

**Esta fórmula vale para TODAS as modalidades.**

### Passo a Passo

1. **Calcular valor por palpite** (baseado na divisão)
   ```typescript
   if (divisionType === 'each') {
     valor_por_palpite = valor_digitado
   } else {
     valor_por_palpite = valor_digitado / qtd_palpites
   }
   ```

2. **Descobrir quantas combinações o palpite gera**
   - Normal: 1 combinação
   - Invertida: depende das permutações
   - Milhar+Centena: 2×N combinações

3. **Calcular quantidade de posições**
   ```typescript
   qtd_posicoes = pos_to - pos_from + 1
   ```

4. **Calcular unidades de aposta**
   ```typescript
   unidades = qtd_combinacoes × qtd_posicoes
   ```

5. **Calcular valor unitário**
   ```typescript
   valor_unitario = valor_por_palpite / unidades
   ```

6. **Buscar odd (multiplicador) da modalidade**
   ```typescript
   odd = buscarOdd(modalidade, pos_from, pos_to)
   ```

7. **Calcular prêmio por unidade**
   ```typescript
   premio_unidade = odd × valor_unitario
   ```

8. **Conferir resultado e contar acertos**
   ```typescript
   acertos = conferirPalpite(resultado, palpite, modalidade, pos_from, pos_to)
   ```

9. **Calcular prêmio do palpite**
   ```typescript
   premio_palpite = acertos × premio_unidade
   ```

10. **Calcular prêmio total (se múltiplos palpites)**
    ```typescript
    premio_total = soma(premio_palpite_i para todos os palpites)
    ```

---

## 🐾 Tabela de Grupos e Dezenas

### Regra Fundamental

**Cada animal = 1 grupo = 4 dezenas consecutivas.**

O grupo 25 termina em 00 (inclui 97, 98, 99, 00).

### Tabela Completa

| Grupo | Animal | Dezenas |
|-------|--------|---------|
| 01 | Avestruz | 01, 02, 03, 04 |
| 02 | Águia | 05, 06, 07, 08 |
| 03 | Burro | 09, 10, 11, 12 |
| 04 | Borboleta | 13, 14, 15, 16 |
| 05 | Cachorro | 17, 18, 19, 20 |
| 06 | Cabra | 21, 22, 23, 24 |
| 07 | Carneiro | 25, 26, 27, 28 |
| 08 | Camelo | 29, 30, 31, 32 |
| 09 | Cobra | 33, 34, 35, 36 |
| 10 | Coelho | 37, 38, 39, 40 |
| 11 | Cavalo | 41, 42, 43, 44 |
| 12 | Elefante | 45, 46, 47, 48 |
| 13 | Galo | 49, 50, 51, 52 |
| 14 | Gato | 53, 54, 55, 56 |
| 15 | Jacaré | 57, 58, 59, 60 |
| 16 | Leão | 61, 62, 63, 64 |
| 17 | Macaco | 65, 66, 67, 68 |
| 18 | Porco | 69, 70, 71, 72 |
| 19 | Pavão | 73, 74, 75, 76 |
| 20 | Peru | 77, 78, 79, 80 |
| 21 | Touro/Boi | 81, 82, 83, 84 |
| 22 | Tigre | 85, 86, 87, 88 |
| 23 | Urso | 89, 90, 91, 92 |
| 24 | Veado | 93, 94, 95, 96 |
| 25 | Vaca | 97, 98, 99, 00 |

### Funções de Conversão

```typescript
// Dezena → Grupo
function dezenaParaGrupo(dezena: number): number {
  if (dezena === 0) return 25 // 00 pertence ao grupo 25
  return Math.floor((dezena - 1) / 4) + 1
}

// Milhar → Grupo
function milharParaGrupo(milhar: number): number {
  const dezena = milhar % 100 // Últimos 2 dígitos
  return dezenaParaGrupo(dezena)
}
```

**Exemplos:**
- Dezena `01` → Grupo `01` (Avestruz)
- Dezena `21` → Grupo `06` (Cabra)
- Dezena `00` → Grupo `25` (Vaca)
- Milhar `4321` → Dezena `21` → Grupo `06` (Cabra)
- Milhar `1297` → Dezena `97` → Grupo `25` (Vaca)

---

## 🎯 Modalidades de Grupo

### 1. Grupo Simples

**Palpite:** 1 grupo (ex.: Grupo 05 - Cachorro)

**Combinações:** 1

**Posições permitidas:** 1º, 1º-3º, 1º-5º, 1º-7º

**Acerto:** O grupo aparece em qualquer posição do intervalo escolhido

**Cálculo:**
```typescript
qtd_combinacoes = 1
qtd_posicoes = pos_to - pos_from + 1
unidades = 1 × qtd_posicoes
valor_unitario = valor_por_palpite / unidades
premio_unidade = odd_grupo × valor_unitario
```

**Conferência:**
- Converter cada prêmio (milhar) → grupo usando `milharParaGrupo()`
- Verificar se o grupo apostado aparece no intervalo de posições
- **Acertos:** 1 se apareceu, 0 se não apareceu

**Exemplo:**
- Palpite: Grupo 05 (Cachorro)
- Valor por palpite: R$ 10,00
- Posição: 1º ao 5º
- Odd grupo 1-5: 18x

```typescript
qtd_combinacoes = 1
qtd_posicoes = 5
unidades = 1 × 5 = 5
valor_unitario = 10.00 / 5 = 2.00
premio_unidade = 18 × 2.00 = 36.00

// Resultado: grupos [06, 23, 01, 25, 15]
// Grupo 05 não apareceu → acertos = 0 → premio = 0
```

---

### 2. Dupla de Grupo

**Palpite:** 2 grupos fixos (ex.: Grupo 01 + Grupo 06)

**Combinações:** 1 (a dupla é fixa, não combinada)

**Posições permitidas:** 1º, 1º-3º, 1º-5º, 1º-7º

**Acerto:** Os dois grupos precisam aparecer dentro do intervalo, em qualquer ordem

**Cálculo:**
```typescript
qtd_combinacoes = 1
qtd_posicoes = pos_to - pos_from + 1
unidades = 1 × qtd_posicoes
valor_unitario = valor_por_palpite / unidades
premio_unidade = odd_dupla × valor_unitario
```

**Conferência:**
1. Converter cada prêmio → grupo
2. Verificar se grupo 01 aparece pelo menos 1 vez
3. Verificar se grupo 06 aparece pelo menos 1 vez
4. Se ambos aparecerem → dupla acertou (acertos = 1)

**Exemplo:**
- Palpite: Dupla grupos 01 e 06
- Valor por palpite: R$ 10,00
- Posição: 1º ao 5º
- Odd dupla 1-5: 180x

```typescript
qtd_combinacoes = 1
qtd_posicoes = 5
unidades = 5
valor_unitario = 10.00 / 5 = 2.00
premio_unidade = 180 × 2.00 = 360.00

// Resultado: grupos [06, 23, 01, 25, 15]
// Grupo 01 apareceu (posição 3) ✓
// Grupo 06 apareceu (posição 1) ✓
// Dupla acertou → acertos = 1 → premio = 360.00
```

---

### 3. Terno de Grupo

**Palpite:** 3 grupos fixos (ex.: Grupos 05, 14, 23)

**Combinações:** 1

**Posições permitidas:** 1º, 1º-3º, 1º-5º, 1º-7º

**Acerto:** Os 3 grupos precisam aparecer dentro do intervalo, em qualquer ordem

**Cálculo:**
```typescript
qtd_combinacoes = 1
qtd_posicoes = pos_to - pos_from + 1
unidades = qtd_posicoes
valor_unitario = valor_por_palpite / unidades
premio_unidade = odd_terno × valor_unitario
```

**Conferência:**
- Verificar se todos os 3 grupos aparecem no intervalo
- Se todos aparecerem → terno acertou (acertos = 1)

**Exemplo:**
- Palpite: Terno grupos 05, 14, 23
- Valor por palpite: R$ 10,00
- Posição: 1º ao 5º
- Odd terno 1-5: 1800x

```typescript
qtd_combinacoes = 1
qtd_posicoes = 5
unidades = 5
valor_unitario = 10.00 / 5 = 2.00
premio_unidade = 1800 × 2.00 = 3600.00

// Resultado: grupos [06, 23, 01, 25, 15]
// Grupo 05 não apareceu ✗
// Grupo 14 não apareceu ✗
// Grupo 23 apareceu (posição 2) ✓
// Terno não acertou → premio = 0
```

---

### 4. Quadra de Grupo

**Palpite:** 4 grupos fixos (ex.: Grupos 01, 02, 03, 04)

**Combinações:** 1

**Posições permitidas:** 1º, 1º-3º, 1º-5º, 1º-7º

**Acerto:** Os 4 grupos precisam aparecer dentro do intervalo, em qualquer ordem

**Cálculo:**
```typescript
qtd_combinacoes = 1
qtd_posicoes = pos_to - pos_from + 1
unidades = qtd_posicoes
valor_unitario = valor_por_palpite / unidades
premio_unidade = odd_quadra × valor_unitario
```

**Conferência:**
- Verificar se todos os 4 grupos aparecem no intervalo
- Se todos aparecerem → quadra acertou (acertos = 1)

**Exemplo:**
- Palpite: Quadra grupos 01, 06, 15, 25
- Valor por palpite: R$ 10,00
- Posição: 1º ao 5º
- Odd quadra 1-5: 5000x

```typescript
qtd_combinacoes = 1
qtd_posicoes = 5
unidades = 5
valor_unitario = 10.00 / 5 = 2.00
premio_unidade = 5000 × 2.00 = 10000.00

// Resultado: grupos [06, 23, 01, 25, 15]
// Todos os 4 grupos apareceram ✓
// Quadra acertou → acertos = 1 → premio = 10000.00
```

---

## 🔢 Modalidades de Número

### 1. Dezena Normal

**Palpite:** Número de 2 dígitos (00-99)

**Combinações:** 1

**Posições permitidas:** 1º, 1º-3º, 1º-5º, 1º-7º

**Acerto:** Os 2 últimos dígitos do prêmio naquela posição = dezena apostada

**Cálculo:**
```typescript
qtd_combinacoes = 1
qtd_posicoes = pos_to - pos_from + 1
unidades = 1 × qtd_posicoes
valor_unitario = valor_por_palpite / unidades
premio_unidade = odd_dezena × valor_unitario
```

**Conferência:**
- Extrair os 2 últimos dígitos de cada prêmio no intervalo
- Verificar se alguma dezena bate com a apostada
- **Acertos:** Quantidade de posições onde a dezena apareceu

**Exemplo:**
- Palpite: Dezena `27`
- Valor por palpite: R$ 10,00
- Posição: 1º ao 5º
- Odd dezena 1-5: 60x

```typescript
qtd_combinacoes = 1
qtd_posicoes = 5
unidades = 5
valor_unitario = 10.00 / 5 = 2.00
premio_unidade = 60 × 2.00 = 120.00

// Resultado: [4321, 0589, 7727, 1297, 5060]
// Dezenas: [21, 89, 27, 97, 60]
// Dezena 27 apareceu na posição 3 → acertos = 1 → premio = 120.00
```

---

### 2. Centena Normal

**Palpite:** Número de 3 dígitos (000-999)

**Combinações:** 1

**Posições permitidas:** 1º, 1º-3º, 1º-5º, 1º-7º

**Acerto:** 3 últimos dígitos do prêmio = centena apostada

**Cálculo:** Mesma fórmula da dezena, mudando só a odd

**Exemplo:**
- Palpite: Centena `384`
- Valor por palpite: R$ 10,00
- Posição: 1º ao 5º
- Odd centena 1-5: 600x

```typescript
qtd_combinacoes = 1
qtd_posicoes = 5
unidades = 5
valor_unitario = 10.00 / 5 = 2.00
premio_unidade = 600 × 2.00 = 1200.00

// Resultado: [4321, 0589, 7384, 1297, 5060]
// Centenas: [321, 589, 384, 297, 060]
// Centena 384 apareceu na posição 3 → acertos = 1 → premio = 1200.00
```

---

### 3. Milhar Normal

**Palpite:** Número de 4 dígitos (0000-9999)

**Combinações:** 1

**Posições permitidas:** 1º, 1º-3º, 1º-5º (máximo até 5º)

**Acerto:** 4 dígitos do prêmio = milhar apostada

**Cálculo:**
```typescript
qtd_combinacoes = 1
qtd_posicoes = pos_to - pos_from + 1
unidades = 1 × qtd_posicoes
valor_unitario = valor_por_palpite / unidades
premio_unidade = odd_milhar × valor_unitario
```

**Exemplo:**
- Palpite: Milhar `2580`
- Valor por palpite: R$ 10,00
- Posição: 1º ao 5º
- Odd milhar 1-5: 5000x

```typescript
qtd_combinacoes = 1
qtd_posicoes = 5
unidades = 5
valor_unitario = 10.00 / 5 = 2.00
premio_unidade = 5000 × 2.00 = 10000.00

// Resultado: [4321, 0589, 2580, 1297, 5060]
// Milhar 2580 apareceu na posição 3 → acertos = 1 → premio = 10000.00
```

---

### 4. Milhar/Centena (Modalidade Combinada)

**Palpite:** Número de 4 dígitos (ex.: `1236`)

**Regra:** Cada número gera:
- 1 chance na milhar (4 dígitos)
- 1 chance na centena (3 últimos dígitos)

**Com N números, você tem 2N combinações** (N milhares + N centenas) por posição.

**Cálculo:**
```typescript
qtd_numeros = numeros_apostados.length
qtd_combinacoes = 2 × qtd_numeros  // 1 milhar + 1 centena por número
qtd_posicoes = pos_to - pos_from + 1
unidades = qtd_combinacoes × qtd_posicoes
valor_unitario = valor_por_palpite / unidades
```

**Na hora de conferir:**
- Se acertar pela milhar → usa `odd_milhar_milharcentena`
- Se acertar pela centena → usa `odd_centena_milharcentena`

**Exemplo:**
- 3 números: `1236`, `9874`, `0852`
- Valor por palpite: R$ 10,00
- Posição: 1º ao 5º
- Odd milhar/centena 1-5: 3300x

```typescript
qtd_numeros = 3
qtd_combinacoes = 2 × 3 = 6  // 3 milhares + 3 centenas
qtd_posicoes = 5
unidades = 6 × 5 = 30
valor_unitario = 10.00 / 30 = 0.333...
premio_unidade = 3300 × 0.333... = 1100.00

// Se acertar 1 milhar → acertos = 1 → premio = 1100.00
```

---

## 🔄 Modalidades Invertidas

### Quantidade de Combinações

As modalidades invertidas geram múltiplas combinações através de permutações:

**Dezena (2 dígitos):**
- Dígitos diferentes (`27`) → 2 combinações (`27`, `72`)
- Dígitos iguais (`22`) → 1 combinação

**Centena (3 dígitos):**
- Todos diferentes (`384`) → 6 combinações (`384`, `348`, `438`, `483`, `834`, `843`)
- Dois iguais (`337`) → 3 combinações (`337`, `373`, `733`)
- Três iguais (`777`) → 1 combinação

**Milhar (4 dígitos):**
- 4 diferentes (`2580`) → 24 combinações
- 1 par (`2208`) → 12 combinações
- 2 pares (`2277`) → 6 combinações
- 3 iguais (`3331`) → 4 combinações
- 4 iguais (`7777`) → 1 combinação

**Função:**
```typescript
function contarPermutacoesDistintas(numero: string): number {
  // Gera todas as permutações e conta as distintas
  const digits = numero.split('')
  const seen = new Set<string>()
  // ... algoritmo de permutação ...
  return seen.size
}
```

### 1. Dezena Invertida

**Palpite:** Número de 2 dígitos (00-99)

**Combinações:** Depende das permutações distintas

**Posições permitidas:** 1º, 1º-3º, 1º-5º, 1º-7º

**Acerto:** Se qualquer uma das combinações bater naquela posição

**Cálculo:**
```typescript
qtd_combinacoes = contarPermutacoesDistintas(numero)
qtd_posicoes = pos_to - pos_from + 1
unidades = qtd_combinacoes × qtd_posicoes
valor_unitario = valor_por_palpite / unidades
premio_unidade = odd_dezena_invertida × valor_unitario
```

**Exemplo:**
- Palpite: Dezena invertida `27` (2 combinações: `27`, `72`)
- Valor por palpite: R$ 10,00
- Posição: 1º ao 5º
- Odd dezena invertida 1-5: 60x

```typescript
qtd_combinacoes = 2
qtd_posicoes = 5
unidades = 2 × 5 = 10
valor_unitario = 10.00 / 10 = 1.00
premio_unidade = 60 × 1.00 = 60.00

// Resultado: [4321, 0589, 7727, 1297, 5060]
// Dezenas: [21, 89, 27, 97, 60]
// Dezena 27 apareceu na posição 3 → acertos = 1 → premio = 60.00
```

---

### 2. Centena Invertida

**Palpite:** Número de 3 dígitos (000-999)

**Combinações:** Depende das permutações distintas

**Posições permitidas:** 1º, 1º-3º, 1º-5º, 1º-7º

**Cálculo:** Mesma estrutura da dezena invertida

**Exemplo:**
- Palpite: Centena invertida `384` (6 combinações)
- Valor por palpite: R$ 10,00
- Posição: 1º ao 5º
- Odd centena invertida 1-5: 600x

```typescript
qtd_combinacoes = 6
qtd_posicoes = 5
unidades = 6 × 5 = 30
valor_unitario = 10.00 / 30 = 0.333...
premio_unidade = 600 × 0.333... = 200.00

// Se acertar 1 combinação → acertos = 1 → premio = 200.00
```

---

### 3. Milhar Invertida

**Palpite:** Número de 4 dígitos (0000-9999)

**Combinações:** Depende das permutações distintas (máximo 24)

**Posições permitidas:** 1º, 1º-3º, 1º-5º (máximo até 5º)

**Cálculo:**
```typescript
qtd_combinacoes = contarPermutacoesDistintas(numero)
qtd_posicoes = pos_to - pos_from + 1
unidades = qtd_combinacoes × qtd_posicoes
valor_unitario = valor_por_palpite / unidades
premio_unidade = odd_milhar_invertida × valor_unitario
```

**Exemplo:**
- Palpite: Milhar invertida `2580` (24 combinações)
- Valor por palpite: R$ 10,00
- Posição: 1º ao 5º
- Odd milhar invertida 1-5: 200x

```typescript
qtd_combinacoes = 24
qtd_posicoes = 5
unidades = 24 × 5 = 120
valor_unitario = 10.00 / 120 = 0.0833...
premio_unidade = 200 × 0.0833... = 16.666...

// Se acertar 1 combinação → acertos = 1 → premio = 16.67
```

---

## 🎲 Modalidades Especiais

### 1. Passe Vai (Normal)

**Palpite:** 2 grupos, com ordem específica (ex.: Grupo 05 no 1º e Grupo 14 no 2º)

**Combinações:** 1

**Posições:** Fixo 1º-2º (não pode escolher)

**Acerto:** O grupo A no 1º prêmio E o grupo B no 2º prêmio, nessa ordem exata

**Cálculo:**
```typescript
qtd_combinacoes = 1
qtd_posicoes = 1  // É uma combinação fixa (1→2)
unidades = 1
valor_unitario = valor_por_palpite  // Tudo em uma unidade só
premio_unidade = odd_passe × valor_unitario
```

**Exemplo:**
- Palpite: Passe 05 → 14 (Cachorro no 1º, Gato no 2º)
- Valor por palpite: R$ 10,00
- Odd passe: 300x

```typescript
qtd_combinacoes = 1
qtd_posicoes = 1
unidades = 1
valor_unitario = 10.00
premio_unidade = 300 × 10.00 = 3000.00

// Resultado:
// 1º prêmio: grupo 05 ✓
// 2º prêmio: grupo 14 ✓
// Passe acertou → acertos = 1 → premio = 3000.00
```

---

### 2. Passe Vai e Vem

**Palpite:** 2 grupos, ordem não importa

**Combinações:** 1 (mas aceita ambas as ordens)

**Posições:** Fixo 1º-2º

**Acerto:** Os dois grupos aparecem nas posições 1º e 2º, em qualquer ordem

**Cálculo:** Mesma estrutura do passe normal, mas a odd geralmente é metade

**Exemplo:**
- Palpite: Passe vai-e-vem 05 ↔ 14
- Valor por palpite: R$ 10,00
- Odd passe vai-e-vem: 150x

```typescript
qtd_combinacoes = 1
qtd_posicoes = 1
unidades = 1
valor_unitario = 10.00
premio_unidade = 150 × 10.00 = 1500.00

// Resultado:
// 1º prêmio: grupo 14 ✓
// 2º prêmio: grupo 05 ✓
// Passe vai-e-vem acertou (ordem inversa) → premio = 1500.00
```

---

## 📊 Tabela de Odds (Multiplicadores)

### Odds por Modalidade e Posição

| Modalidade | 1º | 1º-3º | 1º-5º | 1º-7º |
|------------|----|----|----|----|
| **Grupo** | 18x | 18x | 18x | 18x |
| **Dupla de Grupo** | 180x | 180x | 180x | 180x |
| **Terno de Grupo** | 1800x | 1800x | 1800x | 1800x |
| **Quadra de Grupo** | 5000x | 5000x | 5000x | 5000x |
| **Dezena** | 60x | 60x | 60x | 60x |
| **Centena** | 600x | 600x | 600x | 600x |
| **Milhar** | 5000x | 5000x | 5000x | - |
| **Dezena Invertida** | 60x | 60x | 60x | 60x |
| **Centena Invertida** | 600x | 600x | 600x | 600x |
| **Milhar Invertida** | 200x | 200x | 200x | - |
| **Milhar/Centena** | 3300x | 3300x | 3300x | - |
| **Passe Vai** | - | - | - | - |
| **Passe Vai e Vem** | - | - | - | - |

**Notas:**
- Passe sempre usa posição fixa 1º-2º (odd: 300x para passe normal, 150x para vai-e-vem)
- Milhar e Milhar Invertida: máximo até 5º prêmio
- Outras modalidades podem ir até 7º prêmio

---

## 📝 Exemplos Práticos Completos

### Exemplo 1: Dupla de Grupo - "Para cada palpite"

**Cenário:**
- 2 palpites: `01-06` e `05-14`
- Valor digitado: R$ 20,00
- Divisão: **"Para cada palpite"**
- Posição: 1º ao 5º
- Odd dupla 1-5: 180x

**Cálculo:**

**Palpite 1: `01-06`**
```typescript
valor_por_palpite = 20.00  // "Para cada"
qtd_combinacoes = 1
qtd_posicoes = 5
unidades = 1 × 5 = 5
valor_unitario = 20.00 / 5 = 4.00
premio_unidade = 180 × 4.00 = 720.00

// Resultado: grupos [06, 23, 01, 25, 15]
// Ambos grupos apareceram → acertos = 1
premio_palpite_1 = 1 × 720.00 = 720.00
```

**Palpite 2: `05-14`**
```typescript
valor_por_palpite = 20.00  // "Para cada"
qtd_combinacoes = 1
qtd_posicoes = 5
unidades = 5
valor_unitario = 4.00
premio_unidade = 720.00

// Resultado: grupos [06, 23, 01, 25, 15]
// Grupo 05 não apareceu, grupo 14 não apareceu → acertos = 0
premio_palpite_2 = 0 × 720.00 = 0.00
```

**Total:**
```typescript
valor_total_jogo = 20.00 × 2 = 40.00
premio_total = 720.00 + 0.00 = 720.00
```

---

### Exemplo 2: Dupla de Grupo - "Para todos os palpites"

**Cenário:**
- 2 palpites: `01-06` e `05-14`
- Valor digitado: R$ 20,00
- Divisão: **"Para todos os palpites"**
- Posição: 1º ao 5º
- Odd dupla 1-5: 180x

**Cálculo:**

**Palpite 1: `01-06`**
```typescript
valor_total_jogo = 20.00  // "Para todos"
valor_por_palpite = 20.00 / 2 = 10.00
qtd_combinacoes = 1
qtd_posicoes = 5
unidades = 5
valor_unitario = 10.00 / 5 = 2.00
premio_unidade = 180 × 2.00 = 360.00

// Resultado: grupos [06, 23, 01, 25, 15]
// Ambos grupos apareceram → acertos = 1
premio_palpite_1 = 1 × 360.00 = 360.00
```

**Palpite 2: `05-14`**
```typescript
valor_por_palpite = 10.00  // Dividido igualmente
qtd_combinacoes = 1
qtd_posicoes = 5
unidades = 5
valor_unitario = 2.00
premio_unidade = 360.00

// Resultado: grupos [06, 23, 01, 25, 15]
// Grupo 05 não apareceu, grupo 14 não apareceu → acertos = 0
premio_palpite_2 = 0 × 360.00 = 0.00
```

**Total:**
```typescript
valor_total_jogo = 20.00
premio_total = 360.00 + 0.00 = 360.00
```

---

### Exemplo 3: Milhar Invertida - "Para cada palpite"

**Cenário:**
- Palpite: Milhar invertida `2580` (24 combinações)
- Valor digitado: R$ 10,00
- Divisão: **"Para cada palpite"**
- Posição: 1º ao 5º
- Odd milhar invertida 1-5: 200x

**Cálculo:**
```typescript
valor_por_palpite = 10.00
qtd_combinacoes = 24  // Permutações distintas de 2580
qtd_posicoes = 5
unidades = 24 × 5 = 120
valor_unitario = 10.00 / 120 = 0.0833...
premio_unidade = 200 × 0.0833... = 16.666...

// Resultado: [4321, 0589, 2580, 1297, 5060]
// Milhar 2580 apareceu na posição 3 → acertos = 1
premio_palpite = 1 × 16.666... = 16.67
```

---

### Exemplo 4: Quadra de Grupo - Comparação "Para cada" vs "Para todos"

**Cenário:**
- Palpite: Quadra grupos `01, 06, 15, 25`
- Valor digitado: R$ 10,00
- Posição: 1º ao 5º
- Odd quadra 1-5: 5000x
- Resultado: grupos [06, 23, 01, 25, 15] (todos apareceram)

**"Para cada palpite":**
```typescript
valor_por_palpite = 10.00
qtd_combinacoes = 1
qtd_posicoes = 5
unidades = 5
valor_unitario = 10.00 / 5 = 2.00
premio_unidade = 5000 × 2.00 = 10000.00
acertos = 1
premio = 10000.00
```

**"Para todos os palpites" (com 2 palpites):**
```typescript
valor_total_jogo = 10.00
valor_por_palpite = 10.00 / 2 = 5.00
qtd_combinacoes = 1
qtd_posicoes = 5
unidades = 5
valor_unitario = 5.00 / 5 = 1.00
premio_unidade = 5000 × 1.00 = 5000.00
acertos = 1
premio_por_palpite = 5000.00
premio_total = 5000.00 × 2 = 10000.00  // Se ambos acertarem
```

---

## 📋 Resumo Rápido

### Fórmulas Essenciais

```typescript
// 1. Valor por palpite
valor_por_palpite = (divisionType === 'each') 
  ? valor_digitado 
  : valor_digitado / qtd_palpites

// 2. Quantidade de posições
qtd_posicoes = pos_to - pos_from + 1

// 3. Unidades
unidades = qtd_combinacoes × qtd_posicoes

// 4. Valor unitário
valor_unitario = valor_por_palpite / unidades

// 5. Prêmio por unidade
premio_unidade = odd × valor_unitario

// 6. Prêmio do palpite
premio_palpite = acertos × premio_unidade

// 7. Prêmio total
premio_total = soma(premio_palpite_i)
```

### Regras Importantes

1. **"Para cada"**: Valor digitado é por palpite → `valor_por_palpite = valor_digitado`
2. **"Para todos"**: Valor digitado é total → `valor_por_palpite = valor_digitado / qtd_palpites`
3. **Unidades**: Sempre `combinações × posições`
4. **Acertos**: Depende da modalidade (1 para grupos múltiplos, quantidade para números)
5. **Odds**: Consultar tabela por modalidade e posição

---

## 🔗 Referências

- **Motor de Regras**: `/lib/bet-rules-engine.ts`
- **Manual de Regras**: `/docs/manual-regras-backend.md`
- **Parser de Posições**: `/lib/position-parser.ts`
- **Modalidades**: `/data/modalities.ts`

---

**Última atualização:** 15 de Janeiro de 2026
