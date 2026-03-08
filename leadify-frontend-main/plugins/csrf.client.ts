/**
 * CSRF Token Plugin
 *
 * Fetches a CSRF token from the backend on app initialization (client-side only).
 * The token is stored in a reactive ref and used by useApiFetch for
 * state-changing requests (POST/PUT/PATCH/DELETE).
 *
 * The backend uses the Double Submit Cookie pattern (csrf-csrf library):
 * - GET /api/csrf-token sets a __csrf httpOnly cookie and returns { csrfToken }
 * - State-changing requests must include the token in X-CSRF-Token header
 */

import { csrfToken, refreshCsrfToken } from '../composables/useCsrf';

export default defineNuxtPlugin(async () => {
  // Fetch the initial CSRF token
  await refreshCsrfToken();
});
