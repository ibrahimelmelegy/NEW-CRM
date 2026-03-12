<template lang="pug">
  section
      //- Spotlight Search Component
      Spotlight

      //- Keyboard Shortcuts Cheat Sheet
      KeyboardShortcutsOverlay(
        :visible="cheatSheetVisible"
        :categories="shortcutCategories"
        @close="cheatSheetVisible = false"
      )

      
      #allTheNav
        .nav
          Menu
      #main(:class="[fullNav && !mobile  ? 'marginedStart' : (mobile ? 'notMargined' :'collapseMargin' )] ")
        nav.navbar(  :class="{'marginedStart': fullNav && !mobile,'collapseMargin': !mobile && !fullNav,'notMargined': mobile && !fullNav,'navbar-scroll': showNavbar}" class="!pt-4 z-20 ")
          .flex.items-center.justify-between(:class="{'!pl-[32px] !pr-[50px] ' : !mobile , '!px-[20px] '  : mobile}")
            .flex.items-center.gap-2
              .headings(class="block lg:hidden" )
                button.toggle-icon(@click="openNav" :class="{'margined' : !fullNav}"): Icon.text-sm(name="ph:list-bold")
              div(class="breadcrumb")
                el-breadcrumb(:separator-icon="ArrowRight")      
                  el-breadcrumb-item(to="/") {{ $t('navigation.dashboard') }}
                  el-breadcrumb-item(v-for="(route, index) in breadcrumbRoutes",  :key="index", @click="getPath(route)" , class="cursor-pointer",  :class="{ 'last': index === breadcrumbRoutes.length - 1 }"  ) {{ route }}
            .flex.gap-3.items-center
              .tools.flex.items-center(class="p-2 rounded-full gap-2.5" )
                ColorModeToggle
                el-dropdown(class="outline-0")
                      div.profile-trigger.flex.gap-3.items-center.outline-0.border-0.cursor-pointer(class="!text-[var(--text-primary)]")
                            Avatar(:src="user?.profilePicture", small, table)
                            p.mb-0 {{user?.name}}
                            Icon.text-xl(name="iconamoon:arrow-down-2")
                      template(#dropdown='')
                        el-dropdown-menu
                          .px-4.py-3
                            p.text-sm.font-semibold.mb-0 {{ user?.name }}
                            p.text-xs.opacity-60.mb-0 {{ user?.email }}
                          el-dropdown-item(divided, @click="router.push('/settings')")
                            .flex.items-center.gap-2
                              Icon(name="ph:gear-bold")
                              span {{ $t('navigation.settings') }}
                          el-dropdown-item(divided, @click="logout")
                            .flex.items-center.gap-2
                              Icon(name="ph:sign-out-bold")
                              span {{ $t('common.logout') }}
              .notification.premium-nav-btn(@click.stop="notificationCenter.toggle()")
                .flex.items-center.justify-center.w-full.h-full
                  Icon.text-xl(name="ph:bell-bold")
                  div.notification-badge(v-if="notificationCenter.unreadCount.value > 0")
          .mt-4
        .slot-content(class="!mt-[80px]")
            ErrorBoundary
              slot
      //- Notification Center Flyout
      NotificationsNotificationCenter(:visible="notificationCenter.visible.value" @close="notificationCenter.close()")
  </template>
<script setup lang="ts">
import { useWindowSize } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { ArrowRight, Search, Plus } from '@element-plus/icons-vue';
import { ElNotification } from 'element-plus';
import { useMain } from '~/stores/common';

// Initialize Spotlight (keyboard listener)
import { useSpotlight } from '~/composables/useSpotlight';
useSpotlight();

// Initialize Keyboard Shortcuts
const { cheatSheetVisible, categories: shortcutCategories } = useKeyboardShortcuts();

const mainData = useMain();
const { fullNav, mobile, hideNav } = storeToRefs(mainData);
const { width, height } = useWindowSize();
const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const showNavbar = ref(false);
const showDropdown = ref(false);
const searchInput = ref('');

// Notification Center
const notificationCenter = useNotificationCenter();
notificationCenter.fetchUnreadCount();
notificationCenter.initSocketListener();

function toggleDropdown(val: boolean) {
  showDropdown.value = val;
}
onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

const handleScroll = () => {
  showNavbar.value = window.scrollY > 10;
};

if (process.client) {
  window.addEventListener('click', () => {
    showDropdown.value = false;
  });
}

const mykey = ref('1');

function checkwidth() {
  if (width.value < 990) {
    mobile.value = true;
  } else {
    mobile.value = false;
  }
}
function openNav() {
  fullNav.value = !fullNav.value;
  if (mobile.value) {
    hideNav.value = !hideNav.value;
  }
}
async function logout() {
  const response = await useApiFetch('auth/logout', 'POST');
  user.value = null;
  ElNotification({
    title: response?.success ? t('common.success') : t('common.error'),
    type: response?.success ? 'success' : 'error',
    message: response?.message || t('common.logout')
  });
  router.push('/login');
}

checkwidth();

watch(width, () => {
  checkwidth();
});

const user = ref<any>({});

if (!user.value?.id) {
  const response = await useApiFetch('auth/me');
  user.value = (response as Record<string, unknown>).user;
}

const breadcrumbRoutes = computed(() => {
  const pathSegments = route.path.split('/').filter(Boolean);

  // Regular expression for a UUID-like ID format
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  // Check if the last item is a valid ID (UUID or numeric)
  if (pathSegments.length > 0) {
    const lastSegment = pathSegments[pathSegments.length - 1] || '';

    // Check for UUID or numeric formats
    if (uuidRegex.test(lastSegment) || !isNaN(Number(lastSegment))) {
      pathSegments.pop(); // Remove the last item
    }
  }

  // Replace hyphens and underscores with spaces in each path segment
  const formattedSegments = pathSegments.map((segment: unknown) => segment.replace(/[-_]/g, ' '));
  return formattedSegments;
});

const getPath = (routeName: string) => {
  const pathSegments = route.path.split('/').filter(Boolean);
  let pathGo = '';
  const indexStop = pathSegments.findIndex(route => route === routeName);
  pathSegments.forEach((el, indes) => {
    if (indes <= indexStop) pathGo = pathGo + '/' + el;
  });
  if (pathGo !== '/sales' && pathGo !== '/operations') router.push(pathGo);
};
</script>

<style lang="scss" scoped>
.website-body {
  .slot-content {
    background: transparent !important;
    padding: 0 !important;
    // margin-top: 4rem !important; Removed to avoid conflict with template style
  }
}
#main {
  min-height: 100vh;
  background-color: white;
  transition: all 0.2s ease-in;
}
.toggleMenu {
  position: fixed;
  z-index: 3;

  bottom: 38px;
  inset-inline-start: 260px;
  transition: all 0.2s ease-in;
  &.margined {
    inset-inline-start: 0px;
  }
}
#allTheNav {
  position: relative;
  inset-inline-start: 0;
  .nav {
    top: 0;
    z-index: 100;
    inset-inline-start: 0;
    position: fixed;
    padding-bottom: 3rem;
  }
}
.navbar {
  position: fixed;
  width: 100%;
  height: 80px;
  transition: all 0.2s ease-in;
  top: 0;
  inset-inline-start: 0;
  border-bottom: 1px solid #e7e6e9 !important;
}

.top {
  .logo {
    position: absolute;
    height: 70px;
    padding: 2rem;
    z-index: 1000;
    border-radius: 0px 0 50px 0px;
    inset-inline-start: 0;
    // width: calc(100% + 5px);
    top: 0;
    width: 100%;
  }
}
.myicon {
  color: white;
  background-color: $primary;
  padding: 0.5rem;
  border-radius: 50%;
}
.marginedStart {
  margin-inline-start: 260px;
  width: calc(100% - 260px);
}
.collapseMargin {
  margin-inline-start: 80px;
  width: calc(100% - 80px) !important;
}
.notMargined {
  margin-inline-start: 0px;
  width: 100% !important;
}
.background-overlay {
  &::before {
    content: '';
    background-color: rgba(0, 0, 0, 0.411);
    position: absolute;
    width: 100%;
    height: 100%;
  }
}
.breadcrumb {
  display: none;
  @media screen and (min-width: 991px) {
    display: block;
  }
}
</style>
