# Regras de Cálculo de Prêmios - LOTEP e LOTECE

## 📋 Visão Geral

LOTEP (Paraíba) e LOTECE (Ceará) têm uma lógica especial de premiação:
- **5 prêmios sorteados** (1º ao 5º)
- **2 prêmios calculados** (6º e 7º)
- **Total: 7 prêmios exibidos**

> ⚠️ **IMPORTANTE**: Apesar da API externa retornar até 10 prêmios para essas loterias, o sistema deve sempre exibir apenas 7 prêmios (os 5 sorteados + os 2 calculados).

---

## 🎯 Regras de Cálculo

### 6º Prêmio

**Fórmula:**
```
6º Prêmio = Soma dos 5 primeiros prêmios MOD 10000
```

**Passo a passo:**
1. Somar os 5 primeiros prêmios sorteados
2. Pegar apenas os últimos 4 dígitos (módulo 10000)
3. O resultado é o 6º prêmio

**Exemplo:**
```
Prêmios sorteados: 3895, 6889, 6345, 7903, 1612

1. Soma: 3895 + 6889 + 6345 + 7903 + 1612 = 26644
2. Módulo 10000: 26644 % 10000 = 6644
3. 6º Prêmio = 6644
```

**Código TypeScript:**
```typescript
function calcular6Premio(premios: number[]): number {
  if (premios.length < 5) {
    throw new Error('Precisa de pelo menos 5 prêmios para calcular o 6º')
  }
  
  const soma = premios[0] + premios[1] + premios[2] + premios[3] + premios[4]
  return soma % 10000
}
```

**Código Python:**
```python
def calcular_6_premio(premios: list[int]) -> int:
    if len(premios) < 5:
        raise ValueError('Precisa de pelo menos 5 prêmios para calcular o 6º')
    
    soma = premios[0] + premios[1] + premios[2] + premios[3] + premios[4]
    return soma % 10000
```

**Código JavaScript:**
```javascript
function calcular6Premio(premios) {
  if (premios.length < 5) {
    throw new Error('Precisa de pelo menos 5 prêmios para calcular o 6º')
  }
  
  const soma = premios[0] + premios[1] + premios[2] + premios[3] + premios[4]
  return soma % 10000
}
```

---

### 7º Prêmio

**Fórmula:**
```
7º Prêmio = ((1º Prêmio × 2º Prêmio) ÷ 1000) MOD 1000
```

**Passo a passo:**
1. Multiplicar o 1º prêmio pelo 2º prêmio
2. Dividir por 1000 (remove os 3 últimos dígitos)
3. Pegar módulo 1000 (pega os 3 dígitos do meio)
4. O resultado é o 7º prêmio

**Exemplo:**
```
Prêmios sorteados: 3895, 6889, ...

1. Multiplicação: 3895 × 6889 = 26.832.655
2. Dividir por 1000: 26.832.655 ÷ 1000 = 26.832 (inteiro)
3. Módulo 1000: 26.832 % 1000 = 832
4. 7º Prêmio = 832
```

**Exemplo completo:**
```
Prêmios: 5755, 4667, 4214, 7849, 8904

1. Multiplicação: 5755 × 4667 = 26.858.585
2. Dividir por 1000: 26.858.585 ÷ 1000 = 26.858
3. Módulo 1000: 26.858 % 1000 = 858
4. 7º Prêmio = 858 (formatado como 0858)
```

**Código TypeScript:**
```typescript
function calcular7Premio(premios: number[]): number {
  if (premios.length < 2) {
    throw new Error('Precisa de pelo menos 2 prêmios para calcular o 7º')
  }
  
  const multiplicacao = premios[0] * premios[1]
  const dividido = Math.floor(multiplicacao / 1000)  // Remove 3 últimos dígitos
  return dividido % 1000  // Pega 3 dígitos do meio
}
```

**Código Python:**
```python
def calcular_7_premio(premios: list[int]) -> int:
    if len(premios) < 2:
        raise ValueError('Precisa de pelo menos 2 prêmios para calcular o 7º')
    
    multiplicacao = premios[0] * premios[1]
    dividido = multiplicacao // 1000  # Remove 3 últimos dígitos
    return dividido % 1000  # Pega 3 dígitos do meio
```

**Código JavaScript:**
```javascript
function calcular7Premio(premios) {
  if (premios.length < 2) {
    throw new Error('Precisa de pelo menos 2 prêmios para calcular o 7º')
  }
  
  const multiplicacao = premios[0] * premios[1]
  const dividido = Math.floor(multiplicacao / 1000)  // Remove 3 últimos dígitos
  return dividido % 1000  // Pega 3 dígitos do meio
}
```

---

## 🔄 Função Completa

