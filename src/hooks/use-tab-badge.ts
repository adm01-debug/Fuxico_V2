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
    if (count > 0) {
      document.title = `(${count}) ${originalTitle.current}`;
    } else {
      document.title = originalTitle.current;
    }

    // Cleanup on unmount
    return () => {
      document.title = originalTitle.current;
    };
  }, [count]);
}

/**
 * Creates a favicon with a notification badge
 * @param count - Number to display in badge
 */
export function updateFaviconBadge(count: number) {
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
    updateFaviconBadge(count);

    return () => {
      updateFaviconBadge(0);
    };
  }, [count]);
}
