/* ============================================================
   FINANCING.JS — Lupin Motors
   Interactive loan calculator + financing application form
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     DOM REFERENCES
     ============================================================ */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ============================================================
     LOAN CALCULATOR
     ============================================================ */
  const calc = {
    vehiclePrice:   ksh('#calcVehiclePrice'),
    rangeVehicle:   ksh('#rangeVehiclePrice'),
    downPayment:    ksh('#calcDownPayment'),
    rangeDown:      ksh('#rangeDownPayment'),
    tradeIn:        ksh('#calcTradeIn'),
    rangeTrade:     ksh('#rangeTradeIn'),
    interestRate:   ksh('#calcInterestRate'),
    rangeInterest:  $('#rangeInterestRate'),
    loanTerm:       $('#calcLoanTerm'),
    creditOptions:  $('#creditScoreOptions'),
    downBadge:      $('#downPercentBadge'),
    monthlyDisplay: $('#calcMonthlyPayment'),
    paymentsDisplay:$('#calcTotalPayments'),
    resVehicle:     $('#resVehiclePrice'),
    resDown:        $('#resDownPayment'),
    resTrade:       $('#resTradeIn'),
    resFinanced:    $('#resAmountFinanced'),
    resInterest:    $('#resTotalInterest'),
    resTotal:       $('#resTotalCost'),
    applyBtn:       $('#applyFromCalc'),
  };

  const fmt = (n) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0
  }).format(n);

  function getValues() {
    return {
      price:    parseFloat(calc.vehiclePrice.value)    || 0,
      down:     parseFloat(calc.downPayment.value)     || 0,
      trade:    parseFloat(calc.tradeIn.value)         || 0,
      rate:     parseFloat(calc.interestRate.value)    || 0,
      months:   parseInt(calc.loanTerm.value, 10)      || 60,
    };
  }

  function compute() {
    const { price, down, trade, rate, months } = getValues();

    const financed = Math.max(0, price - down - trade);
    const r = rate / 100 / 12;
    let monthly = 0;
    let totalInterest = 0;

    if (financed > 0 && rate > 0) {
      monthly = (financed * r) / (1 - Math.pow(1 + r, -months));
      totalInterest = monthly * months - financed;
    } else if (financed > 0) {
      monthly = financed / months;
    }

    const totalCost = financed + totalInterest;
    const downPct = price > 0 ? ((down / price) * 100).toFixed(0) : 0;

    // Update displays
    calc.monthlyDisplay.textContent = fmt(monthly);
    calc.paymentsDisplay.textContent = `${months} payments`;
    calc.downBadge.textContent = `${downPct}%`;

    calc.resVehicle.textContent = fmt(price);
    calc.resDown.textContent   = `-${fmt(down)}`;
    calc.resTrade.textContent  = trade > 0 ? `-${fmt(trade)}` : fmt(trade);
    calc.resFinanced.textContent = fmt(financed);
    calc.resInterest.textContent = fmt(totalInterest);
    calc.resTotal.textContent    = fmt(totalCost);

    return { monthly, financed, months, rate };
  }

  // Two-way binding: number input ↔ range slider
  function bindPair(numInput, rangeInput) {
    numInput.addEventListener('input', () => {
      rangeInput.value = numInput.value;
      compute();
    });
    rangeInput.addEventListener('input', () => {
      numInput.value = rangeInput.value;
      compute();
    });
  }

  function initCalculator() {
    if (!calc.vehiclePrice) return;

    bindPair(calc.vehiclePrice,   calc.rangeVehicle);
    bindPair(calc.downPayment,    calc.rangeDown);
    bindPair(calc.tradeIn,        calc.rangeTrade);
    bindPair(calc.interestRate,   calc.rangeInterest);

    calc.loanTerm.addEventListener('change', compute);

    // Credit score buttons
    if (calc.creditOptions) {
      $$('.credit-btn', calc.creditOptions).forEach(btn => {
        btn.addEventListener('click', () => {
          $$('.credit-btn', calc.creditOptions).forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const rate = btn.dataset.rate;
          calc.interestRate.value = rate;
          calc.rangeInterest.value = rate;
          compute();
        });
      });
    }

    // "Apply for This Loan" scrolls to form and pre-fills
    if (calc.applyBtn) {
      calc.applyBtn.addEventListener('click', () => {
        const { price, down, trade, months } = getValues();
        const form = $('#financeForm');
        if (!form) return;

        // Pre-fill form
        const priceInput = $('#appEstimatedPrice');
        const downInput  = $('#appDownPayment');
        const termInput  = $('#appPreferredTerm');
        const tradeInput = $('#appTradeInValue');

        if (priceInput) priceInput.value = price;
        if (downInput)  downInput.value  = down;
        if (tradeInput) tradeInput.value = trade;
        if (termInput)  termInput.value  = months;

        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        showToast('Loan details pre-filled. Complete the form below.', 'success');
      });
    }

    compute();
  }

  /* ============================================================
     FINANCING APPLICATION FORM
     ============================================================ */
  function initApplicationForm() {
    const form = $('#financeForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const btn = $('#submitApplication');
      const originalText = btn.innerHTML;

      // Basic validation
      const required = $$('[required]', form);
      let valid = true;
      required.forEach(field => {
        if (!field.value.trim()) {
          valid = false;
          field.classList.add('is-invalid');
        } else {
          field.classList.remove('is-invalid');
        }
      });

      if (!valid) {
        showToast('Please fill in all required fields.', 'error');
        return;
      }

      // Simulate submission
      btn.disabled = true;
      btn.innerHTML = `<i data-lucide="loader-2" width="18" height="18" class="spin"></i> Submitting…`;
      if (window.lucide) lucide.createIcons();

      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = originalText;
        if (window.lucide) lucide.createIcons();

        showToast('Application submitted successfully! Our finance team will contact you within one business hour.', 'success');
        form.reset();
      }, 2000);
    });

    // Real-time validation cleanup
    $$('.form-control', form).forEach(field => {
      field.addEventListener('input', () => {
        if (field.value.trim()) field.classList.remove('is-invalid');
      });
    });
  }

  /* ============================================================
     FAQ ACCORDION — only one open at a time
     ============================================================ */
  function initFAQ() {
    const items = $$('.faq-item');
    items.forEach(item => {
      item.addEventListener('toggle', () => {
        if (item.open) {
          items.forEach(other => {
            if (other !== item && other.open) other.open = false;
          });
        }
      });
    });
  }

  /* ============================================================
     TOAST HELPER (fallback if main.js not loaded)
     ============================================================ */
  function showToast(message, type = 'info') {
    if (window.showToast) {
      window.showToast(message, type);
      return;
    }

    const container = $('#toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    initCalculator();
    initApplicationForm();
    initFAQ();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();