import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { requestPicoApproval } from './picoBle';

const API_BASE: string =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_API_BASE ?? 'http://localhost:8787';

export const BASESCAN = 'https://sepolia.basescan.org';
export const explorerTx = (hash: string) => `${BASESCAN}/tx/${hash}`;
export const explorerAddress = (addr: string) => `${BASESCAN}/address/${addr}`;

export type ApprovalMethod = 'passkey' | 'device';

export interface Health {
  ok: boolean;
  chainId: number;
  pimlico: boolean;
  multibaas: boolean;
  atomicMintTier: 2 | 3;
}
export interface ApprovalTicket {
  actionId: string;
  tier: number;
  methods: ApprovalMethod[];
  challengeHex: string;
  expiresInMs: number;
}
export interface MintResult {
  userOpHash: string;
  txHash: string;
  to: string;
  tokenId: string;
  sbtId: string;
  tba: string;
  uri: string;
  approvedBy: ApprovalMethod;
  at: string;
}
export interface UserStatus {
  registered: boolean;
  minted: MintResult | null;
}
export interface HistoryEvent {
  to: string;
  tokenId: string;
  sbtId: string;
  tba: string;
  uri: string;
  txHash: string | null;
  at: string | null;
}

async function api<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const getHealth = () => api<Health>('GET', '/api/health');
export const getUserStatus = (address: string) => api<UserStatus>('GET', `/api/users/${address}`);
export const getHistory = () => api<{ events: HistoryEvent[] }>('GET', '/api/atomic/history');

/** Passkey registration: options from server -> browser authenticator -> server verifies attestation. */
export async function registerPasskey(address: string, inviteCode?: string): Promise<void> {
  const optionsJSON = await api<Parameters<typeof startRegistration>[0]['optionsJSON']>(
    'POST',
    '/api/webauthn/register/options',
    { address, inviteCode },
  );
  const response = await startRegistration({ optionsJSON });
  await api('POST', '/api/webauthn/register/verify', { address, response });
}

export const createApproval = (address: string, tokenURI: string) =>
  api<ApprovalTicket>('POST', '/api/approvals', { kind: 'atomic_mint', address, tokenURI });

/** Real WebAuthn assertion over the server's action-bound challenge. Verified server-side. */
export async function approveWithPasskey(ticket: ApprovalTicket): Promise<void> {
  const optionsJSON = await api<Parameters<typeof startAuthentication>[0]['optionsJSON']>(
    'POST',
    `/api/approvals/${ticket.actionId}/passkey/options`,
  );
  const response = await startAuthentication({ optionsJSON });
  await api('POST', `/api/approvals/${ticket.actionId}/passkey/verify`, { response });
}

/** Pico W physical-button approval (Web Bluetooth). Verified server-side (HMAC). */
export async function approveWithDevice(ticket: ApprovalTicket): Promise<void> {
  const { deviceId, mac } = await requestPicoApproval(ticket.challengeHex);
  await api('POST', `/api/approvals/${ticket.actionId}/device`, { deviceId, mac });
}

export const mintAtomic = (actionId: string) => api<MintResult>('POST', '/api/atomic/mint', { actionId });

/** One call for the UI: create approval -> approve with the chosen method -> issue NFT+SBT+TBA. */
export async function issueAtomic(
  address: string,
  tokenURI: string,
  method: ApprovalMethod,
  onStep?: (step: 'approval' | 'signing' | 'sending') => void,
): Promise<MintResult> {
  onStep?.('approval');
  const ticket = await createApproval(address, tokenURI);
  if (!ticket.methods.includes(method)) throw new Error('この承認方法は現在のポリシーでは使えません');
  onStep?.('signing');
  if (method === 'device') await approveWithDevice(ticket);
  else await approveWithPasskey(ticket);
  onStep?.('sending');
  return mintAtomic(ticket.actionId);
}
