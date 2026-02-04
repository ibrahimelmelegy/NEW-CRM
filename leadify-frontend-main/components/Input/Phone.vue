<template lang="pug">
el-form-item(:label="label"  :error='errorMessage' class="!mb-6")
  vue-tel-input.form-control.w-full( :disabled="disabled" v-model="phoneNumber"  :inputOptions="{type : 'tel', placeholder: placeholder ? placeholder : 'enter' + label}"  :dropdownOptions="{showSearchBox : true , showFlags:true , showDialCodeInSelection: true , showDialCodeInList: true }"   @validate="validatecode"   :validCharactersOnly="true"  placeholder="12 123 45 67"  mode="international"  @input="handleChange" @blur="handleBlur"  :class="{'is-invalid': errorMessage, valid: meta.valid , 'p-invali-input': errorMessage  }"  defaultCountry="EG")
</template>

<script setup lang="ts">
import { useField } from 'vee-validate';
import { object } from 'yup';
const phoneNumber = ref();
const props = defineProps({
  type: {
    type: String,
    default: 'text',
  },
  value: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  successMessage: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  mask: {
    type: String,
    default: '',
  },
  labelStyle: {
    type: Object,
    default: {},
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  padding: {
    type: Number,
    default: 0.5,
  },
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
  placeholder: 'phonePlaceholder',
});
const {
  value: inputValue,
  errorMessage,
  handleBlur,
  handleChange,
  meta,
} = useField(name, undefined, {
  initialValue: props.value,
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
  
  /* Default: Dark Mode */
  background-color: rgba(30, 18, 48, 0.6) !important;
  border: 1px solid rgba(168, 85, 247, 0.3) !important;
  
  &:hover {
    border-color: #a855f7 !important;
  }
  
  &:focus-within {
    border-color: #a855f7 !important;
    box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.2) !important;
  }
}

/* Input Field */
.vti__input {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  color: #f8fafc !important;
  font-size: 14px !important;
  padding-left: 12px !important;
  
  &::placeholder {
    color: #a78bfa !important;
    opacity: 0.7 !important;
  }
}

/* Dropdown Button (Flag Section) */
.vti__dropdown {
  background: transparent !important;
  border-radius: 0 !important;
  padding: 0 12px !important;
  border-right: 1px solid rgba(168, 85, 247, 0.2) !important;
  
  &:hover {
    background-color: rgba(168, 85, 247, 0.1) !important;
  }
}

/* Country List Dropdown */
.vti__dropdown-list {
  z-index: 9999 !important;
  position: absolute !important;
  border-radius: 1rem !important;
  padding: 12px !important;
  background-color: #1e1230 !important;
  border: 1px solid rgba(168, 85, 247, 0.3) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
}

.vti__dropdown-item {
  padding: 8px 12px !important;
  border-radius: 8px !important;
  color: #f3e8ff !important;
  
  &:hover, &.highlighted {
    background-color: rgba(168, 85, 247, 0.2) !important;
  }
  
  strong, span {
    color: #f3e8ff !important;
  }
}

.vti__search_box {
  width: 100% !important;
  border-radius: 8px !important;
  background-color: rgba(30, 18, 48, 0.8) !important;
  border: 1px solid rgba(168, 85, 247, 0.2) !important;
  color: #f8fafc !important;
  margin-bottom: 8px !important;
  padding: 8px 12px !important;
}

/* ============================================
   LIGHT MODE OVERRIDES
   ============================================ */
html.light-mode .vue-tel-input,
body.light-theme .vue-tel-input {
  background-color: rgba(255, 255, 255, 0.9) !important;
  border-color: rgba(0, 0, 0, 0.1) !important;
  
  &:hover, &:focus-within {
    border-color: #7c3aed !important;
  }
  
  &:focus-within {
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.15) !important;
  }
}

html.light-mode .vti__input,
body.light-theme .vti__input {
  color: #1f1f1f !important;
  
  &::placeholder {
    color: #9e9e9e !important;
  }
}

html.light-mode .vti__dropdown,
body.light-theme .vti__dropdown {
  border-right-color: rgba(0, 0, 0, 0.08) !important;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.03) !important;
  }
}

html.light-mode .vti__dropdown-list,
body.light-theme .vti__dropdown-list {
  background-color: #ffffff !important;
  border-color: rgba(0, 0, 0, 0.1) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
}

html.light-mode .vti__dropdown-item,
body.light-theme .vti__dropdown-item {
  color: #1f1f1f !important;
  
  &:hover, &.highlighted {
    background-color: rgba(0, 0, 0, 0.05) !important;
  }
  
  strong, span {
    color: #1f1f1f !important;
  }
}

html.light-mode .vti__search_box,
body.light-theme .vti__search_box {
  background-color: #f5f5f5 !important;
  border-color: rgba(0, 0, 0, 0.1) !important;
  color: #1f1f1f !important;
}

/* Error State */
.el-form-item.is-error {
  .vue-tel-input {
    border-color: #ef4444 !important;
  }
}
</style>
