# CSS Original Analisado - Pontodobicho.com

## CSS de Animal Cards (fornecido pelo usuário)

### Animal Card Header
```css
.animal-card__header[data-v-0486c864] {
    padding: 1px .25rem 1px .125rem;  /* padding horizontal: 4px direita, 2px esquerda */
}
```

### Animal Card Footer
```css
.animal-card__footer[data-v-0486c864] {
    padding-bottom: .25rem;  /* 4px */
    padding-top: .25rem;     /* 4px */
}

@media (min-width: 768px) {
    .animal-card__footer[data-v-0486c864] {
        padding-left: .5rem;   /* 8px */
        padding-right: .5rem;  /* 8px */
    }
}
```

## Observações

O padding usado no site original parece ser bem pequeno:
- Mobile: `0.125rem` (2px) a `0.25rem` (4px)
- Desktop: `0.5rem` (8px)

Para os cards de modalidades, precisamos encontrar o CSS específico deles. O padrão sugere que o padding horizontal deve ser bem pequeno, possivelmente `0.125rem` (2px) ou `0.25rem` (4px).

## Conversão para Tailwind

- `0.125rem` = 2px = `px-0.5` (não existe em Tailwind padrão, seria custom)
- `0.25rem` = 4px = `px-1` ✓ (já estamos usando)
- `0.5rem` = 8px = `px-2`

## Próximo Passo

Precisamos encontrar o CSS específico dos cards de modalidades para confirmar o padding exato usado.
