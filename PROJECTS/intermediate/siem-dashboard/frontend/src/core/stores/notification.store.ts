// ===================
// notification.store.ts
//
// Zustand store for urgent risk notifications (High & Critical only)
// and 30-second escalation reminder tracking.
// ===================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UrgentNotification {
  id: string
  alertId: string
  title: string
  severity: 'high' | 'critical' | string
  ruleName: string
  timestamp: string
  soundPlayed: boolean
  isRepeat?: boolean
  read: boolean
}

export interface ActiveUrgentAlert {
  alertId: string
  title: string
  severity: string
  ruleName: string
  firstSeen: number
  lastAlertedAt: number
}

interface NotificationState {
  notifications: UrgentNotification[]
  activeUrgentAlerts: Record<string, ActiveUrgentAlert>
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  toggleOpen: () => void
  addUrgentNotification: (notification: Omit<UrgentNotification, 'id' | 'read'>) => void
  markAllRead: () => void
  clearAll: () => void
  registerActiveAlert: (alert: { id: string; title: string; severity: string; rule_name: string }) => void
  dismissActiveAlert: (alertId: string) => void
  syncActiveAlerts: (alerts: Array<{ id: string; title: string; severity: string; rule_name: string; status: string }>) => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      activeUrgentAlerts: {},
      isOpen: false,

      setIsOpen: (isOpen) => set({ isOpen }),
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

      addUrgentNotification: (notif) => {
        const newEntry: UrgentNotification = {
          ...notif,
          id: `${notif.alertId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          read: false,
        }
        set((state) => ({
          notifications: [newEntry, ...state.notifications].slice(0, 100),
        }))
      },

      markAllRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }))
      },

      clearAll: () => {
        set({ notifications: [] })
      },

      registerActiveAlert: (alert) => {
        const severity = alert.severity?.toLowerCase()
        if (severity !== 'high' && severity !== 'critical') return

        const now = Date.now()
        set((state) => ({
          activeUrgentAlerts: {
            ...state.activeUrgentAlerts,
            [alert.id]: state.activeUrgentAlerts[alert.id] ?? {
              alertId: alert.id,
              title: alert.title,
              severity: alert.severity,
              ruleName: alert.rule_name,
              firstSeen: now,
              lastAlertedAt: now,
            },
          },
        }))
      },

      dismissActiveAlert: (alertId) => {
        set((state) => {
          if (!state.activeUrgentAlerts[alertId]) return state
          const updated = { ...state.activeUrgentAlerts }
          delete updated[alertId]
          return { activeUrgentAlerts: updated }
        })
      },

      syncActiveAlerts: (alerts) => {
        const now = Date.now()
        set((state) => {
          const updated = { ...state.activeUrgentAlerts }
          for (const alert of alerts) {
            const sev = alert.severity?.toLowerCase()
            const isUrgent = sev === 'high' || sev === 'critical'
            const isUnresolved = alert.status === 'new'

            if (isUrgent && isUnresolved) {
              if (!updated[alert.id]) {
                updated[alert.id] = {
                  alertId: alert.id,
                  title: alert.title,
                  severity: alert.severity,
                  ruleName: alert.rule_name,
                  firstSeen: now,
                  lastAlertedAt: now,
                }
              }
            } else {
              delete updated[alert.id]
            }
          }
          return { activeUrgentAlerts: updated }
        })
      },
    }),
    {
      name: 'siem-urgent-notifications',
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 50),
      }),
    }
  )
)
