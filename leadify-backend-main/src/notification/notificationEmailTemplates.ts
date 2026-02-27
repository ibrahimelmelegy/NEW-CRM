/**
 * Renders branded HTML email for CRM notifications.
 */

interface NotificationEmailData {
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  unsubscribeUrl?: string;
  brandColor?: string;
  companyName?: string;
  logoUrl?: string;
}

const TYPE_COLORS: Record<string, string> = {
  DEAL_WON: '#22c55e',
  DEAL_ASSIGNED: '#3b82f6',
  LEAD_ASSIGNED: '#3b82f6',
  OPPORTUNITY_ASSIGNED: '#3b82f6',
  PROJECT_ASSIGNED: '#3b82f6',
  CLIENT_ASSIGNED: '#3b82f6',
  PROPOSAL_APPROVED: '#22c55e',
  PROPOSAL_REJECTED: '#ef4444',
  PROPOSAL_ASSIGNED: '#3b82f6',
  TASK_DUE: '#f59e0b',
  APPROVAL_REQUESTED: '#8b5cf6',
  COMMENT_MENTION: '#06b6d4',
  WORKFLOW_TRIGGERED: '#6366f1',
  SLA_BREACH: '#ef4444',
  SLA_WARNING: '#f59e0b',
  INVOICE_OVERDUE: '#ef4444',
  CONTRACT_EXPIRING: '#f59e0b',
  SYSTEM_ALERT: '#64748b'
};

export function renderNotificationEmail(data: NotificationEmailData): string {
  const accentColor = TYPE_COLORS[data.type] || data.brandColor || '#3b82f6';
  const companyName = data.companyName || 'Leadify CRM';

  const logoSection = data.logoUrl
    ? `<img src="${data.logoUrl}" alt="${companyName}" style="max-height:40px;max-width:180px;" />`
    : `<span style="font-size:20px;font-weight:700;color:${accentColor};">${companyName}</span>`;

  const actionButton = data.actionUrl
    ? `<tr><td style="padding:24px 0 0;">
        <a href="${data.actionUrl}" style="display:inline-block;padding:12px 28px;background:${accentColor};color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">View Details</a>
      </td></tr>`
    : '';

  const unsubscribeFooter = data.unsubscribeUrl
    ? `<a href="${data.unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe from these emails</a>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
<tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <tr><td style="padding:24px 32px;border-bottom:3px solid ${accentColor};">
      ${logoSection}
    </td></tr>
    <!-- Body -->
    <tr><td style="padding:32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td>
          <h2 style="margin:0 0 16px;font-size:20px;color:#1e293b;">${escapeHtml(data.title)}</h2>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#475569;">${escapeHtml(data.message)}</p>
        </td></tr>
        ${actionButton}
      </table>
    </td></tr>
    <!-- Footer -->
    <tr><td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
        This notification was sent by ${escapeHtml(companyName)}.<br/>
        ${unsubscribeFooter}
      </p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
