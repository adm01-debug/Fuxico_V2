import { log } from './logger';

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

export function playNotificationSound(type: 'success' | 'warning' | 'info' = 'success') {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const frequencies: Record<string, number[]> = {
      success: [523.25, 659.25, 783.99],
      warning: [440, 349.23],
      info: [523.25, 587.33],
    };

    const freqs = frequencies[type] || frequencies.success;
    
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);

    let time = ctx.currentTime;
    freqs.forEach((freq, i) => {
      oscillator.frequency.setValueAtTime(freq, time + i * 0.1);
    });

    gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

    oscillator.start(time);
    oscillator.stop(time + 0.4);

    log.debug('Notification sound played', { type });
  } catch (error) {
    log.error('Error playing notification sound', error);
  }
}

export function playEmailOpenSound() {
  playNotificationSound('success');
}

export function playLinkClickSound() {
  playNotificationSound('info');
}

export function playAlertSound() {
  playNotificationSound('warning');
}
