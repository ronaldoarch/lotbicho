/**
 * Parser para extrair resultados do HTML do bichocerto.com
 * 
 * Endpoint: POST https://bichocerto.com/resultados/base/resultado/
 * Parâmetros: l (código loteria), d (data YYYY-MM-DD)
 * Retorna: HTML com divs de resultados
 */

export interface BichoCertoResultado {
  horario: string
  titulo: string
  premios: Array<{
    posicao: string
    numero: string
    grupo?: string
    animal?: string
  }>
}

export interface BichoCertoExtracao {
  horarioId: string
  horario: string
  titulo: string
  premios: BichoCertoResultado['premios']
}

/**
 * Mapeamento de códigos de loteria do bichocerto.com para nomes das extrações
 */
export const LOTERIA_CODE_MAP: Record<string, { nome: string; estado?: string }> = {
  ln: { nome: 'NACIONAL', estado: 'BR' },
  sp: { nome: 'PT SP', estado: 'SP' },
  ba: { nome: 'PT BAHIA', estado: 'BA' },
  pb: { nome: 'LOTEP', estado: 'PB' },
  bs: { nome: 'BOA SORTE', estado: 'GO' },
  lce: { nome: 'LOTECE', estado: 'CE' },
  lk: { nome: 'LOOK', estado: 'GO' },
  fd: { nome: 'FEDERAL', estado: 'BR' },
  m: { nome: 'MILHAR', estado: 'BR' },
}

/**
 * Busca resultados do bichocerto.com
 */
export async function buscarResultadosBichoCerto(
  codigoLoteria: string,
  data: string,
  phpsessid?: string
): Promise<{ erro: string | null; dados: Record<string, BichoCertoExtracao> }> {
  const url = 'https://bichocerto.com/resultados/base/resultado/'
  
  const headers: HeadersInit = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (compatible; JogoBicho/1.0)',
  }
  
  // Adicionar cookie PHPSESSID se fornecido (para acesso histórico)
  if (phpsessid) {
    headers['Cookie'] = `PHPSESSID=${phpsessid}`
  }
  
  try {
    const formData = new URLSearchParams()
    formData.append('l', codigoLoteria)
    formData.append('d', data)
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData.toString(),
      cache: 'no-store',
    })
    
    if (!response.ok) {
      return {
        erro: `HTTP ${response.status}: ${response.statusText}`,
        dados: {},
      }
    }
    
    let html = await response.text()
    
    // Log detalhado para debug (primeiros 2000 caracteres)
    console.log(`   📄 Resposta recebida (primeiros 2000 chars): ${html.substring(0, 2000)}`)
    
    // Verificar erros comuns
    if (html.includes('Sem resultados para esta data')) {
      console.log(`   ⚠️ Resposta indica: Sem resultados para esta data`)
      return {
        erro: 'Sem resultados para esta data',
        dados: {},
      }
    }
    
    if (html.includes('Só é possível visualizar resultados dos últimos')) {
      console.log(`   ⚠️ Resposta indica: Data fora do intervalo permitido`)
      return {
        erro: 'Data fora do intervalo permitido (últimos 10 dias para visitantes)',
        dados: {},
      }
    }
    
    // IMPORTANTE: A resposta pode vir como JavaScript seguido de HTML
    // Remover JavaScript do início antes de processar
    html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    html = html.replace(/jQuery\([^)]*\)[^;]*;?/gi, '')
    html = html.replace(/document\.getElementById\([^)]*\)[^;]*;?/gi, '')
    
    // Procurar pela primeira ocorrência de HTML real (div ou table)
    const htmlStartIndex = html.search(/<div[^>]*id=["']div_display_/i)
    if (htmlStartIndex > 0) {
      html = html.substring(htmlStartIndex)
      console.log(`   🔍 HTML limpo: removido ${htmlStartIndex} caracteres de JavaScript do início`)
    }
    
    // Verificar se HTML contém estrutura esperada
    const temDivDisplay = html.includes('div_display_')
    const temTable = html.includes('<table')
    console.log(`   🔍 Estrutura HTML: tem div_display=${temDivDisplay}, tem table=${temTable}`)
    
    // Fazer parsing do HTML
    const resultados = parsearHTML(html, codigoLoteria)
    
    console.log(`   📊 Resultados parseados: ${Object.keys(resultados).length} extração(ões)`)
    
    if (Object.keys(resultados).length === 0) {
      // Log mais detalhado quando não encontra resultados
      const divMatches = html.match(/div_display_\d+/g)
      const tableMatches = html.match(/table_\d+/g)
      console.log(`   ⚠️ Nenhum resultado encontrado. Divs encontradas: ${divMatches?.length || 0}, Tabelas encontradas: ${tableMatches?.length || 0}`)
      
      return {
        erro: 'Nenhum resultado encontrado no HTML',
        dados: {},
      }
    }
    
    return {
      erro: null,
      dados: resultados,
    }
  } catch (error) {
    return {
      erro: error instanceof Error ? error.message : 'Erro desconhecido',
      dados: {},
    }
  }
}

