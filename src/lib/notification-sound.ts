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

export type NotificationSoundType = 'gentle' | 'chime' | 'bell' | 'digital' | 'marimba';

export const NOTIFICATION_SOUNDS: { value: NotificationSoundType; label: string; description: string }[] = [
  { value: 'gentle', label: 'Suave', description: 'Tom ascendente suave' },
  { value: 'chime', label: 'Sino', description: 'Som de sino clássico' },
  { value: 'bell', label: 'Campainha', description: 'Campainha dupla' },
  { value: 'digital', label: 'Digital', description: 'Bipe eletrônico' },
  { value: 'marimba', label: 'Marimba', description: 'Notas de marimba' },
];

// Global volume setting (0-1)
let globalVolume = 0.5;

/**
 * Sets the global volume for notification sounds
 * @param volume - Volume level from 0 to 1
 */
export function setNotificationVolume(volume: number) {
  globalVolume = Math.max(0, Math.min(1, volume));
}

/**
 * Gets the current global volume
 */
export function getNotificationVolume(): number {
  return globalVolume;
}

/**
 * Plays a notification beep sound
 * @param type - 'warning' for a gentler sound, 'critical' for more urgent
 * @param soundType - The sound style to play
 * @param volume - Optional volume override (0-1)
 */
export function playNotificationSound(
  type: 'warning' | 'critical' = 'warning',
  soundType: NotificationSoundType = 'gentle',
  volume?: number
) {
  try {
    const ctx = getAudioContext();
    const vol = volume !== undefined ? volume : globalVolume;
    
    // Resume audio context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    switch (soundType) {
      case 'gentle':
        playGentleSound(ctx, type, vol);
        break;
      case 'chime':
        playChimeSound(ctx, type, vol);
        break;
      case 'bell':
        playBellSound(ctx, type, vol);
        break;
      case 'digital':
        playDigitalSound(ctx, type, vol);
        break;
      case 'marimba':
        playMarimbaSound(ctx, type, vol);
        break;
      default:
        playGentleSound(ctx, type, vol);
    }
  } catch (error) {
    console.error('[NotificationSound] Error playing sound:', error);
  }
}

function playGentleSound(ctx: AudioContext, type: 'warning' | 'critical', volume: number) {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  const now = ctx.currentTime;
  const maxGain = volume;

  if (type === 'critical') {
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(maxGain * 0.6, now + 0.02);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
    gainNode.gain.linearRampToValueAtTime(maxGain * 0.6, now + 0.2);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.35);
    
    oscillator.start(now);
    oscillator.stop(now + 0.4);
  } else {
    oscillator.frequency.setValueAtTime(523, now);
    oscillator.frequency.linearRampToValueAtTime(659, now + 0.15);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(maxGain * 0.4, now + 0.02);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.25);
    
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }
}

function playChimeSound(ctx: AudioContext, type: 'warning' | 'critical', volume: number) {
  const now = ctx.currentTime;
  const frequencies = type === 'critical' ? [880, 1100, 880] : [523, 659, 784];
  const maxGain = volume * 0.4;
  
  frequencies.forEach((freq, i) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(freq, now);
    oscillator.type = 'sine';
    
    const startTime = now + i * 0.12;
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(maxGain, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.35);
  });
}

function playBellSound(ctx: AudioContext, type: 'warning' | 'critical', volume: number) {
  const now = ctx.currentTime;
  const baseFreq = type === 'critical' ? 1200 : 800;
  const maxGain = volume * 0.5;
  
  [0, 0.15].forEach((delay) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(baseFreq, now + delay);
    oscillator.type = 'triangle';
    
    gainNode.gain.setValueAtTime(0, now + delay);
    gainNode.gain.linearRampToValueAtTime(maxGain, now + delay + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.25);
    
    oscillator.start(now + delay);
    oscillator.stop(now + delay + 0.3);
  });
}

function playDigitalSound(ctx: AudioContext, type: 'warning' | 'critical', volume: number) {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  const now = ctx.currentTime;
  const freq = type === 'critical' ? 1500 : 1000;
  const maxGain = volume * 0.3;
  
  oscillator.frequency.setValueAtTime(freq, now);
  oscillator.type = 'square';
  
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(maxGain, now + 0.01);
  
  if (type === 'critical') {
    gainNode.gain.setValueAtTime(maxGain, now + 0.08);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
    gainNode.gain.linearRampToValueAtTime(maxGain, now + 0.15);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.25);
  } else {
    gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
  }
  
  oscillator.start(now);
  oscillator.stop(now + 0.3);
}

function playMarimbaSound(ctx: AudioContext, type: 'warning' | 'critical', volume: number) {
  const now = ctx.currentTime;
  const frequencies = type === 'critical' ? [784, 880, 988] : [523, 587, 659];
  const maxGain = volume * 0.6;
  
  frequencies.forEach((freq, i) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(freq, now);
    oscillator.type = 'sine';
    
    const startTime = now + i * 0.1;
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(maxGain, startTime + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.25);
  });
}

/**
 * Plays a success sound (for resolved alerts)
 * @param volume - Optional volume override (0-1)
 */
export function playSuccessSound(volume?: number) {
  try {
    const ctx = getAudioContext();
    const vol = volume !== undefined ? volume : globalVolume;
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;
    const maxGain = vol * 0.3;

    oscillator.frequency.setValueAtTime(523, now);
    oscillator.frequency.setValueAtTime(659, now + 0.1);
    oscillator.frequency.setValueAtTime(784, now + 0.2);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(maxGain, now + 0.02);
    gainNode.gain.setValueAtTime(maxGain, now + 0.1);
    gainNode.gain.setValueAtTime(maxGain, now + 0.2);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
    
    oscillator.start(now);
    oscillator.stop(now + 0.45);
  } catch (error) {
    console.error('[NotificationSound] Error playing sound:', error);
  }
}
