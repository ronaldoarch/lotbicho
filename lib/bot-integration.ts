/**
 * Integração com Bot de Liquidação Externa
 * 
 * Este módulo permite enviar apostas para um bot externo que processa
 * a liquidação automaticamente e envia de volta os resultados.
 */

interface BotAposta {
  aposta_id_externo: string
  usuario_id: number
  numero?: string
  animal?: string
  grupos?: number[]
  valor: number
  loteria: string
  horario: string
  tipo_aposta?: string
  multiplicador?: number
  extraction_id?: number
  modalidade?: string
  position?: string
  detalhes?: any
}

interface BotResponse {
  sucesso: boolean
  aposta_id_bot?: number
  mensagem?: string
  erro?: string
}

/**
 * Enviar aposta para bot externo
 */
export async function enviarApostaParaBot(
  aposta: BotAposta,
  botApiUrl?: string
): Promise<BotResponse> {
  const BOT_API_URL = botApiUrl || process.env.BOT_API_URL || ''
  
  if (!BOT_API_URL) {
    console.warn('⚠️ BOT_API_URL não configurado, pulando envio para bot')
    return {
      sucesso: false,
      erro: 'BOT_API_URL não configurado',
    }
  }

  try {
    const payload: any = {
      aposta_id_externo: aposta.aposta_id_externo,
      usuario_id: aposta.usuario_id,
      valor: aposta.valor,
      loteria: aposta.loteria,
      horario: aposta.horario,
      tipo_aposta: aposta.tipo_aposta || 'grupo',
      multiplicador: aposta.multiplicador || 18.0,
    }

    // Adicionar número ou grupos dependendo do tipo
    if (aposta.numero) {
      payload.numero = aposta.numero.padStart(4, '0')
    }
    if (aposta.animal) {
      payload.animal = aposta.animal
    }
    if (aposta.grupos && aposta.grupos.length > 0) {
      payload.grupos = aposta.grupos
    }

    // Campos opcionais
    if (aposta.extraction_id) {
      payload.extraction_id = aposta.extraction_id
    }
    if (aposta.modalidade) {
      payload.modalidade = aposta.modalidade
    }
    if (aposta.position) {
      payload.position = aposta.position
    }
    if (aposta.detalhes) {
      payload.detalhes = aposta.detalhes
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Adicionar autenticação se configurada
    const BOT_API_KEY = process.env.BOT_API_KEY
    if (BOT_API_KEY) {
      headers['Authorization'] = `Bearer ${BOT_API_KEY}`
    }

    const response = await fetch(`${BOT_API_URL}/api/apostas/receber`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error(`❌ Erro ao enviar aposta para bot: ${data.erro || response.statusText}`)
      return {
        sucesso: false,
        erro: data.erro || `Erro HTTP ${response.status}`,
      }
    }

    if (data.sucesso) {
      console.log(`✅ Aposta ${aposta.aposta_id_externo} enviada para bot: ${data.aposta_id_bot}`)
      return data
    } else {
      console.error(`❌ Bot retornou erro: ${data.erro}`)
      return {
        sucesso: false,
        erro: data.erro || 'Erro desconhecido do bot',
      }
    }
  } catch (error) {
    console.error('❌ Erro ao enviar aposta para bot:', error)
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : 'Erro ao conectar com bot',
    }
  }
}

/**
 * Verificar status do bot
 */
export async function verificarStatusBot(botApiUrl?: string): Promise<any> {
  const BOT_API_URL = botApiUrl || process.env.BOT_API_URL || ''
  
  if (!BOT_API_URL) {
    return {
      bot_disponivel: false,
      erro: 'BOT_API_URL não configurado',
    }
  }

  try {
    const headers: Record<string, string> = {}
    const BOT_API_KEY = process.env.BOT_API_KEY
    if (BOT_API_KEY) {
      headers['Authorization'] = `Bearer ${BOT_API_KEY}`
    }

    const response = await fetch(`${BOT_API_URL}/api/status`, {
      headers,
    })

    if (!response.ok) {
      return {
        bot_disponivel: false,
        erro: `Erro HTTP ${response.status}`,
      }
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao verificar status do bot:', error)
    return {
      bot_disponivel: false,
      erro: error instanceof Error ? error.message : 'Erro ao conectar com bot',
    }
  }
}

/**
 * Converter aposta do sistema para formato do bot
 */
export function converterApostaParaBot(aposta: any): BotAposta {
  const detalhes = aposta.detalhes || {}
  const betData = detalhes.betData || {}

  // Determinar tipo de aposta
  let tipoAposta = 'grupo'
  let numero: string | undefined
  let animal: string | undefined
  let grupos: number[] | undefined

  if (betData.numberBets && betData.numberBets.length > 0) {
    // Modalidade numérica
    tipoAposta = betData.modalityName?.toLowerCase().includes('milhar') ? 'milhar' :
                 betData.modalityName?.toLowerCase().includes('centena') ? 'centena' :
                 betData.modalityName?.toLowerCase().includes('dezena') ? 'dezena' : 'grupo'
    numero = betData.numberBets[0] // Enviar primeiro número
  } else if (betData.animalBets && betData.animalBets.length > 0) {
    // Modalidade de grupo
    tipoAposta = 'grupo'
    // Converter IDs de animais para grupos
    const { ANIMALS } = require('@/data/animals')
    grupos = betData.animalBets[0].map((animalId: number) => {
      const animal = ANIMALS.find((a: any) => a.id === animalId)
      return animal?.group || 0
    }).filter((g: number) => g > 0)
  }

  return {
    aposta_id_externo: aposta.id.toString(),
    usuario_id: aposta.usuarioId,
    numero,
    grupos,
    valor: aposta.valor,
    loteria: aposta.loteria || '',
    horario: aposta.horario || '',
    tipo_aposta: tipoAposta,
    modalidade: betData.modalityName || aposta.modalidade,
    position: betData.position,
    extraction_id: aposta.loteria ? parseInt(aposta.loteria) : undefined,
    detalhes: {
      modalityName: betData.modalityName,
      divisionType: betData.divisionType,
      amount: betData.amount,
    },
  }
}
