import { ref } from 'vue';

const csrfToken = ref<string>('');

async function refreshCsrfToken(): Promise<void> {
  try {
    const config = useRuntimeConfig();
    const response = await $fetch<{ csrfToken: string }>(config.public.API_BASE_URL + 'csrf-token', { credentials: 'include' });
    csrfToken.value = response.csrfToken;
  } catch (error) {
    console.warn('Failed to fetch CSRF token:', error);
  }
}

export { csrfToken, refreshCsrfToken };
