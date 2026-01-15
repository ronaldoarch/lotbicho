# 📅 Sistema de Horários Reais de Apuração

**Última atualização:** 15 de Janeiro de 2026

---

## 🎯 Objetivo

Este documento explica como o sistema utiliza os **horários reais de apuração do bichocerto.com** para liquidação de apostas, mantendo os horários internos para exibição e fechamento de apostas.

---

## 🔄 Como Funciona

### Dois Conjuntos de Horários

O sistema mantém **dois conjuntos de horários**:

1. **Horários Internos** (`data/extracoes.ts`):
   - Usados para **exibição** na interface
   - Usados para **fechamento de apostas** (`realCloseTime`)
   - Mantidos como estão configurados no sistema

2. **Horários Reais de Apuração** (`data/horarios-reais-apuracao.ts`):
   - Usados **apenas para liquidação**
   - Baseados nos horários reais do site **bichocerto.com**
   - Incluem informações sobre **dias sem sorteio**

### Fluxo de Liquidação

```
┌─────────────────────┐
│ Aposta pendente     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ 1. Buscar horário real de apuração │
│    (bichocerto.com)                 │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ 2. Verificar se dia tem sorteio    │
│    (usando diasSemSorteio)          │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ 3. Verificar se já passou horário  │
│    de apuração                      │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ 4. Se passou e tem sorteio:        │
│    Liquidar aposta                  │
└─────────────────────────────────────┘
```

---

## 📋 Estrutura de Dados

### Arquivo: `data/horarios-reais-apuracao.ts`

```typescript
export interface HorarioRealApuracao {
  name: string                    // Nome da extração (ex: "PT RIO", "LOOK")
  time: string                     // Horário da extração no nosso sistema (ex: "09:20")
  closeTimeReal: string            // Horário real de apuração (ex: "10:00")
  diasSemSorteio?: number[]        // Dias sem sorteio (0=Domingo, 1=Segunda, ..., 6=Sábado)
}
```

### Exemplo

```typescript
{
  name: 'PT RIO',
  time: '09:20',              // Horário no nosso sistema
  closeTimeReal: '10:00',     // Horário real de apuração (bichocerto.com)
  diasSemSorteio: undefined   // Todos os dias têm sorteio
}
```

```typescript
{
  name: 'LOTECE',
  time: '11:00',
  closeTimeReal: '12:00',
  diasSemSorteio: [0]         // Domingo não tem sorteio
}
```

---

## 🔍 Função de Busca

### `getHorarioRealApuracao(name, time)`

Busca o horário real de apuração para uma extração específica.

**Parâmetros:**
- `name`: Nome da extração (ex: "PT RIO", "LOOK")
- `time`: Horário da extração no nosso sistema (ex: "09:20")

**Retorna:**
- `HorarioRealApuracao | null`: Horário real encontrado ou null

**Lógica:**
1. Busca correspondência exata (nome + horário)
2. Se não encontrar, busca por nome + horário aproximado (até 30 minutos de diferença)
3. Retorna null se não encontrar

**Exemplo:**
```typescript
const horario = getHorarioRealApuracao('PT RIO', '09:20')
// Retorna: { name: 'PT RIO', time: '09:20', closeTimeReal: '10:00' }
```

---

## ✅ Verificação de Dias Sem Sorteio

### `temSorteioNoDia(horarioReal, diaSemana)`

Verifica se um dia da semana tem sorteio para uma extração específica.

**Parâmetros:**
- `horarioReal`: Horário real de apuração (ou null)
- `diaSemana`: Dia da semana (0=Domingo, 1=Segunda, ..., 6=Sábado)

**Retorna:**
- `boolean`: true se tem sorteio, false caso contrário

**Lógica:**
- Se não encontrar horário real, assume que tem sorteio (comportamento antigo)
- Se não tem `diasSemSorteio`, todos os dias têm sorteio
- Verifica se o dia está na lista de dias sem sorteio

**Exemplo:**
```typescript
const horario = { name: 'LOTECE', time: '11:00', closeTimeReal: '12:00', diasSemSorteio: [0] }
temSorteioNoDia(horario, 0)  // false (Domingo não tem sorteio)
temSorteioNoDia(horario, 1)  // true (Segunda tem sorteio)
```

---

## 🔧 Uso na Liquidação

### Função: `jaPassouHorarioApuracao()`

A função de liquidação foi atualizada para:

1. **Buscar horário real** usando `getHorarioRealApuracao()`
2. **Verificar dias sem sorteio** usando `temSorteioNoDia()`
3. **Usar horário real** se encontrado, senão usar horário interno
4. **Bloquear liquidação** se não tem sorteio no dia

**Código:**
```typescript
// Buscar horário real de apuração
const horarioReal = getHorarioRealApuracao(nomeExtracao, horarioExtracao)

if (horarioReal) {
  // Usar horário real de apuração
  closeTimeParaUsar = horarioReal.closeTimeReal
  
  // Verificar se o dia da semana tem sorteio
  const diaSemana = dataConcurso.getDay()
  if (!temSorteioNoDia(horarioReal, diaSemana)) {
    return false // Não pode liquidar se não tem sorteio neste dia
  }
} else {
  // Fallback: usar horário interno
  closeTimeParaUsar = extracao?.closeTime || ''
}
```

---

## 📊 Mapeamento de Horários

