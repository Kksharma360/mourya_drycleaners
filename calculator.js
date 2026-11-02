// Laundry & Dry Cleaning Interactive Cost & Savings Calculator
// Zero-dependency pure vanilla JavaScript
(function initCostCalculator() {
  const items = [
    { id: 'wash_fold', name: 'Wash & Fold Laundry', unit: 'kg', icon: '🧺', rateText: '₹55/kg (7+kg) | ₹65/kg (<7kg)', getRate: (qty) => qty >= 7 ? 55 : 65, defaultQty: 0, step: 1, min: 0, franchiseAvgRate: 85 },
    { id: 'wash_iron', name: 'Wash & Steam Iron', unit: 'kg', icon: '👔', rateText: '₹75/kg (7+kg) | ₹85/kg (<7kg)', getRate: (qty) => qty >= 7 ? 75 : 85, defaultQty: 0, step: 1, min: 0, franchiseAvgRate: 110 },
    { id: 'shirt', name: 'Shirt / T-Shirt / Kurta', unit: 'pc', icon: '👕', rateText: '₹80/pc', getRate: () => 80, defaultQty: 0, step: 1, min: 0, franchiseAvgRate: 130 },
    { id: 'trouser', name: 'Trouser / Pant / Jeans', unit: 'pc', icon: '👖', rateText: '₹80/pc', getRate: () => 80, defaultQty: 0, step: 1, min: 0, franchiseAvgRate: 130 },
    { id: 'suit_2pc', name: '2-Piece Suit (Coat + Pant)', unit: 'set', icon: '🕴️', rateText: '₹230/set', getRate: () => 230, defaultQty: 0, step: 1, min: 0, franchiseAvgRate: 380 },
    { id: 'suit_3pc', name: '3-Piece Suit (With Vest)', unit: 'set', icon: '🤵', rateText: '₹320/set', getRate: () => 320, defaultQty: 0, step: 1, min: 0, franchiseAvgRate: 480 },
    { id: 'saree', name: 'Silk / Designer Saree', unit: 'pc', icon: '🥻', rateText: '₹180/pc', getRate: () => 180, defaultQty: 0, step: 1, min: 0, franchiseAvgRate: 280 },
    { id: 'lehenga', name: 'Bridal / Heavy Lehenga', unit: 'pc', icon: '👗', rateText: '₹250/pc', getRate: () => 250, defaultQty: 0, step: 1, min: 0, franchiseAvgRate: 750 },
    { id: 'blanket_single', name: 'Single Bed Blanket / Quilt', unit: 'pc', icon: '🛏️', rateText: '₹230/pc', getRate: () => 230, defaultQty: 0, step: 1, min: 0, franchiseAvgRate: 380 },
    { id: 'blanket_double', name: 'Double Bed Heavy Blanket / Razai', unit: 'pc', icon: '🛌', rateText: '₹280/pc', getRate: () => 280, defaultQty: 0, step: 1, min: 0, franchiseAvgRate: 480 },
    { id: 'curtain', name: 'Curtain Panel', unit: 'panel', icon: '🪟', rateText: '₹140/panel', getRate: () => 140, defaultQty: 0, step: 1, min: 0, franchiseAvgRate: 220 },
    { id: 'sofa', name: 'Sofa Deep Cleaning', unit: 'seat', icon: '🛋️', rateText: '₹230/seat', getRate: () => 230, defaultQty: 0, step: 1, min: 0, franchiseAvgRate: 350 },
    { id: 'carpet', name: 'Carpet Dry Cleaning', unit: 'sq.ft', icon: '🧱', rateText: '₹35/sq.ft', getRate: () => 35, defaultQty: 0, step: 10, min: 0, franchiseAvgRate: 50 },
    { id: 'shoes', name: 'Shoe / Sneaker Laundry', unit: 'pair', icon: '👟', rateText: '₹230/pair', getRate: () => 230, defaultQty: 0, step: 1, min: 0, franchiseAvgRate: 450 },
    { id: 'steam_iron', name: 'Steam Ironing Only', unit: 'pc', icon: '⚡', rateText: '₹30/pc', getRate: () => 30, defaultQty: 0, step: 1, min: 0, franchiseAvgRate: 50 }
  ];

  const state = {};
  items.forEach(it => state[it.id] = 0);

  function calculate() {
    let mouryaTotal = 0;
    let franchiseTotal = 0;
    const selectedList = [];

    items.forEach(it => {
      const q = state[it.id] || 0;
      if (q > 0) {
        const cost = q * it.getRate(q);
        const franCost = q * it.franchiseAvgRate;
        mouryaTotal += cost;
        franchiseTotal += franCost;
        selectedList.push(`${it.name} (${q} ${it.unit}): ₹${cost}`);
      }
    });

    const savings = Math.max(0, franchiseTotal - mouryaTotal);
    const savingsPercent = franchiseTotal > 0 ? Math.round((savings / franchiseTotal) * 100) : 0;

    return { mouryaTotal, franchiseTotal, savings, savingsPercent, selectedList };
  }

  function renderCalculator(containerId, isCompact = false) {
    const root = document.getElementById(containerId);
    if (!root) return;

    let itemsToDisplay = items;
    if (isCompact) {
      // Top 8 high-volume items for compact index view
      itemsToDisplay = items.filter(i => ['wash_fold', 'wash_iron', 'shirt', 'trouser', 'suit_2pc', 'saree', 'blanket_double', 'shoes'].includes(i.id));
    }

    root.innerHTML = `
      <div class="calc-wrapper ${isCompact ? 'calc-compact' : ''}">
        <div class="calc-header">
          <div class="calc-badge">⚡ INSTANT PRICE & SAVINGS ESTIMATOR</div>
          <h3 class="calc-title">${isCompact ? 'Calculate Your Laundry & Dry Cleaning Estimate' : 'Interactive Order Cost & Gurgaon Savings Calculator'}</h3>
          <p class="calc-subtitle">Select your garments & items below. Transparent central workshop rates with <strong>0% hidden GST</strong> and <strong>0% rush fee</strong>.</p>
        </div>

        <div class="calc-grid-layout">
          <div class="calc-items-grid">
            ${itemsToDisplay.map(it => `
              <div class="calc-card" data-item="${it.id}">
                <div class="calc-card-icon">${it.icon}</div>
                <div class="calc-card-info">
                  <div class="calc-card-name">${it.name}</div>
                  <div class="calc-card-rate">${it.rateText}</div>
                </div>
                <div class="calc-counter">
                  <button type="button" class="calc-btn btn-dec" data-id="${it.id}" aria-label="Decrease quantity">−</button>
                  <span class="calc-qty" id="qty-${containerId}-${it.id}">0</span>
                  <button type="button" class="calc-btn btn-inc" data-id="${it.id}" aria-label="Increase quantity">+</button>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="calc-summary-panel">
            <div class="calc-summary-card">
              <h4>Estimated Order Summary</h4>
              
              <div class="summary-row">
                <span>Mourya Direct Workshop Rate:</span>
                <span class="summary-val mourya-val" id="total-${containerId}">₹0</span>
              </div>
              <div class="summary-row">
                <span>Gurgaon Franchise Chain Avg:</span>
                <span class="summary-val franchise-val" id="fran-${containerId}">₹0</span>
              </div>
              
              <div class="savings-banner" id="savings-box-${containerId}">
                <span>🎉 You Save With Mourya:</span>
                <strong id="save-${containerId}">₹0 (0% Off)</strong>
              </div>

              <!-- Pickup Progress -->
              <div class="pickup-progress-box">
                <div class="progress-label" id="prog-label-${containerId}">Add ₹350 more for 100% FREE Doorstep Pickup & 24h Express Delivery</div>
                <div class="progress-track">
                  <div class="progress-fill" id="prog-fill-${containerId}" style="width: 0%"></div>
                </div>
              </div>

              <div class="calc-actions">
                <a href="#" target="_blank" class="calc-btn-wa" id="wa-btn-${containerId}">
                  💬 Book This Exact Estimate on WhatsApp
                </a>
                <button type="button" class="calc-btn-reset" id="reset-btn-${containerId}">Reset Calculator</button>
              </div>

              <div class="calc-guarantee-note">
                🔒 <strong>Mourya Guarantee:</strong> 100% Separate Drum Load • RO Soft Water Wash • Odorless Hydrocarbon Solvents • Free Doorstep Pickup Across 115 Gurgaon Sectors.
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind event listeners
    root.querySelectorAll('.btn-inc').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const itemObj = items.find(i => i.id === id);
        state[id] = (state[id] || 0) + itemObj.step;
        updateUI();
      });
    });

    root.querySelectorAll('.btn-dec').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const itemObj = items.find(i => i.id === id);
        state[id] = Math.max(0, (state[id] || 0) - itemObj.step);
        updateUI();
      });
    });

    const resetBtn = document.getElementById(`reset-btn-${containerId}`);
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        items.forEach(it => state[it.id] = 0);
        updateUI();
      });
    }

    function updateUI() {
      // Update quantities
      items.forEach(it => {
        const qtyEl = document.getElementById(`qty-${containerId}-${it.id}`);
        if (qtyEl) {
          qtyEl.innerText = state[it.id] + (it.unit === 'kg' ? ' kg' : it.unit === 'sq.ft' ? ' sqft' : '');
          const card = qtyEl.closest('.calc-card');
          if (card) {
            if (state[it.id] > 0) card.classList.add('active');
            else card.classList.remove('active');
          }
        }
      });

      const { mouryaTotal, franchiseTotal, savings, savingsPercent, selectedList } = calculate();

      const totalEl = document.getElementById(`total-${containerId}`);
      const franEl = document.getElementById(`fran-${containerId}`);
      const saveEl = document.getElementById(`save-${containerId}`);
      const progLabel = document.getElementById(`prog-label-${containerId}`);
      const progFill = document.getElementById(`prog-fill-${containerId}`);
      const waBtn = document.getElementById(`wa-btn-${containerId}`);

      if (totalEl) totalEl.innerText = `₹${mouryaTotal.toLocaleString('en-IN')}`;
      if (franEl) franEl.innerText = `₹${franchiseTotal.toLocaleString('en-IN')}`;
      if (saveEl) saveEl.innerText = `₹${savings.toLocaleString('en-IN')} (~${savingsPercent}% Off!)`;

      if (progLabel && progFill) {
        if (mouryaTotal === 0) {
          progLabel.innerText = 'Add items worth ₹350 for 100% FREE Doorstep Pickup & Delivery';
          progFill.style.width = '0%';
          progFill.classList.remove('unlocked');
        } else if (mouryaTotal < 350) {
          const diff = 350 - mouryaTotal;
          progLabel.innerText = `Add ₹${diff} more for 100% FREE Doorstep Pickup & 24h Delivery`;
          progFill.style.width = `${Math.min(100, Math.round((mouryaTotal / 350) * 100))}%`;
          progFill.classList.remove('unlocked');
        } else {
          progLabel.innerHTML = '✓ <strong>Unlocked:</strong> 100% FREE Doorstep Pickup & 24-Hour Express Delivery!';
          progFill.style.width = '100%';
          progFill.classList.add('unlocked');
        }
      }

      if (waBtn) {
        let msg = `Hi Mourya Dry Cleaners, I calculated an estimate on your website calculator:\n\n`;
        if (selectedList.length > 0) {
          msg += `📦 Selected Items:\n• ` + selectedList.join('\n• ') + `\n\n`;
        }
        msg += `💰 Mourya Total: ₹${mouryaTotal}\n`;
        msg += `🎉 Savings vs Franchise: ₹${savings}\n`;
        msg += `🚚 Doorstep Delivery: ${mouryaTotal >= 350 ? 'FREE Doorstep Pickup & Drop' : 'Standard Pickup'}\n\n`;
        msg += `Please confirm my pickup slot!`;

        waBtn.href = `https://wa.me/919217410047?text=${encodeURIComponent(msg)}`;
      }
    }

    updateUI();
  }

  // Mount calculators if present on page
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      renderCalculator('pricing-cost-calculator', false);
      renderCalculator('home-cost-calculator', true);
    });
  } else {
    renderCalculator('pricing-cost-calculator', false);
    renderCalculator('home-cost-calculator', true);
  }
})();

