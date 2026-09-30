const BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Public: Admin login.
 */
export async function login(username, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Invalid credentials');
  }
  return data;
}

/**
 * Protected: Fetch admin dashboard statistics.
 */
export async function getStats(token) {
  const res = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch admin stats');
  }
  return data;
}
