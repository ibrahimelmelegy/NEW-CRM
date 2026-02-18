export interface KBArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  viewCount: number;
  helpfulCount: number;
  sortOrder: number;
  authorId?: string;
  author?: { id: string; name: string; profilePicture?: string };
  createdAt: string;
  updatedAt: string;
}

export async function fetchKBArticles(params?: Record<string, any>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const { body, success } = await useApiFetch(`knowledge-base${query}`);
  if (success && body) return body as { docs: KBArticle[]; pagination: any };
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

export async function fetchPublicArticles(params?: Record<string, any>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const { body, success } = await useApiFetch(`knowledge-base/public${query}`);
  if (success && body) return body as { docs: KBArticle[]; pagination: any };
  return { docs: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } };
}

export async function fetchKBArticle(id: string) {
  const { body, success } = await useApiFetch(`knowledge-base/${id}`);
  return success ? (body as KBArticle) : null;
}

export async function fetchArticleBySlug(slug: string) {
  const { body, success } = await useApiFetch(`knowledge-base/public/${slug}`);
  return success ? (body as KBArticle) : null;
}

export async function createKBArticle(data: Partial<KBArticle>) {
  return useApiFetch('knowledge-base', 'POST', data);
}

export async function updateKBArticle(id: string, data: Partial<KBArticle>) {
  return useApiFetch(`knowledge-base/${id}`, 'PUT', data);
}

export async function deleteKBArticle(id: string) {
  return useApiFetch(`knowledge-base/${id}`, 'DELETE');
}

export async function markArticleHelpful(id: string) {
  return useApiFetch(`knowledge-base/public/${id}/helpful`, 'POST');
}

export async function fetchKBCategories() {
  const { body, success } = await useApiFetch('knowledge-base/public/categories');
  return success && body ? (body as string[]) : [];
}
