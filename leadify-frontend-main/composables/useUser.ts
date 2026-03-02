export interface CurrentUser {
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  profilePicture?: string;
  twoFactorEnabled?: boolean;
  roleId?: string;
  role?: { id: string; name: string; permissions: string[] };
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const user = ref<CurrentUser>({});

export async function useUser() {
  const response = await useApiFetch('auth/me');
  const body = response?.body as CurrentUser | null;
  user.value = body?.id ? body : {};
  return user.value;
}
