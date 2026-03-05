import Integration from './integrationModel';
import { encrypt, decrypt } from '../utils/encryption';

const SENSITIVE_CONFIG_KEYS = ['apiKey', 'clientSecret', 'accessToken', 'refreshToken', 'secretKey', 'webhookSecret'];

type ConfigRecord = Record<string, any>;

function encryptSensitiveFields(config: ConfigRecord): ConfigRecord {
  if (!config || typeof config !== 'object') return config;
  const encrypted: ConfigRecord = { ...config };
  for (const key of SENSITIVE_CONFIG_KEYS) {
    if (encrypted[key] && typeof encrypted[key] === 'string') {
      try {
        encrypted[key] = encrypt(encrypted[key] as string);
      } catch {
        // If encryption fails, keep original value
      }
    }
  }
  return encrypted;
}

function decryptSensitiveFields(config: ConfigRecord): ConfigRecord {
  if (!config || typeof config !== 'object') return config;
  const decrypted: ConfigRecord = { ...config };
  for (const key of SENSITIVE_CONFIG_KEYS) {
    if (decrypted[key] && typeof decrypted[key] === 'string') {
      try {
        decrypted[key] = decrypt(decrypted[key] as string);
      } catch {
        // Value may not be encrypted yet (legacy data)
      }
    }
  }
  return decrypted;
}

interface UpsertIntegrationInput {
  provider: string;
  config?: ConfigRecord;
  [key: string]: any;
}

class IntegrationService {
  async getIntegrations(userId?: number): Promise<Record<string, any>[]> {
    const integrations = await Integration.findAll({
      where: {
        userId: userId || null
      }
    });
    return integrations.map(i => {
      const plain = i.toJSON() as Record<string, any>;
      if (plain.config) {
        plain.config = decryptSensitiveFields(plain.config as ConfigRecord);
      }
      return plain;
    });
  }

  async upsertIntegration(data: UpsertIntegrationInput, userId?: number): Promise<Integration> {
    const { provider, config, ...rest } = data;
    const configToStore = config ? encryptSensitiveFields(config) : encryptSensitiveFields(rest as ConfigRecord);

    const [integration] = await Integration.findOrCreate({
      where: { provider, userId: userId || null },
      defaults: { provider, userId: userId || null, config: configToStore }
    });

    if (integration) {
      await integration.update({ config: configToStore });
    }
    return integration;
  }

  async deleteIntegration(id: string): Promise<{ success: boolean }> {
    const integration = await Integration.findByPk(id);
    if (integration) {
      await integration.destroy();
    }
    return { success: true };
  }
}

export default new IntegrationService();
