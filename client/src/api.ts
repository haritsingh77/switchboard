const BASE_URL = "http://localhost:3000";

export function getToken() {
    return localStorage.getItem("token");
}

export async function apiFetch(path: string, options: RequestInit = {}) {
    const token = getToken();
    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || `Request failed : ${res.status}`);
    }
    return res.json();
}