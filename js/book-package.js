/* =========================================================
   BOOK PACKAGE MODAL — prefill + WhatsApp handoff
   ========================================================= */
(function () {
    'use strict';

    // ---- CONFIG (same as your customise-package.js) ----
    const WHATSAPP_NUMBER = '917560952693'; // Country code + number, no + or spaces

    const modalEl = document.getElementById('bookPackageModal');
    const form    = document.getElementById('bookPackageForm');
    if (!modalEl || !form) return;

    const nameInput   = document.getElementById('bpPackageName');
    const priceInput  = document.getElementById('bpPackagePrice');
    const successBox  = document.getElementById('bpSuccess');

    // ---- 1. Prefill package name & price when a Book Now is clicked ----
    document.querySelectorAll('.book-now-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            nameInput.value  = btn.dataset.package || '';
            priceInput.value = btn.dataset.price   || '';
            successBox.style.display = 'none';
        });
    });

    // ---- 2. Handle submit ----
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Validate required fields
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const data = Object.fromEntries(new FormData(form).entries());

        // ---- Build WhatsApp message ----
        const lines = [
            '*New Package Booking Request*',
            '------------------------------',
            '*Package Name:* ' + (data.package_name  || '-'),
            '*Price:* '        + (data.package_price || '-'),
            '',
            '*Destination:* '  + (data.destination   || '-'),
            '*Travel Date:* '  + (data.travel_date   || '-'),
            '*Travellers:* Adults ' + (data.adults || 0) +
                ', Children ' + (data.children || 0) +
                ', Infants '  + (data.infants  || 0),
            '*Pickup City:* '  + (data.pickup_city   || '-'),
            '',
            '*Name:* '         + (data.name          || '-'),
            '*Phone:* '        + (data.phone         || '-'),
            '*Email:* '        + (data.email         || '-'),
            '*Special Request:* ' + (data.notes || 'None')
        ];

        const message = lines.join('\n');
        const url = 'https://wa.me/' + WHATSAPP_NUMBER +
                    '?text=' + encodeURIComponent(message);

        // Show success, open WhatsApp
        successBox.style.display = 'block';
        window.open(url, '_blank');

        // Optional: reset after a short delay / on modal hide
        setTimeout(function () {
            form.reset();
            nameInput.value  = '';
            priceInput.value = '';
            successBox.style.display = 'none';
        }, 8000);
    });
})();