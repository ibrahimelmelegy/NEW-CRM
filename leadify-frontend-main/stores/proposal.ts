import { defineStore } from 'pinia';

export const useProposalStore = defineStore('proposal', {
  state: () => ({
    proposalInfo: {
      relatedTo: '',
      clientName: '',
      proposaltitle: '',
      version: '1.0',
      date: new Date().toLocaleDateString(),
      proposalType: '',
      reference: '',
      proposalFor: '',
      assignUser: '',
      companyLogo: null,
      comments: '',
      fileAttachments: [] as string[]
    },
    proposalContent: {
      title: '',
      subtitle: '',
      description: '',
      financeTable: [] as Array<{ name: string; qty: number; unitPrice: number; total?: number }>
    },
    grandTotal: 0,
    margin: 0,
    discount: 0,
    customColumns: [] as Array<{ key: string; label: string }>,
    status: 'Draft'
  }),

  actions: {
    // Add logic to handle table updates, margin, and discount calculations
    addFinanceItem(item: { name: string; qty: number; unitPrice: number; total?: number }) {
      this.proposalContent.financeTable.push(item);
      this.calculateGrandTotal();
    },
    calculateGrandTotal() {
      this.grandTotal = this.proposalContent.financeTable.reduce((total, item) => {
        return total + item.qty * item.unitPrice;
      }, 0);

      // Apply VAT, Margin, and Discount
      this.grandTotalWithAdjustments();
    },
    addMargin(marginPercentage: number) {
      this.margin = marginPercentage;
      this.grandTotalWithAdjustments();
    },
    addDiscount(discountAmount: number) {
      this.discount = discountAmount;
      this.grandTotalWithAdjustments();
    },
    grandTotalWithAdjustments() {
      let total = this.grandTotal;
      if (this.margin) {
        total += (this.margin / 100) * total;
      }
      if (this.discount) {
        total -= this.discount;
      }
      this.grandTotal = total;
    },
    setProposalInfo(data: Partial<typeof this.proposalInfo>) {
      this.proposalInfo = { ...this.proposalInfo, ...data };
    },
    setProposalContent(data: Partial<typeof this.proposalContent>) {
      this.proposalContent = { ...this.proposalContent, ...data };
    },
    finalizeProposal() {
      this.status = 'Waiting Approval';
    }
  }
});
