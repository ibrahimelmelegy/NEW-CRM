import { ElNotification } from 'element-plus';

export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  message: string;
}

export async function setup2FA(): Promise<TwoFactorSetupResponse | null> {
  try {
    const { body, success, message } = await useApiFetch('auth/2fa/setup', 'POST');
    if (success && body) return body as TwoFactorSetupResponse;
    ElNotification({ type: 'error', title: 'Error', message: message || 'Failed to setup 2FA' });
    return null;
  } catch (error) {
    ElNotification({ type: 'error', title: 'Error', message: 'Failed to setup 2FA' });
    return null;
  }
}

export async function verify2FA(code: string): Promise<boolean> {
  try {
    const { success, message } = await useApiFetch('auth/2fa/verify', 'POST', { code });
    if (success) {
      ElNotification({ type: 'success', title: 'Success', message: '2FA enabled successfully' });
      return true;
    }
    ElNotification({ type: 'error', title: 'Error', message: message || 'Invalid verification code' });
    return false;
  } catch (error) {
    ElNotification({ type: 'error', title: 'Error', message: 'Failed to verify 2FA code' });
    return false;
  }
}

export async function disable2FA(code: string): Promise<boolean> {
  try {
    const { success, message } = await useApiFetch('auth/2fa/disable', 'POST', { code });
    if (success) {
      ElNotification({ type: 'success', title: 'Success', message: '2FA disabled successfully' });
      return true;
    }
    ElNotification({ type: 'error', title: 'Error', message: message || 'Invalid verification code' });
    return false;
  } catch (error) {
    ElNotification({ type: 'error', title: 'Error', message: 'Failed to disable 2FA' });
    return false;
  }
}
