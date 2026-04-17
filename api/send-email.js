export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, code } = req.body;

  if (!name || !email || !code) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const SENDER_EMAIL  = process.env.SENDER_EMAIL;
  const SENDER_NAME   = process.env.SENDER_NAME || 'Konferenca';

  // Build QR code URL using a free public API
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(code)}`;

  const html = `
  <div style="font-family:'Segoe UI',sans-serif;max-width:520px;margin:0 auto;background:#0a0a0f;color:#e8e8f0;border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#00e5b4,#00bcd4);padding:32px;text-align:center">
      <h1 style="margin:0;font-size:1.6rem;color:#000;letter-spacing:-0.02em">🎫 Karta Juaj e Hyrjes</h1>
      <p style="margin:8px 0 0;color:#000;opacity:0.7;font-size:0.9rem">${SENDER_NAME}</p>
    </div>
    <div style="padding:32px">
      <p style="font-size:1rem;margin:0 0 8px">Përshëndetje, <strong>${name}</strong>!</p>
      <p style="color:#9999bb;font-size:0.88rem;margin:0 0 24px">
        Regjistrimi juaj u konfirmua. Ky kod QR është kartela juaj e hyrjes për të gjitha eventet e konferencës.
      </p>
      <div style="text-align:center;margin-bottom:24px">
        <img src="${qrImageUrl}" alt="QR Code" style="width:220px;height:220px;border-radius:8px;border:8px solid #fff"/>
      </div>
      <div style="background:#1c1c28;border:1px solid #00e5b4;border-radius:6px;padding:12px;text-align:center;margin-bottom:24px">
        <p style="margin:0;font-size:0.72rem;color:#9999bb;letter-spacing:0.08em;text-transform:uppercase">Kodi juaj unik</p>
        <p style="margin:6px 0 0;font-family:monospace;font-size:1.3rem;letter-spacing:0.15em;color:#00e5b4">${code}</p>
      </div>
      <div style="background:#1c1c28;border:1px solid #2a2a3d;border-radius:8px;padding:16px;margin-bottom:24px">
        <p style="margin:0;font-size:0.85rem;color:#9999bb">
          📌 Mbajeni këtë kod gjatë gjithë konferencës.<br>
          ✅ Do të skanohet në hyrje të çdo eventi.<br>
          ⚠️ Mos e ndani me të tjerët — kodi është personal.
        </p>
      </div>
      <p style="color:#6b6b8a;font-size:0.75rem;text-align:center;margin:0">
        ⚠️ Ky kod është unik dhe personal.<br>Mos e ndani me të tjerët.
      </p>
    </div>
  </div>`;

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email, name }],
        subject: `🎫 Karta Juaj e Hyrjes — ${SENDER_NAME}`,
        htmlContent: html
      })
    });

    if (response.ok) {
      return res.status(200).json({ success: true });
    } else {
      const err = await response.json();
      return res.status(500).json({ error: err.message || 'Email send failed' });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

