/* ============================================================
   /api/enquiry — Vercel Function
   Receives quote-form POSTs, atomically increments a sequential
   enquiry counter in Upstash Redis, formats a rich email body,
   and forwards to Web3Forms for delivery to info@showlimousines.com.au.

   Response: { success: boolean, ref?: number, message?: string }
   ============================================================ */
'use strict';

const WEB3FORMS_KEY = 'dd2aed41-b37a-4a83-b839-01c86d5a6b2e';
const WEB3FORMS_URL = 'https://api.web3forms.com/submit';
const COUNTER_KEY = 'sl:enquiry_counter';

const FIELD_ORDER = [
  ['name', 'Name'],
  ['phone', 'Phone'],
  ['email', 'Email'],
  ['date', 'Event date'],
  ['pickup_time', 'Pick up time'],
  ['dropoff_time', 'Drop off time'],
  ['pickup_location', 'Pick up location'],
  ['dropoff_location', 'Drop off location'],
  ['passengers', 'Passengers'],
  ['occasion', 'Occasion'],
  ['comments', 'Comments'],
];

function isoToAuDate(iso) {
  // "2026-07-28" -> "28/07/2026". Anything else passes through untouched.
  if (typeof iso !== 'string') return '';
  var m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? (m[3] + '/' + m[2] + '/' + m[1]) : iso;
}

function trim(v) { return String(v == null ? '' : v).trim(); }

async function upstash(command) {
  var url = process.env.KV_REST_API_URL;
  var token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  try {
    var r = await fetch(url + '/' + command.map(encodeURIComponent).join('/'), {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token }
    });
    if (!r.ok) return null;
    var j = await r.json();
    return typeof j.result === 'number' ? j.result : null;
  } catch (e) {
    return null;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Vercel auto-parses JSON when Content-Type: application/json.
  var body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  // Rollback branch — called by main.js on Web3Forms failure so we don't leak
  // counter gaps for enquiries that never actually landed in Mick's inbox.
  if (body.action === 'rollback') {
    await upstash(['decr', COUNTER_KEY]);
    return res.status(200).json({ success: true });
  }

  // Honeypot — silently pretend success so the bot moves on.
  if (body.botcheck) {
    return res.status(200).json({ success: true, ref: null });
  }

  var name = trim(body.name);
  var phone = trim(body.phone);
  var email = trim(body.email);
  if (!name || !phone || !email) {
    return res.status(400).json({ success: false, message: 'Name, phone and email are required.' });
  }

  var ref = await upstash(['incr', COUNTER_KEY]);

  var occasion = trim(body.occasion) || 'General enquiry';
  var auDate = isoToAuDate(trim(body.date));
  var submittedFrom = trim(body.submitted_from) || '(unknown page)';

  // Summary line — this is what mobile inboxes surface as the preview snippet.
  var summary = name + ' · ' + phone + ' · ' + email;

  // Full body — ordered, human-readable, ends with the referrer page.
  var lines = [];
  lines.push('Enquiry ' + (ref ? '#' + ref : '(ref unavailable)'));
  lines.push('');
  lines.push('Summary: ' + summary);
  lines.push('');
  FIELD_ORDER.forEach(function (pair) {
    var key = pair[0], label = pair[1];
    var val = trim(body[key]);
    if (!val) return;
    if (key === 'date') val = auDate;
    lines.push(label + ': ' + val);
  });
  lines.push('');
  lines.push('— — —');
  lines.push('Submitted from: ' + submittedFrom);
  var enquiryBody = lines.join('\n');

  // Unique subject — kills Gmail desktop threading.
  var subjectParts = ['New enquiry'];
  if (ref) subjectParts.push('#' + ref);
  subjectParts.push('— ' + name);
  if (occasion) subjectParts.push('(' + occasion + ')');
  var subject = subjectParts.join(' ');

  // Web3Forms free tier blocks server-to-server POSTs — the browser must be the
  // client. We return the fully-composed Web3Forms payload so main.js can relay
  // it from the browser in a second hop.
  var payload = {
    access_key: WEB3FORMS_KEY,
    subject: subject,
    from_name: 'Show Limousines Website',
    email: email,
    replyto: email,
    Summary: summary,
    Enquiry: enquiryBody,
  };

  return res.status(200).json({
    success: true,
    ref: ref,
    submit_to: { url: WEB3FORMS_URL, payload: payload }
  });
};
