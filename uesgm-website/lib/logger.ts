type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SECURITY'

interface LogEntry {
    timestamp: string
    level: LogLevel
    module: string
    message: string
    details?: any
    ip?: string
    userId?: string
}

/**
 * Structured Security Logger
 */
export const logger = {
    log: (level: LogLevel, module: string, message: string, details?: any) => {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            module,
            message,
            details: sanitizeDetails(details)
        }

        // In production, this would go to an external service like Sentry or Axiom
        if (process.env.NODE_ENV === 'production') {
            console.log(JSON.stringify(entry))
        } else {
            console.log(`[${entry.timestamp}] [${level}] [${module}] ${message}`, details || '')
        }
    },

    info: (module: string, message: string, details?: any) => logger.log('INFO', module, message, details),
    warn: (module: string, message: string, details?: any) => logger.log('WARN', module, message, details),
    error: (module: string, message: string, details?: any) => logger.log('ERROR', module, message, details),
    security: (module: string, message: string, details?: any) => logger.log('SECURITY', module, message, details),
}

/**
 * Ensure no sensitive data (passwords, etc.) are logged
 */
function sanitizeDetails(details: any): any {
    if (!details) return details
    const sensitiveKeys = ['password', 'token', 'secret', 'key']

    const sanitized = { ...details }
    for (const key of sensitiveKeys) {
        if (key in sanitized) {
            sanitized[key] = '[REDACTED]'
        }
    }
    return sanitized
}
