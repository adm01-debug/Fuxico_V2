import { log } from './logger';

let audioContext: AudioContext | null = null;

// Type for webkit prefixed AudioContext
interface WindowWithWebkitAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext;
}

function getAudioContext(): AudioContext {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || (window as WindowWithWebkitAudioContext).webkitAudioContext;
    if (AudioContextClass) {
      audioContext = new AudioContextClass();
    } else {
      throw new Error('AudioContext not supported');
    }
  }
  return audioContext;
}

export type NotificationSoundType = 'gentle' | 'bell' | 'chime' | 'alert';

export const NOTIFICATION_SOUNDS: { label: string; value: NotificationSoundType }[] = [
  { label: 'Suave', value: 'gentle' },
  { label: 'Sino', value: 'bell' },
  { label: 'Chime', value: 'chime' },
  { label: 'Alerta', value: 'alert' },
];

export function playNotificationSound(
  type: 'success' | 'warning' | 'info' | 'critical' = 'success',
  soundType: NotificationSoundType = 'gentle',
  volume: number = 0.5
) {
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
      critical: [880, 659.25, 440],
    };

    const soundPatterns: Record<NotificationSoundType, 'sine' | 'triangle' | 'square' | 'sawtooth'> = {
      gentle: 'sine',
      bell: 'triangle',
      chime: 'sine',
      alert: 'square',
    };

    const freqs = frequencies[type] || frequencies.success;
    
    oscillator.type = soundPatterns[soundType];
    gainNode.gain.setValueAtTime(Math.min(volume, 1), ctx.currentTime);

    const time = ctx.currentTime;
    freqs.forEach((freq, i) => {
      oscillator.frequency.setValueAtTime(freq, time + i * 0.1);
    });

    gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

    oscillator.start(time);
    oscillator.stop(time + 0.4);

    log.debug('Notification sound played', { type, soundType, volume });
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