/**
 * Faz parsing do HTML retornado pelo bichocerto.com
 * 
 * Estrutura esperada:
 * - divs com id="div_display_XX" (XX = horário)
 * - tabelas com id="table_XX"
 * - Cada tabela contém linhas (tr) com prêmios
 */
function parsearHTML(html: string, codigoLoteria: string): Record<string, BichoCertoExtracao> {
  const resultados: Record<string, BichoCertoExtracao> = {}
  
  // Encontrar todas as divs com id="div_display_XX" usando uma abordagem mais robusta
  // Primeiro, encontrar todas as divs e suas posições
  const divRegex = /<div[^>]*id=["']div_display_(\d+)["'][^>]*>/gi
  const divsEncontradas: Array<{ horarioId: string; startIndex: number }> = []
  
  let match
  while ((match = divRegex.exec(html)) !== null) {
    divsEncontradas.push({
      horarioId: match[1],
      startIndex: match.index || 0,
    })
  }
  
  console.log(`   🔍 Encontradas ${divsEncontradas.length} divs com div_display_`)
  
  // Para cada div encontrada, extrair seu conteúdo completo
  for (let i = 0; i < divsEncontradas.length; i++) {
    const { horarioId, startIndex } = divsEncontradas[i]
    const nextDivStart = i < divsEncontradas.length - 1 
      ? divsEncontradas[i + 1].startIndex 
      : html.length
    
    // Extrair conteúdo da div (do início até a próxima div ou fim)
    const divContent = html.substring(startIndex, nextDivStart)
    
    // Buscar tabela dentro da div (pode estar na mesma div ou próxima)
    const tableRegex = new RegExp(`<table[^>]*id=["']table_${horarioId}["'][^>]*>([\\s\\S]*?)<\\/table>`, 'i')
    const tableMatch = divContent.match(tableRegex) || html.substring(startIndex).match(tableRegex)
    
    if (!tableMatch) {
      console.log(`   ⚠️ Tabela table_${horarioId} não encontrada para div_display_${horarioId}`)
      continue
    }
    
    const tableContent = tableMatch[1]
    
    // Extrair título (h5.card-title ou texto antes da tabela)
    // Tentar múltiplos padrões para capturar o título completo
    let titleMatch = divContent.match(/<h5[^>]*class="[^"]*card-title[^"]*"[^>]*>([\s\S]*?)<\/h5>/i)
    if (!titleMatch) {
      // Tentar encontrar título em outras tags ou texto antes da tabela
      titleMatch = divContent.match(/Resultado[^<]*/i)
        || divContent.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i)
    }
    
    const titulo = titleMatch ? limparHTML(titleMatch[1] || titleMatch[0]).trim() : `Extração ${horarioId}h`
    
    // Extrair horário do título ou usar horarioId
    const horario = extrairHorarioDoTitulo(titulo, horarioId)
    
    // Log para debug de horários
    if (horario !== `${horarioId.padStart(2, '0')}:00`) {
      console.log(`   ⏰ Horário extraído: "${titulo}" -> ${horario}`)
    }
    
    // Extrair prêmios da tabela
    const premios = extrairPremiosDaTabela(tableContent)
    
    console.log(`   📊 Div ${horarioId}: ${premios.length} prêmio(s) extraído(s)`)
    
    // Log detalhado das posições extraídas
    if (premios.length > 0) {
      const posicoesExtraidas = premios.map(p => p.posicao).join(', ')
      console.log(`      Posições extraídas: ${posicoesExtraidas}`)
      
      // Verificar se tem 7º prêmio
      const tem7Premio = premios.some(p => p.posicao === '7º' || p.posicao === '7')
      if (!tem7Premio && premios.length >= 6) {
        console.log(`      ⚠️ ATENÇÃO: Encontrados ${premios.length} prêmios mas NÃO encontrado 7º prêmio!`)
        console.log(`      Conteúdo da tabela (últimas 500 chars): ${tableContent.slice(-500)}`)
      }
    }
    
    if (premios.length > 0) {
      resultados[horarioId] = {
        horarioId,
        horario,
        titulo,
        premios,
      }
    } else {
      console.log(`   ⚠️ Nenhum prêmio extraído da tabela table_${horarioId}`)
      console.log(`   📄 Conteúdo da tabela (primeiros 500 chars): ${tableContent.substring(0, 500)}`)
    }
  }
  
  return resultados
}

