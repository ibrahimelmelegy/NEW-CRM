import { http, HttpResponse } from 'msw';

export const handlers = [
    // Mock GET /auth/me
    http.get('*/auth/me', () => {
        return HttpResponse.json({
            success: true,
            user: {
                id: 'user-1',
                name: 'Test User',
                roleId: 'role-admin',
            },
        });
    }),

    // Mock GET /role/:id
    http.get('*/role/:id', ({ params }) => {
        return HttpResponse.json({
            success: true,
            body: {
                id: params.id,
                permissions: ['CREATE_OPPORTUNITIES', 'EDIT_OPPORTUNITIES', 'CREATE_PROJECTS'],
            },
        });
    }),

    // Mock GET /users
    http.get('*/users', () => {
        return HttpResponse.json({
            success: true,
            body: {
                docs: [
                    { id: 1, name: 'Admin User' },
                    { id: 2, name: 'Sales Rep' },
                ],
            },
        });
    }),

    // Mock GET /client
    http.get('*/client', () => {
        return HttpResponse.json({
            success: true,
            body: {
                docs: [
                    { id: 'c1', clientName: 'ACME Corp' },
                ],
            },
        });
    }),

    // Mock GET /opportunity
    http.get('*/opportunity', () => {
        return HttpResponse.json({
            success: true,
            body: {
                docs: [
                    {
                        _id: '1',
                        id: '1',
                        name: 'Test Opportunity',
                        stage: 'DISCOVERY',
                        estimatedValue: 10000,
                        leads: { name: 'John Doe' },
                    },
                ],
                pagination: { totalPages: 1, limit: 10, page: 1, totalItems: 1 },
            },
        });
    }),

    // Mock POST /opportunity (Success and Validation)
    http.post('*/opportunity', async ({ request }) => {
        const body: any = await request.json();

        // Simulate validation error
        if (!body.name) {
            return HttpResponse.json({
                success: false,
                message: 'Name is required',
                code: 422
            }, { status: 422 });
        }

        return HttpResponse.json({
            success: true,
            data: body,
            message: 'Opportunity created successfully',
        });
    }),

    // Mock GET /project
    http.get('*/project', () => {
        return HttpResponse.json({
            success: true,
            body: {
                docs: [
                    {
                        _id: 'p1',
                        id: 'p1',
                        name: 'Test Project',
                        status: 'ACTIVE',
                    },
                ],
                pagination: { totalPages: 1, limit: 10, page: 1, totalItems: 1 },
            },
        });
    }),

    // Mock POST /project/create
    http.post('*/project/create', async ({ request }) => {
        const body: any = await request.json();

        if (!body.basicInfo?.name) {
            return HttpResponse.json({
                success: false,
                message: 'Project Name is required',
                code: 422
            }, { status: 422 });
        }

        return HttpResponse.json({
            success: true,
            body: { id: 'new-p-1', ...body },
            message: 'Project created successfully',
        });
    }),

    // Mock GET /project/draft
    http.get('*/project/draft', () => {
        return HttpResponse.json({
            success: true,
            body: {
                project: { id: 'draft-1', name: 'Draft Project' },
                step: 1
            },
        });
    }),

    // Mock generic 500 error
    http.get('*/fail', () => {
        return HttpResponse.json({
            success: false,
            message: 'Internal Server Error',
        }, { status: 500 });
    }),

    // --- LEADS ---
    http.get('*/lead', () => {
        return HttpResponse.json({
            success: true,
            body: {
                docs: [
                    { id: 'l1', name: 'Test Lead', status: 'NEW' },
                ],
                pagination: { totalPages: 1, limit: 10, page: 1, totalItems: 1 },
            },
        });
    }),
    http.post('*/lead', async ({ request }) => {
        const body: any = await request.json();
        return HttpResponse.json({ success: true, body: { id: 'new-l1', ...body } });
    }),

    // --- DEALS ---
    http.get('*/deal', () => {
        return HttpResponse.json({
            success: true,
            body: {
                docs: [
                    { id: 'd1', name: 'Test Deal', stage: 'PROGRESS' },
                ],
                pagination: { totalPages: 1, limit: 10, page: 1, totalItems: 1 },
            },
        });
    }),
    http.post('*/deal/create', async ({ request }) => {
        return HttpResponse.json({ success: true, body: { id: 'new-d1' } });
    }),

    // --- PROPOSALS ---
    http.get('*/proposal/p1', () => {
        return HttpResponse.json({
            success: true,
            body: {
                id: 'p1',
                title: 'Test Proposal',
                status: 'WAITING_APPROVAL',
                financeTables: []
            },
        });
    }),
    http.post('*/proposal', async ({ request }) => {
        const body: any = await request.json();
        if (!body.title) return HttpResponse.json({ success: false, message: "Title required" }, { status: 422 });
        return HttpResponse.json({ success: true, body: { id: 'p1', ...body } });
    }),
    // Proposal Approval
    http.put('*/proposal/approve/:id', () => {
        return HttpResponse.json({ success: true, message: "Approved" });
    }),
    // Proposal Reject
    http.put('*/proposal/reject/:id', async ({ request }) => {
        const body: any = await request.json();
        if (!body.rejectionReason) return HttpResponse.json({ success: false, message: "Reason required" }, { status: 422 });
        return HttpResponse.json({ success: true, message: "Rejected" });
    }),
    // Proposal Finance Tables
    http.get('*/proposal-finance-table/', () => {
        return HttpResponse.json({
            success: true,
            body: {
                financeTable: [
                    { id: 1, title: 'Table 1', totalPrice: 100 }
                ]
            }
        });
    }),

    // --- DAILY TASKS ---
    http.get('*/daily-task', () => {
        return HttpResponse.json({
            success: true,
            body: {
                docs: [
                    { id: 'dt1', task: 'Fix bugs' },
                ]
            }
        });
    }),

    // --- STAFF ---
    http.get('*/user/staff', () => { // Assuming endpoint
        return HttpResponse.json({
            success: true,
            body: {
                docs: [
                    { id: 's1', name: 'Staff Member' },
                ]
            }
        });
    }),

];
