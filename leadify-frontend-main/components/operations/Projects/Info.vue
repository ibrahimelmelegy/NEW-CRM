<template lang="pug">
el-form( autocomplete="off"   @submit.prevent='onSubmit'   ref="myForm" label-position="top"  :validationSchema="formSchema" :key="project" )
  slot
  .glass-card.m-auto.p-8(class="!w-full max-w-[1600px]")
    .flex.items-center.gap-4.mb-8
         Icon(name="ph:pencil-simple-slash-bold" class="text-purple-400 text-2xl")
         .text-xl.font-bold.text-gradient Project Information

    //- SECTION 1: Basic Classification
    .bg-white_5.rounded-2xl.p-6.mb-6
        .text-xs.uppercase.tracking-widest.text-muted.mb-4.font-bold Classification
        .grid.grid-cols-1.md.grid-cols-3.gap-6
             InputText(label="Project Name" placeholder="e.g. Riyadh Metro Expansion" name="name" :value="project?.name" class="premium-input")
             InputSelect(label="Category" name="category" :options="projectCategories" :value="project?.category" @change="checkIfEtimadProject" class="premium-select")
             InputText(label="Project Type" placeholder="e.g. Construction" name="type" :value="project?.type" class="premium-input")

    //- SECTION 2: Client & Schedule
    .bg-white_5.rounded-2xl.p-6.mb-6
        .text-xs.uppercase.tracking-widest.text-muted.mb-4.font-bold Client & Schedule
        .grid.grid-cols-1.md.grid-cols-3.gap-6
             InputSelect(label="Client" name="client" :options="mappedClients" :value="mappedClients?.find((client: any) => client.value === project?.clientId)?.value" class="premium-select")
             InputDate(label="Start Date" placeholder="Select Date" :value="project?.startDate" name="startDate" class="premium-datepicker")
             InputDate(label="End Date" placeholder="Select Date" :value="project?.endDate" name="endDate" class="premium-datepicker")
             
             InputText(label="Duration" placeholder="Days" name="duration" :value="project?.duration" class="premium-input")
             InputSelect(label="Assign Users" isMultiple name="assignUser" :options="users" :value="users?.filter((user: any) => project?.assignedUsers?.map((user: any) => user.id)?.includes(user.value))?.map((user: any) => user.value)" class="premium-select")
             InputSelect(label="Status" name="status" :options="projectStatuses" :value="project?.status" @change="checkIfCancelled" class="premium-select")

    //- SECTION 3: Additional Details
    .bg-white_5.rounded-2xl.p-6.mb-6
        .text-xs.uppercase.tracking-widest.text-muted.mb-4.font-bold Details
        .grid.grid-cols-1.gap-6
             InputText(label="Description" type="textarea" placeholder="Detailed project scope..." name="description" :value="project?.description" class="premium-input")
             InputText(v-if="isCancelled" label="Cancellation Reason" type="textarea" placeholder="Why was this cancelled?" name="cancelReason" :value="project?.cancelledReason" class="premium-input")

    //- SECTION 4: Etimad (Conditional)
    template(v-if="isEtimadProject")
      .bg-purple-900_10.rounded-2xl.p-6.mb-6.border.border-purple-500_20
          .flex.items-center.gap-2.mb-4
              Icon(name="simple-icons:govdotuk" class="text-purple-400")
              .text-xs.uppercase.tracking-widest.text-purple-300.font-bold Etimad Details
          
          .grid.grid-cols-1.md.grid-cols-3.gap-6
            InputText(label="Abbreviation" placeholder="Short Code" name="abbreviation" :value="project?.etimadProject?.abbreviation" class="premium-input")
            InputText(label="Organization" placeholder="Org Name" name="organizationName" :value="project?.etimadProject?.organizationName" class="premium-input")
            InputText(label="RFP Name" placeholder="RFP Official Title" name="rfpName" :value="project?.etimadProject?.rfpName" class="premium-input")
            
            InputSelect(label="Contract Type" name="contractType" :options="contractTypes" :value="project?.etimadProject?.contractType" class="premium-select")
            InputText(label="Tender Price" placeholder="SAR" name="tenderPrice" :value="project?.etimadProject?.tenderPrice" class="premium-input")
            InputText(label="Business Line" placeholder="Business Line" name="businessLine" :value="project?.etimadProject?.businessLine" class="premium-input")
            
            InputText(label="Est. Budget" placeholder="SAR" name="estimatedBudget" :value="project?.etimadProject?.estimatedBudget" class="premium-input")
            InputText(label="Margin %" placeholder="%" name="companyMargin" :value="project?.etimadProject?.companyMargin" class="premium-input")
            InputDate(label="Submission Date" placeholder="Date" disabledDate="past" :value="project?.etimadProject?.submissionDate" name="submissionDate" class="premium-datepicker")
            
            InputText(label="Remaining Days" type="number" disabled name="remainingDays" :value="remainingDays" :key="remainingDays" class="premium-input !opacity-70")
            InputSelect(label="Proposal Status" name="proposalStatus" :options="proposalStatuses" :value="project?.etimadProject?.proposalStatus" class="premium-select")
            InputSelect(label="App Status" name="applicationStatus" :options="applicationStatuses" :value="project?.etimadProject?.applicationStatus" class="premium-select")

  .endBar.sticky.bottom-0.z-10.backdrop-blur-md.bg-opacity-80.p-6.border-t.border-white_10
      .flex.justify-between.w-full.mx-auto(class="max-w-[1600px]")
        el-button(size='large' plain class="premium-btn-outline px-8 !rounded-xl" @click="emit('cancel')") Cancel
        el-button(size='large' type="primary" native-type="submit" :loading="loading" :disabled="loading" class="premium-btn px-8 !rounded-xl") Next: Vehicles
