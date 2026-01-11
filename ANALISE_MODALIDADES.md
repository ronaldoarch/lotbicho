# Análise da Estrutura de Modalidades

## Estrutura Atual dos Cards de Modalidades

### Grid Layout
- **Mobile**: 1 coluna (`grid-cols-1`)
- **Desktop**: 2 colunas (`md:grid-cols-2`)
- **Gap**: `gap-2` (8px entre cards)

### Card Structure
Cada card de modalidade é um `<button>` com:
- **Padding**: `py-1.5 px-0.5` (muito pequeno - 6px vertical, 2px horizontal)
- **Border**: `border-2` (2px)
- **Border Radius**: `rounded-md` (6px)
- **Layout**: `flex flex-col` (coluna)
- **Text Align**: `text-left`

### Tamanhos de Texto
- **Título (nome)**: `text-xs` (12px) - `font-semibold`
- **Valor**: `text-sm` (14px) - `font-bold`
- **Ícone fogo (🔥)**: `text-xs` (12px) - `leading-none`

### Estados dos Cards
1. **Normal**: 
   - Border: `border-gray-200`
   - Background: `bg-white`
   - Hover: `hover:border-blue/30`

2. **Selecionado**:
   - Border: `border-blue`
   - Background: `bg-blue/5`

### Organização
- Total de 16 modalidades
- Organizadas em 2 colunas no desktop
- Ordem: Esquerda (1-8), Direita (9-16)

## Comparação com Site Original

**Baseado na estrutura típica de sites de apostas e análises anteriores:**

### Possíveis Melhorias Identificadas:
1. **Padding dos cards muito pequeno** - `px-0.5` pode ser aumentado
2. **Tamanho de texto pequeno** - Pode ser aumentado para melhor legibilidade
3. **Gap entre cards** - `gap-2` pode ser aumentado para melhor espaçamento
4. **Altura dos cards** - Pode ser mais consistente/padronizada
