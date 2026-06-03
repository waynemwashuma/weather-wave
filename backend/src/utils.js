export function normalizeCity(city) {
  return city.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function safeDecode(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function titleCase(input) {
  return input
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}
