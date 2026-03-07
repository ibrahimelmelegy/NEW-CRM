import { sequelize } from './config/db';
import User from './user/userModel';
import Lead from './lead/leadModel';
import Deal from './deal/model/dealModel';
import Opportunity from './opportunity/opportunityModel';
import Project from './project/models/projectModel';
import { LeadStatusEnums, LeadSourceEnums } from './lead/leadEnum';
import { OpportunityStageEnums } from './opportunity/opportunityEnum';
import { DealStageEnums, ContractTypeEnums } from './deal/dealEnum';
import { ProjectStatusEnum, ProjectCategoryEnum } from './project/projectEnum';
import LeadUsers from './lead/model/lead_UsersModel';

const seedRadical = async () => {
  try {
    await sequelize.authenticate();
    // DB Connected for Radical Seeding

    const admin = await User.findOne();
    if (!admin) {
      console.error('No user found. Run npm run seed first.');
      process.exit(1);
    }
    // Using admin user

    // 1. Seed Leads (20)
    const leadsData = Array.from({ length: 20 }).map((_, i) => ({
      name: `Lead ${i + 1}`,
      companyName: `Company ${String.fromCharCode(65 + i)}`,
      email: `lead${i}@example.com`,
      phone: `05000000${i.toString().padStart(2, '0')}`,
      status: i % 2 === 0 ? LeadStatusEnums.NEW : LeadStatusEnums.CONTACTED,
      leadSource: i % 3 === 0 ? LeadSourceEnums.EMAIL : LeadSourceEnums.WEBSITE,
      score: Math.floor(Math.random() * 100)
    }));
    const createdLeads = await Lead.bulkCreate(leadsData);

    // Assign leads to admin
    for (const lead of createdLeads) {
      await LeadUsers.create({ leadId: lead.id, userId: admin.id });
    }
    // Leads created and assigned

    // 2. Seed Opportunities (10)
    const oppsData = createdLeads.slice(0, 10).map((lead, i) => ({
      name: `Opp for ${lead.name}`,
      leadId: lead.id,
      stage: i % 2 === 0 ? OpportunityStageEnums.DISCOVERY : OpportunityStageEnums.PROPOSAL,
      expectedValue: (i + 1) * 5000
    }));
    const createdOpps = await Opportunity.bulkCreate(oppsData);
    // Opportunities created

    // 3. Seed Deals (5)
    const dealsData = createdOpps.slice(0, 5).map((opp, i) => ({
      name: `Deal ${i + 1}`,
      opportunityId: opp.id,
      leadId: opp.leadId,
      price: (i + 1) * 10000,
      contractType: ContractTypeEnums.Contract,
      stage: DealStageEnums.PROGRESS,
      signatureDate: new Date()
    }));
    const _createdDeals = await Deal.bulkCreate(dealsData);
    // Deals created

    // 4. Seed Projects (5)
    const projectsData = Array.from({ length: 5 }).map((_, i) => ({
      name: `Project ${i + 1}`,
      status: i % 2 === 0 ? ProjectStatusEnum.ACTIVE : ProjectStatusEnum.ON_HOLD,
      category: ProjectCategoryEnum.Direct,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }));
    await Project.bulkCreate(projectsData);
    // 5 Projects created

    // RADICAL SEEDING COMPLETE
  } catch (e: unknown) {
    console.error('Seeding Error:', (e as Error).message);
  }
  process.exit();
};

seedRadical();
