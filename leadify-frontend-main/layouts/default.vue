<template lang="pug">
section.layout-container
  //- Global Background Components
  ProfessionalBackground
  Spotlight

  //- Sidebar Area
  aside#allTheNav(:class="{ 'collapsed': !fullNav, 'mobile': mobile, 'hidden-mobile': mobile && hideNav }")
    .nav-wrapper
      Menu

  //- Main Content Area
  main#main(:class="{ 'expanded': !fullNav }")
    nav.navbar(:class="{'navbar-scroll': showNavbar, 'mobile-nav': mobile}" :style="{ left: mobile ? '0' : (fullNav ? '260px' : '80px'), right: '0', width: 'auto' }")
      .navbar-content
        .flex.items-center.gap-2
          .headings(class="block lg:hidden")
            button.toggle-icon(@click="openNav")
              Icon.text-sm(name="ph:list-bold")
          
          .breadcrumb
            el-breadcrumb(:separator-icon="ArrowRight")      
              el-breadcrumb-item(to="/") 
                span.breadcrumb-home(class="!text-[var(--text-primary)] opacity-80") {{ $t('navigation.dashboard') }}
              el-breadcrumb-item(v-for="(route, index) in breadcrumbRoutes" :key="index" @click="getPath(route)" :class="{ 'last': index === breadcrumbRoutes.length - 1 }") 
                span.breadcrumb-text {{ route.label }}

        .navbar-actions
          .tools
            button.premium-nav-btn.spotlight-btn(@click="open" :title="$t('common.searchAltK')")
              Icon(name="ph:command-bold")
            
            ColorModeToggle
            LanguageToggle
            
            .notification.premium-nav-btn
              NuxtLink.flex.items-center.justify-center.w-full.h-full(:to="`/notification`")
                Icon.text-xl(name="ph:bell-bold")
                div.notification-badge(v-if="notificationCount > 0")
            
            el-dropdown(trigger="click" class="outline-0")
              div.profile-trigger
                Avatar(:src="user?.profilePicture" small)
                p.mb-0.hidden-sm-and-down {{ user?.name || 'User' }}
                Icon.text-xl(name="iconamoon:arrow-down-2")
              template(#dropdown)
                el-dropdown-menu
                  el-dropdown-item(@click="logout")
                    span.text-xs {{ $t('common.logout') }}

    .slot-content(:class="{'!px-[20px]': mobile}")
      slot
  
  AIChatbot
</template>

<script setup lang="ts">
import { useWindowSize, useEventListener } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { ArrowRight } from '@element-plus/icons-vue';
import { ElNotification } from 'element-plus';
import { useMain } from '~/stores/common';

// Interfaces for Type Safety
interface UserData {
  id: string | number;
  name: string;
  profilePicture?: string;
}

interface NavRoute {
  path: string;
  label: string;
}

// 1. Setup & Stores
const mainData = useMain();
const { fullNav, mobile, hideNav } = storeToRefs(mainData);
const { width } = useWindowSize();
const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const { open } = useSpotlight();

// 2. State
const showNavbar = ref(false);
const user = ref<UserData | null>(null);
const notificationCount = ref(0);

// 3. Methods & Listeners
const handleScroll = () => {
  showNavbar.value = window.scrollY > 10;
};

useEventListener(window, 'scroll', handleScroll);

watchEffect(() => {
  mobile.value = width.value < 990;
});

function openNav() {
  if (mobile.value) {
    hideNav.value = !hideNav.value;
  } else {
    fullNav.value = !fullNav.value;
  }
}

async function logout() {
  try {
    const response: any = await useApiFetch('auth/logout', 'POST');
    if (response?.success) {
      const accessToken = useCookie('access_token');
      accessToken.value = null; 
      router.push('/login');
      ElNotification({ 
        title: t('common.success'), 
        type: 'success', 
        message: response.message 
      });
    }
  } catch (error) {
    console.error("Logout Error:", error);
  }
}

// 4. Corrected Data Fetching
onMounted(async () => {
  try {
    const currentUser = user.value;
    
    if (!currentUser || !currentUser.id) {
      const meResponse: any = await useApiFetch('auth/me');
      if (meResponse?.body) {
        user.value = meResponse.body;
      }
    }
  } catch (err) {
    console.error("User Fetch Error:", err);
  }

  try {
    const notifRes: any = await useTableFilter('notification');
    notificationCount.value = notifRes?.unreadNotificationsCount || 0;
  } catch (err) {
    console.error("Notification Fetch Error:", err);
  }
});

// 5. Computed Breadcrumbs
const breadcrumbRoutes = computed<NavRoute[]>(() => {
  const pathSegments = route.path.split('/').filter(Boolean);
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  return pathSegments
    .filter(segment => !uuidRegex.test(segment) && isNaN(Number(segment)))
    .map(segment => {
      const camelSegment = segment.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());
      const navKey = `navigation.${camelSegment}`;
      return {
        path: segment,
        label: t(navKey) !== navKey ? t(navKey) : segment.replace(/[-_]/g, ' ')
      };
    });
});

const getPath = (routeSegment: NavRoute) => {
  const pathSegments = route.path.split('/').filter(Boolean);
  const indexStop = pathSegments.findIndex(s => s === routeSegment.path);
  const targetPath = '/' + pathSegments.slice(0, indexStop + 1).join('/');
  
  if (!['/sales', '/operations'].includes(targetPath)) {
    router.push(targetPath);
  }
};
</script>

<style lang="scss" scoped>
.layout-container {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  overflow-x: hidden;
  background-color: var(--color-neutral-background-1);
}

#allTheNav {
  flex-shrink: 0;
  width: 260px;
  transition: width 0.3s ease, transform 0.3s ease;
  z-index: 1000;
  position: relative;
  background: var(--color-neutral-background-3); // Match acrylic-material light mode background
  border-right: 1px solid var(--color-border-subtle); 

  &.collapsed { width: 80px; }

  &.mobile {
    position: fixed;
    height: 100vh;
    left: 0;
    top: 0;
    &.hidden-mobile { transform: translateX(-100%); }
  }

  .nav-wrapper {
    height: 100vh;
    position: sticky;
    top: 0;
    overflow-y: auto;
    &::-webkit-scrollbar { width: 0; }
  }
}

// Global overrides to fix visual artifacts from external tools
:global(#preact-border-shadow-host),
:global(.aurora-blur) {
  display: none !important;
}

#main {
  flex-grow: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: all 0.3s ease;
}
</style>