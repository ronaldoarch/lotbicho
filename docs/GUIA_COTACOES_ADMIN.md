# Guia Completo: Implementação de Cotações no Admin

Este guia explica como funciona o sistema de cotações no admin e como as alterações afetam a **Home**, a página **Apostar** e a página **Cotações**.

---

## 📋 Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
3. [Admin: Gerenciamento de Cotações](#admin-gerenciamento-de-cotações)
4. [Como as Cotações Afetam Cada Página](#como-as-cotações-afetam-cada-página)
5. [Fluxo de Dados](#fluxo-de-dados)
6. [Exemplos Práticos](#exemplos-práticos)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral do Sistema

O sistema de cotações permite que administradores criem e gerenciem cotações especiais que sobrescrevem as cotações padrão das modalidades. As cotações podem ser:

- **Gerais**: Aplicam-se a todas as modalidades
- **Específicas**: Vinculadas a uma modalidade específica
- **Por Extração**: Vinculadas a uma extração específica (ex: PONTO-NOITE)
- **Por Promoção**: Vinculadas a uma promoção ativa
- **Especiais**: Marcadas com foguinho 🔥 para destacar

### Tipos de Cotações

1. **Cotações Padrão**: Armazenadas na tabela `Modalidade` (campo `value`)
2. **Cotações Especiais**: Armazenadas na tabela `Cotacao` (com `isSpecial: true`)

---

## 🗄️ Estrutura do Banco de Dados

### Tabela `Modalidade`

```prisma
model Modalidade {
  id        Int      @id @default(autoincrement())
  name      String   // Ex: "Milhar", "Grupo"
  value     String   // Ex: "1x R$ 6000.00"
  hasLink   Boolean  @default(false)
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Localização**: `/app/admin/modalidades/page.tsx`

### Tabela `Cotacao`

```prisma
model Cotacao {
  id           Int      @id @default(autoincrement())
  name         String?  // Nome opcional da cotação
  value        String?  // Valor da cotação (ex: "1x R$ 7000.00")
  modalidadeId Int?     // ID da modalidade (null = todas)
  extracaoId   Int?     // ID da extração (null = todas)
  promocaoId   Int?     // ID da promoção (null = nenhuma)
  isSpecial    Boolean  @default(false) // Marca com foguinho 🔥
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

**Localização**: `/app/admin/cotacoes/page.tsx`

---

## 🔧 Admin: Gerenciamento de Cotações

### Acessando o Admin de Cotações

1. Acesse `/admin/cotacoes`
2. Você verá uma tabela com todas as cotações cadastradas

### Criando uma Nova Cotação

**Rota**: `/admin/cotacoes/new`

**Campos do Formulário**:

- **Nome**: Nome opcional da cotação (ex: "Cotação Especial PONTO-NOITE")
- **Valor**: Valor no formato `1x R$ XXXX.XX` (ex: "1x R$ 7000.00")
- **Modalidade**: 
  - Selecione uma modalidade específica OU
  - Deixe "Todas" para aplicar a todas as modalidades
- **Extração**: 
  - Selecione uma extração específica (ex: PONTO-NOITE) OU
  - Deixe "Todas" para aplicar a todas as extrações
- **Promoção**: 
  - Selecione uma promoção ativa OU
  - Deixe "Nenhuma"
- **Especial**: Marque para exibir foguinho 🔥
- **Ativa**: Marque para ativar a cotação

**API**: `POST /api/admin/cotacoes`

```typescript
{
  name: string | null,
  value: string,
  modalidadeId: number | null,
  extracaoId: number | null,
  promocaoId: number | null,
  isSpecial: boolean,
  active: boolean
}
```

### Editando uma Cotação

**Rota**: `/admin/cotacoes/[id]`

- Clique em "Editar" na tabela de cotações
- Modifique os campos desejados
- Clique em "Salvar"

**API**: `PUT /api/admin/cotacoes`

### Deletando uma Cotação

- Clique em "Deletar" na tabela de cotações
- Confirme a exclusão

**API**: `DELETE /api/admin/cotacoes?id={id}`

### Ativando/Desativando uma Cotação

- Clique no botão de status (Ativa/Inativa) na tabela
- A cotação será atualizada automaticamente

**API**: `PUT /api/admin/cotacoes` (com `active: true/false`)

---

## 📄 Como as Cotações Afetam Cada Página

### 1. Home (`/`)

**Componente**: `LiveQuotation.tsx`

**Localização**: `/components/LiveQuotation.tsx`

**Comportamento Atual**:
- Exibe cotações **hardcoded** em um carrossel Swiper
- Não busca cotações do banco de dados
- Mostra 6 cotações fixas:
  - Quina de Grupo: R$ 5.000,00
  - Milhar/Centena: R$ 3.300,00
  - Milhar Invertida: R$ 6.000,00
  - Milhar: R$ 6.000,00
  - Terno de Dezena: R$ 5.000,00
  - Quadra de Grupo: R$ 1.000,00

**Como Melhorar**:
```typescript
// Em LiveQuotation.tsx, substituir QUOTATIONS hardcoded por:
const [quotations, setQuotations] = useState([])

useEffect(() => {
  fetch('/api/cotacoes/especiais')
    .then(res => res.json())
    .then(data => {
      // Pegar as 6 primeiras cotações especiais ativas
      setQuotations(data.cotacoes.slice(0, 6))
    })
}, [])
```

**Impacto**: 
- ✅ Cotações especiais criadas no admin aparecerão automaticamente na home
- ✅ Cotações inativas não aparecerão
- ✅ Cotações com foguinho 🔥 serão destacadas

---

### 2. Página de Cotações (`/jogo-do-bicho/cotacao`)

**Componente**: `QuotationGrid.tsx`

**Localização**: `/components/QuotationGrid.tsx`

**Comportamento**:

1. **Carrega Modalidades do Banco**:
   - Usa o hook `useModalidades()` que busca de `/api/modalidades`
   - Fallback para `MODALITIES` estático se o banco não retornar dados

2. **Carrega Cotações Especiais**:
   - Busca de `/api/cotacoes/especiais`
   - Filtra apenas cotações com `isSpecial: true` e `active: true`

3. **Exibição**:
   - Para cada modalidade, verifica se existe cotação especial
   - Se existir, mostra a cotação especial (com foguinho 🔥)
   - Se não existir, mostra a cotação padrão da modalidade

**Código Relevante**:
```typescript
// Verifica se modalidade tem cotação especial
const hasSpecialQuotation = (modalidadeId: number, modalidadeName: string) => {
  return cotacoesEspeciais.some(c => {
    if (c.modalidadeId === modalidadeId) return true
    // Fallback por nome
    const cotacaoModalidade = modalidadesParaExibir.find(m => m.id === c.modalidadeId)
    return cotacaoModalidade?.name === modalidadeName
  })
}

// Obtém cotação especial ou padrão
const specialQuot = isSpecial 
  ? getSpecialQuotation(quotation.id, quotation.name) 
  : null

// Exibe valor
<p className="mb-4 text-2xl font-extrabold text-blue">
  {specialQuot?.value || quotation.value}
</p>
```

**Impacto**:
- ✅ Cotações especiais criadas no admin aparecem automaticamente
- ✅ Cotações especiais têm foguinho 🔥
- ✅ Cotações inativas não aparecem
- ✅ Se uma modalidade tem múltiplas cotações especiais, mostra a primeira encontrada

---

### 3. Página Apostar (`/apostar`)

**Componente**: `BetFlow.tsx`

**Localização**: `/components/BetFlow.tsx`

**Comportamento**:

1. **Seleção de Modalidade** (Step 1):
   - Usa `ModalitySelection` que carrega modalidades do banco
   - Cotações especiais aparecem no modal `SpecialQuotationsModal`

2. **Cálculo de Retorno Previsto** (Step 5):
   - Prioriza cotação especial se disponível
   - Fallback para cotação da modalidade do banco
   - Fallback para cotação padrão do arquivo estático

**Código Relevante**:
```typescript
// Em calcularRetornoPrevisto()
let odd: number

if (cotacaoEspecial && cotacaoEspecial.value) {
  // Extrair valor da cotação especial (ex: "1x R$ 7000.00" -> 7000)
  const rMatch = cotacaoEspecial.value.match(/R\$\s*(\d+(?:\.\d+)?)/)
  if (rMatch) {
    odd = parseFloat(rMatch[1])
  }
} else {
  // Buscar cotação da modalidade do banco
  const modalidadeDoBanco = modalidades.find(m => 
    m.name === betData.modalityName && m.active !== false
  )
  
  if (modalidadeDoBanco && modalidadeDoBanco.value) {
    const rMatch = modalidadeDoBanco.value.match(/R\$\s*(\d+(?:\.\d+)?)/)
    if (rMatch) {
      odd = parseFloat(rMatch[1])
    }
  } else {
    // Fallback para buscarOdd (arquivo estático)
    odd = buscarOdd(modalityType, pos_from, pos_to, betData.modalityName)
  }
}
```

**Parâmetros da URL**:
- `?modalidade={id}`: Seleciona modalidade automaticamente
- `?modalidadeName={nome}`: Nome da modalidade
- `?extracao={id}`: Seleciona extração automaticamente
- `?cotacaoEspecial={id}`: Usa cotação especial específica

**Impacto**:
- ✅ Cotações especiais são usadas no cálculo de retorno previsto
- ✅ Cotações do banco de dados têm prioridade sobre cotações estáticas
- ✅ Cotações inativas não são usadas
- ✅ Usuário pode clicar em cotação especial e ser redirecionado para apostar

---

## 🔄 Fluxo de Dados

### 1. Admin Cria Cotação

```
Admin → /admin/cotacoes/new
  ↓
Preenche formulário
  ↓
POST /api/admin/cotacoes
  ↓
Prisma cria registro em Cotacao
  ↓
Cotação salva no banco
```

### 2. Home Carrega Cotações

```
Home → LiveQuotation.tsx
  ↓
GET /api/cotacoes/especiais
  ↓
Prisma busca cotações com isSpecial: true
  ↓
Exibe no carrossel
```

### 3. Página Cotações Carrega Cotações

```
CotacaoPage → QuotationGrid.tsx
  ↓
useModalidades() → GET /api/modalidades
  ↓
loadCotacoesEspeciais() → GET /api/cotacoes/especiais
  ↓
Para cada modalidade:
  - Verifica se tem cotação especial
  - Se sim, exibe cotação especial (com 🔥)
  - Se não, exibe cotação padrão da modalidade
```

### 4. Página Apostar Usa Cotações

```
ApostarPage → BetFlow.tsx
  ↓
useModalidades() → GET /api/modalidades
  ↓
Se tem cotacaoEspecial na URL:
  → GET /api/admin/cotacoes
  → Busca cotação especial
  ↓
calcularRetornoPrevisto():
  1. Prioriza cotacaoEspecial
  2. Fallback para modalidade do banco
  3. Fallback para buscarOdd (estático)
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Criar Cotação Especial para Milhar no PONTO-NOITE

1. Acesse `/admin/cotacoes/new`
2. Preencha:
   - **Nome**: "Milhar PONTO-NOITE"
   - **Valor**: "1x R$ 7000.00"
   - **Modalidade**: "Milhar" (ID: 9)
   - **Extração**: "PONTO-NOITE" (ID correspondente)
   - **Especial**: ✅ Marcado
   - **Ativa**: ✅ Marcado
3. Clique em "Salvar"

**Resultado**:
- ✅ Na página `/jogo-do-bicho/cotacao`, a modalidade "Milhar" mostrará "1x R$ 7000.00" com foguinho 🔥
- ✅ Na página `/apostar`, se selecionar Milhar + PONTO-NOITE, usará R$ 7000.00 no cálculo
- ✅ Na home, pode aparecer no carrossel (se implementar busca dinâmica)

### Exemplo 2: Criar Cotação Geral para Todas as Modalidades

1. Acesse `/admin/cotacoes/new`
2. Preencha:
   - **Nome**: "Promoção Dobro de Prêmio"
   - **Valor**: "1x R$ 12000.00"
   - **Modalidade**: "Todas"
   - **Extração**: "Todas"
   - **Especial**: ✅ Marcado
   - **Ativa**: ✅ Marcado
3. Clique em "Salvar"

**Resultado**:
- ✅ Todas as modalidades na página de cotações mostrarão "1x R$ 12000.00" com foguinho 🔥
- ⚠️ **Atenção**: Isso pode causar conflito se houver múltiplas cotações especiais. O sistema mostra a primeira encontrada.

### Exemplo 3: Desativar Cotação Temporariamente

1. Acesse `/admin/cotacoes`
2. Encontre a cotação desejada
3. Clique no botão "Ativa" para desativar

**Resultado**:
- ✅ Cotação não aparecerá mais na página de cotações
- ✅ Cotação não será usada no cálculo de retorno previsto
- ✅ Cotação pode ser reativada facilmente

---

## 🔍 Troubleshooting

### Problema: Cotação não aparece na página de cotações

**Possíveis Causas**:
1. Cotação não está marcada como `isSpecial: true`
2. Cotação está `active: false`
3. Modalidade não está vinculada corretamente (`modalidadeId` incorreto)

**Solução**:
1. Verifique em `/admin/cotacoes` se a cotação está ativa e marcada como especial
2. Verifique se o `modalidadeId` corresponde ao ID da modalidade no banco
3. Verifique no console do navegador se há erros ao buscar cotações

### Problema: Cotação especial não é usada no cálculo de retorno

**Possíveis Causas**:
1. Parâmetro `cotacaoEspecial` não está na URL
2. Cotação não está ativa
3. Modalidade não corresponde

**Solução**:
1. Verifique se a URL contém `?cotacaoEspecial={id}`
2. Verifique se a cotação está ativa em `/admin/cotacoes`
3. Verifique se o `modalidadeId` da cotação corresponde à modalidade selecionada

### Problema: Múltiplas cotações especiais para mesma modalidade

**Comportamento Atual**:
- O sistema mostra a primeira cotação encontrada
- Não há priorização automática

**Solução Recomendada**:
- Crie cotações específicas por extração para evitar conflitos
- Use `extracaoId` para vincular cotações a extrações específicas
- Desative cotações antigas ao criar novas

### Problema: Home ainda mostra cotações hardcoded

**Causa**:
- `LiveQuotation.tsx` usa array `QUOTATIONS` estático

**Solução**:
- Implemente busca dinâmica conforme exemplo na seção "Home"

---

## 📝 Notas Importantes

1. **Prioridade de Cotações**:
   - Cotação Especial (com `cotacaoEspecial` na URL) > Cotação da Modalidade do Banco > Cotação Estática

2. **Formato de Valor**:
   - Sempre use o formato: `"1x R$ XXXX.XX"`
   - O sistema extrai o valor numérico usando regex: `/R\$\s*(\d+(?:\.\d+)?)/`

3. **Cotações por Extração**:
   - Cotações vinculadas a extrações específicas só aparecem quando a extração é selecionada
   - Use `extracaoId` para criar cotações específicas por horário

4. **Performance**:
   - Cotações são buscadas do banco em tempo real
   - Considere implementar cache se houver muitas requisições

5. **Fallback**:
   - Se o banco não retornar modalidades, o sistema usa `MODALITIES` estático
   - Se não houver cotação especial, usa cotação padrão da modalidade

---

## 🚀 Melhorias Futuras Sugeridas

1. **Home Dinâmica**: Implementar busca dinâmica de cotações em `LiveQuotation.tsx`
2. **Priorização**: Adicionar campo `priority` para ordenar cotações
3. **Validação**: Validar formato de valor no admin antes de salvar
4. **Cache**: Implementar cache de cotações para melhor performance
5. **Histórico**: Adicionar histórico de alterações de cotações
6. **Filtros**: Adicionar filtros na página de cotações (por modalidade, extração, etc.)

---

## 📚 Arquivos Relacionados

### Admin
- `/app/admin/cotacoes/page.tsx` - Lista de cotações
- `/app/admin/cotacoes/new/page.tsx` - Criar cotação
- `/app/admin/cotacoes/[id]/page.tsx` - Editar cotação
- `/app/api/admin/cotacoes/route.ts` - API CRUD de cotações

### Frontend
- `/components/LiveQuotation.tsx` - Carrossel na home
- `/components/QuotationGrid.tsx` - Grid na página de cotações
- `/components/BetFlow.tsx` - Fluxo de apostas
- `/components/SpecialQuotationsModal.tsx` - Modal de cotações especiais

### APIs
- `/app/api/cotacoes/especiais/route.ts` - Buscar cotações especiais
- `/app/api/modalidades/route.ts` - Buscar modalidades

### Hooks
- `/hooks/useModalidades.ts` - Hook para carregar modalidades

### Dados Estáticos
- `/data/modalities.ts` - Modalidades padrão (fallback)

---

**Última atualização**: Dezembro 2024
