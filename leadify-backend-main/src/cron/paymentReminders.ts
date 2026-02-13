import cron from 'node-cron';
import { Op } from 'sequelize';
import PurchaseOrder, { POStatusEnum } from '../procurement/models/purchaseOrderModel';
import NotificationService from '../notification/notificationService';

class PaymentReminderScheduler {
    public start(): void {
        // Schedule task to run at 09:00 AM every day
        cron.schedule('0 9 * * *', async () => {
            await this.checkDuePayments();
        });
    }

    private async checkDuePayments(): Promise<void> {
        try {
            const today = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(today.getDate() + 1);

            // Find POs due today or tomorrow that are APPROVED (and assume unpaid if no payment status, or we can add paymentStatus later)
            // For now, based on user request, we notify on "Due Date equality"
            // We'll verify assuming existing fields.
            const duePos = await PurchaseOrder.findAll({
                where: {
                    status: POStatusEnum.APPROVED,
                    dueDate: {
                        [Op.between]: [today.setHours(0, 0, 0, 0), tomorrow.setHours(23, 59, 59, 999)]
                    }
                }
            });

            for (const po of duePos) {
                await NotificationService.createNotification(
                    po.createdBy, // Notify creator
                    'Payment Due Alert',
                    `Purchase Order ${po.poNumber} is due for payment on ${po.dueDate?.toLocaleDateString()}.`,
                    { type: 'purchase_order', id: po.id }
                );
            }

        } catch (error) {
            // Payment reminder scheduler error - silently handled
        }
    }
}

export default new PaymentReminderScheduler();
