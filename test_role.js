async function testCreateRole() {
    const loginData = {
        email: 'admin@hp-tech.com',
        password: 'Heroo@1502'
    };

    try {
        console.log('Logging in to backend...');
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });
        const loginJson = await loginRes.json();
        const token = loginJson.token;
        if (!token) {
            console.error('Login failed:', loginJson);
            return;
        }

        const roleData = {
            name: "Test Role " + Date.now(),
            description: "Test description",
            permissions: ["VIEW_ROLES", "REJECT_PROPOSALS", "WAITING_APPROVAL_PROPOSALS"]
        };

        console.log('Sending request to create role...');
        const createRes = await fetch('http://localhost:5000/api/role/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(roleData)
        });

        const createJson = await createRes.json();
        console.log('Response Status:', createRes.status);
        console.log('Response Body:', JSON.stringify(createJson, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testCreateRole();
