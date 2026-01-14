# Troubleshooting - Sistema de Liquidação e Temas

Este documento resume os principais problemas encontrados durante o desenvolvimento e suas soluções, para ajudar outros desenvolvedores a resolver problemas similares.

## 📋 Índice

1. [Problemas de Liquidação](#problemas-de-liquidação)
2. [Problemas de Build e Deploy](#problemas-de-build-e-deploy)
3. [Problemas de Temas](#problemas-de-temas)

---

## 🔄 Problemas de Liquidação

### Problema 1: Extrações não encontradas no banco de dados

**Sintoma:**
```
- Extração ID X não encontrada no banco
- Após filtro de loteria "X": 0 resultados
```

**Causa:**
As extrações estão armazenadas como um array estático no código (`/app/api/admin/extracoes/route.ts`), não no banco de dados Prisma.

**Solução:**
1. Criar arquivo separado para extrações: `/data/extracoes.ts`
2. Exportar o array `extracoes` deste arquivo
3. Importar em vez de buscar do banco:

```typescript
// ❌ ERRADO (tentava buscar do Prisma)
const extracao = await prisma.extracao.findUnique({
  where: { id: extracaoId }
})

// ✅ CORRETO (busca da lista estática)
import { extracoes } from '@/data/extracoes'
const extracao = extracoes.find((e: any) => e.id === extracaoId)
```

**Arquivos modificados:**
- `data/extracoes.ts` (novo)
- `app/api/admin/extracoes/route.ts`
- `app/api/resultados/liquidar/route.ts`

---

### Problema 2: Timeout ao buscar resultados oficiais

**Sintoma:**
```
⏱️ Timeout ao buscar resultados oficiais
```

**Causa:**
A API externa estava demorando muito para responder (>60s).

**Solução:**
1. Usar a API interna (`/api/resultados`) que já está funcionando
2. Implementar fallback para API externa se a interna falhar
3. Reduzir timeout para 30s (mais rápido)

```typescript
// ✅ CORRETO (usa API interna primeiro)
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
               (request.headers.get('host') ? `https://${request.headers.get('host')}` : 'http://localhost:3000')

const resultadosResponse = await fetch(`${baseUrl}/api/resultados`, {
  cache: 'no-store',
  signal: AbortSignal.timeout(30000)
})

// Se falhar, tenta API externa como fallback
```

**Arquivos modificados:**
- `app/api/resultados/liquidar/route.ts`

---

### Problema 3: Formato de data incompatível

**Sintoma:**
```
- Após filtro de data "2026-01-14": 0 resultados (antes: 28)
```

**Causa:**
- Resultados vêm no formato brasileiro: `"14/01/2026"`
- Apostas vêm no formato ISO: `"2026-01-14"`
- Comparação direta não funcionava

**Solução:**
Normalizar ambos os formatos antes de comparar:

```typescript
// ✅ CORRETO (normaliza ambos os formatos)
const dataAposta = aposta.dataConcurso.toISOString().split('T')[0]
const [anoAposta, mesAposta, diaAposta] = dataAposta.split('-')
const dataApostaFormatada = `${diaAposta}/${mesAposta}/${anoAposta}`

resultadosFiltrados = resultadosFiltrados.filter((r) => {
  const dataResultado = r.date || r.dataExtracao || ''
  
  // Compara formato ISO
  if (dataResultado.split('T')[0] === dataAposta) return true
  
  // Compara formato brasileiro
  if (dataResultado === dataApostaFormatada) return true
  
  // Comparação parcial (dia/mês/ano)
  const matchBR = dataResultado.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (matchBR) {
    const [_, dia, mes, ano] = matchBR
    if (`${ano}-${mes}-${dia}` === dataAposta) return true
  }
  
  return false
})
```

**Arquivos modificados:**
- `app/api/resultados/liquidar/route.ts`

---

## 🏗️ Problemas de Build e Deploy

### Problema 4: Next.js não permite exportar variáveis de arquivos de rota

**Sintoma:**
```
Type error: Route "app/api/admin/extracoes/route.ts" does not match the required types of a Next.js Route.
  "extracoes" is not a valid Route export field.
```

**Causa:**
Next.js só permite exportar funções de rota (GET, POST, etc.), não variáveis.

**Solução:**
Mover dados estáticos para arquivo separado:

```typescript
// ❌ ERRADO (exportar de route.ts)
// app/api/admin/extracoes/route.ts
export const extracoes = [...]

// ✅ CORRETO (arquivo separado)
// data/extracoes.ts
export const extracoes = [...]

// app/api/admin/extracoes/route.ts
import { extracoes } from '@/data/extracoes'
```

**Arquivos modificados:**
- `data/extracoes.ts` (novo)
- `app/api/admin/extracoes/route.ts`

---

### Problema 5: TypeScript Set iteration sem downlevelIteration

**Sintoma:**
```
Type error: Type 'Set<string | undefined>' can only be iterated through when using the '--downlevelIteration' flag
```

**Causa:**
Uso de spread operator `[...new Set()]` requer configuração especial do TypeScript.

**Solução:**
Usar `Array.from()` em vez de spread operator:

```typescript
// ❌ ERRADO
const exemplos = [...new Set(resultados.map(r => r.loteria))]

// ✅ CORRETO
const exemplos = Array.from(new Set(resultados.map(r => r.loteria).filter(Boolean) as string[]))
```

**Arquivos modificados:**
- `app/api/resultados/liquidar/route.ts`

---

### Problema 6: Campos opcionais causando erro de tipo ao editar tema

**Sintoma:**
```
Type error: Type 'string | undefined' is not assignable to type 'string'.
```

**Causa:**
Campos opcionais (`textoLink?`, `textoParagrafo?`, `textoTitulo?`) podem ser `undefined`, mas o formulário espera sempre strings.

**Solução:**
Garantir valores padrão ao editar:

```typescript
// ✅ CORRETO (garante valores padrão)
const handleEdit = (tema: Tema) => {
  setEditingTema(tema)
  setFormData({
    nome: tema.nome,
    cores: {
      ...tema.cores,
      textoLink: tema.cores.textoLink || tema.cores.primaria,
      textoParagrafo: tema.cores.textoParagrafo || tema.cores.texto,
      textoTitulo: tema.cores.textoTitulo || tema.cores.texto,
    },
  })
  setShowForm(true)
}
```

**Arquivos modificados:**
- `app/admin/temas/page.tsx`

---

## 🎨 Problemas de Temas

### Problema 7: Adicionar cores de texto personalizadas

**Sintoma:**
Usuário queria poder mudar cores de texto (títulos, parágrafos, links) além das cores básicas.

**Solução:**
1. Adicionar campos no schema Prisma:
   - `textoLink String @default("#052370")`
   - `textoParagrafo String @default("#1C1C1C")`
   - `textoTitulo String @default("#1C1C1C")`

2. Atualizar interface TypeScript:
```typescript
interface Tema {
  cores: {
    // ... cores existentes
    textoLink?: string
    textoParagrafo?: string
    textoTitulo?: string
  }
}
```

3. Aplicar via CSS variables no `TemaProvider`:
```typescript
root.style.setProperty('--tema-texto-link', tema.cores.textoLink || tema.cores.primaria)
root.style.setProperty('--tema-texto-paragrafo', tema.cores.textoParagrafo || tema.cores.texto)
root.style.setProperty('--tema-texto-titulo', tema.cores.textoTitulo || tema.cores.texto)
```

4. Criar classes CSS utilitárias:
```css
.text-tema-texto-link { color: var(--tema-texto-link); }
.text-tema-texto-paragrafo { color: var(--tema-texto-paragrafo); }
.text-tema-texto-titulo { color: var(--tema-texto-titulo); }
```

5. Adicionar campos no formulário admin

**Arquivos modificados:**
- `prisma/schema.prisma`
- `lib/temas-store.ts`
- `components/TemaProvider.tsx`
- `app/admin/temas/page.tsx`
- `app/globals.css`
- `tailwind.config.js`
- `app/page.tsx` (exemplo de uso)

---

## 🔍 Como Diagnosticar Problemas Similares

### Checklist de Debug

1. **Verificar logs do servidor**
   - Logs do cron job
   - Logs do Next.js
   - Logs do Prisma

2. **Verificar formato de dados**
   - Datas (ISO vs brasileiro)
   - IDs vs nomes
   - Tipos TypeScript

3. **Verificar APIs**
   - Timeout configurado?
   - Retry implementado?
   - Fallback disponível?

4. **Verificar build**
   - Erros de TypeScript?
   - Exportações válidas?
   - Dependências atualizadas?

### Comandos Úteis

```bash
# Ver logs do cron job
# (no Coolify: Logs > Terminal)

# Testar endpoint de liquidação
curl -X POST https://seu-dominio.com/api/resultados/liquidar

# Verificar build localmente
npm run build

# Verificar tipos TypeScript
npx tsc --noEmit

# Verificar schema Prisma
npx prisma format
npx prisma validate
```

---

## 📚 Referências

- [Documentação de Liquidação](./LOGICA_PREMIACAO.md)
- [Guia de Produção](./GUIA_PRODUCAO.md)
- [Comandos Coolify](./COMANDOS_COOLIFY.md)
- [Configuração de Cron](./CRON_COOLIFY.md)

---

## 💡 Dicas Gerais

1. **Sempre verificar logs** antes de assumir o problema
2. **Testar localmente** antes de fazer deploy
3. **Usar TypeScript strict** para pegar erros cedo
4. **Documentar mudanças** em arquivos de migração
5. **Implementar fallbacks** para APIs externas
6. **Normalizar formatos** antes de comparar dados

---

**Última atualização:** 14 de Janeiro de 2026
