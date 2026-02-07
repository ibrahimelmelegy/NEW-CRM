<template lang="pug">
el-form(  autocomplete="off"   @submit.prevent='onSubmit'   ref="myForm" label-position="top"  :validationSchema="formSchema" )
  slot
  div(class="p-10  card m-auto glass-card rounded-3xl")
    InputText(:label="$t('role.form.name')" name="name" :placeholder="$t('role.form.enterName')" :value="data?.name" )
    InputText.mt-6(type="textarea" :label="$t('role.form.description') + ' ' + $t('role.form.optional')" :placeholder="$t('role.form.enterDescription')"  name="description" :value="data?.description" )
</template>

<script lang="ts" setup>
  import { useForm } from "vee-validate";
  import * as yup from "yup";
  import { useI18n } from "vue-i18n";
  const { t } = useI18n();
  const router = useRouter();
  const props = defineProps({
    loading: Boolean,
    label: String,
    data: {
      type: Object,
      required: false,
    },
  });

  const emit = defineEmits(["submit"]);

  const formSchema = yup.object({
    name: yup.string().trim().required().min(2).max(100).label(t('role.form.name')),
    description: yup
      .string()
      .trim()
      .nullable()
      .test("min-length-if-entered", t('role.form.descriptionHint'), (value: any) => !value || value.length >= 2)
      .trim()
      .max(2000)
      .label(t('role.form.description')),
  });

  const { handleSubmit } = useForm({
    validationSchema: formSchema,
  });

  const onSubmit = handleSubmit((values: any, actions: any) => {
    emit("submit", values);
  });
</script>
