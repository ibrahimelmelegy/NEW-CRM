/**
 * seedDemo.ts — Enterprise Demo Seed Data
 *
 * Populates the CRM with realistic demo data for CEO presentation.
 * Run:  npm run seed-demo
 * Prereq: npm run seed  (creates SUPER_ADMIN user + role first)
 */
import { sequelize } from './config/db';
import bcrypt from 'bcryptjs';

// ── Models ──
import User from './user/userModel';
import Role from './role/roleModel';
import Lead from './lead/leadModel';
import LeadUsers from './lead/model/lead_UsersModel';
import Opportunity from './opportunity/opportunityModel';
import OpportunityUsers from './opportunity/model/opportunity_UsersModel';
import Deal from './deal/model/dealModel';
import DealUsers from './deal/model/deal_UsersModel';
import Invoice from './deal/model/invoiceMode';
import Client from './client/clientModel';
import ClientUsers from './client/client_UsersModel';
import Proposal from './proposal/models/proposalModel';
import ProposalUsers from './proposal/models/proposal_UsersModel';
import Project from './project/models/projectModel';
import UserProjects from './project/models/projectUsersModel';
import Task from './tasks/taskModel';
import Department from './hr/models/departmentModel';
import Employee from './hr/models/employeeModel';
import Vendor from './vendor/vendorModel';
import PurchaseOrder from './procurement/models/purchaseOrderModel';
import PurchaseOrderItem from './procurement/models/purchaseOrderItemModel';
import ExpenseCategory from './finance/expenseCategoryModel';
import Expense from './finance/expenseModel';
import Ticket from './support/models/ticketModel';
import TicketCategory from './support/models/ticketCategoryModel';
import KBArticle from './knowledgeBase/kbArticleModel';
import Campaign from './campaign/campaignModel';
import CalendarEvent from './calendar/calendarEventModel';
import ApprovalWorkflow from './approval/approvalWorkflowModel';
import ApprovalRequest from './approval/approvalRequestModel';
import WorkflowRule from './workflow/workflowModel';
import { TriggerType, ConditionLogic } from './workflow/workflowModel';
import Notification from './notification/notificationModel';
import ForecastPeriod from './forecasting/forecastModel';
import PipelineStage from './pipelineConfig/pipelineConfigModel';
import SalesOrder from './salesOrder/models/salesOrderModel';
import SalesOrderItem from './salesOrder/models/salesOrderItemModel';
import Achievement from './gamification/achievementModel';
import UserPoints from './gamification/userPointsModel';

// ── Enums ──
import { LeadStatusEnums, LeadSourceEnums } from './lead/leadEnum';
import { OpportunityStageEnums, OpportunityPriorityEnums } from './opportunity/opportunityEnum';
import { DealStageEnums, ContractTypeEnums } from './deal/dealEnum';
import { ProjectStatusEnum, ProjectCategoryEnum } from './project/projectEnum';
import { ProposalStatusEnum, ProposalTypeEnum, ProposalModelEnum } from './proposal/proposalEnum';
import { CampaignStatus } from './campaign/campaignEnum';
import { getAllPermissions } from './role/roleEnum';

// ── Helpers ──
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const money = (min: number, max: number) => Math.round(rand(min, max) / 100) * 100;
const days = (n: number) => new Date(Date.now() + n * 86400000);
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
const hashedPw = bcrypt.hashSync('Demo@2026!', 12);

// Realistic company names
const companies = [
  'Aramco Digital',
  'NEOM Tech Solutions',
  'Riyadh Metro Group',
  'Saudi Telecom (STC)',
  'Al Rajhi Capital',
  'SABIC Industries',
  'Red Sea Global',
  'Lucid Motors Arabia',
  'Flynas Aviation',
  'Vision 2030 Labs',
  'Maaden Mining Corp',
  'Jarir Technologies',
  'Tamimi Markets Group',
  'Panda Retail Company',
  'Almarai Fresh Foods',
  'Elm Information Security',
  'Mobily Enterprise',
  'Zain Business Solutions',
  'Saudi Arabian Airlines',
  'Kingdom Holding'
];

const firstNames = [
  'Ahmed',
  'Mohammed',
  'Khalid',
  'Omar',
  'Faisal',
  'Youssef',
  'Sara',
  'Noura',
  'Lama',
  'Aisha',
  'Hassan',
  'Ali',
  'Tariq',
  'Rania',
  'Dalal'
];
const lastNames = ['Al-Rashid', 'Al-Saud', 'Al-Dosari', 'Al-Ghamdi', 'Al-Harbi', 'Al-Qahtani', 'Al-Otaibi', 'Al-Shehri', 'Al-Zahrani', 'Al-Mutairi'];
const fullName = () => `${pick(firstNames)} ${pick(lastNames)}`;

const industries = [
  'Information Technology (IT) & Software',
  'Construction & Real Estate',
  'Banking & Financial Services',
  'Energy & Utilities',
  'Healthcare & Medical Services',
  'Consulting & Professional Services',
  'Telecommunications',
  'Manufacturing',
  'Transportation & Logistics',
  'Education & E-Learning',
  'Consumer Goods & Retail',
  'Food & Beverage',
  'Government & Public Sector',
  'Entertainment & Media',
  'Hospitality & Tourism'
];

