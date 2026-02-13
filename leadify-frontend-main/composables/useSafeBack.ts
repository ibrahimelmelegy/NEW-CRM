/**
 * Safe back navigation that falls back to a given route
 * when there's no browser history (e.g. direct navigation).
 */
export function useSafeBack(fallbackPath?: string) {
  const router = useRouter();

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackPath || '/');
    }
  };

  return { goBack };
}
