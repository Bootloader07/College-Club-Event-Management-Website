export const registerStudent = (data) =>
  fetch('/api/students/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(async (res) => {
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Registration failed');
    return json;
  });

export const loginStudent = (data) =>
  fetch('/api/students/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(async (res) => {
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Login failed');
    return json;
  });

export const getMyRegistrations = () =>
  fetch('/api/students/me/registrations', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('studentToken')}`,
    },
  }).then(async (res) => {
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch registrations');
    return json;
  });
