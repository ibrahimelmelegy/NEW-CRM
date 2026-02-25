/**
 * E-Signature System
 * Digital signing for documents with canvas-based signature capture.
 */
import { ref, computed } from 'vue';

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

const STORAGE_KEY = 'crm_signatures';
function load(): SignatureRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}
function save(items: SignatureRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const signatures = ref<SignatureRecord[]>(load());

export function useSignature() {
  const sorted = computed(() => [...signatures.value].sort((a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime()));
  const stats = computed(() => ({
    total: signatures.value.length,
    signed: signatures.value.filter(s => s.status === 'signed').length,
    pending: signatures.value.filter(s => s.status === 'pending').length,
    declined: signatures.value.filter(s => s.status === 'declined').length
  }));

  function requestSignature(data: Omit<SignatureRecord, 'id' | 'signedAt' | 'status'>): SignatureRecord {
    const record: SignatureRecord = { ...data, id: `sig_${Date.now()}`, signedAt: new Date().toISOString(), status: 'pending' };
    signatures.value.unshift(record);
    save(signatures.value);
    return record;
  }

  function signDocument(id: string, signatureData: string) {
    const rec = signatures.value.find(s => s.id === id);
    if (rec) {
      rec.status = 'signed';
      rec.signatureData = signatureData;
      rec.signedAt = new Date().toISOString();
      save(signatures.value);
    }
  }

  function declineSignature(id: string) {
    const rec = signatures.value.find(s => s.id === id);
    if (rec) {
      rec.status = 'declined';
      save(signatures.value);
    }
  }

  function removeSignature(id: string) {
    signatures.value = signatures.value.filter(s => s.id !== id);
    save(signatures.value);
  }

  return { signatures: sorted, stats, requestSignature, signDocument, declineSignature, removeSignature };
}
