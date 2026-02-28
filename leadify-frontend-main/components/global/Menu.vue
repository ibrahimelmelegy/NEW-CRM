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

      //- ★ Favorites Section
      el-sub-menu(index="favorites" v-if="favorites.length && fullNav")
        template(#title)
          Icon.myicon(size="32" name="ph:star-bold")
          span.ml-2 {{ $t('navigation.favorites') }}

        div(v-for="(fav, fIndex) in favorites" :key="fav.link")
          NuxtLink(:to="fav.link")
            el-menu-item(:index="fav.link" @click="mobileNavigate(fav.link)" :class="{'is-active': route?.fullPath?.includes(fav.link)}")
              Icon.mr-2.submenu-icon(size="18" :name="fav.icon" v-if="fav.icon")
              span {{ $t(fav.name) }}
              Icon.fav-remove(size="14" name="ph:x" @click.prevent.stop="removeFavorite(fav.link)")

      //- Menu Mapping
      template(v-for="(navLink, index) in menu" :key="index")
        //- Submenu Items — hidden if user has no access to any child
        el-sub-menu(:index='`${index+1}`' v-if="navLink.submenu && hasAccessToSection(navLink)")
          template(#title)
            Icon.myicon(size="32" :name="navLink.icon")
            span.ml-2 {{ $t(navLink.name) }}

          template(v-for="(subLink, subIndex) in navLink.submenu" :key="subIndex")
            //- Only show items the user has access to (v-if, not grayed out)
            NuxtLink(:to="subLink.link" v-if="!getDisabled(subLink.role)")
              el-menu-item.menu-item-with-star(:index="subLink.link" @click="mobileNavigate(subLink.link)" :class="{'is-active': route?.fullPath?.includes(subLink.link)}")
                Icon.mr-2.submenu-icon(size="18" :name="subLink.icon" v-if="subLink.icon")
                span {{ $t(subLink.name) }}
                Icon.fav-star(
                  size="14"
                  :name="isFavorite(subLink.link) ? 'ph:star-fill' : 'ph:star'"
                  :class="{ 'is-fav': isFavorite(subLink.link) }"
                  @click.prevent.stop="toggleFavorite({ link: subLink.link, name: subLink.name, icon: subLink.icon })"
                  v-if="fullNav"
                )

        //- Single Level Items — hidden if user has no access
        template(v-else-if="!navLink.submenu && !getDisabled(navLink.role)")
          NuxtLink(:to="navLink.link")
            el-menu-item.menu-item-with-star(:index="navLink.link" @click="mobileNavigate(navLink.link)" :class="{'is-active': route?.fullPath?.includes(navLink.link) && navLink.link !== '/'}")
              Icon.myicon.mr-2(size="32" :name="navLink.icon")
              template(#title)
                span {{ $t(navLink.name) }}
                Icon.fav-star(
                  size="14"
                  :name="isFavorite(navLink.link) ? 'ph:star-fill' : 'ph:star'"
                  :class="{ 'is-fav': isFavorite(navLink.link) }"
                  @click.prevent.stop="toggleFavorite({ link: navLink.link, name: navLink.name, icon: navLink.icon })"
                  v-if="fullNav"
                )
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useMain } from '~/stores/common';
import { useApiFetch } from '~/composables/useApiFetch';
import { useThemeStore } from '~/stores/theme';
import { useSidebarFavorites } from '~/composables/useSidebarFavorites';

const themeStore = useThemeStore();
const mainStore = useMain();
const { fullNav, mobile, hideNav, permissions } = storeToRefs(mainStore);
const route = useRoute();
const router = useRouter();
const user = ref();

const { favorites, isFavorite, toggleFavorite, removeFavorite } = useSidebarFavorites();

const logoSrc = computed(() => {
  return themeStore.isLight ? '/images/Logo.png' : '/images/light-logo.png';
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

/**
 * Hide entire section if user has no access to ANY child item
 */
function hasAccessToSection(navLink: any): boolean {
  // If section itself has a role requirement, check it
  if (navLink.role && getDisabled(navLink.role)) return false;

  // If it has a submenu, show section only if user can access at least one child
  if (navLink.submenu) {
    return navLink.submenu.some((sub: any) => !getDisabled(sub.role));
  }

  return true;
}

// ──────────────────────────────────────────────────────────────
// Reorganized Menu — consolidated from 32 to 16 top-level items
// ──────────────────────────────────────────────────────────────
const menu = [
  // 1. Home
  { link: '/', name: 'navigation.board', icon: 'IconHome', submenu: false, isOpen: false },

  // Team Hub — real-time collaboration
  { link: '/collaboration', name: 'navigation.teamHub', icon: 'ph:users-four-bold', submenu: false, isOpen: false },

  // 2. Dashboards (merged 5 standalone items)
  {
    name: 'navigation.dashboards',
    icon: 'ph:squares-four-bold',
    isOpen: false,
    submenu: [
      { link: '/dashboard/war-room', name: 'navigation.warRoom', icon: 'ph:crosshair-bold' },
      { link: '/dashboard/briefing', name: 'navigation.dailyBriefing', icon: 'ph:sun-horizon-bold' },
      { link: '/dashboard/builder', name: 'navigation.dashboardBuilder', icon: 'ph:squares-four-bold' },
      { link: '/dashboards/executive', name: 'navigation.executiveDashboard', icon: 'ph:presentation-chart-bold' },
      { link: '/views/kanban', name: 'navigation.kanbanBoard', icon: 'ph:kanban-bold' }
    ]
  },

  // 3. CRM
  {
    name: 'navigation.crm',
    icon: 'ph:address-book-bold',
    isOpen: false,
    submenu: [
      { link: '/crm/customer-360', name: 'navigation.customer360', icon: 'ph:user-circle-bold' },
      { link: '/crm/customer-health', name: 'navigation.customerHealth', icon: 'ph:first-aid-kit-bold' },
      { link: '/crm/activities', name: 'navigation.activityTimeline', icon: 'ph:clock-counter-clockwise-bold' },
      { link: '/companies', name: 'navigation.companies', icon: 'ph:buildings-bold' },
      { link: '/reminders', name: 'navigation.reminders', icon: 'ph:bell-ringing-bold' },
      { link: '/notifications', name: 'navigation.notifications', icon: 'ph:bell-bold' }
    ]
  },

  // 4. Sales
  {
    name: 'navigation.sales',
    icon: 'IconSales',
    isOpen: true,
    submenu: [
      { link: '/sales/documents', name: 'navigation.documentHub', icon: 'ph:files-bold' },
      { link: '/sales/leads', name: 'navigation.leads', icon: 'ph:users-three' },
      { link: '/sales/clients', name: 'navigation.clients', icon: 'ph:briefcase' },
      { link: '/sales/opportunity', name: 'navigation.opportunity', icon: 'ph:lightbulb' },
      { link: '/sales/deals', name: 'navigation.deals', icon: 'ph:handshake' },
      { link: '/sales/quotes', name: 'navigation.quotes', icon: 'ph:chat-teardrop-text-bold' },
      { link: '/sales/sales-orders', name: 'navigation.salesOrders', icon: 'ph:clipboard-text-bold' },
      { link: '/sales/delivery-notes', name: 'navigation.deliveryNotes', icon: 'ph:truck-bold' },
      { link: '/sales/invoices', name: 'navigation.invoices', icon: 'ph:receipt-bold' },
      { link: '/sales/subscriptions', name: 'navigation.subscriptions', icon: 'ph:arrows-clockwise-bold' },
      { link: '/sales/contracts', name: 'navigation.contracts', icon: 'ph:file-doc-bold' },
      { link: '/sales/contract-lifecycle', name: 'navigation.contractLifecycle', icon: 'ph:scroll-bold' },
      { link: '/sales/proposals', name: 'navigation.proposals', icon: 'ph:file-text' },
      { link: '/sales/playbooks', name: 'navigation.salesPlaybooks', icon: 'ph:book-open-bold' },
      { link: '/sales/cpq', name: 'navigation.cpq', icon: 'ph:calculator-bold' },
      { link: '/sales/commissions', name: 'navigation.commissions', icon: 'ph:currency-dollar-bold' },
      { link: '/sales/competitors', name: 'navigation.competitors', icon: 'ph:binoculars-bold' },
      { link: '/sales/proforma-invoices', name: 'navigation.proformaInvoices', icon: 'ph:file-text-bold' },
      { link: '/sales/goals', name: 'navigation.goalsOkrs', icon: 'ph:crosshair-bold' },
      { link: '/sales/revenue-intelligence', name: 'navigation.revenueIntelligence', icon: 'ph:chart-line-up-bold' },
      { link: '/sales/territories', name: 'navigation.territoryManagement', icon: 'ph:map-pin-area-bold' },
      { link: '/sales/product-catalog', name: 'navigation.productCatalog', icon: 'ph:storefront-bold' },
      { link: '/sales/data-enrichment', name: 'navigation.dataEnrichment', icon: 'ph:magic-wand-bold' },
      { link: '/sales/quote-comparison', name: 'navigation.quoteComparison', icon: 'ph:scales-bold' },
      { link: '/sales/roi-calculator', name: 'navigation.roiCalculator', icon: 'ph:calculator-bold' }
    ]
  },

  // 5. Operations (absorbed Tasks, Calendar, Booking, Planner)
  {
    name: 'navigation.operations',
    icon: 'IconOperations',
    isOpen: false,
    submenu: [
      { link: '/operations/projects', name: 'navigation.projects', icon: 'ph:projector-screen-chart' },
      { link: '/tasks', name: 'navigation.taskList', icon: 'ph:list-bold' },
      { link: '/tasks/kanban', name: 'navigation.tasksBoard', icon: 'ph:kanban-bold' },
      { link: '/operations/daily-task', name: 'navigation.dailyTasks', icon: 'ph:check-square' },
      { link: '/planner', name: 'navigation.planner', icon: 'ph:calendar-dots-bold' },
      { link: '/calendar', name: 'navigation.calendar', icon: 'ph:calendar-bold' },
      { link: '/booking', name: 'navigation.booking', icon: 'ph:calendar-check-bold' },
      { link: '/operations/vehicle', name: 'navigation.vehicle', icon: 'ph:car' },
      { link: '/operations/manpower', name: 'navigation.manpower', icon: 'ph:users-four' },
      { link: '/operations/additional-material', name: 'navigation.additionalMaterials', icon: 'ph:cube' },
      { link: '/operations/services', name: 'navigation.services', icon: 'ph:wrench' },
      { link: '/operations/assets', name: 'navigation.assets', icon: 'ph:bank' },
      { link: '/operations/time-tracking', name: 'navigation.timeTracking', icon: 'ph:timer-bold' },
      { link: '/operations/field-tracking', name: 'navigation.fieldTracking', icon: 'ph:map-pin-bold' },
      { link: '/operations/gantt', name: 'navigation.ganttTimeline', icon: 'ph:chart-bar-horizontal-bold' },
      { link: '/operations/resource-planner', name: 'navigation.resourcePlanner', icon: 'ph:users-four-bold' }
    ]
  },

  // 6. Procurement
  {
    name: 'navigation.procurement',
    icon: 'ph:shopping-bag',
    isOpen: false,
    submenu: [
      { link: '/procurement/vendors', name: 'navigation.vendors', icon: 'ph:storefront' },
      { link: '/procurement/distributors', name: 'navigation.distributors', icon: 'ph:truck' },
      { link: '/procurement/local-suppliers', name: 'navigation.localSuppliers', icon: 'ph:handshake' },
      { link: '/procurement/showrooms', name: 'navigation.showRooms', icon: 'ph:buildings' },
      { link: '/procurement/purchase-orders', name: 'navigation.purchaseOrders', icon: 'ph:shopping-cart' },
      { link: '/procurement/rfq', name: 'navigation.rfq', icon: 'ph:files' },
      { link: '/procurement/statistics', name: 'navigation.statistics', icon: 'ph:chart-bar' },
      { link: '/procurement/vendor-scorecard', name: 'navigation.vendorScorecard', icon: 'ph:star-half-bold' }
    ]
  },

  // 7. E-Commerce
  {
    name: 'navigation.ecommerce',
    icon: 'ph:shopping-bag-open-bold',
    isOpen: false,
    submenu: [
      { link: '/e-commerce', name: 'navigation.ecommerceDashboard', icon: 'ph:chart-pie-slice-bold' },
      { link: '/e-commerce/products', name: 'navigation.ecProducts', icon: 'ph:package-bold' },
      { link: '/e-commerce/orders', name: 'navigation.ecOrders', icon: 'ph:receipt-bold' },
      { link: '/e-commerce/categories', name: 'navigation.ecCategories', icon: 'ph:folder-notch-bold' },
      { link: '/e-commerce/coupons', name: 'navigation.ecCoupons', icon: 'ph:ticket-bold' },
      { link: '/e-commerce/reviews', name: 'navigation.ecReviews', icon: 'ph:star-bold' }
    ]
  },

  // 8. Supply Chain (merged: Inventory + Warehouse + Manufacturing + Shipping)
  {
    name: 'navigation.supplyChain',
    icon: 'ph:package-bold',
    isOpen: false,
    submenu: [
      { link: '/inventory', name: 'navigation.inventory', icon: 'ph:package-bold' },
      { link: '/warehouse', name: 'navigation.warehouse', icon: 'ph:warehouse-bold' },
      { link: '/manufacturing', name: 'navigation.manufacturing', icon: 'ph:factory-bold' },
      { link: '/shipping', name: 'navigation.shipping', icon: 'ph:truck-bold' },
      { link: '/catalog', name: 'navigation.catalog', icon: 'ph:storefront-bold' }
    ]
  },

  // 9. Communication (merged: Messaging + Communications + AI + Virtual Office)
  {
    name: 'navigation.communication',
    icon: 'ph:chat-circle-dots-bold',
    isOpen: false,
    submenu: [
      { link: '/messaging', name: 'navigation.messaging', icon: 'ph:chat-circle-dots-bold' },
      { link: '/communications', name: 'navigation.communicationHub', icon: 'ph:phone-list-bold' },
      { link: '/call-log', name: 'navigation.callLog', icon: 'ph:phone-bold' },
      { link: '/meeting-notes', name: 'navigation.meetingNotes', icon: 'ph:note-pencil-bold' },
      { link: '/ai-assistant', name: 'navigation.aiAssistant', icon: 'ph:brain-bold' },
      { link: '/virtual-office', name: 'navigation.virtualOffice', icon: 'ph:buildings-bold' }
    ]
  },

  // 10. Marketing
  {
    name: 'navigation.marketing',
    icon: 'ph:megaphone-bold',
    isOpen: false,
    submenu: [
      { link: '/marketing/campaigns', name: 'navigation.campaigns', icon: 'ph:envelope-simple-bold' },
      { link: '/marketing/campaigns/builder', name: 'navigation.campaignBuilder', icon: 'ph:pencil-line-bold' },
      { link: '/marketing/sequences', name: 'navigation.sequences', icon: 'ph:flow-arrow-bold' },
      { link: '/marketing/ab-testing', name: 'navigation.abTesting', icon: 'ph:flask-bold' },
      { link: '/marketing/form-builder', name: 'navigation.formBuilder', icon: 'ph:textbox-bold' },
      { link: '/marketing/surveys', name: 'navigation.surveys', icon: 'ph:chart-bar-bold' },
      { link: '/marketing/social-crm', name: 'navigation.socialCrm', icon: 'ph:share-network-bold' },
      { link: '/marketing/loyalty', name: 'navigation.loyalty', icon: 'ph:gift-bold' },
      { link: '/web-forms', name: 'navigation.webForms', icon: 'ph:browser-bold' }
    ]
  },

  // 11. Documents (absorbed Automations)
  {
    name: 'navigation.documents',
    icon: 'ph:folder-open-bold',
    isOpen: false,
    submenu: [
      { link: '/documents', name: 'navigation.allDocuments', icon: 'ph:folder-bold' },
      { link: '/documents/e-signatures', name: 'navigation.eSignatures', icon: 'ph:signature-bold' },
      { link: '/documents/editor', name: 'navigation.documentEditor', icon: 'ph:file-plus-bold' },
      { link: '/archive', name: 'navigation.archive', icon: 'ph:archive-bold' },
      { link: '/automations', name: 'navigation.automations', icon: 'ph:git-merge-bold' },
      { link: '/automations/templates', name: 'navigation.automationTemplates', icon: 'ph:files-bold' }
    ]
  },

  // 12. Analytics & Reports (merged: Reports + Analytics + Gamification)
  {
    name: 'navigation.analyticsReports',
    icon: 'ph:chart-line-bold',
    isOpen: false,
    submenu: [
      { link: '/reports', name: 'navigation.report', icon: 'ph:chart-pie' },
      { link: '/reports/custom-reports', name: 'navigation.customReports', icon: 'ph:file-magnifying-glass-bold' },
      { link: '/reports/builder', name: 'navigation.reportBuilder', icon: 'ph:faders-horizontal-bold' },
      { link: '/reports/forecasting', name: 'navigation.forecasting', icon: 'ph:trend-up-bold' },
      { link: '/analytics/heatmap', name: 'navigation.activityHeatmap', icon: 'ph:squares-four-bold' },
      { link: '/analytics/relationship-graph', name: 'navigation.relationshipGraph', icon: 'ph:graph-bold' },
      { link: '/analytics/simulator', name: 'navigation.revenueSimulator', icon: 'ph:chart-line-up-bold' },
      { link: '/gamification/leaderboard', name: 'navigation.leaderboard', icon: 'ph:ranking-bold' },
      { link: '/gamification/achievements', name: 'navigation.achievements', icon: 'ph:medal-bold' },
      { link: '/analytics/advanced', name: 'navigation.advancedAnalytics', icon: 'ph:chart-scatter-bold' }
    ]
  },

  // 13. Finance
  {
    name: 'navigation.finance',
    icon: 'ph:currency-circle-dollar-bold',
    isOpen: false,
    submenu: [
      { link: '/finance/accounting/credit-notes', name: 'navigation.creditNotes', icon: 'ph:arrow-u-down-left-bold' },
      { link: '/finance/expenses', name: 'navigation.expenses', icon: 'ph:receipt-bold' },
      { link: '/finance/budgets', name: 'navigation.budgets', icon: 'ph:wallet-bold' },
      { link: '/finance/payments', name: 'navigation.payments', icon: 'ph:money-bold' },
      { link: '/finance/accounting/chart-of-accounts', name: 'navigation.chartOfAccounts', icon: 'ph:tree-structure-bold' },
      { link: '/finance/accounting/journal-entries', name: 'navigation.journalEntries', icon: 'ph:notebook-bold' },
      { link: '/finance/accounting/reports/trial-balance', name: 'navigation.trialBalance', icon: 'ph:scales-bold' },
      { link: '/finance/accounting/reports/profit-loss', name: 'navigation.profitLoss', icon: 'ph:chart-line-up-bold' },
      { link: '/finance/accounting/reports/balance-sheet', name: 'navigation.balanceSheet', icon: 'ph:chart-bar-bold' },
      { link: '/finance/zatca', name: 'navigation.zatca', icon: 'ph:stamp-bold' },
      { link: '/finance/zakaat', name: 'navigation.zakaat', icon: 'ph:hand-coins-bold' }
    ]
  },

  // 14. HR
  {
    name: 'navigation.hr',
    icon: 'ph:identification-badge-bold',
    isOpen: false,
    submenu: [
      { link: '/hr/employees', name: 'navigation.employees', icon: 'ph:users-bold' },
      { link: '/hr/org-chart', name: 'navigation.orgChart', icon: 'ph:tree-structure-bold' },
      { link: '/hr/departments', name: 'navigation.departments', icon: 'ph:buildings-bold' },
      { link: '/hr/attendance', name: 'navigation.attendance', icon: 'ph:clock-bold' },
      { link: '/hr/leave-requests', name: 'navigation.leaveRequests', icon: 'ph:calendar-x-bold' },
      { link: '/hr/payroll', name: 'navigation.payroll', icon: 'ph:money-bold' },
      { link: '/hr/payroll/salary-structures', name: 'navigation.salaryStructures', icon: 'ph:stack-bold' },
      { link: '/hr/payroll/end-of-service', name: 'navigation.endOfService', icon: 'ph:hand-coins-bold' },
      { link: '/hr/performance-reviews', name: 'navigation.performanceReviews', icon: 'ph:star-bold' },
      { link: '/hr/goals', name: 'navigation.goalsOkrs', icon: 'ph:target-bold' },
      { link: '/hr/recruitment', name: 'navigation.recruitment', icon: 'ph:user-circle-plus-bold' },
      { link: '/hr/training', name: 'navigation.training', icon: 'ph:graduation-cap-bold' }
    ]
  },

  // 15. Support (absorbed Customer Success)
  {
    name: 'navigation.support',
    icon: 'ph:lifebuoy-bold',
    isOpen: false,
    submenu: [
      { link: '/support/tickets', name: 'navigation.tickets', icon: 'ph:ticket-bold' },
      { link: '/support/tickets/kanban', name: 'navigation.ticketsBoard', icon: 'ph:kanban-bold' },
      { link: '/support/dashboard', name: 'navigation.supportDashboard', icon: 'ph:chart-pie-bold' },
      { link: '/support/canned-responses', name: 'navigation.cannedResponses', icon: 'ph:chat-text-bold' },
      { link: '/support/knowledge-base', name: 'navigation.knowledgeBase', icon: 'ph:book-open-bold' },
      { link: '/support/live-chat', name: 'navigation.liveChat', icon: 'ph:chats-bold' },
      { link: '/customer-success', name: 'navigation.customerSuccess', icon: 'ph:heart-half-bold' },
      { link: '/warranty', name: 'navigation.warranty', icon: 'ph:shield-check-bold' }
    ]
  },

  // 16. Settings (absorbed Approvals)
  {
    name: 'navigation.settings',
    icon: 'ph:gear-bold',
    isOpen: false,
    role: 'VIEW_SETTINGS',
    submenu: [
      { link: '/approvals', name: 'navigation.approvalCenter', icon: 'ph:check-circle-bold' },
      { link: '/approvals/workflows', name: 'navigation.approvalWorkflows', icon: 'ph:flow-arrow-bold' },
      { link: '/settings/theme-studio', name: 'navigation.themeStudio', icon: 'ph:palette-bold' },
      { link: '/settings/integrations', name: 'navigation.integrations', icon: 'ph:plugs-connected-bold' },
      { link: '/settings/security', name: 'navigation.security', icon: 'ph:lock-bold' },
      { link: '/settings/custom-fields', name: 'navigation.customFields', icon: 'ph:sliders-horizontal-bold' },
      { link: '/settings/webhooks', name: 'navigation.webhooks', icon: 'ph:webhooks-logo-bold' },
      { link: '/settings/document-templates', name: 'navigation.documentTemplates', icon: 'ph:file-pdf-bold' },
      { link: '/settings/email-templates', name: 'navigation.emailTemplates', icon: 'ph:envelope-open-bold' },
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
      { link: '/settings/assignment-rules', name: 'navigation.assignmentRules', icon: 'ph:user-switch-bold' },
      { link: '/settings/data-governance', name: 'navigation.dataGovernance', icon: 'ph:database-bold' },
      { link: '/settings/data-import', name: 'navigation.dataImport', icon: 'ph:upload-bold' },
      { link: '/settings/branding', name: 'navigation.branding', icon: 'ph:paint-brush-household-bold' },
      { link: '/settings/white-label', name: 'navigation.whiteLabel', icon: 'ph:paint-brush-bold' },
      { link: '/settings/customer-portal', name: 'navigation.customerPortal', icon: 'ph:monitor-bold' },
      { link: '/settings/roles', name: 'navigation.permissionsHub', icon: 'ph:key-bold', role: 'VIEW_ROLES' }
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

// ── Favorites star icon ──
.fav-star {
  margin-left: auto;
  opacity: 0;
  color: var(--text-secondary, #a1a1aa);
  cursor: pointer;
  transition: opacity 0.2s, color 0.2s;
  flex-shrink: 0;

  &.is-fav {
    opacity: 1;
    color: #f59e0b;
  }
}

.menu-item-with-star:hover .fav-star {
  opacity: 1;
}

.fav-remove {
  margin-left: auto;
  opacity: 0;
  color: var(--text-secondary, #a1a1aa);
  cursor: pointer;
  transition: opacity 0.2s, color 0.2s;
  flex-shrink: 0;

  &:hover {
    color: #ef4444;
  }
}

.el-menu-item:hover .fav-remove {
  opacity: 1;
}
</style>
