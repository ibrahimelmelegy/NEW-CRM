<template lang="pug">
  section
      <!-- Global Professional Background -->
      ProfessionalBackground
      
      //- Spotlight Search Component
      Spotlight

      
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
                  el-breadcrumb-item(to="/") 
                    span.breadcrumb-home(class="!text-[var(--text-primary)] opacity-80") {{ $t('navigation.dashboard') }}
                  el-breadcrumb-item(v-for="(route, index) in breadcrumbRoutes",  :key="index", @click="getPath(route)" , class="cursor-pointer",  :class="{ 'last': index === breadcrumbRoutes.length - 1 }"  ) 
                    span.breadcrumb-text(class="!text-[var(--text-primary)]") {{ route.label }}
            .flex.gap-3.items-center
              .tools.flex.items-center(class="p-2 rounded-full gap-2.5" )
                //- Circular Spotlight Button (⌘)
                button.premium-nav-btn.spotlight-btn(@click="open" :title="$t('common.searchAltK')")
                  Icon(name="ph:command-bold")
                
                ColorModeToggle
                LanguageToggle
                
                //- Circular Notification Button
                .notification.premium-nav-btn
                  NuxtLink.flex.items-center.justify-center.w-full.h-full(:to="`/notification`" )
                    Icon.text-xl(name="ph:bell-bold")
                    div.notification-badge(v-if="notificationResponse?.unreadNotificationsCount > 0")
                
                //- Profile Dropdown
                el-dropdown(class="outline-0")
                    div.profile-trigger(class="!text-[var(--text-primary)]")
                          Avatar(:src="user?.profilePicture", small)
                          p.mb-0 {{user?.name}}
                          Icon.text-xl(name="iconamoon:arrow-down-2")
                    template(#dropdown='')
                      el-dropdown-menu
                          el-dropdown-item(@click="logout")
                              p.text-xs {{ $t('common.logout') }}
          .mt-4
        .slot-content(class="!mt-24 animate-entrance" :class="{'!pl-[32px] !pr-[50px]' : !mobile, '!px-[20px] '  : mobile}")
            slot
      AIChatbot
  </template>
<script setup lang="ts">
import { useWindowSize } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { ArrowRight, Search, Plus } from '@element-plus/icons-vue';
import { ElNotification } from 'element-plus';
import { useMain } from '~/stores/common';
import AIChatbot from '~/components/global/AIChatbot.vue';

// Initialize Spotlight
const { open } = useSpotlight();

const mainData = useMain();
const { fullNav, mobile, hideNav } = storeToRefs(mainData);
const { width, height } = useWindowSize();
const { locale, t } = useI18n();
const router = useRouter();
const route = useRoute();
const showNavbar = ref(false);
const showDropdown = ref(false);
const searchInput = ref('');

const notificationResponse = await useTableFilter('notification');

function toggleDropdown(val: boolean) {
  showDropdown.value = val;
}
const handleScroll = () => {
  showNavbar.value = window.scrollY > 10;
};

const handleClickOutside = () => {
  showDropdown.value = false;
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
  window.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('click', handleClickOutside);
});

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
  if (response?.success) {
    router.push('/login');
    const accessToken = useCookie('access_token');
    accessToken.value = '';
    ElNotification({
      title: response.success ? t('common.success') : t('common.error'),
      type: response.success ? 'success' : 'error',
      message: response.message
    });
  }
}

checkwidth();

watch(width, () => {
  checkwidth();
});

const user = ref<any>({});

if (!user.value?.id) {
  const meResponse = await useApiFetch('auth/me');
  user.value = meResponse?.body;
}

const breadcrumbRoutes = computed(() => {
  const pathSegments = route.path.split('/').filter(Boolean);

  // Regular expression for a UUID-like ID format
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  // Check if the last item is a valid ID (UUID or numeric)
  if (pathSegments.length > 0) {
    const lastSegment = pathSegments[pathSegments.length - 1];

    // Check for UUID or numeric formats
    if (lastSegment && (uuidRegex.test(lastSegment) || !isNaN(Number(lastSegment)))) {
      pathSegments.pop(); // Remove the last item
    }
  }

  // Create breadcrumb items with translation support
  const breadcrumbs = pathSegments.map((segment: any) => {
    // Convert kebab-case to camelCase for key matching (e.g. daily-tasks -> dailyTasks)
    const camelSegment = segment.replace(/-([a-z])/g, (g: string) => g[1].toUpperCase());

    // Try navigation key first
    const navKey = `navigation.${camelSegment}`;

    // Check if translation exists, otherwise fallback to Space Case
    const label = t(navKey) !== navKey ? t(navKey) : segment.replace(/[-_]/g, ' '); // fallback

    return {
      path: segment,
      label
    };
  });

  return breadcrumbs;
});

