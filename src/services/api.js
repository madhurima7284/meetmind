const BASE_URL = '/api';

async function parseErrorMessage(res, fallback) {
  try {
    const data = await res.json();
    if (data.detail) {
      return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
    }
    if (data.error) {
      return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
    }
  } catch (e) {
    // Ignore JSON parsing errors
  }
  return `${fallback} (Status: ${res.status})`;
}

export const api = {
  async getStats() {
    const res = await fetch(`${BASE_URL}/meetings/stats`);
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Failed to fetch statistics'));
    }
    return res.json();
  },

  async getMeetings() {
    const res = await fetch(`${BASE_URL}/meetings`);
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Failed to fetch meetings'));
    }
    return res.json();
  },

  async getMeeting(id) {
    const res = await fetch(`${BASE_URL}/meetings/${id}`);
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Failed to fetch meeting details'));
    }
    return res.json();
  },

  async createMeeting(title) {
    const res = await fetch(`${BASE_URL}/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title || 'Untitled Meeting' }),
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Could not create meeting. Check that the backend and database are running.'));
    }
    return res.json();
  },

  async deleteMeeting(id) {
    const res = await fetch(`${BASE_URL}/meetings/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Failed to delete meeting'));
    }
  },

  async analyzeMeeting(id) {
    const res = await fetch(`${BASE_URL}/meetings/${id}/analyze`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Failed to analyze meeting with Gemini'));
    }
    return res.json();
  },

  async toggleActionItem(itemId) {
    const res = await fetch(`${BASE_URL}/action-items/${itemId}`, {
      method: 'PATCH',
    });
    if (!res.ok) {
      throw new Error(await parseErrorMessage(res, 'Failed to update action item'));
    }
    return res.json();
  },
};

export function getWebSocketUrl(meetingId) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws/meetings/${meetingId}`;
}
