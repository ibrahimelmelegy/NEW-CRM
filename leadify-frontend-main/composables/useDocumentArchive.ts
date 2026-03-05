/**
 * Universal Document Archiving System — API-backed via /api/documents
 * Centralized composable for archiving/restoring/managing documents across all types.
 */

import { ref, computed } from 'vue';
import { useApiFetch } from './useApiFetch';

// ── Types ──────────────────────────────────────────────
export interface ArchivedDocument {
  id: string | number;
  refNumber: string;
  title: string;
  documentType: string;
  clientName: string;
  clientCompany?: string;
  total: number;
  currency: string;
  status: string;
  createdAt: string;
  archivedAt: string;
  archivedBy?: string;
  originalData?: Record<string, unknown>;
}

export type DocumentTypeFilter =
  | 'all'
  | 'invoice'
  | 'proforma_invoice'
  | 'purchase_order'
  | 'credit_note'
  | 'quote'
  | 'rfq'
  | 'sales_order'
  | 'delivery_note'
  | 'contract'
  | 'proposal'
  | 'sla';

// ── Document Type Labels ───────────────────────────────
export const documentTypeLabels: Record<string, { label: string; icon: string; color: string }> = {
  invoice: { label: 'Invoice', icon: 'ph:receipt', color: '#7c3aed' },
  proforma_invoice: { label: 'Proforma Invoice', icon: 'ph:receipt', color: '#6d28d9' },
  purchase_order: { label: 'Purchase Order', icon: 'ph:shopping-cart', color: '#2563eb' },
  credit_note: { label: 'Credit Note', icon: 'ph:arrow-u-up-left', color: '#dc2626' },
  quote: { label: 'Quotation', icon: 'ph:tag', color: '#059669' },
  rfq: { label: 'RFQ', icon: 'ph:question', color: '#d97706' },
  sales_order: { label: 'Sales Order', icon: 'ph:package', color: '#0891b2' },
  delivery_note: { label: 'Delivery Note', icon: 'ph:truck', color: '#ea580c' },
  contract: { label: 'Contract', icon: 'ph:handshake', color: '#4f46e5' },
  proposal: { label: 'Proposal', icon: 'ph:presentation-chart', color: '#7c3aed' },
  sla: { label: 'SLA', icon: 'ph:shield-check', color: '#0d9488' }
};

// ── Global State ───────────────────────────────────────
const archivedDocuments = ref<ArchivedDocument[]>([]);
const loading = ref(false);

export function useDocumentArchive() {
  // ── Filters ──
  const typeFilter = ref<DocumentTypeFilter>('all');
  const searchQuery = ref('');
  const dateRange = ref<[string, string] | null>(null);

  // ── Computed ──
  const filteredDocuments = computed(() => {
    let docs = archivedDocuments.value;
    if (typeFilter.value !== 'all') {
      docs = docs.filter(d => d.documentType === typeFilter.value);
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase();
      docs = docs.filter(
        d =>
          d.title.toLowerCase().includes(q) ||
          d.refNumber.toLowerCase().includes(q) ||
          d.clientName.toLowerCase().includes(q) ||
          d.clientCompany?.toLowerCase().includes(q)
      );
    }
    if (dateRange.value) {
      const [start, end] = dateRange.value;
      docs = docs.filter(d => d.archivedAt >= start && d.archivedAt <= end);
    }
    return docs.sort((a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime());
  });

  // ── Stats ──
  const stats = computed(() => {
    const total = archivedDocuments.value.length;
    const byType: Record<string, number> = {};
    archivedDocuments.value.forEach(d => {
      byType[d.documentType] = (byType[d.documentType] || 0) + 1;
    });
    const totalValue = archivedDocuments.value.reduce((sum, d) => sum + (d.total || 0), 0);
    return { total, byType, totalValue };
  });

  async function fetchArchived() {
    loading.value = true;
    try {
      const { body, success } = await useApiFetch('documents/files?tags=archived&limit=200');
      if (success && body) {
        const data = body as unknown;
        const docs = data.docs || data || [];
        archivedDocuments.value = docs.map((f) => ({
          id: f.id,
          refNumber: f.name || '',
          title: f.originalName || f.name || '',
          documentType: (f.tags || []).find((t: string) => t !== 'archived') || 'document',
          clientName: f.uploader?.name || '',
          clientCompany: '',
          total: f.size || 0,
          currency: '',
          status: 'archived',
          createdAt: f.createdAt,
          archivedAt: f.updatedAt || f.createdAt,
          archivedBy: f.uploader?.name
        }));
      }
    } finally {
      loading.value = false;
    }
  }

  // ── Actions ──
  async function archiveDocument(doc: Omit<ArchivedDocument, 'archivedAt'>): Promise<boolean> {
    if (archivedDocuments.value.some(d => d.id === doc.id && d.documentType === doc.documentType)) {
      return false;
    }
    // Update document tags to include 'archived'
    if (typeof doc.id === 'number') {
      await useApiFetch(`documents/files/${doc.id}`, 'PUT', {
        tags: ['archived', doc.documentType]
      });
    }
    archivedDocuments.value.push({
      ...doc,
      archivedAt: new Date().toISOString()
    });
    return true;
  }

  async function restoreDocument(id: string | number, documentType: string): Promise<ArchivedDocument | null> {
    const index = archivedDocuments.value.findIndex(d => d.id === id && d.documentType === documentType);
    if (index === -1) return null;
    if (typeof id === 'number') {
      await useApiFetch(`documents/files/${id}`, 'PUT', {
        tags: [documentType]
      });
    }
    const [restored] = archivedDocuments.value.splice(index, 1);
    return restored ?? null;
  }

  async function permanentlyDelete(id: string | number, documentType: string): Promise<boolean> {
    const index = archivedDocuments.value.findIndex(d => d.id === id && d.documentType === documentType);
    if (index === -1) return false;
    if (typeof id === 'number') {
      await useApiFetch(`documents/files/${id}`, 'DELETE');
    }
    archivedDocuments.value.splice(index, 1);
    return true;
  }

  async function bulkArchive(docs: Omit<ArchivedDocument, 'archivedAt'>[]): Promise<number> {
    let count = 0;
    for (const doc of docs) {
      if (await archiveDocument(doc)) count++;
    }
    return count;
  }

  async function bulkRestore(ids: Array<{ id: string | number; documentType: string }>): Promise<number> {
    let count = 0;
    for (const { id, documentType } of ids) {
      if (await restoreDocument(id, documentType)) count++;
    }
    return count;
  }

  async function bulkDelete(ids: Array<{ id: string | number; documentType: string }>): Promise<number> {
    let count = 0;
    for (const { id, documentType } of ids) {
      if (await permanentlyDelete(id, documentType)) count++;
    }
    return count;
  }

  function isArchived(id: string | number, documentType: string): boolean {
    return archivedDocuments.value.some(d => d.id === id && d.documentType === documentType);
  }

  function getArchivedByType(documentType: string): ArchivedDocument[] {
    return archivedDocuments.value
      .filter(d => d.documentType === documentType)
      .sort((a, b) => new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime());
  }

  return {
    archivedDocuments,
    filteredDocuments,
    stats,
    typeFilter,
    searchQuery,
    dateRange,
    archiveDocument,
    restoreDocument,
    permanentlyDelete,
    bulkArchive,
    bulkRestore,
    bulkDelete,
    isArchived,
    getArchivedByType,
    fetchArchived,
    loading,
    documentTypeLabels
  };
}