async function seedDemo() {
  try {
    await sequelize.authenticate();
    // Connected to database

    // ── 0. Ensure admin user exists ──
    const admin = await User.findOne();
    if (!admin) {
      console.error('No user found. Run "npm run seed" first.');
      process.exit(1);
    }
    const adminId = admin.id;
    // Admin user found

    // ── 1. ROLES (4) ──
    // Seeding Roles
    const allPerms = getAllPermissions();
    // Sales permissions subset
    const salesPerms = allPerms.filter(
      p =>
        p.includes('LEAD') ||
        p.includes('DEAL') ||
        p.includes('OPPORTUNITY') ||
        p.includes('CLIENT') ||
        p.includes('PROPOSAL') ||
        p.includes('SALES') ||
        p.includes('INVOICE')
    );
    const supportPerms = allPerms.filter(p => p.includes('TICKET') || p.includes('CLIENT') || p.includes('VIEW'));
    const hrPerms = allPerms.filter(p => p.includes('EMPLOYEE') || p.includes('PAYROLL') || p.includes('VIEW'));

    const rolesData = [
      {
        name: 'SALES_MANAGER',
        description: 'Sales department manager with full sales access',
        permissions: [...salesPerms, ...allPerms.filter(p => p.includes('GLOBAL') || p.includes('REPORT'))]
      },
      { name: 'SALES_REP', description: 'Sales representative with own-data access', permissions: salesPerms.filter(p => !p.includes('GLOBAL')) },
      { name: 'SUPPORT_AGENT', description: 'Customer support agent', permissions: supportPerms },
      { name: 'HR_MANAGER', description: 'Human resources manager', permissions: hrPerms }
    ];

    const createdRoles: any[] = [];
    for (const r of rolesData) {
      const [role] = await (Role as any).findOrCreate({
        where: { name: r.name },
        defaults: r
      });
      createdRoles.push(role);
    }
    // Roles ready

    // ── 2. STAFF / USERS (8) ──
    // Seeding Staff
    const _superAdminRole = await (Role as any).findOne({ where: { name: 'SUPER_ADMIN' } });
    const staffData = [
      { name: 'Khalid Al-Rashid', email: 'khalid@hp-tech.com', phone: '0501234001', roleId: createdRoles[0].id, status: 'ACTIVE' },
      { name: 'Omar Al-Dosari', email: 'omar@hp-tech.com', phone: '0501234002', roleId: createdRoles[0].id, status: 'ACTIVE' },
      { name: 'Sara Al-Ghamdi', email: 'sara@hp-tech.com', phone: '0501234003', roleId: createdRoles[1].id, status: 'ACTIVE' },
      { name: 'Ahmed Al-Harbi', email: 'ahmed@hp-tech.com', phone: '0501234004', roleId: createdRoles[1].id, status: 'ACTIVE' },
      { name: 'Noura Al-Qahtani', email: 'noura@hp-tech.com', phone: '0501234005', roleId: createdRoles[1].id, status: 'ACTIVE' },
      { name: 'Faisal Al-Otaibi', email: 'faisal@hp-tech.com', phone: '0501234006', roleId: createdRoles[2].id, status: 'ACTIVE' },
      { name: 'Lama Al-Shehri', email: 'lama@hp-tech.com', phone: '0501234007', roleId: createdRoles[2].id, status: 'ACTIVE' },
      { name: 'Youssef Al-Zahrani', email: 'youssef@hp-tech.com', phone: '0501234008', roleId: createdRoles[3].id, status: 'ACTIVE' }
    ];

    const createdUsers: any[] = [admin]; // Admin is user[0]
    for (const s of staffData) {
      const [user] = await (User as any).findOrCreate({
        where: { email: s.email },
        defaults: { ...s, password: hashedPw }
      });
      createdUsers.push(user);
    }
    // Staff members ready

    // Helper to pick a sales user (indices 1-5 are sales)
    const salesUserIds = createdUsers.slice(1, 6).map(u => u.id);
    const pickSalesUser = () => pick(salesUserIds);

    // ── 3. PIPELINE STAGES (6) ──
    // Seeding Pipeline Stages
    await PipelineStage.destroy({ where: {} });
    const stagesData = [
      { name: 'Qualification', order: 1, color: '#64748b', probability: 10, entityType: 'deal', isDefault: true },
      { name: 'Discovery', order: 2, color: '#3b82f6', probability: 25, entityType: 'deal' },
      { name: 'Proposal', order: 3, color: '#8b5cf6', probability: 50, entityType: 'deal' },
      { name: 'Negotiation', order: 4, color: '#f59e0b', probability: 75, entityType: 'deal' },
      { name: 'Closed Won', order: 5, color: '#22c55e', probability: 100, entityType: 'deal', isWon: true },
      { name: 'Closed Lost', order: 6, color: '#ef4444', probability: 0, entityType: 'deal', isLost: true }
    ];
    const _createdStages = await PipelineStage.bulkCreate(stagesData);
    // Pipeline stages created

    // ── 4. CLIENTS (15) ──
    // Seeding Clients
    const clientsData = companies.slice(0, 15).map((name, i) => ({
      clientName: name,
      email: `contact@${name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
      phoneNumber: `0501100${(i + 10).toString().padStart(2, '0')}`,
      companyName: name,
      clientType: i < 10 ? 'CORPORATE' : 'INDIVIDUAL',
      industry: industries[i % industries.length],
      clientStatus: 'ACTIVE',
      city: pick(['Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Mecca', 'Medina']),
      streetAddress: `${rand(100, 999)} King Fahd Road`
    }));
    const createdClients = await Client.bulkCreate(clientsData);
    // Assign clients to sales users
    for (const client of createdClients) {
      await ClientUsers.create({ clientId: client.id, userId: pick(salesUserIds) });
    }
    // Clients created

    // ── 5. LEADS (50) ──
    // Seeding Leads
    const _leadStatuses = Object.values(LeadStatusEnums);
    const leadSources = Object.values(LeadSourceEnums);
    const leadsData = Array.from({ length: 50 }, (_, i) => ({
      name: fullName(),
      companyName: pick(companies),
      email: `lead${i + 1}@${pick(['gmail.com', 'outlook.com', 'corporate.sa', 'business.com'])}`,
      phone: `05${rand(10000000, 99999999)}`,
      status:
        i < 15
          ? LeadStatusEnums.NEW
          : i < 25
            ? LeadStatusEnums.CONTACTED
            : i < 35
              ? LeadStatusEnums.QUALIFIED
              : pick([LeadStatusEnums.CONVERTED, LeadStatusEnums.DISQUALIFIED, LeadStatusEnums.LOST]),
      leadSource: pick(leadSources),
      score: rand(5, 98),
      notes: i < 10 ? 'High priority lead from trade show' : i < 20 ? 'Inbound from website demo request' : undefined,
      lastContactDate: i < 30 ? daysAgo(rand(0, 30)) : undefined
    }));
    const createdLeads = await Lead.bulkCreate(leadsData);
    for (const lead of createdLeads) {
      await LeadUsers.create({ leadId: lead.id, userId: pickSalesUser() });
    }
    // Leads created

    // ── 6. OPPORTUNITIES (30) ──
    // Seeding Opportunities
    const _oppStages = [
      OpportunityStageEnums.DISCOVERY,
      OpportunityStageEnums.PROPOSAL,
      OpportunityStageEnums.NEGOTIATION,
      OpportunityStageEnums.WON,
      OpportunityStageEnums.LOST
    ];
    const priorities = Object.values(OpportunityPriorityEnums);

    const qualifiedLeads = createdLeads.filter(l => ['QUALIFIED', 'CONVERTED', 'CONTACTED'].includes((l as any).status));
    const oppsData = Array.from({ length: 30 }, (_, i) => {
      const lead = qualifiedLeads[i % qualifiedLeads.length];
      return {
        name: `${pick(['CRM Implementation', 'Cloud Migration', 'ERP Upgrade', 'Digital Transformation', 'IT Infrastructure', 'Cybersecurity Audit', 'Data Analytics Platform', 'Mobile App Dev', 'SAP Integration', 'AI Automation'])} — ${pick(companies.slice(0, 10))}`,
        leadId: lead?.id,
        clientId: createdClients[i % createdClients.length].id,
        stage:
          i < 8
            ? OpportunityStageEnums.DISCOVERY
            : i < 15
              ? OpportunityStageEnums.PROPOSAL
              : i < 22
                ? OpportunityStageEnums.NEGOTIATION
                : i < 27
                  ? OpportunityStageEnums.WON
                  : OpportunityStageEnums.LOST,
        estimatedValue: money(15000, 500000),
        expectedCloseDate: days(rand(-10, 90)),
        priority: pick(priorities),
        notes: i < 5 ? 'Strategic account — CEO involvement' : undefined
      };
    });
    const createdOpps = await Opportunity.bulkCreate(oppsData);
    for (const opp of createdOpps) {
      await OpportunityUsers.create({ opportunityId: opp.id, userId: pickSalesUser() });
    }
    // Opportunities created

    // ── 7. DEALS (25) ──
    // Seeding Deals
    const wonOpps = createdOpps.filter(o => ['WON', 'NEGOTIATION', 'PROPOSAL'].includes((o as any).stage));
    const dealsData = Array.from({ length: 25 }, (_, i) => {
      const opp = wonOpps[i % wonOpps.length];
      return {
        name: `Deal-${(i + 1).toString().padStart(3, '0')}: ${pick(['Enterprise License', 'Professional Services', 'Annual Contract', 'Project Delivery', 'SaaS Subscription', 'Consulting Engagement'])}`,
        companyName: pick(companies.slice(0, 10)),
        price: money(25000, 750000),
        contractType: i % 3 === 0 ? ContractTypeEnums.PurchaseOrder : ContractTypeEnums.Contract,
        signatureDate: i < 18 ? daysAgo(rand(1, 120)) : undefined,
        stage: i < 14 ? DealStageEnums.PROGRESS : i < 20 ? DealStageEnums.CLOSED : i < 23 ? DealStageEnums.CANCELLED : DealStageEnums.CONVERTED,
        leadId: opp?.leadId || createdLeads[i % createdLeads.length].id,
        clientId: createdClients[i % createdClients.length].id,
        opportunityId: opp?.id,
        cancelledReason: i >= 20 && i < 23 ? 'Budget constraints' : undefined
      };
    });
    const createdDeals = await Deal.bulkCreate(dealsData);
    for (const deal of createdDeals) {
      await DealUsers.create({ dealId: deal.id, userId: pickSalesUser() });
    }
    // Deals created

    // ── 8. INVOICES (20) ──
    // Seeding Invoices
    const closedDeals = createdDeals.filter(d => ['CLOSED', 'PROGRESS'].includes((d as any).stage));
    const invoicesData = Array.from({ length: 20 }, (_, i) => {
      const deal = closedDeals[i % closedDeals.length];
      return {
        invoiceNumber: `INV-2026-${(i + 1).toString().padStart(4, '0')}`,
        amount: money(5000, 200000),
        invoiceDate: daysAgo(rand(1, 90)),
        collected: i < 12,
        collectedDate: i < 12 ? daysAgo(rand(0, 30)) : null,
        dealId: deal.id
      };
    });
    await Invoice.bulkCreate(invoicesData);
    // Invoices created

    // ── 9. PROPOSALS (5) ──
    // Seeding Proposals
    const proposalStatuses = [
      ProposalStatusEnum.APPROVED,
      ProposalStatusEnum.APPROVED,
      ProposalStatusEnum.WAITING_APPROVAL,
      ProposalStatusEnum.REJECTED,
      ProposalStatusEnum.DRAFT
    ];
    const proposalsData = Array.from({ length: 5 }, (_, i) => ({
      title: `${pick(['Enterprise CRM Implementation', 'Cloud Infrastructure Proposal', 'Digital Workplace Transformation', 'AI & Analytics Suite', 'Managed Services Agreement'])}`,
      version: '1.0',
      proposalDate: daysAgo(rand(1, 60)),
      type: pick([ProposalTypeEnum.FINANCIAL, ProposalTypeEnum.TECHNICAL, ProposalTypeEnum.MIXED]),
      reference: `PROP-2026-${(i + 1).toString().padStart(4, '0')}`,
      proposalFor: createdClients[i].clientName,
      companyLogo: '/uploads/logo.png',
      status: proposalStatuses[i],
      relatedEntityId: createdDeals[i]?.id,
      relatedEntityType: ProposalModelEnum.Deal,
      rejectionReason: proposalStatuses[i] === ProposalStatusEnum.REJECTED ? 'Price exceeds allocated budget' : undefined
    }));
    const createdProposals = await Proposal.bulkCreate(proposalsData);
    for (const prop of createdProposals) {
      await ProposalUsers.create({ proposalId: prop.id, userId: pickSalesUser() });
    }
    // Proposals created

    // ── 10. SALES ORDERS (8) ──
    // Seeding Sales Orders
    const soStatuses = ['DRAFT', 'CONFIRMED', 'CONFIRMED', 'PROCESSING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'DELIVERED'];
    const createdSOs: any[] = [];
    for (let i = 0; i < 8; i++) {
      const client = createdClients[i % createdClients.length];
      const so = await SalesOrder.create({
        orderNumber: `SO-${(i + 1).toString().padStart(4, '0')}`,
        status: soStatuses[i],
        clientId: client.id,
        dealId: createdDeals[i]?.id,
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        total: 0,
        currency: 'SAR',
        paymentTerms: pick(['Net 30', 'Net 60', 'Due on Receipt']),
        notes: `Sales order for ${client.clientName}`
      });

      // Add 2-4 line items per SO
      const itemCount = rand(2, 4);
      let subtotal = 0;
      for (let j = 0; j < itemCount; j++) {
        const qty = rand(1, 20);
        const unitPrice = money(500, 25000);
        const lineTotal = qty * unitPrice;
        subtotal += lineTotal;
        await SalesOrderItem.create({
          salesOrderId: so.id,
          description: pick([
            'CRM License (Annual)',
            'Implementation Services',
            'Training Package',
            'Support Plan — Premium',
            'Data Migration Service',
            'Custom Development — 40 hrs',
            'Hardware — Server Rack',
            'Cloud Hosting — 12 months'
          ]),
          quantity: qty,
          unitPrice,
          taxRate: 15,
          discountRate: i < 3 ? 5 : 0,
          lineTotal
        });
      }
      const tax = Math.round(subtotal * 0.15);
      const discount = i < 3 ? Math.round(subtotal * 0.05) : 0;
      await so.update({ subtotal, taxAmount: tax, discountAmount: discount, total: subtotal + tax - discount });
      createdSOs.push(so);
    }
    // Sales orders created

    // ── 11. PROJECTS (8) ──
    // Seeding Projects
    const projStatuses = [
      ProjectStatusEnum.ACTIVE,
      ProjectStatusEnum.ACTIVE,
      ProjectStatusEnum.ACTIVE,
      ProjectStatusEnum.ACTIVE,
      ProjectStatusEnum.ON_HOLD,
      ProjectStatusEnum.ON_HOLD,
      ProjectStatusEnum.COMPLETE,
      ProjectStatusEnum.COMPLETE
    ];
    const projectNames = [
      'Aramco Digital Transformation',
      'NEOM Smart City CRM',
      'STC Network Upgrade',
      'Al Rajhi Core Banking',
      'Red Sea Resort IT',
      'Vision 2030 Analytics',
      'Maaden ERP Migration',
      'Jarir E-Commerce Platform'
    ];
    const projectsData = projectNames.map((name, i) => ({
      name,
      status: projStatuses[i],
      category: ProjectCategoryEnum.Direct,
      type: pick(['Development', 'Consulting', 'Research']),
      clientId: createdClients[i % createdClients.length].id,
      startDate: daysAgo(rand(30, 180)),
      endDate: days(rand(30, 365)),
      duration: rand(30, 180),
      description: `Enterprise project for ${createdClients[i % createdClients.length].clientName}`,
      dealId: createdDeals[i]?.id || null,
      leadId: null
    }));
    const createdProjects = await Project.bulkCreate(projectsData);
    for (const proj of createdProjects) {
      await UserProjects.create({ projectId: proj.id, userId: pickSalesUser() });
    }
    // Projects created

    // ── 12. TASKS (30) ──
    // Seeding Tasks
    const taskTitles = [
      'Prepare client demo environment',
      'Follow up on proposal feedback',
      'Schedule discovery call',
      'Send revised pricing to client',
      'Update CRM deal notes',
      'Prepare quarterly review deck',
      'Onboard new team member',
      'Review contract terms',
      'Configure staging environment',
      'Complete security assessment',
      'Draft SOW document',
      'Conduct user training',
      'Fix integration issues',
      'Migrate legacy data',
      'Setup monitoring dashboards',
      'Create API documentation',
      'Performance optimization sprint',
      'Design system architecture',
      'Implement payment gateway',
      'Deploy to production',
      'Conduct code review',
      'Update project timeline',
      'Prepare invoice batch',
      'Audit user permissions',
      'Setup backup procedures',
      'Test disaster recovery',
      'Create marketing collateral',
      'Analyze competitor pricing',
      'Build reporting dashboard',
      'Prepare board presentation'
    ];
    const tasksData = taskTitles.map((title, i) => ({
      title,
      description: `Task created for enterprise demo. ${title.toLowerCase()} — Priority item for Q1 delivery.`,
      assignedTo: createdUsers[rand(0, createdUsers.length - 1)].id,
      createdBy: adminId,
      status: i < 10 ? 'PENDING' : i < 20 ? 'IN_PROGRESS' : i < 27 ? 'COMPLETED' : 'CANCELLED',
      priority: i < 5 ? 'URGENT' : i < 12 ? 'HIGH' : i < 22 ? 'MEDIUM' : 'LOW',
      dueDate: days(rand(-10, 30)),
      completedAt: i >= 20 && i < 27 ? daysAgo(rand(1, 15)) : undefined,
      tags: [pick(['sales', 'delivery', 'support', 'internal', 'urgent'])],
      entityType: i < 8 ? 'project' : i < 15 ? 'deal' : undefined,
      entityId: i < 8 ? createdProjects[i % createdProjects.length].id : i < 15 ? createdDeals[i % createdDeals.length].id : undefined
    }));
    await Task.bulkCreate(tasksData);
    // Tasks created

    // ── 13. DEPARTMENTS & EMPLOYEES (12) ──
    // Seeding Departments & Employees
    const deptsData = [
      { name: 'Sales', code: 'SALES', description: 'Sales and Business Development' },
      { name: 'Engineering', code: 'ENG', description: 'Software Engineering & IT' },
      { name: 'Human Resources', code: 'HR', description: 'People & Culture' },
      { name: 'Finance', code: 'FIN', description: 'Finance & Accounting' },
      { name: 'Support', code: 'SUP', description: 'Customer Support' }
    ];
    const createdDepts: any[] = [];
    for (const d of deptsData) {
      const [dept] = await (Department as any).findOrCreate({
        where: { code: d.code },
        defaults: d
      });
      createdDepts.push(dept);
    }

    const employeeData = [
      {
        firstName: 'Khalid',
        lastName: 'Al-Rashid',
        email: 'khalid@hp-tech.com',
        jobTitle: 'Sales Director',
        departmentId: createdDepts[0].id,
        salary: 28000,
        employmentType: 'FULL_TIME'
      },
      {
        firstName: 'Omar',
        lastName: 'Al-Dosari',
        email: 'omar@hp-tech.com',
        jobTitle: 'Sales Manager',
        departmentId: createdDepts[0].id,
        salary: 22000,
        employmentType: 'FULL_TIME'
      },
      {
        firstName: 'Sara',
        lastName: 'Al-Ghamdi',
        email: 'sara@hp-tech.com',
        jobTitle: 'Account Executive',
        departmentId: createdDepts[0].id,
        salary: 16000,
        employmentType: 'FULL_TIME'
      },
      {
        firstName: 'Ahmed',
        lastName: 'Al-Harbi',
        email: 'ahmed@hp-tech.com',
        jobTitle: 'Account Executive',
        departmentId: createdDepts[0].id,
        salary: 15000,
        employmentType: 'FULL_TIME'
      },
      {
        firstName: 'Noura',
        lastName: 'Al-Qahtani',
        email: 'noura@hp-tech.com',
        jobTitle: 'Business Development Rep',
        departmentId: createdDepts[0].id,
        salary: 13000,
        employmentType: 'FULL_TIME'
      },
      {
        firstName: 'Tariq',
        lastName: 'Al-Mutairi',
        email: 'tariq@hp-tech.com',
        jobTitle: 'Senior Developer',
        departmentId: createdDepts[1].id,
        salary: 25000,
        employmentType: 'FULL_TIME'
      },
      {
        firstName: 'Rania',
        lastName: 'Al-Zahrani',
        email: 'rania@hp-tech.com',
        jobTitle: 'Full Stack Developer',
        departmentId: createdDepts[1].id,
        salary: 20000,
        employmentType: 'FULL_TIME'
      },
      {
        firstName: 'Youssef',
        lastName: 'Al-Zahrani',
        email: 'youssef@hp-tech.com',
        jobTitle: 'HR Manager',
        departmentId: createdDepts[2].id,
        salary: 20000,
        employmentType: 'FULL_TIME'
      },
      {
        firstName: 'Dalal',
        lastName: 'Al-Shehri',
        email: 'dalal@hp-tech.com',
        jobTitle: 'HR Coordinator',
        departmentId: createdDepts[2].id,
        salary: 12000,
        employmentType: 'FULL_TIME'
      },
      {
        firstName: 'Ali',
        lastName: 'Al-Otaibi',
        email: 'ali@hp-tech.com',
        jobTitle: 'Finance Manager',
        departmentId: createdDepts[3].id,
        salary: 24000,
        employmentType: 'FULL_TIME'
      },
      {
        firstName: 'Faisal',
        lastName: 'Al-Otaibi',
        email: 'faisal@hp-tech.com',
        jobTitle: 'Support Lead',
        departmentId: createdDepts[4].id,
        salary: 18000,
        employmentType: 'FULL_TIME'
      },
      {
        firstName: 'Lama',
        lastName: 'Al-Shehri',
        email: 'lama@hp-tech.com',
        jobTitle: 'Support Agent',
        departmentId: createdDepts[4].id,
        salary: 12000,
        employmentType: 'FULL_TIME'
      }
    ];

    const createdEmployees: any[] = [];
    for (let i = 0; i < employeeData.length; i++) {
      const emp = employeeData[i];
      const user = createdUsers.find(u => u.email === emp.email);
      const [employee] = await (Employee as any).findOrCreate({
        where: { employeeNumber: `EMP-${(i + 1).toString().padStart(4, '0')}` },
        defaults: {
          employeeNumber: `EMP-${(i + 1).toString().padStart(4, '0')}`,
          ...emp,
          userId: user?.id,
          hireDate: daysAgo(rand(90, 730)),
          status: 'ACTIVE',
          salaryFrequency: 'MONTHLY'
        }
      });
      createdEmployees.push(employee);
    }
    // Set manager relationships
    if (createdEmployees[0]?.id) {
      for (let i = 1; i < 5; i++) {
        await createdEmployees[i]?.update({ managerId: createdEmployees[0].id });
      }
    }
    // Departments and employees created

    // ── 14. VENDORS (6) ──
    // Seeding Vendors
    const vendorsData = [
      {
        name: 'Dell Technologies KSA',
        type: 'Vendor',
        firstName: 'John',
        lastName: 'Smith',
        phone: '0112345001',
        email: 'sales@dell-ksa.com',
        serviceType: 'Hardware',
        evaluation: 92,
        defaultPaymentMethod: 'Credit'
      },
      {
        name: 'Oracle Cloud ME',
        type: 'Distributor',
        firstName: 'Sarah',
        lastName: 'Lee',
        phone: '0112345002',
        email: 'contact@oracle-me.com',
        serviceType: 'Software',
        evaluation: 88,
        defaultPaymentMethod: 'Credit'
      },
      {
        name: 'Cisco Saudi',
        type: 'Vendor',
        firstName: 'Ahmad',
        lastName: 'Khan',
        phone: '0112345003',
        email: 'enterprise@cisco-sa.com',
        serviceType: 'Both',
        evaluation: 95,
        defaultPaymentMethod: 'Credit'
      },
      {
        name: 'Local IT Supplies',
        type: 'LocalSupplier',
        firstName: 'Mohammed',
        lastName: 'Ali',
        phone: '0112345004',
        email: 'orders@localit.sa',
        serviceType: 'Hardware',
        evaluation: 75,
        defaultPaymentMethod: 'Cash'
      },
      {
        name: 'AWS Saudi Region',
        type: 'Distributor',
        firstName: 'Alex',
        lastName: 'Johnson',
        phone: '0112345005',
        email: 'aws-sa@amazon.com',
        serviceType: 'Software',
        evaluation: 97,
        defaultPaymentMethod: 'Credit'
      },
      {
        name: 'HP Enterprise ME',
        type: 'Vendor',
        firstName: 'Lisa',
        lastName: 'Wang',
        phone: '0112345006',
        email: 'enterprise@hpe-me.com',
        serviceType: 'Both',
        evaluation: 90,
        defaultPaymentMethod: 'Credit'
      }
    ];
    const createdVendors = await Vendor.bulkCreate(vendorsData as any);
    // Vendors created

    // ── 15. PURCHASE ORDERS (5) ──
    // Seeding Purchase Orders
    const poStatuses = ['Draft', 'Pending', 'Approved', 'Approved', 'Rejected'];
    for (let i = 0; i < 5; i++) {
      const vendor = createdVendors[i % createdVendors.length];
      const po = await PurchaseOrder.create({
        poNumber: `PO-2026-${(i + 1).toString().padStart(4, '0')}`,
        vendorId: vendor.id,
        status: poStatuses[i],
        paymentMethod: (vendor as any).defaultPaymentMethod || 'Cash',
        dueDate: days(rand(15, 60)),
        totalAmount: 0,
        createdBy: adminId,
        rejectionReason: poStatuses[i] === 'Rejected' ? 'Exceeds quarterly budget allocation' : undefined
      });

      let total = 0;
      for (let j = 0; j < rand(2, 4); j++) {
        const qty = rand(1, 50);
        const price = money(200, 15000);
        total += qty * price;
        await PurchaseOrderItem.create({
          purchaseOrderId: po.id,
          description: pick([
            'Server Rack Unit',
            'Cisco Switch 48-port',
            'UPS Battery Pack',
            'SSD 1TB Enterprise',
            'RAM 64GB ECC',
            'Network Cable Cat6 — 100m',
            'Firewall Appliance'
          ]),
          quantity: qty,
          unitPrice: price,
          tax: 15
        });
      }
      await po.update({ totalAmount: total });
    }
    // Purchase orders created

    // ── 16. EXPENSE CATEGORIES & EXPENSES (15) ──
    // Seeding Expenses
    const catData = [
      { name: 'Travel & Transportation', color: '#3b82f6', description: 'Business travel expenses' },
      { name: 'Office Supplies', color: '#22c55e', description: 'Office equipment and supplies' },
      { name: 'Software & Subscriptions', color: '#8b5cf6', description: 'SaaS and software licenses' },
      { name: 'Marketing & Advertising', color: '#f59e0b', description: 'Marketing campaigns and ads' },
      { name: 'Training & Development', color: '#ec4899', description: 'Team training programs' }
    ];
    const createdCats: any[] = [];
    for (const c of catData) {
      const [cat] = await (ExpenseCategory as any).findOrCreate({
        where: { name: c.name },
        defaults: c
      });
      createdCats.push(cat);
    }

    const expenseDescs = [
      'Flight to Jeddah — client meeting',
      'Monthly Slack subscription',
      'Office printer cartridges',
      'Google Ads campaign — Q1',
      'Team building workshop',
      'Hotel — Riyadh business trip',
      'Adobe Creative Cloud annual',
      'Standing desks (x3)',
      'Conference registration fees',
      'Uber business rides — January',
      'AWS hosting — February',
      'LinkedIn Sales Navigator',
      'Office renovation supplies',
      'Catering for client event',
      'Professional development course'
    ];
    const expStatuses = [
      'APPROVED',
      'APPROVED',
      'APPROVED',
      'APPROVED',
      'APPROVED',
      'PENDING',
      'PENDING',
      'PENDING',
      'PENDING',
      'REJECTED',
      'APPROVED',
      'APPROVED',
      'PENDING',
      'APPROVED',
      'PENDING'
    ];
    const expensesData = expenseDescs.map((desc, i) => ({
      description: desc,
      amount: money(200, 25000),
      date: daysAgo(rand(1, 60)).toISOString().split('T')[0],
      categoryId: createdCats[i % createdCats.length].id,
      status: expStatuses[i],
      submittedBy: createdUsers[rand(0, createdUsers.length - 1)].id,
      vendor: pick(['Various', 'Google', 'Amazon', 'Local vendor', 'Adobe', 'Microsoft']),
      receiptNumber: `REC-${rand(10000, 99999)}`
    }));
    await Expense.bulkCreate(expensesData);
    // Expense categories and expenses created

    // ── 17. SUPPORT TICKETS (10) ──
    // Seeding Support Tickets
    const ticketCatsData = [
      { name: 'Technical Issue', description: 'Software bugs and technical problems' },
      { name: 'Billing Inquiry', description: 'Payment and invoicing questions' },
      { name: 'Feature Request', description: 'New feature suggestions' },
      { name: 'Account Management', description: 'Account setup and configuration' }
    ];
    const createdTicketCats: any[] = [];
    for (const tc of ticketCatsData) {
      const [cat] = await (TicketCategory as any).findOrCreate({
        where: { name: tc.name },
        defaults: tc
      });
      createdTicketCats.push(cat);
    }

    const ticketSubjects = [
      'Cannot login after password reset',
      'Invoice #2045 shows wrong amount',
      'Dashboard charts not loading',
      'Request: Dark mode for mobile app',
      'Slow performance on reports page',
      'Need to merge duplicate contacts',
      'Email integration disconnected',
      'Approval workflow stuck in pending',
      'Export to Excel generates empty file',
      'Calendar sync not working'
    ];
    const ticketStatuses = [
      'OPEN',
      'OPEN',
      'IN_PROGRESS',
      'IN_PROGRESS',
      'IN_PROGRESS',
      'WAITING_CUSTOMER',
      'RESOLVED',
      'RESOLVED',
      'RESOLVED',
      'CLOSED'
    ];
    const ticketsData = ticketSubjects.map((subject, i) => ({
      ticketNumber: `TKT-2026-${(i + 1).toString().padStart(4, '0')}`,
      subject,
      description: `Customer reported: ${subject.toLowerCase()}. Requires investigation and resolution.`,
      status: ticketStatuses[i],
      priority: i < 2 ? 'URGENT' : i < 5 ? 'HIGH' : i < 8 ? 'MEDIUM' : 'LOW',
      categoryId: createdTicketCats[i % createdTicketCats.length].id,
      assignedTo: createdUsers[rand(6, 7)].id, // support agents
      clientId: createdClients[i % createdClients.length].id,
      source: pick(['EMAIL', 'PORTAL', 'PHONE', 'CHAT']),
      slaDeadline: days(rand(1, 5)),
      firstResponseAt: i > 1 ? daysAgo(rand(0, 2)) : undefined,
      resolvedAt: ticketStatuses[i] === 'RESOLVED' || ticketStatuses[i] === 'CLOSED' ? daysAgo(rand(0, 5)) : undefined,
      csatRating: ticketStatuses[i] === 'CLOSED' ? rand(3, 5) : undefined,
      tags: [pick(['urgent', 'escalated', 'vip', 'recurring', 'new-client'])]
    }));
    await Ticket.bulkCreate(ticketsData);
    // Support tickets created

    // ── 18. KB ARTICLES (5) ──
    // Seeding Knowledge Base
    const articles = [
      {
        title: 'Getting Started with Leadify CRM',
        slug: 'getting-started-crm',
        category: 'Onboarding',
        excerpt: 'A complete guide to setting up your CRM workspace'
      },
      {
        title: 'Managing Your Sales Pipeline',
        slug: 'managing-sales-pipeline',
        category: 'Sales',
        excerpt: 'Best practices for lead-to-deal conversion'
      },
      {
        title: 'Creating & Managing Proposals',
        slug: 'creating-proposals',
        category: 'Sales',
        excerpt: 'Step-by-step guide to creating winning proposals'
      },
      {
        title: 'Understanding Reports & Analytics',
        slug: 'reports-analytics',
        category: 'Analytics',
        excerpt: 'How to leverage data for better decisions'
      },
      { title: 'Workflow Automation Guide', slug: 'workflow-automation', category: 'Automation', excerpt: 'Automate repetitive tasks and save time' }
    ];
    const articlesData = articles.map((a, i) => ({
      ...a,
      content: `# ${a.title}\n\n${a.excerpt}.\n\n## Overview\n\nThis article covers the key concepts and workflows for ${a.category.toLowerCase()} in Leadify CRM.\n\n## Steps\n\n1. Navigate to the relevant module\n2. Follow the on-screen wizard\n3. Configure settings as needed\n4. Verify the results\n\n## Tips\n\n- Use keyboard shortcuts for faster navigation\n- Set up automated workflows to save time\n- Review analytics regularly for insights`,
      tags: [a.category.toLowerCase(), 'guide', 'documentation'],
      status: 'PUBLISHED',
      viewCount: rand(50, 500),
      helpfulCount: rand(10, 100),
      sortOrder: i + 1,
      authorId: adminId
    }));
    await KBArticle.bulkCreate(articlesData);
    // KB articles created

    // ── 19. CAMPAIGNS (3) ──
    // Seeding Campaigns
    const campaignsData = [
      {
        name: 'Q1 Product Launch Campaign',
        subject: 'Introducing Leadify CRM 3.0 — Your Enterprise Edge',
        status: CampaignStatus.SENT,
        sentAt: daysAgo(15),
        userId: adminId,
        htmlContent: '<h1>Leadify CRM 3.0</h1><p>Discover the new features.</p>'
      },
      {
        name: 'Renewal Reminder — March 2026',
        subject: 'Your subscription renews soon — Special offer inside',
        status: CampaignStatus.SCHEDULED,
        scheduledAt: days(10),
        userId: adminId,
        htmlContent: '<h1>Renewal Reminder</h1><p>Renew early for 15% off.</p>'
      },
      {
        name: 'Feature Announcement — AI Assistant',
        subject: 'Meet your new AI Sales Coach',
        status: CampaignStatus.DRAFT,
        userId: adminId,
        htmlContent: '<h1>AI Sales Coach</h1><p>AI-powered insights for your pipeline.</p>'
      }
    ];
    await Campaign.bulkCreate(campaignsData);
    // Campaigns created

    // ── 20. CALENDAR EVENTS (15) ──
    // Seeding Calendar Events
    const eventTitles = [
      'Client Demo — Aramco Digital',
      'Weekly Sales Standup',
      'Quarterly Business Review',
      'Follow-up Call — NEOM',
      'Team Lunch',
      'Sprint Planning',
      'Board Meeting Prep',
      'Training: CRM Advanced Features',
      'Client Onboarding — STC',
      'One-on-One with Manager',
      'Pipeline Review Meeting',
      'Proposal Deadline — Red Sea',
      'Investor Update Call',
      'Product Roadmap Workshop',
      'End-of-Month Closeout'
    ];
    const eventTypes = ['MEETING', 'CALL', 'TASK', 'REMINDER', 'OTHER'];
    const eventColors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const eventsData = eventTitles.map((title, i) => {
      const startOffset = rand(-5, 20);
      const startHour = rand(8, 16);
      const start = new Date(days(startOffset));
      start.setHours(startHour, 0, 0, 0);
      const end = new Date(start);
      end.setHours(startHour + rand(1, 3));
      return {
        title,
        description: `Scheduled event: ${title}`,
        startDate: start,
        endDate: end,
        allDay: i === 4 || i === 14,
        color: pick(eventColors),
        eventType: eventTypes[i % eventTypes.length],
        location: i < 5 ? 'Conference Room A' : i < 10 ? 'Virtual — Teams' : 'Office',
        userId: createdUsers[i % createdUsers.length].id
      };
    });
    await CalendarEvent.bulkCreate(eventsData);
    // Calendar events created

    // ── 21. APPROVAL WORKFLOWS & REQUESTS (5) ──
    // Seeding Approval Workflows
    const workflows = [
      {
        name: 'Purchase Order Approval',
        description: 'All POs above 10,000 SAR require manager approval',
        entityType: 'PURCHASE_ORDER',
        steps: [{ order: 1, approverUserId: adminId, approverName: admin.name, required: true }],
        isActive: true
      },
      {
        name: 'Expense Approval',
        description: 'Expenses above 5,000 SAR need finance approval',
        entityType: 'EXPENSE',
        steps: [
          { order: 1, approverUserId: createdUsers[1].id, approverName: createdUsers[1].name, required: true },
          { order: 2, approverUserId: adminId, approverName: admin.name, required: true }
        ],
        isActive: true
      }
    ];
    const createdWorkflows: any[] = [];
    for (const wf of workflows) {
      const created = await ApprovalWorkflow.create(wf as any);
      createdWorkflows.push(created);
    }

    const approvalStatuses = ['PENDING', 'PENDING', 'APPROVED', 'APPROVED', 'REJECTED'];
    for (let i = 0; i < 5; i++) {
      await ApprovalRequest.create({
        workflowId: createdWorkflows[i % createdWorkflows.length].id,
        entityType: i < 3 ? 'purchase_order' : 'expense',
        entityId: i + 1,
        title: i < 3 ? `PO-2026-${(i + 1).toString().padStart(4, '0')} approval` : `Expense #${i + 1} approval`,
        description: `Approval request for ${i < 3 ? 'purchase order' : 'expense report'}`,
        status: approvalStatuses[i],
        currentStep: approvalStatuses[i] === 'PENDING' ? 0 : 1,
        stepResults:
          approvalStatuses[i] !== 'PENDING'
            ? [
                {
                  step: 1,
                  approverUserId: adminId,
                  status: approvalStatuses[i],
                  comment: approvalStatuses[i] === 'REJECTED' ? 'Over budget' : 'Looks good',
                  date: new Date().toISOString()
                }
              ]
            : [],
        requesterId: createdUsers[rand(1, 5)].id
      } as any);
    }
    // Workflows and approval requests created

    // ── 22. WORKFLOW RULES (3) ──
    // Seeding Workflow Automation Rules
    const workflowRules = [
      {
        name: 'Auto-Notify on High-Value Lead',
        description: 'When a lead with score > 80 is created, notify sales manager',
        entityType: 'lead',
        triggerType: TriggerType.ON_CREATE,
        conditionLogic: ConditionLogic.AND,
        conditions: [{ field: 'score', operator: 'greater_than', value: 80 }],
        actions: [
          {
            type: 'SEND_NOTIFICATION',
            role: 'SALES_MANAGER',
            title: 'High-Value Lead: {{name}}',
            message: 'A lead with score {{score}} was created. Immediate follow-up recommended.'
          }
        ],
        isActive: true,
        priority: 100,
        createdBy: adminId
      },
      {
        name: 'Create Follow-up Task on Deal',
        description: 'When a deal is updated, create a follow-up task for the assignee',
        entityType: 'deal',
        triggerType: TriggerType.ON_UPDATE,
        conditionLogic: ConditionLogic.AND,
        conditions: [{ field: 'stage', operator: 'equals', value: 'PROGRESS' }],
        actions: [{ type: 'CREATE_TASK', title: 'Follow up on {{name}}', assignedTo: '1', dueInDays: 3 }],
        isActive: true,
        priority: 90,
        createdBy: adminId
      },
      {
        name: 'SLA Warning on Support Ticket',
        description: 'Send warning notification when ticket SLA is approaching',
        entityType: 'ticket',
        triggerType: TriggerType.ON_CREATE,
        conditionLogic: ConditionLogic.AND,
        conditions: [{ field: 'priority', operator: 'equals', value: 'URGENT' }],
        actions: [
          {
            type: 'SEND_NOTIFICATION',
            role: 'SUPER_ADMIN',
            title: 'Urgent Ticket: {{subject}}',
            message: 'An urgent support ticket has been created. SLA response time: 1 hour.'
          }
        ],
        isActive: true,
        priority: 95,
        createdBy: adminId
      }
    ];
    await WorkflowRule.bulkCreate(workflowRules as any);
    // Workflow rules created

    // ── 23. NOTIFICATIONS (20) ──
    // Seeding Notifications
    const notifTypes = [
      'LEAD_ASSIGNED',
      'DEAL_ASSIGNED',
      'OPPORTUNITY_ASSIGNED',
      'DEAL_WON',
      'PROPOSAL_APPROVED',
      'PROPOSAL_REJECTED',
      'TASK_DUE',
      'APPROVAL_REQUESTED',
      'SLA_BREACH',
      'INVOICE_OVERDUE',
      'CONTRACT_EXPIRING',
      'SYSTEM_ALERT',
      'WORKFLOW_TRIGGERED',
      'COMMENT_MENTION',
      'SLA_WARNING',
      'CLIENT_ASSIGNED',
      'PROJECT_ASSIGNED',
      'PROPOSAL_ASSIGNED',
      'DEAL_WON',
      'SYSTEM_ALERT'
    ];
    const notifBodiesEn = [
      'New lead "Ahmed — NEOM" assigned to you',
      'Deal "Enterprise License — STC" assigned to you',
      'New opportunity "Cloud Migration" assigned',
      'Congratulations! Deal worth 350,000 SAR closed',
      'Proposal "CRM Implementation" has been approved',
      'Proposal "IT Audit" was rejected — see feedback',
      'Task "Prepare client demo" is due tomorrow',
      'New approval request for PO-2026-0001',
      'SLA breach on ticket TKT-2026-0001',
      'Invoice INV-2026-0005 is 15 days overdue',
      'Contract with Aramco Digital expires in 30 days',
      'System maintenance scheduled for tonight',
      'Workflow "Auto-Notify" triggered for new lead',
      'Khalid mentioned you in a comment',
      'SLA warning: Ticket response due in 2 hours',
      'New client "Red Sea Global" assigned to you',
      'Added to project "NEOM Smart City CRM"',
      'Assigned to proposal "Digital Transformation"',
      'Another deal worth 180,000 SAR won this week!',
      'Database backup completed successfully'
    ];
    const notifsData = notifTypes.map((type, i) => ({
      body_en: notifBodiesEn[i],
      body_ar: `إشعار تجريبي #${i + 1}`,
      userId: createdUsers[i % createdUsers.length].id,
      read: i < 8 ? 'UN_READ' : 'READ',
      type,
      target: i < 5 ? `/sales/leads` : i < 10 ? `/sales/deals` : undefined
    }));
    await Notification.bulkCreate(notifsData);
    // Notifications created

    // ── 24. FORECAST PERIODS (6) ──
    // Seeding Forecast Periods
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const forecastData = months.map((m, i) => {
      const target = money(200000, 500000);
      const actual = i < 2 ? money(150000, target + 50000) : 0;
      return {
        userId: adminId,
        period: 'monthly' as const,
        startDate: new Date(2026, i, 1),
        endDate: new Date(2026, i + 1, 0),
        target,
        predicted: Math.round(target * (0.7 + Math.random() * 0.5)),
        actual,
        closedWon: i < 2 ? Math.round(actual * 0.7) : 0,
        closedLost: i < 2 ? Math.round(actual * 0.15) : 0,
        pipeline: money(100000, 400000)
      };
    });
    await ForecastPeriod.bulkCreate(forecastData);
    // Forecast periods created

    // ── 25. GAMIFICATION ──
    // Seeding Gamification
    const achievements = [
      { name: 'First Deal', description: 'Close your first deal', icon: 'trophy', pointsValue: 100, criteria: 'deals_closed >= 1' },
      { name: 'Pipeline Pro', description: 'Have 10+ deals in pipeline', icon: 'star', pointsValue: 250, criteria: 'deals_active >= 10' },
      { name: 'Lead Machine', description: 'Create 50+ leads', icon: 'zap', pointsValue: 200, criteria: 'leads_created >= 50' },
      { name: 'Closer', description: 'Close 500K+ in deals', icon: 'target', pointsValue: 500, criteria: 'revenue_closed >= 500000' },
      { name: 'Team Player', description: 'Complete 20+ tasks', icon: 'users', pointsValue: 150, criteria: 'tasks_completed >= 20' }
    ];
    await Achievement.bulkCreate(achievements);

    // Award points to sales users
    const pointReasons = ['Closed deal', 'Created qualified lead', 'Completed task on time', 'Won proposal approval', 'Hit monthly target'];
    for (const userId of salesUserIds) {
      for (let i = 0; i < rand(3, 8); i++) {
        await UserPoints.create({
          userId,
          points: rand(25, 200),
          reason: pick(pointReasons),
          entityType: pick(['deal', 'lead', 'task']),
          entityId: String(rand(1, 100))
        });
      }
    }
    // Achievements and user points created

    // ── DONE ──
    // DEMO SEED COMPLETE
    process.exit(0);
  } catch (error: unknown) {
    console.error('Seed failed:', (error as Error).message);
    console.error((error as Error).stack);
    process.exit(1);
  }
}

seedDemo();
