/* =========================================================
   ELITE TRACK HOLIDAYS — CUSTOMISE PACKAGE MODULE
   File: js/customise-package.js
   Handles: Customise form popup, WhatsApp submission,
            nights auto-calc, past-date validation, success state.
   ========================================================= */

(function () {
    'use strict';

    /* ---------- CONFIG ---------- */
    const WHATSAPP_NUMBER = '917560952693'; // Country code + number, no + or spaces
    const AUTO_CLOSE_DELAY = 3500;          // ms — modal closes after success

    /* ---------- DOM READY ---------- */
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        const form = document.getElementById('customiseForm');
        const modalEl = document.getElementById('customiseModal');
        const successBox = document.getElementById('cfSuccess');

        if (!form || !modalEl) return; // Section not on this page — exit silently

        const travelDateInput = form.querySelector('[name="travel_date"]');

        /* -------- SET MIN DATE = TODAY (blocks past dates in picker) -------- */
        if (travelDateInput) {
            setMinDateToday(travelDateInput);
        }

        /* -------- FORM SUBMIT -------- */
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            /* -------- EXTRA GUARD: past date check -------- */
            if (travelDateInput && isPastDate(travelDateInput.value)) {
                showDateError(travelDateInput, 'Please select a travel date from today onwards.');
                return;
            }

            const data = collectFormData(form);
            const message = buildWhatsAppMessage(data);

            openWhatsApp(WHATSAPP_NUMBER, message);

            showSuccess(successBox, form, modalEl, AUTO_CLOSE_DELAY);
        });

        /* -------- LIVE VALIDATION: clear error when user picks a valid date -------- */
        if (travelDateInput) {
            travelDateInput.addEventListener('change', function () {
                if (!isPastDate(this.value)) {
                    clearDateError(this);
                }
            });
        }

        /* -------- AUTO-CALC NIGHTS FROM DAYS -------- */
        const daysInput = form.querySelector('[name="days"]');
        const nightsInput = form.querySelector('[name="nights"]');

        if (daysInput && nightsInput) {
            daysInput.addEventListener('input', function () {
                const d = parseInt(this.value, 10);
                if (!isNaN(d) && d > 0) {
                    nightsInput.value = Math.max(d - 1, 0);
                }
            });
        }

        /* -------- RESET SUCCESS STATE & REFRESH MIN DATE ON REOPEN -------- */
        modalEl.addEventListener('show.bs.modal', function () {
            if (successBox) successBox.style.display = 'none';
            if (travelDateInput) {
                setMinDateToday(travelDateInput);
                clearDateError(travelDateInput);
            }
        });
    }

    /* =========================================================
       DATE VALIDATION HELPERS
       ========================================================= */
    function setMinDateToday(input) {
        input.setAttribute('min', getTodayISO());
    }

    function getTodayISO() {
        const t = new Date();
        const y = t.getFullYear();
        const m = String(t.getMonth() + 1).padStart(2, '0');
        const d = String(t.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function isPastDate(value) {
        if (!value) return false; // empty handled by required attribute
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const picked = new Date(value + 'T00:00:00');
        return picked < today;
    }

    function showDateError(input, msg) {
        input.classList.add('cf-input-error');
        input.setCustomValidity(msg);
        input.reportValidity();
        // Clear validity after reporting so it doesn't block future submits
        // when user fixes the date; change handler will also clear it.
        setTimeout(function () { input.setCustomValidity(''); }, 0);
    }

    function clearDateError(input) {
        input.classList.remove('cf-input-error');
        input.setCustomValidity('');
    }

    /* =========================================================
       COLLECT FORM DATA
       ========================================================= */
    function collectFormData(form) {
        const formData = new FormData(form);
        const data = {};

        // Multi-value fields
        data.meals = formData.getAll('meals');
        data.addons = formData.getAll('addons');

        // Single-value fields
        for (const [key, value] of formData.entries()) {
            if (key !== 'meals' && key !== 'addons') {
                data[key] = value;
            }
        }

        return data;
    }

    /* =========================================================
       BUILD WHATSAPP MESSAGE
       ========================================================= */
    function buildWhatsAppMessage(d) {
        const line = '━━━━━━━━━━━━━━━━━━━━';

        const mealsList = (d.meals && d.meals.length)
            ? d.meals.join(', ')
            : 'Not specified';

        const addonsList = (d.addons && d.addons.length)
            ? d.addons.join(', ')
            : 'None';

        let travelDate = d.travel_date || 'Not specified';
        if (d.travel_date) {
            const dt = new Date(d.travel_date + 'T00:00:00');
            if (!isNaN(dt)) {
                travelDate = dt.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });
            }
        }

        return [
            '🌟 *NEW CUSTOM PACKAGE REQUEST* 🌟',
            line,
            '',
            '👤 *Customer Details*',
            `• Name  : ${d.name || '-'}`,
            `• Phone : ${d.phone || '-'}`,
            `• Email : ${d.email || '-'}`,
            '',
            line,
            '🧳 *Trip Details*',
            `• Package Type : ${d.package_type || '-'}`,
            `• Destination  : ${d.destination || '-'}`,
            `• Travel Date  : ${travelDate}`,
            `• Duration     : ${d.days || '-'} Days / ${d.nights || '-'} Nights`,
            '',
            line,
            '👥 *Travellers*',
            `• Adults   : ${d.adults || 0}`,
            `• Children : ${d.children || 0}`,
            `• Infants  : ${d.infants || 0}`,
            '',
            line,
            '🚗 *Transport*',
            `• Pickup City : ${d.pickup_city || '-'}`,
            `• Drop City   : ${d.drop_city || '-'}`,
            `• Cab Type    : ${d.cab_type || 'Not specified'}`,
            `• AC          : ${d.ac_type || '-'}`,
            '',
            line,
            '🏨 *Stay & Meals*',
            `• Stay Type : ${d.stay_type || 'Not specified'}`,
            `• Rooms     : ${d.rooms || '-'}`,
            `• Meals     : ${mealsList}`,
            '',
            line,
            '🎁 *Add-ons & Experiences*',
            `• ${addonsList}`,
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
    function showSuccess(successBox, form, modalEl, delay) {
        if (successBox) successBox.style.display = 'block';

        form.reset();

        setTimeout(function () {
            if (successBox) successBox.style.display = 'none';

            if (window.bootstrap && bootstrap.Modal) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }
        }, delay);
    }

})();