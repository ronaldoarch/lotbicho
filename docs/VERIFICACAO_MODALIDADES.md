# Verificação de Modalidades - Mapeamento na Liquidação

## 📋 Modalidades no Sistema

### Modalidades em `data/modalities.ts`:

1. ✅ Grupo
2. ✅ Dupla de Grupo
3. ✅ Terno de Grupo
4. ✅ Quadra de Grupo
5. ❌ **Quina de Grupo** - **FALTANDO NO MAPEAMENTO**
6. ✅ Dezena
7. ✅ Duque de Dezena (adicionado recentemente)
8. ✅ Terno de Dezena (adicionado recentemente)
9. ✅ Centena
10. ✅ Milhar
11. ✅ Milhar Invertida
12. ✅ Centena Invertida
13. ✅ Dezena Invertida
14. ✅ Milhar/Centena
15. ✅ Passe vai
16. ✅ Passe vai e vem

## 🔍 Mapeamento Atual na Liquidação

```typescript
const modalityMap: Record<string, ModalityType> = {
  Grupo: 'GRUPO',
  'Dupla de Grupo': 'DUPLA_GRUPO',
  'Terno de Grupo': 'TERNO_GRUPO',
  'Quadra de Grupo': 'QUADRA_GRUPO',
  // ❌ 'Quina de Grupo': 'QUINA_GRUPO', // FALTANDO
  Dezena: 'DEZENA',
  'Duque de Dezena': 'DEZENA',
  'Terno de Dezena': 'DEZENA',
  Centena: 'CENTENA',
  Milhar: 'MILHAR',
  'Dezena Invertida': 'DEZENA_INVERTIDA',
  'Centena Invertida': 'CENTENA_INVERTIDA',
  'Milhar Invertida': 'MILHAR_INVERTIDA',
  'Milhar/Centena': 'MILHAR_CENTENA',
  'Passe vai': 'PASSE',
  'Passe vai e vem': 'PASSE_VAI_E_VEM',
}
```

## ⚠️ Problema Identificado

**Modalidade faltando:**
- ❌ **Quina de Grupo** - Não está mapeada na liquidação

## 🔧 Solução

Precisa adicionar:
1. Tipo `QUINA_GRUPO` no `bet-rules-engine.ts` (se não existir)
2. Mapeamento `'Quina de Grupo': 'QUINA_GRUPO'` na liquidação
3. Função de conferência `conferirQuinaGrupo` no `bet-rules-engine.ts` (se não existir)

## 📊 Status

- ✅ **15/16 modalidades mapeadas** (93.75%)
- ❌ **1 modalidade faltando** (6.25%)

---

**Última verificação**: 18/01/2026
