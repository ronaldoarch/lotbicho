FROM node:20-bullseye-slim

WORKDIR /app

# Criar diretório para uploads (será montado como volume)
RUN mkdir -p /app/public/uploads/banners /app/public/uploads/logos /app/public/uploads/stories

# Copiar arquivos de dependências
COPY package.json package-lock.json* ./

# Instalar dependências do sistema necessárias (openssl, curl, cron)
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates curl cron \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependências sem rodar scripts (evita prisma generate antes do schema)
RUN npm ci --ignore-scripts

# Copiar arquivos do projeto
COPY . .

# Gerar Prisma Client e fazer build
RUN npx prisma generate && npm run build

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Garantir que os diretórios de upload existam (volume será montado aqui)
VOLUME ["/app/public/uploads"]

# Configurar cron job para liquidação automática
RUN mkdir -p /app/scripts/cron /app/logs
COPY scripts/cron/liquidar.sh /app/scripts/cron/liquidar.sh
RUN chmod +x /app/scripts/cron/liquidar.sh

# Adicionar cron job (executa a cada 5 minutos)
RUN (crontab -l 2>/dev/null; echo "*/5 * * * * /app/scripts/cron/liquidar.sh") | crontab -

# Copiar script de inicialização com cron
COPY scripts/start-with-cron.sh /app/scripts/start-with-cron.sh
RUN chmod +x /app/scripts/start-with-cron.sh

CMD ["/app/scripts/start-with-cron.sh"]
