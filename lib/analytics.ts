import { supabase } from '@/lib/supabase'

/**
 * Analytics event names (matches analytics_events.event_name enum)
 */
export const ANALYTICS_EVENTS = {
  SIGNUP: 'signup',
  PERSONA_SELECTED: 'persona_selected',
  FIRST_MESSAGE: 'first_message',
  THREE_MESSAGES_SENT: 'three_messages_sent',
  SESSION_5_MIN: 'session_5_min',
} as const

export type AnalyticsEventName = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS]

/**
 * Track an analytics event for the current user
 * @param eventName - Name of the event (must match enum in database)
 * @param metadata - Optional JSON metadata to store with the event
 */
export async function trackEvent(
  eventName: AnalyticsEventName,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.warn('[Analytics] No authenticated user - skipping event:', eventName)
      return
    }

    const { error } = await supabase
      .from('analytics_events')
      .insert({
        user_id: user.id,
        event_name: eventName,
        metadata: metadata || null,
      })

    if (error) {
      console.error('[Analytics] Failed to track event:', eventName, error)
    }
  } catch (error) {
    console.error('[Analytics] Exception tracking event:', eventName, error)
  }
}

/**
 * Get all analytics events for a user
 * @param userId - User ID to fetch events for (defaults to current user)
 * @param limit - Maximum number of events to return
 */
export async function getUserEvents(
  userId?: string,
  limit: number = 100
): Promise<any[]> {
  try {
    let targetUserId = userId
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      targetUserId = user.id
    }

    const { data, error } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[Analytics] Failed to fetch user events:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[Analytics] Exception fetching user events:', error)
    return []
  }
}

/**
 * Check if a user has completed a specific event
 * @param eventName - Event name to check
 * @param userId - User ID (defaults to current user)
 */
export async function hasUserCompletedEvent(
  eventName: AnalyticsEventName,
  userId?: string
): Promise<boolean> {
  try {
    let targetUserId = userId
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false
      targetUserId = user.id
    }

    const { data, error } = await supabase
      .from('analytics_events')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('event_name', eventName)
      .limit(1)

    if (error) {
      console.error('[Analytics] Failed to check event completion:', error)
      return false
    }

    return (data?.length || 0) > 0
  } catch (error) {
    console.error('[Analytics] Exception checking event completion:', error)
    return false
  }
}
