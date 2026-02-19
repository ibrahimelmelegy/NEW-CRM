<template lang="pug">
.relative.inline-block
  //- Toggle Button for Desktop
  .toggle-indicator.cursor-pointer.flex.items-center.justify-center.absolute.rounded-full.w-9.h-9.glass-card(@click="openNav" v-if="!mobile" :class="{ 'left-full -translate-x-1/2' : true }" class="top-[50px] z-30")
    Icon(:name="fullNav ? 'ph:caret-left-bold' : 'ph:caret-right-bold'" size="18" class="text-[var(--text-primary)]")

  //- Mobile Overlay
  div.background-overlay.fixed.top-0.left-0.w-screen.h-full(class='z-[-1]' v-if="mobile && !hideNav" @click="hideNav = true")
  
  transition(:name='mobile ? "side" : "none"')
    el-menu.el-menu-vertical-demo.relative.sidebar-glass(
      class='!pl-[5px] card-auto'
      style="height: 100vh; overflow-y: auto; overflow-x: hidden"
      v-if="mobile ? !hideNav : true" 
      :collapse='mobile ? false : !fullNav' 
      :default-openeds="defaultOpenMenus"
    )
      //- Logo Area (Expanded)
      .py-5.px-12.flex.items-center.gap-3(v-if="fullNav")
        img(class="cursor-pointer max-h-[50px] w-auto object-contain" :src="logoSrc" @click="router.push('/')")
      
      //- Logo Area (Collapsed)
      .py-5.px-5.flex.items-center.gap-3.relative.z-10(v-if="!fullNav")
        img(class="cursor-pointer h-[50px] w-auto object-contain" src="/images/logo-shape.png" @click="router.push('/')")
      
      //- Menu Mapping
      template(v-for="(navLink, index) in menu" :key="index")
        //- Submenu Items
        el-sub-menu(:index='`${index+1}`' v-if="navLink.submenu")
          template(#title)
            Icon.myicon(size="32" :name="navLink.icon")
            span.ml-2 {{ $t(navLink.name) }}
          
          div(v-for="(subLink, subIndex) in navLink.submenu" :key="subIndex")
            //- Special Daily Task Logic (Fixed: Removed hardcoded user guard)
            NuxtLink(:to="subLink.link" v-if="!getDisabled(subLink.role)")
              el-menu-item(:index="subLink.link" @click="mobileNavigate(subLink.link)" :class="{'is-active': route?.fullPath?.includes(subLink.link)}")
                Icon.mr-2.submenu-icon(size="18" :name="subLink.icon" v-if="subLink.icon")
                span {{ $t(subLink.name) }}
            
            //- Disabled Links Logic (Visible but grayed out)
            el-menu-item(:index="`${index+1}-${subIndex+1}`" :class="{'disabled-link' : true}" v-else)
              Icon.mr-2.submenu-icon(size="18" :name="subLink.icon" v-if="subLink.icon")
              span {{ $t(subLink.name) }}

        //- Single Level Items
        template(v-else)
          el-menu-item(:index='`${index+1}`' :class="{'disabled-link': getDisabled(navLink.role)}" v-if="navLink.link !== '/' && getDisabled(navLink.role)")
            el-icon: Setting
            template(#title) {{ $t(navLink.name) }}
          
          NuxtLink(:to="navLink.link" v-else)
            el-menu-item(:index="navLink.link" @click="mobileNavigate(navLink.link)" :class="{'is-active': route?.fullPath?.includes(navLink.link) && navLink.link !== '/'}")
              Icon.myicon.mr-2(size="32" :name="navLink.icon")
              template(#title) {{ $t(navLink.name) }}
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { Setting } from '@element-plus/icons-vue';
import { useMain } from '~/stores/common';
import { useApiFetch } from '~/composables/useApiFetch';
import { useThemeStore } from '~/stores/theme';

const themeStore = useThemeStore();
const mainStore = useMain();
const { fullNav, mobile, hideNav, permissions } = storeToRefs(mainStore);
const route = useRoute();
const router = useRouter();
const user = ref();

const logoSrc = computed(() => {
  return themeStore.isLight ? '/images/Logo.png' : '/images/lOGO-DARDK-MODE.png';
});

// Using onMounted to fetch user data safely
onMounted(async () => {
  themeStore.initializeTheme();
  try {
    const response: any = await useApiFetch('auth/me');
    user.value = response?.user;
  } catch (e) {
    console.error('Auth fetch failed', e);
  }
});

function mobileNavigate(link: string) {
  if (mobile.value) hideNav.value = true;
}

function getDisabled(role: string) {
  if (permissions.value && Array.isArray(permissions.value) && permissions.value.length) {
    if (!role) return false;
    return !(permissions.value as string[])?.includes(role);
  }
  return false;
}

const menu = [
  { link: '/', name: 'navigation.board', icon: 'IconHome', submenu: false, isOpen: false },
  { link: '/dashboard/war-room', name: 'navigation.warRoom', icon: 'ph:crosshair-bold', submenu: false, isOpen: false },
  { link: '/dashboard/builder', name: 'navigation.dashboardBuilder', icon: 'ph:squares-four-bold', submenu: false, isOpen: false },
  {
    name: 'navigation.sales',
    icon: 'IconSales',
    isOpen: true,
    submenu: [
      { link: '/sales/leads', name: 'navigation.leads', icon: 'ph:users-three' },
      { link: '/sales/clients', name: 'navigation.clients', icon: 'ph:briefcase' },
      { link: '/sales/opportunity', name: 'navigation.opportunity', icon: 'ph:lightbulb' },
      { link: '/sales/deals', name: 'navigation.deals', icon: 'ph:handshake' },
      { link: '/sales/invoices', name: 'navigation.invoices', icon: 'ph:receipt-bold' },
      { link: '/sales/contracts', name: 'navigation.contracts', icon: 'ph:file-doc-bold' },
      { link: '/sales/proposals', name: 'navigation.proposals', icon: 'ph:file-text' }
    ]
  },
  {
    name: 'navigation.operations',
    icon: 'IconOperations',
    isOpen: false,
    submenu: [
      { link: '/operations/projects', name: 'navigation.projects', icon: 'ph:projector-screen-chart' },
      { link: '/operations/daily-task', name: 'navigation.dailyTasks', icon: 'ph:check-square' },
      { link: '/operations/vehicle', name: 'navigation.vehicle', icon: 'ph:car' },
      { link: '/operations/manpower', name: 'navigation.manpower', icon: 'ph:users-four' },
      { link: '/operations/additional-material', name: 'navigation.additionalMaterials', icon: 'ph:cube' },
      { link: '/operations/services', name: 'navigation.services', icon: 'ph:wrench' },
      { link: '/operations/assets', name: 'navigation.assets', icon: 'ph:bank' },
      { link: '/operations/time-tracking', name: 'navigation.timeTracking', icon: 'ph:timer-bold' },
      { link: '/operations/field-tracking', name: 'navigation.fieldTracking', icon: 'ph:map-pin-bold' }
    ]
  },
  {
    name: 'navigation.procurement',
    icon: 'ph:shopping-bag',
    isOpen: true,
    submenu: [
      { link: '/procurement/vendors', name: 'navigation.vendors', icon: 'ph:storefront' },
      { link: '/procurement/distributors', name: 'navigation.distributors', icon: 'ph:truck' },
      { link: '/procurement/local-suppliers', name: 'navigation.localSuppliers', icon: 'ph:handshake' },
      { link: '/procurement/showrooms', name: 'navigation.showRooms', icon: 'ph:buildings' },
      { link: '/procurement/purchase-orders', name: 'navigation.purchaseOrders', icon: 'ph:shopping-cart' },
      { link: '/procurement/rfq', name: 'navigation.rfq', icon: 'ph:files' },
      { link: '/procurement/statistics', name: 'navigation.statistics', icon: 'ph:chart-bar' }
    ]
  },
  {
    name: 'navigation.inventory',
    icon: 'ph:package-bold',
    isOpen: false,
    link: '/inventory'
  },
  { link: '/tasks', name: 'navigation.tasks', icon: 'ph:list-checks-bold', submenu: false, isOpen: false },
  { link: '/messaging', name: 'navigation.messaging', icon: 'ph:chat-circle-dots-bold', submenu: false, isOpen: false },
  {
    name: 'navigation.marketing',
    icon: 'ph:megaphone-bold',
    isOpen: false,
    submenu: [
      { link: '/marketing/campaigns', name: 'navigation.campaigns', icon: 'ph:envelope-simple-bold' },
      { link: '/marketing/sequences', name: 'navigation.sequences', icon: 'ph:flow-arrow-bold' }
    ]
  },
  {
    name: 'navigation.calendar',
    icon: 'ph:calendar-bold',
    isOpen: false,
    link: '/calendar'
  },
  {
    name: 'navigation.documents',
    icon: 'ph:folder-open-bold',
    isOpen: false,
    link: '/documents'
  },
  {
    name: 'navigation.reports',
    icon: 'IconReport',
    isOpen: false,
    submenu: [
      { link: '/reports', name: 'navigation.report', icon: 'ph:chart-pie' },
      { link: '/reports/builder', name: 'navigation.reportBuilder', icon: 'ph:faders-horizontal-bold' },
      { link: '/reports/forecasting', name: 'navigation.forecasting', icon: 'ph:trend-up-bold' }
    ]
  },
  {
    name: 'navigation.finance',
    icon: 'ph:currency-circle-dollar-bold',
    isOpen: false,
    submenu: [
      { link: '/finance/expenses', name: 'navigation.expenses', icon: 'ph:receipt-bold' },
      { link: '/finance/budgets', name: 'navigation.budgets', icon: 'ph:wallet-bold' },
      { link: '/finance/zatca', name: 'navigation.zatca', icon: 'ph:stamp-bold' },
      { link: '/finance/zakaat', name: 'navigation.zakaat', icon: 'ph:hand-coins-bold' }
    ]
  },
  {
    name: 'navigation.hr',
    icon: 'ph:identification-badge-bold',
    isOpen: false,
    submenu: [
      { link: '/hr/attendance', name: 'navigation.attendance', icon: 'ph:clock-bold' },
      { link: '/hr/leave-requests', name: 'navigation.leaveRequests', icon: 'ph:calendar-x-bold' }
    ]
  },
  {
    name: 'navigation.analytics',
    icon: 'ph:chart-line-bold',
    isOpen: false,
    submenu: [
      { link: '/analytics/heatmap', name: 'navigation.activityHeatmap', icon: 'ph:squares-four-bold' },
      { link: '/analytics/relationship-graph', name: 'navigation.relationshipGraph', icon: 'ph:graph-bold' }
    ]
  },
  {
    name: 'navigation.gamification',
    icon: 'ph:trophy-bold',
    isOpen: false,
    submenu: [
      { link: '/gamification/leaderboard', name: 'navigation.leaderboard', icon: 'ph:ranking-bold' },
      { link: '/gamification/achievements', name: 'navigation.achievements', icon: 'ph:medal-bold' }
    ]
  },
  {
    name: 'navigation.support',
    icon: 'ph:lifebuoy-bold',
    isOpen: false,
    submenu: [
      { link: '/support/knowledge-base', name: 'navigation.knowledgeBase', icon: 'ph:book-open-bold' }
    ]
  },
  {
    name: 'navigation.approvals',
    icon: 'ph:stamp-bold',
    isOpen: false,
    submenu: [
      { link: '/approvals', name: 'navigation.approvalCenter', icon: 'ph:check-circle-bold' },
      { link: '/approvals/workflows', name: 'navigation.approvalWorkflows', icon: 'ph:flow-arrow-bold' }
    ]
  },
  {
    name: 'navigation.settings',
    icon: 'ph:gear-bold',
    isOpen: false,
    role: 'VIEW_SETTINGS', // Higher permission
    submenu: [
      { link: '/settings/theme-studio', name: 'navigation.themeStudio', icon: 'ph:palette-bold' },
      { link: '/settings/integrations', name: 'navigation.integrations', icon: 'ph:plugs-connected-bold' },
      { link: '/settings/security', name: 'navigation.security', icon: 'ph:lock-bold' },
      { link: '/settings/custom-fields', name: 'navigation.customFields', icon: 'ph:sliders-horizontal-bold' },
      { link: '/settings/webhooks', name: 'navigation.webhooks', icon: 'ph:webhooks-logo-bold' },
      { link: '/settings/document-templates', name: 'navigation.documentTemplates', icon: 'ph:file-pdf-bold' },
      { link: '/settings/workflows', name: 'navigation.workflows', icon: 'ph:lightning-bold' },
      { link: '/settings/portal-users', name: 'navigation.portalUsers', icon: 'ph:users-three-bold' },
      { link: '/settings/currencies', name: 'navigation.currencies', icon: 'ph:coins-bold' },
      { link: '/settings/tax-rules', name: 'navigation.taxRules', icon: 'ph:percent-bold' },
      { link: '/settings/audit-logs', name: 'navigation.auditLogs', icon: 'ph:fingerprint-bold' },
      { link: '/roles', name: 'navigation.rolesAccess', icon: 'ph:shield-check-bold' },
      { link: '/roles/add-role', name: 'navigation.addNewRole', icon: 'ph:plus-circle-bold' },
      { link: '/staff', name: 'navigation.staffManagement', icon: 'ph:users-bold' },
      { link: '/staff/add-staff', name: 'navigation.addNewStaff', icon: 'ph:user-plus-bold' },
      { link: '/settings/notifications', name: 'navigation.notificationPrefs', icon: 'ph:bell-ringing-bold' },
      { link: '/settings/lead-scoring', name: 'navigation.leadScoring', icon: 'ph:chart-line-up-bold' },
      { link: '/settings/duplicates', name: 'navigation.duplicateDetection', icon: 'ph:copy-bold' },
      { link: '/settings/sla', name: 'navigation.slaManagement', icon: 'ph:clock-countdown-bold' },
      { link: '/settings/pipeline', name: 'navigation.pipeline', icon: 'ph:funnel-bold' },
      { link: '/settings/territories', name: 'navigation.territories', icon: 'ph:map-trifold-bold' },
      { link: '/settings/email-accounts', name: 'navigation.emailAccounts', icon: 'ph:envelope-bold' },
      { link: '/settings/products', name: 'navigation.products', icon: 'ph:package-bold' },
      { link: '/admin/tests', name: 'navigation.qaCenter', icon: 'ph:test-tube-bold' },
      { link: '/test', name: 'navigation.permissionsHub', icon: 'ph:key-bold' }
    ]
  }
];

const defaultOpenMenus = menu.map((item, index) => (item.isOpen ? `${index + 1}` : null)).filter(Boolean) as string[];

function openNav() {
  fullNav.value = !fullNav.value;
  if (mobile.value) hideNav.value = !hideNav.value;
}
</script>

<style lang="scss" scoped>
.sidebar-glass {
  @include glass-sidebar-bg;
  transition:
    width 0.3s ease-in-out,
    background 0.3s ease;
  scrollbar-width: thin;
  scrollbar-color: rgba(120, 73, 255, 0.3) transparent;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(120, 73, 255, 0.3);
    border-radius: 2px;
  }
}

.submenu-icon {
  color: var(--accent-color, #7849ff);
  transition: all 0.3s ease;
}

.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 260px;
}

.toggle-indicator {
  display: none;
  @media screen and (min-width: 991px) {
    display: flex;
  }
}

.myicon {
  width: 24px !important;
  min-width: 24px !important;
  height: 24px !important;
  margin-left: -5px !important;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  color: var(--text-primary, #e4e4e7) !important;
}

[dir='rtl'] .myicon {
  margin-left: 5px !important;
  margin-right: -5px !important;
}

// Ensure nuxt-icon SPANs and SVGs inside .myicon fill the container
.myicon :deep(.iconify),
.myicon :deep(.nuxt-icon),
.myicon :deep(svg) {
  width: 24px !important;
  height: 24px !important;
  font-size: 24px !important;
}

.el-menu--collapse {
  width: calc(var(--el-menu-icon-width) + var(--el-menu-base-level-padding) * 2.5) !important;
}
</style>
