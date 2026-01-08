const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api';
// A mock ~80KB Text string to simulate base64 image
const MOCK_IMAGE = 'data:image/jpeg;base64,' + 'A'.repeat(80000);

const testUpload = async () => {
    try {
        console.log('1. Logging in...');
        // Login to get token (assuming user exists from previous steps, or we use a known one)
        // I'll grab the user from the check-user script, or just generic
        let loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'john@example.com', password: 'password123' })
        });

        let loginData = await loginRes.json();

        // If john doesn't exist, try to register
        if (!loginData.success) {
            console.log('Login failed, registering new user...');
            const regRes = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Test User', email: 'test_upload@example.com', password: 'password123' })
            });
            loginData = await regRes.json();

            // If register says "email in use", try login with that email
            if (!loginData.success && loginData.message && loginData.message.includes('already in use')) {
                console.log('User exists, logging in as test_upload...');
                loginRes = await fetch(`${BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'test_upload@example.com', password: 'password123' })
                });
                loginData = await loginRes.json();
            }
        }

        if (!loginData.success) {
            console.error('Failed to get token:', loginData);
            return;
        }

        const token = loginData.data.accessToken;
        console.log('2. Got Token. Updating Profile with Image...');
        console.log(`Image Size: ${MOCK_IMAGE.length} chars`);

        const updateRes = await fetch(`${BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: 'Updated Name ' + Date.now(),
                profile_image: MOCK_IMAGE
            })
        });

        const updateData = await updateRes.json();
        console.log('3. Update Response:', updateData);

        if (updateData.success && updateData.data.profile_image) {
            console.log('SUCCESS! Profile image saved and returned.');
            console.log('Returned Image Length:', updateData.data.profile_image.length);
        } else {
            console.error('FAILURE. Image not saved/returned.');
            console.log(updateData);
        }

    } catch (error) {
        console.error('Test Error:', error);
    }
};

testUpload();
