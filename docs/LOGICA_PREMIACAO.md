# Lógica de Premiação - Sistema Lot Bicho

## 📋 Visão Geral

O sistema de premiação calcula os prêmios baseado em:
1. **Modalidade** (Grupo, Dupla, Terno, Quadra, Dezena, Centena, Milhar, etc.)
2. **Posições** (1º, 1º-3º, 1º-5º, 1º-7º)
3. **Cotação Dinâmica** (configurada em `MODALITIES`) ou **Tabela Fixa** (fallback)
4. **Valor apostado** e **tipo de divisão** (para cada palpite ou total)

---

## 🔄 Fluxo de Cálculo

### 1. **Cálculo de Unidades**

Para cada palpite, o sistema calcula quantas "unidades" serão apostadas:

#### Modalidades de Grupo:
- **Grupo Simples**: 1 combinação × N posições = N unidades
- **Dupla de Grupo**: 1 combinação × N posições = N unidades
- **Terno de Grupo**: 1 combinação × N posições = N unidades
- **Quadra de Grupo**: 1 combinação × N posições = N unidades

**Exemplo:**
- Dupla de Grupo na posição 1º-3º
- Unidades = 1 combinação × 3 posições = **3 unidades**

#### Modalidades Numéricas:
- **Dezena/Centena/Milhar**: 1 combinação × N posições = N unidades
- **Invertidas**: Permutações × N posições = unidades

**Exemplo:**
- Dezena "12" invertida na posição 1º-5º
- Permutações: "12", "21" = 2 combinações
- Unidades = 2 combinações × 5 posições = **10 unidades**

### 2. **Cálculo do Valor Unitário**

```
Valor Unitário = Valor do Palpite ÷ Quantidade de Unidades
```

**Exemplo:**
- Valor apostado: R$ 2,00
- Unidades: 3
- Valor Unitário = R$ 2,00 ÷ 3 = **R$ 0,67**

### 3. **Busca da Odd (Multiplicador)**

O sistema tenta buscar a cotação dinâmica primeiro:

1. **Cotação Dinâmica** (prioridade):
   - Busca em `MODALITIES` pelo nome da modalidade
   - Extrai o valor da string (ex: "1x R$ 16.00" → 16)
   - Usa esse valor como multiplicador

2. **Tabela Fixa** (fallback):
   - Se não encontrar cotação dinâmica, usa valores fixos:
     - Dupla de Grupo 1-3: 180x
     - Grupo 1-5: 18x
     - Dezena 1-5: 60x
     - etc.

**Exemplo:**
- Modalidade: "Dupla de Grupo"
- Cotação em MODALITIES: "1x R$ 16.00"
- Multiplicador usado: **16x** (não 180x da tabela fixa)

### 4. **Cálculo do Prêmio por Unidade**

```
Prêmio por Unidade = Odd × Valor Unitário
```

**Exemplo:**
- Odd: 16x
- Valor Unitário: R$ 0,67
- Prêmio por Unidade = 16 × R$ 0,67 = **R$ 10,67**

### 5. **Conferência de Acertos**

O sistema compara o palpite com o resultado oficial:

- **Grupo**: Verifica se o grupo aparece nas posições especificadas
- **Dupla/Terno/Quadra**: Verifica se todos os grupos aparecem nas posições
- **Números**: Verifica se o número (ou permutações) aparece nas posições

**Exemplo:**
- Palpite: Dupla de Grupo [7, 8] na posição 1º-3º
- Resultado: 1º = grupo 7, 2º = grupo 8, 3º = grupo 5
- Acertos: 2 (grupo 7 no 1º e grupo 8 no 2º)

### 6. **Cálculo do Prêmio Total**

```
Prêmio Total = Acertos × Prêmio por Unidade
```

**Exemplo:**
- Acertos: 2
- Prêmio por Unidade: R$ 10,67
- Prêmio Total = 2 × R$ 10,67 = **R$ 21,34**

---

## 💰 Exemplo Completo

