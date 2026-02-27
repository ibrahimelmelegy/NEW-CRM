/**
 * E-Signature System — API-backed via Portal Signatures
 * Digital signing for documents with canvas-based signature capture.
 */
import { ref, computed } from 'vue';
import { useApiFetch } from './useApiFetch';

export interface SignatureRecord {
  id: string;
  documentRef: string;
  documentType: string;
  signerName: string;
  signerEmail: string;
  signatureData: string; // base64 image
  ipAddress?: string;
  signedAt: string;
  status: 'pending' | 'signed' | 'declined' | 'expired';
}

const signatures = ref<SignatureRecord[]>([]);
const loading = ref(false);

export function useSignature() {
  const sorted = computed(() => [...signatures.value].sort((a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime()));
  const stats = computed(() => ({
    total: signatures.value.length,
    signed: signatures.value.filter(s => s.status === 'signed').length,
    pending: signatures.value.filter(s => s.status === 'pending').length,
    declined: signatures.value.filter(s => s.status === 'declined').length
  }));

  async function fetchSignatures(documentId?: string) {
    loading.value = true;
    try {
      const url = documentId ? `portal/signatures/${documentId}` : 'portal/signatures/all';
      const { body, success } = await useApiFetch(url);
      if (success && body) {
        const docs = Array.isArray(body) ? body : (body as any).docs || [];
        signatures.value = docs.map((s: any) => ({
          id: s.id,
          documentRef: s.documentId || '',
          documentType: s.signatureType || 'DRAWN',
          signerName: s.typedName || s.clientId || '',
          signerEmail: '',
          signatureData: s.signatureData || '',
          ipAddress: s.ipAddress,
          signedAt: s.signedAt || s.createdAt,
          status: 'signed' as const
        }));
      }
    } finally {
      loading.value = false;
    }
  }

  async function requestSignature(data: Omit<SignatureRecord, 'id' | 'signedAt' | 'status'>): Promise<SignatureRecord> {
    const record: SignatureRecord = {
      ...data,
      id: `sig_${Date.now()}`,
      signedAt: new Date().toISOString(),
      status: 'pending'
    };
    signatures.value.unshift(record);
    return record;
  }

  async function signDocument(id: string, signatureData: string) {
    const rec = signatures.value.find(s => s.id === id);
    if (rec) {
      rec.status = 'signed';
      rec.signatureData = signatureData;
      rec.signedAt = new Date().toISOString();
      // Call portal sign API
      await useApiFetch(`portal/contracts/${rec.documentRef}/sign`, 'POST', {
        signatureData,
        signatureType: 'DRAWN'
      });
    }
  }

  function declineSignature(id: string) {
    const rec = signatures.value.find(s => s.id === id);
    if (rec) {
      rec.status = 'declined';
    }
  }

  async function removeSignature(id: string) {
    signatures.value = signatures.value.filter(s => s.id !== id);
  }

  return { signatures: sorted, stats, requestSignature, signDocument, declineSignature, removeSignature, fetchSignatures, loading };
}
