<template lang="pug">
el-form-item(:label="label"  :error='errorMessage' class="!mb-6")
  vue-tel-input.form-control.w-full( :disabled="disabled" v-model="phoneNumber"  :inputOptions="{type : 'tel', placeholder: placeholder ? placeholder : $t('common.enter') + label}"  :dropdownOptions="{showSearchBox : true , showFlags:true , showDialCodeInSelection: true , showDialCodeInList: true }"   @validate="validatecode"   :validCharactersOnly="true"  placeholder="12 123 45 67"  mode="international"  @input="handleChange" @blur="handleBlur"  :class="{'is-invalid': errorMessage, valid: meta.valid , 'p-invali-input': errorMessage  }"  defaultCountry="EG")
</template>

<script setup lang="ts">
import { useField } from 'vee-validate';
import { object } from 'yup';
const phoneNumber = ref();
const props = defineProps({
  type: {
    type: String,
    default: 'text'
  },
  value: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  successMessage: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  mask: {
    type: String,
    default: ''
  },
  labelStyle: {
    type: Object,
    default: {}
  },
  disabled: {
    type: Boolean,
    default: false
  },
  padding: {
    type: Number,
    default: 0.5
  }
});
const emit = defineEmits(['validphone', 'value']);
const name = toRef(props, 'name');
const validphone = ref(true);
const errorPhone = ref('');

const validPhone = ref(true);

function validatecode(event: any, submit: any) {
  if (event) {
    validPhone.value = event.valid;
    emit('validphone', validPhone.value);
  }
}

const tels = ref({
  placeholder: 'phonePlaceholder'
});
const {
  value: inputValue,
  errorMessage,
  handleBlur,
  handleChange,
  meta
} = useField(name, undefined, {
  initialValue: props.value
});
watch(
  () => props.value,
  () => {
    if (props.value) {
      inputValue.value = props.value;
      phoneNumber.value = inputValue.value;
    }
  }
);
phoneNumber.value = inputValue.value;

watch(
  () => phoneNumber.value,
  () => {
    emit('value', phoneNumber.value);
  }
);
</script>

<style lang="scss">
/* ============================================
   PHONE INPUT - UNIFIED DARK/LIGHT STYLING
   ============================================ */
.vue-tel-input {
  border-radius: 1rem !important;
  height: 52px !important;
  transition: all 0.3s ease !important;
  display: flex !important;
  align-items: center !important;
  /* overflow: hidden !important;  <-- REMOVED THIS to allow dropdown to show */
  position: relative !important; /* Ensure dropdown positions correctly */

  /* Default: Uses CSS Variables */
  background-color: var(--color-neutral-background-1) !important;
  border: 1px solid var(--color-border-default) !important;

  &:hover {
    border-color: var(--color-primary) !important;
  }

  &:focus-within {
    border-color: var(--color-primary) !important;
    box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.2) !important;
  }
}

/* Input Field */
.vti__input {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  color: var(--color-text-primary) !important;
  font-size: 14px !important;
  padding-left: 12px !important;

  &::placeholder {
    color: var(--color-text-disabled) !important;
    opacity: 0.7 !important;
  }
}

/* Dropdown Button (Flag Section) */
.vti__dropdown {
  background: transparent !important;
  border-radius: 0 !important;
  padding: 0 12px !important;
  border-right: 1px solid var(--color-border-subtle) !important;

  &:hover {
    background-color: var(--color-surface-hover) !important;
  }
}

/* Country List Dropdown */
.vti__dropdown-list {
  z-index: 9999 !important;
  position: absolute !important;
  border-radius: 1rem !important;
  padding: 12px !important;
  background-color: var(--color-neutral-background-2) !important;
  border: 1px solid var(--color-border-default) !important;
  box-shadow: var(--elevation-shadow-16) !important;
}

.vti__dropdown-item {
  padding: 8px 12px !important;
  border-radius: 8px !important;
  color: var(--color-text-primary) !important;

  &:hover,
  &.highlighted {
    background-color: var(--color-surface-hover) !important;
  }

  strong,
  span {
    color: var(--color-text-primary) !important;
  }
}

.vti__search_box {
  width: 100% !important;
  border-radius: 8px !important;
  background-color: var(--color-neutral-background-1) !important;
  border: 1px solid var(--color-border-subtle) !important;
  color: var(--color-text-primary) !important;
  margin-bottom: 8px !important;
  padding: 8px 12px !important;
}

/* Error State */
.el-form-item.is-error {
  .vue-tel-input {
    border-color: #ef4444 !important;
  }
}
</style>
