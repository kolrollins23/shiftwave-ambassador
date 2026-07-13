/**
 * Shiftwave Ambassador Tool — Supabase Cloud Sync
 *
 * Strategy: "load-first, push-on-write"
 *   - On page load: fetch all data from Supabase → write to localStorage →
 *     fire window 'cloud:ready' event so pages can re-render with fresh data
 *   - On every write/delete: update localStorage immediately (instant UI),
 *     then push to Supabase asynchronously in the background
 *   - If Supabase is not configured or offline: graceful fallback to localStorage only
 */

window.Sync = (() => {
  let _client = null;

  function _isConfigured() {
    return (
      typeof window.SUPABASE_URL === 'string' &&
      window.SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
      typeof window.SUPABASE_ANON === 'string' &&
      window.SUPABASE_ANON !== 'YOUR_SUPABASE_ANON_KEY'
    );
  }

  function _getClient() {
    if (_client) return _client;
    if (!_isConfigured()) return null;
    try {
      _client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON);
    } catch (e) {
      console.warn('[Sync] Failed to create Supabase client:', e);
      _client = null;
    }
    return _client;
  }

  function _showSyncBadge(state) {
    let badge = document.getElementById('sw-sync-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'sw-sync-badge';
      badge.style.cssText = [
        'position:fixed', 'bottom:14px', 'right:16px', 'z-index:9999',
        'font-size:0.72rem', 'font-weight:600', 'padding:4px 10px',
        'border-radius:999px', 'letter-spacing:0.04em',
        'pointer-events:none', 'transition:opacity 0.4s'
      ].join(';');
      document.body.appendChild(badge);
    }
    if (state === 'loading') {
      badge.textContent = '⟳ Syncing…';
      badge.style.background = '#1e293b';
      badge.style.color = '#94a3b8';
      badge.style.opacity = '1';
    } else if (state === 'ok') {
      badge.textContent = '✓ Synced';
      badge.style.background = '#14532d';
      badge.style.color = '#86efac';
      badge.style.opacity = '1';
      setTimeout(() => { badge.style.opacity = '0'; }, 2000);
    } else if (state === 'live') {
      badge.textContent = '● Live';
      badge.style.background = '#14532d';
      badge.style.color = '#86efac';
      badge.style.opacity = '0.55';
    } else if (state === 'update') {
      badge.textContent = '↺ New evaluation received';
      badge.style.background = '#1e3a5f';
      badge.style.color = '#93c5fd';
      badge.style.opacity = '1';
      setTimeout(() => { _showSyncBadge('live'); }, 2500);
    } else if (state === 'error') {
      badge.textContent = '⚠ Offline — local only';
      badge.style.background = '#431407';
      badge.style.color = '#fdba74';
      badge.style.opacity = '1';
    } else {
      badge.style.opacity = '0';
    }
  }

  /**
   * Handles a Supabase Realtime postgres_changes event.
   * Updates localStorage and re-fires 'cloud:ready' so all open pages re-render.
   */
  function _handleRealtimeChange(payload) {
    try {
      const evals = JSON.parse(localStorage.getItem('sw_evaluations') || '[]');

      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const incoming = payload.new?.data;
        if (!incoming) return;
        const idx = evals.findIndex(e => e.id === incoming.id);
        if (idx > -1) {
          evals[idx] = incoming;
        } else {
          evals.unshift(incoming);
        }
        localStorage.setItem('sw_evaluations', JSON.stringify(evals));
      } else if (payload.eventType === 'DELETE') {
        const deletedId = payload.old?.id;
        if (!deletedId) return;
        const filtered = evals.filter(e => e.id !== deletedId);
        localStorage.setItem('sw_evaluations', JSON.stringify(filtered));
      }

      _showSyncBadge('update');
      window.dispatchEvent(new CustomEvent('cloud:ready', { detail: { source: 'realtime' } }));
    } catch (e) {
      console.warn('[Sync] Realtime change handler error:', e);
    }
  }

  /** Subscribe to live Supabase Realtime updates for the evaluations table. */
  function _subscribeRealtime(sb) {
    try {
      sb.channel('sw-evaluations-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'evaluations' }, _handleRealtimeChange)
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
            _showSyncBadge('live');
          }
        });
    } catch (e) {
      console.warn('[Sync] Realtime subscription failed:', e);
    }
  }

  /**
   * Call once per page load. Fetches all evaluations + config from Supabase,
   * writes to localStorage, then fires 'cloud:ready' so pages can re-render.
   * Also opens a Realtime WebSocket so all tabs stay live without refreshing.
   */
  async function init() {
    if (!_isConfigured()) {
      console.info('[Sync] Supabase not configured — running in local-only mode.');
      window.dispatchEvent(new CustomEvent('cloud:ready', { detail: { source: 'local' } }));
      return;
    }

    const sb = _getClient();
    if (!sb) {
      window.dispatchEvent(new CustomEvent('cloud:ready', { detail: { source: 'local' } }));
      return;
    }

    _showSyncBadge('loading');

    try {
      // ── Load evaluations
      const { data: evalRows, error: evalErr } = await sb
        .from('evaluations')
        .select('id, data')
        .order('created_at', { ascending: false });

      if (!evalErr && evalRows) {
        const evals = evalRows.map(r => r.data);
        localStorage.setItem('sw_evaluations', JSON.stringify(evals));
      }

      // ── Load config
      const { data: cfgRow, error: cfgErr } = await sb
        .from('app_config')
        .select('data, history')
        .eq('id', 1)
        .maybeSingle();

      if (!cfgErr && cfgRow) {
        if (cfgRow.data) {
          localStorage.setItem('sw_config', JSON.stringify(cfgRow.data));
        }
        if (cfgRow.history) {
          localStorage.setItem('sw_config_history', JSON.stringify(cfgRow.history));
        }
      }

      _showSyncBadge('ok');
    } catch (e) {
      console.warn('[Sync] Cloud load failed, using local data:', e);
      _showSyncBadge('error');
    }

    window.dispatchEvent(new CustomEvent('cloud:ready', { detail: { source: 'cloud' } }));

    // Open a persistent WebSocket so this tab receives changes made by other users.
    _subscribeRealtime(sb);
  }

  /** Upsert a single evaluation to Supabase */
  async function saveEval(evaluation) {
    const sb = _getClient();
    if (!sb) return;
    try {
      await sb.from('evaluations').upsert(
        { id: evaluation.id, data: evaluation, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );
    } catch (e) {
      console.warn('[Sync] saveEval failed:', e);
    }
  }

  /** Delete a single evaluation from Supabase */
  async function deleteEval(id) {
    const sb = _getClient();
    if (!sb) return;
    try {
      await sb.from('evaluations').delete().eq('id', id);
    } catch (e) {
      console.warn('[Sync] deleteEval failed:', e);
    }
  }

  /** Upsert the app config (and history) to Supabase */
  async function saveConfig(config, history) {
    const sb = _getClient();
    if (!sb) return;
    try {
      await sb.from('app_config').upsert(
        {
          id: 1,
          data: config,
          history: history || JSON.parse(localStorage.getItem('sw_config_history') || '[]'),
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      );
    } catch (e) {
      console.warn('[Sync] saveConfig failed:', e);
    }
  }

  return { init, saveEval, deleteEval, saveConfig, isConfigured: _isConfigured };
})();

// Auto-init on every page as soon as this script is loaded.
// Pages listen for 'cloud:ready' to know when to re-render.
document.addEventListener('DOMContentLoaded', () => Sync.init());
