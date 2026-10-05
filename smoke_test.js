import http from 'k6/http';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {
    const payload = {
        email: 'it.student2028@tcetmumbai.in',
        password: 'tcet@1234',
    };
    const loginRes = http.post(`${BASE_URL}/auth/login/`, payload);
    
    console.log(`Login response status: ${loginRes.status}`);
    if (loginRes.status === 200) {
        console.log(`Login response body: ${loginRes.body.substring(0, 500)}`);
    } else {
        console.log(`Cookies: ${JSON.stringify(loginRes.cookies)}`);
    }
}
