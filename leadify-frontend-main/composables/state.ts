/**
 * @deprecated Token is now managed via HttpOnly cookies. This composable is kept for backward compatibility
 * but no longer reads from localStorage. Auth state should be obtained via /auth/me endpoint.
 */
export const usetoken = () => useState<string | null>('tokenlocal', () => null);
