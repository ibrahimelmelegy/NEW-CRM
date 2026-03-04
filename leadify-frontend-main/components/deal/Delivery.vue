<template lang="pug">
.glass-card.m-auto.p-10(class="2xl:w-1/2 w-[90%]")
  .flex.justify-between.items-center.mb-4
    span
    el-button(size='medium' plain type="primary" :icon="Plus" native-type="button" @click="AddDelivery" class="!rounded-2xl !py-2.5 !px-4") {{ $t('deals.form.addDelivery') }}
  DealFormDelivery(
    v-for="(delivery, index) in deliveriesList"
    :key="delivery.id"
    :delivery="delivery"
    :index="index"
    ref="childRefs"
    @onDelete="onDelete(delivery.id)"
    @onSubmit="onSubmit"
    :editMode="editMode && index+1 <= props.deliveries.length"
  )
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { v4 as uuidv4 } from 'uuid'; // To generate unique IDs
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
const emit = defineEmits(['onSubmit', 'isValid']);
const route = useRoute();
const props = defineProps({
  deliveries: {
    type: Array,
    required: true
  },
  editMode: {
    type: Boolean,
    required: false
  }
});

// Reactive delivery array
const deliveriesList = ref<Delivery[]>([
  {
    id: uuidv4(),
    deliveryDetails: '',
    deliveryDate: null
  }
]);

if (props.deliveries?.length) {
  deliveriesList.value = props.deliveries.map((delivery: any) => ({
    deliveryDetails: delivery.deliveryDetails,
    deliveryDate: delivery.deliveryDate,
    id: delivery.id
  }));
}

// Refs for child forms
const childRefs = ref<Record<string, any>>({});
// Add a new delivery
async function AddDelivery() {
  if (!(await validateForm())) return;

  deliveriesList.value.push({
    id: uuidv4(),
    deliveryDetails: '',
    deliveryDate: null
  });
}

/**
 * Deletes an delivery from the list of deliveries.
 * @param {string} id - The ID of the delivery to delete.
 * @returns {void}
 */
async function onDelete(id: string) {
  try {
    await ElMessageBox.confirm(t('common.deleteConfirm'), t('common.warning'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    });
    deliveriesList.value = deliveriesList.value.filter((delivery: Delivery) => delivery.id !== id);
  } catch {
    // User cancelled
  }
}

/**
 * Submits an delivery form, either updating an existing delivery or adding a new one.
 * @param {Delivery} values - The submitted delivery form values.
 * @returns {void}
 */
function onSubmit(values: Delivery) {
  const index = deliveriesList.value.findIndex((delivery: Delivery) => delivery.id === values.id);

  if (index !== -1) {
    // Update an existing delivery
    deliveriesList.value[index] = { ...values };
  } else {
    // Add a new delivery
    deliveriesList.value.push(values);
  }
}

/**
 * Validates all child forms and returns a boolean indicating whether all forms are valid.
 * @returns {Promise<boolean>} Whether all forms were validated successfully.
 */

// Collect validation promises from all child forms
async function validateForm(): Promise<boolean> {
  const childPromises = childRefs.value.map(async (child: any) => {
    if (child) {
      // Await validation result
      await child.validate();
      // Return true if no errors are present
      return !Object.keys(child.errors).length;
    }
    // If the child is null or undefined, return false
    return false;
  });

  // Await all validation results
  const results = await Promise.all(childPromises);

  // Return true if all children passed validation
  return results.every((isValid: boolean) => isValid);
}

/**
 * Submits all forms and logs the final data for API submission.
 * @returns {Promise<boolean>} Whether all forms were submitted successfully.
 */
async function onSubmitForm(): Promise<boolean> {
  // Validate the form, and exit early if validation fails
  const isFormValid = await validateForm();
  if (!isFormValid) return false;

  try {
    // Collect child submission promises
    const childPromises = childRefs.value.map(async (child: any) => {
      if (child) {
        await child.onSubmit();
      }
    });

    // Wait for all child submissions to complete
    await Promise.all(childPromises);
    return true; // All forms submitted successfully
  } catch (error) {
    ElMessage.error('Submission failed');
    return false; // Submission failed
  }
}

function checkNoDeliveries() {
  const deliveryCount = deliveriesList.value.length;

  if (deliveryCount === 0) return true;
  if (deliveryCount > 1) return false;

  // Clone the invoice and remove the `id` field
  const { id, ...clonedDelivery } = childRefs.value[0]?.values; // Exclude `id` during destructuring
  // Check if all values (excluding `id`) are nullish
  return Object.values(clonedDelivery).every(isNullish);
}

/**
 * Submits all forms and logs the final data for API submission.
 * @returns {Promise<void>}
 */
async function onSubmitDeliveries() {
  if (checkNoDeliveries()) {
    emit('isValid', true);
    return;
  }
  const isSubmitted = await onSubmitForm();

  // Only proceed if all forms are submitted successfully
  if (!isSubmitted) {
    emit('isValid', false);
    ElMessage.error(t('deals.errors.fillDeliveries'));
    return;
  }

  // Prepare and log final data for API
  const cleanedDeliveries = deliveriesList.value.map(({ id, ...data }: Delivery) => ({
    ...data,
    deliveryDate: getYear(data.deliveryDate)
  }));
  emit('isValid', true);
  if (route.path.includes('edit')) {
    emit('onSubmit', deliveriesList.value);
  } else {
    emit('onSubmit', cleanedDeliveries);
  }
}

defineExpose({ onSubmitDeliveries });
</script>
