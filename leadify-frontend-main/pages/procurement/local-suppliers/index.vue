<template lang="pug">
ProcurementEntityList(
  :title="$t('procurement.localSuppliers.title')"
  :subtitle="$t('procurement.localSuppliers.subtitle')"
  :btn-text="$t('procurement.localSuppliers.btnText')"
  entity-type="LocalSupplier"
  :entity-label="$t('procurement.localSuppliers.entityLabel')"
  :dialog-title="$t('procurement.localSuppliers.dialogTitle')"
)
</template>
