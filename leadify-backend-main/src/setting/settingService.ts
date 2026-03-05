import { Transaction } from 'sequelize';
import { CreateOrUpdateSettingInput } from './inputs/createSettingInput';
import Setting from './settingModel';
import uploaderService from '../uploader/uploader.service';
import cacheService from '../infrastructure/cacheService';

const SETTINGS_CACHE_KEY = 'settings:global';
const SETTINGS_CACHE_TTL = 300; // 5 minutes

class SettingService {
  async createOrUpdateSetting(input: CreateOrUpdateSettingInput, adminId: number, t?: Transaction): Promise<Setting> {
    let existingSetting = await Setting.findOne({});
    if (!existingSetting) {
      existingSetting = await Setting.create({});
    }

    if (input.logo && !input.logo.startsWith('data:')) {
      try {
        await uploaderService.setFileReferences([input.logo]);
      } catch {
        // Logo may be a data URL or external URL — skip file reference
      }
    }
    existingSetting.set(input);
    const saved = await existingSetting.save();

    // Invalidate settings cache after update
    await cacheService.del(SETTINGS_CACHE_KEY);

    return saved;
  }

  async getSetting(): Promise<Setting | null> {
    return cacheService.getOrSet<Setting | null>(
      SETTINGS_CACHE_KEY,
      async () => {
        const existingSetting = await Setting.findOne({});
        return existingSetting;
      },
      SETTINGS_CACHE_TTL
    );
  }
}

export default new SettingService();
