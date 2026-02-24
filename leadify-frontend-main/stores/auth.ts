import { defineStore } from 'pinia';
import { ElNotification } from 'element-plus';
import { user } from '~/composables/useUser';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    loadingChangePassword: false,
    permissions: [] as string[],
    lang: 'en'
  }),

  getters: {
    /** Read token from cookie (consistent with middleware & useApiFetch) */
    token(): string {
      if (import.meta.server) return '';
      const cookie = useCookie('access_token', {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax' as const
      });
      return cookie.value || '';
    }
  },

  actions: {
    setLocale(lang: string) {
      this.lang = lang;
    },

    setData(token: string) {
      const cookie = useCookie('access_token', {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax' as const
      });
      cookie.value = token;
    },

    async changePassword(input: { oldPassword: string; password: string; confirmPassword: string }) {
      this.loadingChangePassword = true;

      try {
        const response = await useApiFetch('auth/change-password', 'POST', {
          oldPassword: input.oldPassword,
          newPassword: input.password,
          confirmPassword: input.confirmPassword
        });

        this.loadingChangePassword = false;

        if (response.success && response.body?.token) {
          this.setData(response.body.token);
        }

        if (response.success) {
          ElNotification({
            type: 'success',
            title: 'Success',
            message: 'Password has been changed successfully'
          });
        } else {
          ElNotification({
            title: 'Error',
            type: 'error',
            message: response.message || 'Failed to change password'
          });
        }

        return {
          success: response.success || false,
          message: response.message || ''
        };
      } catch (error: any) {
        this.loadingChangePassword = false;
        ElNotification({
          title: 'Error',
          type: 'error',
          message: error.message || 'An error occurred'
        });
        return { success: false, message: error.message };
      }
    },

    async logout() {
      // Clear the cookie (the source of truth)
      const cookie = useCookie('access_token', {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax' as const
      });
      cookie.value = null;

      // Clear cached user data
      user.value = null;

      // Also clear any legacy localStorage entry
      if (import.meta.client) {
        localStorage.removeItem('access_token');
      }

      navigateTo('/login');
    }
  }
});
