// lib/url-validator.ts
import { isIP } from 'net'

export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    // Check if it's localhost or private IP
    if (url.hostname === 'localhost' || isPrivateIp(url.hostname)) {
      return true
    }
    return url.protocol === 'https:'
  } catch {
    return false
  }
}

function isPrivateIp(hostname: string): boolean {
  if (isIP(hostname)) {
    const parts = hostname.split('.').map(Number)
    // Check for private IP ranges
    return (
      parts[0] === 10 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168)
    )
  }
  return false
}