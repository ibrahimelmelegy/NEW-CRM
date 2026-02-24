<template lang="pug">
    div
     .flex.items-center.justify-center(style="flex-direction: column; ")
      .flex.items-center.justify-between.mb-8.gap-2(class="w-[75%]")
        .title.font-bold.text-2xl.capitalize {{ $t('notifications.title') }}
        .title.font-medium.text-lg.capitalize(v-if="unreadNotificationsCount == 0" style="color: var(--color-primary); cursor: pointer") {{ $t('notifications.markAllRead') }}
        .title.font-medium.text-lg.capitalize(v-if="unreadNotificationsCount > 0" style="color: var(--color-status-error, #ef4444); cursor: pointer" @click="readNotifications") {{ $t('notifications.markingUnread') }} {{unreadNotificationsCount}}
      .notify.glass-card(class="h-[75vh] mb-2 p-[16px]")
       el-icon.is-loading(:size="32" v-if="isLoading" style="color: var(--accent-color, #7849ff)")
       el-empty(v-if="finalData?.length ==  0 || !finalData " :description="$t('notifications.noData')" image="/images/emptyNotify.png")
       .item.flex.flex-wrap.gap-2.items-center.justify-center(v-else-if="finalData && finalData?.length > 0")
         .w-full.my-2.p-2(v-for="notify in finalData" :key="notify?.id" :class="`item-data_${notify?.read}`" @click="() => readNotification(notify)")
            .flex.justify-between.items-center
             div.flex.gap-2
                Icon.p-2(name="IconRestore" class="text-[35px]" :class="`icon_${notify?.read}`"  )
                div
                 span {{notify?.body_ar}}
                 p.text-xs.mb-4.font-medium(style="color: var(--text-muted)") {{ notify?.createdAt }}
             div.rounded-full.bg-red-500.w-2.h-2(v-if="notify?.read == 'UN_READ'")
       .pagination.mt-auto.flex.items-center.flex-wrap.gap-2.px-6(class="sm:justify-between justify-center" v-if="!withoutPagination ")
         .flex.items-center.gap-3
           span.text-sm(style="color: var(--text-muted)") {{ $t('notifications.show') }}
             el-select(size="medium"  v-model="limit" :placeholder="limit"  style="width: 65px" @change="handleSizeChange")
               el-option( v-for="item in [10,25,50]" :key="item" :label="item" :value="item" )
               span.text-sm(style="color: var(--text-muted)") {{ $t('notifications.entries') }}
           el-pagination( background style="direction:ltr"  :pager-count="4"  :page-count="pagintaion?.totalPages" v-model:current-page='currentPage' :page-size='limit'  layout=' prev, pager, next' :total='pagintaion?.totalItems' )
</template>
<script setup lang="ts">
const limit = ref(10);
const isLoading = ref(false);
const currentPage = ref<number>(1);
const pagintaion = ref<any>({});
const filters = ref<any>({});
const finalData = ref<any>([]);
const unreadNotificationsCount = ref(0);

const response = await useTableFilter('notification');

pagintaion.value = response?.pagination;
finalData.value = response?.formattedData || [];
unreadNotificationsCount.value = response?.unreadNotificationsCount;

async function getData() {
  isLoading.value = true;
  const data = await useTableFilter('notification', filters.value);
  finalData.value = data.formattedData;
  pagintaion.value = data.pagination;
  isLoading.value = false;
  unreadNotificationsCount.value = data?.unreadNotificationsCount;
}

let intervalId: any;

const startPolling = () => {
  if (intervalId) return;
  intervalId = setInterval(() => {
    if (document.visibilityState === 'visible') {
      getData();
    }
  }, 15000);
};

const stopPolling = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

onMounted(() => {
  startPolling();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      getData();
      startPolling();
    } else {
      stopPolling();
    }
  });
});

onBeforeUnmount(() => {
  stopPolling();
});

const readNotifications = async () => {
  try {
    await readAll();
  } finally {
    getData();
  }
};

const readNotification = async (data: any) => {
  try {
    let typeAssign = data.type.split('_')[0]?.split(' ')?.[0].toLowerCase();
    typeAssign !== 'opportunity' ? (typeAssign = `${typeAssign}s`) : typeAssign;
    const path = `${typeAssign !== 'projects' ? 'sales' : 'operations'}/${typeAssign}/${data.target}`;

    await read(data.id, path);
  } finally {
  }
};

const handleSizeChange = (val: any) => {
  filters.value.limit = val;
  getData();
};

watch(
  () => currentPage.value,
  () => {
    filters.value.page = currentPage.value;
    getData();
  }
);
</script>

<style lang="scss" scoped>
.notify {
  border-bottom: 1px solid var(--border-default);
  border-radius: 24px;
  width: 70%;
  display: flex;
  flex-direction: column;
  padding: 10px;

  @media screen and (max-width: 768px) {
    width: 100%;
  }
}

.item {
  flex-direction: row;
  height: 60vh;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  cursor: pointer;
}

.item-data_UN_READ {
  background-color: var(--bg-hover);
  border-radius: 20px;
}

.item-data_READ {
  background-color: var(--bg-card);
  border-radius: 20px;
}

.icon_READ {
  background-color: var(--color-primary-alpha-10);
  border-radius: 50%;
  color: var(--color-primary);
}

.icon_UN_READ {
  background-color: var(--color-warning-alpha-10);
  border-radius: 50%;
  color: var(--color-warning);
}
</style>
