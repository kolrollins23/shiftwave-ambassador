/**
 * Shiftwave Ambassador Tool — Password Gate
 *
 * Shows a full-page overlay before any content is visible.
 * Correct password is stored in supabase-config.js as window.SW_PASSWORD.
 * Auth state is kept in sessionStorage so employees only enter it once per browser session.
 */

(function () {
  const SESSION_KEY = 'sw_auth_session';

  function isAuthed() {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  }

  function authenticate(password) {
    const correct = window.SW_PASSWORD || 'shiftwave2025';
    return password === correct;
  }

  function buildOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'sw-auth-overlay';
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:99999',
      'display:flex', 'align-items:center', 'justify-content:center',
      'background:#0b0f19',
      'font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif'
    ].join(';');

    overlay.innerHTML = `
      <div style="width:100%;max-width:360px;padding:0 24px;">
        <div style="margin-bottom:32px;text-align:center;">
          <div style="font-size:0.75rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;margin-bottom:8px;">Shiftwave — Internal Tool</div>
          <div style="font-size:1.375rem;font-weight:700;color:#f1f5f9;">Ambassador Evaluation Tool</div>
          <div style="font-size:0.875rem;color:#64748b;margin-top:6px;">Enter the team password to continue</div>
        </div>

        <div id="sw-auth-error" style="display:none;margin-bottom:12px;padding:10px 14px;border-radius:8px;background:#431407;color:#fdba74;font-size:0.8125rem;font-weight:500;text-align:center;">
          Incorrect password — try again
        </div>

        <form id="sw-auth-form" autocomplete="off">
          <input
            id="sw-auth-input"
            type="password"
            placeholder="Team password"
            autocomplete="current-password"
            style="width:100%;box-sizing:border-box;padding:12px 14px;border-radius:10px;border:1.5px solid #1e293b;background:#0f172a;color:#f1f5f9;font-size:1rem;font-family:inherit;outline:none;margin-bottom:12px;"
          >
          <button
            type="submit"
            style="width:100%;padding:12px;border-radius:10px;border:none;background:#f59e0b;color:#0b0f19;font-size:0.9375rem;font-weight:700;font-family:inherit;cursor:pointer;letter-spacing:0.01em;"
          >
            Unlock
          </button>
        </form>
      </div>
    `;

    return overlay;
  }

  function mount() {
    if (isAuthed()) return;

    const overlay = buildOverlay();
    document.body.appendChild(overlay);

    const form  = document.getElementById('sw-auth-form');
    const input = document.getElementById('sw-auth-input');
    const error = document.getElementById('sw-auth-error');

    // Focus input on next frame so it catches the keyboard on mobile too
    requestAnimationFrame(() => input.focus());

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = input.value;

      if (authenticate(val)) {
        sessionStorage.setItem(SESSION_KEY, '1');
        overlay.style.transition = 'opacity 0.25s';
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 260);
      } else {
        error.style.display = 'block';
        input.value = '';
        input.focus();
        // Shake the form
        const box = form.parentElement;
        box.style.transition = 'transform 0.07s';
        box.style.transform = 'translateX(8px)';
        setTimeout(() => { box.style.transform = 'translateX(-8px)'; }, 70);
        setTimeout(() => { box.style.transform = 'translateX(0)'; }, 140);
      }
    });
  }

  // Run immediately — before DOMContentLoaded — so unauthenticated users
  // never see a flash of content. If body doesn't exist yet, wait for it.
  if (document.body) {
    mount();
  } else {
    document.addEventListener('DOMContentLoaded', mount);
  }
})();