/**
 * Extrai horário do título ou converte horarioId
 */
function extrairHorarioDoTitulo(titulo: string, horarioId: string): string {
  // Tentar extrair horário completo com minutos (ex: "PT-SP 20:40" -> "20:40")
  const horaMinutoMatch = titulo.match(/(\d{1,2}):(\d{2})/)
  if (horaMinutoMatch) {
    const hora = horaMinutoMatch[1].padStart(2, '0')
    const minuto = horaMinutoMatch[2].padStart(2, '0')
    return `${hora}:${minuto}`
  }
  
  // Tentar extrair horário do título (ex: "Resultado Nacional 23h" -> "23:00")
  const horaMatch = titulo.match(/(\d{1,2})h/i)
  if (horaMatch) {
    const hora = horaMatch[1].padStart(2, '0')
    return `${hora}:00`
  }
  
  // Converter horarioId para formato de horário
  // Se horarioId tem 2 dígitos, usar como hora (ex: "23" -> "23:00")
  if (horarioId.length === 2 && /^\d{2}$/.test(horarioId)) {
    return `${horarioId}:00`
  }
  
  // Se horarioId tem 1 dígito, preencher com zero (ex: "9" -> "09:00")
  if (horarioId.length === 1 && /^\d$/.test(horarioId)) {
    return `${horarioId.padStart(2, '0')}:00`
  }
  
  // Fallback: tentar usar horarioId como está, mas garantir formato válido
  const horarioIdNum = parseInt(horarioId, 10)
  if (!isNaN(horarioIdNum) && horarioIdNum >= 0 && horarioIdNum <= 23) {
    return `${horarioIdNum.toString().padStart(2, '0')}:00`
  }
  
  // Se nada funcionar, retornar horário padrão baseado no ID
  return `${horarioId.padStart(2, '0')}:00`
}

/**
 * Extrai prêmios de uma tabela HTML
 */
