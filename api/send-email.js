// Vercel Serverless Function to send an email using Resend

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Since this is a serverless function, we need to read the req.body manually
    // Depending on how Vercel handles it, sometimes it's already parsed as JSON
    let body = req.body;
    try {
        if (typeof req.body === 'string') {
            body = JSON.parse(req.body);
        }
    } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON body' });
    }

    const { name, email, message } = body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
        console.error("Missing RESEND_API_KEY environment variable.");
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        // Use Resend API
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // "onboarding@resend.dev" can be used to send to the registered Resend account email
                from: 'Portfolio Contact <onboarding@resend.dev>',
                to: ['jericoberme29@gmail.com'],
                subject: `New Portfolio Message from ${name}`,
                html: `
                    <h2>New message from your portfolio website!</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Message:</strong></p>
                    <p style="white-space: pre-wrap;">${message}</p>
                `
            })
        });

        const data = await response.json();

        if (response.ok) {
            return res.status(200).json({ success: true, data });
        } else {
            console.error("Resend API Error:", data);
            return res.status(response.status).json({ success: false, error: data });
        }
    } catch (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}
