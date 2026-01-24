const http = require('http');

const endpoints = [
    { name: 'Backend Root', url: 'http://localhost:5000/', expected: [200, 404] }, // Root might be 404 but server up
    { name: 'Role API (List)', url: 'http://localhost:5000/api/role/', expected: [401] }, // Should be 401 Unauthorized
    { name: 'Proposal API (List)', url: 'http://localhost:5000/api/proposal/', expected: [401] }, // Should be 401 Unauthorized
    { name: 'Frontend Main', url: 'http://localhost:3060/', expected: [200] },
    { name: 'React Proposal App', url: 'http://localhost:3001/', expected: [200] }
];

async function checkEndpoint(test) {
    return new Promise((resolve) => {
        const req = http.get(test.url, (res) => {
            const success = test.expected.includes(res.statusCode);
            resolve({
                name: test.name,
                url: test.url,
                status: res.statusCode,
                success: success,
                message: success ? 'OK' : `Expected ${test.expected}, got ${res.statusCode}`
            });
        });

        req.on('error', (e) => {
            resolve({
                name: test.name,
                url: test.url,
                status: 'ERROR',
                success: false,
                message: e.message
            });
        });

        req.end();
    });
}

async function runTests() {
    console.log('Running System Health Check...');
    const results = await Promise.all(endpoints.map(checkEndpoint));

    let failures = 0;
    results.forEach(r => {
        if (r.success) {
            console.log(`[PASS] ${r.name}: ${r.status}`);
        } else {
            console.log(`[FAIL] ${r.name}: ${r.message}`);
            failures++;
        }
    });

    if (failures === 0) {
        console.log('\nAll systems operational.');
    } else {
        console.log(`\n${failures} systems failed check.`);
    }
}

runTests();
