# Análise de Requisitos: VPS para Sistema Lot Bicho

## 📊 Especificações da VPS Analisada

- **CPU**: 4 Cores
- **RAM**: 16GB
- **Armazenamento**: 320GB SSD
- **Transferência**: 16TB/mês
- **Porta**: 10Gbps Shared
- **Preço**: $24/mês

---

## 🔍 Análise de Requisitos do Sistema

### Componentes do Sistema

1. **Aplicação Next.js**
   - Framework React com SSR/SSG
   - Node.js runtime
   - Build estático + API routes

2. **Banco de Dados PostgreSQL**
   - Prisma ORM
   - Múltiplas tabelas (Usuarios, Apostas, Transacoes, etc.)
   - Índices em campos críticos

3. **Cron Jobs**
   - Execução a cada 5 minutos
   - Parsing HTML de múltiplas loterias
   - Processamento de liquidação

4. **APIs Externas**
   - Requisições HTTP para bichocerto.com
   - Parsing de HTML complexo

---

## ✅ Análise Detalhada por Recurso

### 1. CPU (4 Cores)

#### Uso Esperado:

**Aplicação Next.js:**
- Build: ~2-3 minutos (processo único)
- Runtime: Baixo uso de CPU (~5-15% por core)
- Picos durante parsing HTML: ~30-50% por core

**PostgreSQL:**
- Queries simples: ~1-5% CPU
- Queries complexas com joins: ~10-20% CPU
- Índices bem otimizados reduzem uso

**Cron Jobs (a cada 5 minutos):**
- Parsing HTML: ~10-30 segundos de CPU intensivo
- Processamento de liquidação: ~5-15 segundos
- Total: ~45 segundos a cada 5 minutos = ~15% de uso contínuo

**Veredito**: ✅ **SUFICIENTE**
- 4 cores são adequados para até ~500-1000 usuários simultâneos
- Parsing HTML é I/O bound, não CPU bound
- PostgreSQL pode usar múltiplos cores para queries paralelas

---

### 2. RAM (16GB)

#### Uso Esperado:

**Aplicação Next.js:**
- Processo Node.js: ~200-500 MB (base)
- Cache de build: ~100-200 MB
- Picos durante parsing: +100-200 MB
- **Total: ~400-900 MB**

**PostgreSQL:**
- Processo base: ~100-200 MB
- Buffer pool (shared_buffers): Recomendado 25% da RAM = ~4GB
- Cache de queries: ~500 MB - 1GB
- **Total: ~4.5-5.5 GB**

**Sistema Operacional:**
- Linux base: ~500 MB - 1GB
- Outros processos: ~200-500 MB
- **Total: ~700 MB - 1.5 GB**

**Cron + Scripts:**
- Processos temporários: ~50-100 MB
- **Total: ~50-100 MB**

**Total Geral Estimado:**
- Mínimo: ~5.5 GB
- Médio: ~7-8 GB
- Pico (muitas requisições simultâneas): ~10-12 GB

**Veredito**: ✅ **SUFICIENTE COM MARGEM**
- 16GB permite crescimento até ~2000-3000 usuários simultâneos
- Buffer pool do PostgreSQL pode ser otimizado se necessário
- Espaço para cache de resultados e otimizações futuras

---

### 3. Armazenamento (320GB SSD)

#### Uso Esperado:

**Sistema Operacional:**
- Linux base: ~5-10 GB

**Aplicação Next.js:**
- Código fonte: ~50-100 MB
- node_modules: ~300-500 MB
- Build (.next): ~100-200 MB
- **Total: ~500 MB - 1 GB**

**PostgreSQL:**
- Banco de dados inicial: ~50-100 MB
- Crescimento estimado:
  - 1000 usuários: ~500 MB
  - 10.000 usuários: ~5 GB
  - 100.000 usuários: ~50 GB
- Logs do PostgreSQL: ~1-5 GB (com rotação)
- **Total inicial: ~100 MB - 1 GB**
- **Total após 1 ano (10k usuários): ~5-10 GB**

**Logs da Aplicação:**
- Logs do cron: ~100-500 MB/mês
- Logs do Next.js: ~50-200 MB/mês
- **Total: ~150-700 MB/mês**

**Uploads (imagens):**
- Banners: ~10-50 MB
- Logos: ~5-20 MB
- Stories: ~50-200 MB
- **Total: ~65-270 MB**

**Backups:**
- Backups do PostgreSQL: ~100 MB - 5 GB (dependendo do tamanho)
- Backups incrementais: ~10-50 MB/dia
- **Total: ~500 MB - 10 GB** (com retenção de 7 dias)

**Espaço Livre Recomendado:**
- Para operação segura: ~20% livre = ~64 GB

**Total Estimado Após 1 Ano:**
- Sistema: ~10 GB
- Aplicação: ~1 GB
- Banco de dados: ~5-10 GB
- Logs: ~2-5 GB
- Backups: ~5-10 GB
- **Total: ~23-36 GB**
- **Espaço livre: ~284-297 GB**

**Veredito**: ✅ **MUITO SUFICIENTE**
- 320GB é mais que suficiente para anos de operação
- Permite crescimento até ~100k usuários sem preocupação
- Espaço para backups e logs

---

### 4. Transferência (16TB/mês)

#### Uso Esperado:

**Tráfego Web:**
- Página inicial: ~500 KB por visita
- Página de resultados: ~300 KB por visita
- API requests: ~10-50 KB por request
- **Estimativa:**
  - 1000 visitantes/dia × 5 páginas × 400 KB = ~2 GB/dia = ~60 GB/mês
  - 10.000 visitantes/dia × 5 páginas × 400 KB = ~20 GB/dia = ~600 GB/mês

