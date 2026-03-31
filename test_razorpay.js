const http = require('http');

const req = http.request({
    hostname: 'localhost', port: 3000, path: '/api/v1/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
}, (res) => {
    let raw = ''; res.on('data', d => raw += d);
    res.on('end', () => {
        const token = JSON.parse(raw).token;

        http.get('http://localhost:3000/api/v1/showtimes', (stRes) => {
            let stRaw = ''; stRes.on('data', d => stRaw += d);
            stRes.on('end', () => {
                const showtimes = JSON.parse(stRaw).data;
                const activeST = showtimes.find(s => s.status === 'scheduled');

                const bookReq = http.request({
                    hostname: 'localhost', port: 3000, path: '/api/v1/create-razorpay-order', method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
                }, (bookRes) => {
                    let bRaw = ''; bookRes.on('data', d => bRaw += d);
                    bookRes.on('end', () => console.log("Razorpay Response:", bRaw));
                });
                bookReq.write(JSON.stringify({ showtimeId: activeST._id, seats: ['A1'] }));
                bookReq.end();
            });
        });
    });
});
req.write(JSON.stringify({ email: 'admin@cinebook.com', password: 'admin123' }));
req.end();
