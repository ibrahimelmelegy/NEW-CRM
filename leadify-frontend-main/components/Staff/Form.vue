<template lang="pug">
el-form(autocomplete="off" @submit.prevent='onSubmit' ref="myForm" label-position="top" :validationSchema="formSchema")
  slot
  .glass-card.m-auto.p-10(class="2xl:w-1/2 w-[90%]")
    //- Profile Picture
    .form-section
      .form-section-header
        .section-icon: Icon(name="ph:camera-bold" size="20")
        div
          .section-title Profile Picture
      .upload-img-staff.flex.items-center.gap-3
        InputUploadImage(name="profilePicture" type="image" sizeLook="small" :value="data?.profilePicture" :isEdit="route.path.includes('edit')" model="USER")
        .label
          .flex.items-center.gap-2.font-medium.mb-1
            p(style="color: var(--color-text-primary)") {{ $t('staff.form.uploadImage') }}
            span.text-xs(style="color: var(--color-text-tertiary)") {{ $t('staff.form.optional') }}
          span.text-xs(style="color: var(--color-text-disabled)") {{ $t('staff.form.imageHint') }}

    //- Personal Information
    .form-section
      .form-section-header
        .section-icon: Icon(name="ph:user-bold" size="20")
        div
          .section-title Personal Information
      .grid.grid-cols-2.gap-4
        InputText(:label="$t('staff.form.fullName')" name="name" :value="data?.name")
        InputText(:label="$t('staff.form.email')" name="email" :value="data?.email" @value="val=> isEmail = !!val")
        InputPhone(:label="$t('staff.form.phone')" name="phone" @value="val=> isPhone = !!val" :value="data?.phone" @validphone="val=> validPhone = val" mode="international")
        InputSelect(:label="$t('staff.form.role')" :placeholder="$t('staff.form.selectRole')" name="roleId" :options="mappedRoles" :value="data?.roleId")

    //- Account Settings
    .form-section
      .form-section-header
        .section-icon: Icon(name="ph:shield-check-bold" size="20")
        div
          .section-title Account Settings
      .grid.grid-cols-2.gap-4
        InputSelect(:label="$t('staff.form.status')" name="status" :options="staffStatuses" :value="data?.status" v-if="editMode")
        InputText(:class="{'col-span-2': !editMode}" :label="$t('staff.form.password')" name="password" type="password" :value="data?.password")
</template>

<script lang="ts" setup>
import { useForm } from 'vee-validate';
import * as yup from 'yup';
import isEmailValidator from 'validator/lib/isEmail';
const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const props = defineProps({
  loading: Boolean,
  editMode: Boolean,
  label: String,
  data: {
    type: Object,
    required: false
  }
});

const emit = defineEmits(['submit']);
const validPhone = ref(true);
const isEmail = ref(false);
const isPhone = ref(false);
const isOtherSource = ref(false);

const formSchema = yup.object({
  name: yup.string().trim().required().min(2).max(100).label(t('staff.form.fullName')),
  email: yup
    .string()
    .email()
    .max(100)
    .required('At least one of email or phone number is required')
    .test(
      'is-valid',
      (message: any) => 'Invalid email',
      (value: any) => (value ? isEmailValidator(value) : new yup.ValidationError('Invalid value'))
    )
    .label(t('staff.form.email')),
  phone: yup
    .number()
    .nullable() // Allows the value to be null
    .transform((value: any, originalValue: any) => (originalValue === '' ? null : Number.isNaN(value) ? null : value))
    .label(t('staff.form.phone'))
    .test('Phone number', 'Invalid Phone', function (value: any) {
      if (value === null || value === undefined) {
        return true;
      }
      return !!validPhone.value;
    }),
  roleId: yup.string().trim().required().max(100).label(t('staff.form.role')),
  status: yup.string().when([], {
    is: () => props.editMode,
    then: () => yup.string().trim().required().max(100).label(t('staff.form.status')),
    otherwise: () => yup.string().nullable().trim().max(100).label(t('staff.form.status'))
  }),
  password: yup
    .string()
    .required()
    .label(t('staff.form.password'))
    .matches(/^\S*$/, 'Password cannot contain spaces') // No spaces allowed
    .matches(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter') // At least one lowercase
    .matches(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter') // At least one uppercase
    .matches(/^(?=.*[~`!@#$%^&*()_\-+=[\]{}|;':",.<>?/])/, 'Password must contain at least one special character') // At least one special character
    .matches(/^(?=.*\d)/, 'Password must contain at least one number') // At least one number
    .matches(/^[~`!@#$%^&*()_\-+=[\]\\{}|;':",.<>?/a-zA-Z0-9]+$/, 'Password should only contain valid English characters') // Valid characters
    .min(8, 'Password must be at least 8 characters long.') // Minimum length
    .max(50, 'Password must not exceed 50 characters') // Maximum length
});

const { handleSubmit } = useForm({
  validationSchema: formSchema
});

const onSubmit = handleSubmit((values: any, actions: any) => {
  const formatedValues = cleanObject({
    ...values,
    status: props.editMode ? values.status : ''
  });
  emit('submit', formatedValues);
});

const mappedRoles = ref<{ label: string; value: any }[]>();
//  Get roles
const repsonse = await useApiFetch('role');
// Map clients to Select Options
mappedRoles.value = repsonse.body?.docs?.map((e: any) => ({
  label: e.name,
  value: e.id
}));
</script>
