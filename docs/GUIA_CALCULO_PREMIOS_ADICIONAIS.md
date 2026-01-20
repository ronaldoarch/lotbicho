# Guia: Cálculo de Prêmios Adicionais (6º, 7º e Prêmios Especiais)

Este guia explica as regras específicas para calcular prêmios adicionais que não são sorteados diretamente, mas são calculados a partir dos primeiros prêmios.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [6º Prêmio - Soma dos 5 Primeiros](#6º-prêmio---soma-dos-5-primeiros)
3. [7º Prêmio - Multiplicação 1º × 2º](#7º-prêmio---multiplicação-1º--2º)
4. [Prêmios 8º ao 10º (LoteP e LoteCE)](#prêmios-8º-ao-10º-lotep-e-lotece)
5. [Implementação](#implementação)
6. [Exemplos Práticos](#exemplos-práticos)
7. [Casos Especiais](#casos-especiais)

---

## 🎯 Visão Geral

Alguns prêmios não são sorteados diretamente, mas são **calculados** a partir dos primeiros prêmios:

- **6º Prêmio**: Calculado somando os 5 primeiros prêmios
- **7º Prêmio**: Calculado multiplicando o 1º pelo 2º prêmio
- **8º ao 10º Prêmio**: Para LoteP e LoteCE (10 prêmios no total)

---

## 🔢 6º Prêmio - Soma dos 5 Primeiros

### Regra

O **6º prêmio** é calculado somando os **5 primeiros prêmios** e pegando os **últimos 4 dígitos** do resultado.

### Fórmula

```
6º Prêmio = (1º + 2º + 3º + 4º + 5º) mod 10000
```

Ou seja:
1. Soma os 5 primeiros prêmios
2. Pega apenas os últimos 4 dígitos (módulo 10000)

### Exemplo Prático

**Prêmios sorteados:**
- 1º prêmio: `3895`
- 2º prêmio: `6889`
- 3º prêmio: `6345`
- 4º prêmio: `7903`
- 5º prêmio: `1612`

**Cálculo:**
```
Soma = 3895 + 6889 + 6345 + 7903 + 1612
Soma = 26644
```

**6º Prêmio:**
```
26644 mod 10000 = 6644
```

**Resultado:** `6644`

### Implementação

```typescript
function calcular6Premio(premios: number[]): number {
  // Garantir que temos pelo menos 5 prêmios
  if (premios.length < 5) {
    throw new Error('Precisa de pelo menos 5 prêmios para calcular o 6º')
  }
  
  // Somar os 5 primeiros prêmios
  const soma = premios[0] + premios[1] + premios[2] + premios[3] + premios[4]
  
  // Pegar últimos 4 dígitos (módulo 10000)
  return soma % 10000
}
```

### Validação

- ✅ Se a soma for menor que 10000, o resultado é a própria soma
- ✅ Se a soma for maior que 10000, pega apenas os últimos 4 dígitos
- ✅ Resultado sempre entre `0000` e `9999`

---

## 🔢 7º Prêmio - Multiplicação 1º × 2º

### Regra

O **7º prêmio** é calculado multiplicando o **1º prêmio pelo 2º prêmio** e pegando os **3 dígitos do meio** (anulando os 3 últimos dígitos).

### Fórmula

```
7º Prêmio = (1º × 2º) / 1000 mod 1000
```

Ou seja:
1. Multiplica o 1º pelo 2º prêmio
2. Divide por 1000 (remove os 3 últimos dígitos)
3. Pega módulo 1000 (pega apenas os 3 dígitos do meio)

### Exemplo Prático

**Prêmios sorteados:**
- 1º prêmio: `3895`
- 2º prêmio: `6889`

**Cálculo:**
```
Multiplicação = 3895 × 6889
Multiplicação = 26.832.655
```

**Passo a passo:**
1. Resultado: `26832655`
2. Dividir por 1000: `26832655 / 1000 = 26832.655`
3. Pegar parte inteira: `26832`
4. Módulo 1000: `26832 mod 1000 = 832`

**7º Prêmio:** `832`

**Formatação:** Como são apenas 3 dígitos, pode ser exibido como `0832` ou `832` dependendo da regra da banca.

### Implementação

```typescript
function calcular7Premio(premios: number[]): number {
  // Garantir que temos pelo menos 2 prêmios
  if (premios.length < 2) {
    throw new Error('Precisa de pelo menos 2 prêmios para calcular o 7º')
  }
  
  // Multiplicar 1º × 2º
  const multiplicacao = premios[0] * premios[1]
  
  // Dividir por 1000 (remove 3 últimos dígitos)
  const dividido = Math.floor(multiplicacao / 1000)
  
  // Pegar módulo 1000 (pega 3 dígitos do meio)
  return dividido % 1000
}
```

### Validação

- ✅ Resultado sempre entre `000` e `999` (3 dígitos)
- ✅ Se o resultado tiver menos de 3 dígitos, preencher com zeros à esquerda: `032` ou `832`

---

## 🔢 Prêmios 8º ao 10º (LoteP e LoteCE)

### Regra Geral

Para **LoteP** e **LoteCE** que têm **10 prêmios no total**, os prêmios 8º, 9º e 10º seguem regras similares aos anteriores.

### Possíveis Regras

**Opção 1: Continuar a sequência**
- 8º prêmio: Soma dos prêmios 3º ao 7º
- 9º prêmio: Multiplicação 3º × 4º
- 10º prêmio: Soma de todos os 7 primeiros

**Opção 2: Padrão alternado**
- 8º prêmio: Multiplicação 2º × 3º
- 9º prêmio: Soma dos prêmios 4º ao 6º
- 10º prêmio: Multiplicação 4º × 5º

**⚠️ IMPORTANTE:** Confirmar com a regra oficial da banca qual padrão usar para LoteP e LoteCE.

### Implementação Genérica

```typescript
function calcularPremiosAdicionais(premios: number[], qtdPremios: number): number[] {
  const premiosCalculados: number[] = []
  
  // Já temos os primeiros prêmios sorteados
  const premiosSorteados = premios.slice(0, 7) // Assumindo 7 prêmios sorteados
  
  // 6º prêmio: Soma dos 5 primeiros
  if (qtdPremios >= 6) {
    premiosCalculados.push(calcular6Premio(premiosSorteados))
  }
  
  // 7º prêmio: Multiplicação 1º × 2º
  if (qtdPremios >= 7) {
    premiosCalculados.push(calcular7Premio(premiosSorteados))
  }
  
  // 8º ao 10º: Seguir padrão definido pela banca
  if (qtdPremios >= 8) {
    // Implementar regra específica para 8º prêmio
    premiosCalculados.push(calcular8Premio(premiosSorteados))
  }
  
  if (qtdPremios >= 9) {
    // Implementar regra específica para 9º prêmio
    premiosCalculados.push(calcular9Premio(premiosSorteados))
  }
  
  if (qtdPremios >= 10) {
    // Implementar regra específica para 10º prêmio
    premiosCalculados.push(calcular10Premio(premiosSorteados))
  }
  
  return premiosCalculados
}
```

---

## 💻 Implementação

### Função Completa

```typescript
/**
 * Calcula prêmios adicionais (6º, 7º, etc.) a partir dos primeiros prêmios
 */
export function calcularPremiosAdicionais(premios: number[]): {
  premio6?: number
  premio7?: number
  premio8?: number
  premio9?: number
  premio10?: number
} {
  const resultado: any = {}
  
  // Validar que temos prêmios suficientes
  if (premios.length < 5) {
    throw new Error('Precisa de pelo menos 5 prêmios para calcular prêmios adicionais')
  }
  
  // 6º Prêmio: Soma dos 5 primeiros
  if (premios.length >= 5) {
    const soma = premios[0] + premios[1] + premios[2] + premios[3] + premios[4]
    resultado.premio6 = soma % 10000
  }
  
  // 7º Prêmio: Multiplicação 1º × 2º
  if (premios.length >= 2) {
    const multiplicacao = premios[0] * premios[1]
    const dividido = Math.floor(multiplicacao / 1000)
    resultado.premio7 = dividido % 1000
  }
  
  // 8º ao 10º: Implementar conforme regra da banca
  // TODO: Confirmar regras específicas para LoteP e LoteCE
  
  return resultado
}
```

### Integração com Resultado

```typescript
interface ResultadoCompleto {
  prizes: number[] // Prêmios 1º ao 5º (ou mais, se sorteados)
  premio6?: number  // Calculado
  premio7?: number  // Calculado
  premio8?: number  // Calculado (se aplicável)
  premio9?: number  // Calculado (se aplicável)
  premio10?: number // Calculado (se aplicável)
}

function gerarResultadoCompleto(qtdPremios: number = 7): ResultadoCompleto {
  // Gerar ou buscar prêmios sorteados (1º ao 5º ou mais)
  const premiosSorteados: number[] = []
  for (let i = 0; i < Math.min(5, qtdPremios); i++) {
    premiosSorteados.push(Math.floor(Math.random() * 10000))
  }
  
  // Calcular prêmios adicionais
  const premiosAdicionais = calcularPremiosAdicionais(premiosSorteados)
  
  // Montar resultado completo
  const resultado: ResultadoCompleto = {
    prizes: premiosSorteados,
  }
  
  if (qtdPremios >= 6) {
    resultado.premio6 = premiosAdicionais.premio6
  }
  
  if (qtdPremios >= 7) {
    resultado.premio7 = premiosAdicionais.premio7
  }
  
  // Adicionar 8º ao 10º se necessário
  if (qtdPremios >= 8 && premiosAdicionais.premio8) {
    resultado.premio8 = premiosAdicionais.premio8
  }
  
  if (qtdPremios >= 9 && premiosAdicionais.premio9) {
    resultado.premio9 = premiosAdicionais.premio9
  }
  
  if (qtdPremios >= 10 && premiosAdicionais.premio10) {
    resultado.premio10 = premiosAdicionais.premio10
  }
  
  return resultado
}
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Cálculo Completo (7 Prêmios)

**Prêmios Sorteados:**
- 1º: `3895`
- 2º: `6889`
- 3º: `6345`
- 4º: `7903`
- 5º: `1612`

**Cálculo do 6º Prêmio:**
```
Soma = 3895 + 6889 + 6345 + 7903 + 1612 = 26644
6º Prêmio = 26644 mod 10000 = 6644
```

**Cálculo do 7º Prêmio:**
```
Multiplicação = 3895 × 6889 = 26832655
Dividido por 1000 = 26832
7º Prêmio = 26832 mod 1000 = 832
```

**Resultado Final:**
```
1º: 3895
2º: 6889
3º: 6345
4º: 7903
5º: 1612
6º: 6644 (calculado)
7º: 832 (calculado)
```

### Exemplo 2: Caso com Soma Menor que 10000

**Prêmios Sorteados:**
- 1º: `1234`
- 2º: `2345`
- 3º: `3456`
- 4º: `4567`
- 5º: `5678`

**Cálculo do 6º Prêmio:**
```
Soma = 1234 + 2345 + 3456 + 4567 + 5678 = 17280
6º Prêmio = 17280 mod 10000 = 7280
```

### Exemplo 3: Caso com Multiplicação Pequena

**Prêmios Sorteados:**
- 1º: `1234`
- 2º: `5678`

**Cálculo do 7º Prêmio:**
```
Multiplicação = 1234 × 5678 = 7006652
Dividido por 1000 = 7006
7º Prêmio = 7006 mod 1000 = 006 (ou 6)
```

**Formatação:** `006` ou `6` (dependendo da regra da banca)

---

## ⚠️ Casos Especiais

### Caso 1: Prêmio 7º com Menos de 3 Dígitos

**Situação:** Quando `(1º × 2º) / 1000 mod 1000` resulta em número menor que 100.

**Exemplo:**
- 1º: `0012` (12)
- 2º: `0034` (34)
- Multiplicação: `12 × 34 = 408`
- Dividido por 1000: `0`
- Módulo 1000: `0`

**Solução:** Preencher com zeros à esquerda: `000` ou tratar como `0000` (4 dígitos).

### Caso 2: Prêmio 6º Igual a Zero

**Situação:** Quando a soma dos 5 primeiros é múltiplo exato de 10000.

**Exemplo:**
- Soma: `10000`
- 6º Prêmio: `10000 mod 10000 = 0`

**Solução:** Exibir como `0000`.

### Caso 3: Validação de Entrada

**Situação:** Prêmios devem estar no formato correto (0000-9999).

**Validação:**
```typescript
function validarPremio(premio: number): boolean {
  return premio >= 0 && premio <= 9999
}

function validarPremiosParaCalculo(premios: number[]): void {
  if (premios.length < 5) {
    throw new Error('Precisa de pelo menos 5 prêmios')
  }
  
  premios.forEach((p, idx) => {
    if (!validarPremio(p)) {
      throw new Error(`Prêmio ${idx + 1} inválido: ${p}`)
    }
  })
}
```

---

## 📝 Notas Importantes

1. **Formato de Exibição:**
   - 6º prêmio: Sempre 4 dígitos (`0000` a `9999`)
   - 7º prêmio: 3 dígitos (`000` a `999`) ou 4 dígitos (`0000` a `0999`) dependendo da regra

2. **Ordem de Cálculo:**
   - Sempre calcular o 6º antes do 7º
   - O 7º não depende do 6º, apenas dos 2 primeiros

3. **Precisão:**
   - Usar números inteiros (não float) para evitar erros de precisão
   - Garantir que os cálculos sejam feitos com números inteiros

4. **LoteP e LoteCE:**
   - Confirmar regras específicas para prêmios 8º ao 10º
   - Pode variar entre diferentes bancas

---

## 🔗 Relacionado

- [Guia de Resultados e Liquidação](./GUIA_RESULTADOS_LIQUIDACAO.md)
- [Manual de Regras do Backend](./manual-regras-backend.md)
- [Lógica de Premiação](./LOGICA_PREMIACAO.md)

---

**Última atualização**: Dezembro 2024
