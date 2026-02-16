import { z } from 'zod'

/**
 * Authentication Schema
 * Validates email and password for signup and login
 */
export const authSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

/**
 * Type inference from the schema
 */
export type AuthInput = z.infer<typeof authSchema>

/**
 * Validates email format
 * @param email Email string to validate
 * @returns null if valid, error message if invalid
 */
export const validateEmail = (email: string): string | null => {
  try {
    z.string().email().parse(email)
    return null
  } catch {
    return 'Please enter a valid email address'
  }
}

/**
 * Validates password strength
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one number
 * 
 * @param password Password string to validate
 * @returns null if valid, error message if invalid
 */
export const validatePassword = (password: string): string | null => {
  if (password.length < 8) {
    return 'Password must be at least 8 characters'
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter'
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number'
  }
  return null
}

/**
 * Validates that two passwords match
 * @param password First password
 * @param confirmPassword Password confirmation
 * @returns null if match, error message if different
 */
export const validatePasswordMatch = (password: string, confirmPassword: string): string | null => {
  if (password !== confirmPassword) {
    return 'Passwords do not match'
  }
  return null
}

/**
 * Map authentication errors to generic messages
 * Prevents account enumeration attacks
 * @param error Original error message
 * @returns Generic error message
 */
export const mapAuthError = (error: unknown): string => {
  const errorMsg = error instanceof Error ? error.message : String(error)
  
  // Map specific errors to generic messages
  if (errorMsg.includes('Invalid login credentials') || 
      errorMsg.includes('User not found') ||
      errorMsg.includes('Invalid password')) {
    return 'Email or password is incorrect'
  }
  
  if (errorMsg.includes('already registered') || 
      errorMsg.includes('already exists')) {
    return 'This email is already registered. Please sign in instead.'
  }
  
  if (errorMsg.includes('email')) {
    return 'Please check your email address'
  }
  
  // Default generic message
  return 'Unable to complete this action. Please try again.'
}