</template>

<script lang="ts" setup>
  import { useForm } from "vee-validate";
  import * as yup from "yup";
  const route = useRoute();
  const router = useRouter();
  const props = defineProps({
    loading: Boolean,
    label: String,
    data: {
      type: Object,
      required: false,
    },
  });

  const activeStep = defineModel<number>({ required: true });
  const emit = defineEmits(["submit", "cancel"]);
  const isCancelled = ref(false);
  const isEtimadProject = ref(false);
  const formSchema = computed(() => {
    const baseSchema = {
      name: yup.string().trim().required().min(2).max(100).label("Project Name"),
      type: yup.string().trim().required().min(2).max(100).label("Project Type"),
      category: yup.string().trim().required().min(2).max(100).label("Category"),
      client: yup.string().nullable().trim().max(100).label("Client"),
      startDate: yup
        .date()
        .nullable()
        .notRequired()
        .typeError("Start Date must be a valid date")
        .label("Start Date"),

      endDate: yup
        .date()
        .nullable()
        .notRequired()
        .typeError("End Date must be a valid date")
        .min(yup.ref('startDate'), "End Date must be after Start Date")
        .label("End Date"),
      duration: yup
        .string()
        .required()
        .test("is-valid-number", "Please enter a valid number.", (value: any) => {
          return /^\d+$/.test(value || "");
        })
        .label("Project Duration"),
      assignUser: yup.array().of(yup.number()).required().min(1).label("Assign User"),
      status: yup.string().trim().required().label("Status"),
      description: yup.string().trim().required().min(1).max(500).label("Project Description"),
      cancelReason: yup.string().when([], {
        is: () => isCancelled.value,
        then: () => yup.string().required().min(2).max(250).label("Cancellation Reason"),
      }),
    };

    if (isEtimadProject.value) {
      return yup.object({
        ...baseSchema,
        abbreviation: yup.string().trim().required().min(2).max(100).label("Abbreviation"),
        organizationName: yup.string().trim().required().min(2).max(100).label("Organization Name"),
        rfpName: yup.string().trim().required().min(2).max(100).label("RFP Name"),
        contractType: yup.string().trim().required().min(2).max(100).label("Contract Type"),
        tenderPrice: yup
          .string()
          .nullable()
          .test("is-valid-number", "Please enter a valid number.", (value: any) => /^\d*\.?\d*$/.test(value || ""))
          .label("Tender Price"),
        businessLine: yup.string().nullable().trim().max(100).label("Business Line"),
        estimatedBudget: yup
          .string()
          .nullable()
          .test("is-valid-number", "Please enter a valid number.", (value: any) => /^\d*\.?\d*$/.test(value || ""))
          .label("Estimated Budget"),
        companyMargin: yup
          .string()
          .nullable()
          .test("is-valid-number", "Please enter a valid number.", (value: any) => /^\d*\.?\d*$/.test(value || ""))
          .test("max-value", "Value must be less than or equal to 100.", (value: any) =>
            value ? parseFloat(value) <= 100 : true
          )
          .label("Company Margin"),
        submissionDate: yup
          .mixed()
          .test("is-valid-date", "Submission Date must be a valid date", (value: any) => {
            // Check if the value is valid
            return value && !isNaN(new Date(value).getTime());
          })
          .required("Submission Date is required")
          .label("Submission Date"),
        proposalStatus: yup.string().trim().required().label("Proposal Status"),
        applicationStatus: yup.string().trim().required().label("Application Status"),
      });
    }

    return yup.object(baseSchema);
  });

  //  Get Users
  let users = await useApiFetch("users");
  // Map Users to Select Options
  users = users?.body?.docs?.map((e: any) => ({
    label: e.name,
    value: e.id,
  }));

  const mappedClients = ref<{ label: string; value: any }[]>();
  //  Get clients
  let { clients } = await getClients();
  // Map clients to Select Options
  mappedClients.value = clients?.map((e: any) => ({
    label: e.clientName,
    value: e.id,
  }));

  /**
   * Checks if the deal stage has been set to 'Cancelled'.
   */
  function checkIfCancelled(value: any) {
    if (value.value === "CANCELLED") {
      isCancelled.value = true;
    } else {
      isCancelled.value = false;
    }
  }

  if (project.value?.cancelledReason) {
    isCancelled.value = true;
  }

  /**
   * Checks if the project category has been set to 'ETIMAD Project'.
   */
  function checkIfEtimadProject(value: any) {
    if (value.label === "Etimad") {
      isEtimadProject.value = true;
    } else {
      isEtimadProject.value = false;
    }
  }

  if (project.value?.category === "Etimad") {
    isEtimadProject.value = true;
  }

  const { handleSubmit, errors, values } = useForm({
    validationSchema: formSchema,
  });

  const onSubmit = handleSubmit(async (values: CombinedProjectValues) => {
    // Prepare the project info
    const basicInfo = formattedBasicInfo(values);
    const etimadInfo = formattedEtimadProjectInfo(values);
    const projectInfo = {
      basicInfo: {
        ...basicInfo,
        ...(isEtimadProject.value && { etimadInfo }),
      },
    };

    try {
      // Attempt to create the project
      await createProject(projectInfo);
      activeStep.value++;
    } catch (error) {
      // Handle the error and prevent the step from being incremented
      console.error("Project creation failed", error);
    }
    // emit('submit')
  });

  function formattedBasicInfo(values: any) {
    if (!values) return {};
    return cleanObject({
      name: values?.name,
      type: values?.type,
      category: values?.category,
      clientId: values?.client,
      startDate: typeof values?.startDate === "string" ? values?.startDate : values?.startDate?.toISOString(),
      endDate: typeof values?.endDate === "string" ? values?.endDate : values?.endDate?.toISOString(),
      duration: Number(values?.duration),
      assignedUsersIds: values?.assignUser,
      status: values?.status,
      description: values?.description,
      cancelledReason: values?.cancelReason,
    });
  }

  function formattedEtimadProjectInfo(values: any) {
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
      submissionDate:
        typeof values?.submissionDate === "string" ? values?.submissionDate : values?.submissionDate?.toISOString(),
      proposalStatus: values?.proposalStatus,
      applicationStatus: values?.applicationStatus,
    });
  }
  function calculateRemainingDays(): number | null {
    const submissionDate = values?.submissionDate; // Example: "2025-02-13"
    const currentDate = new Date().toISOString().split("T")[0];
    if (!submissionDate || !currentDate) return null;

    // Convert input strings to Date objects
    const submission = new Date(submissionDate);
    const current = new Date(currentDate);

    // Validate date conversion
    if (isNaN(submission.getTime()) || isNaN(current.getTime())) return null;

    // Calculate difference in time (milliseconds)
    const diffTime = submission.getTime() - current.getTime();

    // Convert milliseconds to days
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Ensure remaining days are not negative
    return diffDays >= 0 ? diffDays : 0;
  }

  const remainingDays = ref(calculateRemainingDays());
  remainingDays.value = project.value?.etimadProject?.remainingDays || calculateRemainingDays();
  watch(
    () => [values.submissionDate],
    () => {
      remainingDays.value = calculateRemainingDays();
      console.log("remainingDays.value", remainingDays.value);
    },
    {
      deep: true,
    }
  );
</script>

<style scoped lang="scss">
.text-gradient {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.bg-white_5 { background: rgba(255, 255, 255, 0.05); }
.border-white_10 { border-color: rgba(255, 255, 255, 0.1); }
.bg-purple-900_10 { background: rgba(88, 28, 135, 0.1); }
.border-purple-500_20 { border-color: rgba(168, 85, 247, 0.2); }

// Consistent input styling if not fully encapsulated in InputText
.premium-input, .premium-select, .premium-datepicker {
  :deep(input), :deep(.el-input__wrapper) {
      background: rgba(255, 255, 255, 0.03) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      border-radius: 12px !important;
      box-shadow: none !important;
      color: white;
      &.is-focus, &:focus {
        border-color: var(--purple-500) !important;
      }
  }
}
</style>
