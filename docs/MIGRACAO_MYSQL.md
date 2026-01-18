# 🔄 Guia de Migração: PostgreSQL → MySQL

## ✅ Mudanças Realizadas

### 1. Schema do Prisma

**Arquivo**: `prisma/schema.prisma`

```prisma
datasource db {
  provider = "mysql"  // Alterado de "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Compatibilidade de Tipos de Dados

Todos os tipos utilizados no schema são compatíveis com MySQL:

| Tipo Prisma | Compatibilidade MySQL |
|-------------|----------------------|
| `String` | ✅ `VARCHAR` ou `TEXT` |
| `Int` | ✅ `INT` |
| `Float` | ✅ `DOUBLE` |
| `Boolean` | ✅ `TINYINT(1)` |
| `DateTime` | ✅ `DATETIME` |
| `Json` | ✅ `JSON` (MySQL 5.7+) |
| `@default(uuid())` | ✅ `UUID()` (MySQL 8.0+) |

### 3. Recursos Utilizados

- ✅ Relações (`@relation`) - Compatível
- ✅ Índices (`@@index`) - Compatível
- ✅ Constraints (`@unique`) - Compatível
- ✅ Valores padrão (`@default`) - Compatível
- ✅ Auto-increment (`@id @default(autoincrement())`) - Compatível

---

## 📋 Formato da DATABASE_URL

### PostgreSQL (Antigo)
```
postgresql://usuario:senha@host:5432/nome_banco
```

### MySQL (Novo)
```
mysql://usuario:senha@host:3306/nome_banco
```

**Ou usando MySQL2 driver (recomendado pelo Prisma):**
```
mysql://usuario:senha@host:3306/nome_banco?sslaccept=strict
```

---

## 🚀 Passos para Migração

### 1. Instalar MySQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

**Configurar segurança:**
```bash
sudo mysql_secure_installation
```

### 2. Criar Banco de Dados

```bash
# Conectar ao MySQL
mysql -u root -p

# Criar banco de dados
CREATE DATABASE lotbicho CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Criar usuário (opcional, mas recomendado)
CREATE USER 'lotbicho_user'@'localhost' IDENTIFIED BY 'senha_forte_aqui';
GRANT ALL PRIVILEGES ON lotbicho.* TO 'lotbicho_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Atualizar Variável de Ambiente

**No arquivo `.env` ou no painel do Coolify:**

```env
# Antes (PostgreSQL)
# DATABASE_URL=postgresql://usuario:senha@host:5432/lotbicho

# Depois (MySQL)
DATABASE_URL=mysql://lotbicho_user:senha_forte_aqui@localhost:3306/lotbicho
```

### 4. Instalar Driver MySQL (se necessário)

O Prisma geralmente usa o driver `mysql2` automaticamente, mas você pode garantir:

```bash
npm install mysql2
```

### 5. Gerar Prisma Client

```bash
npx prisma generate
```

### 6. Criar Schema no Banco

**Opção 1: Usando Prisma Migrate (recomendado)**
```bash
npx prisma migrate dev --name init_mysql
```

**Opção 2: Usando Prisma Push (desenvolvimento)**
```bash
npx prisma db push
```

### 7. Verificar Migração

```bash
# Abrir Prisma Studio para verificar dados
npx prisma studio
```

---

## ⚙️ Configurações Recomendadas do MySQL

### Arquivo `/etc/mysql/mysql.conf.d/mysqld.cnf`

```ini
[mysqld]
# Buffer Pool (50-70% da RAM)
innodb_buffer_pool_size = 8G
innodb_buffer_pool_instances = 4

# Conexões
max_connections = 200

# Cache de queries (MySQL 5.7)
query_cache_size = 256M
query_cache_type = 1

# Tabelas temporárias
tmp_table_size = 256M
max_heap_table_size = 256M

# Logs InnoDB
innodb_log_file_size = 512M
innodb_flush_log_at_trx_commit = 2

# Charset padrão
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# Timezone
default-time-zone = '-03:00'
```

