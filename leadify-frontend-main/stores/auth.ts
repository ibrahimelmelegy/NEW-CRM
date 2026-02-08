import { defineStore, skipHydrate } from 'pinia';
import { useLocalStorage } from '@vueuse/core';
import { ElNotification } from 'element-plus';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: useLocalStorage('access_token', ''),
    loadingChangePassword: false, // ✅ FIX: Fixed typo
    permissions: [] as string[],
    lang: 'en'
  }),

  hydrate(state) {
    // Re-initialize localStorage refs on client hydration
    state.token = useLocalStorage('access_token', '').value;
  },

  actions: {
    setLocale(lang: string) {
      this.lang = lang;
      // Note: useGqlHeaders should be imported if used
      // useGqlHeaders({ lang: `eg-${this.lang}` });
    },

    setData(token: string) {
      useLocalStorage('access_token', token);
      this.token = token;
    },

    async changePassword(input: { oldPassword: string; password: string; confirmPassword: string }) {
      this.loadingChangePassword = true; // ✅ FIX: Using 'this' instead of calling store again

      try {
        // ✅ FIX: Using REST API instead of non-existent GraphQL
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
      this.token = '';
      useLocalStorage('access_token', '');
      navigateTo('/login');
    }
  }
});
