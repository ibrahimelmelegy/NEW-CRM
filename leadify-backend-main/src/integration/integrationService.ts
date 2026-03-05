import Integration from './integrationModel';
import { encrypt, decrypt } from '../utils/encryption';

const SENSITIVE_CONFIG_KEYS = ['apiKey', 'clientSecret', 'accessToken', 'refreshToken'];

function encryptSensitiveFields(config: unknown): unknown {
  if (!config || typeof config !== 'object') return config;
  const encrypted = { ...config };
  for (const key of SENSITIVE_CONFIG_KEYS) {
    if (encrypted[key] && typeof encrypted[key] === 'string') {
      try {
        encrypted[key] = encrypt(encrypted[key]);
      } catch {
        // If encryption fails, keep original value
      }
    }
  }
  return encrypted;
}

function decryptSensitiveFields(config: unknown): unknown {
  if (!config || typeof config !== 'object') return config;
  const decrypted = { ...config };
  for (const key of SENSITIVE_CONFIG_KEYS) {
    if (decrypted[key] && typeof decrypted[key] === 'string') {
      try {
        decrypted[key] = decrypt(decrypted[key]);
      } catch {
        // Value may not be encrypted yet (legacy data)
      }
    }
  }
  return decrypted;
}

class IntegrationService {
  async getIntegrations(userId?: number) {
    const integrations = await Integration.findAll({
      where: {
        userId: userId || null
      }
    });
    return integrations.map(i => {
      const plain = i.toJSON();
      if (plain.config) {
        plain.config = decryptSensitiveFields(plain.config);
      }
      return plain;
    });
  }

  async upsertIntegration(data: unknown, userId?: number) {
    const { provider, ...rest } = data;
    const configToStore = rest.config ? encryptSensitiveFields(rest.config) : encryptSensitiveFields(rest);

    const [integration] = await Integration.findOrCreate({
      where: { provider, userId: userId || null },
      defaults: { provider, userId: userId || null, config: configToStore }
    });

    if (integration) {
      await integration.update({ config: configToStore });
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
