import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrackedEmail } from './tracking-api';

// ============================================
// TIPOS
// ============================================

export interface ExportOptions {
  format: 'csv' | 'pdf';
  includeSelfOpens: boolean;
  dateRange?: { from: Date; to: Date };
  includeEvents: boolean;
  fileName?: string;
}

export interface ExportStats {
  totalEmails: number;
  totalOpens: number;
  totalClicks: number;
  openRate: number;
  clickRate: number;
  period: string;
}

// ============================================
// CSV EXPORT
// ============================================

export function exportToCSV(emails: TrackedEmail[], options: Partial<ExportOptions> = {}): void {
  const { includeSelfOpens = false, fileName } = options;
  
  // Headers
  const headers = [
    'ID de Rastreamento',
    'Destinatário',
    'Assunto',
    'Remetente',
    'Data de Envio',
    'Aberturas',
    includeSelfOpens ? 'Self-Opens' : null,
    'Cliques',
    'Status de Entrega',
  ].filter(Boolean);
  
  // Data rows
  const rows = emails.map(email => {
    const row: (string | number)[] = [
      email.tracking_id,
      email.recipient_email,
      email.subject || '',
      email.sender_email || '',
      format(new Date(email.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      email.opens ?? 0,
    ];
    
    if (includeSelfOpens) {
      row.push(email.selfOpens ?? 0);
    }
    
    row.push(
      email.clicks ?? 0,
      email.delivery_status || 'Enviado',
    );
    
    return row;
  });
  
  // Convert to CSV string
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => {
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    )
  ].join('\n');
  
  // Add BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  downloadBlob(blob, fileName || `fuxico-relatorio-${format(new Date(), 'yyyy-MM-dd')}.csv`);
}

// ============================================
// PDF EXPORT
// ============================================

export function exportToPDF(emails: TrackedEmail[], options: Partial<ExportOptions> = {}): void {
  const { includeSelfOpens = false } = options;
  
  const stats = calculateStats(emails);
  const htmlContent = generatePDFHTML(emails, stats, includeSelfOpens);
  
  // Open print dialog
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

function calculateStats(emails: TrackedEmail[]): ExportStats {
  const totalEmails = emails.length;
  const totalOpens = emails.reduce((sum, e) => sum + (e.opens ?? 0), 0);
  const totalClicks = emails.reduce((sum, e) => sum + (e.clicks ?? 0), 0);
  const emailsWithOpens = emails.filter(e => (e.opens ?? 0) > 0).length;
  const emailsWithClicks = emails.filter(e => (e.clicks ?? 0) > 0).length;
  
  return {
    totalEmails,
    totalOpens,
    totalClicks,
    openRate: totalEmails > 0 ? Math.round((emailsWithOpens / totalEmails) * 100) : 0,
    clickRate: totalEmails > 0 ? Math.round((emailsWithClicks / totalEmails) * 100) : 0,
    period: emails.length > 0 
      ? `${format(new Date(emails[emails.length - 1].created_at), 'dd/MM/yyyy', { locale: ptBR })} - ${format(new Date(emails[0].created_at), 'dd/MM/yyyy', { locale: ptBR })}`
      : 'N/A',
  };
}

function generatePDFHTML(emails: TrackedEmail[], stats: ExportStats, includeSelfOpens: boolean): string {
  const now = format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>FUXICO - Relatório de Rastreamento</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1a2e;
      line-height: 1.5;
      padding: 40px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #6366f1;
    }
    .logo {
      font-size: 32px;
      font-weight: 800;
      color: #6366f1;
      letter-spacing: -1px;
    }
    .logo span { color: #1a1a2e; }
    .date { color: #6b7280; font-size: 14px; }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 16px;
      margin-bottom: 40px;
    }
    .stat-card {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #1a1a2e;
    }
    .stat-value.primary { color: #6366f1; }
    .stat-value.success { color: #10b981; }
    .stat-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }
    
    h2 {
      font-size: 18px;
      color: #1a1a2e;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    h2::before {
      content: '';
      width: 4px;
      height: 20px;
      background: #6366f1;
      border-radius: 2px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      background: #f1f5f9;
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      color: #475569;
      border-bottom: 2px solid #e2e8f0;
    }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
    }
    tr:nth-child(even) { background: #f8fafc; }
    tr:hover { background: #f1f5f9; }
    
    .status-opened { color: #10b981; font-weight: 600; }
    .status-not-opened { color: #6b7280; }
    .status-bounced { color: #ef4444; font-weight: 600; }
    
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-success { background: #dcfce7; color: #16a34a; }
    .badge-warning { background: #fef3c7; color: #d97706; }
    .badge-danger { background: #fee2e2; color: #dc2626; }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
    
    @media print {
      body { padding: 20px; }
      .stats-grid { grid-template-columns: repeat(5, 1fr); }
      table { font-size: 11px; }
      th, td { padding: 8px 12px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">FUXICO<span> Relatório</span></div>
    <div class="date">Gerado em ${now}</div>
  </div>
  
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${stats.totalEmails}</div>
      <div class="stat-label">Emails Rastreados</div>
    </div>
    <div class="stat-card">
      <div class="stat-value success">${stats.totalOpens}</div>
      <div class="stat-label">Total de Aberturas</div>
    </div>
    <div class="stat-card">
      <div class="stat-value primary">${stats.totalClicks}</div>
      <div class="stat-label">Total de Cliques</div>
    </div>
    <div class="stat-card">
      <div class="stat-value success">${stats.openRate}%</div>
      <div class="stat-label">Taxa de Abertura</div>
    </div>
    <div class="stat-card">
      <div class="stat-value primary">${stats.clickRate}%</div>
      <div class="stat-label">Taxa de Cliques</div>
    </div>
  </div>
  
  <h2>Detalhamento por Email</h2>
  <table>
    <thead>
      <tr>
        <th>Destinatário</th>
        <th>Assunto</th>
        <th>Data</th>
        <th>Aberturas</th>
        ${includeSelfOpens ? '<th>Self-Opens</th>' : ''}
        <th>Cliques</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${emails.map(email => `
        <tr>
          <td>${email.recipient_email}</td>
          <td>${email.subject || '<em>Sem assunto</em>'}</td>
          <td>${format(new Date(email.created_at), 'dd/MM/yy HH:mm')}</td>
          <td class="${(email.opens ?? 0) > 0 ? 'status-opened' : 'status-not-opened'}">${email.opens ?? 0}</td>
          ${includeSelfOpens ? `<td>${email.selfOpens ?? 0}</td>` : ''}
          <td class="${(email.clicks ?? 0) > 0 ? 'status-opened' : ''}">${email.clicks ?? 0}</td>
          <td>
            ${email.delivery_status === 'bounced' 
              ? '<span class="badge badge-danger">Bounce</span>'
              : (email.opens ?? 0) > 0
                ? '<span class="badge badge-success">Aberto</span>'
                : '<span class="badge badge-warning">Aguardando</span>'
            }
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="footer">
    FUXICO - Sistema de Rastreamento de Emails • Período: ${stats.period}
  </div>
</body>
</html>
  `;
}

// ============================================
// UTILITÁRIOS
// ============================================

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================
// EXPORT JSON (para backup)
// ============================================

export function exportToJSON(emails: TrackedEmail[], fileName?: string): void {
  const data = {
    exportedAt: new Date().toISOString(),
    totalEmails: emails.length,
    emails: emails,
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, fileName || `fuxico-backup-${format(new Date(), 'yyyy-MM-dd')}.json`);
}
