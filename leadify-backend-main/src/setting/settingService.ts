import { Transaction } from 'sequelize';
import { CreateOrUpdateSettingInput } from './inputs/createSettingInput';
import Setting from './settingModel';
import uploaderService from '../uploader/uploader.service';

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
    return existingSetting.save();
  }

  async getSetting(): Promise<Setting | null> {
    const existingSetting = await Setting.findOne({});
    return existingSetting;
  }
}

export default new SettingService();