const getPath = (routeSegment: any) => {
  const pathSegments = route.path.split('/').filter(Boolean);
  let pathGo = '';
  // Find index using the raw path segment
  const indexStop = pathSegments.findIndex(segment => segment == routeSegment.path);
  pathSegments.forEach((el, index) => {
    if (index <= indexStop) pathGo = pathGo + '/' + el;
  });
  if (pathGo !== '/sales' && pathGo !== '/operations') router.push(pathGo);
};
</script>

<style lang="scss" scoped>
.website-body {
  .slot-content {
    background: transparent !important;
    padding: 0 !important;
    margin-top: 4rem !important;
  }
}
#main {
  height: fit-content;
  margin-top: 50px;
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

    // 🎨 Glass Sidebar
    @include mica-material;
    backdrop-filter: blur(40px) saturate(180%);
    -webkit-backdrop-filter: blur(40px) saturate(180%);
    border-right: 1px solid var(--color-border-default);
    box-shadow: var(--elevation-shadow-8);
  }
}
.navbar {
  position: fixed;
  width: 100%;
  transition: all 0.2s ease-in;
  top: 0;
  inset-inline-start: 0;
  z-index: 999;

  // 🎨 Premium Glassmorphism Effect
  @include mica-material;
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-large);
  box-shadow: var(--elevation-shadow-8);
  margin: var(--spacing-md);
  width: calc(100% - var(--spacing-xl));

  // Shine effect
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: shine 3s infinite;
  }

  &:hover {
    box-shadow: var(--elevation-shadow-16);
    transform: translateY(-2px);
  }
}

@keyframes shine {
  0% { left: -100%; }
  50%, 100% { left: 100%; }
}

.top {
  .logo {
    position: absolute;
    height: 70px;
    padding: 2rem;
    z-index: 1000;
    border-radius: 0px 0 50px 0px;
    inset-inline-start: 0;
    top: 0;
    width: 100%;
  }
}
.myicon {
  color: white;
  background-color: var(--color-primary);
  padding: 0.3rem;
  border-radius: 50%;
}
.marginedStart {
  margin-inline-start: 260px;
  width: calc(100% - 260px);
}
.collapseMargin {
  margin-inline-start: 105px;
  width: calc(100% - 105px) !important;
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

@keyframes auroraFloat {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.12;
  }
}

// 🎨 Premium Navbar Buttons
.tools {
  background: var(--color-neutral-background-2);
  border: 1px solid var(--color-border-subtle);
  box-shadow: var(--elevation-shadow-2);
  transition: all var(--duration-fast) var(--curve-standard);

  &:hover {
    background: var(--color-neutral-background-3);
    box-shadow: var(--elevation-shadow-4);
  }
}

.premium-nav-btn {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-medium);
  background: transparent;
  border: 1px solid transparent;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--curve-standard);
  position: relative;

  &:hover {
    background: var(--color-surface-hover);
    border-color: var(--color-border-subtle);
    transform: translateY(-1px);
    box-shadow: var(--elevation-shadow-2);
  }

  &:active {
    transform: translateY(0);
  }

  &.spotlight-btn {
    &:hover {
      color: var(--color-primary);
    }
  }
}

.notification {
  position: relative;

  &-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 8px;
    height: 8px;
    background: var(--color-danger);
    border-radius: 50%;
    border: 2px solid var(--color-neutral-background-1);
    animation: pulse 2s infinite;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

.profile-trigger {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-medium);
  cursor: pointer;
  transition: all var(--duration-fast) var(--curve-standard);

  &:hover {
    background: var(--color-surface-hover);
  }

  p {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
  }
}

// Breadcrumb Improvements
.breadcrumb {
  .el-breadcrumb {
    :deep(.el-breadcrumb__item) {
      .el-breadcrumb__inner {
        font-weight: var(--font-weight-medium);
        transition: all var(--duration-fast);

        &:hover {
          color: var(--color-primary);
        }
      }

      &.is-link {
        .el-breadcrumb__inner {
          &:hover {
            color: var(--color-primary);
          }
        }
      }
    }
  }
}
</style>
