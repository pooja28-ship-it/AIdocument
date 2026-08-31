const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
) {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    options,
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}