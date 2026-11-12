// One place for every call to the Teen Wallet backend.
// Docs: the "TeenWallet API Guide" (base URL, routes, error format).
import AsyncStorage from '@react-native-async-storage/async-storage';

// The backend on Render. The free server sleeps when idle, so the first call can take up to a minute.
export const API_URL = 'https://teenwallet.onrender.com/api';

export type User = { id: string; name: string; email: string; role: 'parent' | 'teen' };

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type Options = { method?: 'GET' | 'POST' | 'PUT'; body?: unknown; token?: string | null; timeoutMs?: number };

// Sends the saved login token automatically. Pass token: null for calls that need none (login, register).
export async function api<T = any>(path: string, opts: Options = {}): Promise<T> {
  const token = opts.token === undefined ? await AsyncStorage.getItem('token') : opts.token;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 60000);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: opts.method ?? 'GET',
      headers: {
        ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Cannot reach the server. Check your internet and try again.');
  } finally {
    clearTimeout(timer);
  }
  let data: any = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) throw new ApiError(res.status, data?.error ?? 'ERROR', data?.message ?? `Request failed (${res.status})`);
  return data as T;
}

export function errorText(e: unknown): string {
  return e instanceof Error ? e.message : 'Something went wrong. Please try again.';
}

export async function saveSession(token: string, user: User) {
  await AsyncStorage.setItem('token', token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
}

export async function getUser(): Promise<User | null> {
  const s = await AsyncStorage.getItem('user');
  try { return s ? (JSON.parse(s) as User) : null; } catch { return null; }
}

export async function clearSession() {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
}

// Money is whole paise everywhere in the backend. Show it as rupees.
export function rupees(paise: number): string {
  const r = paise / 100;
  const text = Number.isInteger(r) ? String(r) : r.toFixed(2);
  const [whole, frac] = text.split('.');
  const neg = whole.startsWith('-');
  const digits = neg ? whole.slice(1) : whole;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}` : last3;
  return `${neg ? '-' : ''}₹${grouped}${frac ? `.${frac}` : ''}`;
}
