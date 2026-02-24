
// No import needed for Node 21+
async function checkStatus() {
    try {
        const res = await fetch('http://localhost:3001/api/status');
        const data = await res.json();
        console.log('Status:', data);
    } catch (e) {
        console.error('Fetch failed:', e);
    }
}

async function checkErrors() {
    try {
        const res = await fetch('http://localhost:3001/api/errors');
        if (!res.ok) {
            console.error('Errors Error:', res.status, res.statusText);
            const txt = await res.text();
            console.error('Body:', txt);
        } else {
            const data = await res.json();
            console.log('Errors Count:', data.length);
        }
    } catch (e) {
        console.error('Fetch Errors failed:', e);
    }
}

checkStatus();
checkErrors();
