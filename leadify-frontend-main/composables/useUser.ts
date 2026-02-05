export const user = ref<any>({});

export async function useUser() {
  const response = await useApiFetch("auth/me");
  user.value = response?.body?.id ? response.body : {};
  return user.value;
}
