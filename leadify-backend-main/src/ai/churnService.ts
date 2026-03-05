import { Op } from 'sequelize';
import Lead from '../lead/leadModel';
import { LeadStatusEnums } from '../lead/leadEnum';
import User from '../user/userModel';
import { LeadPermissionsEnum } from '../role/roleEnum';

export interface ChurnLead {
  id: string;
  name: string;
  email: string | null;
  status: string;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  riskScore: number;
  daysSinceLastContact: number;
  lastContactDate: Date | null;
}

export interface ChurnDashboardData {
  summary: {
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    totalAtRisk: number;
  };
  atRiskLeads: ChurnLead[];
  riskDistribution: Array<{ name: string; value: number }>;
}

class ChurnService {
  async predictChurn() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const highRiskLeads = await Lead.findAll({
      where: {
        status: { [Op.ne]: LeadStatusEnums.CONVERTED },
        lastContactDate: { [Op.lt]: thirtyDaysAgo }
      }
    });

    const mediumRiskLeads = await Lead.findAll({
      where: {
        status: { [Op.ne]: LeadStatusEnums.CONVERTED },
        lastContactDate: {
          [Op.lt]: fifteenDaysAgo,
          [Op.gt]: thirtyDaysAgo
        }
      }
    });

    return {
      highRiskCount: highRiskLeads.length,
      mediumRiskCount: mediumRiskLeads.length
    };
  }

  async getChurnDashboard(user: User): Promise<ChurnDashboardData> {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(now.getDate() - 15);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const baseWhere: Record<string, unknown> = {
      status: { [Op.ne]: LeadStatusEnums.CONVERTED }
    };

    // Scope by user permissions
    const hasGlobal = user.role?.permissions?.includes(LeadPermissionsEnum.VIEW_GLOBAL_LEADS);

    const include = hasGlobal
      ? []
      : [
          {
            model: User,
            as: 'users',
            where: { id: user.id },
            attributes: [],
            through: { attributes: [] },
            required: true
          }
        ];

    // High risk: no contact for 30+ days
    const highRiskLeads = await Lead.findAll({
      where: {
        ...baseWhere,
        [Op.or]: [{ lastContactDate: { [Op.lt]: thirtyDaysAgo } }, { lastContactDate: null }]
      },
      include,
      attributes: ['id', 'name', 'email', 'status', 'lastContactDate', 'score']
    });

    // Medium risk: 15-30 days since last contact
    const mediumRiskLeads = await Lead.findAll({
      where: {
        ...baseWhere,
        lastContactDate: {
          [Op.lt]: fifteenDaysAgo,
          [Op.gte]: thirtyDaysAgo
        }
      },
      include,
      attributes: ['id', 'name', 'email', 'status', 'lastContactDate', 'score']
    });

    // Low risk: 7-15 days since last contact
    const lowRiskLeads = await Lead.findAll({
      where: {
        ...baseWhere,
        lastContactDate: {
          [Op.lt]: sevenDaysAgo,
          [Op.gte]: fifteenDaysAgo
        }
      },
      include,
      attributes: ['id', 'name', 'email', 'status', 'lastContactDate', 'score']
    });

    const mapLeads = (leads: Lead[], riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'): ChurnLead[] => {
      return leads.map(lead => {
        const daysSince = lead.lastContactDate ? Math.floor((now.getTime() - new Date(lead.lastContactDate).getTime()) / (1000 * 60 * 60 * 24)) : 999;

        let riskScore: number;
        if (riskLevel === 'HIGH') riskScore = Math.min(100, 80 + Math.floor(daysSince / 10));
        else if (riskLevel === 'MEDIUM') riskScore = 50 + Math.floor((daysSince - 15) * 2);
        else riskScore = 20 + Math.floor((daysSince - 7) * 3.75);

        return {
          id: lead.id,
          name: lead.name,
          email: lead.email || null,
          status: lead.status,
          riskLevel,
          riskScore: Math.min(100, Math.max(0, riskScore)),
          daysSinceLastContact: daysSince,
          lastContactDate: lead.lastContactDate || null
        };
      });
    };

    const allAtRisk = [...mapLeads(highRiskLeads, 'HIGH'), ...mapLeads(mediumRiskLeads, 'MEDIUM'), ...mapLeads(lowRiskLeads, 'LOW')].sort(
      (a, b) => b.riskScore - a.riskScore
    );

    return {
      summary: {
        highRisk: highRiskLeads.length,
        mediumRisk: mediumRiskLeads.length,
        lowRisk: lowRiskLeads.length,
        totalAtRisk: allAtRisk.length
      },
      atRiskLeads: allAtRisk.slice(0, 20),
      riskDistribution: [
        { name: 'High Risk', value: highRiskLeads.length },
        { name: 'Medium Risk', value: mediumRiskLeads.length },
        { name: 'Low Risk', value: lowRiskLeads.length }
      ]
    };
  }
}

export default new ChurnService();
