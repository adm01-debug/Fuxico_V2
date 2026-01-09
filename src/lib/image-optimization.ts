/**
 * Image Optimization Utilities
 * @description Helpers para otimização de imagens
 */

export function getOptimizedImageUrl(url: string, width?: number): string {
  if (!url) return '';
  
  // Se for URL do Supabase Storage, adicionar transformações
  if (url.includes('supabase') && url.includes('storage')) {
    const params = new URLSearchParams();
    if (width) params.set('width', width.toString());
    params.set('quality', '80');
    params.set('format', 'webp');
    return `${url}?${params.toString()}`;
  }
  
  return url;
}

export function generateSrcSet(url: string, sizes: number[] = [320, 640, 960, 1280]): string {
  return sizes.map(size => `${getOptimizedImageUrl(url, size)} ${size}w`).join(', ');
}

export const imageSizes = {
  thumbnail: 150,
  small: 320,
  medium: 640,
  large: 960,
  full: 1280,
};
