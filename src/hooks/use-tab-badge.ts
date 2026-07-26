// =============================================================================
// FUXICO - Tab Badge Hook
// Updates browser tab title with unread notification count
// =============================================================================

import { useEffect, useRef } from 'react';

const BASE_TITLE = 'FUXICO - Email Tracking';

/**
 * Updates the browser tab title with unread count badge
 * @param count - Number of unread notifications
 */
export function useTabBadge(count: number) {
  const originalTitle = useRef(BASE_TITLE);

  useEffect(() => {
    // Copiado para variável local: o cleanup precisa do valor vigente no
    // momento em que o efeito rodou, não do ref no momento da desmontagem.
    const baseTitle = originalTitle.current;

    document.title = count > 0 ? `(${count}) ${baseTitle}` : baseTitle;

    return () => {
      document.title = baseTitle;
    };
  }, [count]);
}

/**
 * Creates a favicon with a notification badge
 * @param count - Number to display in badge
 */
export function updateFaviconBadge(count: number, signal?: { aborted: boolean }) {
  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!favicon) return;

  if (count === 0) {
    // Reset to original favicon
    favicon.href = '/favicon.ico';
    return;
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    if (signal?.aborted) return;
    canvas.width = 32;
    canvas.height = 32;

    // Draw original favicon
    ctx.drawImage(img, 0, 0, 32, 32);

    // Draw badge circle
    ctx.beginPath();
    ctx.arc(24, 8, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#ef4444'; // red-500
    ctx.fill();

    // Draw count text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(count > 9 ? '9+' : count.toString(), 24, 8);

    // Update favicon
    favicon.href = canvas.toDataURL('image/png');
  };

  img.src = '/favicon.ico';
}

/**
 * Combined hook for tab badge (title + favicon)
 */
export function useTabNotificationBadge(count: number) {
  useTabBadge(count);

  useEffect(() => {
    const signal = { aborted: false };
    updateFaviconBadge(count, signal);

    return () => {
      signal.aborted = true;
      updateFaviconBadge(0);
    };
  }, [count]);
}
