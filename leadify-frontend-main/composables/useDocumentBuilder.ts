import type { JSONContent } from '@tiptap/vue-3';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  fetchDocumentTemplate,
  createDocumentTemplate,
  updateDocumentTemplate,
} from '~/composables/useDocumentTemplates';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProTemplateDefinition {
  id: string;
  name: string;
  category: 'Sales' | 'Legal' | 'Finance' | 'General';
  description: string;
  icon: string;
  content: JSONContent;
}

export interface DocumentBuilderState {
  content: JSONContent | null;
  templateId: string | null;
  isDirty: boolean;
  lastSaved: Date | null;
  saving: boolean;
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useDocumentBuilder() {
  const state = reactive<DocumentBuilderState>({
    content: null,
    templateId: null,
    isDirty: false,
    lastSaved: null,
    saving: false,
  });

  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Save to API ──────────────────────────────────────────────────────
  async function save(templateId: string | null, name: string, type: string, content: JSONContent) {
    state.saving = true;
    try {
      const payload: Record<string, any> = {
        name,
        type,
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          margins: { top: 20, right: 15, bottom: 20, left: 15 },
          proContent: content,
          elements: [],
          variables: [],
        },
      };

      let result;
      if (templateId) {
        result = await updateDocumentTemplate(templateId, payload);
      } else {
        result = await createDocumentTemplate(payload);
      }

      if (result.success) {
        state.isDirty = false;
        state.lastSaved = new Date();
        if (!templateId && result.body?.id) {
          state.templateId = result.body.id;
        }
      }

      return result;
    } finally {
      state.saving = false;
    }
  }

  // ── Load from API ────────────────────────────────────────────────────
  async function load(templateId: string) {
    const tpl = await fetchDocumentTemplate(templateId);
    if (tpl) {
      state.templateId = templateId;
      state.content = tpl.layout?.proContent || null;
      state.isDirty = false;
      return tpl;
    }
    return null;
  }

  // ── Export PDF from HTML ─────────────────────────────────────────────
  async function exportPDF(htmlContent: string, filename?: string) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Use jsPDF html method for rendering rich content
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.width = '170mm';
    container.style.padding = '0';
    container.style.fontFamily = 'Helvetica, Arial, sans-serif';
    container.style.fontSize = '12px';
    container.style.lineHeight = '1.5';
    container.style.color = '#333';

    // Style all tables for PDF
    container.querySelectorAll('table').forEach((table) => {
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.marginBottom = '12px';
    });
    container.querySelectorAll('th, td').forEach((cell) => {
      (cell as HTMLElement).style.border = '1px solid #ddd';
      (cell as HTMLElement).style.padding = '6px 8px';
      (cell as HTMLElement).style.fontSize = '10px';
    });
    container.querySelectorAll('th').forEach((th) => {
      (th as HTMLElement).style.background = '#f5f5f5';
      (th as HTMLElement).style.fontWeight = 'bold';
    });

    // Style page breaks
    container.querySelectorAll('[data-type="page-break"]').forEach((el) => {
      (el as HTMLElement).style.pageBreakBefore = 'always';
    });

    // Style signature blocks for print
    container.querySelectorAll('[data-type="signature-block"]').forEach((el) => {
      (el as HTMLElement).style.pageBreakInside = 'avoid';
    });

    // Style variable nodes — replace with plain text for PDF
    container.querySelectorAll('.variable-node, [data-type="variable"]').forEach((el) => {
      const span = document.createElement('span');
      span.textContent = el.textContent || '';
      span.style.fontWeight = '600';
      span.style.color = '#7849ff';
      el.replaceWith(span);
    });

    document.body.appendChild(container);

