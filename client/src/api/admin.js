/**
 * adminFetch — centralized fetch wrapper for all /api/admin/* calls.
 * Automatically attaches the Bearer token, handles 401 by clearing
 * auth state and hard-redirecting to /admin/login.
 */
async function adminFetch(url, options = {}) {
  const token = localStorage.getItem('adminToken');

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Request failed');
  }

  return res.json();
}

export default adminFetch;
