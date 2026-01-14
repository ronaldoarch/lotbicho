const DEFAULT_BASE_URL = process.env.RECEBA_BASE_URL ?? 'https://sandbox.receba.online'

export interface RecebaClientOptions {
  baseUrl?: string
  apiKey?: string
}

export async function recebaRequest<T = any>(path: string, options: RecebaClientOptions = {}, init?: RequestInit): Promise<T> {
  const url = `${options.baseUrl ?? DEFAULT_BASE_URL}${path}`
  const apiKey = options.apiKey ?? process.env.RECEBA_API_KEY ?? ''
  
  // Headers conforme documentação oficial da Receba Online:
  // - Accept: application/json (obrigatório)
  // - Content-Type: application/json
  // - Authorization: Bearer {key}
  const headers: HeadersInit = {
    'Accept': 'application/json', // Obrigatório conforme documentação
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    ...(init?.headers || {}),
  }

  const res = await fetch(url, {
    ...init,
    headers,
    cache: 'no-store',
  })

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '')
    throw new Error(`Receba API error ${res.status}: ${errorBody}`)
  }

  return (await res.json()) as T
}

// Alias para compatibilidade
const request = recebaRequest

// Exemplos de endpoints básicos, ajustáveis conforme a documentação oficial
// Documentação: https://docs.receba.online/
export async function recebaListTransactions(options: RecebaClientOptions = {}) {
  return request('/api/v1/transactions', options)
}

export interface RecebaCreatePixPayload {
  name: string
  email: string
  phone: string
  description: string
  document: string // CPF ou CNPJ
  amount: number // usar ponto como separador decimal
  platform: string // UUID da plataforma
  reference?: string // opcional, max 50 caracteres
  extra?: string // opcional, max 255 caracteres
}

export async function recebaCreatePix(options: RecebaClientOptions = {}, payload: RecebaCreatePixPayload) {
  // Endpoint oficial conforme documentação: https://docs.receba.online/
  // POST /api/v1/transaction/pix/cashin
  return recebaRequest('/api/v1/transaction/pix/cashin', options, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function recebaWebhookPing(options: RecebaClientOptions = {}) {
  return request('/api/v1/status', options)
}
