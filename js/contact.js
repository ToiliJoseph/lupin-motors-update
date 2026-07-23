
/* ============================================================
   CONTACT.JS — Lupin Motors
   Contact form handler
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     CONTACT FORM
     ============================================================ */
  function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const btn = document.getElementById('submitContact');
      const originalText = btn.innerHTML;

      // Validation
      const required = form.querySelectorAll('[required]');
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
      btn.innerHTML = `<i data-lucide="loader-2" width="18" height="18" class="spin"></i> Sending…`;
      if (window.lucide) lucide.createIcons();

      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = originalText;
        if (window.lucide) lucide.createIcons();

        showToast('Message sent successfully! We will respond within 24 hours.', 'success');
        form.reset();
      }, 2000);
    });

    // Real-time cleanup
    form.querySelectorAll('.form-control').forEach(field => {
      field.addEventListener('input', () => {
        if (field.value.trim()) field.classList.remove('is-invalid');
      });
    });
  }

  /* ============================================================
     TOAST HELPER
     ============================================================ */
  function showToast(message, type = 'info') {
    if (window.showToast) {
      window.showToast(message, type);
      return;
    }

    const container = document.getElementById('toastContainer');
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
    initContactForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
