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

### Problema 8: Campos opcionais causando erro de tipo em temas

**Sintoma:**
```
Type error: Type 'string | undefined' is not assignable to type 'string'.
```

**Causa:**
Campos opcionais (`textoLink?`, `textoParagrafo?`, `textoTitulo?`) podem ser `undefined`, mas o formulário espera sempre strings.

**Solução:**
Garantir valores padrão ao editar e ao resetar formulário:

```typescript
// ✅ CORRETO (garante valores padrão)
const handleEdit = (tema: Tema) => {
  setFormData({
    nome: tema.nome,
    cores: {
      ...tema.cores,
      textoLink: tema.cores.textoLink || tema.cores.primaria,
      textoParagrafo: tema.cores.textoParagrafo || tema.cores.texto,
      textoTitulo: tema.cores.textoTitulo || tema.cores.texto,
    },
  })
}

const resetForm = () => {
  setFormData({
    nome: '',
    cores: {
      // ... outras cores
      textoLink: '#052370',
      textoParagrafo: '#1C1C1C',
      textoTitulo: '#1C1C1C',
    },
  })
}
```

**Arquivos modificados:**
- `app/admin/temas/page.tsx`
- `hooks/useTema.ts` (atualizar interface)

---

## 🎯 Problemas de Validação e UX

### Problema 9: Permitir avançar sem selecionar posição

**Sintoma:**
Usuário conseguia avançar para o próximo passo sem selecionar uma posição.

**Causa:**
Falta de validação obrigatória no step 3 (posição).

**Solução:**
1. Adicionar validação no `handleNext`:
```typescript
if (currentStep === 3) {
  if (!betData.customPosition && !betData.position) {
    setAlertMessage({
      title: 'Posição não selecionada',
      message: 'Por favor, selecione uma posição ou marque "Personalizado" e digite uma posição válida.',
    })
    setShowAlert(true)
    return
  }
  
  if (betData.customPosition && (!betData.customPositionValue || betData.customPositionValue.trim() === '')) {
    setAlertMessage({
      title: 'Posição personalizada vazia',
      message: 'Por favor, digite uma posição personalizada (ex: 1-5, 7, 5, etc.).',
    })
    setShowAlert(true)
    return
  }
}
```

2. Desabilitar botão "Continuar" quando não houver posição:
```typescript
disabled={
  // ... outras validações
  (currentStep === 3 && !betData.customPosition && !betData.position) ||
  (currentStep === 3 && betData.customPosition && (!betData.customPositionValue || betData.customPositionValue.trim() === ''))
}
```

**Arquivos modificados:**
- `components/BetFlow.tsx`
- `components/PositionAmountDivision.tsx`

---

### Problema 10: Campo de posição personalizada não implementado

**Sintoma:**
Usuário queria poder escolher qualquer posição personalizada (ex: "1-5", "7", "5", "1-7", etc.), mas só havia checkbox sem campo de input.

**Causa:**
Falta de campo de texto para posição personalizada.

**Solução:**
1. Adicionar campo `customPositionValue` ao `BetData`:
```typescript
interface BetData {
  // ... outros campos
  customPosition: boolean
  customPositionValue?: string
}
```

2. Adicionar campo de input no componente:
```typescript
{customPosition && (
  <div className="mt-4">
    <label className="mb-2 block text-sm font-semibold text-gray-700">
      Digite a posição personalizada:
    </label>
    <input
      type="text"
      value={customPositionValue}
      onChange={(e) => onCustomPositionValueChange(e.target.value)}
      placeholder="Ex: 1-5, 7, 5, 1-7, etc."
      className="w-full rounded-lg border-2 border-gray-300 px-4 py-3"
    />
    <p className="mt-2 text-xs text-gray-500">
      Exemplos: "1-5" (do 1º ao 5º), "7" (só o 7º), "3" (só o 3º), "1-7" (do 1º ao 7º)
    </p>
  </div>
)}
```

3. Validar formato da posição personalizada:
```typescript
// Aceita: números únicos (1, 2, 3...), ranges (1-5, 2-7...)
const cleanedPos = customPos.replace(/º/g, '').replace(/\s/g, '')
const isValidFormat = /^\d+(-\d+)?$/.test(cleanedPos)

// Validar valores (entre 1 e 7)
const parts = cleanedPos.split('-')
const firstNum = parseInt(parts[0], 10)
const secondNum = parts[1] ? parseInt(parts[1], 10) : firstNum

if (firstNum < 1 || firstNum > 7 || secondNum < 1 || secondNum > 7 || firstNum > secondNum) {
  // Erro
}
```

