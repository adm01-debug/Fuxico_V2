// =============================================================================
// FUXICO - Notification Sound Utility
// Uses Web Audio API to generate notification sounds without external files
// =============================================================================

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

/**
 * Plays a notification beep sound
 * @param type - 'warning' for a gentler sound, 'critical' for more urgent
 */
export function playNotificationSound(type: 'warning' | 'critical' = 'warning') {
  try {
    const ctx = getAudioContext();
    
    // Resume audio context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'critical') {
      // More urgent: two quick beeps at higher frequency
      oscillator.frequency.setValueAtTime(880, now); // A5
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.2);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.35);
      
      oscillator.start(now);
      oscillator.stop(now + 0.4);
    } else {
      // Warning: gentle ascending tone
      oscillator.frequency.setValueAtTime(523, now); // C5
      oscillator.frequency.linearRampToValueAtTime(659, now + 0.15); // E5
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.25);
      
      oscillator.start(now);
      oscillator.stop(now + 0.3);
    }
  } catch (error) {
    console.error('[NotificationSound] Error playing sound:', error);
  }
}

/**
 * Plays a success sound (for resolved alerts)
 */
export function playSuccessSound() {
  try {
    const ctx = getAudioContext();
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    // Pleasant ascending chime
    oscillator.frequency.setValueAtTime(523, now); // C5
    oscillator.frequency.setValueAtTime(659, now + 0.1); // E5
    oscillator.frequency.setValueAtTime(784, now + 0.2); // G5
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gainNode.gain.setValueAtTime(0.15, now + 0.1);
    gainNode.gain.setValueAtTime(0.15, now + 0.2);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
    
    oscillator.start(now);
    oscillator.stop(now + 0.45);
  } catch (error) {
    console.error('[NotificationSound] Error playing sound:', error);
  }
}
