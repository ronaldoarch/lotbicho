const { execSync } = require('child_process');

function checkAndCreateTables() {
  try {
    console.log('🔄 Verificando e criando tabelas no banco de dados...');
    
    // Executa db push (é idempotente, não vai recriar se já existir)
    // Usa --skip-generate para não regenerar o client (já foi gerado no build)
    execSync('npx prisma db push --accept-data-loss --skip-generate', { 
      stdio: 'inherit',
      env: { ...process.env },
      timeout: 30000 // Timeout de 30 segundos
    });
    
    console.log('✅ Banco de dados verificado e pronto!');
  } catch (error) {
    // Se der erro, verifica se é porque as tabelas já existem ou outro erro
    const errorMessage = error.message || '';
    const errorOutput = error.stdout?.toString() || error.stderr?.toString() || '';
    
    if (
      errorMessage.includes('already exists') || 
      errorMessage.includes('P3009') ||
      errorOutput.includes('already exists') ||
      errorOutput.includes('P3009')
    ) {
      console.log('✅ Tabelas já existem no banco de dados');
    } else if (errorMessage.includes('timeout')) {
      console.error('⏱️  Timeout ao verificar banco de dados. Continuando...');
    } else {
      console.error('⚠️  Aviso ao verificar banco de dados:', errorMessage);
      console.log('ℹ️  Continuando com o start da aplicação...');
    }
  }
}

// Sempre executa (tanto em produção quanto em desenvolvimento)
checkAndCreateTables();
