// ===================
// notification-bell.tsx
//
// Top-right notification bell icon & dropdown storing High & Critical risk alert notifications
// ===================

import { useEffect, useRef } from 'react'
import { LuBell, LuVolume2 } from 'react-icons/lu'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/config'
import { useNotificationStore } from '@/core/stores'
import styles from './notification-bell.module.scss'

export function NotificationBell(): React.ReactElement {
  const navigate = useNavigate()
  const { notifications, isOpen, toggleOpen, setIsOpen, markAllRead, clearAll } =
    useNotificationStore()
  const containerRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, setIsOpen])

  const handleToggle = () => {
    if (!isOpen && unreadCount > 0) {
      markAllRead()
    }
    toggleOpen()
  }

  const handleSelectNotification = (_alertId: string) => {
    setIsOpen(false)
    navigate(ROUTES.ALERTS)
  }

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={`${styles.bellBtn} ${isOpen ? styles.active : ''}`}
        onClick={handleToggle}
        aria-label="Urgent notifications"
        title="Urgent Risk Notifications"
      >
        <LuBell />
        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <div className={styles.titleGroup}>
              <span className={styles.title}>Urgent Notifications</span>
              <span className={styles.headerBadge}>High & Critical Only</span>
            </div>
            {notifications.length > 0 && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={clearAll}
              >
                Clear all
              </button>
            )}
          </div>

          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.empty}>
                No urgent risk notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`${styles.item} ${n.read ? '' : styles.unread} ${
                    n.severity.toLowerCase() === 'critical' ? styles.critical : ''
                  }`}
                  onClick={() => handleSelectNotification(n.alertId)}
                >
                  <div className={styles.itemTop}>
                    <span
                      className={`${styles.severityTag} ${
                        styles[n.severity.toLowerCase()] ?? ''
                      }`}
                    >
                      {n.severity}
                    </span>
                    <span className={styles.soundTag} title="Alert sound played">
                      <LuVolume2 /> Sound
                    </span>
                    {n.isRepeat && (
                      <span className={styles.repeatTag}>30s Repeat</span>
                    )}
                  </div>

                  <div className={styles.itemTitle}>{n.title}</div>

                  <div className={styles.itemMeta}>
                    <span className={styles.ruleName}>{n.ruleName}</span>
                    <span className={styles.time}>
                      {new Date(n.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
