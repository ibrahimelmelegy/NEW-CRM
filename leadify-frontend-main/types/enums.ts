// Shared enum types matching backend definitions

// Lead
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'DISQUALIFIED' | 'CONVERTED' | 'LOST';
export type LeadSource = 'REFERRAL' | 'WEBSITE' | 'EVENT' | 'EMAIL' | 'PHONE' | 'SOCIAL_MEDIA' | 'OTHER';

// Deal
export type DealStage = 'PROGRESS' | 'NEGOTIATION' | 'CANCELLED' | 'CLOSED' | 'ARCHIVED' | 'CONVERTED';
export type ContractType = 'Contract' | 'PurchaseOrder';

// Client
export type ClientStatus = 'ACTIVE' | 'INACTIVE';
export type ClientIndustry =
  | 'Agriculture & Farming'
  | 'Automotive'
  | 'Banking & Financial Services'
  | 'Biotechnology & Pharmaceuticals'
  | 'Construction & Real Estate'
  | 'Consulting & Professional Services'
  | 'Consumer Goods & Retail'
  | 'Education & E-Learning'
  | 'Energy & Utilities'
  | 'Entertainment & Media'
  | 'Food & Beverage'
  | 'Government & Public Sector'
  | 'Healthcare & Medical Services'
  | 'Hospitality & Tourism'
  | 'Information Technology (IT) & Software'
  | 'Insurance'
  | 'Legal Services'
  | 'Manufacturing'
  | 'Marketing & Advertising'
  | 'Non-Profit & NGOs'
  | 'Telecommunications'
  | 'Transportation & Logistics';

// Opportunity
export type OpportunityStage = 'DISCOVERY' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST' | 'CONVERTED';
export type OpportunityPriority = 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW';

// Project
export type ProjectCategory = 'Direct' | 'Etimad';
export type ProjectStatus = 'ACTIVE' | 'COMPLETE' | 'ON_HOLD' | 'CANCELLED';

// Proposal
export type ProposalType = 'FINANCIAL' | 'TECHNICAL' | 'MIXED';
export type ProposalStatus = 'WAITING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ARCHIVED' | 'DRAFT' | 'SENT';
export type ProposalEntityType = 'Project' | 'Opportunity' | 'Deal';

// Invoice
export type CreditNoteStatus = 'DRAFT' | 'ISSUED' | 'APPLIED' | 'VOIDED';

// User
export type UserStatus = 'ACTIVE' | 'INACTIVE';