**Requisições ao Bicho Certo:**
- Parsing HTML: ~50-200 KB por requisição
- 9 loterias × 10 dias × 12 requisições/dia = ~108 requisições/dia
- **Total: ~5-20 MB/dia = ~150-600 MB/mês**

**Cron Jobs:**
- Liquidação automática: ~10-50 KB por execução
- 12 execuções/hora × 24 horas × 30 dias = ~8.640 execuções/mês
- **Total: ~85-430 MB/mês**

**Uploads de Imagens:**
- Banners: ~100-500 KB cada
- Stories: ~200 KB - 2 MB cada
- **Total: ~10-50 MB/mês** (dependendo do uso)

**Total Estimado:**
- Baixo tráfego (1k visitantes/dia): ~60-70 GB/mês
- Médio tráfego (10k visitantes/dia): ~600-700 GB/mês
- Alto tráfego (50k visitantes/dia): ~3-4 TB/mês

**Veredito**: ✅ **SUFICIENTE PARA CRESCIMENTO**
- 16TB permite até ~200k visitantes/dia
- Muito espaço para crescimento
- Pode suportar picos de tráfego

---

### 5. Largura de Banda (10Gbps Shared)

#### Uso Esperado:

**Picos de Tráfego:**
- 100 usuários simultâneos × 1 Mbps = ~100 Mbps
- 1000 usuários simultâneos × 1 Mbps = ~1 Gbps
- Parsing HTML simultâneo: ~10-50 Mbps

**Veredito**: ✅ **SUFICIENTE**
- 10Gbps shared é adequado para milhares de usuários simultâneos
- Parsing HTML não é intensivo em banda
- Compartilhado, mas com 10Gbps há margem suficiente

---

## 📈 Capacidade Estimada de Usuários

### Cenários de Uso

| Métrica | Baixo | Médio | Alto |
|---------|-------|-------|------|
| **Usuários Simultâneos** | 50-100 | 200-500 | 1000-2000 |
| **Visitantes Únicos/Dia** | 1.000 | 10.000 | 50.000 |
| **Apostas/Dia** | 500-1.000 | 5.000-10.000 | 25.000-50.000 |
| **Uso de CPU** | 10-20% | 30-50% | 60-80% |
| **Uso de RAM** | 6-8 GB | 8-12 GB | 12-15 GB |
| **Tráfego Mensal** | 60-100 GB | 600-1 TB | 3-5 TB |

### Limites Práticos

**Com esta VPS, o sistema pode suportar:**
- ✅ Até **2.000 usuários simultâneos** confortavelmente
- ✅ Até **50.000 visitantes únicos/dia**
- ✅ Até **50.000 apostas/dia**
- ✅ Crescimento sustentável por **anos**

---

## ⚠️ Pontos de Atenção

### 1. Banco de Dados PostgreSQL

**Recomendações:**
```sql
-- Configurações recomendadas no postgresql.conf
shared_buffers = 4GB              -- 25% da RAM
effective_cache_size = 12GB       -- 75% da RAM
maintenance_work_mem = 1GB
work_mem = 64MB                   -- Para queries complexas
max_connections = 200             -- Ajustar conforme necessário
```

### 2. Otimizações do Next.js

**Recomendações:**
- Usar `max_memory_restart` no PM2 (já configurado: 1GB)
- Implementar cache de resultados do bichocerto.com
- Usar Redis para cache (opcional, mas recomendado)

### 3. Monitoramento

**Métricas a Monitorar:**
- Uso de CPU (alerta se > 80% por 5 minutos)
- Uso de RAM (alerta se > 90%)
- Espaço em disco (alerta se < 20% livre)
- Tráfego mensal (alerta se > 80% do limite)
- Tempo de resposta do PostgreSQL
- Tempo de resposta das APIs

### 4. Escalabilidade Futura

**Quando considerar upgrade:**
- CPU > 80% constante
- RAM > 90% constante
- Tráfego > 10TB/mês
- Mais de 2.000 usuários simultâneos

---

## 🎯 Conclusão Final

### ✅ **SIM, A VPS É ADEQUADA**

A VPS de **$24/mês** com as especificações analisadas é **mais que suficiente** para suportar o sistema Lot Bicho com:

- ✅ **Capacidade para crescimento**: Suporta até 50k visitantes/dia
- ✅ **Recursos adequados**: CPU, RAM e armazenamento bem dimensionados
- ✅ **Margem de segurança**: Espaço para picos de tráfego e crescimento futuro
- ✅ **Custo-benefício**: Excelente relação custo/performance

### Recomendações de Implementação

1. **Configurar PostgreSQL corretamente** (shared_buffers, cache, etc.)
2. **Implementar monitoramento** (CPU, RAM, disco, tráfego)
3. **Configurar backups automáticos** do banco de dados
4. **Implementar cache** para reduzir carga no bichocerto.com
5. **Configurar logs rotativos** para não encher o disco

### Próximos Passos

1. ✅ Provisionar a VPS
2. ✅ Instalar PostgreSQL 14+
3. ✅ Configurar variáveis de ambiente
4. ✅ Deploy da aplicação
5. ✅ Configurar monitoramento
6. ✅ Testar carga com usuários reais

---

## 📊 Comparação com Outras Opções

| Recurso | VPS $24 | VPS $10 | VPS $50 |
|---------|---------|---------|---------|
| CPU | 4 cores | 2 cores | 8 cores |
| RAM | 16GB | 4GB | 32GB |
| SSD | 320GB | 80GB | 640GB |
| Transferência | 16TB | 4TB | 32TB |
| **Adequação** | ✅ **Ideal** | ⚠️ Limitado | ✅ Excesso |

**Recomendação**: A VPS de $24 é o **ponto ideal** entre custo e performance para este sistema.

---

**Última atualização**: 17/01/2026  
**Versão**: 1.0
