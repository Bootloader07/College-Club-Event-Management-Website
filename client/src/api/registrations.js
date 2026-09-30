const BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Public: Register a student for an event.
 */
export async function registerForEvent(registrationData) {
  const res = await fetch(`${BASE_URL}/api/registrations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(registrationData),
  });
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.error || 'Failed to submit registration');
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

/**
 * Protected: Fetch all registrations (with optional ?event_id= and ?search=).
 */
export async function getRegistrations(eventId = '', search = '', token = '') {
  const params = new URLSearchParams();
  if (eventId) params.append('event_id', eventId);
  if (search && search.trim()) params.append('search', search.trim());

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${BASE_URL}/api/admin/registrations${queryString}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch registrations');
  }
  return data;
}