4. Usar posição personalizada nos cálculos:
```typescript
const positionToUse = betData.customPosition && betData.customPositionValue 
  ? betData.customPositionValue.trim() 
  : betData.position
const { pos_from, pos_to } = parsePosition(positionToUse)
```

**Arquivos modificados:**
- `types/bet.ts`
- `components/PositionAmountDivision.tsx`
- `components/BetFlow.tsx`
- `app/api/apostas/route.ts`

---

## 🖼️ Problemas de Banner

### Problema 11: Banner não responsivo em mobile e desktop

**Sintoma:**
Banner não aparecia corretamente em diferentes tamanhos de tela.

**Causa:**
Uso de `background-size: cover` com altura fixa causava cortes em mobile.

**Solução:**
Usar `aspect-ratio` 16:9 com `padding-top` para manter proporção:

```typescript
<div
  className="relative w-full overflow-hidden"
  style={{
    paddingTop: banner.bannerImage ? '56.25%' : '0', // 16:9 aspect ratio (9/16 = 0.5625)
    minHeight: banner.bannerImage ? '0' : '400px',
  }}
>
  {banner.bannerImage && (
    <img
      src={banner.bannerImage}
      alt={banner.title || 'Banner'}
      className="absolute top-0 left-0 w-full h-full object-cover"
      style={{ objectPosition: 'center center' }}
      loading="lazy"
    />
  )}
</div>
```

**Arquivos modificados:**
- `components/HeroBanner.tsx`

---

### Problema 12: Validação de dimensões e formato de banner

**Sintoma:**
Banners sendo enviados sem validação de proporção 16:9 e tamanho mínimo.

**Causa:**
Falta de validação no frontend antes do upload.

**Solução:**
1. Validar dimensões no frontend antes do upload:
```typescript
const validateBannerImage = (file: File): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      const width = img.width
      const height = img.height
      
      // Validar proporção 16:9 (com tolerância de ±5%)
      const aspectRatio = width / height
      const idealRatio = 16 / 9
      const tolerance = 0.05
      const minRatio = idealRatio * (1 - tolerance)
      const maxRatio = idealRatio * (1 + tolerance)

      if (aspectRatio < minRatio || aspectRatio > maxRatio) {
        resolve(`Proporção incorreta. Use 16:9 (ex.: 1920×1080 ou 1600×900).\nAtual: ${width}×${height}px`)
        return
      }

      // Validar tamanho mínimo recomendado
      const minWidth = 1200
      const minHeight = 675
      if (width < minWidth || height < minHeight) {
        resolve(`Dimensões muito pequenas. Mínimo recomendado: ${minWidth}×${minHeight}px.\nAtual: ${width}×${height}px`)
        return
      }

      resolve(null) // Válido
    }
    
    img.src = url
  })
}
```

2. Adicionar box informativo no formulário com especificações

**Arquivos modificados:**
- `app/admin/banners/new/page.tsx`
- `app/api/upload/route.ts`

---

## 🗑️ Remoção de Funcionalidades

### Problema 13: Remover PONTO-CORUJA dos horários especiais

**Sintoma:**
Usuário queria remover o "PONTO-CORUJA 22h" da lista de horários especiais.

**Solução:**
1. Remover de `SPECIAL_QUOTATIONS`:
```typescript
export const SPECIAL_QUOTATIONS: SpecialQuotation[] = [
  // ... outras cotações
  // Removido: { id: 4, name: 'PONTO-CORUJA 22h', ... }
]
```

2. Remover de `SPECIAL_TIMES`:
```typescript
export const SPECIAL_TIMES: SpecialTime[] = [
  // Array vazio - removido PONTO-CORUJA
]
```

3. Remover da API de lottery:
```typescript
// Remover objeto com id: 'ponto-coruja'
```

4. Atualizar componente para não mostrar seção vazia:
```typescript
{!instant && SPECIAL_TIMES.length > 0 && (
  // Seção de horários especiais
)}
```

