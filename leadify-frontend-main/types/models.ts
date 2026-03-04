/* eslint-disable no-use-before-define */
// Model type definitions matching backend Sequelize models
import type {
  LeadStatus,
  LeadSource,
  DealStage,
  ContractType,
  ClientStatus,
  ClientIndustry,
  OpportunityStage,
  OpportunityPriority,
  ProjectCategory,
  ProjectStatus,
  ProposalType,
  ProposalStatus,
  ProposalEntityType,
  CreditNoteStatus,
  UserStatus
} from './enums';

// Base model with common fields
export interface BaseModel {
  id: string;
  createdAt: string;
  updatedAt: string;
  tenantId?: string;
}

// User
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status: UserStatus;
  profilePicture?: string;
  twoFactorEnabled: boolean;
  roleId: string;
  role?: Role;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
}

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  profilePicture?: string;
}

// Lead
export interface Lead extends BaseModel {
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  leadSource: LeadSource;
  otherSource?: string;
  notes?: string;
  status: LeadStatus;
  lastContactDate?: string;
  score: number;
  users?: UserSummary[];
}

// Deal
export interface Deal extends BaseModel {
  name: string;
  companyName?: string;
  price: number;
  contractType: ContractType;
  signatureDate?: string;
  stage: DealStage;
  probability: number;
  cancelledReason?: string;
  leadId?: string;
  clientId?: string;
  opportunityId?: string;
  lead?: Lead;
  client?: Client;
  opportunity?: Opportunity;
  users?: UserSummary[];
  invoices?: Invoice[];
}

// Client
export interface Client extends BaseModel {
  clientName: string;
  email?: string;
  phoneNumber?: string;
  companyName?: string;
  clientType?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  industry?: ClientIndustry;
  clientStatus: ClientStatus;
  fileUpload?: string[];
  parentCompanyId?: string;
  customFields?: Record<string, unknown>;
  website?: string;
  annualRevenue?: number;
  leadId?: string;
  parentCompany?: Client;
  users?: UserSummary[];
}

// Opportunity
export interface Opportunity extends BaseModel {
  name: string;
  leadId?: string;
  clientId?: string;
  interestedIn?: string;
  stage: OpportunityStage;
  estimatedValue?: number;
  expectedCloseDate?: string;
  priority?: OpportunityPriority;
  nextSteps?: string[];
  reasonOfLose?: string;
  notes?: string;
  probability: number;
  profit: number;
  lead?: Lead;
  client?: Client;
  users?: UserSummary[];
}

// Project
export interface Project extends BaseModel {
  name: string;
  isCompleted: boolean;
  type?: string;
  category?: ProjectCategory;
  clientId?: string;
  startDate?: string;
  endDate?: string;
  duration: number;
  status?: ProjectStatus;
  description?: string;
  materialMargin: number;
  materialMarginCommission: number;
  totalMaterialCost: number;
  files?: Array<{ name: string; refs: string[] }>;
  totalCarRent: number;
  totalCarRentPerDuration: number;
  accommodationCost: number;
  resourceCount: number;
  foodCostPerDay: number;
  managementAdditionPercentage: number;
  manpowerTotalCost: number;
  finalManpowerTotalCost: number;
  totalAssetRentPrice: number;
  totalAssetBuyPrice: number;
  totalAssetsCost: number;
  leadId?: string;
  dealId?: string;
  opportunityId?: string;
  discount: number;
  grandTotal: number;
  vat: number;
  marginPercentage: number;
  marginAmount: number;
  totalCost: number;
  client?: Client;
  assignedUsers?: UserSummary[];
}

// Proposal
export interface Proposal extends BaseModel {
  relatedEntityId?: string;
  relatedEntityType?: ProposalEntityType;
  title: string;
  version: string;
  proposalDate: string;
  type: ProposalType;
  reference: string;
  proposalFor: string;
  companyLogo: string;
  notes?: string;
  fileAttachments?: string[];
  status: ProposalStatus;
  rejectionReason?: string;
  content?: string;
  users?: UserSummary[];
}

// Invoice
export interface Invoice {
  id: number;
  invoiceNumber: string;
  amount: number;
  invoiceDate?: string;
  dueDate?: string;
  collected?: boolean;
  collectedDate?: string;
  dealId: string;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
  lineItems?: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: number;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
  lineTotal: number;
}

export interface CreditNote {
  id: string;
  invoiceId: number;
  creditNoteNumber: string;
  amount: number;
  reason?: string;
  status: CreditNoteStatus;
  date?: string;
  tenantId?: string;
}

// Notification
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  link?: string;
}

// Socket Events
export interface SocketEvent<T = unknown> {
  event: string;
  data: T;
  timestamp: string;
}
