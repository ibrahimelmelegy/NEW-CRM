export interface ProposalItem {
    id: number;
    description: string;
    quantity: number;
    unit: string;
    cost: number;
    margin: number;
    rate: number;
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
    type?: 'FINANCIAL' | 'TECHNICAL' | 'MIXED';
    documentType: 'proposal' | 'invoice' | 'proforma_invoice' | 'purchase_order' | 'credit_note' | 'contract' | 'rfq' | 'sales_order' | 'quote' | 'delivery_note' | 'sla';

    // Design & Branding
    themeColor: string;
    coverStyle: 'business' | 'corporate' | 'creative' | 'enterprise' | 'minimal' | 'tech' | 'modern-art' | 'geometric' | 'bold-typography' | 'gradient-splash' | 'swiss' | 'dark-mode' | 'architectural' | 'abstract' | 'neon-night' | 'brutalist' | 'nature' | 'japanese-minimal' | 'retro-pop' | 'futuristic-grid' | 'ethereal' | 'aurora' | 'midnight-gradient' | 'art-deco' | 'newspaper' | 'terminal' | 'brush-stroke' | 'mondrian' | 'blueprint-dark' | 'warm-boho' | 'glassmorphism' | 'magazine-editorial';
    font: 'sans' | 'serif' | 'mono';
    logo?: string;
    clientLogo?: string;

    // Order of sections
    stepOrder: string[];

    // Dynamic Step Labels
    stepLabels: Record<string, string> & {
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

    // Company Info (for PDF header)
    companyName?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyEmail?: string;
    companyTaxId?: string;

    // Client Extended
    clientAddress?: string;
    clientPhone?: string;
    clientTaxId?: string;

    // Bank Details (for invoices)
    bankName?: string;
    bankAccountName?: string;
    bankIban?: string;
    bankSwift?: string;

    // Additional
    notes?: string;
    dueDate?: string;

    // Enterprise Features
    version: number;
    lastModified: string;
    approvedBy?: string;

    // Document Linking
    linkedDocuments?: Array<{ id: string | number; refNumber: string; documentType: string; relationship: string }>;
    convertedFrom?: { id: string | number; refNumber: string; documentType: string };
}
