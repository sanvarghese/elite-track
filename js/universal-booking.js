/* =========================================================
   ELITE TRACK HOLIDAYS — UNIVERSAL BOOKING MODULE
   File: js/universal-booking.js
   Handles: Book-Your-Trip / Book-Now triggers, type switch
            (package / stay / cab), per-type validation,
            past-date guards, WhatsApp submission, success state,
            auto-close.
   ========================================================= */

(function () {
    'use strict';

    /* ---------- CONFIG ---------- */
    const WHATSAPP_NUMBER  = '917560952693';
    const AUTO_CLOSE_DELAY = 3500;

    /* ---------- DOM READY ---------- */
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        const form       = document.getElementById('universalBookingForm');
        const modalEl    = document.getElementById('universalBookingModal');
        const successBox = document.getElementById('ubSuccess');

        if (!form || !modalEl) return; // Section not on this page — exit silently

        /* ---- Query inputs by name (more robust than id) ---- */
        const pkgNameInput   = form.querySelector('[name="package_name"]');
        const pkgPriceInput  = form.querySelector('[name="package_price"]');
        const stayNameInput  = form.querySelector('[name="stay_name"]');
        const stayPriceInput = form.querySelector('[name="stay_price"]');

        /* =========================================================
           A. TRIGGERS
           ========================================================= */

        // Hero + header "book your trip" / "book now" → default = Package
        document.querySelectorAll('.book-trip-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                setType('package');
                resetSuccess(successBox);
            });
        });

        // "Book Now" on room cards → Stay with prefilled name & price
        document.querySelectorAll('.book-stay-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                setType('stay');
                const want = btn.dataset.stay || '';
                if (stayNameInput) {
                    const found = Array.from(stayNameInput.options).some(function (o) {
                        return o.value === want;
                    });
                    stayNameInput.value = found ? want : '';
                    if (found) {
                        stayNameInput.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
                resetSuccess(successBox);
            });
        });

        // Optional: if you ever add package "Book Now" buttons on this page
        document.querySelectorAll('.book-package-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                setType('package');
                const want = btn.dataset.package || '';
                if (pkgNameInput) {
                    const found = Array.from(pkgNameInput.options).some(function (o) {
                        return o.value === want;
                    });
                    pkgNameInput.value = found ? want : '';
                    if (found) {
                        pkgNameInput.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
                resetSuccess(successBox);
            });
        });

        /* =========================================================
           B. AUTO-SYNC PRICE FROM SELECT's data-price
           (Delegated on form → order-independent, survives rerenders)
           ========================================================= */
        form.addEventListener('change', function (e) {
            const target = e.target;
            if (!target || target.tagName !== 'SELECT') return;

            // Package select → fill package_price
            if (target.name === 'package_name') {
                const opt = target.options[target.selectedIndex];
                const price = (opt && opt.dataset && opt.dataset.price) ? opt.dataset.price : '';
                if (pkgPriceInput) pkgPriceInput.value = price;
                return;
            }

            // Stay select → fill stay_price
            if (target.name === 'stay_name') {
                const opt = target.options[target.selectedIndex];
                const price = (opt && opt.dataset && opt.dataset.price) ? opt.dataset.price : '';
                if (stayPriceInput) stayPriceInput.value = price;
                return;
            }
        });

        /* =========================================================
           C. TYPE SWITCHER
           ========================================================= */
        form.querySelectorAll('input[name="booking_type"]').forEach(function (radio) {
            radio.addEventListener('change', function () {
                setType(this.value);
                resetSuccess(successBox);
            });
        });

        function setType(type) {
            // Radio chip
            const radio = form.querySelector('input[name="booking_type"][value="' + type + '"]');
            if (radio) radio.checked = true;

            // Show/hide panels
            form.querySelectorAll('.ub-panel').forEach(function (p) {
                p.style.display = (p.dataset.panel === type) ? '' : 'none';
            });

            // Clear all required flags first
            form.querySelectorAll('.ub-panel input, .ub-panel select, .ub-panel textarea')
                .forEach(function (el) {
                    el.required = false;
                });

            // Re-apply required to active panel only
            const active = form.querySelector('.ub-panel[data-panel="' + type + '"]');
            if (active) {
                active.querySelectorAll('input, select, textarea').forEach(function (el) {
                    if (el.dataset.requiredFor === type) {
                        el.required = true;
                    }
                });
            }
        }
        window.__ubSetType = setType;

        /* =========================================================
           D. MARK REQUIRED FIELDS PER TYPE
           ========================================================= */
        markRequired('package', ['package_name', 'pkg_destination', 'pkg_travel_date', 'pkg_adults', 'pkg_pickup']);
        markRequired('stay',    ['stay_name', 'stay_checkin', 'stay_checkout', 'stay_people']);
        markRequired('cab',     ['cab_type', 'cab_travel_date', 'cab_pickup', 'cab_drop', 'cab_adults']);

        function markRequired(type, names) {
            names.forEach(function (n) {
                const el = form.querySelector('[name="' + n + '"]');
                if (el) el.dataset.requiredFor = type;
            });
        }

        /* =========================================================
           E. DATE GUARDS (past-date prevention)
           ========================================================= */
        const pkgDate = form.querySelector('[name="pkg_travel_date"]');
        const cabDate = form.querySelector('[name="cab_travel_date"]');
        const ci      = form.querySelector('[name="stay_checkin"]');
        const co      = form.querySelector('[name="stay_checkout"]');

        // Apply today's min date to all date fields
        setMinDateToday(pkgDate);
        setMinDateToday(cabDate);
        setMinDateToday(ci);
        setMinDateToday(co);

        // Checkout must be at least 1 day after checkin
        if (ci && co) {
            ci.addEventListener('change', function () {
                if (!this.value) return;
                const next = new Date(this.value + 'T00:00:00');
                next.setDate(next.getDate() + 1);
                const minISO = toISO(next);
                co.min = minISO;
                if (co.value && co.value <= this.value) co.value = minISO;
            });

            co.addEventListener('change', function () {
                // Also refresh min on checkin so user can't back-door via it
                setMinDateToday(ci);
            });
        }

        // Live clear of date errors when user picks a valid date
        [pkgDate, cabDate, ci, co].forEach(function (el) {
            if (!el) return;
            el.addEventListener('change', function () {
                if (!isPastDate(this.value)) {
                    clearDateError(this);
                }
            });
        });

        /* =========================================================
           F. SUBMIT
           ========================================================= */
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const type = form.querySelector('input[name="booking_type"]:checked').value;

            /* -------- EXTRA GUARD: past-date check per active type -------- */
            const guard = checkDatesForType(type, { pkgDate, cabDate, ci, co });
            if (!guard.ok) {
                showDateError(guard.el, guard.msg);
                return;
            }

            const data = collectFormData(form);
            const message = buildWhatsAppMessage(type, data);

            openWhatsApp(WHATSAPP_NUMBER, message);
            showSuccess(successBox, form, modalEl, AUTO_CLOSE_DELAY,
                        pkgNameInput, pkgPriceInput, stayNameInput, stayPriceInput);
        });

        /* =========================================================
           G. RESET SUCCESS & REFRESH MIN DATES ON REOPEN
           ========================================================= */
        modalEl.addEventListener('show.bs.modal', function () {
            resetSuccess(successBox);

            // Refresh "today" in case page stayed open past midnight
            setMinDateToday(pkgDate);
            setMinDateToday(cabDate);
            setMinDateToday(ci);
            setMinDateToday(co);

            if (ci) clearDateError(ci);
            if (co) clearDateError(co);
            if (pkgDate) clearDateError(pkgDate);
            if (cabDate) clearDateError(cabDate);
        });

        // Initialise default state
        setType('package');
    }

    /* =========================================================
       DATE VALIDATION HELPERS
       ========================================================= */
    function toISO(dateObj) {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
    }

    function getTodayISO() {
        return toISO(new Date());
    }

    function setMinDateToday(input) {
        if (input) input.setAttribute('min', getTodayISO());
    }

    function isPastDate(value) {
        if (!value) return false; // empty handled by required attribute
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const picked = new Date(value + 'T00:00:00');
        return picked < today;
    }

    function showDateError(input, msg) {
        if (!input) return;
        input.classList.add('cf-input-error');
        input.setCustomValidity(msg);
        input.reportValidity();
        setTimeout(function () { input.setCustomValidity(''); }, 0);
    }

    function clearDateError(input) {
        if (!input) return;
        input.classList.remove('cf-input-error');
        input.setCustomValidity('');
    }

    /* Returns { ok: boolean, el, msg } */
    function checkDatesForType(type, refs) {
        const { pkgDate, cabDate, ci, co } = refs;

        if (type === 'package' && pkgDate && isPastDate(pkgDate.value)) {
            return { ok: false, el: pkgDate, msg: 'Please select a travel date from today onwards.' };
        }

        if (type === 'cab' && cabDate && isPastDate(cabDate.value)) {
            return { ok: false, el: cabDate, msg: 'Please select a travel date from today onwards.' };
        }

        if (type === 'stay') {
            if (ci && isPastDate(ci.value)) {
                return { ok: false, el: ci, msg: 'Please select a check-in date from today onwards.' };
            }
            if (ci && co && ci.value && co.value && co.value <= ci.value) {
                return { ok: false, el: co, msg: 'Check-out date must be after check-in date.' };
            }
            if (co && isPastDate(co.value)) {
                return { ok: false, el: co, msg: 'Please select a check-out date from today onwards.' };
            }
        }

        return { ok: true };
    }

    /* =========================================================
       GENERAL HELPERS
       ========================================================= */

    function resetSuccess(box) {
        if (box) box.style.display = 'none';
    }

    function collectFormData(form) {
        const fd = new FormData(form);
        const data = {};
        for (const [k, v] of fd.entries()) data[k] = v;
        return data;
    }

    function fmtDate(s) {
        if (!s) return 'Not specified';
        const dt = new Date(s + 'T00:00:00');
        if (isNaN(dt)) return s;
        return dt.toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    }

    function nightsBetween(a, b) {
        if (!a || !b) return '';
        const n = Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
        return n > 0 ? ' (' + n + ' Night' + (n > 1 ? 's' : '') + ')' : '';
    }

    function openWhatsApp(number, message) {
        const url = 'https://wa.me/' + number + '?text=' + encodeURIComponent(message);
        window.open(url, '_blank');
    }

    /* =========================================================
       BUILD MESSAGE PER TYPE
       ========================================================= */
    function buildWhatsAppMessage(type, d) {
        const line = '━━━━━━━━━━━━━━━━━━━━';
        const header = '🌟 *NEW BOOKING REQUEST* 🌟';

        let body = [];

        if (type === 'package') {
            body = [
                '📦 *Selected Package*',
                '• Package : ' + (d.package_name  || 'Not pre-selected'),
                '• Price   : ' + (d.package_price || 'Ask for quote'),
                '',
                line,
                '🧳 *Trip Details*',
                '• Destination : ' + (d.pkg_destination || '-'),
                '• Travel Date : ' + fmtDate(d.pkg_travel_date),
                '• Pickup City : ' + (d.pkg_pickup || '-'),
                '',
                line,
                '👥 *Travellers*',
                '• Adults   : ' + (d.pkg_adults   || 0),
                '• Children : ' + (d.pkg_children || 0),
                '• Infants  : ' + (d.pkg_infants  || 0)
            ];
        } else if (type === 'stay') {
            body = [
                '🏨 *Selected Stay*',
                '• Room / Stay : ' + (d.stay_name  || 'Not pre-selected'),
                '• Price       : ' + (d.stay_price || 'Ask for quote'),
                '',
                line,
                '📅 *Stay Dates*',
                '• Check-In  : ' + fmtDate(d.stay_checkin),
                '• Check-Out : ' + fmtDate(d.stay_checkout) + nightsBetween(d.stay_checkin, d.stay_checkout),
                '',
                line,
                '👥 *Guests*',
                '• People : ' + (d.stay_people || 0),
                '• Rooms  : ' + (d.stay_rooms  || 1)
            ];
        } else if (type === 'cab') {
            body = [
                '🚗 *Cab Booking*',
                '• Cab Type   : ' + (d.cab_type || '-'),
                '• AC         : ' + (d.cab_ac   || '-'),
                '• Pickup City: ' + (d.cab_pickup || '-'),
                '• Drop City  : ' + (d.cab_drop   || '-'),
                '',
                line,
                '📅 *Trip Details*',
                '• Travel Date : ' + fmtDate(d.cab_travel_date),
                '',
                line,
                '👥 *Travellers*',
                '• Adults   : ' + (d.cab_adults   || 0),
                '• Children : ' + (d.cab_children || 0),
                '• Infants  : ' + (d.cab_infants  || 0)
            ];
        }

        return [
            header,
            line,
            '',
            ...body,
            '',
            line,
            '👤 *Customer Details*',
            '• Name  : ' + (d.name  || '-'),
            '• Phone : ' + (d.phone || '-'),
            '• Email : ' + (d.email || '-'),
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
       SUCCESS + AUTO-CLOSE
       ========================================================= */
    function showSuccess(successBox, form, modalEl, delay,
                         pkgNameInput, pkgPriceInput,
                         stayNameInput, stayPriceInput) {
        if (successBox) successBox.style.display = 'block';

        form.reset();

        // Clear prefilled readonly fields explicitly
        if (pkgNameInput)   pkgNameInput.value   = '';
        if (pkgPriceInput)  pkgPriceInput.value  = '';
        if (stayNameInput)  stayNameInput.value  = '';
        if (stayPriceInput) stayPriceInput.value = '';

        // Restore default panel (package)
        if (window.__ubSetType) window.__ubSetType('package');

        setTimeout(function () {
            if (successBox) successBox.style.display = 'none';

            if (window.bootstrap && bootstrap.Modal) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            }
        }, delay);
    }

})();