    try {
      await doc.html(container, {
        callback: (doc) => {
          doc.save(filename || 'document.pdf');
        },
        x: 15,
        y: 15,
        width: 170,
        windowWidth: 650,
      });
    } finally {
      document.body.removeChild(container);
    }
  }

  // ── Render variables ─────────────────────────────────────────────────
  function renderVariables(htmlContent: string, data: Record<string, any>): string {
    return htmlContent.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (_, key) => {
      const parts = key.split('.');
      let value: any = data;
      for (const part of parts) {
        value = value?.[part];
      }
      return value != null ? String(value) : `{{${key}}}`;
    });
  }

  // ── Auto-save (debounced 30s) ────────────────────────────────────────
  function autoSave(templateId: string | null, name: string, type: string, content: JSONContent) {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    state.isDirty = true;

    autoSaveTimer = setTimeout(() => {
      if (state.isDirty && templateId) {
        save(templateId, name, type, content);
      }
    }, 30000);
  }

  function stopAutoSave() {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = null;
    }
  }

  // ── Built-in Templates ───────────────────────────────────────────────
  function getBuiltInTemplates(): ProTemplateDefinition[] {
    return [
      buildSalesProposal(),
      buildContractAgreement(),
      buildInvoiceTemplate(),
      buildMeetingNotes(),
      buildProjectBrief(),
      buildNDA(),
    ];
  }

  return {
    state,
    save,
    load,
    exportPDF,
    renderVariables,
    getBuiltInTemplates,
    autoSave,
    stopAutoSave,
  };
}

// ---------------------------------------------------------------------------
// Template definitions (private helpers)
// ---------------------------------------------------------------------------

