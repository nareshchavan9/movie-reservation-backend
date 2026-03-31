const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = http.request(options, (res) => {
    let rawData = '';
    res.on('data', (chunk) => rawData += chunk);
    res.on('end', () => {
        const loginData = JSON.parse(rawData);
        console.log("Login Success:", loginData.success);

        const resOptions = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/v1/reservations',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${loginData.token}`
            }
        };

        const req2 = http.request(resOptions, (res2) => {
            let resData = '';
            res2.on('data', (chunk) => resData += chunk);
            res2.on('end', () => {
                console.log("Reservations Response:", resData);
            });
        });
        req2.end();
    });
});
req.write(JSON.stringify({ email: 'admin@cinebook.com', password: 'admin123' }));
req.end();
