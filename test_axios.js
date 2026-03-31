const axios = require('./frontend/node_modules/axios');

(async () => {
    try {
        const loginRes = await axios.post('http://127.0.0.1:3000/api/v1/login', {
            email: 'admin@cinebook.com', password: 'admin123'
        });
        const token = loginRes.data.token;

        const stRes = await axios.get('http://127.0.0.1:3000/api/v1/showtimes');
        const activeST = stRes.data.data.find(s => s.status === 'scheduled');

        const bookRes = await axios.post('http://127.0.0.1:3000/api/v1/create-razorpay-order', {
            showtimeId: activeST._id, seats: ['A1']
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log("Razorpay Response:", bookRes.data);
    } catch (e) {
        console.error("AXIOS ERROR:", e.response ? e.response.data : e.message);
    }
})();