**Reiniciar MySQL após alterações:**
```bash
sudo systemctl restart mysql
```

---

## 🔍 Diferenças Importantes

### 1. Case Sensitivity

- **PostgreSQL**: Case-sensitive por padrão
- **MySQL**: Case-insensitive por padrão (depende do sistema de arquivos)

**Solução**: Usar `utf8mb4_unicode_ci` que é case-insensitive.

### 2. Tipos JSON

- **PostgreSQL**: Tipo JSON nativo com operadores (`->`, `->>`)
- **MySQL**: Tipo JSON com funções (`JSON_EXTRACT`, `JSON_UNQUOTE`)

**Prisma abstrai isso**, então não há mudanças necessárias no código.

### 3. UUID

- **PostgreSQL**: Tipo UUID nativo
- **MySQL**: Função `UUID()` disponível no MySQL 8.0+

**No schema atual**, o modelo `Tema` usa `@default(uuid())` que funciona em ambos.

### 4. Auto-increment

- **PostgreSQL**: `SERIAL` ou `BIGSERIAL`
- **MySQL**: `AUTO_INCREMENT`

**Prisma abstrai isso** com `@id @default(autoincrement())`.

---

## 📊 Migração de Dados (se necessário)

Se você já tem dados no PostgreSQL e precisa migrá-los:

### 1. Exportar Dados do PostgreSQL

```bash
# Exportar schema
pg_dump -U postgres -d lotbicho --schema-only > schema.sql

# Exportar dados
pg_dump -U postgres -d lotbicho --data-only > data.sql
```

### 2. Converter para MySQL

**Ferramentas úteis:**
- `pg2mysql` (script Python)
- `pgloader` (ferramenta de migração)
- Migração manual via scripts

### 3. Importar no MySQL

```bash
mysql -u lotbicho_user -p lotbicho < schema.sql
mysql -u lotbicho_user -p lotbicho < data.sql
```

**⚠️ Atenção**: Pode ser necessário ajustar tipos de dados e sintaxe SQL durante a conversão.

---

## ✅ Checklist de Migração

- [ ] MySQL instalado e rodando
- [ ] Banco de dados `lotbicho` criado
- [ ] Usuário do banco criado (se aplicável)
- [ ] Variável `DATABASE_URL` atualizada
- [ ] Schema do Prisma atualizado (`provider = "mysql"`)
- [ ] `npx prisma generate` executado
- [ ] `npx prisma migrate dev` ou `npx prisma db push` executado
- [ ] Aplicação testada localmente
- [ ] Variáveis de ambiente atualizadas no servidor/Coolify
- [ ] Deploy realizado
- [ ] Testes de funcionalidade realizados

---

## 🐛 Troubleshooting

### Erro: "Unknown database 'lotbicho'"

**Solução**: Criar o banco de dados primeiro:
```bash
mysql -u root -p -e "CREATE DATABASE lotbicho CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### Erro: "Access denied for user"

**Solução**: Verificar credenciais e permissões:
```bash
mysql -u root -p
GRANT ALL PRIVILEGES ON lotbicho.* TO 'usuario'@'localhost';
FLUSH PRIVILEGES;
```

### Erro: "Can't connect to MySQL server"

**Solução**: Verificar se MySQL está rodando:
```bash
sudo systemctl status mysql
sudo systemctl start mysql
```

### Erro: "Table doesn't exist"

**Solução**: Executar migrações:
```bash
npx prisma migrate dev
# ou
npx prisma db push
```

---

## 📚 Recursos Adicionais

- [Prisma MySQL Documentation](https://www.prisma.io/docs/concepts/database-connectors/mysql)
- [MySQL 8.0 Reference Manual](https://dev.mysql.com/doc/refman/8.0/en/)
- [Prisma Migration Guide](https://www.prisma.io/docs/guides/migrate-to-prisma)

---

**Última atualização**: 17/01/2026  
**Versão**: 1.0