### PT RIO DE JANEIRO

| Nosso Sistema | Bichocerto.com | Horário Real Apuração | Dias Sem Sorteio |
|--------------|----------------|----------------------|------------------|
| 09:20        | PPT-RJ 09:30   | 10:00                | Todos            |
| 11:20        | PTM-RJ 11:30   | 12:00                | Todos            |
| 14:20        | PT-RJ 14:30    | 15:00                | Todos            |
| 16:20        | PTV-RJ 16:30   | 17:00                | Todos            |
| 18:20        | PTN-RJ 18:30   | 19:00                | Dom, Qua, Qui, Sex, Sáb |
| 21:20        | COR-RJ 21:30   | 22:00                | Domingo          |

### LOOK GOIÁS

| Nosso Sistema | Bichocerto.com | Horário Real Apuração | Dias Sem Sorteio |
|--------------|----------------|----------------------|------------------|
| 07:20        | LOOK-GO 07:20  | 08:00                | Todos            |
| 09:20        | LOOK-GO 09:20  | 10:00                | Todos            |
| 11:20        | LOOK-GO 11:20  | 12:00                | Todos            |
| 14:20        | LOOK-GO 14:20  | 15:00                | Todos            |
| 16:20        | LOOK-GO 16:20  | 17:00                | Todos            |
| 18:20        | LOOK-GO 18:20  | 19:00                | Todos            |
| 21:20        | LOOK-GO 21:20  | 22:00                | Todos            |
| 23:20        | LOOK-GO 23:20  | 23:59                | Todos            |

### LOTECE

| Nosso Sistema | Bichocerto.com | Horário Real Apuração | Dias Sem Sorteio |
|--------------|----------------|----------------------|------------------|
| 11:00        | Lotece (Manhã) 11h | 12:00          | Domingo          |
| 14:00        | Lotece (Tarde 1) 14h | 15:00          | Domingo          |
| 15:40        | Lotece (Tarde 2) 15h | 16:00          | Domingo          |
| 19:40        | Lotece (Noite) 19h | 20:00            | Domingo          |

### LOTEP

| Nosso Sistema | Bichocerto.com | Horário Real Apuração | Dias Sem Sorteio |
|--------------|----------------|----------------------|------------------|
| 10:45        | Lotep 10:45    | 11:00                | Todos            |
| 12:45        | Lotep 12:45    | 13:00                | Todos            |
| 15:45        | Lotep 15:45    | 16:00                | Domingo          |
| 18:05        | Lotep 18:45    | 19:00                | Domingo          |

### PT BAHIA

| Nosso Sistema | Bichocerto.com | Horário Real Apuração | Dias Sem Sorteio |
|--------------|----------------|----------------------|------------------|
| 10:20        | PT Bahia 10h   | 11:00                | Todos            |
| 12:20        | PT Bahia 12h   | 13:00                | Todos            |
| 15:20        | PT Bahia 15h   | 16:00                | Todos            |
| 19:00        | PT Bahia 19h   | 20:00                | Dom, Qua, Sáb    |
| 21:20        | PT Bahia 21h   | 22:00                | Domingo          |

### FEDERAL

| Nosso Sistema | Bichocerto.com | Horário Real Apuração | Dias Sem Sorteio |
|--------------|----------------|----------------------|------------------|
| 20:00        | Federal 20h    | 21:40 (Quarta/Sábado) | Dom, Seg, Ter, Qui, Sex |
| 20:00        | Federal Bahia 20h | 20:59 (Quarta/Sábado) | Dom, Seg, Ter, Qui, Sex |

### NACIONAL

| Nosso Sistema | Bichocerto.com | Horário Real Apuração | Dias Sem Sorteio |
|--------------|----------------|----------------------|------------------|
| 02:00        | Nacional 02h   | 03:00                | Todos            |
| 08:00        | Nacional 08h   | 09:00                | Todos            |
| 10:00        | Nacional 10h   | 11:00                | Todos            |
| 12:00        | Nacional 12h   | 13:00                | Todos            |
| 15:00        | Nacional 15h   | 16:00                | Todos            |
| 17:00        | Nacional 17h   | 18:00                | Todos            |
| 21:00        | Nacional 21h   | 22:00                | Todos            |
| 23:00        | Nacional 23h   | 23:59                | Todos            |

---

## ⚠️ Importante

### Manutenção dos Horários

- **Horários internos** (`data/extracoes.ts`): Mantidos como estão, usados para exibição
- **Horários reais** (`data/horarios-reais-apuracao.ts`): Atualizados conforme bichocerto.com

### Quando Atualizar

Atualize os horários reais quando:
1. O bichocerto.com mudar os horários de apuração
2. Adicionar novas extrações
3. Mudarem os dias sem sorteio

### Fallback

Se não encontrar horário real:
- Usa horário interno (`closeTime`)
- Assume que todos os dias têm sorteio
- Mantém comportamento antigo

---

## 🔗 Referências

- **Arquivo de horários reais**: `/data/horarios-reais-apuracao.ts`
- **Arquivo de extrações**: `/data/extracoes.ts`
- **Função de liquidação**: `/app/api/resultados/liquidar/route.ts`
- **Site de referência**: `bichocerto.com/estatisticas/horario/loteria/`

---

**Última atualização:** 15 de Janeiro de 2026
