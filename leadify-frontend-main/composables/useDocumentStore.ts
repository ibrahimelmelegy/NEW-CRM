/**
 * Universal Document Store
 * Central localStorage-backed store for all saved documents across types.
 * Supports CRUD, filtering, linking, and statistics.
 */

import { ref, computed } from 'vue';

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

// ── Persistence ────────────────────────────────────────
const STORAGE_KEY = 'crm_document_store';

function load(): StoredDocument[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(docs: StoredDocument[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

// ── Global Reactive State ──────────────────────────────
const documents = ref<StoredDocument[]>(load());

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

  // ── CRUD ──
  function addDocument(doc: StoredDocument) {
    const existing = documents.value.findIndex(d => d.id === doc.id);
    if (existing >= 0) {
      documents.value[existing] = { ...doc, updatedAt: new Date().toISOString() };
    } else {
      documents.value.push({ ...doc, updatedAt: new Date().toISOString() });
    }
    save(documents.value);
  }

  function removeDocument(id: string | number) {
    documents.value = documents.value.filter(d => d.id !== id);
    save(documents.value);
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

    // Add link to source
    if (!source.linkedDocuments.some(l => l.id === targetId)) {
      source.linkedDocuments.push({ id: target.id, refNumber: target.refNumber, documentType: target.documentType, relationship });
    }

    // Add reverse link to target
    const reverseRel = relationship === 'parent' ? 'child' : relationship === 'child' ? 'parent' : 'related';
    if (!target.linkedDocuments.some(l => l.id === sourceId)) {
      target.linkedDocuments.push({ id: source.id, refNumber: source.refNumber, documentType: source.documentType, relationship: reverseRel });
    }

    save(documents.value);
    return true;
  }

  function unlinkDocuments(sourceId: string | number, targetId: string | number) {
    const source = documents.value.find(d => d.id === sourceId);
    const target = documents.value.find(d => d.id === targetId);
    if (source) source.linkedDocuments = source.linkedDocuments.filter(l => l.id !== targetId);
    if (target) target.linkedDocuments = target.linkedDocuments.filter(l => l.id !== sourceId);
    save(documents.value);
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
    getLinkedDocuments
  };
}
