<template lang="pug">
.relative.inline-block
  .toggle-indicator.cursor-pointer.flex.items-center.justify-center.absolute.rounded-full.w-9.h-9.z-100.glass-card(@click="openNav" v-if="!mobile" :class="{ 'left-full -translate-x-1/2' : true }" class="top-[50px] z-20")
    Icon(:name="fullNav ? 'ph:caret-left-bold' : 'ph:caret-right-bold'" size="18" class="text-[var(--text-primary)]")

  div.background-overlay.fixed.top-0.left-0.w-screen.h-full(class='z-[-1]' v-if="mobile && !hideNav" @click="hideNav = true")
  transition(:name='mobile ? "side" : "none"')
    el-menu.el-menu-vertical-demo.relative.sidebar-glass(class='!pl-[5px] h-[100vh] card-auto ' :class="{'overflow-x-hidden' : !fullNav }" v-if="mobile ? !hideNav : true" :collapse='mobile ? false : !fullNav' :default-openeds="defaultOpenMenus")
      .py-5.px-12.flex.items-center.gap-3(v-if="fullNav")
        img(class="cursor-pointer max-h-[50px] w-auto object-contain" :src="logoSrc" @click="router.push('/')")
      .py-5.px-5.flex.items-center.gap-3.relative.z-10(v-if="!fullNav")
        img(class="cursor-pointer h-[50px] w-auto object-contain" src="/images/logo-shape.png" @click="router.push('/')")
      template(v-for="(navLink, index) in menu")
        el-sub-menu(:index='`${index+1}`' v-if="navLink.submenu")
          template(#title)
            div
              Icon.myicon(size="32" :name="navLink.icon")
            .mr-2
            span {{navLink.name}}
          div(v-for="(subLink, subIndex) in navLink.submenu")
            NuxtLink(:to="subLink.link" v-if="subLink.link == '/operations/daily-task' && user?.id == 1")
              el-menu-item(:index="subLink.link" @click="mobileNavigate(subLink.link)" :class="{'is-active': route?.fullPath?.includes(subLink.link) && subLink.link == '/'}")
                 Icon.mr-2(size="18" :name="subLink.icon" v-if="subLink.icon" style="color: var(--accent-purple)")
                 span {{subLink.name}}
            el-menu-item(:index="`${index+1}-${subIndex+1}`" :class="{'disabled-link' : getDisabled(subLink.role)}" v-else-if="getDisabled(subLink.role) && subLink.link !== '/operations/daily-task'")
                 Icon.mr-2(size="18" :name="subLink.icon" v-if="subLink.icon" style="color: var(--accent-purple)")
                 span {{subLink.name}}
            NuxtLink(:to="subLink.link" v-else-if="subLink.link !== '/operations/daily-task'")
              el-menu-item(:index="subLink.link" @click="mobileNavigate(subLink.link)" :class="{'is-active': route?.fullPath?.includes(subLink.link) && subLink.link !== '/'}")
                 Icon.mr-2(size="18" :name="subLink.icon" v-if="subLink.icon" style="color: var(--accent-purple)")
                 span {{subLink.name}}
        template(v-else)
          el-menu-item(:index='`${index+1}`' :class="{'disabled-link': getDisabled(navLink.role)}" v-if="navLink.link !== '/' && getDisabled(navLink.role)")
            el-icon
              Setting
            template(#title) {{navLink.name}}
          NuxtLink(:to="navLink.link" v-else)
            el-menu-item(:index="navLink.link" @click="mobileNavigate(navLink.link)" :class="{'is-active': route?.fullPath?.includes(navLink.link) && navLink.link !== '/'}")
              Icon.myicon.mr-2(size="32" :name="navLink.icon")
              template(#title) {{navLink.name}}


</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { storeToRefs } from "pinia";
import { useMain } from "~/stores/common";

import { Document, Menu as IconMenu, Location, Setting } from "@element-plus/icons-vue";
const mainStore = useMain();
const { fullNav, mobile, hideNav } = storeToRefs(mainStore);
const { permissions } = storeToRefs(mainStore);
const route = useRoute();
const router = useRouter();
const user = ref();

const response = await useApiFetch("auth/me");
user.value = response?.user;

const logoSrc = computed(() => {
  return mainStore.isLight ? '/images/Logo.png' : '/images/lOGO-DARDK-MODE.png';
});

function mobileNavigate(link: string) {
  if (mobile.value) {
    hideNav.value = true;
  }
}

function getDisabled(role: string) {
  if (permissions.value && Array.isArray(permissions.value) && permissions.value.length) {
    if (!role) return false; 
    return !(permissions.value as string[])?.includes(role);
  } else {
    return false;
  }
}

const menu = [
  {
    link: "/",
    name: "Board",
    icon: "IconHome",
    submenu: false,
    isOpen: false, // New property
  },
  {
    submenu: [
      {
        link: "/sales/leads",
        name: "Leads",
        icon: "ph:users-three",
      },
      {
        link: "/sales/clients",
        name: "Clients",
        icon: "ph:briefcase",
      },
      {
        link: "/sales/opportunity",
        name: "Opportunity",
        icon: "ph:lightbulb",
      },
      {
        link: "/sales/deals",
        name: "Deals",
        icon: "ph:handshake",
      },
      {
        link: "/sales/proposals",
        name: "Proposals",
        icon: "ph:file-text",
      },
    ],
    name: "Sales",
    icon: "IconSales",
    isOpen: true, // Open this submenu
  },
  {
    submenu: [
      {
        link: "/operations/projects",
        name: "Projects",
        icon: "ph:projector-screen-chart",
      },
      {
        link: "/operations/daily-task",
        name: "Daily Tasks",
        icon: "ph:check-square",
      },
      {
        link: "/operations/vehicle",
        name: "Vehicle",
        icon: "ph:car",
      },
      {
        link: "/operations/manpower",
        name: "Manpower",
        icon: "ph:users-four",
      },
      {
        link: "/operations/additional-material",
        name: "Additional Materials",
        icon: "ph:cube",
      },
      {
        link: "/operations/services",
        name: "Services",
        icon: "ph:wrench",
      },
      {
        link: "/operations/assets",
        name: "Assets",
        icon: "ph:bank",
      },
    ],
    name: "Operations",
    icon: "IconOperations",
    isOpen: false, // Open this submenu
  },
  {
    link: "/roles",
    name: "Roles",
    icon: "IconRole",
    submenu: false,
    isOpen: false, // New property
  },
  {
    name: "Staff",
    icon: "IconStaff",
    link: "/staff",
    isOpen: false, // Open this submenu
  },
  {
    link: "/reports",
    name: "Report",
    icon: "IconReport",
    submenu: false,
    isOpen: false, // New property
  },
];

const defaultOpenMenus = menu
  .map((item, index) => (item.isOpen ? `${index + 1}` : null))
  .filter(Boolean);

function openNav() {
  fullNav.value = !fullNav.value;
  if (mobile.value) {
    hideNav.value = !hideNav.value;
  }
}
</script>

<style lang="scss">
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
  margin-left: -5px !important; /* Adjusted for centering */
  display: inline-block;
  vertical-align: middle;
}

[dir='rtl'] .myicon {
  margin-left: 5px !important;
  margin-right: -5px !important;
}

.el-menu--collapse {
  width: calc(
    var(--el-menu-icon-width) + var(--el-menu-base-level-padding) * 2.5
  ) !important;
}
</style>
