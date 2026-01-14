# Manual Oficial de Regras - Backend Jogo do Bicho

## Índice

1. [Conceitos Gerais](#1-conceitos-gerais)
2. [Tabela de Grupos e Dezenas](#2-tabela-de-grupos-e-dezenas)
3. [Fórmula Padrão](#3-fórmula-padrão)
4. [Modalidades de Número](#4-modalidades-de-número)
5. [Modalidades de Grupo](#5-modalidades-de-grupo)
6. [Passe](#6-passe)
7. [Instantânea](#7-instantânea)
8. [Funções Auxiliares Python](#8-funções-auxiliares-python)

---

## 1. Conceitos Gerais

### 1.1. Palpite

**Palpite** = uma combinação fechada que o usuário escolhe.

**Exemplos:**
- Grupo simples: `grupo 05` (Cachorro)
- Dupla de grupo: `01-02-03-04` (4 grupos)
- Terno de grupo: `05-14-23` (3 grupos)
- Quadra de grupo: `01-02-03-04` (4 grupos)
- Milhar: `2580`
- Milhar invertida: `2580` (gera 24 combinações)
- Dezena: `27`
- Centena: `384`

Cada "etiqueta" amarela na interface (ex.: `01-02-03-04`, `03-04-05-06`) representa **um palpite**.

### 1.2. Posição

**Posição** é o intervalo de prêmios onde aquele palpite é válido.

**Opções disponíveis:**
- `1º` prêmio
- `1º ao 3º` prêmios
- `1º ao 5º` prêmios
- `1º ao 7º` prêmios (onde a modalidade permitir)

**No backend usamos:**
```python
pos_from = primeiro_prêmio_do_intervalo  # ex.: 1
pos_to   = último_prêmio_do_intervalo     # ex.: 5
qtd_posicoes = pos_to - pos_from + 1      # ex.: 5 - 1 + 1 = 5
```

### 1.3. Divisão do Valor entre Palpites

Quando o usuário digita o valor e escolhe a divisão:

#### "Para cada palpite"

O valor digitado é o valor de **cada palpite**.

**Exemplo:**
- 4 palpites de R$ 1,00 cada
- Valor total do jogo = R$ 4,00

**Fórmula:**
```python
valor_por_palpite = valor_digitado
valor_total_jogo  = valor_por_palpite * qtd_palpites
```

#### "Para todos os palpites"

O valor digitado é o valor **total daquele jogo**.

O sistema divide igualmente entre os palpites.

**Exemplo:**
- 4 palpites e valor digitado R$ 1,00
- Cada palpite vale R$ 0,25

**Fórmula:**
```python
valor_total_jogo  = valor_digitado
valor_por_palpite = valor_total_jogo / qtd_palpites
```

**A partir daqui, tudo é calculado "por palpite", sempre usando `valor_por_palpite`.**

---

## 2. Tabela de Grupos e Dezenas

### 2.1. Regra Fundamental

**Cada animal = 1 grupo = 4 dezenas consecutivas.**

O grupo 25 termina em 00 (inclui 97, 98, 99, 00).

### 2.2. Tabela Completa

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

### 2.3. Função de Conversão Dezena → Grupo

```python
def dezena_para_grupo(dezena: int) -> int:
    """
    Converte uma dezena (00-99) para o grupo correspondente (1-25).
    
    Args:
        dezena: Número de 0 a 99 (00 = 0)
    
    Returns:
        Grupo de 1 a 25
    """
    if dezena == 0:  # 00
        return 25
    
    # Fórmula: ceil(dezena / 4) ou ((dezena - 1) // 4) + 1
    return ((dezena - 1) // 4) + 1
```

**Exemplos:**
- Dezena `01` → Grupo `01` (Avestruz)
- Dezena `21` → Grupo `06` (Cabra)
- Dezena `00` → Grupo `25` (Vaca)
- Dezena `97` → Grupo `25` (Vaca)

### 2.4. Função de Conversão Milhar → Grupo

```python
def milhar_para_grupo(milhar: int) -> int:
    """
    Extrai a dezena de um milhar e retorna o grupo.
    
    Args:
        milhar: Número de 0000 a 9999
    
    Returns:
        Grupo de 1 a 25
    """
    dezena = milhar % 100  # Últimos 2 dígitos
    return dezena_para_grupo(dezena)
```

**Exemplos:**
- Milhar `4321` → Dezena `21` → Grupo `06` (Cabra)
- Milhar `0589` → Dezena `89` → Grupo `23` (Urso)
- Milhar `7704` → Dezena `04` → Grupo `01` (Avestruz)
- Milhar `1297` → Dezena `97` → Grupo `25` (Vaca)

---

## 3. Fórmula Padrão

**Esta fórmula vale para TODAS as modalidades.**

### 3.1. Passos de Cálculo

Para qualquer modalidade:

1. **Descobrir quantas combinações aquele palpite gera**
   - Normal: 1 combinação
   - Invertida: depende das permutações
   - Milhar+Centena: 2×N combinações

2. **Descobrir quantas posições o usuário escolheu**
   ```python
   qtd_posicoes = pos_to - pos_from + 1
   ```

3. **Calcular unidades de aposta**
   ```python
   unidades = qtd_combinacoes * qtd_posicoes
   ```

4. **Calcular valor unitário**
   ```python
   valor_unitario = valor_por_palpite / unidades
   ```

5. **Buscar odd da modalidade + faixa de posição**
   ```python
   # Exemplo: ODD[("MILHAR", "1-1")] ou ODD[("QUADRA_GRUPO", "1-5")]
   odd = buscar_odd(modalidade, pos_from, pos_to)
   ```

6. **Calcular prêmio por unidade que acerta**
   ```python
   premio_unidade = odd * valor_unitario
   ```

7. **Contar quantas unidades acertaram**
   ```python
   acertos = numero_de_unidades_vencedoras
   ```

8. **Calcular prêmio do palpite**
   ```python
   premio_palpite = acertos * premio_unidade
   ```

9. **Se o bilhete tiver vários palpites**
   ```python
   premio_total_bilhete = sum(premio_palpite_i for i in palpites)
   ```

---

## 4. Modalidades de NÚMERO

### 4.1. Dezena Normal

**Entrada:** Número de 2 dígitos (00-99)

**Combinações:** Sempre 1 (não tem invertida)

**Posições:** Até 7º prêmio (dependendo da regra da banca)

**Acerto:** Os 2 últimos dígitos do prêmio naquela posição = dezena apostada

**Cálculo:**
```python
qtd_combinacoes = 1
qtd_posicoes = pos_to - pos_from + 1
unidades = 1 * qtd_posicoes
valor_unitario = valor_palpite / unidades
premio_unidade = odd_dezena_intervalo * valor_unitario
```

**Exemplo:**
- Palpite: Dezena `27`
- Valor: R$ 1,00
- Posição: 1º ao 5º
- Odd dezena 1-5: 60x

```python
qtd_combinacoes = 1
qtd_posicoes = 5
unidades = 1 * 5 = 5
valor_unitario = 1.00 / 5 = 0.20
premio_unidade = 60 * 0.20 = 12.00

# Se acertar na posição 3:
acertos = 1
premio_palpite = 1 * 12.00 = 12.00
```

### 4.2. Centena Normal

**Entrada:** Número de 3 dígitos (000-999)

**Combinações:** 1

**Posições:** Até 7º prêmio

**Acerto:** 3 últimos dígitos do prêmio = centena apostada

**Cálculo:** Mesma fórmula da dezena, mudando só a odd

**Exemplo:**
- Palpite: Centena `384`
- Valor: R$ 1,00
- Posição: 1º ao 5º
- Odd centena 1-5: 600x

```python
qtd_combinacoes = 1
qtd_posicoes = 5
unidades = 5
valor_unitario = 0.20
premio_unidade = 600 * 0.20 = 120.00
```

### 4.3. Milhar Normal

**Entrada:** Número de 4 dígitos (0000-9999)

**Combinações:** 1

**Posições:** Até 5º prêmio (limite definido)

**Acerto:** 4 dígitos do prêmio = milhar apostada

**Cálculo:**
```python
qtd_combinacoes = 1
qtd_posicoes = pos_to - pos_from + 1
unidades = 1 * qtd_posicoes
valor_unitario = valor_palpite / unidades
premio_unidade = odd_milhar_intervalo * valor_unitario
```

**Exemplo:**
- Palpite: Milhar `2580`
- Valor: R$ 1,00
- Posição: 1º ao 5º
- Odd milhar 1-5: 5000x

```python
qtd_combinacoes = 1
qtd_posicoes = 5
unidades = 5
valor_unitario = 0.20
premio_unidade = 5000 * 0.20 = 1000.00
```

### 4.4. Milhar + Centena (Modalidade Combinada)

**Regra:** Ao apostar em Milhar/Centena, cada número gera:
- 1 chance na milhar
- 1 chance na centena

**Com N números, você tem 2N combinações** (N milhares + N centenas) por posição.

**Exemplo:**
- 3 números: `1236`, `9874`, `0852`
- Posição: 1º prêmio
- Valor por palpite: R$ 1,00

**Combinações:**
- Milhares: 3 (`1236`, `9874`, `0852`)
- Centenas: 3 (`236`, `874`, `852`)
- Total = 6

**Cálculo:**
```python
qtd_numeros = len(numeros_apostados)
qtd_combinacoes = 2 * qtd_numeros  # 1 milhar + 1 centena por número
qtd_posicoes = pos_to - pos_from + 1
unidades = qtd_combinacoes * qtd_posicoes
valor_unitario = valor_palpite / unidades
```

**Na hora de conferir:**
- Se acertar pela milhar → usa `odd_milhar_milharcentena`
- Se acertar pela centena → usa `odd_centena_milharcentena`

**Exemplo:**
- 3 números, posição 1-5
- `qtd_combinacoes = 2 * 3 = 6`
- `qtd_posicoes = 5`
- `unidades = 6 * 5 = 30`
- `valor_unitario = 1.00 / 30 = 0.0333...`

### 4.5. Dezena / Centena / Milhar INVERTIDA

#### 4.5.1. Quantidade de Combinações

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

**Função Python:**
```python
from itertools import permutations

def contar_permutacoes_distintas(numero: str) -> int:
    """
    Conta quantas permutações distintas existem para um número.
    
    Args:
        numero: String com o número (ex: "2580")
    
    Returns:
        Quantidade de permutações distintas
    """
    return len(set(permutations(numero)))
```

#### 4.5.2. Posições Permitidas

- **Dezena/Centena invertida:** Até 7º prêmio
- **Milhar invertida:** Até 5º prêmio

#### 4.5.3. Cálculo

**Exemplo geral:**
```python
qtd_combinacoes = quantidade_de_permutacoes_distintas(numero)
qtd_posicoes = pos_to - pos_from + 1
unidades = qtd_combinacoes * qtd_posicoes
valor_unitario = valor_palpite / unidades
premio_unidade = odd_modalidade_invertida * valor_unitario
```

**Acerto:** Se qualquer uma das combinações da invertida bater naquela posição, conta 1 acerto para aquela unidade.

**Exemplo:**
- Palpite: Milhar invertida `2580` (24 combinações)
- Valor: R$ 1,00
- Posição: 1º ao 5º
- Odd milhar invertida 1-5: 200x

```python
qtd_combinacoes = 24
qtd_posicoes = 5
unidades = 24 * 5 = 120
valor_unitario = 1.00 / 120 = 0.00833...
premio_unidade = 200 * 0.00833... = 1.666...

# Se acertar 1 combinação na posição 3:
acertos = 1
premio_palpite = 1 * 1.666... = 1.67
```

---

## 5. Modalidades de GRUPO

### 5.1. Grupo Simples

**Palpite:** 1 grupo (ex.: Grupo 05 - Cachorro = dezenas 17-20)

**Combinações:** 1

**Posições:** Até 7º prêmio (conforme regra)

**Acerto:** Aquele grupo aparecer em qualquer posição do intervalo escolhido

**Cálculo:**
```python
qtd_combinacoes = 1
qtd_posicoes = pos_to - pos_from + 1
unidades = 1 * qtd_posicoes
valor_unitario = valor_palpite / unidades
premio_unidade = odd_grupo_intervalo * valor_unitario
```

**Conferência:**
1. Converter cada prêmio (milhar) → dezena → grupo usando `milhar_para_grupo()`
2. Verificar se o grupo apostado aparece no intervalo de posições

**Decisão de negócio:**
- **Opção A:** Pagar apenas 1 vez por palpite (mesmo que apareça em múltiplas posições)
  ```python
  acertos = 1 if grupo_apareceu else 0
  premio_palpite = acertos * premio_unidade
  ```

- **Opção B:** Pagar por cada posição que bate
  ```python
  acertos = numero_de_posicoes_em_que_o_grupo_aparece
  premio_palpite = acertos * premio_unidade
  ```

**Exemplo:**
- Palpite: Grupo 05 (Cachorro)
- Valor: R$ 1,00
- Posição: 1º ao 5º
- Odd grupo 1-5: 18x

```python
qtd_combinacoes = 1
qtd_posicoes = 5
unidades = 5
valor_unitario = 0.20
premio_unidade = 18 * 0.20 = 3.60

# Resultado: grupos [06, 23, 01, 25, 15]
# Grupo 05 não apareceu → acertos = 0 → premio = 0
```

### 5.2. Dupla de Grupo

**Palpite:** 2 grupos fixos (ex.: Grupo 01 Avestruz + Grupo 06 Cabra)

**Equivalência em dezenas:**
- Grupo 01 → 01-04
- Grupo 06 → 21-24

**Combinações:** 1 (a dupla é fixa, não é combinada)

**Posições:** Até 7º prêmio

**Acerto:** Os dois grupos precisam aparecer dentro do intervalo de posições, em qualquer ordem

**Cálculo:**
```python
qtd_combinacoes = 1
qtd_posicoes = pos_to - pos_from + 1
unidades = 1 * qtd_posicoes
valor_unitario = valor_palpite / unidades
premio_unidade = odd_dupla_intervalo * valor_unitario
```

**Conferência:**
1. Converter cada prêmio → grupo
2. Verificar se grupo 01 aparece pelo menos 1 vez
3. Verificar se grupo 06 aparece pelo menos 1 vez
4. Se ambos aparecerem → dupla acertou

**Exemplo:**
- Palpite: Dupla grupos 01 e 06
- Valor: R$ 1,00
- Posição: 1º ao 5º
- Odd dupla 1-5: 180x

```python
qtd_combinacoes = 1
qtd_posicoes = 5
unidades = 5
valor_unitario = 0.20
premio_unidade = 180 * 0.20 = 36.00

# Resultado: grupos [06, 23, 01, 25, 15]
# Grupo 01 apareceu (posição 3) ✓
# Grupo 06 apareceu (posição 1) ✓
# Dupla acertou → acertos = 1 → premio = 36.00
```

### 5.3. Terno de Grupo

**Palpite:** 3 grupos fixos (ex.: Grupos 05, 14, 23)

**Combinações:** 1

**Posições:** Normalmente 1º ao 5º (ou 1º ao 7º)

**Acerto:** Os 3 grupos precisam aparecer dentro do intervalo, em qualquer ordem

**Cálculo:**
```python
qtd_combinacoes = 1
qtd_posicoes = pos_to - pos_from + 1
unidades = qtd_posicoes
valor_unitario = valor_palpite / unidades
premio_unidade = odd_terno_intervalo * valor_unitario
```

**Exemplo:**
- Palpite: Terno grupos 05, 14, 23
- Valor: R$ 1,00
- Posição: 1º ao 5º
- Odd terno 1-5: 1800x

```python
qtd_combinacoes = 1
qtd_posicoes = 5
unidades = 5
valor_unitario = 0.20
premio_unidade = 1800 * 0.20 = 360.00

# Resultado: grupos [06, 23, 01, 25, 15]
# Grupo 05 não apareceu ✗
# Grupo 14 não apareceu ✗
# Grupo 23 apareceu (posição 2) ✓
# Terno não acertou → premio = 0
```

### 5.4. Quadra de Grupo

**Palpite:** 4 grupos fixos (ex.: Grupos 01, 02, 03, 04)

**Combinações:** 1

**Posições:** Geralmente 1º ao 5º

**Acerto:** Os 4 grupos precisam aparecer dentro do intervalo, em qualquer ordem

**Cálculo:**
```python
qtd_combinacoes = 1
qtd_posicoes = pos_to - pos_from + 1
unidades = qtd_posicoes
valor_unitario = valor_palpite / unidades
premio_unidade = odd_quadra_intervalo * valor_unitario
```

#### 5.4.1. Prêmio Mínimo e Máximo (Quadra)

**Exemplo da tela:**
- Valor por palpite: R$ 0,25
- Posição: 1º ao 5º
- Prêmio mínimo: R$ 250
- Prêmio máximo: R$ 1.000

**Explicação:**
```python
qtd_posicoes = 5
unidades = 5
valor_unitario = 0.25 / 5 = 0.05
odd_quadra = 5000

premio_unidade = 5000 * 0.05 = 250.00
premio_min = 250.00  # 1 acerto (todos os 4 grupos aparecem)
premio_max = 250.00 * 4 = 1000.00  # 4 acertos (máximo teórico)
```

**Nota:** Na prática, o máximo de acertos depende de quantas vezes os grupos podem aparecer no intervalo. Se cada grupo pode aparecer apenas 1 vez, o máximo seria 1 acerto. Se permitir múltiplos acertos, o máximo seria `qtd_posicoes`.

---

## 6. Passe

### 6.1. Passe Normal (1º ao 2º)

**Palpite:** 2 grupos, com ordem específica
- Exemplo: Grupo 05 (Cachorro) no 1º e Grupo 14 (Gato) no 2º

**Combinações:** 1

**Posições:** Fixo 1º-2º

**Acerto:** O grupo A no 1º prêmio E o grupo B no 2º prêmio, nessa ordem exata

**Cálculo:**
```python
qtd_combinacoes = 1
qtd_posicoes = 1  # É uma combinação fixa (1→2)
unidades = 1
valor_unitario = valor_palpite  # Tudo em uma unidade só
premio_palpite = odd_passe * valor_unitario
```

**Exemplo:**
- Palpite: Passe 05 → 14 (Cachorro no 1º, Gato no 2º)
- Valor: R$ 1,00
- Odd passe: 300x

```python
qtd_combinacoes = 1
qtd_posicoes = 1
unidades = 1
valor_unitario = 1.00
premio_unidade = 300 * 1.00 = 300.00

# Resultado:
# 1º prêmio: grupo 05 ✓
# 2º prêmio: grupo 14 ✓
# Passe acertou → premio = 300.00
```

### 6.2. Passe Invertido (Vai-e-Vem 1º-2º)

**Palpite:** 2 grupos, ordem não importa
- Pode sair A-B ou B-A entre 1º e 2º

**Combinações:** 1 (mas aceita ambas as ordens)

**Posições:** Fixo 1º-2º

**Acerto:** Os dois grupos aparecem nas posições 1º e 2º, em qualquer ordem

**Cálculo:** Mesma estrutura do passe normal, mas a odd geralmente é metade

**Exemplo:**
- Palpite: Passe vai-e-vem 05 ↔ 14
- Valor: R$ 1,00
- Odd passe vai-e-vem: 150x

```python
qtd_combinacoes = 1
qtd_posicoes = 1
unidades = 1
valor_unitario = 1.00
premio_unidade = 150 * 1.00 = 150.00

# Resultado:
# 1º prêmio: grupo 14 ✓
# 2º prêmio: grupo 05 ✓
# Passe vai-e-vem acertou (ordem inversa) → premio = 150.00
```

---

## 7. Instantânea

### 7.1. Regra de Negócio

A **Instantânea** usa **TODAS as regras acima**; o que muda é como o resultado é gerado.

**Fluxo:**

1. Usuário escolhe:
   - Modalidade (grupo, dupla, terno, quadra, dezena, centena, milhar, invertida, etc.)
   - Posições (1º, 1-3, 1-5, 1-7)
   - Valor (para cada palpite ou para todos os palpites)

2. Ao clicar em **Finalizar**:
   - Backend calcula `valor_por_palpite`, `unidades`, `valor_unitario`
   - **Sorteia um resultado instantâneo** (lista de prêmios)
   - Confere todas as unidades (combinação × posição)
   - Calcula `premio_palpite` usando as odds
   - **Atualiza saldo:** debita aposta, credita prêmio
   - Salva o resultado e o estado como liquidado

### 7.2. Sorteio Instantâneo

**Função Python:**
```python
import secrets

def gerar_resultado_instantaneo(qtd_premios: int = 5) -> list[int]:
    """
    Gera um resultado instantâneo (lista de milhares sorteadas).
    
    Args:
        qtd_premios: Quantidade de prêmios a sortear (ex: 5 para 1º ao 5º)
    
    Returns:
        Lista de milhares, índice 0 = 1º prêmio
    """
    return [secrets.randbelow(10000) for _ in range(qtd_premios)]
```

**Exemplo:**
```python
resultado = gerar_resultado_instantaneo(5)
# resultado = [4321, 0589, 7704, 1297, 5060]
#             1º    2º    3º    4º    5º
```

### 7.3. Conferência Instantânea

**Na conferência, você só olha o intervalo `[pos_from-1 : pos_to]`:**

```python
def conferir_resultado_instantanea(
    resultado: list[int],
    palpite: dict,
    pos_from: int,
    pos_to: int
) -> dict:
    """
    Confere um palpite contra resultado instantâneo.
    
    Args:
        resultado: Lista de milhares sorteadas
        palpite: Dicionário com dados do palpite
        pos_from: Primeira posição (1-indexed)
        pos_to: Última posição (1-indexed)
    
    Returns:
        Dicionário com acertos, premio, etc.
    """
    # Extrair apenas o intervalo relevante
    resultado_intervalo = resultado[pos_from-1:pos_to]
    
    # Aplicar a mesma lógica de conferência da modalidade
    # (usando as funções específicas de cada modalidade)
    
    # Calcular prêmio
    # ...
    
    return {
        'acertos': acertos,
        'premio_palpite': premio_palpite,
        # ...
    }
```

### 7.4. Atualização de Saldo

```python
def processar_instantanea(aposta: dict) -> dict:
    """
    Processa uma aposta instantânea completa.
    
    1. Gera resultado
    2. Confere todos os palpites
    3. Calcula prêmio total
    4. Atualiza saldo do usuário
    5. Salva resultado e aposta
    """
    # Gerar resultado
    qtd_premios = aposta['pos_to']  # ou 7, dependendo da regra
    resultado = gerar_resultado_instantaneo(qtd_premios)
    
    # Conferir cada palpite
    premio_total = 0
    for palpite in aposta['palpites']:
        conferencia = conferir_palpite(resultado, palpite)
        premio_total += conferencia['premio']
    
    # Atualizar saldo
    valor_aposta = aposta['valor_total']
    saldo_final = usuario.saldo - valor_aposta + premio_total
    
    # Salvar
    # ...
    
    return {
        'resultado': resultado,
        'premio_total': premio_total,
        'saldo_anterior': usuario.saldo,
        'saldo_novo': saldo_final,
    }
```

---

## 8. Funções Auxiliares Python

### 8.1. Conversão Dezena → Grupo

```python
def dezena_para_grupo(dezena: int) -> int:
    """
    Converte uma dezena (00-99) para o grupo correspondente (1-25).
    
    Args:
        dezena: Número de 0 a 99 (00 = 0)
    
    Returns:
        Grupo de 1 a 25
    """
    if dezena == 0:  # 00
        return 25
    
    return ((dezena - 1) // 4) + 1
```

### 8.2. Conversão Milhar → Grupo

```python
def milhar_para_grupo(milhar: int) -> int:
    """
    Extrai a dezena de um milhar e retorna o grupo.
    
    Args:
        milhar: Número de 0000 a 9999
    
    Returns:
        Grupo de 1 a 25
    """
    dezena = milhar % 100  # Últimos 2 dígitos
    return dezena_para_grupo(dezena)
```

### 8.3. Extrair Grupos do Resultado

```python
def grupos_no_resultado(
    resultados_milhar: list[int],
    pos_from: int,
    pos_to: int
) -> list[int]:
    """
    Converte uma lista de milhares em grupos para um intervalo de posições.
    
    Args:
        resultados_milhar: Lista de milhares (índice 0 = 1º prêmio)
        pos_from: Primeira posição (1-indexed)
        pos_to: Última posição (1-indexed)
    
    Returns:
        Lista de grupos no intervalo
    """
    grupos = []
    for i in range(pos_from - 1, pos_to):
        if i < len(resultados_milhar):
            grupo = milhar_para_grupo(resultados_milhar[i])
            grupos.append(grupo)
    return grupos
```

### 8.4. Calcular Unidades

```python
def calcular_unidades(
    qtd_combinacoes: int,
    pos_from: int,
    pos_to: int
) -> int:
    """
    Calcula o número de unidades de aposta.
    
    Args:
        qtd_combinacoes: Quantidade de combinações do palpite
        pos_from: Primeira posição (1-indexed)
        pos_to: Última posição (1-indexed)
    
    Returns:
        Número de unidades
    """
    qtd_posicoes = pos_to - pos_from + 1
    return qtd_combinacoes * qtd_posicoes
```

### 8.5. Calcular Valor Unitário

```python
def calcular_valor_unitario(
    valor_por_palpite: float,
    unidades: int
) -> float:
    """
    Calcula o valor unitário de uma aposta.
    
    Args:
        valor_por_palpite: Valor apostado no palpite
        unidades: Número de unidades
    
    Returns:
        Valor unitário
    """
    if unidades == 0:
        return 0.0
    return valor_por_palpite / unidades
```

### 8.6. Calcular Prêmio do Palpite

```python
def calcular_premio_palpite(
    acertos: int,
    premio_unidade: float
) -> float:
    """
    Calcula o prêmio total de um palpite.
    
    Args:
        acertos: Número de unidades que acertaram
        premio_unidade: Prêmio por unidade
    
    Returns:
        Prêmio total do palpite
    """
    return acertos * premio_unidade
```

### 8.7. Permutações Distintas

```python
from itertools import permutations

def contar_permutacoes_distintas(numero: str) -> int:
    """
    Conta quantas permutações distintas existem para um número.
    
    Args:
        numero: String com o número (ex: "2580")
    
    Returns:
        Quantidade de permutações distintas
    """
    return len(set(permutations(numero)))

def gerar_permutacoes_distintas(numero: str) -> list[str]:
    """
    Gera todas as permutações distintas de um número.
    
    Args:
        numero: String com o número (ex: "2580")
    
    Returns:
        Lista de permutações distintas como strings
    """
    return sorted(set(''.join(p) for p in permutations(numero)))
```

### 8.8. Divisão do Valor

```python
def calcular_valor_por_palpite(
    valor_digitado: float,
    qtd_palpites: int,
    divisao_tipo: str  # 'each' ou 'all'
) -> float:
    """
    Calcula o valor por palpite baseado no tipo de divisão.
    
    Args:
        valor_digitado: Valor digitado pelo usuário
        qtd_palpites: Quantidade de palpites no jogo
        divisao_tipo: 'each' para cada palpite, 'all' para todos
    
    Returns:
        Valor por palpite
    """
    if divisao_tipo == 'each':
        return valor_digitado
    else:  # 'all'
        if qtd_palpites == 0:
            return 0.0
        return valor_digitado / qtd_palpites
```

---

## 9. Resumo Rápido para o Desenvolvedor

### 9.1. Fluxo Geral

1. **Divisão do valor:**
   ```python
   if divisao_tipo == 'each':
       valor_por_palpite = valor_digitado
   else:
       valor_por_palpite = valor_digitado / qtd_palpites
   ```

2. **Por palpite:**
   ```python
   # Calcular combinações da modalidade
   qtd_combinacoes = calcular_combinacoes(modalidade, palpite)
   
   # Calcular posições
   qtd_posicoes = pos_to - pos_from + 1
   
   # Calcular unidades
   unidades = qtd_combinacoes * qtd_posicoes
   
   # Calcular valor unitário
   valor_unitario = valor_por_palpite / unidades
   
   # Buscar odd
   odd = buscar_odd(modalidade, pos_from, pos_to)
   
   # Calcular prêmio por unidade
   premio_unidade = odd * valor_unitario
   
   # Conferir resultado e contar acertos
   acertos = conferir_palpite(resultado, palpite, modalidade)
   
   # Calcular prêmio do palpite
   premio_palpite = acertos * premio_unidade
   ```

3. **Bilhete inteiro:**
   ```python
   premio_total = sum(premio_palpite_i for i in palpites)
   ```

4. **Instantânea:**
   ```python
   # Gera resultado na hora
   resultado = gerar_resultado_instantaneo(qtd_premios)
   
   # Aplica exatamente a mesma matemática
   premio_total = calcular_premio_total(resultado, aposta)
   
   # Saldo é atualizado imediatamente
   usuario.saldo = usuario.saldo - valor_aposta + premio_total
   ```

### 9.2. Tabela de Grupos

**Sempre usar a função `dezena_para_grupo()` ou `milhar_para_grupo()` para converter números em grupos.**

**Todas as modalidades de grupo são conferidas sempre em cima desse mapeamento:**
- Converter resultado (milhar) → dezena → grupo
- Verificar se os grupos apostados aparecem dentro do intervalo de posições

---

## 10. Exemplo Completo: Quadra de Grupo

**Cenário:**
- Palpite: Quadra grupos `01, 06, 15, 25`
- Valor digitado: R$ 1,00
- Divisão: "Para cada palpite"
- Posição: 1º ao 5º
- Odd quadra 1-5: 5000x

**Passo a passo:**

1. **Valor por palpite:**
   ```python
   valor_por_palpite = 1.00  # "Para cada palpite"
   ```

2. **Combinações:**
   ```python
   qtd_combinacoes = 1  # Quadra é uma combinação fixa
   ```

3. **Posições:**
   ```python
   pos_from = 1
   pos_to = 5
   qtd_posicoes = 5 - 1 + 1 = 5
   ```

4. **Unidades:**
   ```python
   unidades = 1 * 5 = 5
   ```

5. **Valor unitário:**
   ```python
   valor_unitario = 1.00 / 5 = 0.20
   ```

6. **Prêmio por unidade:**
   ```python
   odd = 5000
   premio_unidade = 5000 * 0.20 = 1000.00
   ```

7. **Conferência:**
   ```python
   resultado = [4321, 0589, 7704, 1297, 5060]
   # Converter para grupos:
   grupos_resultado = [06, 23, 01, 25, 15]
   
   # Verificar se todos os grupos aparecem:
   grupos_apostados = {01, 06, 15, 25}
   grupos_presentes = set(grupos_resultado)  # {06, 23, 01, 25, 15}
   
   # Todos os grupos apareceram?
   todos_presentes = grupos_apostados.issubset(grupos_presentes)
   # True → quadra acertou
   
   acertos = 1  # Máximo 1 acerto por palpite de quadra
   ```

8. **Prêmio do palpite:**
   ```python
   premio_palpite = 1 * 1000.00 = 1000.00
   ```

---

**Fim do Manual**
