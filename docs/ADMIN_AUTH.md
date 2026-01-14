# Sistema de Autenticação Admin

## Visão Geral

O sistema de autenticação admin protege todas as rotas administrativas, exigindo login para acessar o painel e APIs admin.

## Funcionalidades

- ✅ Login admin separado do login de usuários
- ✅ Proteção de rotas admin via middleware
- ✅ Verificação de autenticação em todas as APIs admin
- ✅ Sessão admin com cookie seguro
- ✅ Logout funcional
- ✅ Interface de login moderna

## Como Criar o Primeiro Administrador

### Opção 1: Via Script (Recomendado)

```bash
npm run create-admin <email> <senha> [nome]
```

**Exemplo:**
```bash
npm run create-admin admin@exemplo.com senha123 "Admin Principal"
```

### Opção 2: Via Prisma Studio

1. Execute `npm run prisma:studio`
2. Abra a tabela `Usuario`
3. Crie ou edite um usuário:
   - Marque `isAdmin` como `true`
   - Defina `passwordHash` usando a função `hashPassword` do código

### Opção 3: Via SQL Direto

```sql
UPDATE "Usuario" 
SET "isAdmin" = true, 
    "passwordHash" = '<hash_da_senha>'
WHERE email = 'admin@exemplo.com';
```

**Nota:** O hash da senha deve ser gerado usando `hashPassword` do arquivo `lib/auth.ts`.

## Estrutura de Arquivos

```
lib/admin-auth.ts              # Funções de autenticação admin
app/admin/login/page.tsx        # Página de login admin
app/api/admin/auth/             # APIs de autenticação
  ├── login/route.ts           # Login
  ├── logout/route.ts          # Logout
  └── me/route.ts              # Verificar sessão
middleware.ts                   # Middleware de proteção
scripts/create-admin.ts         # Script para criar admin
```

## Proteção de Rotas

### Rotas Protegidas

Todas as rotas que começam com `/admin` (exceto `/admin/login`) são protegidas automaticamente pelo middleware.

### APIs Protegidas

Todas as APIs que começam com `/api/admin` (exceto `/api/admin/auth/login`) retornam 401 se não autenticadas.

### Como Proteger uma Nova Rota Admin

Adicione no início da função da rota:

```typescript
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação admin
    await requireAdmin()
    
    // Seu código aqui...
  } catch (error) {
    // Tratar erro de autenticação
  }
}
```

## Cookies e Sessão

- **Nome do cookie:** `admin_session`
- **Duração:** 7 dias
- **Segurança:** 
  - `httpOnly: true` (não acessível via JavaScript)
  - `secure: true` em produção (apenas HTTPS)
  - `sameSite: 'lax'`

## Fluxo de Autenticação

1. Usuário acessa `/admin` ou qualquer rota admin
2. Middleware verifica cookie `admin_session`
3. Se não autenticado, redireciona para `/admin/login`
4. Usuário faz login com email e senha
5. API valida credenciais e verifica `isAdmin = true`
6. Cookie de sessão é criado
7. Usuário é redirecionado para `/admin`

## Segurança

- ✅ Senhas são hasheadas usando SHA-256
- ✅ Verificação de `isAdmin` no banco a cada requisição
- ✅ Verificação de conta ativa (`ativo = true`)
- ✅ Cookies httpOnly e secure
- ✅ Middleware protege rotas automaticamente
- ✅ APIs retornam 401 para requisições não autenticadas

## Troubleshooting

### "Acesso negado" ao fazer login

- Verifique se o usuário tem `isAdmin = true` no banco
- Verifique se a conta está ativa (`ativo = true`)
- Verifique se a senha está correta

### Redirecionamento infinito

- Limpe os cookies do navegador
- Verifique se o middleware está funcionando corretamente
- Verifique se a rota `/admin/login` está acessível

### Erro ao criar admin via script

- Certifique-se de ter `tsx` instalado: `npm install -D tsx`
- Verifique se o banco de dados está acessível
- Verifique se o Prisma está configurado corretamente
