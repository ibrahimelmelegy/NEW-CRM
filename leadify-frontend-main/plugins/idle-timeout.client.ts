import { defineNuxtPlugin } from '#app';
import { useIdle } from '@vueuse/core';
import { watch } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { ElNotification } from 'element-plus';

export default defineNuxtPlugin((nuxtApp) => {
    // 30 minutes total timeout
    const IDLE_TIMEOUT = 30 * 60 * 1000;
    // Warning at 25 minutes
    const WARNING_TIME = 25 * 60 * 1000;

    // VueUse's useIdle checks global window events (mousemove, keydown, etc.)
    const { idle: isWarningIdle } = useIdle(WARNING_TIME);
    const { idle: isFullyIdle } = useIdle(IDLE_TIMEOUT);

    let warningShown = false;

    nuxtApp.hook('app:mounted', () => {
        watch(isWarningIdle, (isIdleValue) => {
            const authStore = useAuthStore();
            if (isIdleValue && authStore.token) {
                if (!warningShown) {
                    warningShown = true;
                    ElNotification({
                        title: 'Session Timeout Warning',
                        message: 'Your session will expire in 5 minutes due to inactivity.',
                        type: 'warning',
                        duration: 10000
                    });
                }
            } else {
                warningShown = false;
            }
        });

        watch(isFullyIdle, (isIdleValue) => {
            const authStore = useAuthStore();
            if (isIdleValue && authStore.token) {
                ElNotification({
                    title: 'Session Expired',
                    message: 'You have been logged out due to inactivity.',
                    type: 'info',
                    duration: 5000
                });
                authStore.logout();
            }
        });
    });
});
