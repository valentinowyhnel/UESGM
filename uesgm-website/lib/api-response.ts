/**
 * API Response Helper
 * 
 * Provides standardized response functions for API routes.
 * This ensures consistent API responses across the application.
 */

import { NextResponse } from 'next/server'

// Type for API responses
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp?: string
  requestId?: string
}

/**
 * Success response
 */
export function success<T>(
  data: T, 
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    },
    { status }
  )
}

/**
 * Error response
 */
export function error(
  message: string,
  status: number = 400,
  requestId?: string
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId })
    },
    { status }
  )
}

/**
 * Created response (201)
 */
export function created<T>(
  data: T,
  message: string = 'Ressource créée avec succès'
): NextResponse<ApiResponse<T>> {
  return success(data, message, 201)
}

/**
 * Not found response (404)
 */
export function notFound(
  message: string = 'Ressource non trouvée'
): NextResponse<ApiResponse> {
  return error(message, 404)
}

/**
 * Unauthorized response (401)
 */
export function unauthorized(
  message: string = 'Non authentifié'
): NextResponse<ApiResponse> {
  return error(message, 401)
}

/**
 * Forbidden response (403)
 */
export function forbidden(
  message: string = 'Accès refusé'
): NextResponse<ApiResponse> {
  return error(message, 403)
}

/**
 * Bad request response (400)
 */
export function badRequest(
  message: string = 'Requête invalide'
): NextResponse<ApiResponse> {
  return error(message, 400)
}

/**
 * Internal server error response (500)
 */
export function serverError(
  message: string = 'Erreur interne du serveur',
  requestId?: string
): NextResponse<ApiResponse> {
  return error(message, 500, requestId)
}

/**
 * Validation error response (422)
 */
export function validationError(
  message: string = 'Erreur de validation'
): NextResponse<ApiResponse> {
  return error(message, 422)
}