### Cenário:
- **Modalidade**: Dupla de Grupo
- **Palpite**: [7, 8]
- **Posição**: 1º ao 3º
- **Valor**: R$ 2,00 (total)
- **Divisão**: Para todo o palpite
- **Cotação**: 1x R$ 16.00 (16x)

### Cálculo:

1. **Unidades**: 1 combinação × 3 posições = **3 unidades**
2. **Valor Unitário**: R$ 2,00 ÷ 3 = **R$ 0,67**
3. **Odd**: **16x** (da cotação dinâmica)
4. **Prêmio por Unidade**: 16 × R$ 0,67 = **R$ 10,67**
5. **Acertos**: 2 (grupo 7 no 1º e grupo 8 no 2º)
6. **Prêmio Total**: 2 × R$ 10,67 = **R$ 21,34**

---

## 🔧 Onde a Lógica é Aplicada

### 1. **Retorno Previsto** (antes de apostar)
- **Arquivo**: `components/BetConfirmation.tsx` e `components/BetFlow.tsx`
- **Função**: `calcularRetornoPrevisto()`
- **Lógica**: Assume 1 acerto por palpite (melhor caso)
- **Uso**: Mostra ao usuário quanto pode ganhar se acertar

### 2. **Apostas Instantâneas** (sorteio imediato)
- **Arquivo**: `app/api/apostas/route.ts`
- **Função**: `conferirPalpite()`
- **Lógica**: Gera resultado aleatório e confere na hora
- **Uso**: Credita prêmio imediatamente se ganhar

### 3. **Liquidação Automática** (apostas pendentes)
- **Arquivo**: `app/api/resultados/liquidar/route.ts`
- **Função**: `conferirPalpite()`
- **Lógica**: Compara com resultados oficiais da API
- **Uso**: Processa todas as apostas pendentes automaticamente

---

## 📊 Tabela de Odds Padrão (Fallback)

Se a cotação dinâmica não estiver disponível, usa-se:

| Modalidade | Posição 1º | Posição 1-3 | Posição 1-5 | Posição 1-7 |
|------------|------------|-------------|-------------|-------------|
| Grupo | 18x | 18x | 18x | 18x |
| Dupla de Grupo | 180x | 180x | 180x | 180x |
| Terno de Grupo | 1800x | 1800x | 1800x | 1800x |
| Quadra de Grupo | 5000x | 5000x | 5000x | 5000x |
| Dezena | 60x | 60x | 60x | 60x |
| Centena | 600x | 600x | 600x | 600x |
| Milhar | 5000x | 5000x | 5000x | - |
| Dezena Invertida | 60x | 60x | 60x | 60x |
| Centena Invertida | 600x | 600x | 600x | 600x |
| Milhar Invertida | 200x | 200x | 200x | - |
| Milhar/Centena | 3300x | 3300x | 3300x | - |
| Passe vai | - | - | - | - |
| Passe vai e vem | - | - | - | - |

**Nota**: Passe sempre usa posição 1º-2º com odds fixas (300x e 150x respectivamente).

---

## ✅ Verificações Importantes

1. ✅ **Cotação Dinâmica**: Sistema sempre tenta usar primeiro
2. ✅ **Fallback**: Se não encontrar, usa tabela fixa
3. ✅ **Consistência**: Mesma lógica em retorno previsto e liquidação
4. ✅ **Valor Unitário**: Calculado corretamente baseado em unidades
5. ✅ **Acertos**: Contados corretamente por posição

---

## 🔍 Debugging

Para verificar se a cotação está sendo usada corretamente:

1. Verifique o console do navegador ao calcular retorno previsto
2. Verifique os logs do servidor durante a liquidação
3. Confirme que `MODALITIES` tem a cotação correta
4. Verifique se `modalityName` está sendo passado para `conferirPalpite()`

---

## 📝 Notas Técnicas

- A função `buscarCotacaoDinamica()` extrai o valor após "R$" na string de cotação
- Se houver múltiplos números, usa o maior (geralmente o multiplicador)
- A função `conferirPalpite()` aceita `modalityName` opcional para buscar cotação dinâmica
- Se `modalityName` não for fornecido, usa tabela fixa como fallback
