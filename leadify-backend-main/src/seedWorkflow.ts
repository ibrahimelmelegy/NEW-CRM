import { Sequelize } from 'sequelize-typescript';
import { sequelize } from './config/db';
import WorkflowRule, { TriggerType, ConditionLogic } from './workflow/workflowModel';

async function seedDelayedWorkflow() {
    await sequelize.authenticate();
    console.log('Database connected.');

    const sampleRule = await WorkflowRule.create({
        name: '[DEMO] High-Value Lead Nurturing Journey',
        description: 'When a lead above 50K is created: Send Email -> Wait 1 Minute -> Create Task for Sales',
        entityType: 'lead',
        triggerType: TriggerType.ON_CREATE,
        conditionLogic: ConditionLogic.AND,
        conditions: [
            {
                field: 'estimatedValue',
                operator: 'greater_than',
                value: 50000
            }
        ],
        actions: [
            {
                type: 'SEND_NOTIFICATION',
                title: 'New High Value Lead: {{name}}',
                message: 'A lead worth {{estimatedValue}} was just created. Nurturing journey started.',
                role: 'SUPER_ADMIN'
            },
            {
                type: 'DELAY',
                hours: 0,
                days: 0 // We will use a smaller value for testing in the db directly, or rely on execution.
            },
            {
                type: 'CREATE_TASK',
                title: 'Call {{name}} Regarding 50K+ Deal',
                assignedTo: '1', // Assign to Super Admin
                dueInDays: 1
            }
        ],
        isActive: true,
        priority: 100
    });

    // Hack for testing: set a 1 minute delay in milliseconds manually since our model only takes days/hours.
    // We'll update the action graph directly in JSONB.
    const actions = [...sampleRule.actions];
    actions[1] = { type: 'DELAY', _testMs: 60000 } as any;
    await sampleRule.update({ actions });

    console.log(`Created test workflow rule ID: ${sampleRule.id}`);
    process.exit(0);
}

seedDelayedWorkflow().catch(console.error);
