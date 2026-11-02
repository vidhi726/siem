// ===================
// sound.ts
//
// Web Audio API synthesizer for urgent security alert notifications
// ===================

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx || audioCtx.state === 'closed') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      if (AudioCtx) {
        audioCtx = new AudioCtx()
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      void audioCtx.resume()
    }
    return audioCtx
  } catch (err) {
    console.warn('AudioContext not available:', err)
    return null
  }
}

/**
 * Plays an urgent audio alarm sound using Web Audio API
 */
export function playUrgentAlertSound(severity?: string): void {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const isCritical = severity?.toLowerCase() === 'critical'
    const now = ctx.currentTime

    // Two-tone urgent siren beeps
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = isCritical ? 'sawtooth' : 'triangle'

    const freq1 = isCritical ? 900 : 750
    const freq2 = isCritical ? 1200 : 950

    osc.frequency.setValueAtTime(freq1, now)
    osc.frequency.setValueAtTime(freq2, now + 0.12)
    osc.frequency.setValueAtTime(freq1, now + 0.24)
    osc.frequency.setValueAtTime(freq2, now + 0.36)

    gain.gain.setValueAtTime(0.3, now)
    gain.gain.setValueAtTime(0.3, now + 0.45)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.6)
  } catch (err) {
    console.warn('Failed to play alert sound:', err)
  }
}
