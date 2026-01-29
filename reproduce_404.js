
const axios = require('axios');

async function reproduce404() {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWpjc3h0eXowMDAyc3E5cHZvaHFiNXowIiwiZW1haWwiOiJvZmZpY2VyLXJhbmdlQGRlbGhpcG9saWNlLmdvdi5pbiIsInJvbGUiOiJPRkZJQ0VSIiwiaWF0IjoxNzY2NDg2MDkyLCJleHAiOjE3NjcwOTA4OTIsImF1ZCI6InNlbmlvci1jaXRpemVuLXBvcnRhbCJ9.Kf0m5fRNdP3NmusixQ0YnRuSzTKwot2HEoxgyrSfdbE';
    const url = 'http://localhost:5000/api/v1/officer-app/assignments';

    console.log(`Testing valid token request to: ${url}`);

    try {
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${token}` },
            validateStatus: () => true
        });

        console.log(`Status: ${response.status}`);
        if(response.status !== 200) {
            console.log(`Error Message:`, response.data.error?.message);
        } else {
            console.log("Success!");
        }

    } catch (error) {
        console.error('Request failed:', error.message);
    }
}

reproduce404();
