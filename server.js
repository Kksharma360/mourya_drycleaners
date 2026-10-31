// server.js – Mourya Dry Cleaners Server
// ---------------------------------------------------------------
// Purpose: serve the public website, the standalone admin dashboard,
// and provide REST APIs that store data in Supabase
// with local JSON caching.
// ---------------------------------------------------------------

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// ---------- Supabase Service ----------
const supabaseService = require('./supabase-service');

// ---------- Strict Admin Credentials ----------
// ID: mouryadrycleaners24@gmail.com
// Password: Jatin@123
const STRICT_ADMIN_EMAIL = 'mouryadrycleaners24@gmail.com';
const STRICT_ADMIN_HASH = '3ec14622f51d9c257bad55d2d3eedaf663cffde5efae8172606134875acfd0b7'; // sha256('mouryadrycleaners24@gmail.com:Jatin@123')

// Active admin sessions: token -> { createdAt, expiresAt }
const ACTIVE_SESSIONS = new Map();
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours valid session

function generateSessionToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  ACTIVE_SESSIONS.set(token, { createdAt: Date.now(), expiresAt });
  return token;
}

function isValidSession(token) {
  if (!token) return false;
  const session = ACTIVE_SESSIONS.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    ACTIVE_SESSIONS.delete(token);
    return false;
  }
  return true;
}

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      if (parts.length >= 2) {
        list[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('=').trim());
      }
    });
  }
  return list;
}

// ---------- Brute Force & Rate Limiter Configuration ----------
const LOGIN_ATTEMPTS = new Map(); // ip -> { count, lockedUntil }
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || '127.0.0.1';
}

function checkRateLimit(ip) {
  const now = Date.now();
  const record = LOGIN_ATTEMPTS.get(ip);
  if (!record) return { allowed: true };
  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingSec = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, remainingSec };
  }
  if (record.lockedUntil && now >= record.lockedUntil) {
    LOGIN_ATTEMPTS.delete(ip);
    return { allowed: true };
  }
  return { allowed: true };
}

function recordFailedLogin(ip) {
  const now = Date.now();
  const record = LOGIN_ATTEMPTS.get(ip) || { count: 0, lockedUntil: null };
  record.count += 1;
  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    console.warn(`[Security Alert] IP ${ip} locked out due to ${record.count} failed login attempts.`);
  }
  LOGIN_ATTEMPTS.set(ip, record);
}

function recordSuccessfulLogin(ip) {
  LOGIN_ATTEMPTS.delete(ip);
}

// Constant-time string comparison (prevents timing side-channel attacks)
function constantTimeCompare(strA, strB) {
  if (typeof strA !== 'string' || typeof strB !== 'string') return false;
  const bufA = Buffer.from(strA, 'utf8');
  const bufB = Buffer.from(strB, 'utf8');
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// Periodic cleanup of expired sessions and old lockout entries
setInterval(() => {
  const now = Date.now();
  for (const [token, s] of ACTIVE_SESSIONS.entries()) {
    if (now > s.expiresAt) ACTIVE_SESSIONS.delete(token);
  }
  for (const [ip, r] of LOGIN_ATTEMPTS.entries()) {
    if (r.lockedUntil && now > r.lockedUntil) LOGIN_ATTEMPTS.delete(ip);
  }
}, 10 * 60 * 1000);

// Request body reader with strict size limit (DoS protection against memory exhaustion)
function readBodyWithLimit(req, res, maxBytes = 100 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    let totalBytes = 0;
    let aborted = false;

    req.on('data', chunk => {
      if (aborted) return;
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        aborted = true;
        req.pause();
        if (!res.headersSent) {
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'error', error: '413 Payload Too Large' }));
        }
        req.destroy();
        reject(new Error('PAYLOAD_TOO_LARGE'));
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      if (!aborted) resolve(body);
    });
    req.on('error', err => {
      if (!aborted) reject(err);
    });
  });
}

