// Store compartilhado para configurações (em produção, usar banco de dados)
let configuracoes = {
  nomePlataforma: 'Lot Bicho',
  numeroSuporte: '(00) 00000-0000',
  emailSuporte: 'suporte@lotbicho.com',
  whatsappSuporte: '5500000000000',
}

export function getConfiguracoes() {
  return configuracoes
}

export function updateConfiguracoes(updates: any) {
  configuracoes = { ...configuracoes, ...updates }
  return configuracoes
}
