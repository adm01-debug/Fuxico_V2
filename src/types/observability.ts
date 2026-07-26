/**
 * Contratos tipados para os RPCs administrativos de observabilidade.
 *
 * Estes tipos descrevem o payload retornado pelas funções `admin_*`
 * expostas via edge function `admin-rpc`. Como o retorno é JSON dinâmico
 * (jsonb), a tipagem aqui é o único contrato de compilação disponível —
 * por isso todos os campos são opcionais/defensivos: qualquer alteração
 * no lado do banco degrada para `undefined` em vez de quebrar a UI.
 */

/** Nível de severidade padronizado nos painéis administrativos. */
export type Severity = 'ok' | 'warning' | 'critical';

/** Métricas do pool de conexões do Postgres. */
export interface OpsConnections {
  active?: number;
  total?: number;
  idle?: number;
  idle_in_tx?: number;
}

/** Metadados de tamanho do banco. */
export interface OpsDatabase {
  total_size?: string;
}

/**
 * Contagem de linhas presas em partições `_default`.
 * Chave = nome da partição default, valor = número de linhas (deveria ser 0).
 */
export type PartitionStragglers = Record<string, number>;

/** Payload de `admin_ops_dashboard()`. */
export interface OpsDashboard {
  database?: OpsDatabase;
  connections?: OpsConnections;
  default_partition_stragglers?: PartitionStragglers;
}

/** Linha da view `admin_cron_status`. */
export interface CronStatusRow {
  jobname: string;
  schedule: string | null;
  active: boolean | null;
  last_status: string | null;
  last_run_at: string | null;
}

/** Linha de `admin_table_bloat()`. */
export interface TableBloatRow {
  table_name: string;
  total_size: string | null;
  bloat_size: string | null;
  bloat_ratio_pct: number;
  live_rows: number;
  dead_rows: number;
}

/** Linha de `admin_query_regressions()`. */
export interface QueryRegressionRow {
  queryid: string | number;
  query_text: string;
  current_mean_ms: number;
  baseline_mean_ms: number;
  regression_pct: number;
  current_calls: number;
}

/** Linha de `admin_list_cron_failures()` (dead-letter queue de cron). */
export interface CronFailureRow {
  id: string;
  job_name: string;
  status_code: number | null;
  attempts: number;
  error_message: string | null;
  created_at: string;
  replayed_at: string | null;
}

/** Contadores de dispatch de alertas nas últimas 24h. */
export interface AlertSanityCounters {
  sent?: number;
  skipped?: number;
  failed?: number;
}

/** Payload de `admin_alert_sanity_check()`. */
export interface AlertSanityCheck {
  alerts_last_24h?: AlertSanityCounters;
  cron_dlq_pending?: number;
  stuck_scheduled_emails?: number;
}
