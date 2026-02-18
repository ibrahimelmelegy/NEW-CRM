<template lang="pug">
.stakeholder-map
  h3.section-title
    Icon.mr-2(name="ph:users-three-bold" size="18")
    | Stakeholder Map
  .map-grid
    .map-side
      .side-label.seller Seller Side
      .stakeholder-card(v-for="s in sellers" :key="s.id")
        Avatar(:src="s.profilePicture" small)
        .stakeholder-info
          .stakeholder-name {{ s.name }}
          .stakeholder-role {{ s.role }}
    .map-divider
      .divider-icon
        Icon(name="ph:handshake-bold" size="20")
    .map-side
      .side-label.buyer Buyer Side
      .empty-state(v-if="!buyers.length")
        Icon.text-2xl.mb-2(name="ph:user-plus-bold" style="opacity: 0.3")
        p.text-xs.text-secondary Add stakeholders from the deal page
</template>

<script setup lang="ts">
defineProps<{
  sellers: any[];
  buyers: any[];
}>();
</script>

<style lang="scss" scoped>
.section-title {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.text-secondary { color: var(--text-secondary); }

.map-grid {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.map-side {
  flex: 1;
}

.side-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  display: inline-block;

  &.seller { background: rgba(120, 73, 255, 0.15); color: var(--accent-color, #7849ff); }
  &.buyer { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
}

.stakeholder-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 10px;
  background: var(--glass-bg-primary);
  margin-bottom: 6px;
}

.stakeholder-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.stakeholder-role {
  font-size: 11px;
  color: var(--text-secondary);
}

.map-divider {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 32px;
}

.divider-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--glass-bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 24px;
  opacity: 0.5;
}
</style>
