import { resolveApiBaseUrl } from '@/utils/apiBase'

type ActionKey = 'Import Organizations' | 'Import Emission Sources' | 'Load BAR Data' | 'Generate Organization Scheme'

async function postForm(endpointPath: string, filePath: string): Promise<Response> {
  const base = resolveApiBaseUrl()
  const url = `${base}${endpointPath}`
  const formData = new FormData()
  formData.append('file_path', filePath)
  return fetch(url, { method: 'POST', body: formData })
}

export const processingService: Record<ActionKey, (filePath: string) => Promise<Response>> = {
  'Import Organizations': (filePath: string) => postForm('/processing/createorg', filePath),
  'Import Emission Sources': (filePath: string) => postForm('/processing/ingestes', filePath),
  'Load BAR Data': (filePath: string) => postForm('/processing/ingestbar', filePath),
  'Generate Organization Scheme': (filePath: string) => postForm('/processing/generateschemeorg', filePath),
}


