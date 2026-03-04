<template lang="pug">
el-table(:data="payslips" style="width: 100%" show-summary :summary-method="getSummary" border)
  el-table-column(:label="$t('payroll.employee')" min-width="180" fixed)
    template(#default="{ row }")
      .font-semibold(style="color: var(--text-primary)") {{ row.employee?.firstName }} {{ row.employee?.lastName }}
      .text-xs(style="color: var(--text-muted)") {{ row.employee?.employeeNumber }}

  //- Earnings columns
  el-table-column(:label="$t('payroll.earnings')" align="center")
    el-table-column(:label="$t('payroll.basic')" width="120" align="right")
      template(#default="{ row }")
        span(style="color: var(--text-primary)") {{ fmt(row.basicSalary) }}
    el-table-column(:label="$t('payroll.housing')" width="120" align="right")
      template(#default="{ row }")
        span(style="color: var(--text-primary)") {{ fmt(row.housingAllowance) }}
    el-table-column(:label="$t('payroll.transport')" width="120" align="right")
      template(#default="{ row }")
        span(style="color: var(--text-primary)") {{ fmt(row.transportAllowance) }}
    el-table-column(:label="$t('payroll.other')" width="110" align="right")
      template(#default="{ row }")
        span(style="color: var(--text-primary)") {{ fmt(row.otherAllowances) }}
    el-table-column(:label="$t('payroll.gross')" width="130" align="right")
      template(#default="{ row }")
        span.font-semibold(style="color: #22c55e") {{ fmt(row.grossSalary) }}

  //- Deductions columns
  el-table-column(:label="$t('payroll.deductions')" align="center")
    el-table-column(:label="$t('payroll.gosi')" width="120" align="right")
      template(#default="{ row }")
        span(style="color: #ef4444") {{ fmt(row.gosiDeduction) }}
    el-table-column(:label="$t('payroll.absent')" width="110" align="right")
      template(#default="{ row }")
        span(style="color: var(--text-primary)") {{ fmt(row.absentDeduction) }}
    el-table-column(:label="$t('payroll.loan')" width="110" align="right")
      template(#default="{ row }")
        span(style="color: var(--text-primary)") {{ fmt(row.loanDeduction) }}
    el-table-column(:label="$t('payroll.other')" width="110" align="right")
      template(#default="{ row }")
        span(style="color: var(--text-primary)") {{ fmt(row.otherDeductions) }}
    el-table-column(:label="$t('payroll.totalDeductions')" width="130" align="right")
      template(#default="{ row }")
        span.font-semibold(style="color: #ef4444") {{ fmt(row.totalDeductions) }}

  //- Net salary
  el-table-column(:label="$t('payroll.netSalary')" width="140" align="right" fixed="right")
    template(#default="{ row }")
      span.font-bold.text-base(style="color: #7849ff") {{ fmt(row.netSalary) }}
</template>

<script setup lang="ts">
import type { PayslipItem } from '~/composables/usePayroll';

const props = defineProps<{
  payslips: PayslipItem[];
}>();

function fmt(value: number) {
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2
  }).format(Number(value) || 0);
}

function getSummary({ columns, data }: { columns: any[]; data: any[] }) {
  const sums: string[] = [];
  columns.forEach((column: any, index: number) => {
    if (index === 0) {
      sums[index] = 'Total';
      return;
    }
    const prop = column.property;
    if (!prop) {
      sums[index] = '';
      return;
    }
    const numericProps = [
      'basicSalary',
      'housingAllowance',
      'transportAllowance',
      'otherAllowances',
      'grossSalary',
      'gosiDeduction',
      'absentDeduction',
      'loanDeduction',
      'otherDeductions',
      'totalDeductions',
      'netSalary'
    ];
    if (numericProps.includes(prop)) {
      const total = data.reduce((sum: number, row: any) => sum + (Number(row[prop]) || 0), 0);
      sums[index] = fmt(total);
    } else {
      sums[index] = '';
    }
  });
  return sums;
}
</script>