// ---------- Server configuration ----------
const PORT = process.env.PORT || 8000;
const PUBLIC_DIR = __dirname; // serves the public site (index.html, etc.)
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'expenses');
const SCREENSHOTS_DIR = path.join(__dirname, 'uploads', 'screenshots');
const BILLS_DIR = path.join(__dirname, 'uploads', 'bills');
const INVOICES_FILE = path.join(DATA_DIR, 'invoices.json');
const EXPENSES_FILE = path.join(DATA_DIR, 'expenses.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Ensure required directories/files exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
if (!fs.existsSync(BILLS_DIR)) fs.mkdirSync(BILLS_DIR, { recursive: true });
if (!fs.existsSync(INVOICES_FILE)) fs.writeFileSync(INVOICES_FILE, '[]', 'utf8');
if (!fs.existsSync(EXPENSES_FILE)) fs.writeFileSync(EXPENSES_FILE, '[]', 'utf8');
if (!fs.existsSync(BOOKINGS_FILE)) fs.writeFileSync(BOOKINGS_FILE, '[]', 'utf8');

// ---------- MIME types ----------
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.pdf':  'application/pdf',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.mp4':  'video/mp4'
};

// ---------- Utility helpers ----------
function cleanUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.trim();
}

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return '127.0.0.1';
}

function readJsonFile(filePath, defaultVal = []) {
  try {
    if (!fs.existsSync(filePath)) return defaultVal;
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) || defaultVal;
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e.message);
    return defaultVal;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error(`Error writing ${filePath}:`, e.message);
    return false;
  }
}

// ---------- Supabase Sync Helpers ----------
async function syncBookingsFromSupabase() {
  const cloudBookings = await supabaseService.getBookings();
  if (cloudBookings && cloudBookings.length > 0) {
    writeJsonFile(BOOKINGS_FILE, cloudBookings);
    return cloudBookings;
  }
  return getLocalBookings();
}

async function syncExpensesFromSupabase() {
  const cloudExpenses = await supabaseService.getExpenses();
  if (cloudExpenses && cloudExpenses.length > 0) {
    writeJsonFile(EXPENSES_FILE, cloudExpenses);
    return cloudExpenses;
  }
  return readJsonFile(EXPENSES_FILE, []);
}

async function syncBillsFromSupabase() {
  const cloudBills = await supabaseService.getBills();
  if (cloudBills && cloudBills.length > 0) {
    writeJsonFile(INVOICES_FILE, cloudBills);
    return cloudBills;
  }
  return readJsonFile(INVOICES_FILE, []);
}

// Auto-migrate local records into Supabase
async function migrateLocalDataToSupabase() {
  try {
    const localBookings = getLocalBookings();
    for (const b of localBookings) {
      await supabaseService.saveBooking(b);
    }
    const localExpenses = readJsonFile(EXPENSES_FILE, []);
    for (const e of localExpenses) {
      await supabaseService.saveExpense(e);
    }
    const localBills = readJsonFile(INVOICES_FILE, []);
    for (const b of localBills) {
      await supabaseService.saveBill(b);
    }
    console.log('[Supabase Migration] Local data migration routine completed.');
  } catch (err) {
    console.warn('[Supabase Migration] Migration note:', err.message);
  }
}

function getLocalBookings() {
  return readJsonFile(BOOKINGS_FILE, []);
}

// ---------- Admin authentication helper ----------
async function verifyAdmin(req) {
  // 1. Check Bearer Authorization Header
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const parts = authHeader.split(' ');
    const token = parts[1] || parts[0];
    if (isValidSession(token)) return true;
  }
  // 2. Check Cookie
  const cookies = parseCookies(req);
  if (cookies.mdc_admin_token && isValidSession(cookies.mdc_admin_token)) {
    return true;
  }
  return false;
}