function extrairPremiosDaTabela(tableContent: string): BichoCertoResultado['premios'] {
  const premios: BichoCertoResultado['premios'] = []
  const posicoesJaExtraidas = new Set<string>() // Rastrear posições já extraídas nesta tabela
  
  // Regex para encontrar linhas da tabela (tr)
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  
  let trMatch
  let linhaIndex = 0
  while ((trMatch = trRegex.exec(tableContent)) !== null) {
    linhaIndex++
    const trContent = trMatch[1]
    
    // Extrair células (td)
    const tdMatches = trContent.match(/<td[^>]*>([\s\S]*?)<\/td>/gi)
    if (!tdMatches || tdMatches.length < 2) {
      continue
    }
    
    // Ignorar linhas que contêm "SUPER 5" ou outras informações não relacionadas a prêmios
    const trContentLimpo = limparHTML(trContent)
    if (trContentLimpo.includes('SUPER 5') || trContentLimpo.includes('SUPER5')) {
      continue
    }
    
    // Normalmente: [posição, emoji?, número, grupo, animal]
    // Tentar extrair número (geralmente na 3ª coluna ou em link/h5)
    let numero: string | null = null
    let posicao: string | null = null
    let grupo: string | undefined
    let animal: string | undefined
    
    // Extrair posição (geralmente primeira coluna) - pode ter formato "1º", "7º", "1", "7", etc.
    const primeiraColuna = limparHTML(tdMatches[0])
    const posicaoMatch = primeiraColuna.match(/(\d+)[º°oO]?/i)
    if (posicaoMatch) {
      posicao = `${posicaoMatch[1]}º`
      
      // Log especial para 7º prêmio durante extração
      if (posicaoMatch[1] === '7') {
        console.log(`   🔍 Linha ${linhaIndex}: Encontrada posição "7º" na primeira coluna: "${primeiraColuna}"`)
      }
    } else {
      // Se não encontrou na primeira coluna, tentar em outras colunas
      for (let i = 1; i < Math.min(3, tdMatches.length); i++) {
        const coluna = limparHTML(tdMatches[i])
        const posicaoMatchAlt = coluna.match(/(\d+)[º°oO]?/i)
        if (posicaoMatchAlt) {
          const numPos = parseInt(posicaoMatchAlt[1], 10)
          // Se for uma posição válida (1-7), usar
          if (numPos >= 1 && numPos <= 7) {
            posicao = `${posicaoMatchAlt[1]}º`
            if (numPos === 7) {
              console.log(`   🔍 Linha ${linhaIndex}: Encontrada posição "7º" na coluna ${i + 1}: "${coluna}"`)
            }
            break
          }
        }
      }
    }
    
    // Procurar número em todas as células (geralmente 3ª ou 4ª coluna)
    // IMPORTANTE: Milhares sempre têm 4 dígitos (ex: "8601", "6000", "1930")
    // Grupos têm 1-2 dígitos (ex: "01", "25", "8")
    // Posições têm 1-2 dígitos seguidos de "º" (ex: "1º", "7º")
    for (let i = 0; i < tdMatches.length; i++) {
      const td = tdMatches[i]
      const textoLimpo = limparHTML(td)
      
      // PRIMEIRO: Tentar encontrar número de 4 dígitos (milhar) - PRIORIDADE MÁXIMA
      const numMatch4 = textoLimpo.match(/\b(\d{4})\b/)
      if (numMatch4) {
        numero = numMatch4[1]
        // Se encontrou número de 4 dígitos, tentar extrair grupo da próxima célula
        if (i + 1 < tdMatches.length) {
          const grupoTexto = limparHTML(tdMatches[i + 1])
          const grupoMatch = grupoTexto.match(/\b(\d{1,2})\b/)
          if (grupoMatch) {
            const grupoNum = parseInt(grupoMatch[1], 10)
            // Validar que é um grupo válido (1-25), não outro número
            if (grupoNum >= 1 && grupoNum <= 25) {
              grupo = grupoMatch[1].padStart(2, '0')
            }
          }
        }
        // Tentar extrair animal da última célula
        if (tdMatches.length > i + 2) {
          animal = limparHTML(tdMatches[tdMatches.length - 1]).trim()
        }
        break
      }
      
      // SEGUNDO: Tentar encontrar número em link ou h5 (pode ter formatação especial)
      const linkMatch = td.match(/<a[^>]*>([\s\S]*?)<\/a>/i) || td.match(/<h5[^>]*>([\s\S]*?)<\/h5>/i)
      if (linkMatch) {
        const textoLink = limparHTML(linkMatch[1])
        const numMatchLink4 = textoLink.match(/\b(\d{4})\b/)
        
        if (numMatchLink4) {
          numero = numMatchLink4[1]
          // Tentar extrair grupo da próxima célula
          if (i + 1 < tdMatches.length) {
            const grupoTexto = limparHTML(tdMatches[i + 1])
            const grupoMatch = grupoTexto.match(/\b(\d{1,2})\b/)
            if (grupoMatch) {
              const grupoNum = parseInt(grupoMatch[1], 10)
              if (grupoNum >= 1 && grupoNum <= 25) {
                grupo = grupoMatch[1].padStart(2, '0')
              }
            }
          }
          // Tentar extrair animal da última célula
          if (tdMatches.length > i + 2) {
            animal = limparHTML(tdMatches[tdMatches.length - 1]).trim()
          }
          break
        }
      }
    }
    
    // TERCEIRO: Se não encontrou número de 4 dígitos, tentar número de 3 dígitos (pode estar sem zero à esquerda)
    // Mas apenas se não encontrou nenhum número ainda
    if (!numero) {
      for (let i = 0; i < tdMatches.length; i++) {
        const td = tdMatches[i]
        const textoLimpo = limparHTML(td)
        
        // Ignorar primeira coluna (posição) e números de 1-2 dígitos (grupos)
        if (i === 0 && textoLimpo.match(/^\d{1,2}[º°]?$/)) {
          continue
        }
        
        // Tentar encontrar número de 3 dígitos
        // IMPORTANTE: Números de 3 dígitos são SEMPRE milhares (ex: "022", "494", "015", "953")
        // Grupos têm apenas 1-2 dígitos, então qualquer número de 3 dígitos é milhar
        const numMatch3 = textoLimpo.match(/\b(\d{3})\b/)
        if (numMatch3) {
          // Aceitar TODOS os números de 3 dígitos como milhares
          numero = numMatch3[1].padStart(4, '0') // Pad para 4 dígitos (ex: "022" -> "0022")
          console.log(`   🔧 Linha ${linhaIndex}: Número de 3 dígitos encontrado: "${numMatch3[1]}" -> "${numero}"`)
          
          // Tentar extrair grupo da próxima célula
          if (i + 1 < tdMatches.length) {
            const grupoTexto = limparHTML(tdMatches[i + 1])
            const grupoMatch = grupoTexto.match(/\b(\d{1,2})\b/)
            if (grupoMatch) {
              const grupoNum = parseInt(grupoMatch[1], 10)
              if (grupoNum >= 1 && grupoNum <= 25) {
                grupo = grupoMatch[1].padStart(2, '0')
              }
            }
          }
          // Tentar extrair animal da última célula
          if (tdMatches.length > i + 2) {
            animal = limparHTML(tdMatches[tdMatches.length - 1]).trim()
          }
          break
        }
      }
    }
    
    // Se não encontrou grupo ainda, tentar procurar em outras células
    if (!grupo) {
      for (let i = 0; i < tdMatches.length; i++) {
        const grupoTexto = limparHTML(tdMatches[i])
        const grupoMatch = grupoTexto.match(/(\d{1,2})/)
        if (grupoMatch && grupoMatch[1] !== posicao?.replace('º', '')) {
          grupo = grupoMatch[1].padStart(2, '0')
          break
        }
      }
    }
    
    // Se não encontrou animal ainda, tentar da última célula
    if (!animal && tdMatches.length > 0) {
      const ultimaColuna = limparHTML(tdMatches[tdMatches.length - 1])
      // Se não é número e não é emoji, pode ser animal
      if (!ultimaColuna.match(/^\d+$/) && ultimaColuna.length > 0) {
        animal = ultimaColuna.trim()
      }
    }
    
    if (numero && posicao) {
      // CRÍTICO: Normalizar número para sempre ter 4 dígitos
      // Milhares sempre devem ter 4 dígitos (ex: "494" -> "0494", "15" -> "0015")
      const numeroOriginal = numero
      
      // Se tem menos de 4 dígitos, fazer pad com zeros à esquerda
      if (numero.length < 4) {
        numero = numero.padStart(4, '0')
        console.log(`   🔧 Linha ${linhaIndex} (${posicao}): Número normalizado "${numeroOriginal}" -> "${numero}"`)
      }
      
      // Validar que o número tem exatamente 4 dígitos após normalização
      if (numero.length !== 4) {
        console.log(`   ❌ Linha ${linhaIndex} (${posicao}): Número inválido após normalização: "${numero}" (${numero.length} dígitos)`)
        numero = null
      }
      
      // Validar que é um número válido (não pode ser grupo ou posição)
      // IMPORTANTE: Números de 3+ dígitos são SEMPRE milhares, mesmo que comecem com zero
      // Apenas números de 1-2 dígitos podem ser grupos
      if (numero) {
        // Se o número original tinha 3 ou mais dígitos, é definitivamente um milhar
        if (numeroOriginal.length >= 3) {
          // Números de 3+ dígitos são sempre milhares, aceitar
          // Exemplos: "022" -> "0022", "494" -> "0494", "953" -> "0953"
        } else {
          // Números de 1-2 dígitos podem ser grupos, validar
          const numValue = parseInt(numero, 10)
          if (numValue <= 25) {
            console.log(`   ⚠️ Linha ${linhaIndex} (${posicao}): Número "${numero}" (${numeroOriginal.length} dígitos) pode ser grupo, não milhar. Ignorando.`)
            numero = null
          }
        }
      }
      
      if (numero && posicao) {
        // Verificar se esta posição já foi extraída (evitar duplicatas)
        if (posicoesJaExtraidas.has(posicao)) {
          console.log(`   ⚠️ Linha ${linhaIndex}: Posição "${posicao}" já foi extraída anteriormente. Ignorando duplicata.`)
          continue
        }
        
        // Marcar posição como extraída
        posicoesJaExtraidas.add(posicao)
        
        // Log especial para 7º prêmio para debug
        if (posicao === '7º' || posicao === '7') {
          console.log(`   🔍 7º PRÊMIO extraído: número="${numero}", grupo="${grupo || 'N/A'}", animal="${animal || 'N/A'}"`)
          console.log(`      Células da linha: ${tdMatches.map((td, idx) => `${idx + 1}ª: "${limparHTML(td)}"`).join(' | ')}`)
        }
        
        premios.push({
          posicao,
          numero, // Sempre 4 dígitos aqui
          grupo: grupo || '',
          animal: animal || '',
        })
      }
    } else {
      console.log(`   ⚠️ Linha ${linhaIndex}: Não foi possível extrair número ou posição`)
      console.log(`      Células encontradas: ${tdMatches.length}`)
      console.log(`      Primeira célula: ${limparHTML(tdMatches[0])}`)
      if (tdMatches.length > 1) console.log(`      Segunda célula: ${limparHTML(tdMatches[1])}`)
      if (tdMatches.length > 2) console.log(`      Terceira célula: ${limparHTML(tdMatches[2])}`)
      if (tdMatches.length > 3) console.log(`      Quarta célula: ${limparHTML(tdMatches[3])}`)
      if (tdMatches.length > 4) console.log(`      Quinta célula: ${limparHTML(tdMatches[4])}`)
    }
  }
  
  return premios
}

