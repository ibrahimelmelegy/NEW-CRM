import crypto from 'crypto';
import Contract from './contractModel';
import { ContractStatus } from './contractEnum';
import { sendEmail } from '../utils/emailHelper';
import Deal from '../deal/model/dealModel';

class ContractService {
  async getAll(userId: number) {
    return Contract.findAll({
      where: { userId },
      include: [{ model: Deal, attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });
  }

  async getById(id: string) {
    const contract = await Contract.findByPk(id, {
      include: [{ model: Deal, attributes: ['id', 'name'] }]
    });
    if (!contract) throw new Error('Contract not found');
    return contract;
  }

  async create(userId: number, data: any) {
    const signingToken = crypto.randomBytes(32).toString('hex');
    return Contract.create({
      ...data,
      userId,
      status: ContractStatus.DRAFT,
      signingToken
    });
  }

  async update(id: string, userId: number, data: any) {
    const contract = await Contract.findOne({ where: { id, userId } });
    if (!contract) throw new Error('Contract not found');
    if (contract.status === ContractStatus.SIGNED) throw new Error('Cannot edit signed contract');
    return contract.update(data);
  }

  async delete(id: string, userId: number) {
    const contract = await Contract.findOne({ where: { id, userId } });
    if (!contract) throw new Error('Contract not found');
    await contract.destroy();
  }

  async sendForSignature(id: string, userId: number, baseUrl: string) {
    const contract = await Contract.findOne({ where: { id, userId } });
    if (!contract) throw new Error('Contract not found');
    if (!contract.signerEmail) throw new Error('Signer email is required');

    const signingUrl = `${baseUrl}/sign/${contract.signingToken}`;

    await sendEmail({
      to: contract.signerEmail,
      subject: `Contract: ${contract.title} - Signature Required`,
      text: `You have been asked to sign "${contract.title}". Click the link to review and sign: ${signingUrl}`,
      html: `<h2>Contract Signature Required</h2>
             <p>You have been asked to sign "<strong>${contract.title}</strong>".</p>
             <p><a href="${signingUrl}" style="background:#7849ff;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Review & Sign</a></p>`
    });

    await contract.update({
      status: ContractStatus.SENT,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    return contract;
  }

  async getByToken(token: string) {
    const contract = await Contract.findOne({ where: { signingToken: token } });
    if (!contract) throw new Error('Contract not found');
    if (contract.status === ContractStatus.SIGNED) throw new Error('Contract already signed');
    if (contract.expiresAt && new Date() > new Date(contract.expiresAt)) {
      throw new Error('Signing link has expired');
    }

    if (contract.status === ContractStatus.SENT) {
      await contract.update({ status: ContractStatus.VIEWED });
    }

    return contract;
  }

  async sign(token: string, signatureData: string, signerName: string) {
    const contract = await Contract.findOne({ where: { signingToken: token } });
    if (!contract) throw new Error('Contract not found');
    if (contract.status === ContractStatus.SIGNED) throw new Error('Already signed');

    const signatureHash = crypto
      .createHash('sha256')
      .update(signatureData + contract.id + new Date().toISOString())
      .digest('hex');

    await contract.update({
      status: ContractStatus.SIGNED,
      signatureData,
      signatureHash,
      signerName,
      signedAt: new Date()
    });

    return contract;
  }
}

export default new ContractService();
