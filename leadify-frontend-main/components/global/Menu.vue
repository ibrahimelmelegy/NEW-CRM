<template lang="pug">
.relative.inline-block
  //- Toggle Button for Desktop
  .toggle-indicator.cursor-pointer.flex.items-center.justify-center.absolute.rounded-full.w-9.h-9.glass-card(@click="openNav" v-if="!mobile" :class="{ 'left-full -translate-x-1/2' : true }" class="top-[50px] z-20")
    Icon(:name="fullNav ? 'ph:caret-left-bold' : 'ph:caret-right-bold'" size="18" class="text-[var(--text-primary)]")

  //- Mobile Overlay
  div.background-overlay.fixed.top-0.left-0.w-screen.h-full(class='z-[-1]' v-if="mobile && !hideNav" @click="hideNav = true")
  
  transition(:name='mobile ? "side" : "none"')
    el-menu.el-menu-vertical-demo.relative.sidebar-glass(
      class='!pl-[5px] h-[100vh] card-auto' 
      :class="{'overflow-x-hidden' : !fullNav }" 
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
import { storeToRefs } from "pinia";
import { useMain } from "~/stores/common";
import { Setting } from "@element-plus/icons-vue";
import { useApiFetch } from "~/composables/useApiFetch";
import { useThemeStore } from "~/stores/theme";

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
        const response: any = await useApiFetch("auth/me");
        user.value = response?.user;
    } catch (e) {
        console.error("Auth fetch failed", e);
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
  { link: "/", name: "navigation.board", icon: "IconHome", submenu: false, isOpen: false },
  {
    name: "navigation.sales",
    icon: "IconSales",
    isOpen: true,
    submenu: [
      { link: "/sales/leads", name: "navigation.leads", icon: "ph:users-three" },
      { link: "/sales/clients", name: "navigation.clients", icon: "ph:briefcase" },
      { link: "/sales/opportunity", name: "navigation.opportunity", icon: "ph:lightbulb" },
      { link: "/sales/deals", name: "navigation.deals", icon: "ph:handshake" },
      { link: "/sales/proposals", name: "navigation.proposals", icon: "ph:file-text" },
    ],
  },
  {
    name: "navigation.operations",
    icon: "IconOperations",
    isOpen: false,
    submenu: [
      { link: "/operations/projects", name: "navigation.projects", icon: "ph:projector-screen-chart" },
      { link: "/operations/daily-task", name: "navigation.dailyTasks", icon: "ph:check-square" },
      { link: "/operations/vehicle", name: "navigation.vehicle", icon: "ph:car" },
      { link: "/operations/manpower", name: "navigation.manpower", icon: "ph:users-four" },
      { link: "/operations/additional-material", name: "navigation.additionalMaterials", icon: "ph:cube" },
      { link: "/operations/services", name: "navigation.services", icon: "ph:wrench" },
      { link: "/operations/assets", name: "navigation.assets", icon: "ph:bank" },
    ],
  },
  {
    name: "navigation.procurement",
    icon: "ph:shopping-bag",
    isOpen: true,
    submenu: [
      { link: "/procurement/vendors", name: "navigation.vendors", icon: "ph:storefront" },
      { link: "/procurement/distributors", name: "navigation.distributors", icon: "ph:truck" },
      { link: "/procurement/local-suppliers", name: "navigation.localSuppliers", icon: "ph:handshake" },
      { link: "/procurement/showrooms", name: "navigation.showRooms", icon: "ph:buildings" },
      { link: "/procurement/purchase-orders", name: "navigation.purchaseOrders", icon: "ph:shopping-cart" },
      { link: "/procurement/rfq", name: "navigation.rfq", icon: "ph:files" },
      { link: "/procurement/statistics", name: "navigation.statistics", icon: "ph:chart-bar" },
    ],
  },
  { link: "/reports", name: "navigation.report", icon: "IconReport", submenu: false, isOpen: false },
  {
    name: "navigation.settings",
    icon: "ph:gear-bold",
    isOpen: false,
    role: "VIEW_SETTINGS", // Higher permission
    submenu: [
      { link: "/settings/integrations", name: "navigation.integrations", icon: "ph:plugs-connected-bold" },
      { link: "/settings/audit-logs", name: "navigation.auditLogs", icon: "ph:fingerprint-bold" },
      { link: "/roles", name: "navigation.rolesAccess", icon: "ph:shield-check-bold" },
      { link: "/roles/add-role", name: "navigation.addNewRole", icon: "ph:plus-circle-bold" },
      { link: "/staff", name: "navigation.staffManagement", icon: "ph:users-bold" },
      { link: "/staff/add-staff", name: "navigation.addNewStaff", icon: "ph:user-plus-bold" },
      { link: "/admin/tests", name: "navigation.qaCenter", icon: "ph:test-tube-bold" },
      { link: "/test", name: "navigation.permissionsHub", icon: "ph:key-bold" },
    ],
  },
];

const defaultOpenMenus = menu
  .map((item, index) => (item.isOpen ? `${index + 1}` : null))
  .filter(Boolean) as string[];

function openNav() {
  fullNav.value = !fullNav.value;
  if (mobile.value) hideNav.value = !hideNav.value;
}
</script>

<style lang="scss" scoped>
.sidebar-glass {
  @include glass-sidebar-bg;
  transition: width 0.3s ease-in-out, background 0.3s ease;
}


.submenu-icon {
  color: #7849ff;
  transition: all 0.3s ease;
  
  :global(body.light-theme) & {
    color: #6a3ae0;
  }
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
  height: 24px !important;
  margin-left: -5px !important;
  display: inline-block;
  vertical-align: middle;
}

[dir='rtl'] .myicon {
  margin-left: 5px !important;
  margin-right: -5px !important;
}

.el-menu--collapse {
  width: calc(var(--el-menu-icon-width) + var(--el-menu-base-level-padding) * 2.5) !important;
}
</style>