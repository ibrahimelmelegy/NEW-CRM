
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const PASSWORD = process.env.TEST_USER_PASSWORD;
if (!PASSWORD) {
    console.error('ERROR: Set TEST_USER_PASSWORD environment variable to run verification.');
    process.exit(1);
}

async function verify() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.token || loginData.data?.token; // Adjust based on actual response structure

        if (!token) {
            console.error('Token not found in response:', loginData);
            return;
        }
        console.log('Login successful.');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 2. List Proposals
        console.log('Fetching proposals...');
        const listRes = await fetch(`${API_URL}/proposal?limit=1`, { headers });
        const listData = await listRes.json();
        const proposals = listData.data?.docs || listData.docs || [];

        if (proposals.length === 0) {
            console.log('No proposals found. Skipping specific checks.');
            return;
        }

        const proposalId = proposals[0].id;
        console.log(`Checking Proposal ID: ${proposalId}`);

        // 3. Get Proposal By ID (Client Name Fix)
        const detailRes = await fetch(`${API_URL}/proposal/${proposalId}`, { headers });
        const detailData = await detailRes.json();
        const detail = detailData.data || detailData; // Wrapper adjustment

        console.log('--- Client Name Verification ---');
        console.log('Related Entity:', JSON.stringify(detail.relatedEntity, null, 2));
        console.log('Client Field (Root):', JSON.stringify(detail.client, null, 2));

        if (detail.client && detail.client.name) {
            console.log('✅ Client Name is populated at root!');
        } else {
            console.log('❌ Client Name missing from root.');
        }

        if (detail.relatedEntity && detail.relatedEntity.client) {
            console.log('✅ Client Name is populated in relatedEntity!');
        } else {
            console.log('❌ Client Name missing from relatedEntity.');
        }

        // 4. Archiving Filter Check
        console.log('--- Archiving Filter Verification ---');
        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1;
        const archiveRes = await fetch(`${API_URL}/proposal?year=${year}&month=${month}`, { headers });
        const archiveData = await archiveRes.json();
        console.log(`Proposals for ${year}-${month}:`, archiveData.data?.docs?.length || archiveData.docs?.length || 0);

    } catch (error) {
        console.error('Verification failed:', error.message);
    }
}

verify();
