<template lang="pug">
.relative
  el-skeleton(:loading="isLoading", animated)
    template(#template)
      .grid.grid-cols-4.gap-4.grid-cols-1(class="md:grid-cols-2 lg:grid-cols-4")
        .rounded-3xl.m-3.p-5.glass-card(v-for="i in 4", :key="i")
          .text-neutral-600
            .flex.flex-row.justify-between
              el-skeleton-item(
                variant="image",
                style="width: 40px; height: 40px"
              )
              el-skeleton-item(
                variant="button",
                style="width: 30px; height: 30px"
              )
            el-skeleton-item(variant="text", style="width: 60%")
            el-skeleton-item(variant="text", style="width: 30%")
    template(#default)
      .grid.grid-cols-4.gap-4.grid-cols-1(
        v-if="project?.files",
        class="md:grid-cols-2 lg:grid-cols-4"
      )
        .rounded-3xl.m-3.p-5.glass-card(
          v-for="(folder, index) in project?.files",
          :key="index"
        )
          .text-neutral-600.p-2
            .flex.flex-row.justify-between
              img.mb-4.transition-transform.duration-300.cursor-pointer(
                src="/images/Folder.png",
                alt="folder",
                @click="showfile(folder?.refs)", 
                style="cursor: pointer",
                class="hover:scale-110 hover:brightness-110"
              )
              el-dropdown(trigger="click")
                span.el-dropdown-link
                  button.rounded-btn(class="!px-1"): Icon(name="IconToggle", size="20")
                template(#dropdown)
                  el-dropdown-menu
                    el-dropdown-item(@click="editfile(folder)")
                      .flex.items-center
                        Icon.text-md.mr-2(name="IconEdit")
                        p.text-sm {{ $t('common.edit') }}
                    el-dropdown-item(@click="showfile(folder?.refs)")
                      .flex.items-center
                        Icon.text-md.mr-2(name="IconEye")
                        p.text-sm {{ $t('common.view') }}
                    el-dropdown-item(@click="deleteFolder(index)")
                      .flex.items-center
                        Icon.text-md.mr-2(size="20", name="IconDelete")
                        p.text-sm {{ $t('common.delete') }}
            .mt-2
              .text-2xl.font-bold.mb-1.truncate(
                @click="showfile(folder?.refs)",
                style="cursor: pointer",
                class="hover:text-primary-purple-500 transition-colors duration-200"
              ) {{ folder?.name }}
              .flex.items-center.gap-1
                Icon(name="mdi:file-document-outline", size="18", class="text-gray-500")
                span.text-lg.text-gray-500 {{ folder?.refs?.length }} Files
      el-empty(
        v-else,
        :description="$t('common.noData')",
        image="/images/empty.png"
      )
el-dialog(
  v-model="fileEdit",
  class="!shadow-none xl:!w-[50%] lg:!w-[70%] sm:!w-[90%] !w-full",
  align-center="",
  @close="handleCancel"
)
  .title.font-bold.text-xl.capitalize {{ $t('operations.projects.details.projectFolders') }}
  OperationsProjectsFolders(
    @onSubmit="handleSubmit",
    @onCancel="handleCancel",
    :project="project",
    :folder="folderDetails",
    :editMode="true"
  )

el-dialog(
  v-model="fileShow",
  class="!shadow-none xl:!w-1/3 lg:!w-1/3 sm:!w-[90%] !w-full",
  align-center=""
)
  .flex-1.glass-card.rounded-3xl(v-if="fileFolder?.length")
    .flex.items-center.gap-3.mb-6
      .flex.items-center.justify-center.w-12.h-12.rounded-full.bg-secondary-turquoise-50.text-secondary-turquoise-700(
        class="!min-w-[48px] !min-h-[48px]"
      ): Icon(
        name="mdi:file-outline",
        size="24"
      )
      h4.text-lg.font-semibold.text-neutral-900 Documents
    .flex.gap-4.flex-wrap.items-center
      |
      |
      |
      |
      |
      button.glass-card.border.rounded-lg.p-4.flex.items-center.space-x-4(
        @click="downloadFile(`assets/${file}`, file)",
        v-for="file in fileFolder",
        :key="file"
      )
        img(:src="`/images/files/${file?.split('.').pop()}.svg`", size="40")
        p.text-gray-800.font-medium {{ file }}
        Icon.text-neutral-500.ml-auto(name="solar:download-bold")
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';
import { ElMessageBox } from 'element-plus';
interface Project {
  id: string;
  files: Record<string, unknown>[];
  etimadProject?: unknown;
}
const props = defineProps<{ project?: Project }>();
const emit = defineEmits(['onSubmit', 'onCancel']);

const fileShow = ref(false);
const fileFolder = ref();
const fileEdit = ref(false);
const folderDetails = ref();
const isLoading = ref(true);

// Add onMounted hook to handle initial loading
onMounted(() => {
  // Simulate loading time or wait for actual data
  setTimeout(() => {
    isLoading.value = false;
  }, 500);
});

// Update loading state when project changes
watch(
  () => props.project,
  () => {
    isLoading.value = true;
    setTimeout(() => {
      isLoading.value = false;
    }, 500);
  },
  { deep: true }
);

function showfile(value: unknown) {
  fileShow.value = true;
  fileFolder.value = value;
}

function editfile(value: unknown) {
  folderDetails.value = { ...value };
  fileEdit.value = true;
}

function formattedBasicInfo(values: unknown) {
  if (!values) return {};
  return cleanObject({
    name: values?.name,
    type: values?.type,
    category: values?.category,
    clientId: values?.clientId,
    startDate: typeof values?.startDate === 'string' ? values?.startDate : values?.startDate?.toISOString(),
    endDate: typeof values?.endDate === 'string' ? values?.endDate : values?.endDate?.toISOString(),
    duration: Number(values?.duration),
    assignedUsersIds: values?.assignedUsers?.map(el => el?.id),
    status: values?.status,
    description: values?.description,
    cancelledReason: values?.cancelReason
  });
}

function formattedEtimadProjectInfo(values: unknown) {
  if (!values) return {};
  return cleanObject({
    abbreviation: values?.abbreviation,
    organizationName: values?.organizationName,
    rfpName: values?.rfpName,
    contractType: values?.contractType,
    tenderPrice: Number(values?.tenderPrice),
    businessLine: values?.businessLine,
    estimatedBudget: Number(values?.estimatedBudget),
    companyMargin: Number(values?.companyMargin),
    submissionDate: typeof values?.submissionDate === 'string' ? values?.submissionDate : values?.submissionDate?.toISOString(),
    proposalStatus: values?.proposalStatus,
    applicationStatus: values?.applicationStatus
  });
}

async function deleteFolder(index: number) {
  try {
    await ElMessageBox.confirm('Are you sure you want to delete this folder?', 'Warning', {
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      type: 'warning'
    });
  } catch {
    return; // User cancelled
  }
  const data = [...(props?.project?.files || [])];
  data.splice(index, 1);
  const basicInfo = formattedBasicInfo(props?.project);
  const etimadInfo = formattedEtimadProjectInfo(props?.project?.etimadProject);

  const projectInfo = {
    basicInfo: {
      ...basicInfo,
      ...(props?.project?.etimadProject && { etimadInfo }),
      files: data
    }
  };
  await updateProject({
    basicInfo: projectInfo?.basicInfo,
    projectId: props?.project?.id
  });
  emit('onSubmit');
}

const handleSubmit = () => {
  fileEdit.value = false;
  folderDetails.value = null;
  emit('onSubmit');
};

const handleCancel = () => {
  fileEdit.value = false;
  folderDetails.value = null;
  emit('onSubmit');
};
</script>

<style>
.el-dropdown__popper {
  margin-top: -40px !important;
}
</style>
