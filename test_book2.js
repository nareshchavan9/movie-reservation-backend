const http = require('http');

const req = http.request({
    hostname: 'localhost', port: 3000, path: '/api/v1/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
}, (res) => {
    let raw = ''; res.on('data', d => raw += d);
    res.on('end', () => {
        const loginData = JSON.parse(raw);

        // get showtimes
        http.get('http://localhost:3000/api/v1/showtimes', (stRes) => {
            let stRaw = ''; stRes.on('data', d => stRaw += d);
            stRes.on('end', () => {
                const showtimes = JSON.parse(stRaw).data;
                const activeST = showtimes.find(s => s.status === 'scheduled');

                // Book
                const bookReq = http.request({
                    hostname: 'localhost', port: 3000, path: '/api/v1/reservations', method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${loginData.token}` }
                }, (bookRes) => {
                    let bRaw = ''; bookRes.on('data', d => bRaw += d);
                    bookRes.on('end', () => console.log("Booking Response:", bRaw));
                });
                bookReq.write(JSON.stringify({ showtimeId: activeST._id, seats: ['A5'] }));
                bookReq.end();
            });
        });
    });
});
req.write(JSON.stringify({ email: 'admin@cinebook.com', password: 'admin123' }));
req.end();