// ---------- HTTP server ----------
const server = http.createServer(async (req, res) => {
  // Global Security Headers (Clickjacking, MIME Sniffing, XSS Defenses)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // CORS headers (allow all for local dev)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ---------- API: Admin Login (Brute Force Protected, Constant-Time Comparison) ----------
  if (req.url === '/api/admin/login' && req.method === 'POST') {
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(clientIp);
    if (!rateCheck.allowed) {
      res.writeHead(429, {
        'Content-Type': 'application/json',
        'Retry-After': String(rateCheck.remainingSec)
      });
      res.end(JSON.stringify({
        status: 'error',
        error: `Too many failed login attempts. Please wait ${rateCheck.remainingSec} seconds before trying again.`
      }));
      return;
    }

    try {
      const body = await readBodyWithLimit(req, res, 10 * 1024); // Max 10KB
      const { username, password } = JSON.parse(body || '{}');
      const userClean = (username || '').trim().toLowerCase();
      const passExact = (password || '').trim(); // Exact password, strictly case-sensitive

      const inputHash = crypto.createHash('sha256').update(userClean + ':' + passExact).digest('hex');

      const isEmailMatch = constantTimeCompare(userClean, STRICT_ADMIN_EMAIL);
      const isHashMatch = constantTimeCompare(inputHash, STRICT_ADMIN_HASH);

      if (isEmailMatch && isHashMatch) {
        recordSuccessfulLogin(clientIp);
        const sessionToken = generateSessionToken();
        res.setHeader('Set-Cookie', `mdc_admin_token=${sessionToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'success',
          message: 'Authenticated successfully',
          token: sessionToken
        }));
      } else {
        recordFailedLogin(clientIp);
        // Delay response slightly to prevent timing attacks
        await new Promise(r => setTimeout(r, 600));
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', error: 'Invalid ID or Password' }));
      }
    } catch (err) {
      if (err.message === 'PAYLOAD_TOO_LARGE') return;
      if (!res.headersSent) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', error: 'Bad Request' }));
      }
    }
    return;
  }

  // ---------- API: Admin Logout ----------
  if (req.url === '/api/admin/logout' && req.method === 'POST') {
    const cookies = parseCookies(req);
    const authHeader = req.headers['authorization'];
    const token = (authHeader ? authHeader.split(' ')[1] : null) || cookies.mdc_admin_token;
    if (token) ACTIVE_SESSIONS.delete(token);

    res.setHeader('Set-Cookie', 'mdc_admin_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'success', message: 'Logged out successfully' }));
    return;
  }

  // ---------- API: Verify Admin Session ----------
  if (req.url === '/api/admin/verify-session' && req.method === 'GET') {
    if (await verifyAdmin(req)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'success', authenticated: true }));
    } else {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', authenticated: false, error: 'Unauthorized' }));
    }
    return;
  }

  // ---------- API: Save Website Order directly to Supabase & Local Database ----------
  if (req.url === '/api/save-order' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        if (!data.id) data.id = 'BOOK-' + Date.now();
        if (!data.receivedAt) data.receivedAt = new Date().toISOString();
        data.pickupDone = false;
        data.paymentDone = false;
        data.deliveryDone = false;

        // Save to Supabase
        await supabaseService.saveBooking(data);

        // Update local cache
        const local = getLocalBookings();
        local.unshift(data);
        writeJsonFile(BOOKINGS_FILE, local);

        console.log(`[Order Saved] ID: ${data.id} Customer: ${data.name}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', message: 'Order saved to Supabase', booking: data }));
      } catch (e) {
        console.error('[API] /api/save-order error:', e.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', error: e.message }));
      }
    });
    return;
  }

  // ---------- API: Create booking (manual) ----------
  if (req.url === '/api/admin/bookings' && req.method === 'POST') {
    if (!await verifyAdmin(req)) { res.writeHead(401, {'Content-Type':'application/json'}); res.end(JSON.stringify({status:'error',error:'Unauthorized'})); return; }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        if (!data.id) data.id = 'BOOK-' + Date.now();
        if (!data.receivedAt) data.receivedAt = new Date().toISOString();
        if (typeof data.pickupDone === 'undefined') data.pickupDone = false;
        if (typeof data.paymentDone === 'undefined') data.paymentDone = false;
        if (typeof data.deliveryDone === 'undefined') data.deliveryDone = false;
        
        await supabaseService.saveBooking(data);
        const local = getLocalBookings();
        local.unshift(data);
        writeJsonFile(BOOKINGS_FILE, local);
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({status:'success',message:'Booking saved',booking:data}));
      } catch (e) {
        console.error('[API] Save booking error:', e.message);
        res.writeHead(500, {'Content-Type':'application/json'});
        res.end(JSON.stringify({status:'error',error:e.message}));
      }
    });
    return;
  }

  // ---------- API: Update booking status by ID (POST/PATCH) ----------
  if ((req.url === '/api/admin/bookings/status' || req.url === '/api/admin/bookings/update') && (req.method === 'POST' || req.method === 'PATCH')) {
    if (!await verifyAdmin(req)) { res.writeHead(401, {'Content-Type':'application/json'}); res.end(JSON.stringify({status:'error',error:'Unauthorized'})); return; }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { id, pickupDone, paymentDone, deliveryDone, paymentScreenshot } = JSON.parse(body);
        const local = getLocalBookings();
        const idx = local.findIndex(b => b.id === id);
        if (idx === -1) {
          res.writeHead(404, {'Content-Type':'application/json'});
          res.end(JSON.stringify({status:'error',error:'Booking not found'}));
          return;
        }
        if (typeof pickupDone !== 'undefined') local[idx].pickupDone = Boolean(pickupDone);
        if (typeof paymentDone !== 'undefined') local[idx].paymentDone = Boolean(paymentDone);
        if (typeof deliveryDone !== 'undefined') local[idx].deliveryDone = Boolean(deliveryDone);
        if (typeof paymentScreenshot !== 'undefined') local[idx].paymentScreenshot = paymentScreenshot;
        writeJsonFile(BOOKINGS_FILE, local);
        
        // Sync to Supabase
        await supabaseService.updateBookingStatus(id, {
          pickupDone: local[idx].pickupDone,
          paymentDone: local[idx].paymentDone,
          deliveryDone: local[idx].deliveryDone,
          paymentScreenshot: local[idx].paymentScreenshot
        });
        
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({status:'success',message:'Status updated',booking:local[idx]}));
      } catch (e) {
        console.error('[API] Update status error:', e.message);
        res.writeHead(500, {'Content-Type':'application/json'});
        res.end(JSON.stringify({status:'error',error:e.message}));
      }
    });
    return;
  }

  // ---------- API: Upload screenshot or receipt image ----------
  if ((req.url === '/api/admin/upload-screenshot' || req.url === '/api/admin/upload-receipt') && req.method === 'POST') {
    if (!await verifyAdmin(req)) { res.writeHead(401, {'Content-Type':'application/json'}); res.end(JSON.stringify({status:'error',error:'Unauthorized'})); return; }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { filename, contentBase64, contentType } = JSON.parse(body);
        const buffer = Buffer.from(contentBase64, 'base64');
        const isScreenshot = req.url.includes('screenshot');
        const folder = isScreenshot ? 'screenshots' : 'receipts';
        const prefix = isScreenshot ? 'pay' : 'receipt';
        const cleanName = (filename || 'image.png').replace(/[^a-zA-Z0-9._-]/g, '_');
        const savedFileName = `${prefix}_${Date.now()}_${cleanName}`;
        
        // 1. Save locally for fallback cache
        const targetDir = isScreenshot ? SCREENSHOTS_DIR : UPLOADS_DIR;
        const localFilePath = path.join(targetDir, savedFileName);
        fs.writeFileSync(localFilePath, buffer);
        let publicUrl = isScreenshot ? `/uploads/screenshots/${savedFileName}` : `/uploads/expenses/${savedFileName}`;

        // 2. Upload directly to Supabase Storage bucket
        const storageRes = await supabaseService.uploadImageToSupabase(buffer, savedFileName, contentType || 'image/jpeg', folder);
        if (storageRes.success && storageRes.url) {
          publicUrl = storageRes.url;
        }

        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({
          status: 'success',
          url: publicUrl,
          filename: savedFileName,
          isSupabaseStorage: storageRes.success
        }));
      } catch (e) {
        console.error('[API] Image upload error:', e.message);
        res.writeHead(500, {'Content-Type':'application/json'});
        res.end(JSON.stringify({status:'error',error:e.message}));
      }
    });
    return;
  }

  // ---------- API: Upload Bill PDF to Supabase Storage ----------
  if (req.url === '/api/admin/upload-bill-pdf' && req.method === 'POST') {
    if (!await verifyAdmin(req)) { res.writeHead(401, {'Content-Type':'application/json'}); res.end(JSON.stringify({status:'error',error:'Unauthorized'})); return; }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { billNumber, filename, contentBase64 } = JSON.parse(body);
        const buffer = Buffer.from(contentBase64, 'base64');
        const cleanBillNum = (billNumber || 'MDC_Bill').replace(/[^a-zA-Z0-9_-]/g, '_');
        const savedFileName = `Mourya_Bill_${cleanBillNum}.pdf`;

        // 1. Save locally for fallback cache
        const localFilePath = path.join(BILLS_DIR, savedFileName);
        fs.writeFileSync(localFilePath, buffer);
        let publicUrl = `/uploads/bills/${savedFileName}`;

        // 2. Upload to Supabase Storage in folder 'bills'
        const storageRes = await supabaseService.uploadImageToSupabase(buffer, savedFileName, 'application/pdf', 'bills');
        if (storageRes.success && storageRes.url) {
          publicUrl = storageRes.url;
        }

        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({
          status: 'success',
          url: publicUrl,
          filename: savedFileName,
          isSupabaseStorage: storageRes.success
        }));
      } catch (e) {
        console.error('[API] Bill PDF upload error:', e.message);
        res.writeHead(500, {'Content-Type':'application/json'});
        res.end(JSON.stringify({status:'error',error:e.message}));
      }
    });
    return;
  }

  // ---------- API: Expenses List (GET) ----------
  if (req.url === '/api/admin/expenses' && req.method === 'GET') {
    if (!await verifyAdmin(req)) { res.writeHead(401, {'Content-Type':'application/json'}); res.end(JSON.stringify({status:'error',error:'Unauthorized'})); return; }
    const expenses = await syncExpensesFromSupabase();
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({status:'success',expenses}));
    return;
  }

  // ---------- API: Add Expense (POST) ----------
  if (req.url === '/api/admin/expenses' && req.method === 'POST') {
    if (!await verifyAdmin(req)) { res.writeHead(401, {'Content-Type':'application/json'}); res.end(JSON.stringify({status:'error',error:'Unauthorized'})); return; }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const expenseId = data.expenseId || `EXP-${Date.now()}`;
        let localImageUrl = data.localImageUrl || '';

        // If base64 image data is included in payload
        if (data.receiptBase64) {
          const buffer = Buffer.from(data.receiptBase64, 'base64');
          const cleanName = (data.imageFileName || 'receipt.png').replace(/[^a-zA-Z0-9._-]/g, '_');
          const savedFileName = `receipt_${expenseId}_${Date.now()}_${cleanName}`;
          fs.writeFileSync(path.join(UPLOADS_DIR, savedFileName), buffer);
          localImageUrl = `/uploads/expenses/${savedFileName}`;

          // Upload to Supabase Storage
          const storageRes = await supabaseService.uploadImageToSupabase(buffer, savedFileName, 'image/jpeg', 'receipts');
          if (storageRes.success && storageRes.url) {
            localImageUrl = storageRes.url;
          }
        }

        const expenseRecord = {
          expenseId,
          title: data.title || 'Untitled Expense',
          category: data.category || 'Miscellaneous',
          amount: parseFloat(data.amount) || 0,
          date: data.date || new Date().toISOString().split('T')[0],
          paymentMode: data.paymentMode || 'Cash',
          vendor: data.vendor || '',
          notes: data.notes || '',
          imageFileName: data.imageFileName || '',
          localImageUrl: localImageUrl || data.receiptUrl || '',
          receiptUrl: localImageUrl || data.receiptUrl || '',
          recordedAt: new Date().toISOString()
        };

        const expenses = readJsonFile(EXPENSES_FILE, []);
        expenses.unshift(expenseRecord);
        writeJsonFile(EXPENSES_FILE, expenses);

        // Sync to Supabase
        await supabaseService.saveExpense(expenseRecord);

        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({status:'success',message:'Expense recorded',expense:expenseRecord}));
      } catch (e) {
        console.error('[API] Add expense error:', e.message);
        res.writeHead(500, {'Content-Type':'application/json'});
        res.end(JSON.stringify({status:'error',error:e.message}));
      }
    });
    return;
  }

  // ---------- API: Delete Expense (DELETE) ----------
  if (req.url.startsWith('/api/admin/expenses/') && req.method === 'DELETE') {
    if (!await verifyAdmin(req)) { res.writeHead(401, {'Content-Type':'application/json'}); res.end(JSON.stringify({status:'error',error:'Unauthorized'})); return; }
    const parts = req.url.split('/').filter(Boolean);
    const expId = parts[parts.length - 1];
    try {
      const expenses = readJsonFile(EXPENSES_FILE, []);
      const updated = expenses.filter(e => e.expenseId !== expId && e.id !== expId);
      writeJsonFile(EXPENSES_FILE, updated);
      await supabaseService.deleteExpense(expId);
      res.writeHead(200, {'Content-Type':'application/json'});
      res.end(JSON.stringify({status:'success',message:'Expense deleted'}));
    } catch (e) {
      res.writeHead(500, {'Content-Type':'application/json'});
      res.end(JSON.stringify({status:'error',error:e.message}));
    }
    return;
  }

  // ---------- API: Bills List (GET) ----------
  if (req.url === '/api/admin/bills' && req.method === 'GET') {
    if (!await verifyAdmin(req)) { res.writeHead(401, {'Content-Type':'application/json'}); res.end(JSON.stringify({status:'error',error:'Unauthorized'})); return; }
    const bills = await syncBillsFromSupabase();
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({status:'success',bills}));
    return;
  }

  // ---------- API: Save / Create Bill (POST) ----------
  if (req.url === '/api/admin/bills' && req.method === 'POST') {
    if (!await verifyAdmin(req)) { res.writeHead(401, {'Content-Type':'application/json'}); res.end(JSON.stringify({status:'error',error:'Unauthorized'})); return; }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const d = new Date();
        const yymm = `${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}`;
        const randNum = Math.floor(100 + Math.random() * 900);
        const billNumber = (data.billNumber || `MDC-${yymm}-${randNum}`).trim();

        const billRecord = {
          billNumber,
          invoiceNumber: billNumber,
          date: data.date || d.toISOString().split('T')[0],
          customerName: (data.customerName || '').trim(),
          phone: (data.phone || '').trim(),
          address: (data.address || '').trim(),
          items: Array.isArray(data.items) ? data.items : [],
          totalAmount: parseFloat(data.totalAmount) || 0,
          grandTotal: parseFloat(data.totalAmount) || 0,
          createdAt: new Date().toISOString()
        };

        const invoices = readJsonFile(INVOICES_FILE, []);
        const existingIdx = invoices.findIndex(i => (i.billNumber === billNumber || i.invoiceNumber === billNumber));
        if (existingIdx !== -1) {
          invoices[existingIdx] = billRecord;
        } else {
          invoices.unshift(billRecord);
        }
        writeJsonFile(INVOICES_FILE, invoices);

        // Sync with Supabase
        await supabaseService.saveBill(billRecord);

        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({status:'success',message:'Bill saved',bill:billRecord}));
      } catch (e) {
        console.error('[API] Save bill error:', e.message);
        res.writeHead(500, {'Content-Type':'application/json'});
        res.end(JSON.stringify({status:'error',error:e.message}));
      }
    });
    return;
  }

  // ---------- API: Delete Bill (DELETE) ----------
  if (req.url.startsWith('/api/admin/bills/') && req.method === 'DELETE') {
    if (!await verifyAdmin(req)) { res.writeHead(401, {'Content-Type':'application/json'}); res.end(JSON.stringify({status:'error',error:'Unauthorized'})); return; }
    const parts = req.url.split('/').filter(Boolean);
    const billId = parts[parts.length - 1];
    try {
      const invoices = readJsonFile(INVOICES_FILE, []);
      const updated = invoices.filter(i => i.billNumber !== billId && i.invoiceNumber !== billId);
      writeJsonFile(INVOICES_FILE, updated);
      await supabaseService.deleteBill(billId);
      res.writeHead(200, {'Content-Type':'application/json'});
      res.end(JSON.stringify({status:'success',message:'Bill deleted'}));
    } catch (e) {
      res.writeHead(500, {'Content-Type':'application/json'});
      res.end(JSON.stringify({status:'error',error:e.message}));
    }
    return;
  }

  // ---------- API: Get admin records (invoices, expenses, bookings) ----------
  if (req.url === '/api/admin/records' && req.method === 'GET') {
    if (!await verifyAdmin(req)) { res.writeHead(401, {'Content-Type':'application/json'}); res.end(JSON.stringify({status:'error',error:'Unauthorized'})); return; }
    const [invoices, expenses, bookings] = await Promise.all([
      syncBillsFromSupabase(),
      syncExpensesFromSupabase(),
      syncBookingsFromSupabase()
    ]);
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({status:'success',invoices,bills:invoices,expenses,bookings,settings:{}}));
    return;
  }

  // ---------- API: Get all bookings (for dashboard) ----------
  if (req.url === '/api/admin/bookings' && req.method === 'GET') {
    if (!await verifyAdmin(req)) { res.writeHead(401, {'Content-Type':'application/json'}); res.end(JSON.stringify({status:'error',error:'Unauthorized'})); return; }
    const bookings = await syncBookingsFromSupabase();
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({status:'success',bookings}));
    return;
  }

  // ---------- API: Refresh bookings ----------
  if ((req.url === '/api/admin/refresh-bookings' || req.url.startsWith('/api/admin/refresh-bookings?')) && (req.method === 'POST' || req.method === 'GET')) {
    if (!await verifyAdmin(req)) { res.writeHead(401, {'Content-Type':'application/json'}); res.end(JSON.stringify({status:'error',error:'Unauthorized'})); return; }
    const bookings = await syncBookingsFromSupabase();
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({status:'success',message:`Synced ${bookings.length} bookings`,count:bookings.length,bookings}));
    return;
  }

  // ---------- API: Settings get/post ----------
  if (req.url === '/api/admin/settings' && req.method === 'GET') {
    if (!await verifyAdmin(req)) { res.writeHead(401, {'Content-Type':'application/json'}); res.end(JSON.stringify({status:'error',error:'Unauthorized'})); return; }
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({status:'success',settings:{}}));
    return;
  }
  if (req.url === '/api/admin/settings' && req.method === 'POST') {
    if (!await verifyAdmin(req)) { res.writeHead(401, {'Content-Type':'application/json'}); res.end(JSON.stringify({status:'error',error:'Unauthorized'})); return; }
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({status:'success'}));
    return;
  }

  // ---------- Serve admin dashboard assets (HTML/CSS/JS) ----------
  if (req.url === '/admin' || req.url === '/admin/' || req.url === '/admin-dashboard' || req.url === '/admin-dashboard.html') {
    const assetPath = path.join(__dirname, 'admin-dashboard.html');
    fs.readFile(assetPath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Admin dashboard not found'); return; }
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, private'
      });
      res.end(data);
    });
    return;
  }
  if (req.url.startsWith('/admin/')) {
    const subPath = req.url.replace(/^\/admin\//, '');
    let assetPath = path.join(__dirname, subPath);
    if (!fs.existsSync(assetPath)) assetPath = path.join(__dirname, req.url);
    const ext = path.extname(assetPath).toLowerCase();
    const mimeMap = { '.html':'text/html', '.css':'text/css', '.js':'application/javascript', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };
    const mime = mimeMap[ext] || 'application/octet-stream';
    fs.readFile(assetPath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Admin asset not found'); return; }
      res.writeHead(200, {'Content-Type': mime, 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'});
      res.end(data);
    });
    return;
  }

  // ---------- Serve public static files with strict security barrier ----------
  let safePath = path.normalize(decodeURI(req.url.split('?')[0])).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';

  // SECURITY FILTER: Strictly deny public access to internal databases, server code, and sensitive files
  const normalizedPath = safePath.replace(/\\/g, '/').toLowerCase();
  const isDenied = 
    normalizedPath.startsWith('/data') ||
    normalizedPath.startsWith('data/') ||
    normalizedPath.includes('/data/') ||
    normalizedPath.endsWith('.json') ||
    normalizedPath.endsWith('.env') ||
    normalizedPath.endsWith('.sql') ||
    normalizedPath.endsWith('.bat') ||
    normalizedPath.endsWith('.py') ||
    normalizedPath.endsWith('.md') ||
    normalizedPath.endsWith('.toml') ||
    normalizedPath.endsWith('.yml') ||
    normalizedPath.endsWith('.yaml') ||
    normalizedPath.endsWith('.log') ||
    normalizedPath.endsWith('/server.js') ||
    normalizedPath === 'server.js' ||
    normalizedPath.endsWith('/supabase-service.js') ||
    normalizedPath === 'supabase-service.js' ||
    normalizedPath.includes('_backup') ||
    normalizedPath.includes('.git');

  if (isDenied) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'error', error: '403 Forbidden: Direct access to internal data and system files is prohibited.' }));
    return;
  }

  let filePath = path.join(PUBLIC_DIR, safePath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) filePath = filePath + '.html';

  // Strict Path Traversal Barrier
  const resolvedPublicDir = path.resolve(PUBLIC_DIR);
  const resolvedTarget = path.resolve(filePath);
  if (!resolvedTarget.startsWith(resolvedPublicDir)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'error', error: '403 Forbidden: Invalid file traversal path.' }));
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, {'Content-Type':'text/html; charset=utf-8'});
        res.end(`<h1>404 Not Found</h1><p>The requested file <code>${safePath}</code> was not found.</p><a href="/">Home</a>`);
      } else {
        res.writeHead(500, {'Content-Type':'text/plain; charset=utf-8'});
        res.end(`500 Internal Server Error: ${err.code}`);
      }
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {'Content-Type': contentType, 'Cache-Control':'no-cache'});
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', async () => {
  console.log('====================================================');
  console.log('  Mourya Dry Cleaners Local Server is Running!');
  console.log(`  Local URL: http://localhost:${PORT}`);
  console.log('====================================================');
  try {
    console.log('[Supabase Sync] Running startup synchronization for Bookings, Bills & Expenses...');
    await migrateLocalDataToSupabase();
    const [syncedBills, syncedExpenses, syncedBookings] = await Promise.all([
      syncBillsFromSupabase(),
      syncExpensesFromSupabase(),
      syncBookingsFromSupabase()
    ]);
    console.log(`[Supabase Sync] Ready! ${syncedBills.length} Bills, ${syncedExpenses.length} Expenses, and ${syncedBookings.length} Bookings.`);
  } catch (syncErr) {
    console.warn('[Supabase Sync] Startup note:', syncErr.message);
  }
});
