const BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Public: Fetch all events, optionally filtered by search and category.
 */
export async function getEvents(search = '', category = '') {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (category && category !== 'All') params.append('category', category);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${BASE_URL}/api/events${queryString}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch events');
  }
  return data;
}

/**
 * Public: Fetch the featured event.
 */
export async function getFeaturedEvent() {
  const res = await fetch(`${BASE_URL}/api/events/featured`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch featured event');
  }
  return data;
}

/**
 * Public: Fetch a single event by ID (includes registrations_count).
 */
export async function getEventById(id) {
  const res = await fetch(`${BASE_URL}/api/events/${id}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch event details');
  }
  return data;
}

/**
 * Protected: Create a new event.
 */
export async function createEvent(eventData, token) {
  const res = await fetch(`${BASE_URL}/api/admin/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(eventData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create event');
  }
  return data;
}

/**
 * Protected: Update an existing event.
 */
export async function updateEvent(id, eventData, token) {
  const res = await fetch(`${BASE_URL}/api/admin/events/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(eventData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update event');
  }
  return data;
}

/**
 * Protected: Delete an event by ID.
 */
export async function deleteEvent(id, token) {
  const res = await fetch(`${BASE_URL}/api/admin/events/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete event');
  }
  return data;
}

/**
 * Protected: Toggle/set featured status for an event.
 */
export async function featureEvent(id, token) {
  const res = await fetch(`${BASE_URL}/api/admin/events/${id}/feature`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to feature event');
  }
  return data;
}
