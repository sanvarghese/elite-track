/* =========================================================
   ELITE TRACK HOLIDAYS — BOOK STAY MODULE
   File: js/book-stay.js
   Handles: Book Now popup prefill, WhatsApp submission,
            check-in/out validation, success state, auto-close.
   ========================================================= */

(function () {
    'use strict';

    /* ---------- CONFIG ---------- */
    const WHATSAPP_NUMBER  = '917560952000'; // Same as packages
    const AUTO_CLOSE_DELAY = 3500;           // ms — modal closes after success

    /* ---------- DOM READY ---------- */
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        const form       = document.getElementById('bookStayForm');
        const modalEl    = document.getElementById('bookStayModal');
        const successBox = document.getElementById('bsSuccess');

        if (!form || !modalEl) return; // Section not on this page — exit silently

        const stayInput  = document.getElementById('bsStayName');
        const priceInput = document.getElementById('bsStayPrice');

        /* -------- PREFILL STAY NAME & PRICE ON BOOK NOW CLICK -------- */
        document.querySelectorAll('.book-stay-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (stayInput)  stayInput.value  = btn.dataset.stay  || '';
                if (priceInput) priceInput.value = btn.dataset.price || '';
                if (successBox) successBox.style.display = 'none';
            });
        });

        /* -------- CHECK-IN / CHECK-OUT VALIDATION -------- */
        const checkinInput  = form.querySelector('[name="checkin_date"]');
        const checkoutInput = form.querySelector('[name="checkout_date"]');

        if (checkinInput && checkoutInput) {
            // Block past dates
            const today = new Date().toISOString().split('T')[0];
            checkinInput.min  = today;
            checkoutInput.min = today;

            checkinInput.addEventListener('change', function () {
                if (this.value) {
                    // Check-out must be after check-in
                    const next = new Date(this.value);
                    next.setDate(next.getDate() + 1);
                    checkoutInput.min = next.toISOString().split('T')[0];

                    if (checkoutInput.value && checkoutInput.value <= this.value) {
                        checkoutInput.value = checkoutInput.min;
                    }
                }
            });
        }

        /* -------- FORM SUBMIT -------- */
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const data = collectFormData(form);

            // Extra guard: check-out after check-in
            if (data.checkout_date && data.checkin_date &&
                data.checkout_date <= data.checkin_date) {
                alert('Check-Out date must be after Check-In date.');
                return;
            }

            const message = buildWhatsAppMessage(data);

            openWhatsApp(WHATSAPP_NUMBER, message);

            showSuccess(successBox, form, modalEl, AUTO_CLOSE_DELAY, stayInput, priceInput);
        });

        /* -------- RESET SUCCESS STATE ON REOPEN -------- */
        modalEl.addEventListener('show.bs.modal', function () {
            if (successBox) successBox.style.display = 'none';
        });
    }

    /* =========================================================
       COLLECT FORM DATA
       ========================================================= */
    function collectFormData(form) {
        const formData = new FormData(form);
        const data = {};
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        return data;
    }

    /* =========================================================
       BUILD WHATSAPP MESSAGE
       ========================================================= */
    function buildWhatsAppMessage(d) {
        const line = '━━━━━━━━━━━━━━━━━━━━';

        const fmt = function (s) {
            if (!s) return 'Not specified';
            const dt = new Date(s);
            if (isNaN(dt)) return s;
            return dt.toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
        };

        // Calculate nights if both dates present
        let nights = '';
        if (d.checkin_date && d.checkout_date) {
            const ci = new Date(d.checkin_date);
            const co = new Date(d.checkout_date);
            const diff = Math.round((co - ci) / (1000 * 60 * 60 * 24));
            if (diff > 0) nights = ` (${diff} Night${diff > 1 ? 's' : ''})`;
        }

        return [
            '🌟 *NEW STAY BOOKING REQUEST* 🌟',
            line,
            '',
            '🏨 *Selected Stay*',
            `• Room / Stay : ${d.stay_name  || '-'}`,
            `• Price       : ${d.stay_price || '-'}`,
            '',
            line,
            '📅 *Stay Dates*',
            `• Check-In  : ${fmt(d.checkin_date)}`,
            `• Check-Out : ${fmt(d.checkout_date)}${nights}`,
            '',
            line,
            '👥 *Guests*',
            `• People : ${d.people || 0}`,
            `• Rooms  : ${d.rooms  || 1}`,
            '',
            line,
            '👤 *Customer Details*',
            `• Name  : ${d.name  || '-'}`,
            `• Phone : ${d.phone || '-'}`,
            '',
            line,
            '_Sent via Elite Track Holidays website_'
        ].join('\n');
    }

    /* =========================================================
       OPEN WHATSAPP
       ========================================================= */
    function openWhatsApp(number, message) {
        const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    }

    /* =========================================================
       SHOW SUCCESS + AUTO-CLOSE MODAL
       ========================================================= */
    function showSuccess(successBox, form, modalEl, delay, stayInput, priceInput) {
        if (successBox) successBox.style.display = 'block';

        form.reset();

        setTimeout(function () {
            if (successBox) successBox.style.display = 'none';

            if (stayInput)  stayInput.value  = '';
            if (priceInput) priceInput.value = '';

            if (window.bootstrap && bootstrap.Modal) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }
        }, delay);
    }

})();