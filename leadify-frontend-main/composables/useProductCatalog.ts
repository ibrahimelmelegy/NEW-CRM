import { useApiFetch } from './useApiFetch';

export interface CatalogProduct {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  unitPrice: number;
  currency: string;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuoteLine {
  id: string;
  quoteId: string;
  productId: string;
  product?: CatalogProduct;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  createdAt?: string;
}

export async function fetchProducts(query?: Record<string, string>): Promise<{ docs: CatalogProduct[]; pagination: any }> {
  const qs = query ? '?' + new URLSearchParams(query).toString() : '';
  const { body, success } = await useApiFetch(`catalog/products${qs}`);
  if (success && body) {
    return body as { docs: CatalogProduct[]; pagination: any };
  }
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

export async function createProduct(data: Partial<CatalogProduct>) {
  return useApiFetch('catalog/products', 'POST', data as Record<string, any>);
}

export async function updateProduct(id: string, data: Partial<CatalogProduct>) {
  return useApiFetch(`catalog/products/${id}`, 'PUT', data as Record<string, any>);
}

export async function deleteProduct(id: string) {
  return useApiFetch(`catalog/products/${id}`, 'DELETE');
}

export async function fetchQuoteLines(quoteId: string): Promise<QuoteLine[]> {
  const { body, success } = await useApiFetch(`catalog/quotes/${quoteId}/lines`);
  if (success && body) {
    const data = body as any;
    return data.docs || data || [];
  }
  return [];
}

export async function addQuoteLine(data: Partial<QuoteLine>) {
  return useApiFetch('catalog/quotes/lines', 'POST', data as Record<string, any>);
}

export async function updateQuoteLine(id: string, data: Partial<QuoteLine>) {
  return useApiFetch(`catalog/quotes/lines/${id}`, 'PUT', data as Record<string, any>);
}

export async function removeQuoteLine(id: string) {
  return useApiFetch(`catalog/quotes/lines/${id}`, 'DELETE');
}
