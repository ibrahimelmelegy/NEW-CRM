<template lang="pug">  
 .grid.grid-cols-2.gap-3     
   InputSelect(:label="$t('reports.proposalStatus')" name="city"  :placeholder="$t('common.selectStatus')"  )
   InputSelect(:label="$t('reports.assignedUser')" name="city"  :placeholder="$t('reports.selectUser')"  )
 .grid.grid-cols-1.gap-3
   InputDate(:label="$t('reports.dateRange')" :placeholder="$t('reports.enterDateRange')" )
</template>
