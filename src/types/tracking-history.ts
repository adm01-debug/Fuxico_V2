/**
 * Contratos tipados do histórico de rastreamento retornado pela
 * edge function `get-tracking-history`.
 */

/** Item agregado de um e-mail rastreado exibido no Analytics. */
export interface TrackingHistoryItem {
  id: string;
  /** Identificador público usado no pixel/redirect de tracking. */
  tracking_id: string;
  recipient_email: string | null;
  subject: string | null;
  sent_at: string;
  open_count: number;
  click_count: number;
  last_opened_at?: string | null;
  status?: string | null;
}

/**
 * Superfície mínima do plugin `jspdf-autotable` que utilizamos.
 * O pacote estende o protótipo do jsPDF em runtime, mas não publica
 * os tipos correspondentes — declaramos apenas o que é chamado aqui.
 */
export interface AutoTableOptions {
  head: string[][];
  body: (string | number)[][];
  startY?: number;
}
