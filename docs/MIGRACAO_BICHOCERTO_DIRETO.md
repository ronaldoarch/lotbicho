# 🌐 Migração para Endpoints Diretos do bichocerto.com

## 📋 Resumo

O sistema agora usa **endpoints diretos do bichocerto.com** ao invés da API intermediária. Isso garante:

- ✅ Acesso direto aos resultados oficiais
- ✅ Suporte a consultas históricas (com autenticação)
- ✅ Maior confiabilidade e controle
- ✅ Parsing HTML direto dos resultados

---

## 🔄 O que mudou?

### Antes:
- Usava API intermediária: `https://okgkgswwkk8ows0csow0c4gg.agenciamidas.com/api/resultados`
- Retornava JSON estruturado
- Dependia de serviço externo

### Agora:
- Usa endpoints diretos: `https://bichocerto.com/resultados/base/resultado/`
- Faz parsing HTML dos resultados
- Busca de múltiplas loterias em paralelo
- Suporte opcional a autenticação para histórico

---

## ⚙️ Configuração

### Variáveis de Ambiente

```bash
# Ativar/desativar uso direto do bichocerto.com (default: true)
USAR_BICHOCERTO_DIRETO=true

# Opcional: PHPSESSID para acesso histórico (últimos 10+ dias)
# Obter fazendo login em https://bichocerto.com/login/
BICHOCERTO_PHPSESSID=seu_phpsessid_aqui

# Fallback: API antiga (se USAR_BICHOCERTO_DIRETO=false)
BICHO_CERTO_API=https://okgkgswwkk8ows0csow0c4gg.agenciamidas.com/api/resultados
```

### Como obter PHPSESSID (para acesso histórico)

1. Faça login em `https://bichocerto.com/login/`
2. Abra DevTools (F12)
3. Vá em Application → Cookies → `https://bichocerto.com`
4. Copie o valor do cookie `PHPSESSID`
5. Configure na variável de ambiente `BICHOCERTO_PHPSESSID`

**⚠️ Importante**: 
- O PHPSESSID expira após logout ou inatividade
- Não compartilhe seu PHPSESSID publicamente
- Sem PHPSESSID: acesso apenas aos últimos 10 dias
- Com PHPSESSID: acesso histórico completo

---

## 📊 Loterias Suportadas

O sistema busca automaticamente resultados das seguintes loterias:

| Código | Nome | Estado |
|--------|------|--------|
| `ln` | Loteria Nacional | BR |
| `sp` | PT-SP/Bandeirantes | SP |
| `ba` | PT Bahia | BA |
| `pb` | PT Paraíba/Lotep | PB |
| `bs` | Boa Sorte Goiás | GO |
| `lce` | Lotece | CE |
| `lk` | Look Goiás | GO |
| `fd` | Loteria Federal | BR |

---

## 🔍 Como Funciona

### 1. Busca de Resultados

Quando uma requisição é feita para `/api/resultados`:

1. **Determina data**: Usa `dateFilter` da query ou data atual
2. **Busca paralela**: Faz requisições POST para cada loteria em paralelo
3. **Parsing HTML**: Extrai resultados de cada resposta HTML
4. **Combinação**: Combina todos os resultados em um único array
5. **Filtros**: Aplica filtros de UF/localização se necessário
6. **Agrupamento**: Agrupa por loteria/horário/data
7. **Limitação**: Limita a 7 posições por grupo
8. **Retorno**: Retorna JSON formatado

### 2. Parsing HTML

O parser extrai:

- **Divs de resultado**: `<div id="div_display_XX">`
- **Tabelas**: `<table id="table_XX">`
- **Prêmios**: Linhas da tabela com posição, número, grupo, animal
- **Títulos**: `<h5 class="card-title">` para identificar extrações

### 3. Formato de Resposta

A resposta mantém o mesmo formato da API anterior:

```json
{
  "results": [
    {
      "position": "1º",
      "milhar": "2047",
      "grupo": "7",
      "animal": "Cavalo",
      "drawTime": "23:00",
      "horario": "23:00",
      "loteria": "NACIONAL",
      "location": "Estado BR",
      "date": "2026-01-17",
      "dataExtracao": "2026-01-17",
      "estado": "BR"
    }
  ],
  "updatedAt": "2026-01-17T12:00:00.000Z"
}
```

