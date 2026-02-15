import { isIP } from 'is-ip'

const ALLOWED_DOMAINS = ['uesgm.ma', 'cloudinary.com', 'resend.com']

/**
 * Validate external URLs to prevent SSRF
 */
export function validateExternalUrl(urlStr: string): boolean {
    try {
        const url = new URL(urlStr)

        // 1. Block private IPs and localhost
        if (url.hostname === 'localhost' || 
            url.hostname === '127.0.0.1' ||
            url.hostname === '::1' ||
            (isIP(url.hostname) && (
              url.hostname.startsWith('10.') ||
              url.hostname.startsWith('172.16.') ||
              url.hostname.startsWith('192.168.') ||
              url.hostname.startsWith('169.254.') ||
              url.hostname.startsWith('fd') // Adresses ULA (RFC 4193)
            ))) {
            return false
        }

        // 2. Protocol whitelist
        if (url.protocol !== 'https:') {
            return false
        }

        // 3. Domain whitelist (Optional check if needed)
        // return ALLOWED_DOMAINS.some(domain => url.hostname.endsWith(domain))

        return true
    } catch (e) {
        return false
    }
}
