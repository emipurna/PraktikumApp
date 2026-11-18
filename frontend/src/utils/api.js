const API_BASE = '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data.error || `HTTP ${response.status}`);
    err.status = response.status;
    throw err;
  }
  return data;
}

export function fetchLeaderboard(boardId) {
  return request(`/leaderboard/${boardId}`);
}

export function loginAdmin(username, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function updateMatchStatus(boardId, status) {
  return request(`/matches/${boardId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function updateMatchConfig(boardId, eventName, eventDate) {
  return request(`/matches/${boardId}/config`, {
    method: 'PUT',
    body: JSON.stringify({ eventName, eventDate }),
  });
}

export function createParticipant(payload) {
  return request('/participants', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateParticipant(id, payload) {
  return request(`/participants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteParticipant(id) {
  return request(`/participants/${id}`, {
    method: 'DELETE',
  });
}
