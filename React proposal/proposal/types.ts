
export interface ProposalItem {
  id: number;
  description: string;
  quantity: number;
  unit: string;
  cost: number;   // Base Cost
  margin: number; // Margin Percentage
  rate: number;   // Selling Price
}

export interface ProposalPhase {
  id: number;
  name: string;
  duration: string;
  deliverables: string;
}

export interface CustomSection {
  id: string;
  title: string;
  content: string;
}

export interface ProposalData {
  id: number;
  refNumber: string;
  title: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  date: string;
  validUntil: string;
  status: 'Draft' | 'In Review' | 'Approved' | 'Sent' | 'Rejected' | 'Archived';
  
  // Design & Branding
  themeColor: string;
  coverStyle: 'business' | 'corporate' | 'creative' | 'enterprise' | 'minimal' | 'tech' | 'modern-art' | 'geometric' | 'bold-typography' | 'gradient-splash' | 'swiss' | 'dark-mode' | 'architectural' | 'abstract' | 'neon-night' | 'brutalist' | 'nature' | 'japanese-minimal' | 'retro-pop' | 'futuristic-grid' | 'ethereal' | 'aurora' | 'midnight-gradient' | 'art-deco' | 'newspaper' | 'terminal' | 'brush-stroke' | 'mondrian' | 'blueprint-dark' | 'warm-boho' | 'glassmorphism' | 'magazine-editorial';
  font: 'sans' | 'serif' | 'mono'; // New
  logo?: string; // Company Logo
  clientLogo?: string; // Client Logo
  
  // Order of sections
  stepOrder: string[];

  // Dynamic Step Labels
  stepLabels: {
      branding: string;
      executive: string;
      solution: string;
      financial: string;
      legal: string;
  };

  // Content - Executive
  introduction: string;
  objectives: string;
  
  // Content - Technical
  scopeOfWork: string;
  methodology: string;
  phases: ProposalPhase[];
  
  // Content - Custom
  customSections: CustomSection[];

  // Financial
  currency: string;
  items: ProposalItem[];
  taxRate: number;
  discount: number;
  discountType: 'percent' | 'fixed';
  paymentTerms: string;
  
  // Legal
  termsAndConditions: string;
  
  // Enterprise Features
  version: number;
  lastModified: string;
  approvedBy?: string;
}