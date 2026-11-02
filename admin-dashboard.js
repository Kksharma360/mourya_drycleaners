/**
 * ============================================================================
 * MOURYA DRY CLEANERS — PROFESSIONAL ADMIN DASHBOARD (admin-dashboard.js)
 * Clean Blue & White Theme • Full Booking & Expense Management Suite
 * ============================================================================
 * FIREBASE VERSION — Auth + Firestore + Storage (no Supabase, no Netlify Functions)
 * ============================================================================
 */

(function () {
  'use strict';

  // ==================== FIREBASE CONFIG ====================
  // 🔴 REPLACE these values with YOUR Firebase project config
  // Go to: Firebase Console → Project Settings → General → Your apps → Config
  const firebaseConfig = {
    apiKey: "AIzaSyAAKvT-Ta4WauKWD9pFSaWxjKKr9KdhlCE",
    authDomain: "mourya-drycleaners-46036.firebaseapp.com",
    projectId: "mourya-drycleaners-46036",
    storageBucket: "mourya-drycleaners-46036.firebasestorage.app",
    messagingSenderId: "489158981671",
    appId: "1:489158981671:web:23269f5307891a43c33602",
    measurementId: "G-BPG55TMKDC"
  };

  // Initialize Firebase
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const auth = firebase.auth();
  const db   = firebase.firestore();

  // ==================== STATE MANAGEMENT ====================
  let authToken = null;
  let allBookings = [];
  let allExpenses = [];
  let allBills = [];
  let activeTab = 'bookingsTab';

  // Bill Editor State
  let billEditorRows = [];
  let activeBillSubTab = 'createBill';
  let billHistorySearch = '';
  let billHistoryDate = '';

  // Booking Filter State
  let bookingFilter = {
    search: '',
    status: 'all',
    sort: 'newest',
    date: ''
  };

  // Expense Filter State
  let expenseFilter = {
    search: '',
    category: 'all',
    month: 'all'
  };

  // Upload Contexts
  let targetBookingForScreenshot = null;
  let currentBookingIdForBill = null;
  let selectedExpenseFileBase64 = null;
  let selectedExpenseFileName = null;
  let selectedScreenshotBase64 = null;
  let selectedScreenshotFileName = null;

  // ==================== UTILITY HELPERS ====================
  let toastTimer = null;
  function showToast(message, isError = false) {
    const toast = document.getElementById('toastNotification');
    const msgEl = document.getElementById('toastMsg');
    const iconEl = document.getElementById('toastIcon');
    if (!toast || !msgEl) return;
    msgEl.textContent = message;
    iconEl.textContent = isError ? '✕' : '✓';
    iconEl.style.background = isError ? '#ef4444' : '#22c55e';
    toast.classList.remove('hidden');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.classList.add('hidden'); }, 3200);
  }

  function formatCurrency(val) {
    const n = Number(val) || 0;
    return '₹' + n.toLocaleString('en-IN');
  }

  function formatDateHuman(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (_) { return dateStr; }
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return String(str || '');
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  // ==================== FIREBASE DATA LAYER (apiFetch replacement) ====================
  // Structure:
  // Bookings: bookings/{month}/{date}/{bookingId}
  // Expenses: expenses/{month}/{date}/{expenseId}
  // Bills:    bills/{month}/{date}/{bookingId}
  async function apiFetch(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body) : {};

    try {
      // -------- BOOKINGS (GET) --------
      if (url === '/api/admin/bookings' && method === 'GET') {
        const bookings = [];
        try {
          const monthDocs = await db.collection('bookings').get();
          const subPromises = [];
          monthDocs.forEach(mDoc => {
            const mData = mDoc.data() || {};
            // Direct flat booking document support
            if (mData.name || mData.phone || mData.bookingId) {
              bookings.push({
                id: mDoc.id,
                bookingId: mData.bookingId || mDoc.id,
                ...mData,
                _path: mDoc.ref.path
              });
            }
            // Subcollection hierarchical dates support (bookings/{month}/{date}/{id})
            const dates = mData.dates || [];
            dates.forEach(d => {
              subPromises.push(
                db.collection('bookings').doc(mDoc.id).collection(d).get().then(snap => {
                  return snap.docs.map(doc => ({
                    id: doc.id,
                    bookingId: doc.data().bookingId || doc.id,
                    ...doc.data(),
                    _path: doc.ref.path,
                    _month: mDoc.id,
                    _date: d
                  }));
                }).catch(err => {
                  console.warn('Subcollection read note:', err);
                  return [];
                })
              );
            });
          });
          const results = await Promise.all(subPromises);
          bookings.push(...results.flat());
        } catch (fbErr) {
          console.warn('[Firebase Bookings Fetch Warning]', fbErr);
        }

        // Resilient Fallback to local data/bookings.json if network or firestore returned 0
        if (bookings.length === 0) {
          try {
            const localRes = await fetch('data/bookings.json').catch(() => fetch('../data/bookings.json'));
            if (localRes && localRes.ok) {
              const localBookings = await localRes.json();
              if (Array.isArray(localBookings) && localBookings.length > 0) {
                bookings.push(...localBookings);
              }
            }
          } catch (_) {}
        }

        // Deduplicate bookings by bookingId / id
        const seenIds = new Set();
        const uniqueBookings = [];
        for (const b of bookings) {
          const key = b.bookingId || b.id;
          if (key && !seenIds.has(key)) {
            seenIds.add(key);
            uniqueBookings.push(b);
          }
        }

        uniqueBookings.sort((a, b) => new Date(b.receivedAt || b.date || b.createdAt || 0) - new Date(a.receivedAt || a.date || a.createdAt || 0));
        return { status: 'success', bookings: uniqueBookings };
      }

      // -------- BOOKINGS (POST) --------
      if (url === '/api/admin/bookings' && method === 'POST') {
        const b = body;
        const now = new Date();
        const bDate = b.date || b.pickupDate || now.toISOString().split('T')[0];
        let monthStr = now.toISOString().slice(0, 7);
        let dateStr = now.toISOString().slice(0, 10);
        try {
          const d = new Date(bDate);
          if (!isNaN(d.getTime())) {
            monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          }
        } catch(_) {}
        const docId = b.id || b.bookingId || 'BOOK-' + Date.now();
        const data = {
          id: docId,
          bookingId: docId,
          name: b.name || '', phone: b.phone || '', services: b.services || [],
          location: b.location || b.sector || '', address: b.address || '',
          pinnedLocation: b.pinnedLocation || '', gps: b.gps || '',
          date: b.date || dateStr, pickupDate: dateStr, time: b.time || 'Flexible',
          notes: b.notes || '', pickupDone: Boolean(b.pickupDone),
          paymentDone: Boolean(b.paymentDone), deliveryDone: Boolean(b.deliveryDone),
          paymentScreenshot: b.paymentScreenshot || '',
          receivedAt: b.receivedAt || now.toISOString(),
          createdAt: b.createdAt || now.toISOString(),
          month: monthStr
        };
        // Path: bookings -> month -> date -> bookingId
        await db.collection('bookings').doc(monthStr).collection(dateStr).doc(docId).set(data, { merge: true });
        await db.collection('bookings').doc(monthStr).set({
          month: monthStr,
          dates: firebase.firestore.FieldValue.arrayUnion(dateStr),
          lastUpdated: now.toISOString()
        }, { merge: true });
        return { status: 'success', booking: { id: docId, ...data, _path: `bookings/${monthStr}/${dateStr}/${docId}`, _month: monthStr, _date: dateStr } };
      }

      // -------- BOOKINGS STATUS (POST) --------
      if (url === '/api/admin/bookings/status' && method === 'POST') {
        const updates = {};
        if ('pickupDone' in body) updates.pickupDone = Boolean(body.pickupDone);
        if ('paymentDone' in body) updates.paymentDone = Boolean(body.paymentDone);
        if ('deliveryDone' in body) updates.deliveryDone = Boolean(body.deliveryDone);
        if ('paymentScreenshot' in body) updates.paymentScreenshot = body.paymentScreenshot;

        const target = allBookings.find(b => b.id === body.id || b.bookingId === body.id);
        if (target && target._path) {
          await db.doc(target._path).update(updates);
        } else {
          const monthDocs = await db.collection('bookings').get();
          for (const mDoc of monthDocs.docs) {
            const dates = (mDoc.data() || {}).dates || [];
            for (const d of dates) {
              const ref = db.collection('bookings').doc(mDoc.id).collection(d).doc(body.id);
              const docSnap = await ref.get();
              if (docSnap.exists) {
                await ref.update(updates);
                break;
              }
            }
          }
        }
        return { status: 'success' };
      }

      // -------- EXPENSES (GET) --------
      if (url === '/api/admin/expenses' && method === 'GET') {
        const monthDocs = await db.collection('expenses').get();
        const subPromises = [];
        monthDocs.forEach(mDoc => {
          const dates = (mDoc.data() || {}).dates || [];
          dates.forEach(d => {
            subPromises.push(
              db.collection('expenses').doc(mDoc.id).collection(d).get().then(snap => {
                return snap.docs.map(doc => ({
                  id: doc.id,
                  expenseId: doc.id,
                  ...doc.data(),
                  _path: doc.ref.path,
                  _month: mDoc.id,
                  _date: d
                }));
              })
            );
          });
        });
        const results = await Promise.all(subPromises);
        const expenses = results.flat();
        expenses.sort((a, b) => new Date(b.date || b.recordedAt || 0) - new Date(a.date || a.recordedAt || 0));
        return { status: 'success', expenses };
      }

      // -------- EXPENSES (POST) --------
      if (url === '/api/admin/expenses' && method === 'POST') {
        const e = body;
        const now = new Date();
        const expDate = e.date || now.toISOString().split('T')[0];
        let monthStr = now.toISOString().slice(0, 7);
        let dateStr = now.toISOString().slice(0, 10);
        try {
          const d = new Date(expDate);
          if (!isNaN(d.getTime())) {
            monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          }
        } catch(_) {}
        const docId = e.expenseId || e.id || 'EXP-' + Date.now();
        const data = {
          id: docId,
          expenseId: docId,
          title: e.title || '', category: e.category || 'Miscellaneous',
          amount: Number(e.amount) || 0, date: dateStr,
          paymentMode: e.paymentMode || 'Cash', vendor: e.vendor || '',
          notes: e.notes || '', recordedAt: e.recordedAt || now.toISOString(),
          month: monthStr
        };
        // Path: expenses -> month -> date -> expenseId
        await db.collection('expenses').doc(monthStr).collection(dateStr).doc(docId).set(data, { merge: true });
        await db.collection('expenses').doc(monthStr).set({
          month: monthStr,
          dates: firebase.firestore.FieldValue.arrayUnion(dateStr),
          lastUpdated: now.toISOString()
        }, { merge: true });
        return { status: 'success', expense: { ...data, _path: `expenses/${monthStr}/${dateStr}/${docId}`, _month: monthStr, _date: dateStr } };
      }

      // -------- EXPENSES (DELETE) --------
      if (url.startsWith('/api/admin/expenses/') && method === 'DELETE') {
        const expId = decodeURIComponent(url.split('/').pop());
        const target = allExpenses.find(e => e.id === expId || e.expenseId === expId);
        if (target && target._path) {
          await db.doc(target._path).delete();
        } else {
          const monthDocs = await db.collection('expenses').get();
          for (const mDoc of monthDocs.docs) {
            const dates = (mDoc.data() || {}).dates || [];
            for (const d of dates) {
              const ref = db.collection('expenses').doc(mDoc.id).collection(d).doc(expId);
              const snap = await ref.get();
              if (snap.exists) {
                await ref.delete();
                break;
              }
            }
          }
        }
        return { status: 'success' };
      }

      // -------- BILLS (GET) --------
      if (url === '/api/admin/bills' && method === 'GET') {
        const monthDocs = await db.collection('bills').get();
        const subPromises = [];
        monthDocs.forEach(mDoc => {
          const dates = (mDoc.data() || {}).dates || [];
          dates.forEach(d => {
            subPromises.push(
              db.collection('bills').doc(mDoc.id).collection(d).get().then(snap => {
                return snap.docs.map(doc => ({
                  id: doc.id,
                  bookingId: doc.data().bookingId || doc.id,
                  billNumber: doc.data().billNumber || doc.id,
                  invoiceNumber: doc.data().invoiceNumber || doc.data().billNumber || doc.id,
                  ...doc.data(),
                  _path: doc.ref.path,
                  _month: mDoc.id,
                  _date: d
                }));
              })
            );
          });
        });
        const results = await Promise.all(subPromises);
        const bills = results.flat();
        // Deduplicate bills by bookingId / billNumber / id to prevent duplicate entries
        const seenBillKeys = new Set();
        const uniqueBills = [];
        for (const bill of bills) {
          const key = bill.bookingId || bill.billNumber || bill.invoiceNumber || bill.id;
          if (key && !seenBillKeys.has(key)) {
            seenBillKeys.add(key);
            uniqueBills.push(bill);
          }
        }
        uniqueBills.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));
        return { status: 'success', bills: uniqueBills };
      }

      // -------- BILLS (POST) --------
      // Path: bills -> month -> date -> bookingId
      if (url === '/api/admin/bills' && method === 'POST') {
        const b = body;
        const now = new Date();
        const billDate = b.date || now.toISOString().split('T')[0];
        let monthStr = now.toISOString().slice(0, 7);
        let dateStr = now.toISOString().slice(0, 10);
        try {
          const d = new Date(billDate);
          if (!isNaN(d.getTime())) {
            monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          }
        } catch(_) {}

        const docId = b.bookingId || b.billNumber || b.invoiceNumber || b.id || currentBookingIdForBill || ('BOOK-' + Date.now());
        const billNumber = docId;
        const data = {
          id: docId,
          bookingId: docId,
          billNumber: billNumber,
          invoiceNumber: billNumber,
          date: dateStr,
          customerName: b.customerName || '',
          phone: b.phone || '',
          address: b.address || '',
          items: b.items || [],
          totalAmount: Number(b.totalAmount) || 0,
          grandTotal: Number(b.grandTotal || b.totalAmount) || 0,
          createdAt: b.createdAt || now.toISOString(),
          month: monthStr
        };
        // Path: bills -> month -> date -> bookingId
        await db.collection('bills').doc(monthStr).collection(dateStr).doc(docId).set(data, { merge: true });
        await db.collection('bills').doc(monthStr).set({
          month: monthStr,
          dates: firebase.firestore.FieldValue.arrayUnion(dateStr),
          lastUpdated: now.toISOString()
        }, { merge: true });
        return { status: 'success', bill: { ...data, _path: `bills/${monthStr}/${dateStr}/${docId}`, _month: monthStr, _date: dateStr } };
      }

      // -------- BILLS (DELETE) --------
      if (url.startsWith('/api/admin/bills/') && method === 'DELETE') {
        const billId = decodeURIComponent(url.split('/').pop());
        const target = allBills.find(b => b.id === billId || b.billNumber === billId || b.bookingId === billId);
        if (target && target._path) {
          await db.doc(target._path).delete();
        } else {
          const monthDocs = await db.collection('bills').get();
          for (const mDoc of monthDocs.docs) {
            const dates = (mDoc.data() || {}).dates || [];
            for (const d of dates) {
              const ref = db.collection('bills').doc(mDoc.id).collection(d).doc(billId);
              const snap = await ref.get();
              if (snap.exists) {
                await ref.delete();
                break;
              }
            }
          }
        }
        return { status: 'success' };
      }

      // -------- SCREENSHOT UPLOAD --------
      if (url === '/api/admin/upload-screenshot' && method === 'POST') {
        const dataUri = (body.contentBase64 || '').startsWith('data:')
          ? body.contentBase64
          : `data:${body.contentType || 'image/jpeg'};base64,${body.contentBase64 || ''}`;
        return { status: 'success', url: dataUri, publicUrl: dataUri };
      }

      // -------- SESSION VERIFY --------
      if (url === '/api/admin/verify-session') {
        return { authenticated: Boolean(auth.currentUser), status: 'success' };
      }

      // -------- LOGOUT --------
      if (url === '/api/admin/logout') {
        await auth.signOut();
        authToken = null;
        localStorage.removeItem('mdc_admin_auth_token');
        return { status: 'success' };
      }

      throw new Error('Unsupported admin request: ' + url);
    } catch (err) {
      console.error('[apiFetch] Error:', url, err);
      throw err;
    }
  }

  // Parse any booking date representation into a JS timestamp
  function parseBookingDate(b) {
    if (b.pickupDate && /^\d{4}-\d{2}-\d{2}/.test(b.pickupDate)) {
      return new Date(b.pickupDate).getTime();
    }
    if (b.date) {
      const match = b.date.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
      if (match) {
        const d = new Date(`${match[2]} ${match[1]}, ${match[3]}`);
        if (!isNaN(d.getTime())) return d.getTime();
      }
    }
    if (b.receivedAt) {
      const d = new Date(b.receivedAt);
      if (!isNaN(d.getTime())) return d.getTime();
    }
    return 0;
  }

  // ==================== AUTHENTICATION (Firebase Auth) ====================
  async function initAuth() {
    // Listen for Firebase auth state changes
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        authToken = await user.getIdToken();
        showApp();
      } else {
        authToken = null;
        showLogin();
      }
    });

    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const u = document.getElementById('adminUsername').value.trim();
        const p = document.getElementById('adminPassword').value.trim();
        const errorEl = document.getElementById('loginError');
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        errorEl.classList.add('hidden');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span>Verifying credentials...</span>';
        }

        try {
          await auth.signInWithEmailAndPassword(u, p);
          // onAuthStateChanged will handle the rest (showApp)
          showToast('Welcome back, Admin!');
        } catch (err) {
          console.warn('Login rejected:', err.code);
          let errorMsg = 'Incorrect user or password';
          if (err.code === 'auth/too-many-requests') {
            errorMsg = 'Too many failed attempts. Please try again later.';
          } else {
            errorMsg = 'Incorrect user or password';
          }
          errorEl.textContent = errorMsg;
          errorEl.classList.remove('hidden');
          const passEl = document.getElementById('adminPassword');
          if (passEl) {
            passEl.value = '';
            passEl.focus();
          }
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span>Sign In to Dashboard</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
          }
        }
      });
    }

    const logoutBtn = document.getElementById('btnLogout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }
  }

  function showLogin() {
    document.getElementById('loginScreen').classList.remove('hidden');
    const app = document.getElementById('dashboardApp');
    app.classList.add('hidden');
    app.style.setProperty('display', 'none', 'important');
  }

  function showApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    const app = document.getElementById('dashboardApp');
    app.classList.remove('hidden');
    app.style.removeProperty('display');
    loadInitialData();
  }

  async function handleLogout() {
    try {
      await auth.signOut();
    } catch (_) {}
    authToken = null;
    allBookings = [];
    allBills = [];
    allExpenses = [];
    if (document.getElementById('adminUsername')) document.getElementById('adminUsername').value = '';
    if (document.getElementById('adminPassword')) document.getElementById('adminPassword').value = '';
    showLogin();
    showToast('Signed out successfully.');
  }

  // ==================== NAVIGATION & TABS ====================
  function initNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-tab]');
    navItems.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        switchTab(targetTab);
        // Mobile auto close sidebar
        document.getElementById('sidebar')?.classList.remove('active');
      });
    });

    // Mobile Sidebar Toggle
    const toggleBtn = document.getElementById('btnToggleSidebar');
    const closeSidebarBtn = document.getElementById('btnCloseSidebar');
    const sidebar = document.getElementById('sidebar');

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => sidebar.classList.toggle('active'));
    }
    if (closeSidebarBtn && sidebar) {
      closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('active'));
    }

    // Top primary action button behavior (adapts to active tab)
    const topActionBtn = document.getElementById('btnTopPrimaryAction');
    if (topActionBtn) {
      topActionBtn.addEventListener('click', () => {
        if (activeTab === 'bookingsTab') {
          openAddBookingModal();
        } else if (activeTab === 'billsTab') {
          switchBillSubTab('createBill');
        } else {
          openAddExpenseModal();
        }
      });
    }

    // Global refresh
    const refreshBtn = document.getElementById('btnGlobalRefresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        refreshBtn.classList.add('loading');
        await loadInitialData();
        refreshBtn.classList.remove('loading');
        showToast('Dashboard data refreshed.');
      });
    }

    // KPI Card Clickable Shortcuts
    document.getElementById('kpiCardPickup')?.addEventListener('click', () => {
      setBookingStatusFilter('pickup_not_done');
    });
    document.getElementById('kpiCardPayment')?.addEventListener('click', () => {
      setBookingStatusFilter('payment_not_done');
    });
    document.getElementById('kpiCardDelivery')?.addEventListener('click', () => {
      setBookingStatusFilter('delivery_not_done');
    });
  }

  function switchTab(tabId) {
    activeTab = tabId;
    document.querySelectorAll('.sidebar-nav .nav-item[data-tab]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.toggle('hidden', panel.id !== tabId);
      panel.classList.toggle('active', panel.id === tabId);
    });

    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    const topActionBtn = document.getElementById('btnTopPrimaryAction');

    if (tabId === 'bookingsTab') {
      if (pageTitle) pageTitle.textContent = 'Customer Bookings';
      if (pageSubtitle) pageSubtitle.textContent = 'Manage door-to-door pickups, deliveries, and payment verifications';
      if (topActionBtn) topActionBtn.innerHTML = '<span>➕ Add Booking</span>';
    } else if (tabId === 'billsTab') {
      if (pageTitle) pageTitle.textContent = 'Customer Bills & Invoices';
      if (pageSubtitle) pageSubtitle.textContent = 'Create, print, and track approved Mourya customer bills & PDF receipts';
      if (topActionBtn) topActionBtn.innerHTML = '<span>➕ Create Bill</span>';
    } else {
      if (pageTitle) pageTitle.textContent = 'Business Expenses';
      if (pageSubtitle) pageSubtitle.textContent = 'Track shop bills, detergents, salary, logistics, and receipt photos';
      if (topActionBtn) topActionBtn.innerHTML = '<span>➕ Add Expense</span>';
    }
  }

  // ==================== DATA LOADING ====================
  async function loadInitialData() {
    try {
      const [bookingsRes, expensesRes, billsRes] = await Promise.all([
        apiFetch('/api/admin/bookings').catch(e => ({ status: 'error', error: e.message, bookings: [] })),
        apiFetch('/api/admin/expenses').catch(e => ({ status: 'error', error: e.message, expenses: [] })),
        apiFetch('/api/admin/bills').catch(e => ({ status: 'error', error: e.message, bills: [] }))
      ]);

      if (bookingsRes && bookingsRes.status === 'success') {
        allBookings = bookingsRes.bookings || [];
        renderBookings();
      }

      if (expensesRes && expensesRes.status === 'success') {
        allExpenses = expensesRes.expenses || [];
        populateExpenseMonthsDropdown();
        renderExpenses();
      }

      if (billsRes && billsRes.status === 'success') {
        allBills = billsRes.bills || [];
        updateBillsKpis();
        renderBillsHistory();
      }
    } catch (err) {
      console.error('Error loading data:', err);
      showToast('Error syncing data with server', true);
    }
  }

  // ==================== BOOKINGS CONTROLLER ====================
  function initBookingFilters() {
    // Search input
    const searchInput = document.getElementById('bookingSearchInput');
    const clearSearchBtn = document.getElementById('btnClearSearch');

    searchInput?.addEventListener('input', (e) => {
      bookingFilter.search = e.target.value.trim().toLowerCase();
      clearSearchBtn.classList.toggle('hidden', !bookingFilter.search);
      renderBookings();
    });

    clearSearchBtn?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      bookingFilter.search = '';
      clearSearchBtn.classList.add('hidden');
      renderBookings();
    });

    // Sort Select
    const sortSelect = document.getElementById('bookingSortSelect');
    sortSelect?.addEventListener('change', (e) => {
      bookingFilter.sort = e.target.value;
      renderBookings();
    });

    // Specific Date Input
    const dateInput = document.getElementById('bookingDateFilter');
    const clearDateBtn = document.getElementById('btnClearDateFilter');

    dateInput?.addEventListener('change', (e) => {
      bookingFilter.date = e.target.value;
      clearDateBtn.classList.toggle('hidden', !bookingFilter.date);
      renderBookings();
    });

    clearDateBtn?.addEventListener('click', () => {
      if (dateInput) dateInput.value = '';
      bookingFilter.date = '';
      clearDateBtn.classList.add('hidden');
      renderBookings();
    });

    // Status Filter Pills
    const pills = document.querySelectorAll('.filter-pill[data-filter]');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        setBookingStatusFilter(pill.getAttribute('data-filter'));
      });
    });

    // Reset Filters button in empty state
    document.getElementById('btnResetFilters')?.addEventListener('click', () => {
      resetBookingFilters();
    });
  }

  function setBookingStatusFilter(status) {
    bookingFilter.status = status;
    document.querySelectorAll('.filter-pill[data-filter]').forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-filter') === status);
    });
    renderBookings();
  }

  function resetBookingFilters() {
    bookingFilter = { search: '', status: 'all', sort: 'newest', date: '' };
    const sInput = document.getElementById('bookingSearchInput');
    const dInput = document.getElementById('bookingDateFilter');
    const sortSel = document.getElementById('bookingSortSelect');

    if (sInput) sInput.value = '';
    if (dInput) dInput.value = '';
    if (sortSel) sortSel.value = 'newest';

    document.getElementById('btnClearSearch')?.classList.add('hidden');
    document.getElementById('btnClearDateFilter')?.classList.add('hidden');

    document.querySelectorAll('.filter-pill[data-filter]').forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-filter') === 'all');
    });

    renderBookings();
    showToast('Filters reset.');
  }

  function updateBookingKpis() {
    let pendingPickup = 0;
    let pendingPayment = 0;
    let pendingDelivery = 0;
    let completed = 0;

    allBookings.forEach(b => {
      if (!b.pickupDone) pendingPickup++;
      if (!b.paymentDone) pendingPayment++;
      if (!b.deliveryDone) pendingDelivery++;
      if (b.pickupDone && b.paymentDone && b.deliveryDone) completed++;
    });

    document.getElementById('kpiTotalBookings').textContent = allBookings.length;
    document.getElementById('kpiPendingPickup').textContent = pendingPickup;
    document.getElementById('kpiPendingPayment').textContent = pendingPayment;
    document.getElementById('kpiPendingDelivery').textContent = pendingDelivery;
    document.getElementById('badgeTotalBookings').textContent = allBookings.length;

    // Update pill counts
    document.getElementById('pillCountAll').textContent = allBookings.length;
    document.getElementById('pillCountPickup').textContent = pendingPickup;
    document.getElementById('pillCountPayment').textContent = pendingPayment;
    document.getElementById('pillCountDelivery').textContent = pendingDelivery;
    document.getElementById('pillCountDone').textContent = completed;
  }

  function renderBookings() {
    updateBookingKpis();

    const container = document.getElementById('bookingsList');
    const emptyState = document.getElementById('noBookingsState');
    const countLabel = document.getElementById('bookingResultsCount');

    // 1. Filter
    let filtered = allBookings.filter(b => {
      // Status filter
      if (bookingFilter.status === 'pickup_not_done' && b.pickupDone) return false;
      if (bookingFilter.status === 'payment_not_done' && b.paymentDone) return false;
      if (bookingFilter.status === 'delivery_not_done' && b.deliveryDone) return false;
      if (bookingFilter.status === 'completed' && (!b.pickupDone || !b.paymentDone || !b.deliveryDone)) return false;

      // Date filter
      if (bookingFilter.date) {
        const targetDate = bookingFilter.date; // YYYY-MM-DD
        let matches = false;
        if (b.pickupDate && b.pickupDate.includes(targetDate)) matches = true;
        if (b.receivedAt && b.receivedAt.startsWith(targetDate)) matches = true;
        if (b.date && b.date.includes(targetDate)) matches = true;
        if (!matches) return false;
      }

      // Search filter
      if (bookingFilter.search) {
        const q = bookingFilter.search;
        const name = (b.name || '').toLowerCase();
        const phone = (b.phone || '').toLowerCase();
        const loc = (b.location || b.sector || '').toLowerCase();
        const addr = (b.address || '').toLowerCase();
        const srv = Array.isArray(b.services) ? b.services.join(' ').toLowerCase() : (b.services || '').toLowerCase();
        const notes = (b.notes || '').toLowerCase();
        if (!name.includes(q) && !phone.includes(q) && !loc.includes(q) && !addr.includes(q) && !srv.includes(q) && !notes.includes(q)) {
          return false;
        }
      }

      return true;
    });

    // 2. Sort
    filtered.sort((a, b) => {
      if (bookingFilter.sort === 'newest') {
        const tA = a.receivedAt ? new Date(a.receivedAt).getTime() : parseBookingDate(a);
        const tB = b.receivedAt ? new Date(b.receivedAt).getTime() : parseBookingDate(b);
        return tB - tA;
      }
      if (bookingFilter.sort === 'oldest') {
        const tA = a.receivedAt ? new Date(a.receivedAt).getTime() : parseBookingDate(a);
        const tB = b.receivedAt ? new Date(b.receivedAt).getTime() : parseBookingDate(b);
        return tA - tB;
      }
      if (bookingFilter.sort === 'pickup_asc') {
        return parseBookingDate(a) - parseBookingDate(b);
      }
      if (bookingFilter.sort === 'pickup_desc') {
        return parseBookingDate(b) - parseBookingDate(a);
      }
      return 0;
    });

    // Update count display
    countLabel.textContent = `Showing ${filtered.length} of ${allBookings.length} bookings`;

    if (filtered.length === 0) {
      container.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    container.innerHTML = '';

    filtered.forEach(b => {
      const isCompleted = b.pickupDone && b.paymentDone && b.deliveryDone;
      const card = document.createElement('div');
      card.className = `booking-card ${isCompleted ? 'completed' : ''}`;

      // Clean services
      let servicesList = [];
      if (Array.isArray(b.services)) {
        servicesList = b.services;
      } else if (typeof b.services === 'string' && b.services.trim()) {
        servicesList = b.services.split(',').map(s => s.trim()).filter(Boolean);
      }

      const servicesHtml = servicesList.length > 0
        ? `<div class="services-tags">${servicesList.map(s => `<span class="service-tag">${escapeHtml(s)}</span>`).join('')}</div>`
        : '<div class="services-tags"><span class="service-tag">Standard Dry Clean</span></div>';

      const cleanPhone = (b.phone || '').replace(/[^0-9]/g, '');
      const waLink = cleanPhone ? `https://wa.me/91${cleanPhone.slice(-10)}?text=Hello%20${encodeURIComponent(b.name || 'Customer')}%2C%20greetings%20from%20Mourya%20Dry%20Cleaners!` : '#';

      card.innerHTML = `
        <div class="card-main">
          <div class="card-top">
            <div>
              <div class="cust-name">${escapeHtml(b.name || 'Unnamed Customer')}</div>
              <div class="phone-actions">
                <a href="tel:${cleanPhone}" class="cust-phone" title="Click to call">📞 <strong>${escapeHtml(b.phone || 'No phone')}</strong></a>
                ${cleanPhone ? `<a href="${waLink}" target="_blank" class="btn-wa-tiny" title="Message on WhatsApp">💬 WA</a>` : ''}
              </div>
            </div>
            <div class="booking-id-badge">${escapeHtml(b.id || 'BOOKING')}</div>
          </div>

          <div class="card-details">
            <div class="detail-row">
              <span class="detail-icon">📅</span>
              <span class="detail-text"><strong>Pickup:</strong> ${escapeHtml(b.date || b.pickupDate || 'Flexible')} • ${escapeHtml(b.time || 'Flexible Time')}</span>
            </div>
            <div class="detail-row">
              <span class="detail-icon">📍</span>
              <span class="detail-text"><strong>Sector:</strong> ${escapeHtml(b.location || b.sector || 'Gurugram')}${b.address ? ` — ${escapeHtml(b.address)}` : ''}</span>
            </div>
            ${b.gps ? `<div class="detail-row"><span class="detail-icon">🗺️</span><a href="${escapeHtml(b.gps)}" target="_blank" style="color:#2563eb;text-decoration:underline;font-size:12px;">Open Live GPS Map Pin ↗</a></div>` : ''}
            ${b.notes ? `<div class="detail-row"><span class="detail-icon">📝</span><span class="detail-text" style="color:#b45309;font-weight:600;">"${escapeHtml(b.notes)}"</span></div>` : ''}
            ${servicesHtml}
          </div>

          <!-- Status Toggles -->
          <div class="status-box">
            <div class="status-box-title">Order Fulfillment Status</div>
            
            <div class="status-toggle-row">
              <span class="toggle-label">
                📦 Pickup:
                <span class="status-badge-indicator ${b.pickupDone ? 'done' : 'pending'}">${b.pickupDone ? '✓ Done' : '⏳ Pending'}</span>
              </span>
              <label class="switch">
                <input type="checkbox" class="toggle-pickup" data-id="${b.id}" ${b.pickupDone ? 'checked' : ''} />
                <span class="slider"></span>
              </label>
            </div>

            <div class="status-toggle-row">
              <span class="toggle-label">
                💳 Payment:
                <span class="status-badge-indicator ${b.paymentDone ? 'done' : 'pending'}">${b.paymentDone ? '✓ Done' : '⏳ Pending'}</span>
              </span>
              <label class="switch">
                <input type="checkbox" class="toggle-payment" data-id="${b.id}" ${b.paymentDone ? 'checked' : ''} />
                <span class="slider"></span>
              </label>
            </div>

            <div class="status-toggle-row">
              <span class="toggle-label">
                🚚 Delivery:
                <span class="status-badge-indicator ${b.deliveryDone ? 'done' : 'pending'}">${b.deliveryDone ? '✓ Done' : '⏳ Pending'}</span>
              </span>
              <label class="switch">
                <input type="checkbox" class="toggle-delivery" data-id="${b.id}" ${b.deliveryDone ? 'checked' : ''} />
                <span class="slider slider-green"></span>
              </label>
            </div>
          </div>
        </div>

        <!-- Card Footer & Screenshot -->
        <div class="card-footer-actions">
          <div style="display:flex; align-items:center; gap:8px;">
            ${b.paymentScreenshot ? `
              <div class="screenshot-preview-pill" data-img="${escapeHtml(b.paymentScreenshot)}" data-title="Payment Screenshot - ${escapeHtml(b.name || '')}">
                <img src="${escapeHtml(b.paymentScreenshot)}" alt="Receipt" class="screenshot-thumb" />
                <span class="screenshot-view-text">👁️ Receipt</span>
              </div>
              <button type="button" class="btn-upload-shot" data-id="${b.id}" title="Re-upload or change receipt">📷</button>
            ` : `
              <button type="button" class="btn-upload-shot" data-id="${b.id}">
                <span>📷 Screenshot</span>
              </button>
            `}
          </div>
          <button type="button" class="btn-primary btn-create-bill-from-card" data-id="${b.id}" style="padding: 7px 12px; font-size: 12px;" title="Create invoice for this booking">
            <span>🧾 Create Bill</span>
          </button>
        </div>
      `;

      // Status Toggle Listeners
      card.querySelector('.toggle-pickup').addEventListener('change', async (e) => {
        await updateBookingStatus(b.id, { pickupDone: e.target.checked });
      });

      card.querySelector('.toggle-payment').addEventListener('change', async (e) => {
        await updateBookingStatus(b.id, { paymentDone: e.target.checked });
      });

      card.querySelector('.toggle-delivery').addEventListener('change', async (e) => {
        await updateBookingStatus(b.id, { deliveryDone: e.target.checked });
      });

      // Create Bill from Booking Listener
      card.querySelector('.btn-create-bill-from-card')?.addEventListener('click', () => {
        createBillFromBooking(b);
      });

      // Screenshot Upload Trigger
      card.querySelectorAll('.btn-upload-shot').forEach(btn => {
        btn.addEventListener('click', () => openScreenshotUploadModal(b));
      });

      // Lightbox view trigger
      card.querySelector('.screenshot-preview-pill')?.addEventListener('click', (e) => {
        const pill = e.currentTarget;
        openLightbox(pill.getAttribute('data-img'), pill.getAttribute('data-title'));
      });

      container.appendChild(card);
    });
  }

  async function updateBookingStatus(bookingId, updates) {
    try {
      const idx = allBookings.findIndex(b => b.id === bookingId);
      if (idx !== -1) {
        Object.assign(allBookings[idx], updates);
      }

      const res = await apiFetch('/api/admin/bookings/status', {
        method: 'POST',
        body: JSON.stringify({ id: bookingId, ...updates })
      });

      if (res.status === 'success') {
        showToast('Booking status updated in Cloud.');
        renderBookings();
      } else {
        throw new Error(res.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Update status error:', err);
      showToast('Error updating status: ' + err.message, true);
      renderBookings(); // revert checkbox
    }
  }

  // ==================== SCREENSHOT UPLOAD MODAL ====================
  function initScreenshotModal() {
    const modal = document.getElementById('uploadScreenshotModal');
    const closeBtn = document.getElementById('btnCloseScreenshotModal');
    const cancelBtn = document.getElementById('btnCancelScreenshotUpload');
    const confirmBtn = document.getElementById('btnConfirmScreenshotUpload');
    const fileInput = document.getElementById('screenshotFileInput');
    const removePreviewBtn = document.getElementById('btnRemoveScreenshotPreview');

    const closeModal = () => {
      modal.classList.add('hidden');
      targetBookingForScreenshot = null;
      selectedScreenshotBase64 = null;
      selectedScreenshotFileName = null;
      if (fileInput) fileInput.value = '';
      document.getElementById('screenshotDropzoneEmpty')?.classList.remove('hidden');
      document.getElementById('screenshotDropzonePreview')?.classList.add('hidden');
      confirmBtn.disabled = true;
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      handleScreenshotFileSelect(file);
    });

    removePreviewBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedScreenshotBase64 = null;
      selectedScreenshotFileName = null;
      if (fileInput) fileInput.value = '';
      document.getElementById('screenshotDropzoneEmpty')?.classList.remove('hidden');
      document.getElementById('screenshotDropzonePreview')?.classList.add('hidden');
      confirmBtn.disabled = true;
    });

    confirmBtn?.addEventListener('click', async () => {
      if (!targetBookingForScreenshot || !selectedScreenshotBase64) return;
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Uploading...';

      try {
        const payload = {
          filename: selectedScreenshotFileName || 'receipt.png',
          contentBase64: selectedScreenshotBase64,
          contentType: 'image/png'
        };

        const uploadRes = await apiFetch('/api/admin/upload-screenshot', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (uploadRes.status === 'success') {
          // Attach to booking
          await updateBookingStatus(targetBookingForScreenshot.id, {
            paymentScreenshot: uploadRes.url,
            paymentDone: true // auto-mark payment done when screenshot is attached!
          });
          closeModal();
          showToast('Payment screenshot attached successfully!');
        } else {
          throw new Error(uploadRes.error || 'Upload failed');
        }
      } catch (err) {
        console.error('Screenshot upload error:', err);
        showToast('Upload failed: ' + err.message, true);
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Upload & Attach';
      }
    });
  }

  function openScreenshotUploadModal(booking) {
    targetBookingForScreenshot = booking;
    const modal = document.getElementById('uploadScreenshotModal');
    const desc = document.getElementById('screenshotBookingDesc');
    if (desc) {
      desc.textContent = `Upload payment receipt for customer "${booking.name || 'Customer'}" (${booking.phone || ''})`;
    }
    modal.classList.remove('hidden');
  }

  function handleScreenshotFileSelect(file) {
    selectedScreenshotFileName = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1000;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        selectedScreenshotBase64 = compressedDataUrl.split(',')[1];
        document.getElementById('screenshotPreviewImg').src = compressedDataUrl;
        document.getElementById('screenshotPreviewFilename').textContent = file.name;
        document.getElementById('screenshotDropzoneEmpty').classList.add('hidden');
        document.getElementById('screenshotDropzonePreview').classList.remove('hidden');
        document.getElementById('btnConfirmScreenshotUpload').disabled = false;
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // ==================== ADD BOOKING MODAL ====================
  function initAddBookingModal() {
    const modal = document.getElementById('addBookingModal');
    const closeBtn = document.getElementById('btnCloseAddBooking');
    const cancelBtn = document.getElementById('btnCancelAddBooking');
    const form = document.getElementById('addBookingForm');

    const closeModal = () => {
      modal.classList.add('hidden');
      form?.reset();
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('btnSubmitAddBooking');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      try {
        const formData = new FormData(form);
        const servicesInput = (formData.get('services') || '').trim();
        const services = servicesInput ? servicesInput.split(',').map(s => s.trim()).filter(Boolean) : ['Dry Cleaning'];

        const bookingPayload = {
          name: formData.get('name').trim(),
          phone: formData.get('phone').trim(),
          pickupDate: formData.get('pickupDate'),
          date: formData.get('pickupDate'),
          time: formData.get('time'),
          sector: formData.get('sector').trim(),
          location: formData.get('sector').trim(),
          address: formData.get('address').trim(),
          services: services,
          notes: formData.get('notes').trim(),
          pickupDone: false,
          paymentDone: false,
          deliveryDone: false
        };

        const res = await apiFetch('/api/admin/bookings', {
          method: 'POST',
          body: JSON.stringify(bookingPayload)
        });

        if (res.status === 'success') {
          showToast('New booking saved successfully!');
          closeModal();
          await loadInitialData();
        } else {
          throw new Error(res.error || 'Failed to save booking');
        }
      } catch (err) {
        console.error('Add booking error:', err);
        showToast('Error saving booking: ' + err.message, true);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Booking';
      }
    });
  }

  function openAddBookingModal() {
    const modal = document.getElementById('addBookingModal');
    // Set default pickup date to today
    const dateInput = document.getElementById('newPickupDate');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
    modal.classList.remove('hidden');
  }

  // ==================== EXPENSES CONTROLLER ====================
  function initExpenseFilters() {
    const searchInput = document.getElementById('expenseSearchInput');
    const clearSearchBtn = document.getElementById('btnClearExpSearch');
    const categorySelect = document.getElementById('expCategoryFilter');
    const monthSelect = document.getElementById('expMonthFilter');

    searchInput?.addEventListener('input', (e) => {
      expenseFilter.search = e.target.value.trim().toLowerCase();
      clearSearchBtn.classList.toggle('hidden', !expenseFilter.search);
      renderExpenses();
    });

    clearSearchBtn?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      expenseFilter.search = '';
      clearSearchBtn.classList.add('hidden');
      renderExpenses();
    });

    categorySelect?.addEventListener('change', (e) => {
      expenseFilter.category = e.target.value;
      renderExpenses();
    });

    monthSelect?.addEventListener('change', (e) => {
      expenseFilter.month = e.target.value;
      renderExpenses();
    });

    document.getElementById('btnOpenAddExpenseModal')?.addEventListener('click', openAddExpenseModal);
  }

  function populateExpenseMonthsDropdown() {
    const monthSelect = document.getElementById('expMonthFilter');
    if (!monthSelect) return;

    const monthsSet = new Set();
    allExpenses.forEach(exp => {
      if (exp.date) {
        const d = new Date(exp.date);
        if (!isNaN(d.getTime())) {
          const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          monthsSet.add(key);
        }
      }
    });

    // Keep "All Months" as first
    monthSelect.innerHTML = '<option value="all">All Months</option>';
    Array.from(monthsSet).sort().reverse().forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      monthSelect.appendChild(opt);
    });
  }

  function updateExpenseKpis() {
    let totalAmt = 0;
    let thisMonthAmt = 0;

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    allExpenses.forEach(e => {
      const amt = Number(e.amount) || 0;
      totalAmt += amt;

      if (e.date) {
        const d = new Date(e.date);
        if (!isNaN(d.getTime()) && d.getFullYear() === curYear && d.getMonth() === curMonth) {
          thisMonthAmt += amt;
        }
      }
    });

    document.getElementById('kpiTotalExpenseAmt').textContent = formatCurrency(totalAmt);
    document.getElementById('kpiThisMonthExpense').textContent = formatCurrency(thisMonthAmt);
    const countEl = document.getElementById('kpiExpenseReceiptsCount');
    if (countEl) countEl.textContent = allExpenses.length;
    document.getElementById('badgeTotalExpenses').textContent = allExpenses.length;
  }

  function renderExpenses() {
    updateExpenseKpis();

    const tbody = document.getElementById('expensesTableBody');
    const emptyState = document.getElementById('noExpensesState');
    const countLabel = document.getElementById('expenseResultsCount');
    if (!tbody) return;

    // Filter
    const filtered = allExpenses.filter(e => {
      if (expenseFilter.category !== 'all' && e.category !== expenseFilter.category) return false;

      if (expenseFilter.month !== 'all' && e.date) {
        const d = new Date(e.date);
        if (!isNaN(d.getTime())) {
          const mKey = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          if (mKey !== expenseFilter.month) return false;
        }
      }

      if (expenseFilter.search) {
        const q = expenseFilter.search;
        const title = (e.title || '').toLowerCase();
        const cat = (e.category || '').toLowerCase();
        const vendor = (e.vendor || '').toLowerCase();
        const notes = (e.notes || '').toLowerCase();
        if (!title.includes(q) && !cat.includes(q) && !vendor.includes(q) && !notes.includes(q)) {
          return false;
        }
      }

      return true;
    });

    countLabel.textContent = `Showing ${filtered.length} of ${allExpenses.length} expense entries`;

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    tbody.innerHTML = '';

    filtered.forEach(exp => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td style="white-space: nowrap; font-weight: 600;">${formatDateHuman(exp.date)}</td>
        <td class="exp-title-cell">
          <div class="exp-title-text">${escapeHtml(exp.title || 'Untitled Expense')}</div>
          <span class="category-pill">${escapeHtml(exp.category || 'Miscellaneous')}</span>
          ${exp.notes ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">Note: ${escapeHtml(exp.notes)}</div>` : ''}
        </td>
        <td>${escapeHtml(exp.vendor || '—')}</td>
        <td><span style="font-weight: 600; color: #1e40af;">${escapeHtml(exp.paymentMode || 'Cash')}</span></td>
        <td class="exp-amount-text">${formatCurrency(exp.amount)}</td>
        <td style="text-align: right;">
          <button type="button" class="btn-delete-item" data-id="${exp.expenseId || exp.id}" title="Delete expense">🗑️ Delete</button>
        </td>
      `;

      // Delete Trigger
      tr.querySelector('.btn-delete-item')?.addEventListener('click', async () => {
        const id = exp.expenseId || exp.id;
        if (confirm(`Are you sure you want to delete "${exp.title}" (${formatCurrency(exp.amount)})?`)) {
          await deleteExpense(id);
        }
      });

      tbody.appendChild(tr);
    });
  }

  async function deleteExpense(expenseId) {
    try {
      const res = await apiFetch(`/api/admin/expenses/${encodeURIComponent(expenseId)}`, {
        method: 'DELETE'
      });
      if (res.status === 'success') {
        allExpenses = allExpenses.filter(e => (e.expenseId !== expenseId && e.id !== expenseId));
        populateExpenseMonthsDropdown();
        renderExpenses();
        showToast('Expense record deleted.');
      } else {
        throw new Error(res.error || 'Failed to delete');
      }
    } catch (err) {
      console.error('Delete expense error:', err);
      showToast('Error deleting expense: ' + err.message, true);
    }
  }

  // ==================== ADD EXPENSE MODAL ====================
  function initAddExpenseModal() {
    const modal = document.getElementById('addExpenseModal');
    const closeBtn = document.getElementById('btnCloseAddExpense');
    const cancelBtn = document.getElementById('btnCancelAddExpense');
    const form = document.getElementById('addExpenseForm');

    const closeModal = () => {
      modal.classList.add('hidden');
      form?.reset();
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('btnSubmitAddExpense');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Recording Expense...';

      try {
        const payload = {
          category: document.getElementById('expCatInput').value,
          amount: parseFloat(document.getElementById('expAmtInput').value) || 0,
          title: document.getElementById('expTitleInput').value.trim(),
          date: document.getElementById('expDateInput').value,
          paymentMode: document.getElementById('expPaymentModeInput').value,
          vendor: document.getElementById('expVendorInput').value.trim(),
          notes: document.getElementById('expNotesInput').value.trim()
        };

        const res = await apiFetch('/api/admin/expenses', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (res.status === 'success') {
          showToast('Expense recorded successfully!');
          closeModal();
          await loadInitialData();
        } else {
          throw new Error(res.error || 'Failed to record expense');
        }
      } catch (err) {
        console.error('Record expense error:', err);
        showToast('Error recording expense: ' + err.message, true);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Record Expense';
      }
    });
  }

  function openAddExpenseModal() {
    const modal = document.getElementById('addExpenseModal');
    // Set default date to today
    const dateInput = document.getElementById('expDateInput');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
    modal.classList.remove('hidden');
  }

  // ==================== IMAGE LIGHTBOX ====================
  function initLightbox() {
    const modal = document.getElementById('imageLightboxModal');
    const closeBtn = document.getElementById('btnCloseLightbox');

    const closeModal = () => modal.classList.add('hidden');
    closeBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  function openLightbox(imageUrl, title = 'Receipt View') {
    const modal = document.getElementById('imageLightboxModal');
    const img = document.getElementById('lightboxImg');
    const titleEl = document.getElementById('lightboxTitle');
    const extLink = document.getElementById('lightboxOpenExternal');

    if (!modal || !img) return;

    img.src = imageUrl;
    if (titleEl) titleEl.textContent = title;
    if (extLink) extLink.href = imageUrl;

    modal.classList.remove('hidden');
  }


  // ==================== BILLS CONTROLLER ====================
  function initBills() {
    // Initialize Monthly Revenue Analytics & Month Filter
    initBillRevenueFilter();

    // Subnav Tab Switching
    document.getElementById('subTabBtnCreateBill')?.addEventListener('click', () => switchBillSubTab('createBill'));
    document.getElementById('subTabBtnHistory')?.addEventListener('click', () => switchBillSubTab('history'));
    document.getElementById('btnHistoryToCreateBill')?.addEventListener('click', () => switchBillSubTab('createBill'));

    // Set Default Bill Date to Today
    const dateInput = document.getElementById('billDateInput');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    // Set Default Bill Number
    const numInput = document.getElementById('billNumberInput');
    if (numInput && !numInput.value) {
      numInput.value = generateBillNumber();
    }

    // Initialize 8 Default Item Rows
    initBillEditorRows();

    // Input listeners for Customer & Bill Details -> Real-time Live Preview
    const bindLiveField = (inputId, previewId, placeholder = '________________________') => {
      const el = document.getElementById(inputId);
      el?.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        const pEl = document.getElementById(previewId);
        if (pEl) pEl.textContent = val || placeholder;
      });
    };

    bindLiveField('billCustName', 'pvCustName', '________________________');
    bindLiveField('billCustPhone', 'pvCustPhone', '________________________');
    bindLiveField('billCustAddress', 'pvCustAddress', '________________________');
    bindLiveField('billNumberInput', 'pvBillNumber', 'MDC-2610-001');

    document.getElementById('billDateInput')?.addEventListener('change', (e) => {
      const val = e.target.value;
      const pEl = document.getElementById('pvBillDate');
      if (pEl) {
        if (!val) {
          pEl.textContent = '_____ / _____ / _________';
        } else {
          const parts = val.split('-');
          pEl.textContent = `${parts[2]} / ${parts[1]} / ${parts[0]}`;
        }
      }
    });

    // Add Row Button
    document.getElementById('btnAddItemRow')?.addEventListener('click', () => {
      billEditorRows.push({
        sno: billEditorRows.length + 1,
        service: '',
        qty: '',
        rate: '',
        amount: 0
      });
      renderBillEditorTable();
      updateLiveInvoicePreview();
    });

    // Save Bill Button
    document.getElementById('btnSaveBill')?.addEventListener('click', saveCurrentBill);

    // WhatsApp Share Buttons
    document.getElementById('btnShareWhatsapp')?.addEventListener('click', () => shareBillOnWhatsapp());
    document.getElementById('btnPreviewWhatsapp')?.addEventListener('click', () => shareBillOnWhatsapp());

    // Download PDF Button
    document.getElementById('btnDownloadPdf')?.addEventListener('click', () => downloadBillPdf());
    document.getElementById('btnPreviewPdf')?.addEventListener('click', () => downloadBillPdf());

    // Print Button
    document.getElementById('btnPrintBill')?.addEventListener('click', () => printBill());
    document.getElementById('btnPreviewPrint')?.addEventListener('click', () => printBill());

    // Reset Form Button
    document.getElementById('btnResetBillForm')?.addEventListener('click', () => {
      if (confirm('Reset this billing form to start a new blank bill?')) {
        resetBillForm();
      }
    });

    // History Search & Date Filter
    const searchInput = document.getElementById('billHistorySearch');
    const clearSearchBtn = document.getElementById('btnClearBillSearch');
    const dateFilter = document.getElementById('billHistoryDateFilter');
    const clearDateBtn = document.getElementById('btnClearBillDateFilter');

    searchInput?.addEventListener('input', (e) => {
      billHistorySearch = e.target.value.trim().toLowerCase();
      clearSearchBtn.classList.toggle('hidden', !billHistorySearch);
      renderBillsHistory();
    });

    clearSearchBtn?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      billHistorySearch = '';
      clearSearchBtn.classList.add('hidden');
      renderBillsHistory();
    });

    dateFilter?.addEventListener('change', (e) => {
      billHistoryDate = e.target.value;
      clearDateBtn.classList.toggle('hidden', !billHistoryDate);
      renderBillsHistory();
    });

    clearDateBtn?.addEventListener('click', () => {
      if (dateFilter) dateFilter.value = '';
      billHistoryDate = '';
      clearDateBtn.classList.add('hidden');
      renderBillsHistory();
    });

    document.getElementById('btnResetBillHistoryFilters')?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (dateFilter) dateFilter.value = '';
      billHistorySearch = '';
      billHistoryDate = '';
      clearSearchBtn?.classList.add('hidden');
      clearDateBtn?.classList.add('hidden');
      renderBillsHistory();
    });
  }

  function switchBillSubTab(subTab) {
    activeBillSubTab = subTab;
    const isCreate = subTab === 'createBill';

    document.getElementById('subTabBtnCreateBill')?.classList.toggle('active', isCreate);
    document.getElementById('subTabBtnHistory')?.classList.toggle('active', !isCreate);

    document.getElementById('subViewCreateBill')?.classList.toggle('hidden', !isCreate);
    document.getElementById('subViewBillHistory')?.classList.toggle('hidden', isCreate);

    if (!isCreate) {
      renderBillsHistory();
    }
  }

  function generateBillNumber() {
    return 'BOOK-' + Date.now();
  }

  // Mourya Official Rate Card Catalog (From pricing.html)
  const MOURYA_PRICING_CATALOG = [
    {
      category: "Men's Wear",
      items: [
        { name: "Shirt", rate: 80 },
        { name: "T-shirt", rate: 70 },
        { name: "Pant / Trouser", rate: 80 },
        { name: "Kurta / Pajama", rate: 180 },
        { name: "Dhoti", rate: 120 },
        { name: "Tie", rate: 10 },
        { name: "Blazer", rate: 180 },
        { name: "J-Suit 2 Pcs", rate: 230 },
        { name: "J-Suit 3 Pcs", rate: 280 },
        { name: "Waist Coat", rate: 140 },
        { name: "Sweater", rate: 110 },
        { name: "Sherwani 2 Pcs", rate: 250 }
      ]
    },
    {
      category: "Women's Wear",
      items: [
        { name: "Saree", rate: 180 },
        { name: "Saree (Heavy/Silk)", rate: 230 },
        { name: "Blouse", rate: 70 },
        { name: "Dupatta", rate: 70 },
        { name: "Ladies Kurta", rate: 90 },
        { name: "Ladies Suit 2 Pcs", rate: 180 },
        { name: "Ladies Suit 3 Pcs", rate: 250 },
        { name: "Skirt", rate: 80 },
        { name: "Lehanga 2 Pcs", rate: 250 },
        { name: "Lehanga 3 Pcs", rate: 300 },
        { name: "Shawl", rate: 120 },
        { name: "Ladies Dress", rate: 150 },
        { name: "Overcoat", rate: 180 }
      ]
    },
    {
      category: "Household & Bedding",
      items: [
        { name: "Bed Sheet", rate: 140 },
        { name: "Pillow Cover", rate: 50 },
        { name: "Blanket (Single)", rate: 230 },
        { name: "Blanket (Double)", rate: 280 },
        { name: "Quilt / Rajai", rate: 230 },
        { name: "Curtain (per Panel)", rate: 140 },
        { name: "Curtain (Heavy per Panel)", rate: 170 },
        { name: "Carpet (per Sq.ft.)", rate: 35 },
        { name: "Sofa Set (per Seat)", rate: 230 },
        { name: "Shoes", rate: 230 }
      ]
    },
    {
      category: "Steam Ironing",
      items: [
        { name: "Shirt / Pant (Steam Iron)", rate: 30 },
        { name: "Saree + Blouse (Steam Iron)", rate: 120 },
        { name: "Coat / Blazer (Steam Iron)", rate: 60 },
        { name: "Lehenga / Gown (Steam Iron)", rate: 140 },
        { name: "Kurta + Pajama (Steam Iron)", rate: 90 },
        { name: "Towel (Steam Iron)", rate: 90 },
        { name: "Top (Steam Iron)", rate: 90 }
      ]
    },
    {
      category: "Laundry (Wash & Fold)",
      items: [
        { name: "Laundry (7+ Kg)", rate: 55 },
        { name: "Laundry (Below 7 Kg)", rate: 65 },
        { name: "Wash & Steam Iron (Below 3 Kg)", rate: 100 },
        { name: "Wash & Steam Iron (3-5 Kg)", rate: 85 },
        { name: "Wash & Steam Iron (5-7 Kg)", rate: 80 },
        { name: "Wash & Steam Iron (7+ Kg)", rate: 75 }
      ]
    }
  ];

  function buildPricingOptionsHtml(currentServiceName = '') {
    let html = '<option value="">▼ Select Item from Pricing List</option>';
    let matched = false;

    MOURYA_PRICING_CATALOG.forEach(cat => {
      html += `<optgroup label="${cat.category}">`;
      cat.items.forEach(itm => {
        const isSelected = itm.name.toLowerCase() === (currentServiceName || '').toLowerCase();
        if (isSelected) matched = true;
        html += `<option value="${escapeHtml(itm.name)}" data-rate="${itm.rate}" ${isSelected ? 'selected' : ''}>${itm.name} — ₹${itm.rate}</option>`;
      });
      html += `</optgroup>`;
    });

    html += `<option value="__custom__" ${(!matched && currentServiceName) ? 'selected' : ''}>✏️ Custom / Other Item...</option>`;
    return html;
  }

  function initBillEditorRows(initialItems = []) {
    billEditorRows = [];
    const count = Math.max(8, initialItems.length);
    for (let i = 0; i < count; i++) {
      const itm = initialItems[i] || {};
      const qty = itm.qty || '';
      const rate = itm.rate || '';
      const amount = (qty && rate) ? Number(qty) * Number(rate) : (itm.amount || itm.total || 0);

      billEditorRows.push({
        sno: i + 1,
        service: itm.service || itm.name || '',
        qty: qty,
        rate: rate,
        amount: amount
      });
    }
    renderBillEditorTable();
    updateLiveInvoicePreview();
  }

  function renderBillEditorTable() {
    const tbody = document.getElementById('itemsEditorTbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    billEditorRows.forEach((row, idx) => {
      const tr = document.createElement('tr');
      const optHtml = buildPricingOptionsHtml(row.service);

      tr.innerHTML = `
        <td class="row-sno">${idx + 1}</td>
        <td class="col-service-editor">
          <div class="service-select-container">
            <select class="input-row-service-select" data-idx="${idx}">
              ${optHtml}
            </select>
            <input type="text" class="input-row-service" data-idx="${idx}" value="${escapeHtml(row.service)}" placeholder="Or type custom item name..." />
          </div>
        </td>
        <td>
          <input type="number" class="input-row-qty" data-idx="${idx}" value="${row.qty}" min="1" step="1" placeholder="1" />
        </td>
        <td>
          <input type="number" class="input-row-rate" data-idx="${idx}" value="${row.rate}" min="0" step="1" placeholder="₹" />
        </td>
        <td class="row-amount" id="rowAmt_${idx}">
          ${row.amount > 0 ? '₹' + row.amount.toLocaleString('en-IN') : '—'}
        </td>
        <td>
          ${billEditorRows.length > 8 ? `<button type="button" class="btn-del-row" data-idx="${idx}" title="Remove row">✕</button>` : ''}
        </td>
      `;

      const serviceSelect = tr.querySelector('.input-row-service-select');
      const serviceInput = tr.querySelector('.input-row-service');
      const qtyInput = tr.querySelector('.input-row-qty');
      const rateInput = tr.querySelector('.input-row-rate');
      const delBtn = tr.querySelector('.btn-del-row');

      // Dropdown selection -> Auto-fill item name & rate!
      serviceSelect.addEventListener('change', (e) => {
        const selectedVal = e.target.value;
        if (!selectedVal) return;

        if (selectedVal === '__custom__') {
          serviceInput.focus();
          serviceInput.select();
          return;
        }

        const selectedOpt = e.target.options[e.target.selectedIndex];
        const fixedRate = selectedOpt.getAttribute('data-rate');

        serviceInput.value = selectedVal;
        row.service = selectedVal;

        if (fixedRate) {
          rateInput.value = fixedRate;
          row.rate = Number(fixedRate);
        }

        if (!row.qty || Number(row.qty) <= 0) {
          row.qty = 1;
          qtyInput.value = 1;
        }

        row.amount = (row.qty && row.rate) ? (Number(row.qty) * Number(row.rate)) : 0;
        const amtCell = document.getElementById(`rowAmt_${idx}`);
        if (amtCell) {
          amtCell.textContent = row.amount > 0 ? '₹' + row.amount.toLocaleString('en-IN') : '—';
        }
        updateLiveInvoicePreview();
      });

      // Manual input changes
      const handleRowChange = () => {
        row.service = serviceInput.value.trim();
        row.qty = qtyInput.value ? Number(qtyInput.value) : '';
        row.rate = rateInput.value ? Number(rateInput.value) : '';
        row.amount = (row.qty && row.rate) ? (Number(row.qty) * Number(row.rate)) : 0;

        const amtCell = document.getElementById(`rowAmt_${idx}`);
        if (amtCell) {
          amtCell.textContent = row.amount > 0 ? '₹' + row.amount.toLocaleString('en-IN') : '—';
        }
        updateLiveInvoicePreview();
      };

      serviceInput.addEventListener('input', handleRowChange);
      qtyInput.addEventListener('input', handleRowChange);
      rateInput.addEventListener('input', handleRowChange);

      delBtn?.addEventListener('click', () => {
        billEditorRows.splice(idx, 1);
        renderBillEditorTable();
        updateLiveInvoicePreview();
      });

      tbody.appendChild(tr);
    });
  }

  function updateLiveInvoicePreview() {
    // 1. Details
    const nameVal = document.getElementById('billCustName')?.value.trim() || '';
    const phoneVal = document.getElementById('billCustPhone')?.value.trim() || '';
    const addrVal = document.getElementById('billCustAddress')?.value.trim() || '';
    const numVal = document.getElementById('billNumberInput')?.value.trim() || 'MDC-2610-001';
    const dateInputVal = document.getElementById('billDateInput')?.value || '';

    let formattedDate = '';
    if (dateInputVal) {
      const parts = dateInputVal.split('-');
      if (parts.length === 3) formattedDate = `${parts[2]} / ${parts[1]} / ${parts[0]}`;
    }

    const pvCustName = document.getElementById('pvCustName');
    const pvCustPhone = document.getElementById('pvCustPhone');
    const pvCustAddress = document.getElementById('pvCustAddress');
    const pvBillNumber = document.getElementById('pvBillNumber');
    const pvBillDate = document.getElementById('pvBillDate');

    if (pvCustName) pvCustName.textContent = nameVal;
    if (pvCustPhone) pvCustPhone.textContent = phoneVal;
    if (pvCustAddress) pvCustAddress.textContent = addrVal;
    if (pvBillNumber) pvBillNumber.textContent = numVal;
    if (pvBillDate) pvBillDate.textContent = formattedDate;

    // 2. 8 Rows Container
    const container = document.getElementById('pvItemsContainer');
    let totalSum = 0;

    if (container) {
      container.innerHTML = '';
      for (let i = 0; i < 8; i++) {
        const item = billEditorRows[i] || { service: '', qty: '', rate: '', amount: 0 };
        const rowAmt = (item.qty && item.rate) ? (Number(item.qty) * Number(item.rate)) : (Number(item.amount) || 0);
        totalSum += rowAmt;

        const rowDiv = document.createElement('div');
        rowDiv.className = 'inv-row-item';
        rowDiv.innerHTML = `
          <div class="row-col-sno">${i + 1}</div>
          <div class="row-col-service">${escapeHtml(item.service || '')}</div>
          <div class="row-col-qty">${item.qty ? item.qty : ''}</div>
          <div class="row-col-rate">${item.rate ? Number(item.rate).toLocaleString('en-IN') : ''}</div>
          <div class="row-col-amount">${rowAmt > 0 ? rowAmt.toLocaleString('en-IN') : ''}</div>
        `;
        container.appendChild(rowDiv);
      }
    }

    // 3. Total Row & Form Display
    const pvTotalEl = document.getElementById('pvTotalAmount');
    if (pvTotalEl) {
      pvTotalEl.textContent = totalSum > 0 ? '₹ ' + totalSum.toLocaleString('en-IN') : '';
    }

    const editorTotalEl = document.getElementById('editorTotalDisplay');
    if (editorTotalEl) {
      editorTotalEl.textContent = formatCurrency(totalSum);
    }
  }

  // ==================== MONTHLY BILL REVENUE & ANALYTICS ====================
  let billRevenueSelectedMonth = 'all';

  function initBillRevenueFilter() {
    const filterSelect = document.getElementById('billRevenueMonthFilter');
    if (!filterSelect) return;

    filterSelect.addEventListener('change', (e) => {
      billRevenueSelectedMonth = e.target.value;
      updateBillRevenueAnalytics();
    });
  }

  function populateBillRevenueMonthsDropdown() {
    const filterSelect = document.getElementById('billRevenueMonthFilter');
    if (!filterSelect) return;

    const monthsMap = new Map();
    allBills.forEach(b => {
      const d = b.date ? new Date(b.date) : (b.createdAt ? new Date(b.createdAt) : null);
      if (d && !isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        monthsMap.set(key, label);
      }
    });

    const sortedKeys = Array.from(monthsMap.keys()).sort().reverse();

    filterSelect.innerHTML = '<option value="all">All Months (Overall)</option>';
    sortedKeys.forEach(k => {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = monthsMap.get(k);
      filterSelect.appendChild(opt);
    });

    if (billRevenueSelectedMonth !== 'all' && sortedKeys.includes(billRevenueSelectedMonth)) {
      filterSelect.value = billRevenueSelectedMonth;
    } else {
      filterSelect.value = 'all';
    }
  }

  function updateBillRevenueAnalytics() {
    let filtered = allBills;
    let periodLabel = 'Total Revenue (All Time)';
    let periodDisplay = 'All Months';

    if (billRevenueSelectedMonth !== 'all') {
      filtered = allBills.filter(b => {
        const d = b.date ? new Date(b.date) : (b.createdAt ? new Date(b.createdAt) : null);
        if (d && !isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          return key === billRevenueSelectedMonth;
        }
        return false;
      });

      const filterSelect = document.getElementById('billRevenueMonthFilter');
      const selectedOpt = filterSelect?.options[filterSelect.selectedIndex];
      if (selectedOpt && selectedOpt.value !== 'all') {
        periodLabel = `Total Revenue (${selectedOpt.textContent})`;
        periodDisplay = selectedOpt.textContent;
      }
    }

    const totalSum = filtered.reduce((acc, b) => acc + (parseFloat(b.totalAmount || b.grandTotal) || 0), 0);
    const count = filtered.length;
    const avg = count > 0 ? Math.round(totalSum / count) : 0;

    const lblEl = document.getElementById('lblSelectedMonthRevenue');
    const sumEl = document.getElementById('valMonthlyRevenueSum');
    const countEl = document.getElementById('valMonthlyBillsCount');
    const avgEl = document.getElementById('valMonthlyAvgBill');
    const periodEl = document.getElementById('valSelectedMonthText');

    if (lblEl) lblEl.textContent = periodLabel;
    if (sumEl) sumEl.textContent = formatCurrency(totalSum);
    if (countEl) countEl.textContent = `${count} Bill${count === 1 ? '' : 's'}`;
    if (avgEl) avgEl.textContent = formatCurrency(avg);
    if (periodEl) periodEl.textContent = periodDisplay;

    // Sync subnav toolbar stats
    const kpiCountEl = document.getElementById('kpiTotalBillsCount');
    const kpiSumEl = document.getElementById('kpiTotalBilledSum');
    if (kpiCountEl) kpiCountEl.textContent = count;
    if (kpiSumEl) kpiSumEl.textContent = formatCurrency(totalSum);
  }

  function updateBillsKpis() {
    let totalCount = allBills.length;
    let totalSum = 0;

    allBills.forEach(b => {
      totalSum += (Number(b.totalAmount || b.grandTotal) || 0);
    });

    const badgeEl = document.getElementById('badgeTotalBills');
    const historyCountEl = document.getElementById('billsHistoryCount');

    if (badgeEl) badgeEl.textContent = totalCount;
    if (historyCountEl) historyCountEl.textContent = totalCount;

    populateBillRevenueMonthsDropdown();
    updateBillRevenueAnalytics();
  }

  async function saveCurrentBill() {
    const name = document.getElementById('billCustName')?.value.trim();
    const phone = document.getElementById('billCustPhone')?.value.trim();
    const address = document.getElementById('billCustAddress')?.value.trim();
    const billNumber = document.getElementById('billNumberInput')?.value.trim() || generateBillNumber();
    const date = document.getElementById('billDateInput')?.value || new Date().toISOString().split('T')[0];

    if (!name) {
      showToast('Please enter customer name.', true);
      document.getElementById('billCustName')?.focus();
      return false;
    }
    if (!phone) {
      showToast('Please enter customer phone number.', true);
      document.getElementById('billCustPhone')?.focus();
      return false;
    }

    // Filter non-empty items
    const activeItems = billEditorRows.filter(r => (r.service && r.service.trim()) || r.amount > 0);
    let totalAmount = 0;
    activeItems.forEach(r => {
      totalAmount += Number(r.amount) || 0;
    });

    if (activeItems.length === 0 || totalAmount <= 0) {
      showToast('Please select at least one service item with a rate before generating the bill.', true);
      return false;
    }

    const saveBtn = document.getElementById('btnSaveBill');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span>Saving...</span>';
    }

    try {
      currentBookingIdForBill = billNumber;
      const payload = {
        id: billNumber,
        bookingId: billNumber,
        billNumber: billNumber,
        invoiceNumber: billNumber,
        date,
        customerName: name,
        phone,
        address,
        items: activeItems,
        totalAmount,
        grandTotal: totalAmount
      };

      const res = await apiFetch('/api/admin/bills', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.status === 'success') {
        showToast(`Bill #${billNumber} saved successfully to database!`);
        // Refresh local bills list - prevent duplicate rows
        const idx = allBills.findIndex(b =>
          (b.id && (b.id === res.bill.id || b.id === billNumber)) ||
          (b.bookingId && (b.bookingId === res.bill.bookingId || b.bookingId === billNumber)) ||
          (b.billNumber && (b.billNumber === billNumber || b.billNumber === res.bill.billNumber)) ||
          (b.invoiceNumber && (b.invoiceNumber === billNumber || b.invoiceNumber === res.bill.invoiceNumber))
        );
        if (idx !== -1) {
          allBills[idx] = res.bill;
        } else {
          allBills.unshift(res.bill);
        }
        updateBillsKpis();
        renderBillsHistory();
        return true;
      } else {
        throw new Error(res.error || 'Failed to save bill');
      }
    } catch (err) {
      console.error('Save bill error:', err);
      showToast('Error saving bill: ' + err.message, true);
      return false;
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<span>💾 Save Bill</span>';
      }
    }
  }

  async function downloadBillPdf(billData = null) {
    if (billData) {
      loadBillIntoEditor(billData);
    } else {
      // Automatic guarantee: save to database before generating PDF
      const saved = await saveCurrentBill();
      if (!saved) return;
    }

    const billNumber = document.getElementById('billNumberInput')?.value.trim() || currentBookingIdForBill || 'MDC-Bill';
    const element = document.getElementById('mouryaInvoiceA4');
    if (!element) return;

    showToast('Generating high-resolution A4 PDF...');

    if (typeof html2pdf === 'undefined') {
      window.print();
      return;
    }

    // Reset scroll of preview container to prevent html2canvas viewport cropping
    const scrollContainer = document.getElementById('previewSheetContainer');
    if (scrollContainer) scrollContainer.scrollTop = 0;

    // Ensure template background image is loaded
    const templateImg = element.querySelector('.inv-template-img');
    if (templateImg && !templateImg.complete) {
      await new Promise(resolve => {
        templateImg.onload = resolve;
        templateImg.onerror = resolve;
        setTimeout(resolve, 1500);
      });
    }

    // 7mm margins horizontally ensures 100% of 1024px height fits completely on 1 single A4 page without clipping the bottom!
    const opt = {
      margin: [0, 7, 0, 7], // top, right, bottom, left in mm
      filename: `Mourya_Bill_${billNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        scrollY: 0,
        scrollX: 0
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      showToast(`Downloaded Mourya_Bill_${billNumber}.pdf`);
    }).catch(err => {
      console.error('PDF error:', err);
      window.print();
    });
  }

  async function printBill(billData = null) {
    if (billData) {
      loadBillIntoEditor(billData);
    } else {
      // Automatic guarantee: save to database before printing
      const saved = await saveCurrentBill();
      if (!saved) return;
    }
    window.print();
  }

  async function shareBillOnWhatsapp(billData = null) {
    if (billData) {
      loadBillIntoEditor(billData);
    } else {
      const saved = await saveCurrentBill();
      if (!saved) return;
    }

    const name = document.getElementById('billCustName')?.value.trim() || 'Valued Customer';
    const rawPhone = document.getElementById('billCustPhone')?.value.trim() || '';
    const billNumber = document.getElementById('billNumberInput')?.value.trim() || generateBillNumber();
    const dateInput = document.getElementById('billDateInput')?.value || new Date().toISOString().split('T')[0];
    const totalAmount = document.getElementById('editorTotalDisplay')?.textContent.replace(/[^\d]/g, '') || '0';

    if (!rawPhone) {
      showToast('Please enter customer phone number to send WhatsApp.', true);
      document.getElementById('billCustPhone')?.focus();
      return;
    }

    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    } else if (cleanPhone.length > 10 && !cleanPhone.startsWith('91')) {
      cleanPhone = '91' + cleanPhone.slice(-10);
    }

    // Active bill items list
    const activeItems = billEditorRows.filter(r => (r.service && r.service.trim()) || r.amount > 0);
    let itemsText = '';
    if (activeItems.length > 0) {
      itemsText = '*Services / Items:*\n' + activeItems.map(r => `• ${r.service}${r.qty ? ` (${r.qty} pcs)` : ''} - ₹${Number(r.amount || 0).toLocaleString('en-IN')}`).join('\n') + '\n\n';
    }

    // Format date (DD/MM/YYYY)
    const dParts = dateInput.split('-');
    const formattedDate = dParts.length === 3 ? `${dParts[2]}/${dParts[1]}/${dParts[0]}` : dateInput;

    let msg = `🧺 *MOURYA DRY CLEANERS* 🧺\n_Cleaner Clothes • Brighter Days_\n\n` +
      `Dear *${name}*,\n` +
      `Thank you for choosing Mourya Drycleaners! Here is your bill receipt:\n\n` +
      `📄 *Bill No:* ${billNumber}\n` +
      `🗓️ *Date:* ${formattedDate}\n\n` +
      itemsText +
      `--------------------------------\n` +
      `💰 *Grand Total: ₹${Number(totalAmount).toLocaleString('en-IN')}*\n` +
      `--------------------------------\n\n` +
      `📞 *Helpline:* 9217410047\n` +
      `📍 *Location:* Gurugram, Haryana\n` +
      `🌐 *Website:* https://www.mouryadrycleaners.in`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
    showToast('Opening WhatsApp with Bill details!');
  }

  function resetBillForm() {
    currentBookingIdForBill = null;
    const nameEl = document.getElementById('billCustName');
    const phoneEl = document.getElementById('billCustPhone');
    const addrEl = document.getElementById('billCustAddress');
    const numEl = document.getElementById('billNumberInput');
    const dateEl = document.getElementById('billDateInput');

    if (nameEl) nameEl.value = '';
    if (phoneEl) phoneEl.value = '';
    if (addrEl) addrEl.value = '';
    if (numEl) numEl.value = generateBillNumber();
    if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];

    initBillEditorRows();
    updateLiveInvoicePreview();
    showToast('Billing form reset.');
  }

  function loadBillIntoEditor(bill) {
    currentBookingIdForBill = bill.bookingId || bill.billNumber || bill.invoiceNumber || bill.id || null;
    const nameEl = document.getElementById('billCustName');
    const phoneEl = document.getElementById('billCustPhone');
    const addrEl = document.getElementById('billCustAddress');
    const numEl = document.getElementById('billNumberInput');
    const dateEl = document.getElementById('billDateInput');

    if (nameEl) nameEl.value = bill.customerName || '';
    if (phoneEl) phoneEl.value = bill.phone || '';
    if (addrEl) addrEl.value = bill.address || '';
    if (numEl) numEl.value = currentBookingIdForBill || generateBillNumber();
    if (dateEl) dateEl.value = bill.date || new Date().toISOString().split('T')[0];

    initBillEditorRows(bill.items || []);
    switchBillSubTab('createBill');
    updateLiveInvoicePreview();
    showToast(`Loaded Bill #${numEl.value}`);
  }

  function createBillFromBooking(booking) {
    const bookingId = booking.id || booking.bookingId || ('BOOK-' + Date.now());
    currentBookingIdForBill = bookingId;
    // 1. Switch to Bills tab
    switchTab('billsTab');
    switchBillSubTab('createBill');

    // 2. Prefill fields with exact Booking ID as Bill Number
    const nameEl = document.getElementById('billCustName');
    const phoneEl = document.getElementById('billCustPhone');
    const addrEl = document.getElementById('billCustAddress');
    const numEl = document.getElementById('billNumberInput');
    const dateEl = document.getElementById('billDateInput');

    if (nameEl) nameEl.value = booking.name || '';
    if (phoneEl) phoneEl.value = booking.phone || '';

    const addressParts = [booking.address, booking.location || booking.sector].filter(Boolean);
    if (addrEl) addrEl.value = addressParts.join(', ');

    // Use exact booking ID as bill number
    if (numEl) numEl.value = bookingId;
    if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];

    // 3. Pre-seed services in first row
    let srvName = '';
    if (Array.isArray(booking.services) && booking.services.length > 0) {
      srvName = booking.services.join(', ');
    } else if (typeof booking.services === 'string') {
      srvName = booking.services;
    }

    const initialItems = srvName ? [{ service: srvName, qty: 1, rate: 0, amount: 0 }] : [];
    initBillEditorRows(initialItems);
    updateLiveInvoicePreview();
    showToast(`Billing opened for Booking #${bookingId}`);

    showToast(`Transferred details for ${booking.name || 'customer'} to Bill form.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderBillsHistory() {
    updateBillsKpis();

    const tbody = document.getElementById('billsHistoryTableBody');
    const emptyState = document.getElementById('noBillsHistoryState');
    const countLabel = document.getElementById('billsHistoryCountLabel');
    if (!tbody) return;

    // Filter
    const filtered = allBills.filter(b => {
      if (billHistoryDate && b.date && !b.date.startsWith(billHistoryDate)) {
        return false;
      }

      if (billHistorySearch) {
        const q = billHistorySearch;
        const bNo = (b.billNumber || b.invoiceNumber || '').toLowerCase();
        const cName = (b.customerName || '').toLowerCase();
        const phone = (b.phone || '').toLowerCase();
        const addr = (b.address || '').toLowerCase();
        if (!bNo.includes(q) && !cName.includes(q) && !phone.includes(q) && !addr.includes(q)) {
          return false;
        }
      }

      return true;
    });

    if (countLabel) {
      countLabel.textContent = `Showing ${filtered.length} of ${allBills.length} recorded bills`;
    }

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      emptyState?.classList.remove('hidden');
      return;
    }

    emptyState?.classList.add('hidden');
    tbody.innerHTML = '';

    filtered.forEach(bill => {
      const tr = document.createElement('tr');
      const bNum = bill.billNumber || bill.invoiceNumber || '—';
      const itemsCount = Array.isArray(bill.items) ? bill.items.length : 0;
      const total = Number(bill.totalAmount || bill.grandTotal) || 0;

      tr.innerHTML = `
        <td style="white-space: nowrap; font-weight: 600;">${formatDateHuman(bill.date)}</td>
        <td style="font-weight: 800; color: #0b3d78;">${escapeHtml(bNum)}</td>
        <td>
          <div style="font-weight: 700; color: #0f172a;">${escapeHtml(bill.customerName || '—')}</div>
          <div style="font-size: 11px; color: #1e40af;">📞 ${escapeHtml(bill.phone || '—')}</div>
        </td>
        <td style="max-width: 200px; font-size: 12px; color: #475569;">${escapeHtml(bill.address || '—')}</td>
        <td style="text-align: center; font-weight: 600;">${itemsCount}</td>
        <td style="font-size: 15px; font-weight: 800; color: #0b3d78;">${formatCurrency(total)}</td>
        <td style="text-align: right; white-space: nowrap;">
          <button type="button" class="btn-table-action btn-view-bill" data-num="${bNum}" style="background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;padding:5px 9px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;margin-right:4px;">👁️ View</button>
          <button type="button" class="btn-table-action btn-whatsapp-bill" data-num="${bNum}" style="background:#dcfce7;color:#15803d;border:1px solid #86efac;padding:5px 9px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;margin-right:4px;" title="Share Bill on WhatsApp">💬 WhatsApp</button>
          <button type="button" class="btn-table-action btn-pdf-bill" data-num="${bNum}" style="background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;padding:5px 9px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;margin-right:4px;">📄 PDF</button>
          <button type="button" class="btn-table-action btn-print-bill" data-num="${bNum}" style="background:#f8fafc;color:#334155;border:1px solid #e2e8f0;padding:5px 9px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;">🖨️ Print</button>
        </td>
      `;

      tr.querySelector('.btn-view-bill')?.addEventListener('click', () => loadBillIntoEditor(bill));
      tr.querySelector('.btn-whatsapp-bill')?.addEventListener('click', () => shareBillOnWhatsapp(bill));
      tr.querySelector('.btn-pdf-bill')?.addEventListener('click', () => downloadBillPdf(bill));
      tr.querySelector('.btn-print-bill')?.addEventListener('click', () => printBill(bill));

      tbody.appendChild(tr);
    });
  }

  async function deleteBill(billId) {
    try {
      const res = await apiFetch(`/api/admin/bills/${encodeURIComponent(billId)}`, {
        method: 'DELETE'
      });
      if (res.status === 'success') {
        allBills = allBills.filter(b => (b.billNumber !== billId && b.invoiceNumber !== billId));
        updateBillsKpis();
        renderBillsHistory();
        showToast(`Bill #${billId} deleted.`);
      } else {
        throw new Error(res.error || 'Failed to delete');
      }
    } catch (err) {
      console.error('Delete bill error:', err);
      showToast('Error deleting bill: ' + err.message, true);
    }
  }

  // ==================== DOM READY INITIALIZATION ====================
  document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initNavigation();
    initBookingFilters();
    initScreenshotModal();
    initAddBookingModal();
    initBills();
    initExpenseFilters();
    initAddExpenseModal();
    initLightbox();
  });

})();