import { defineStore } from 'pinia';

export const useProposalStoreee = defineStore('proposalll', {
  state: () => ({
    proposalInfo: {} as any,
    proposalContent: [] as any[],
  }),
  actions: {
    setProposalInfo(info: any) {
      this.proposalInfo = info;
      navigateTo('/sales/proposals/proposal-content');
    },
    addContent(content: any) {
      this.proposalContent.push(content);
    },
    resetProposal() {
      this.proposalInfo = {};
      this.proposalContent = [];
    },
  },
});
