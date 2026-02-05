import Integration from './integrationModel';

class IntegrationService {
    async getIntegrations(userId?: number) {
        return await Integration.findAll({
            where: {
                userId: userId || null
            }
        });
    }

    async upsertIntegration(data: any, userId?: number) {
        const { provider, ...config } = data;
        const [integration] = await Integration.findOrCreate({
            where: { provider, userId: userId || null },
            defaults: { provider, userId: userId || null, ...config }
        });

        if (integration) {
            await integration.update(config);
        }
        return integration;
    }

    async deleteIntegration(id: string) {
        const integration = await Integration.findByPk(id);
        if (integration) {
            await integration.destroy();
        }
        return { success: true };
    }
}

export default new IntegrationService();
