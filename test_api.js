async function testCreateProject() {
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

        const projectData = {
            basicInfo: {
                name: "Test Project Mismatch",
                type: "Research",
                category: "Direct Project", // SENDING INCORRECT VALUE (Backend expects "Direct")
                assignedUsersIds: [1],
                duration: 10,
                status: "ACTIVE",
                description: "Test description"
            }
        };

        console.log('Sending request with INCORRECT category...');
        const createRes = await fetch('http://localhost:5000/api/project/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(projectData)
        });

        const createJson = await createRes.json();
        console.log('Response Status:', createRes.status);
        console.log('Response Body:', JSON.stringify(createJson, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testCreateProject();
