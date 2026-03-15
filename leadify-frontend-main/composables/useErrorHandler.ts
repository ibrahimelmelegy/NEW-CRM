import { ElNotification } from 'element-plus';
import logger from '~/utils/logger';

interface ErrorHandlerResult {
  error: true;
  message: string;
}

export function useErrorHandler() {
  const t = useNuxtApp().$i18n.t;

  function handleApiError(error: unknown, context: string): ErrorHandlerResult {
    const message = error instanceof Error ? error.message : t('common.generic');
    logger.error(`[${context}]`, error);
    ElNotification({
      title: t('common.error'),
      message,
      type: 'error'
    });
    return { error: true, message };
  }

  function handleWarning(message: string, context: string) {
    logger.warn(`[${context}]`, message);
    ElNotification({
      title: t('common.warning'),
      message,
      type: 'warning'
    });
  }

  function handleSuccess(message: string) {
    ElNotification({
      title: t('common.success'),
      message,
      type: 'success'
    });
  }

  return { handleApiError, handleWarning, handleSuccess };
}
