const https = require('http');

const data = JSON.stringify({
    email: 'admin@hp-tech.com',
    password: 'Heroo@1502'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('🔄 Testing login API...');
console.log('📧 Email: admin@hp-tech.com');
console.log('🔑 Password: Heroo@1502');
console.log('');

const req = https.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        console.log('📊 Response Status:', res.statusCode);
        console.log('📦 Response Headers:', JSON.stringify(res.headers, null, 2));
        console.log('');
        console.log('📄 Response Body:');
        try {
            const parsed = JSON.parse(responseData);
            console.log(JSON.stringify(parsed, null, 2));

            if (res.statusCode === 200 && parsed.token) {
                console.log('');
                console.log('✅ LOGIN SUCCESSFUL! 🎉');
                console.log('🎫 Token received:', parsed.token.substring(0, 50) + '...');
            } else {
                console.log('');
                console.log('❌ LOGIN FAILED!');
            }
        } catch (e) {
            console.log(responseData);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Error occurred:');
    console.error('   Message:', error.message);
    console.error('   Code:', error.code);
    console.error('   Full error:', error);
});

req.write(data);
req.end();
