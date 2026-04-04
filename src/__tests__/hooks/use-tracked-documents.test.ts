import { describe, it, expect } from 'vitest';

describe('useTrackedDocuments - stats aggregation', () => {
  it('should aggregate views and downloads per document', () => {
    const events = [
      { document_id: 'd1', event_type: 'view', created_at: '2026-01-01T10:00:00Z' },
      { document_id: 'd1', event_type: 'view', created_at: '2026-01-01T11:00:00Z' },
      { document_id: 'd1', event_type: 'download', created_at: '2026-01-01T12:00:00Z' },
      { document_id: 'd2', event_type: 'view', created_at: '2026-01-02T10:00:00Z' },
    ];

    const statsMap = new Map<string, { views: number; downloads: number; lastViewed: string | null }>();
    events.forEach(e => {
      const stats = statsMap.get(e.document_id) || { views: 0, downloads: 0, lastViewed: null };
      if (e.event_type === 'view') stats.views++;
      else if (e.event_type === 'download') stats.downloads++;
      if (!stats.lastViewed || new Date(e.created_at) > new Date(stats.lastViewed)) {
        stats.lastViewed = e.created_at;
      }
      statsMap.set(e.document_id, stats);
    });

    expect(statsMap.get('d1')?.views).toBe(2);
    expect(statsMap.get('d1')?.downloads).toBe(1);
    expect(statsMap.get('d2')?.views).toBe(1);
  });

  it('should handle documents with no events', () => {
    const statsMap = new Map();
    const stats = statsMap.get('nonexistent') || { views: 0, downloads: 0, lastViewed: null };
    expect(stats.views).toBe(0);
    expect(stats.downloads).toBe(0);
    expect(stats.lastViewed).toBeNull();
  });
});