**Arquivos modificados:**
- `data/modalities.ts`
- `app/api/lottery/route.ts`
- `components/LocationSelection.tsx`

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

## 🐛 Problemas de Lógica de Negócio

### Problema 14: Apostas instantâneas marcadas como ganhas mesmo quando perdiam

**Sintoma:**
Apostas instantâneas apareciam como "Ganhou" (liquidado) mesmo quando não ganharam.

**Causa:**
Todas as apostas instantâneas eram marcadas como `'liquidado'` independentemente de terem ganhado ou perdido:

```typescript
// ❌ ERRADO (antes)
status: isInstant ? 'liquidado' : (status || 'pendente'),
```

**Solução:**
Verificar se `premioTotal > 0` para determinar o status:

```typescript
// ✅ CORRETO (agora)
let statusFinal: string
if (isInstant) {
  // Aposta instantânea: liquidado se ganhou, perdida se não ganhou
  statusFinal = premioTotal > 0 ? 'liquidado' : 'perdida'
} else {
  // Aposta normal: pendente até ser liquidada pelo cron
  statusFinal = status || 'pendente'
}
```

**Arquivos modificados:**
- `app/api/apostas/route.ts`

**Exemplo:**
- Palpite: 12-13 (grupos 12 e 13)
- Resultado: grupos 23, 25, 10 nas posições 1-3
- Resultado esperado: `'perdida'` (não ganhou)
- Antes: marcava como `'liquidado'` incorretamente
- Agora: marca como `'perdida'` corretamente

---

### Problema 15: Confusão entre realCloseTime e closeTime

**Sintoma:**
Horários de fechamento e apuração estavam sendo usados incorretamente.

**Causa:**
Confusão sobre qual campo representa o quê:
- `realCloseTime` = quando fecha no site (para de aceitar apostas)
- `closeTime` = quando acontece a apuração no "bicho certo"

**Solução:**
Garantir uso correto em todo o código:

```typescript
// ✅ CORRETO
// realCloseTime = quando fecha no site (para de aceitar apostas)
// closeTime = quando acontece a apuração no bicho certo
const closeStr = e.realCloseTime || e.closeTime || e.time // Usa realCloseTime primeiro
```

**Exibição:**
```typescript
// Mostra quando fecha no site
Fecha às <strong>{ext.closeStr}</strong> // realCloseTime
// Mostra quando acontece apuração (se diferente)
{ext.realCloseTime && ext.realCloseTime !== ext.closeTime && (
  <span>(apuracao: {ext.closeTime})</span>
)}
```

**Arquivos modificados:**
- `components/LocationSelection.tsx`

---

## 📚 Documentação Adicional Criada

### Guia de Banner para Sora
- **Arquivo:** `/docs/GUIA_BANNER_SORA.md`
- **Conteúdo:** Prompt completo para criar banners no Sora com especificações técnicas, exemplos de prompts, e checklist de validação

---

**Última atualização:** 14 de Janeiro de 2026

## 📊 Resumo das Últimas Modificações

### Validações e UX
- ✅ Validação obrigatória de posição antes de avançar
- ✅ Campo de posição personalizada com validação de formato
- ✅ Botão "Continuar" desabilitado quando não há posição selecionada
- ✅ Suporte para posições individuais (1, 2, 3, 4, 5, 6, 7) e ranges (1-5, 1-7, etc.)

### Temas
- ✅ Cores de texto personalizadas (link, parágrafo, título)
- ✅ Correção de tipos TypeScript para campos opcionais
- ✅ Interface atualizada no hook `useTema`

### Banners
- ✅ Responsividade perfeita usando aspect-ratio 16:9
- ✅ Validação de dimensões e proporção antes do upload
- ✅ Box informativo com especificações no formulário

### Limpeza
- ✅ Remoção completa do PONTO-CORUJA
- ✅ Seção de horários especiais oculta quando vazia

### Correções Críticas
- ✅ Bug corrigido: apostas instantâneas marcadas corretamente (ganhou/perdeu)
- ✅ Horários de extrações: realCloseTime fecha no site, closeTime é apuração

---

## 🐛 Problemas de Liquidação e Resultados

### Problema 16: Liquidação ocorrendo antes do horário de apuração