---

## 🧪 Testando

### Teste Manual

```bash
# Buscar resultados de hoje
curl "http://localhost:3000/api/resultados"

# Buscar resultados de data específica
curl "http://localhost:3000/api/resultados?date=2026-01-17"

# Filtrar por UF
curl "http://localhost:3000/api/resultados?location=SP"
```

### Verificar Logs

Os logs mostram:
- ✅ Quais loterias foram buscadas
- ✅ Quantos resultados foram encontrados
- ✅ Erros ou avisos
- ✅ Tempo de processamento

Exemplo de log:
```
🌐 Usando endpoints diretos do bichocerto.com
📅 Buscando resultados para data: 2026-01-17
🔍 Buscando resultados de ln (NACIONAL)...
   ✅ ln: 8 extração(ões), 56 resultado(s)
🔍 Buscando resultados de sp (PT SP)...
   ✅ sp: 8 extração(ões), 56 resultado(s)
...
📊 Total combinado: 448 resultados de 8 loterias
```

---

## 🔄 Fallback para API Antiga

Se `USAR_BICHOCERTO_DIRETO=false`, o sistema usa a API antiga como fallback:

```bash
USAR_BICHOCERTO_DIRETO=false
```

Isso é útil para:
- Testes comparativos
- Troubleshooting
- Migração gradual

---

## ⚠️ Limitações

### Sem Autenticação (Visitante)
- ✅ Acesso aos últimos **10 dias** apenas
- ❌ Resultados históricos bloqueados

### Com Autenticação (PHPSESSID)
- ✅ Acesso histórico completo
- ⚠️ PHPSESSID expira após logout/inatividade
- ⚠️ Requer renovação periódica

### Parsing HTML
- ⚠️ Depende da estrutura HTML do bichocerto.com
- ⚠️ Pode quebrar se estrutura mudar
- ✅ Logs detalhados para debug

---

## 🐛 Troubleshooting

### Problema: Nenhum resultado retornado

**Verificar:**
1. Logs do servidor para erros
2. Se data está dentro do intervalo permitido
3. Se PHPSESSID está válido (se usando histórico)
4. Se estrutura HTML mudou (verificar resposta HTML)

**Solução:**
```bash
# Verificar logs
tail -f logs/app.log

# Testar endpoint diretamente
curl -X POST "https://bichocerto.com/resultados/base/resultado/" \
  -d "l=ln" \
  -d "d=2026-01-17"
```

### Problema: Erro de parsing

**Verificar:**
1. Estrutura HTML retornada
2. Se IDs das divs/tabelas mudaram
3. Logs de erro específicos

**Solução:**
- Verificar estrutura HTML atual do bichocerto.com
- Atualizar regex no `lib/bichocerto-parser.ts` se necessário

### Problema: Timeout

**Verificar:**
1. Conexão com internet
2. Se bichocerto.com está acessível
3. Timeout configurado (default: 30s)

**Solução:**
- Aumentar timeout se necessário
- Verificar firewall/proxy

---

## 📚 Arquivos Modificados

- ✅ `lib/bichocerto-parser.ts` - Novo parser HTML
- ✅ `app/api/resultados/route.ts` - Integração com novos endpoints
- ✅ `docs/MIGRACAO_BICHOCERTO_DIRETO.md` - Esta documentação

---

## 🔗 Referências

- Documentação endpoints: `docs/endpoints-loterias.md`
- Horários reais: `data/horarios-reais-apuracao.ts`
- Extrações: `data/extracoes.ts`

---

## ✅ Checklist de Migração

- [ ] Configurar `USAR_BICHOCERTO_DIRETO=true` (ou remover para usar default)
- [ ] Opcional: Configurar `BICHOCERTO_PHPSESSID` para histórico
- [ ] Testar busca de resultados
- [ ] Verificar logs
- [ ] Testar liquidação de apostas
- [ ] Monitorar por alguns dias
- [ ] Desativar API antiga se tudo OK

---

## 📞 Suporte

Em caso de problemas:
1. Verificar logs do servidor
2. Testar endpoints diretamente
3. Verificar estrutura HTML atual
4. Consultar documentação dos endpoints
