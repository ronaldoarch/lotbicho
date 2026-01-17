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
    
    const html = await response.text()
    
    // Verificar erros comuns
    if (html.includes('Sem resultados para esta data')) {
      return {
        erro: 'Sem resultados para esta data',
        dados: {},
      }
    }
    
    if (html.includes('Só é possível visualizar resultados dos últimos')) {
      return {
        erro: 'Data fora do intervalo permitido (últimos 10 dias para visitantes)',
        dados: {},
      }
    }
    
    // Fazer parsing do HTML
    const resultados = parsearHTML(html, codigoLoteria)
    
    if (Object.keys(resultados).length === 0) {
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
  
  // Regex para encontrar divs de resultado
  // Formato: <div id="div_display_XX">...</div>
  const divRegex = /<div[^>]*id="div_display_(\d+)"[^>]*>([\s\S]*?)<\/div>/gi
  
  let match
  while ((match = divRegex.exec(html)) !== null) {
    const horarioId = match[1]
    const divContent = match[2]
    
    // Buscar tabela dentro da div
    const tableRegex = new RegExp(`<table[^>]*id="table_${horarioId}"[^>]*>([\\s\\S]*?)<\\/table>`, 'i')
    const tableMatch = divContent.match(tableRegex)
    
    if (!tableMatch) continue
    
    const tableContent = tableMatch[1]
    
    // Extrair título (h5.card-title)
    const titleMatch = divContent.match(/<h5[^>]*class="[^"]*card-title[^"]*"[^>]*>([\s\S]*?)<\/h5>/i)
    const titulo = titleMatch ? limparHTML(titleMatch[1]).trim() : `Extração ${horarioId}h`
    
    // Extrair horário do título ou usar horarioId
    const horario = extrairHorarioDoTitulo(titulo, horarioId)
    
    // Extrair prêmios da tabela
    const premios = extrairPremiosDaTabela(tableContent)
    
    if (premios.length > 0) {
      resultados[horarioId] = {
        horarioId,
        horario,
        titulo,
        premios,
      }
    }
  }
  
  return resultados
}

/**
 * Extrai horário do título ou converte horarioId
 */
function extrairHorarioDoTitulo(titulo: string, horarioId: string): string {
  // Tentar extrair horário do título (ex: "Resultado Nacional 23h" -> "23:00")
  const horaMatch = titulo.match(/(\d{1,2})h/i)
  if (horaMatch) {
    const hora = horaMatch[1].padStart(2, '0')
    return `${hora}:00`
  }
  
  // Converter horarioId para formato de horário (ex: "23" -> "23:00")
  if (horarioId.length === 2) {
    return `${horarioId}:00`
  }
  
  // Se horarioId tem formato diferente (ex: "20" para 20h40)
  // Tentar mapear para horário correto baseado no código da loteria
  return `${horarioId.padStart(2, '0')}:00`
}

/**
 * Extrai prêmios de uma tabela HTML
 */
function extrairPremiosDaTabela(tableContent: string): BichoCertoResultado['premios'] {
  const premios: BichoCertoResultado['premios'] = []
  
  // Regex para encontrar linhas da tabela (tr)
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  
  let trMatch
  while ((trMatch = trRegex.exec(tableContent)) !== null) {
    const trContent = trMatch[1]
    
    // Extrair células (td)
    const tdMatches = trContent.match(/<td[^>]*>([\s\S]*?)<\/td>/gi)
    if (!tdMatches || tdMatches.length < 3) continue
    
    // Normalmente: [posição, grupo?, número, animal?, ...]
    // Tentar extrair número (geralmente na 3ª coluna ou em link/h5)
    let numero: string | null = null
    let posicao: string | null = null
    let grupo: string | undefined
    let animal: string | undefined
    
    // Extrair posição (geralmente primeira coluna)
    const primeiraColuna = limparHTML(tdMatches[0])
    const posicaoMatch = primeiraColuna.match(/(\d+)[º°]/i)
    if (posicaoMatch) {
      posicao = `${posicaoMatch[1]}º`
    }
    
    // Procurar número em links ou h5 (geralmente na 3ª coluna)
    for (let i = 0; i < tdMatches.length; i++) {
      const td = tdMatches[i]
      
      // Tentar encontrar número em link ou h5
      const linkMatch = td.match(/<a[^>]*>([\s\S]*?)<\/a>/i) || td.match(/<h5[^>]*>([\s\S]*?)<\/h5>/i)
      if (linkMatch) {
        const texto = limparHTML(linkMatch[1])
        const numMatch = texto.match(/(\d{3,4})/)
        if (numMatch) {
          numero = numMatch[1]
          break
        }
      }
      
      // Tentar encontrar número direto no texto
      const textoLimpo = limparHTML(td)
      const numMatch = textoLimpo.match(/(\d{3,4})/)
      if (numMatch && !numero) {
        numero = numMatch[1]
      }
    }
    
    // Extrair grupo (geralmente 2ª ou 3ª coluna)
    if (tdMatches.length > 1) {
      const grupoTexto = limparHTML(tdMatches[1])
      const grupoMatch = grupoTexto.match(/(\d{1,2})/)
      if (grupoMatch) {
        grupo = grupoMatch[1]
      }
    }
    
    // Extrair animal (geralmente última coluna)
    if (tdMatches.length > 3) {
      animal = limparHTML(tdMatches[tdMatches.length - 1]).trim()
    }
    
    if (numero && posicao) {
      premios.push({
        posicao,
        numero,
        grupo,
        animal,
      })
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
  grupo?: string
  animal?: string
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
    grupo?: string
    animal?: string
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
      resultadosFormatados.push({
        position: premio.posicao,
        milhar: premio.numero,
        grupo: premio.grupo,
        animal: premio.animal,
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
    grupo?: string
    animal?: string
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
      resultadosPorHorario[horario].push({
        position: premio.posicao,
        milhar: premio.numero,
        grupo: premio.grupo,
        animal: premio.animal,
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
