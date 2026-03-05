/* eslint-disable no-use-before-define */
import { ref } from 'vue';
import { useApiFetch } from './useApiFetch';

export interface DocBuilderDocument {
  id: string;
  type: string;
  reference: string;
  title: string;
  status: string;
  content?: string;
  pdfUrl?: string;
  version: number;
  clientName?: string;
  clientCompany?: string;
  clientEmail?: string;
  subtotal?: number;
  discount?: number;
  tax?: number;
  total?: number;
  currency: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  parentDocumentId?: string;
  parentDocument?: { id: string; type: string; reference: string; title: string };
  childDocuments?: { id: string; type: string; reference: string; title: string; status: string }[];
  createdBy: number;
  creator?: { id: number; name: string };
  sentAt?: string;
  validUntil?: string;
  notes?: string;
  tags?: string[];
  rejectionReason?: string;
  versions?: DocBuilderVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface DocBuilderVersion {
  id: string;
  documentId: string;
  version: number;
  content?: string;
  pdfUrl?: string;
  changedBy: number;
  editor?: { id: number; name: string };
  changeNote?: string;
  createdAt: string;
}

export interface DocBuilderStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  totalValue: number;
  valueByType: Record<string, number>;
}

export interface DocPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface DocFilters {
  type?: string;
  status?: string | string[];
  searchKey?: string;
  fromDate?: string;
  toDate?: string;
  clientName?: string;
  sortBy?: string;
  sort?: string;
}

export function useDocBuilder() {
  const documents = ref<DocBuilderDocument[]>([]);
  const currentDocument = ref<DocBuilderDocument | null>(null);
  const loading = ref(false);
  const saving = ref(false);
  const pagination = ref<DocPagination>({ page: 1, limit: 20, totalItems: 0, totalPages: 0 });
  const stats = ref<DocBuilderStats | null>(null);

  // CRUD
  async function fetchDocuments(params?: DocFilters & { page?: number; limit?: number }) {
    loading.value = true;
    try {
      const queryParts: string[] = [];
      if (params) {
        const p = { ...params, page: params.page || pagination.value.page, limit: params.limit || pagination.value.limit };
        Object.entries(p).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            if (Array.isArray(val)) {
              val.forEach(v => queryParts.push(`${key}=${encodeURIComponent(v)}`));
            } else {
              queryParts.push(`${key}=${encodeURIComponent(String(val))}`);
            }
          }
        });
      }
      const url = `doc-builder/?${queryParts.join('&')}`;
      const response = await useApiFetch(url);
      if (response?.success && response.body) {
        const rb = response.body as unknown;
        documents.value = rb.docs || [];
        pagination.value = rb.pagination || pagination.value;
      }
      return response;
    } finally {
      loading.value = false;
    }
  }

  async function getDocument(id: string) {
    loading.value = true;
    try {
      const response = await useApiFetch(`doc-builder/${id}`);
      if (response?.success && response.body) {
        currentDocument.value = response.body as unknown;
      }
      return response;
    } finally {
      loading.value = false;
    }
  }

  async function createDocument(data: Partial<DocBuilderDocument>) {
    saving.value = true;
    try {
      const response = await useApiFetch('doc-builder/', 'POST', data as Record<string, unknown>);
      if (response?.success && response.body) {
        currentDocument.value = response.body as unknown;
      }
      return response;
    } finally {
      saving.value = false;
    }
  }

  async function updateDocument(id: string, data: Partial<DocBuilderDocument> & { changeNote?: string }) {
    saving.value = true;
    try {
      const response = await useApiFetch(`doc-builder/${id}`, 'PUT', data as Record<string, unknown>);
      if (response?.success && response.body) {
        currentDocument.value = response.body as unknown;
      }
      return response;
    } finally {
      saving.value = false;
    }
  }

  async function deleteDocument(id: string) {
    const response = await useApiFetch(`doc-builder/${id}`, 'DELETE');
    return response;
  }

  // Workflow
  async function changeStatus(id: string, status: string, reason?: string) {
    const response = await useApiFetch(`doc-builder/${id}/status`, 'PUT', { status, reason });
    if (response?.success && response.body) {
      currentDocument.value = response.body as unknown;
      const idx = documents.value.findIndex(d => d.id === id);
      if (idx >= 0 && documents.value[idx]) documents.value[idx].status = status;
    }
    return response;
  }

  async function convertDocument(id: string, targetType: string) {
    const response = await useApiFetch(`doc-builder/${id}/convert`, 'POST', { targetType });
    return response;
  }

  // Versions
  async function getVersions(id: string) {
    const response = await useApiFetch(`doc-builder/${id}/versions`);
    return response;
  }

  async function getVersionById(id: string, versionId: string) {
    const response = await useApiFetch(`doc-builder/${id}/versions/${versionId}`);
    return response;
  }

  async function restoreVersion(id: string, versionId: string) {
    const response = await useApiFetch(`doc-builder/${id}/versions/${versionId}/restore`, 'POST');
    if (response?.success && response.body) {
      currentDocument.value = response.body as unknown;
    }
    return response;
  }

  // PDF
  async function generatePdf(id: string) {
    const response = await useApiFetch(`doc-builder/${id}/pdf`, 'POST');
    return response;
  }

  // Send
  async function sendDocument(id: string, data: { to: string; subject: string; message?: string }) {
    const response = await useApiFetch(`doc-builder/${id}/send`, 'POST', data as Record<string, unknown>);
    if (response?.success && response.body) {
      currentDocument.value = response.body as unknown;
    }
    return response;
  }

  // Stats
  async function getStats(type?: string) {
    const url = type ? `doc-builder/stats?type=${encodeURIComponent(type)}` : 'doc-builder/stats';
    const response = await useApiFetch(url);
    if (response?.success && response.body) {
      stats.value = response.body as unknown;
    }
    return response;
  }

  return {
    documents,
    currentDocument,
    loading,
    saving,
    pagination,
    stats,
    fetchDocuments,
    getDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    changeStatus,
    convertDocument,
    getVersions,
    getVersionById,
    restoreVersion,
    generatePdf,
    sendDocument,
    getStats
  };
}
