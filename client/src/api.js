// Tiny fetch wrapper for the DearSafe API. Session is an httpOnly cookie.

async function req(path, method = 'GET', body) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  if (res.status === 423) {
    const e = new Error('locked');
    e.locked = true;
    throw e;
  }
  if (!res.ok) {
    let msg = 'Something went wrong';
    try {
      msg = (await res.json()).error || msg;
    } catch {
      /* non-JSON error */
    }
    const e = new Error(msg);
    e.status = res.status;
    throw e;
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

export const api = {
  config: () => req('/config'),
  authStatus: () => req('/auth/status'),
  setupStatus: () => req('/setup/status'),
  setup: (password) => req('/setup', 'POST', { password }),
  unlock: (password) => req('/auth/unlock', 'POST', { password }),
  lock: () => req('/auth/lock', 'POST'),
  logout: () => req('/auth/logout', 'POST'),

  uploadMedia: async (file, entryId) => {
    const fd = new FormData();
    fd.append('file', file);
    if (entryId) fd.append('entryId', entryId);
    const res = await fetch('/api/media', { method: 'POST', body: fd, credentials: 'same-origin' });
    if (!res.ok) {
      let m = 'upload failed';
      try { m = (await res.json()).error || m; } catch { /* */ }
      throw new Error(m);
    }
    return res.json();
  },

  listEntries: () => req('/entries'),
  getEntry: (id) => req(`/entries/${id}`),
  createEntry: (data) => req('/entries', 'POST', data),
  updateEntry: (id, data) => req(`/entries/${id}`, 'PUT', data),
  deleteEntry: (id) => req(`/entries/${id}`, 'DELETE'),
};
