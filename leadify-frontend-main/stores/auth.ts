import { defineStore } from 'pinia';
import { ElNotification } from 'element-plus';
import { user } from '~/composables/useUser';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    loadingChangePassword: false,
    permissions: [] as string[],
    lang: 'en'
  }),

  actions: {
    setLocale(lang: string) {
      this.lang = lang;
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
      await useApiFetch('auth/logout', 'POST', {}, true);

      // Clear cached user data
      user.value = null;

      // HttpOnly auth cookie is cleared by the server on logout

      navigateTo('/login');
    }
  }
});