**Sintoma:**
Apostas sendo liquidadas antes do horário correto de apuração, causando resultados incorretos.

**Causa:**
O sistema não verificava se já havia passado o horário de apuração (`closeTime`) antes de liquidar apostas.

**Solução:**
Implementada função `jaPassouHorarioApuracao()` que:
1. Identifica a extração da aposta pelo ID da loteria
2. Busca o `closeTime` (horário de apuração) da extração
3. Compara com o horário atual:
   - Se for hoje: verifica se já passou o horário de apuração
   - Se for dia passado: permite liquidar
   - Se for dia futuro: não permite liquidar ainda

**Arquivos modificados:**
- `app/api/resultados/liquidar/route.ts`

**Exemplo de log:**
```
⏰ Ainda não passou o horário de apuração (15:20)
⏸️  Pulando aposta 9 - aguardando apuração
```

---

### Problema 17: Extrações não encontram resultados devido a nomes diferentes

**Sintoma:**
Algumas extrações não conseguem encontrar resultados na API externa, mesmo quando os resultados existem. Os logs mostram que a API externa retorna nomes diferentes dos cadastrados:
- API externa: "PT Rio de Janeiro" → Sistema cadastrado: "PT RIO"
- API externa: "PT-SP/Bandeirantes" → Sistema cadastrado: "PT SP"
- API externa: "PT Bahia" → Sistema cadastrado: "PT BAHIA"

**Causa:**
O sistema fazia match exato ou muito restritivo entre os nomes das extrações cadastradas e os nomes retornados pela API externa, causando falhas na liquidação.

**Solução:**
Implementado sistema de mapeamento flexível que:
1. Cria lista de nomes possíveis para cada extração (incluindo variações comuns)
2. Faz match por palavras-chave principais
3. Tenta match parcial por palavras individuais
4. Fallback para buscar sem filtro de loteria se necessário

**Mapeamentos implementados:**
- **PT RIO** → "pt rio", "pt rio de janeiro", "pt-rio", "pt-rio de janeiro", "mpt-rio", "mpt rio"
- **PT BAHIA** → "pt bahia", "pt-ba", "maluca bahia"
- **PT SP** → "pt sp", "pt-sp", "pt sp bandeirantes", "pt-sp/bandeirantes", "bandeirantes", "pt sp (band)"
- **LOOK** → "look", "look goiás", "look goias"
- **LOTEP** → "lotep", "pt paraiba/lotep", "pt paraiba", "pt paraíba", "pt-pb"
- E outras variações

**Arquivos modificados:**
- `app/api/resultados/liquidar/route.ts`

**Exemplo de log:**
```
- Loteria ID 16 → Nome: "PT RIO" (ativa: true)
- Nomes possíveis para match: pt rio, PT RIO, pt rio de janeiro, pt-rio...
- Após filtro de loteria "PT RIO": 28 resultados (antes: 157)
```

---

### Problema 18: Logs de debug para identificar problemas de resultados

**Sintoma:**
Dificuldade em identificar quais extrações têm resultados disponíveis e quantos horários cada uma possui.

**Solução:**
Adicionados logs detalhados na API de resultados que mostram:
1. Quantos horários cada extração tem
2. Total de extrações e horários processados
3. Quantos grupos únicos foram criados após o agrupamento
4. Lista dos grupos (loteria|horário|data) para facilitar identificação

**Arquivos modificados:**
- `app/api/resultados/route.ts`

**Exemplo de log:**
```
📊 Extração "PT RIO": 5 horário(s) - 11:20, 14:20, 16:20, 18:20, 21:20
📊 Extração "PT BAHIA": 5 horário(s) - 10:20, 12:20, 15:20, 19:00, 21:20
📈 Total processado: 18 extrações, 49 horários, 157 resultados
✅ Resultados finais: 6 grupos únicos (loteria|horário|data), 24 resultados totais
```

---

### Correções Críticas
- ✅ Bug corrigido: apostas instantâneas marcadas corretamente (ganhou/perdeu)
- ✅ Horários de extrações: realCloseTime fecha no site, closeTime é apuração
- ✅ Verificação de horário de apuração antes de liquidar
- ✅ Mapeamento flexível de nomes de extrações para encontrar resultados
- ✅ Logs detalhados para debug de problemas de resultados
