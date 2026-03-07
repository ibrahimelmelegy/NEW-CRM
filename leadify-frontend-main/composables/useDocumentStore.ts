/* eslint-disable no-use-before-define */
/**
 * Universal Document Store — API-backed via /api/documents
 * Central store for all saved documents across types.
 * Supports CRUD, filtering, linking, and statistics.
 */

import { ref, computed } from 'vue';
import { useApiFetch } from './useApiFetch';

// ── Types ──────────────────────────────────────────────
export interface StoredDocument {
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
  updatedAt: string;
  linkedDocuments: LinkedDocRef[];
  convertedFrom?: { id: string | number; refNumber: string; documentType: string };
}

export interface LinkedDocRef {
  id: string | number;
  refNumber: string;
  documentType: string;
  relationship: 'parent' | 'child' | 'related';
}

// ── Global Reactive State ──────────────────────────────
const documents = ref<StoredDocument[]>([]);
const loading = ref(false);

export function useDocumentStore() {
  // ── Filters ──
  const typeFilter = ref<string>('all');
  const statusFilter = ref<string>('all');
  const searchQuery = ref('');

  // ── Filtered List ──
  const filteredDocuments = computed(() => {
    let docs = documents.value;
    if (typeFilter.value !== 'all') docs = docs.filter(d => d.documentType === typeFilter.value);
    if (statusFilter.value !== 'all') docs = docs.filter(d => d.status === statusFilter.value);
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase();
      docs = docs.filter(d => d.title.toLowerCase().includes(q) || d.refNumber.toLowerCase().includes(q) || d.clientName.toLowerCase().includes(q));
    }
    return docs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  });

  // ── Stats ──
  const stats = computed(() => {
    const all = documents.value;
    const totalDocs = all.length;
    const totalValue = all.reduce((s, d) => s + (d.total || 0), 0);
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const monthlyRevenue: Record<string, number> = {};

    all.forEach(d => {
      byType[d.documentType] = (byType[d.documentType] || 0) + 1;
      byStatus[d.status] = (byStatus[d.status] || 0) + 1;
      const month = d.createdAt?.substring(0, 7) || 'unknown';
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (d.total || 0);
    });

    const pendingCount = (byStatus.Draft || 0) + (byStatus.Sent || 0);
    const approvedCount = byStatus.Approved || 0;
    const pendingValue = all.filter(d => d.status === 'Draft' || d.status === 'Sent').reduce((s, d) => s + (d.total || 0), 0);

    return { totalDocs, totalValue, byType, byStatus, monthlyRevenue, pendingCount, approvedCount, pendingValue };
  });

  async function fetchDocuments() {
    loading.value = true;
    try {
      const { body, success } = await useApiFetch('documents/files?limit=200');
      if (success && body) {
        const data = body as unknown;
        const docs = data.docs || data || [];
        documents.value = docs.map(f => ({
          id: f.id,
          refNumber: f.name || '',
          title: f.originalName || f.name || '',
          documentType: (f.tags || [])[0] || 'document',
          clientName: f.uploader?.name || '',
          clientCompany: '',
          total: f.size || 0,
          currency: '',
          status: (f.tags || []).includes('archived') ? 'Archived' : 'Active',
          createdAt: f.createdAt,
          updatedAt: f.updatedAt || f.createdAt,
          linkedDocuments: [],
          convertedFrom: undefined
        }));
      }
    } finally {
      loading.value = false;
    }
  }

  // ── CRUD ──
  async function addDocument(doc: StoredDocument) {
    const existing = documents.value.findIndex(d => d.id === doc.id);
    if (existing >= 0) {
      documents.value[existing] = { ...doc, updatedAt: new Date().toISOString() };
      if (typeof doc.id === 'number') {
        await useApiFetch(`documents/files/${doc.id}`, 'PUT', {
          name: doc.refNumber,
          originalName: doc.title,
          tags: [doc.documentType, doc.status]
        });
      }
    } else {
      documents.value.push({ ...doc, updatedAt: new Date().toISOString() });
    }
  }

  async function removeDocument(id: string | number) {
    documents.value = documents.value.filter(d => d.id !== id);
    if (typeof id === 'number') {
      await useApiFetch(`documents/files/${id}`, 'DELETE');
    }
  }

  function getDocument(id: string | number): StoredDocument | undefined {
    return documents.value.find(d => d.id === id);
  }

  function getByType(type: string): StoredDocument[] {
    return documents.value.filter(d => d.documentType === type);
  }

  function getRecent(count: number = 10): StoredDocument[] {
    return [...documents.value].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, count);
  }

  // ── Linking ──
  function linkDocuments(sourceId: string | number, targetId: string | number, relationship: 'parent' | 'child' | 'related' = 'related') {
    const source = documents.value.find(d => d.id === sourceId);
    const target = documents.value.find(d => d.id === targetId);
    if (!source || !target) return false;

    if (!source.linkedDocuments.some(l => l.id === targetId)) {
      source.linkedDocuments.push({ id: target.id, refNumber: target.refNumber, documentType: target.documentType, relationship });
    }

    const reverseRel = relationship === 'parent' ? 'child' : relationship === 'child' ? 'parent' : 'related';
    if (!target.linkedDocuments.some(l => l.id === sourceId)) {
      target.linkedDocuments.push({ id: source.id, refNumber: source.refNumber, documentType: source.documentType, relationship: reverseRel });
    }

    return true;
  }

  function unlinkDocuments(sourceId: string | number, targetId: string | number) {
    const source = documents.value.find(d => d.id === sourceId);
    const target = documents.value.find(d => d.id === targetId);
    if (source) source.linkedDocuments = source.linkedDocuments.filter(l => l.id !== targetId);
    if (target) target.linkedDocuments = target.linkedDocuments.filter(l => l.id !== sourceId);
  }

  function getLinkedDocuments(id: string | number): LinkedDocRef[] {
    const doc = documents.value.find(d => d.id === id);
    return doc?.linkedDocuments || [];
  }

  return {
    documents,
    filteredDocuments,
    stats,
    typeFilter,
    statusFilter,
    searchQuery,
    addDocument,
    removeDocument,
    getDocument,
    getByType,
    getRecent,
    linkDocuments,
    unlinkDocuments,
    getLinkedDocuments,
    fetchDocuments,
    loading
  };
}
