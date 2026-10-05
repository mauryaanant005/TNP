import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Custom metrics
const apiDuration = new Trend('api_duration');
const errorRate = new Rate('error_rate');

export const options = {
    stages: [
        { duration: '30s', target: 50 },    
        { duration: '1m', target: 200 },    
        { duration: '2m', target: 3000 },   
        { duration: '2m', target: 3000 },   
        { duration: '1m', target: 0 },      
    ],
    thresholds: {
        'http_req_duration': ['p(95)<2000'],
        'error_rate': ['rate<0.05'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export function setup() {
    // 1. Login once and get cookies
    const payload = {
        email: '1032241254@tcetmumbai.in',
        password: 'tcet@1234',
    };
    
    // Pass a fake X-Forwarded-For just in case
    // disable redirects to capture the 302 Response and its cookies
    const params = {
        headers: {
            'X-Forwarded-For': '192.168.1.100',
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirects: 0
    };
    
    const loginRes = http.post(`${BASE_URL}/auth/login/`, payload, params);
    
    let is_logged_in = loginRes.cookies['is_logged_in'] ? loginRes.cookies['is_logged_in'][0].value : '';
    let sessionid = loginRes.cookies['sessionid'] ? loginRes.cookies['sessionid'][0].value : '';
    let csrftoken = loginRes.cookies['csrftoken'] ? loginRes.cookies['csrftoken'][0].value : '';

    if (loginRes.status === 403) {
        console.error("Login rate limited! Waiting for 1 minute before running the test...");
    } else if (loginRes.status === 200) {
        console.error("Login returned 200 OK - meaning authentication failed and form was re-rendered!");
    } else if (loginRes.status === 302) {
        console.log("Login successful! sessionid received.");
    } else {
        console.log(`Login unexpected status: ${loginRes.status}`);
    }

    return {
        sessionid: sessionid,
        csrftoken: csrftoken,
    };
}

export default function (data) {
    if (!data.sessionid) {
        // If setup failed to login, we can't test API endpoints correctly.
        sleep(1);
        return;
    }

    // Prepare cookies for requests
    const jar = http.cookieJar();
    jar.set(BASE_URL, 'sessionid', data.sessionid);
    jar.set(BASE_URL, 'csrftoken', data.csrftoken);
    jar.set(BASE_URL, 'is_logged_in', 'true');

    // 2. Fetch API Endpoints as logged in student
    group('Student API Navigation', function () {
        const endpoints = [
            '/api/student/info/',
            '/api/student/placement-card/',
            '/api/student/attendance-data/',
            '/api/student/internships/',
            '/api/student/training-performance/',
        ];

        endpoints.forEach((endpoint) => {
            const params = {
                headers: {
                    'X-Forwarded-For': `10.0.0.${__VU % 250}`, // Distribute IPs
                },
            };

            const res = http.get(`${BASE_URL}${endpoint}`, params);
            
            apiDuration.add(res.timings.duration);
            
            const reqCheck = check(res, {
                'status is 200': (r) => r.status === 200,
            });

            if (!reqCheck) {
                errorRate.add(1);
            }
            sleep(0.5); // Add a small sleep between API calls like a real user
        });
    });

    sleep(1);
}
