const truthyValues = new Set(['1', 'true', 'yes', 'on'])

function isEnabled(value: string | undefined) {
  if (!value) {
    return false
  }

  return truthyValues.has(value.trim().toLowerCase())
}

export async function bootstrapMockServer() {
  if (!isEnabled(import.meta.env.MOCK_SERVER)) {
    return
  }

  if (!('serviceWorker' in navigator)) {
    console.warn('Mock server is enabled, but service workers are not supported in this browser.')
    return
  }

  const basePath = import.meta.env.BASE_URL
  const mockWorkerUrl = `${basePath}mock-sw.js`
  const registration = await navigator.serviceWorker.register(mockWorkerUrl, {
    scope: basePath,
  })

  await navigator.serviceWorker.ready
  return registration
}