/**
 * Remove tags HTML e limpa texto
 */
function limparHTML(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Converte resultados do bichocerto.com para formato do sistema
 */
export function converterParaFormatoSistema(
  resultados: Record<string, BichoCertoExtracao>,
  codigoLoteria: string,
  data: string
): Array<{
  position: string
  milhar: string
  grupo: string
  animal: string
  drawTime: string
  horario: string
  loteria: string
  location: string
  date: string
  dataExtracao: string
  estado?: string
}> {
  const loteriaInfo = LOTERIA_CODE_MAP[codigoLoteria] || { nome: codigoLoteria.toUpperCase(), estado: undefined }
  
  const resultadosFormatados: Array<{
    position: string
    milhar: string
    grupo: string
    animal: string
    drawTime: string
    horario: string
    loteria: string
    location: string
    date: string
    dataExtracao: string
    estado?: string
  }> = []
  
  Object.values(resultados).forEach((extracao) => {
    extracao.premios.forEach((premio) => {
      // Garantir que milhar sempre tenha 4 dígitos
      let milharNormalizado = premio.numero || ''
      if (milharNormalizado.length < 4) {
        milharNormalizado = milharNormalizado.padStart(4, '0')
      }
      
      resultadosFormatados.push({
        position: premio.posicao,
        milhar: milharNormalizado,
        grupo: premio.grupo || '', // Garantir que seja string, não undefined
        animal: premio.animal || '', // Garantir que seja string, não undefined
        drawTime: extracao.horario,
        horario: extracao.horario,
        loteria: loteriaInfo.nome,
        // Melhorar localização para facilitar filtros
        location: loteriaInfo.estado 
          ? `${loteriaInfo.nome} - ${loteriaInfo.estado}` 
          : loteriaInfo.nome === 'NACIONAL' || loteriaInfo.nome === 'FEDERAL'
          ? 'Nacional'
          : loteriaInfo.nome,
        date: data,
        dataExtracao: data,
        estado: loteriaInfo.estado || (loteriaInfo.nome === 'NACIONAL' || loteriaInfo.nome === 'FEDERAL' ? 'BR' : undefined),
      })
    })
  })
  
  return resultadosFormatados
}

/**
 * Busca resultados específicos para liquidação
 * Retorna resultados organizados por horário para facilitar match com apostas
 */
export async function buscarResultadosParaLiquidacao(
  codigoLoteria: string,
  data: string,
  phpsessid?: string
): Promise<{
  erro: string | null
  resultadosPorHorario: Record<string, Array<{
    position: string
    milhar: string
    grupo: string
    animal: string
    drawTime: string
    horario: string
    loteria: string
    date: string
    dataExtracao: string
  }>>
}> {
  const resultado = await buscarResultadosBichoCerto(codigoLoteria, data, phpsessid)
  
  if (resultado.erro) {
    return {
      erro: resultado.erro,
      resultadosPorHorario: {},
    }
  }
  
  const loteriaInfo = LOTERIA_CODE_MAP[codigoLoteria] || { nome: codigoLoteria.toUpperCase() }
  const resultadosPorHorario: Record<string, Array<any>> = {}
  
  // Organizar resultados por horário
  Object.values(resultado.dados).forEach((extracao) => {
    const horario = extracao.horario
    
    if (!resultadosPorHorario[horario]) {
      resultadosPorHorario[horario] = []
    }
    
      extracao.premios.forEach((premio) => {
        // Garantir que milhar sempre tenha 4 dígitos
        let milharNormalizado = premio.numero || ''
        if (milharNormalizado.length < 4) {
          milharNormalizado = milharNormalizado.padStart(4, '0')
        }
        
        resultadosPorHorario[horario].push({
          position: premio.posicao,
          milhar: milharNormalizado,
          grupo: premio.grupo || '', // Garantir que seja string
          animal: premio.animal || '', // Garantir que seja string
          drawTime: extracao.horario,
          horario: extracao.horario,
          loteria: loteriaInfo.nome,
          date: data,
          dataExtracao: data,
        })
      })
  })
  
  return {
    erro: null,
    resultadosPorHorario,
  }
}

/**
 * Mapeia código de loteria do sistema para código do bichocerto.com
 * Converte IDs de extração ou nomes para códigos (ln, sp, ba, etc)
 */
export function mapearCodigoLoteria(loteria: string | null): string | null {
  if (!loteria) return null
  
  // Se já é um código válido (ln, sp, ba, etc)
  if (LOTERIA_CODE_MAP[loteria.toLowerCase()]) {
    return loteria.toLowerCase()
  }
  
  // Se é um ID numérico, buscar na lista de extrações
  if (/^\d+$/.test(loteria)) {
    try {
      // Importar dinamicamente para evitar dependência circular
      const extracoes = require('@/data/extracoes').extracoes
      const extracao = extracoes.find((e: any) => e.id === parseInt(loteria))
      
      if (extracao) {
        const nome = extracao.name.toUpperCase()
        
        // Mapear nome para código
        const nomeLower = nome.toLowerCase()
        if (nomeLower.includes('nacional')) return 'ln'
        if (nomeLower.includes('pt sp') || nomeLower.includes('bandeirantes')) return 'sp'
        if (nomeLower.includes('pt bahia') || nomeLower.includes('bahia')) return 'ba'
        if (nomeLower.includes('lotep') || nomeLower.includes('paraiba') || nomeLower.includes('paraíba')) return 'pb'
        if (nomeLower.includes('boa sorte')) return 'bs'
        if (nomeLower.includes('lotece')) return 'lce'
        if (nomeLower.includes('look')) return 'lk'
        if (nomeLower.includes('federal')) return 'fd'
      }
    } catch (error) {
      // Ignorar erro
    }
  }
  
  // Tentar mapear por nome direto
  const loteriaLower = loteria.toLowerCase()
  if (loteriaLower.includes('nacional')) return 'ln'
  if (loteriaLower.includes('pt sp') || loteriaLower.includes('bandeirantes')) return 'sp'
  if (loteriaLower.includes('pt bahia') || loteriaLower.includes('bahia')) return 'ba'
  if (loteriaLower.includes('lotep') || loteriaLower.includes('paraiba') || loteriaLower.includes('paraíba')) return 'pb'
  if (loteriaLower.includes('boa sorte')) return 'bs'
  if (loteriaLower.includes('lotece')) return 'lce'
  if (loteriaLower.includes('look')) return 'lk'
  if (loteriaLower.includes('federal')) return 'fd'
  
  return null
}