**Código TypeScript:**
```typescript
/**
 * Calcula prêmios adicionais (6º e 7º) para LOTEP e LOTECE
 */
function calcularPremiosLOTEPLOTECE(premiosSorteados: number[]): number[] {
  if (premiosSorteados.length < 5) {
    throw new Error('LOTEP/LOTECE precisa de pelo menos 5 prêmios sorteados')
  }
  
  // Copiar os 5 primeiros prêmios
  const resultado = [...premiosSorteados.slice(0, 5)]
  
  // Calcular 6º prêmio
  const soma = resultado[0] + resultado[1] + resultado[2] + resultado[3] + resultado[4]
  const premio6 = soma % 10000
  resultado.push(premio6)
  
  // Calcular 7º prêmio
  const multiplicacao = resultado[0] * resultado[1]
  const dividido = Math.floor(multiplicacao / 1000)
  const premio7 = dividido % 1000
  resultado.push(premio7)
  
  return resultado  // Retorna array com 7 prêmios
}
```

**Código Python:**
```python
def calcular_premios_lotep_lotece(premios_sorteados: list[int]) -> list[int]:
    """
    Calcula prêmios adicionais (6º e 7º) para LOTEP e LOTECE
    """
    if len(premios_sorteados) < 5:
        raise ValueError('LOTEP/LOTECE precisa de pelo menos 5 prêmios sorteados')
    
    # Copiar os 5 primeiros prêmios
    resultado = premios_sorteados[:5].copy()
    
    # Calcular 6º prêmio
    soma = sum(resultado)
    premio_6 = soma % 10000
    resultado.append(premio_6)
    
    # Calcular 7º prêmio
    multiplicacao = resultado[0] * resultado[1]
    dividido = multiplicacao // 1000
    premio_7 = dividido % 1000
    resultado.append(premio_7)
    
    return resultado  # Retorna lista com 7 prêmios
```

---

## 📊 Exemplo Completo

### Entrada (da API externa):
```
LOTEP - 20/01/2026 - 15:35
Prêmios sorteados: 5755, 4667, 4214, 7849, 8904
(API pode retornar até 10, mas ignoramos os demais)
```

### Processamento:
```javascript
const premiosSorteados = [5755, 4667, 4214, 7849, 8904]

// Pegar apenas os 5 primeiros
const cincoPrimeiros = premiosSorteados.slice(0, 5)

// Calcular 6º
const soma = 5755 + 4667 + 4214 + 7849 + 8904  // = 31389
const premio6 = 31389 % 10000  // = 1389

// Calcular 7º
const multiplicacao = 5755 * 4667  // = 26858585
const dividido = Math.floor(26858585 / 1000)  // = 26858
const premio7 = 26858 % 1000  // = 858
```

### Resultado Final:
```
Prêmios para exibição:
1º: 5755
2º: 4667
3º: 4214
4º: 7849
5º: 8904
6º: 1389 (calculado)
7º: 0858 (calculado)

Total: 7 prêmios
```

---

## ⚠️ Observações Importantes

1. **Sempre recalcular**: Mesmo que a API externa retorne valores para 6º e 7º prêmios, **sempre recalcule** usando as fórmulas acima.

2. **Apenas 7 prêmios**: O sistema deve exibir **apenas 7 prêmios** para LOTEP e LOTECE, não os 10 que a API pode retornar.

3. **Formatação**: Os prêmios devem ser exibidos como números de 4 dígitos (com zeros à esquerda se necessário):
   - `1389` → `"1389"` ✓
   - `858` → `"0858"` ✓

4. **Identificação da loteria**: Para identificar se é LOTEP ou LOTECE:
   - **LOTEP**: Nome contém "LOTEP", "Paraíba", "Paraiba" ou código "PB"
   - **LOTECE**: Nome contém "LOTECE", "Ceará", "Ceara" ou código "CE" ou "LCE"

---

## 🔍 Validação

Para validar se o cálculo está correto, use estes exemplos:

### Teste 1:
```
Entrada: [3895, 6889, 6345, 7903, 1612]
6º esperado: 6644
7º esperado: 832
```

### Teste 2:
```
Entrada: [5755, 4667, 4214, 7849, 8904]
6º esperado: 1389
7º esperado: 858
```

### Teste 3:
```
Entrada: [1234, 5678, 9012, 3456, 7890]
6º: (1234 + 5678 + 9012 + 3456 + 7890) % 10000 = 7270
7º: ((1234 * 5678) / 1000) % 1000 = 7004 / 1000 = 7, 7 % 1000 = 7
```

---

## 📝 Resumo

| Prêmio | Fórmula | Exemplo |
|--------|---------|---------|
| **6º** | `(1º + 2º + 3º + 4º + 5º) % 10000` | `26644 % 10000 = 6644` |
| **7º** | `((1º × 2º) ÷ 1000) % 1000` | `26832555 ÷ 1000 = 26832, 26832 % 1000 = 832` |

---

**Última atualização**: 20/01/2026  
**Implementado em**: `/lib/bet-rules-engine.ts`
