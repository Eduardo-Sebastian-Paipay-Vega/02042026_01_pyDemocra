import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export async function fetchEducData(endpoint: string) {
  const { data: { session } } = await supabase.auth.getSession();
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

export async function postEducData(endpoint: string, data: any) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No active session found');
  }

  const response = await fetch(`${API_BASE_URL}/api/educ/${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`Error posting ${endpoint}: ${response.statusText}`);
  }

  return response.json();
}

// Global helper to tell the current dashboard to refetch its data
export function forceDashboardRefetch(dashboardEndpoint: string) {
  fetchEducData(dashboardEndpoint).then(d => {
    (window as any).__dashboardData = d;
    // We dispatch a custom event that the dashboard can listen to if it wants to force a React re-render
    window.dispatchEvent(new CustomEvent('dashboardRefetch', { detail: d }));
  }).catch(console.error);
}