function buildSalesProposal(): ProTemplateDefinition {
  return {
    id: 'pro-sales-proposal',
    name: 'Sales Proposal',
    category: 'Sales',
    description: 'Professional sales proposal with executive summary, scope and pricing.',
    icon: 'ph:presentation-chart-bold',
    content: {
      type: 'doc',
      content: [
        coverPage('Sales Proposal', 'Strategic partnership & customized solutions', 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop'),
        heading(1, 'Executive Summary'),
        paragraph([
          text('Prepared for: '),
          variable('client.name'),
        ]),
        paragraph([
          text('Date: '),
          variable('invoice.date'),
        ]),
        rule(),
        heading(2, 'Executive Summary'),
        paragraph([
          text('We are pleased to present this proposal to '),
          variable('client.name'),
          text(' on behalf of '),
          variable('company.name'),
          text('. This document outlines our approach, deliverables, and pricing for the proposed engagement. Our solution is designed to address your specific requirements while delivering measurable business value.'),
        ]),
        heading(2, 'Scope of Work'),
        paragraph([text('The following services are included in this proposal:')]),
        bulletList([
          'Discovery and requirements analysis',
          'Solution design and architecture',
          'Implementation and development',
          'Quality assurance and testing',
          'Deployment and training',
          'Post-launch support (30 days)',
        ]),
        heading(2, 'Pricing'),
        table(
          ['Service', 'Hours', 'Rate', 'Total'],
          [
            ['Discovery & Planning', '20', '$150/hr', '$3,000'],
            ['Design & Architecture', '40', '$175/hr', '$7,000'],
            ['Development', '120', '$150/hr', '$18,000'],
            ['QA & Testing', '30', '$125/hr', '$3,750'],
            ['Deployment & Training', '15', '$150/hr', '$2,250'],
          ],
        ),
        paragraph([
          boldText('Total Investment: '),
          text('$34,000'),
        ]),
        heading(2, 'Terms & Conditions'),
        orderedList([
          'Payment is due within 30 days of invoice date.',
          'A 50% deposit is required to begin work.',
          'This proposal is valid for 30 days from the date above.',
          'Additional work beyond the stated scope will be billed at agreed rates.',
        ]),
        heading(2, 'Acceptance'),
        paragraph([text('By signing below, you agree to the terms outlined in this proposal.')]),
        signatureBlock('Client Signature'),
        signatureBlock('Company Representative'),
      ],
    },
  };
}

function buildContractAgreement(): ProTemplateDefinition {
  return {
    id: 'pro-contract-agreement',
    name: 'Contract Agreement',
    category: 'Legal',
    description: 'Standard service agreement between two parties with terms and obligations.',
    icon: 'ph:handshake-bold',
    content: {
      type: 'doc',
      content: [
        coverPage('Service Agreement', 'Legally binding contract and terms', 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=2000&auto=format&fit=crop'),
        heading(1, 'Service Agreement'),
        paragraph([
          text('This Service Agreement ("Agreement") is entered into as of '),
          variable('invoice.date'),
          text(' by and between:'),
        ]),
        paragraph([
          boldText('Party A: '),
          variable('company.name'),
          text(', having its principal place of business at '),
          variable('company.address'),
          text(' (hereinafter referred to as the "Service Provider")'),
        ]),
        paragraph([
          boldText('Party B: '),
          variable('client.name'),
          text(', having its principal place of business at '),
          variable('client.email'),
          text(' (hereinafter referred to as the "Client")'),
        ]),
        rule(),
        heading(2, '1. Services'),
        paragraph([text('The Service Provider agrees to perform the following services for the Client:')]),
        bulletList([
          'Consulting and advisory services as defined in the attached scope of work.',
          'Regular progress reports and status updates.',
          'Delivery of all specified deliverables within the agreed timeline.',
        ]),
        heading(2, '2. Term'),
        paragraph([text('This Agreement shall commence on the date first written above and shall continue for a period of twelve (12) months unless terminated earlier in accordance with Section 5 below.')]),
        heading(2, '3. Compensation'),
        paragraph([
          text('The Client agrees to pay the Service Provider the total sum as outlined in the pricing schedule attached hereto as Exhibit A. Payment terms are Net 30 from the date of each invoice.'),
        ]),
        heading(2, '4. Obligations'),
        paragraph([boldText('Service Provider shall:')]),
        bulletList([
          'Perform all services in a professional and workmanlike manner.',
          'Comply with all applicable laws and regulations.',
          'Maintain confidentiality as outlined in Section 6.',
          'Provide timely communication regarding project status.',
        ]),
        paragraph([boldText('Client shall:')]),
        bulletList([
          'Provide timely access to all necessary information and resources.',
          'Make payments in accordance with the agreed payment schedule.',
          'Designate a primary point of contact for project communications.',
          'Review and approve deliverables within five (5) business days.',
        ]),
        heading(2, '5. Termination'),
        paragraph([text('Either party may terminate this Agreement with thirty (30) days written notice. Upon termination, the Client shall pay for all services rendered up to the date of termination. The Service Provider shall deliver all completed work product to the Client.')]),
        heading(2, '6. Confidentiality'),
        paragraph([text('Both parties agree to maintain the confidentiality of all proprietary information shared during the course of this engagement. This obligation shall survive the termination of this Agreement for a period of two (2) years.')]),
        heading(2, '7. Governing Law'),
        paragraph([text('This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction in which the Service Provider is located.')]),
        rule(),
        heading(2, 'Signatures'),
        paragraph([text('IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.')]),
        signatureBlock('Service Provider'),
        signatureBlock('Client'),
      ],
    },
  };
}

function buildInvoiceTemplate(): ProTemplateDefinition {
  return {
    id: 'pro-invoice-template',
    name: 'Invoice',
    category: 'Finance',
    description: 'Professional invoice with line items, tax calculations and payment terms.',
    icon: 'ph:receipt-bold',
    content: {
      type: 'doc',
      content: [
        heading(1, 'INVOICE'),
        paragraph([
          variable('company.name'),
        ]),
        paragraph([
          variable('company.address'),
        ]),
        rule(),
        table(
          ['', ''],
          [
            ['Invoice Number:', '{{invoice.number}}'],
            ['Date:', '{{invoice.date}}'],
            ['Due Date:', '{{invoice.dueDate}}'],
          ],
        ),
        heading(3, 'Bill To'),
        paragraph([
          variable('client.name'),
        ]),
        paragraph([
          variable('client.email'),
        ]),
        paragraph([
          variable('client.phone'),
        ]),
        rule(),
        heading(3, 'Line Items'),
        table(
          ['Description', 'Quantity', 'Unit Price', 'Amount'],
          [
            ['Service / Product description', '1', '$0.00', '$0.00'],
            ['Service / Product description', '1', '$0.00', '$0.00'],
            ['Service / Product description', '1', '$0.00', '$0.00'],
          ],
        ),
        paragraph([]),
        table(
          ['', ''],
          [
            ['Subtotal', '$0.00'],
            ['Tax (10%)', '$0.00'],
            ['Total Due', '$0.00'],
          ],
        ),
        rule(),
        heading(3, 'Payment Information'),
        paragraph([boldText('Bank: '), text('Your Bank Name')]),
        paragraph([boldText('Account: '), text('XXXX-XXXX-XXXX')]),
        paragraph([boldText('Routing: '), text('XXX-XXX-XXX')]),
        paragraph([]),
        paragraph([boldText('Payment Terms: '), text('Net 30. Late payments are subject to a 1.5% monthly finance charge.')]),
        paragraph([]),
        paragraph([
          italicText('Thank you for your business!'),
        ]),
      ],
    },
  };
}

function buildMeetingNotes(): ProTemplateDefinition {
  return {
    id: 'pro-meeting-notes',
    name: 'Meeting Notes',
    category: 'General',
    description: 'Structured meeting notes with agenda, discussion points and action items.',
    icon: 'ph:notepad-bold',
    content: {
      type: 'doc',
      content: [
        coverPage('Meeting Minutes', 'Strategic alignment & action items', 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2000&auto=format&fit=crop'),
        heading(1, 'Meeting Notes'),
        paragraph([
          boldText('Date: '),
          variable('invoice.date'),
        ]),
        paragraph([
          boldText('Subject: '),
          text('Meeting with '),
          variable('client.name'),
        ]),
        paragraph([
          boldText('Location: '),
          text('Conference Room / Video Call'),
        ]),
        rule(),
        heading(2, 'Attendees'),
        bulletList([
          'Name / Role - Company',
          'Name / Role - Company',
          'Name / Role - Company',
        ]),
        heading(2, 'Agenda'),
        orderedList([
          'Review previous action items',
          'Project status update',
          'Discussion of upcoming milestones',
          'Open floor for questions and concerns',
          'Next steps and timeline',
        ]),
        heading(2, 'Discussion Notes'),
        heading(3, '1. Previous Action Items'),
        bulletList([
          'Item 1 - Status: Completed / In Progress / Pending',
          'Item 2 - Status: Completed / In Progress / Pending',
        ]),
        heading(3, '2. Project Status Update'),
        paragraph([text('Enter discussion notes here. Summarize key points, decisions made, and any concerns raised during the meeting.')]),
        heading(3, '3. Upcoming Milestones'),
        table(
          ['Milestone', 'Target Date', 'Owner', 'Status'],
          [
            ['Phase 1 Delivery', 'TBD', 'Team Lead', 'On Track'],
            ['Client Review', 'TBD', 'Project Manager', 'Pending'],
            ['Final Delivery', 'TBD', 'Team Lead', 'Not Started'],
          ],
        ),
        heading(2, 'Action Items'),
        taskList([
          'Action item 1 - Owner: [Name] - Due: [Date]',
          'Action item 2 - Owner: [Name] - Due: [Date]',
          'Action item 3 - Owner: [Name] - Due: [Date]',
        ]),
        rule(),
        paragraph([
          italicText('Next meeting scheduled for: [Date and Time]'),
        ]),
      ],
    },
  };
}

function buildProjectBrief(): ProTemplateDefinition {
  return {
    id: 'pro-project-brief',
    name: 'Project Brief',
    category: 'General',
    description: 'Project overview with objectives, deliverables, timeline and budget.',
    icon: 'ph:clipboard-text-bold',
    content: {
      type: 'doc',
      content: [
        heading(1, 'Project Brief'),
        paragraph([
          boldText('Prepared by: '),
          variable('company.name'),
        ]),
        paragraph([
          boldText('Client: '),
          variable('client.name'),
        ]),
        paragraph([
          boldText('Date: '),
          variable('invoice.date'),
        ]),
        rule(),
        heading(2, 'Project Overview'),
        paragraph([text('Provide a high-level description of the project, its purpose, and the business problem it aims to solve. This section should give stakeholders a clear understanding of the project scope and vision.')]),
        heading(2, 'Objectives'),
        orderedList([
          'Define the primary business objective and expected outcomes.',
          'Establish measurable KPIs to track project success.',
          'Align project deliverables with client business goals.',
          'Deliver a scalable and maintainable solution.',
        ]),
        heading(2, 'Deliverables'),
        table(
          ['Deliverable', 'Description', 'Format', 'Due Date'],
          [
            ['Requirements Document', 'Detailed functional and technical requirements', 'PDF', 'Week 2'],
            ['Design Mockups', 'UI/UX wireframes and high-fidelity designs', 'Figma', 'Week 4'],
            ['Development Build', 'Working application with core features', 'Web App', 'Week 10'],
            ['Test Report', 'QA test results and bug resolution log', 'PDF', 'Week 12'],
            ['Final Delivery', 'Production-ready application with documentation', 'Web App', 'Week 14'],
          ],
        ),
        heading(2, 'Timeline'),
        table(
          ['Phase', 'Duration', 'Start', 'End'],
          [
            ['Discovery', '2 weeks', 'Week 1', 'Week 2'],
            ['Design', '2 weeks', 'Week 3', 'Week 4'],
            ['Development', '6 weeks', 'Week 5', 'Week 10'],
            ['Testing', '2 weeks', 'Week 11', 'Week 12'],
            ['Deployment', '2 weeks', 'Week 13', 'Week 14'],
          ],
        ),
        heading(2, 'Budget'),
        table(
          ['Category', 'Estimated Cost', 'Notes'],
          [
            ['Personnel', '$25,000', 'Development team (3 members)'],
            ['Infrastructure', '$3,000', 'Cloud hosting and services'],
            ['Tools & Licenses', '$1,500', 'Design and development tools'],
            ['Contingency (10%)', '$2,950', 'Buffer for scope changes'],
            ['Total', '$32,450', ''],
          ],
        ),
        heading(2, 'Team'),
        bulletList([
          'Project Manager - Oversees timeline, budget, and stakeholder communication',
          'Lead Developer - Technical architecture and core development',
          'Frontend Developer - UI implementation and user experience',
          'QA Engineer - Testing and quality assurance',
          'UX Designer - User research and interface design',
        ]),
        heading(2, 'Risks & Mitigations'),
        table(
          ['Risk', 'Impact', 'Likelihood', 'Mitigation'],
          [
            ['Scope creep', 'High', 'Medium', 'Strict change control process'],
            ['Resource availability', 'Medium', 'Low', 'Cross-trained team members'],
            ['Technical complexity', 'Medium', 'Medium', 'Prototype early, iterate often'],
          ],
        ),
        rule(),
        paragraph([boldText('Approval')]),
        signatureBlock('Client Approval'),
        signatureBlock('Project Manager'),
      ],
    },
  };
}

function buildNDA(): ProTemplateDefinition {
  return {
    id: 'pro-nda',
    name: 'Non-Disclosure Agreement',
    category: 'Legal',
    description: 'Standard mutual NDA for protecting confidential information between parties.',
    icon: 'ph:shield-check-bold',
    content: {
      type: 'doc',
      content: [
        heading(1, 'Non-Disclosure Agreement'),
        paragraph([
          text('This Non-Disclosure Agreement ("Agreement") is entered into as of '),
          variable('invoice.date'),
          text(' by and between:'),
        ]),
        paragraph([
          boldText('Disclosing Party: '),
          variable('company.name'),
          text(', with its principal office at '),
          variable('company.address'),
        ]),
        paragraph([
          boldText('Receiving Party: '),
          variable('client.name'),
        ]),
        paragraph([text('Collectively referred to as the "Parties" and individually as a "Party".')]),
        rule(),
        heading(2, '1. Definitions'),
        paragraph([text('"Confidential Information" means any and all non-public, proprietary, or confidential information disclosed by either Party to the other, whether orally, in writing, electronically, or by any other means, including but not limited to:')]),
        bulletList([
          'Business plans, strategies, and financial information',
          'Customer and vendor lists, pricing, and market data',
          'Technical data, trade secrets, inventions, and processes',
          'Software, source code, algorithms, and specifications',
          'Marketing plans, product roadmaps, and research data',
          'Any information marked or designated as "Confidential"',
        ]),
        heading(2, '2. Obligations'),
        paragraph([text('The Receiving Party agrees to:')]),
        orderedList([
          'Hold all Confidential Information in strict confidence.',
          'Not disclose Confidential Information to any third party without prior written consent.',
          'Use Confidential Information solely for the purpose of evaluating and pursuing a potential business relationship between the Parties.',
          'Protect Confidential Information using at least the same degree of care used to protect its own confidential information, but in no event less than reasonable care.',
          'Limit access to Confidential Information to employees and agents who have a need to know and who are bound by confidentiality obligations at least as restrictive as those contained herein.',
        ]),
        heading(2, '3. Exclusions'),
        paragraph([text('Confidential Information does not include information that:')]),
        bulletList([
          'Is or becomes publicly available through no fault of the Receiving Party.',
          'Was already in the Receiving Party\'s possession prior to disclosure.',
          'Is independently developed by the Receiving Party without use of or reference to the Confidential Information.',
          'Is rightfully received from a third party without restriction on disclosure.',
          'Is required to be disclosed by law, regulation, or court order, provided the Receiving Party gives prompt written notice to the Disclosing Party.',
        ]),
        heading(2, '4. Term'),
        paragraph([text('This Agreement shall remain in effect for a period of two (2) years from the date of execution. The obligations of confidentiality shall survive the termination of this Agreement for an additional period of three (3) years.')]),
        heading(2, '5. Return of Information'),
        paragraph([text('Upon written request or termination of this Agreement, the Receiving Party shall promptly return or destroy all copies of Confidential Information in its possession and certify in writing that it has done so.')]),
        heading(2, '6. Remedies'),
        paragraph([text('The Parties acknowledge that any breach of this Agreement may cause irreparable harm for which monetary damages would be inadequate. Accordingly, the Disclosing Party shall be entitled to seek equitable relief, including injunction and specific performance, in addition to any other remedies available at law or in equity.')]),
        heading(2, '7. Governing Law'),
        paragraph([text('This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction in which the Disclosing Party maintains its principal place of business.')]),
        heading(2, '8. Entire Agreement'),
        paragraph([text('This Agreement constitutes the entire understanding between the Parties with respect to the subject matter hereof and supersedes all prior or contemporaneous agreements, whether written or oral.')]),
        rule(),
        heading(2, 'Signatures'),
        paragraph([text('IN WITNESS WHEREOF, the Parties have executed this Non-Disclosure Agreement as of the date first written above.')]),
        signatureBlock('Disclosing Party'),
        signatureBlock('Receiving Party'),
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// TipTap JSON content builder helpers
// ---------------------------------------------------------------------------

function heading(level: number, text: string): JSONContent {
  return {
    type: 'heading',
    attrs: { level },
    content: [{ type: 'text', text }],
  };
}

function paragraph(content: JSONContent[]): JSONContent {
  if (content.length === 0) {
    return { type: 'paragraph' };
  }
  return {
    type: 'paragraph',
    content,
  };
}

function text(value: string): JSONContent {
  return { type: 'text', text: value };
}

function boldText(value: string): JSONContent {
  return {
    type: 'text',
    text: value,
    marks: [{ type: 'bold' }],
  };
}

function italicText(value: string): JSONContent {
  return {
    type: 'text',
    text: value,
    marks: [{ type: 'italic' }],
  };
}

function variable(name: string): JSONContent {
  return {
    type: 'variableNode',
    attrs: { variableName: name },
  };
}

function rule(): JSONContent {
  return { type: 'horizontalRule' };
}

function signatureBlock(label: string): JSONContent {
  return {
    type: 'signatureBlock',
    attrs: { label, showDate: true },
  };
}

function bulletList(items: string[]): JSONContent {
  return {
    type: 'bulletList',
    content: items.map((item) => ({
      type: 'listItem',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: item }],
        },
      ],
    })),
  };
}

function orderedList(items: string[]): JSONContent {
  return {
    type: 'orderedList',
    content: items.map((item) => ({
      type: 'listItem',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: item }],
        },
      ],
    })),
  };
}

function taskList(items: string[]): JSONContent {
  return {
    type: 'taskList',
    content: items.map((item) => ({
      type: 'taskItem',
      attrs: { checked: false },
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: item }],
        },
      ],
    })),
  };
}

function table(headers: string[], rows: string[][]): JSONContent {
  return {
    type: 'table',
    content: [
      {
        type: 'tableRow',
        content: headers.map((h) => ({
          type: 'tableHeader',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: h }],
            },
          ],
        })),
      },
      ...rows.map((row) => ({
        type: 'tableRow',
        content: row.map((cell) => ({
          type: 'tableCell',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: cell }],
            },
          ],
        })),
      })),
    ],
  };
}

function coverPage(title: string, subtitle: string, coverImage: string): JSONContent {
  return {
    type: 'coverPage',
    attrs: {
      title,
      subtitle,
      coverImage,
      date: '{{invoice.date}}',
      preparedBy: '{{company.name}}'
    },
  };
}
