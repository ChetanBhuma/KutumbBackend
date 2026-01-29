
// Native fetch


async function testLogin() {
    try {
        const response = await fetch('http://localhost:3000/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identifier: 'admin@delhipolice.gov.in',
                password: 'admin123'
            })
        });

        const data = await response.json();
        console.log('Status:', response.status);

        if (data.success && data.data.accessToken) {
            console.log('Login Successful');
            const token = data.data.accessToken;
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(base64));
            console.log('Token Payload Role:', payload.role);
            console.log('Token Payload Email:', payload.email);
        } else {
            console.log('Login Failed:', data);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

function atob(str) {
    return Buffer.from(str, 'base64').toString('binary');
}

testLogin();
