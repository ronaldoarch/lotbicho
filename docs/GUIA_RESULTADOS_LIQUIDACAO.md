# Guia Completo: Sistema de Resultados e Liquidação Automática

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Parser de Resultados do Bicho Certo](#parser-de-resultados-do-bicho-certo)
4. [Sistema de Liquidação Automática](#sistema-de-liquidação-automática)
5. [Loterias Suportadas](#loterias-suportadas)
6. [Fluxo Completo](#fluxo-completo)
7. [Configuração e Deploy](#configuração-e-deploy)
8. [Troubleshooting](#troubleshooting)
9. [Melhorias Implementadas](#melhorias-implementadas)

---

## 🎯 Visão Geral

O sistema foi completamente reformulado para buscar resultados diretamente do site oficial **bichocerto.com**, processar os dados via parsing HTML, e realizar liquidação automática de apostas pendentes através de um cron job interno.

### Principais Características

- ✅ **Busca direta**: Extração de resultados diretamente do HTML do bichocerto.com
- ✅ **Parser robusto**: Extração inteligente de prêmios, grupos e animais
- ✅ **Liquidação automática**: Processamento automático a cada 5 minutos
- ✅ **Validação rigorosa**: Verificação de horários reais de apuração
- ✅ **Suporte múltiplas loterias**: 9 loterias diferentes suportadas
- ✅ **Logs detalhados**: Sistema completo de debug e monitoramento

---

## 🏗 Arquitetura do Sistema

### Componentes Principais

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
│  - Página de Resultados (/resultados)                      │
│  - Componente ResultsTable                                  │
│  - Hook useResultados                                       │
└────────────────────┬──────────────────────────────────────┘
                      │
                      │ HTTP Request
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              API Route (/api/resultados)                    │
│  - Busca resultados de múltiplas loterias                   │
│  - Filtra por data e localização                            │
│  - Agrupa e ordena resultados                               │
└────────────────────┬──────────────────────────────────────┘
                      │
                      │ Chama
                      ▼
┌─────────────────────────────────────────────────────────────┐
│         Parser (lib/bichocerto-parser.ts)                   │
│  - buscarResultadosBichoCerto()                            │
│  - parsearHTML()                                            │
│  - extrairPremiosDaTabela()                                 │
└────────────────────┬──────────────────────────────────────┘
                      │
                      │ POST Request
                      ▼
┌─────────────────────────────────────────────────────────────┐
│         Bicho Certo (bichocerto.com)                       │
│  Endpoint: /resultados/base/resultado/                      │
│  Parâmetros: l=código, d=YYYY-MM-DD                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│         Cron Job (a cada 5 minutos)                         │
│  - Executa scripts/cron/liquidar.sh                         │
│  - Chama /api/resultados/liquidar                            │
└────────────────────┬──────────────────────────────────────┘
                      │
                      │ Processa
                      ▼
┌─────────────────────────────────────────────────────────────┐
│    Liquidação (/api/resultados/liquidar)                    │
│  - Busca apostas pendentes                                  │
│  - Valida horários de apuração                              │
│  - Calcula prêmios                                          │
│  - Credita saldo aos usuários                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Parser de Resultados do Bicho Certo

### Endpoint Utilizado

```
POST https://bichocerto.com/resultados/base/resultado/
Content-Type: application/x-www-form-urlencoded

Parâmetros:
- l: código da loteria (ex: "rj", "sp", "ln")
- d: data no formato YYYY-MM-DD (ex: "2026-01-17")
```

### Estrutura do HTML Retornado

O bichocerto.com retorna HTML com a seguinte estrutura:

```html
<div id="div_display_16" style="display: none;">
  <h5>Resultado PTV-RJ 16:30</h5>
  <table id="table_16">
    <tr>
      <td>1º</td>
      <td>🐓</td>
      <td><a>8051</a></td>
      <td>13</td>
      <td>Galo</td>
    </tr>
    <!-- ... mais prêmios ... -->
    <tr>
      <td>7º</td>
      <td>🦩</td>
      <td><a>702</a></td>
      <td>01</td>
      <td>Avestruz</td>
    </tr>
  </table>
</div>
```

### Processo de Parsing

#### 1. Limpeza do HTML

```typescript
// Remove JavaScript do início da resposta
if (html.startsWith('jQuery') || html.startsWith('document')) {
  const jsEnd = html.indexOf('</script>')
  if (jsEnd > 0) {
    html = html.substring(jsEnd + 9)
  }
}
```

#### 2. Identificação de Divs de Resultados

```typescript
// Busca por divs com padrão div_display_XX
const divRegex = /<div[^>]*id=["']div_display_(\d+)["'][^>]*>/gi
```

#### 3. Extração de Tabelas

```typescript
// Para cada div encontrada, busca a tabela correspondente
const tableRegex = new RegExp(`<table[^>]*id=["']table_${horarioId}["'][^>]*>([\\s\\S]*?)<\\/table>`, 'i')
```

#### 4. Extração de Prêmios

O parser processa cada linha (`<tr>`) da tabela:

1. **Extrai posição**: Busca por padrão `(\d+)[º°oO]?` na primeira coluna
2. **Extrai número**: Prioriza números de 4 dígitos, depois 3 dígitos
3. **Extrai grupo**: Números de 1-2 dígitos entre 1-25
4. **Extrai animal**: Texto da última coluna (não numérico)

#### 5. Normalização de Números

```typescript
// Números de 3 dígitos são sempre milhares
if (numero.length === 3) {
  numero = numero.padStart(4, '0') // "022" -> "0022"
}
```

### Validações Implementadas

- ✅ **Duplicatas**: Evita extrair a mesma posição duas vezes na mesma tabela
- ✅ **Formato de números**: Garante que todos os milhares tenham 4 dígitos
- ✅ **Validação de grupos**: Ignora números que podem ser grupos (1-2 dígitos ≤ 25)
- ✅ **Filtro SUPER 5**: Ignora linhas com "SUPER 5" que não são prêmios

### Logs de Debug

O parser gera logs detalhados para facilitar o debug:

```
🔍 HTML limpo: removido X caracteres de JavaScript do início
🔍 Estrutura HTML: tem div_display=true, tem table=true
🔍 Encontradas X divs com div_display_
📊 Div 16: X prêmio(s) extraído(s)
Posições extraídas: 1º, 2º, 3º, 4º, 5º, 6º, 7º, 8º, 9º, 10º
🔍 7º PRÊMIO extraído: número="0022", grupo="06", animal="Cabra"
```

---

## ⚙️ Sistema de Liquidação Automática

### Endpoint de Liquidação

```
GET /api/resultados/liquidar
```

### Processo de Liquidação

#### 1. Busca de Apostas Pendentes

```typescript
const apostasPendentes = await prisma.aposta.findMany({
  where: {
    status: 'PENDENTE',
    dataConcurso: { lte: new Date() }
  },
  include: { extracao: true, user: true }
})
```

#### 2. Validação de Horário de Apuração

O sistema verifica se já passou o horário de apuração usando horários reais do bichocerto.com:

```typescript
function jaPassouHorarioApuracao(extracao, dataConcurso) {
  const horarioReal = getHorarioRealApuracao(extracao.name, extracao.time)
  if (!horarioReal) return false
  
  const dataApuracao = new Date(dataConcurso)
  dataApuracao.setHours(...horarioReal.closeTimeReal.split(':').map(Number))
  
  return new Date() >= dataApuracao
}
```

#### 3. Busca de Resultados Oficiais

Para cada aposta pendente, o sistema busca resultados do bichocerto.com:

```typescript
const resultados = await buscarResultadosBichoCerto(
  codigoLoteria, // ex: "rj", "sp"
  dataConcurso // formato: YYYY-MM-DD
)
```

#### 4. Match de Horário

O sistema faz match inteligente de horários:

- **Match exato**: Se o horário da aposta corresponde exatamente ao horário do resultado
- **Match aproximado**: Se não houver match exato, busca o horário mais próximo dentro de uma tolerância:
  - 5 minutos para apostas com horário explícito
  - 15 minutos para apostas sem horário explícito

```typescript
function encontrarHorarioMaisProximo(horarioAposta, horariosDisponiveis) {
  let melhorMatch = null
  let menorDiferenca = Infinity
  
  for (const horario of horariosDisponiveis) {
    const diferenca = Math.abs(calcularDiferencaMinutos(horarioAposta, horario))
    if (diferenca < menorDiferenca && diferenca <= TOLERANCIA) {
      menorDiferenca = diferenca
      melhorMatch = horario
    }
  }
  
  return melhorMatch
}
```

#### 5. Validação de Resultado Completo

Antes de liquidar, o sistema verifica se o resultado está completo:

```typescript
const posicoesObrigatorias = ['1º', '2º', '3º', '4º', '5º', '6º', '7º']
const posicoesEncontradas = resultados.map(r => r.position)

const resultadoCompleto = posicoesObrigatorias.every(pos => 
  posicoesEncontradas.includes(pos)
)

if (!resultadoCompleto) {
  console.log(`⚠️ Resultado incompleto: faltam posições ${posicoesFaltantes}`)
  return // Aguarda resultado completo
}
```

#### 6. Cálculo de Prêmios

O sistema calcula prêmios usando as regras de negócio definidas em `lib/bet-rules-engine.ts`:

```typescript
import { calcularPremioUnidade } from '@/lib/bet-rules-engine'

const premio = calcularPremioUnidade(
  modalityType,
  pos_from,
  pos_to,
  valorAposta,
  odd
)
```

#### 7. Creditação de Saldo

Após calcular o prêmio, o sistema credita o saldo ao usuário:

```typescript
await prisma.user.update({
  where: { id: aposta.userId },
  data: {
    saldo: { increment: premioTotal }
  }
})

await prisma.aposta.update({
  where: { id: aposta.id },
  data: {
    status: 'GANHOU',
    premio: premioTotal,
    liquidadoEm: new Date()
  }
})
```

---

## 🌍 Loterias Suportadas

### Mapeamento de Códigos

| Código | Nome | Estado | Extrações |
|--------|------|--------|-----------|
| `ln` | NACIONAL | BR | Múltiplas |
| `sp` | PT SP | SP | PPT, PTM, PT, PTV, PTN |
| `ba` | PT BAHIA | BA | Múltiplas |
| `pb` | LOTEP | PB | Múltiplas |
| `bs` | BOA SORTE | GO | Múltiplas |
| `lce` | LOTECE | CE | Múltiplas |
| `lk` | LOOK | GO | Múltiplas |
| `fd` | FEDERAL | BR | Única |
| `rj` | PT RIO DE JANEIRO | RJ | PPT, PTM, PT, PTV |

### Horários Reais de Apuração

O sistema usa horários reais de apuração definidos em `data/horarios-reais-apuracao.ts`:

```typescript
export function getHorarioRealApuracao(nomeLoteria: string, horarioInterno: string) {
  // Retorna horário real de início e fim de apuração
  // Exemplo: LOOK 09:20 -> startTime: "09:25", closeTime: "10:00"
}
```

---

## 🔄 Fluxo Completo

### 1. Busca de Resultados (Frontend)

```
Usuário acessa /resultados
    ↓
useResultados hook faz requisição
    ↓
GET /api/resultados?date=2026-01-17&location=Rio de Janeiro
    ↓
API busca resultados de todas as loterias
    ↓
Para cada loteria:
  - POST bichocerto.com/resultados/base/resultado/
  - Parse HTML
  - Extrai prêmios
  - Normaliza dados
    ↓
Filtra por data e localização
    ↓
Agrupa por loteria|horário|data
    ↓
Limita a 7 posições por grupo
    ↓
Retorna JSON para frontend
    ↓
ResultsTable exibe resultados
```

### 2. Liquidação Automática (Cron)

```
Cron executa a cada 5 minutos
    ↓
scripts/cron/liquidar.sh
    ↓
curl http://localhost:3000/api/resultados/liquidar
    ↓
API busca apostas pendentes
    ↓
Para cada aposta:
  - Verifica se passou horário de apuração
  - Busca resultados do bichocerto.com
  - Faz match de horário
  - Valida resultado completo
  - Calcula prêmio
  - Credita saldo
  - Atualiza status da aposta
    ↓
Retorna estatísticas de liquidação
```

---

## 🚀 Configuração e Deploy

### Variáveis de Ambiente

```bash
# Opcional: Cookie PHPSESSID para acesso histórico
BICHOCERTO_PHPSESSID=seu_cookie_aqui

# Força uso do bichocerto.com (default: true)
USAR_BICHOCERTO_DIRETO=true
```

### Dockerfile

O Dockerfile foi configurado para incluir cron:

```dockerfile
# Instala cron
RUN apt-get update && apt-get install -y cron

# Copia script de liquidação
COPY scripts/cron/liquidar.sh /app/scripts/cron/liquidar.sh
RUN chmod +x /app/scripts/cron/liquidar.sh

# Configura crontab
RUN echo "*/5 * * * * /app/scripts/cron/liquidar.sh >> /var/log/liquidar.log 2>&1" | crontab -

# Script de inicialização
COPY scripts/start-with-cron.sh /app/scripts/start-with-cron.sh
RUN chmod +x /app/scripts/start-with-cron.sh

CMD ["/app/scripts/start-with-cron.sh"]
```

### Script de Liquidação

`scripts/cron/liquidar.sh`:

```bash
#!/bin/bash
curl -f -s --max-time 120 http://localhost:3000/api/resultados/liquidar > /dev/null
```

### Script de Inicialização

`scripts/start-with-cron.sh`:

```bash
#!/bin/bash
# Inicia cron em background
crond -f &
# Inicia aplicação Next.js
exec npm start
```

---

## 🔧 Troubleshooting

### Problema: Nenhum resultado encontrado

**Sintomas**: Logs mostram "Nenhum resultado encontrado no HTML"

**Soluções**:
1. Verificar se a data solicitada está dentro do intervalo permitido (últimos 10 dias)
2. Verificar se o código da loteria está correto
3. Verificar logs do parser para ver estrutura HTML recebida
4. Tentar com cookie PHPSESSID válido para acesso histórico

### Problema: 7º prêmio com 3 dígitos

**Sintomas**: 7º prêmio aparece como "494" ao invés de "0494"

**Solução**: Já corrigido! O parser agora normaliza automaticamente números de 3 dígitos para 4 dígitos.

### Problema: Duplicatas de posições

**Sintomas**: Dois 6º ou dois 7º prêmios na mesma tabela

**Solução**: Já corrigido! O parser agora ignora duplicatas, mantendo apenas o primeiro encontrado.

### Problema: Liquidação não funciona

**Sintomas**: Apostas permanecem pendentes mesmo após apuração

**Soluções**:
1. Verificar logs do cron: `docker logs container_name | grep liquidar`
2. Verificar endpoint de debug: `GET /api/resultados/liquidar/debug`
3. Verificar se horário de apuração está correto em `horarios-reais-apuracao.ts`
4. Verificar se resultado está completo (todas as 7 posições presentes)

### Problema: Match de horário incorreto

**Sintomas**: Aposta é liquidada com horário errado (ex: 10:45 ao invés de 12:45)

**Solução**: Já corrigido! O sistema agora seleciona o horário mais próximo dentro da tolerância, não apenas o primeiro encontrado.

---

## ✨ Melhorias Implementadas

### 1. Parser Robusto

- ✅ Extração de números de 3 dígitos que começam com zero (ex: "022" → "0022")
- ✅ Busca de posição em múltiplas colunas
- ✅ Validação rigorosa de grupos vs milhares
- ✅ Remoção de duplicatas de posições
- ✅ Logs detalhados para debug

### 2. Sistema de Liquidação

- ✅ Validação de horários reais de apuração
- ✅ Match inteligente de horários (exato → aproximado)
- ✅ Validação de resultado completo antes de liquidar
- ✅ Tolerância configurável para match de horários
- ✅ Endpoint de debug para diagnóstico

### 3. Integração Frontend

- ✅ Hook `useModalidades` para cotações dinâmicas
- ✅ Exibição de horários dos resultados
- ✅ Normalização de horários quebrados
- ✅ Remoção de duplicatas na exibição

### 4. Infraestrutura

- ✅ Cron job interno no Docker
- ✅ Timeout adequado (120 segundos)
- ✅ Logs persistentes
- ✅ Scripts de inicialização

---

## 📊 Estrutura de Dados

### Formato de Resultado Extraído

```typescript
interface BichoCertoResultado {
  horario: string        // "16:30"
  titulo: string         // "Resultado PTV-RJ 16:30"
  premios: Array<{
    posicao: string      // "7º"
    numero: string       // "0022" (sempre 4 dígitos)
    grupo: string        // "06"
    animal: string       // "Cabra"
  }>
}
```

### Formato Retornado pela API

```typescript
interface ResultadoItem {
  position: string       // "7º"
  milhar: string         // "0022"
  grupo: string          // "06"
  animal: string         // "Cabra"
  drawTime: string       // "16:30"
  horario: string        // "16:30"
  loteria: string        // "PT RIO DE JANEIRO"
  location: string       // "Rio de Janeiro"
  date: string           // "2026-01-17"
  dataExtracao: string   // "2026-01-17"
  estado: string         // "RJ"
}
```

---

## 🎯 Próximos Passos Sugeridos

1. **Cache de Resultados**: Implementar cache Redis para reduzir chamadas ao bichocerto.com
2. **Retry Logic**: Adicionar retry automático em caso de falha temporária
3. **Monitoramento**: Integrar com sistema de monitoramento (ex: Sentry, DataDog)
4. **Notificações**: Notificar usuários quando apostas forem liquidadas
5. **Histórico**: Armazenar histórico de liquidações para auditoria

---

## 📝 Notas Importantes

### Limitações do Bicho Certo

- ⚠️ Visitantes só podem ver resultados dos últimos 10 dias
- ⚠️ Para acesso histórico, é necessário cookie PHPSESSID válido
- ⚠️ O site pode bloquear requisições excessivas (rate limiting)

### Boas Práticas

- ✅ Sempre validar se o resultado está completo antes de liquidar
- ✅ Usar horários reais de apuração, não horários internos
- ✅ Fazer match de horário com tolerância adequada
- ✅ Manter logs detalhados para facilitar debug
- ✅ Testar com endpoint de debug antes de liquidar em produção

---

## 🔗 Arquivos Relacionados

- `lib/bichocerto-parser.ts` - Parser principal
- `app/api/resultados/route.ts` - API de resultados
- `app/api/resultados/liquidar/route.ts` - API de liquidação
- `app/api/resultados/liquidar/debug/route.ts` - API de debug
- `data/horarios-reais-apuracao.ts` - Horários reais de apuração
- `scripts/cron/liquidar.sh` - Script do cron
- `scripts/start-with-cron.sh` - Script de inicialização
- `Dockerfile` - Configuração Docker com cron

---

**Última atualização**: 17/01/2026  
**Versão**: 1.0
