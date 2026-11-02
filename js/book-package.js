/* =========================================================
   ELITE TRACK HOLIDAYS — BOOK PACKAGE MODULE
   File: js/book-package.js
   Handles: Book Now popup prefill, WhatsApp submission,
            success state, auto-close modal.
   ========================================================= */

(function () {
    'use strict';

    /* ---------- CONFIG ---------- */
    const WHATSAPP_NUMBER   = '917560952693'; // Country code + number, no + or spaces
    const AUTO_CLOSE_DELAY  = 3500;           // ms — modal closes after success

    /* ---------- DOM READY ---------- */
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        const form       = document.getElementById('bookPackageForm');
        const modalEl    = document.getElementById('bookPackageModal');
        const successBox = document.getElementById('bpSuccess');

        if (!form || !modalEl) return; // Section not on this page — exit silently

        const nameInput  = document.getElementById('bpPackageName');
        const priceInput = document.getElementById('bpPackagePrice');

        /* -------- PREFILL PACKAGE NAME & PRICE ON BOOK NOW CLICK -------- */
        document.querySelectorAll('.book-now-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (nameInput)  nameInput.value  = btn.dataset.package || '';
                if (priceInput) priceInput.value = btn.dataset.price   || '';
                if (successBox) successBox.style.display = 'none';
            });
        });

        /* -------- FORM SUBMIT -------- */
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const data    = collectFormData(form);
            const message = buildWhatsAppMessage(data);

            openWhatsApp(WHATSAPP_NUMBER, message);

            showSuccess(successBox, form, modalEl, AUTO_CLOSE_DELAY, nameInput, priceInput);
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

        let travelDate = d.travel_date || 'Not specified';
        if (d.travel_date) {
            const dt = new Date(d.travel_date);
            if (!isNaN(dt)) {
                travelDate = dt.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });
            }
        }

        return [
            '🌟 *NEW PACKAGE BOOKING REQUEST* 🌟',
            line,
            '',
            '📦 *Selected Package*',
            `• Package : ${d.package_name  || '-'}`,
            `• Price   : ${d.package_price || '-'}`,
            '',
            line,
            '🧳 *Trip Details*',
            `• Destination : ${d.destination || '-'}`,
            `• Travel Date : ${travelDate}`,
            `• Pickup City : ${d.pickup_city || '-'}`,
            '',
            line,
            '👥 *Travellers*',
            `• Adults   : ${d.adults   || 0}`,
            `• Children : ${d.children || 0}`,
            `• Infants  : ${d.infants  || 0}`,
            '',
            line,
            '👤 *Customer Details*',
            `• Name  : ${d.name  || '-'}`,
            `• Phone : ${d.phone || '-'}`,
            `• Email : ${d.email || '-'}`,
            '',
            line,
            '📝 *Special Requests*',
            d.notes ? d.notes : 'None',
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
    function showSuccess(successBox, form, modalEl, delay, nameInput, priceInput) {
        if (successBox) successBox.style.display = 'block';

        form.reset();

        setTimeout(function () {
            if (successBox) successBox.style.display = 'none';

            if (nameInput)  nameInput.value  = '';
            if (priceInput) priceInput.value = '';

            if (window.bootstrap && bootstrap.Modal) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }
        }, delay);
    }

})();