// ===================
// ©AngelaMos | 2026
// useEventStream.ts
//
// SSE hooks that connect to the live log and alert streams
//
// useLogStream and useAlertStream each open an EventSource connection to the
// backend. Because EventSource doesn't support custom headers, the JWT is
// passed as a URL query parameter. On error the connection closes and
// reconnects after 3 seconds. Events are pushed into the stream store's
// ring buffers. Both hooks clean up their connection on unmount.
//
// Key exports:
//   useLogStream - connects to /logs/stream and pushes events into streamStore
//   useAlertStream - connects to /alerts/stream and pushes events into streamStore
//
// Connects to:
//   stream.store.ts - pushLogEvent, pushAlertEvent, setLogConnected, setAlertConnected
//   notification.store.ts - stores High/Critical alerts & tracks 30s escalation
//   auth.store.ts - reads accessToken for the URL query param
//   api.ts - getBaseURL() for SSE URL construction
//   sound.ts - playUrgentAlertSound for high/critical alerts
// ===================

import { useCallback, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { StreamAlertEvent, StreamLogEvent } from '@/api/types'
import { API_ENDPOINTS, QUERY_KEYS } from '@/config'
import { getBaseURL, playUrgentAlertSound } from '@/core/lib'
import {
  useAuthStore,
  useNotificationStore,
  useStreamStore,
} from '@/core/stores'

const SSE_RECONNECT_DELAY = 3000

export function useLogStream(): void {
  const token = useAuthStore((s) => s.accessToken)
  const setLogConnected = useStreamStore((s) => s.setLogConnected)
  const pushLogEvent = useStreamStore((s) => s.pushLogEvent)
  const sourceRef = useRef<EventSource | null>(null)

  const connect = useCallback(() => {
    if (token === null) return

    const url = `${getBaseURL()}${API_ENDPOINTS.LOGS.STREAM}?token=${encodeURIComponent(token)}`
    const source = new EventSource(url)
    sourceRef.current = source

    source.onopen = () => setLogConnected(true)

    source.addEventListener('log', (event: MessageEvent<string>) => {
      const data = JSON.parse(event.data) as StreamLogEvent
      pushLogEvent({ id: data.id, timestamp: data.timestamp, data })
    })

    source.onerror = () => {
      setLogConnected(false)
      source.close()
      sourceRef.current = null
      setTimeout(connect, SSE_RECONNECT_DELAY)
    }
  }, [token, setLogConnected, pushLogEvent])

  useEffect(() => {
    connect()
    return () => {
      sourceRef.current?.close()
      sourceRef.current = null
      setLogConnected(false)
    }
  }, [connect, setLogConnected])
}

export function useAlertStream(): void {
  const token = useAuthStore((s) => s.accessToken)
  const setAlertConnected = useStreamStore((s) => s.setAlertConnected)
  const pushAlertEvent = useStreamStore((s) => s.pushAlertEvent)
  const queryClient = useQueryClient()
  const sourceRef = useRef<EventSource | null>(null)

  const connect = useCallback(() => {
    if (token === null) return

    const url = `${getBaseURL()}${API_ENDPOINTS.ALERTS.STREAM}?token=${encodeURIComponent(token)}`
    const source = new EventSource(url)
    sourceRef.current = source

    source.onopen = () => setAlertConnected(true)

    source.addEventListener('alert', (event: MessageEvent<string>) => {
      const data = JSON.parse(event.data) as StreamAlertEvent
      pushAlertEvent({
        id: data.id,
        timestamp: new Date().toISOString(),
        data,
      })

      // Invalidate queries so alerts list & dashboard refresh in real time
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ALERTS.ALL })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD.ALL })

      const isHighOrCritical =
        data.severity === 'high' || data.severity === 'critical'

      if (isHighOrCritical) {
        // Play audio alert for urgent risk
        playUrgentAlertSound(data.severity)

        // Show popup toast
        toast.error(`🚨 [${data.severity.toUpperCase()}] ${data.title}`, {
          description: `Rule: ${data.rule_name} | Matched Events: ${data.matched_event_count}`,
          duration: 8000,
        })

        // Store urgent notification in the bell store (High & Critical only)
        useNotificationStore.getState().addUrgentNotification({
          alertId: data.id,
          title: data.title,
          severity: data.severity,
          ruleName: data.rule_name,
          timestamp: new Date().toISOString(),
          soundPlayed: true,
        })

        // Register for 30s repeat reminder if unacknowledged
        useNotificationStore.getState().registerActiveAlert({
          id: data.id,
          title: data.title,
          severity: data.severity,
          rule_name: data.rule_name,
        })
      } else {
        toast.warning(`[${data.severity.toUpperCase()}] ${data.title}`, {
          description: `Rule: ${data.rule_name}`,
          duration: 4000,
        })
      }
    })

    source.onerror = () => {
      setAlertConnected(false)
      source.close()
      sourceRef.current = null
      setTimeout(connect, SSE_RECONNECT_DELAY)
    }
  }, [token, setAlertConnected, pushAlertEvent, queryClient])

  useEffect(() => {
    connect()
    return () => {
      sourceRef.current?.close()
      sourceRef.current = null
      setAlertConnected(false)
    }
  }, [connect, setAlertConnected])

  // 30-second escalation reminder checker for unacknowledged High & Critical alerts
  useEffect(() => {
    const interval = setInterval(() => {
      const activeAlerts = useNotificationStore.getState().activeUrgentAlerts
      const now = Date.now()

      for (const alert of Object.values(activeAlerts)) {
        if (now - alert.lastAlertedAt >= 30000) {
          // Play repeat alert sound
          playUrgentAlertSound(alert.severity)

          // Repeat popup notification
          toast.error(
            `⚠️ [REPEATING ALERT] [${alert.severity.toUpperCase()}] ${alert.title}`,
            {
              description: `Rule: ${alert.ruleName} — Unacknowledged for 30s!`,
              duration: 7000,
            }
          )

          // Record repeat sound notification
          useNotificationStore.getState().addUrgentNotification({
            alertId: alert.alertId,
            title: alert.title,
            severity: alert.severity,
            ruleName: alert.ruleName,
            timestamp: new Date().toISOString(),
            soundPlayed: true,
            isRepeat: true,
          })

          // Update lastAlertedAt
          alert.lastAlertedAt = now
        }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])
}
