import { defineStore } from 'pinia';

export const useProposalStoreee = defineStore('proposalll', {
  state: () => ({
    proposalInfo: {} as any,
    proposalContent: [] as any[]
  }),
  actions: {
    setProposalInfo(info: any) {
      console.log('>>>>>>>>>>>>>> useProposalStore', info);
      this.proposalInfo = info;
      console.log('>>>>>>>>>>>>>> useProposalStore', this.proposalInfo);
      navigateTo('/sales/proposals/proposal-content');
    },
    addContent(content: any) {
      this.proposalContent.push(content);
    },
    resetProposal() {
      this.proposalInfo = {};
      this.proposalContent = [];
    }
  }
});
