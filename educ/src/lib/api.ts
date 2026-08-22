import { getSession } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export async function fetchEducData(endpoint: string) {
  const session = await getSession();
  if (!session) {
    throw new Error('No active session found');
  }

  const response = await fetch(`${API_BASE_URL}/api/educ/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching ${endpoint}: ${response.statusText}`);
  }

  return response.json();
}
