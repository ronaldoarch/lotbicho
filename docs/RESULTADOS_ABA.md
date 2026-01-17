# 📊 Aba de Resultados - Integração com bichocerto.com

## 📋 Resumo

A aba de resultados agora exibe resultados diretamente dos endpoints do bichocerto.com, incluindo todas as loterias disponíveis.

---

## 🎯 Como Funciona

### Fluxo de Exibição

1. **Usuário acessa `/resultados`**
   - Página carrega com data padrão (hoje)
   - Hook `useResultados` faz requisição para `/api/resultados`

2. **API busca resultados**
   - Busca resultados de todas as loterias em paralelo
   - Loterias: `ln`, `sp`, `ba`, `pb`, `bs`, `lce`, `lk`, `fd`
   - Retorna resultados formatados

3. **Filtros aplicados**
   - Por data: Filtra resultados pela data selecionada
   - Por localização: Filtra por UF ou nome de localização
   - Sem filtro: Mostra TODOS os resultados (incluindo Nacional)

4. **Agrupamento e exibição**
   - Agrupa resultados por `loteria|horário|data`
   - Ordena por horário
   - Limita a 7 posições por grupo
   - Exibe em tabelas por horário

---

## 📊 Loterias Exibidas

### Todas as Loterias Disponíveis

| Código | Nome | Estado | Horários |
|--------|------|--------|----------|
| `ln` | Nacional | BR | 8 horários (02h, 08h, 10h, 12h, 15h, 17h, 21h, 23h) |
| `sp` | PT-SP/Bandeirantes | SP | 8 horários |
| `ba` | PT Bahia | BA | 5 horários |
| `pb` | PT Paraíba/Lotep | PB | 6 horários |
| `bs` | Boa Sorte Goiás | GO | 6 horários |
| `lce` | Lotece | CE | 4 horários |
| `lk` | Look Goiás | GO | 8 horários |
| `fd` | Loteria Federal | BR | Variável (Quarta/Sábado) |

---

## 🔍 Filtros Disponíveis

### Por Data

- **Padrão**: Data atual
- **Formato**: `YYYY-MM-DD`
- **Limite**: Últimos 10 dias (sem PHPSESSID) ou histórico completo (com PHPSESSID)

### Por Localização

- **Rio de Janeiro** → Filtra resultados de RJ (PT RIO)
- **São Paulo** → Filtra resultados de SP (PT-SP/Bandeirantes)
- **Bahia** → Filtra resultados de BA (PT Bahia)
- **Paraíba** → Filtra resultados de PB (LOTEP)
- **Ceará** → Filtra resultados de CE (LOTECE)
- **Goiás** → Filtra resultados de GO (LOOK, Boa Sorte)
- **Distrito Federal** → Filtra resultados de DF
- **Sem filtro** → Mostra TODOS os resultados (incluindo Nacional)

---

## 🇧🇷 Resultados Nacionais

### Como aparecem?

Resultados nacionais (Nacional e Federal) aparecem quando:
- **Sem filtro de localização**: Aparecem automaticamente
- **Filtro "Nacional" ou "Brasil"**: Aparecem explicitamente
- **Estado BR**: Aparecem quando filtro é BR

### Formato

```
Nacional - 23h
Nacional - 21h
Nacional - 17h
...
Federal - 20h (Quarta/Sábado)
```

---

## 📝 Exemplo de Uso

### Buscar Resultados de Hoje

```typescript
// Hook já faz isso automaticamente
const { results, loading, load } = useResultados({ 
  date: '2026-01-17', 
  location: 'Rio de Janeiro' 
})

// Resultados são agrupados por horário
const groupedResults = groupResultsByDrawTime(results, location, date)
```

### Buscar Todos os Resultados (Incluindo Nacional)

```typescript
// Sem filtro de localização
const { results } = useResultados({ 
  date: '2026-01-17'
  // location não especificado
})

// Retorna TODOS os resultados de todas as loterias
```

---

## 🔧 Componentes Envolvidos

### Frontend

- **`app/resultados/page.tsx`**: Página principal de resultados
- **`hooks/useResultados.ts`**: Hook para buscar resultados
- **`components/ResultsTable.tsx`**: Componente de tabela de resultados
- **`lib/resultados-helpers.ts`**: Funções auxiliares (agrupamento, formatação)

### Backend

- **`app/api/resultados/route.ts`**: API que busca resultados do bichocerto.com
- **`lib/bichocerto-parser.ts`**: Parser HTML e conversão de formato

---

## 🐛 Troubleshooting

### Problema: Nacional não aparece

**Verificar:**
1. Se há filtro de localização ativo
2. Se resultados estão sendo retornados pela API
3. Se filtro está bloqueando resultados BR

**Solução:**
- Remover filtro de localização para ver todos os resultados
- Verificar logs da API: `📊 Total combinado: X resultados`
- Verificar se Nacional está na lista de loterias buscadas

### Problema: Resultados não aparecem

**Verificar:**
1. Se data está dentro do intervalo permitido
2. Se API está retornando dados
3. Se filtros estão muito restritivos

**Solução:**
- Verificar console do navegador para erros
- Verificar logs do servidor
- Testar sem filtros primeiro

### Problema: Resultados duplicados

**Verificar:**
1. Se agrupamento está funcionando corretamente
2. Se chave de agrupamento está correta

**Solução:**
- Verificar logs: `📦 Agrupamento: X resultados → Y grupos únicos`
- Verificar formato da chave: `loteria|horário|data`

---

## 📊 Logs Úteis

### API de Resultados

```
🌐 Usando endpoints diretos do bichocerto.com
📅 Buscando resultados para data: 2026-01-17
🔍 Buscando resultados de ln (NACIONAL)...
   ✅ ln: 8 extração(ões), 56 resultado(s)
🔍 Buscando resultados de sp (PT SP)...
   ✅ sp: 8 extração(ões), 56 resultado(s)
...
📊 Total combinado: 448 resultados de 8 loterias
📍 Sem filtro de localização: mantendo todos os 448 resultados
📦 Agrupamento: 448 resultados → 64 grupos únicos
✂️  Após limitar a 7 posições por grupo: 448 resultados
```

### Frontend

```javascript
// Hook useResultados
console.log('Resultados carregados:', results.length)
console.log('Grupos:', groupedResults.length)
```

---

## ✅ Checklist

- [x] API busca todas as loterias
- [x] Resultados são formatados corretamente
- [x] Nacional aparece quando sem filtro
- [x] Filtros funcionam corretamente
- [x] Agrupamento por horário funciona
- [x] Limitação a 7 posições funciona
- [x] Ordenação por horário funciona

---

## 🔗 Referências

- API de Resultados: `app/api/resultados/route.ts`
- Parser: `lib/bichocerto-parser.ts`
- Migração: `docs/MIGRACAO_BICHOCERTO_DIRETO.md`
- Liquidação: `docs/LIQUIDACAO_BICHOCERTO_DIRETO.md`
