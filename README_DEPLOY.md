# Guia de Deploy - Lot Bicho

## Configuração do Banco de Dados PostgreSQL

O projeto está configurado para usar PostgreSQL via Prisma ORM.

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com a seguinte variável:

```env
DATABASE_URL="postgres://postgres:SW1Ho4OVgCGpgpgZ6WVMd3fUU9E86f6H4O0CnuMUWU25b3WzS80RetfPNz7z2Zle@uk40so004k8gc488ws0sokg0:5432/postgres"
```

### Comandos do Prisma

1. **Gerar o cliente Prisma:**
   ```bash
   npm run prisma:generate
   ```

2. **Criar as tabelas no banco de dados:**
   ```bash
   npm run prisma:push
   ```
   
   Ou criar uma migration:
   ```bash
   npm run prisma:migrate
   ```

3. **Abrir Prisma Studio (opcional):**
   ```bash
   npm run prisma:studio
   ```

### Deploy no Colify

1. **Configure a variável de ambiente `DATABASE_URL`** no painel do Colify com a URL do PostgreSQL fornecida.

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Gere o cliente Prisma:**
   ```bash
   npm run prisma:generate
   ```

4. **Crie as tabelas no banco:**
   ```bash
   npm run prisma:push
   ```

5. **Build do projeto:**
   ```bash
   npm run build
   ```

6. **Inicie o servidor:**
   ```bash
   npm start
   ```

### Estrutura do Banco de Dados

O schema do Prisma inclui as seguintes tabelas:

- **Banner**: Banners promocionais
- **Story**: Stories do Instagram
- **Modalidade**: Modalidades de apostas
- **Promocao**: Promoções e bônus
- **Extracao**: Extrações de resultados
- **Cotacao**: Cotações
- **Tema**: Temas personalizáveis
- **Configuracao**: Configurações gerais da plataforma
- **Usuario**: Usuários do sistema
- **Saque**: Solicitações de saque

### Notas Importantes

- O arquivo `.env` não deve ser commitado no Git (já está no `.gitignore`)
- Use `.env.example` como referência para outras variáveis de ambiente
- O Prisma Client é gerado automaticamente durante o build (`npm run build`)
- Certifique-se de que a URL do banco de dados está correta e acessível do servidor de deploy
