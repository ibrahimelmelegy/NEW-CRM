import { Op } from 'sequelize';
import Lead from '../lead/leadModel';
import { LeadStatusEnums } from '../lead/leadEnum';

class ChurnService {
    async predictChurn() {
        console.log('[ChurnAI] Starting predictive scan...');

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

        // 1. Identify High Risk Churn
        const highRiskLeads = await Lead.findAll({
            where: {
                status: { [Op.ne]: LeadStatusEnums.CONVERTED },
                lastContactDate: { [Op.lt]: thirtyDaysAgo }
            }
        });

        for (const lead of highRiskLeads) {
            // Logic: No contact for 30 days is high risk
            // We can add a metadata or specific column if needed, 
            // for now we'll log it or update a virtual field/notes
            console.log(`[ChurnAI] High Risk Lead Detected: ${lead.name}`);
        }

        // 2. Identify Medium Risk Churn
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
}

export default new ChurnService();
