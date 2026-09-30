import { VerifiableCertificate } from '../types/certificate';

export type PaymentRail = 'ERC4337_TBA' | 'WEBLN_LIGHTNING' | 'STRIPE_AGENT_PAY';

export interface ChatPayTransaction {
  txId: string;
  amount: string;
  currency: string;
  recipient: string;
  memo: string;
  rail: PaymentRail;
  timestamp: string;
  status: 'settled' | 'pending' | 'failed';
  proofReceipt: string;
}

export interface ExternalWalletConnection {
  id: string;
  name: string;
  icon: string;
  type: 'evm' | 'solana' | 'passkey' | 'universal';
  status: 'connected' | 'available' | 'detected';
  address?: string;
  network?: string;
}

export const INITIAL_EXTERNAL_WALLETS: ExternalWalletConnection[] = [
  {
    id: 'metamask',
    name: 'MetaMask / EVM',
    icon: '🦊',
    type: 'evm',
    status: 'connected',
    address: '0x71C...B29',
    network: 'Base L2 / Ethereum',
  },
  {
    id: 'phantom',
    name: 'Phantom / Solana',
    icon: '👻',
    type: 'solana',
    status: 'available',
    network: 'Solana Mainnet-Beta',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Smart Wallet (Passkey)',
    icon: '🔵',
    type: 'passkey',
    status: 'connected',
    address: '0x39a...E12',
    network: 'Base L2 (EIP-4337)',
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect v2',
    icon: '🌐',
    type: 'universal',
    status: 'available',
    network: 'Multi-Chain Relay',
  },
];

/**
 * Execute Chat Pay transaction (In-Chat micro-settlement)
 */
export async function executeChatPayRequest(params: {
  amount: string;
  recipient: string;
  memo: string;
  rail: PaymentRail;
  tbaAddress?: string;
}): Promise<ChatPayTransaction> {
  // Simulate cryptographic settlement
  await new Promise((resolve) => setTimeout(resolve, 800));

  const randomHash = `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

  return {
    txId: `pay-${Date.now()}`,
    amount: params.amount,
    currency: params.rail === 'WEBLN_LIGHTNING' ? 'SATS' : params.rail === 'STRIPE_AGENT_PAY' ? 'USD' : 'ETH',
    recipient: params.recipient,
    memo: params.memo || 'AI Agent Chat Pay Settlement',
    rail: params.rail,
    timestamp: new Date().toISOString(),
    status: 'settled',
    proofReceipt: randomHash,
  };
}

/**
 * Gemini Function Calling Tool Definitions
 */
export const GEMINI_TOOL_DEFINITIONS = [
  {
    name: 'awallet_get_credentials',
    description: 'Lists all W3C DIDs, Soulbound Tokens (SBT), and ERC-6551 Token Bound Accounts (TBA) owned by the current AI agent.',
    parameters: {
      type: 'OBJECT',
      properties: {
        typeFilter: {
          type: 'STRING',
          enum: ['ALL', 'DID', 'SBT', 'TBA'],
          description: 'Filter credentials by type',
        },
      },
    },
  },
  {
    name: 'awallet_present_selective_proof',
    description: 'Generates a temporary, zero-knowledge verifiable presentation for an external verifier or audit body.',
    parameters: {
      type: 'OBJECT',
      properties: {
        credentialIds: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Credentials to present',
        },
        recipient: {
          type: 'STRING',
          description: 'Recipient verifier name, email, or DID',
        },
        disclosedAttributes: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Attributes to expose; all others are verified via ZK-proofs',
        },
        expirationMinutes: {
          type: 'INTEGER',
          description: 'Lifetime in minutes',
        },
        oneTimeView: {
          type: 'BOOLEAN',
          description: 'Whether to burn link after first access',
        },
      },
      required: ['credentialIds', 'recipient'],
    },
  },
  {
    name: 'awallet_chat_pay_request',
    description: 'Transfers funds or settles an invoice within conversation via ERC-4337 Session Key, WebLN, or Stripe Agent Rail.',
    parameters: {
      type: 'OBJECT',
      properties: {
        amount: { type: 'STRING', description: 'Amount (e.g. 0.05 ETH or 10.00 USD)' },
        recipient: { type: 'STRING', description: 'Recipient address, DID, or invoice ID' },
        rail: {
          type: 'STRING',
          enum: ['ERC4337_TBA', 'WEBLN_LIGHTNING', 'STRIPE_AGENT_PAY'],
        },
        memo: { type: 'STRING', description: 'Purpose description' },
      },
      required: ['amount', 'recipient'],
    },
  },
];

/**
 * Claude Tool Calling (Tools / MCP) Definition
 */
export const CLAUDE_TOOL_DEFINITIONS = [
  {
    name: 'awallet_present_selective_proof',
    description: 'Generates a scoped W3C Verifiable Presentation with attribute-level Zero-Knowledge proof encryption.',
    input_schema: {
      type: 'object',
      properties: {
        credentialIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of credential IDs',
        },
        recipient: {
          type: 'string',
          description: 'Recipient DID or Email',
        },
        disclosedAttributes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Unredacted attribute keys',
        },
        expirationMinutes: {
          type: 'number',
          description: 'Time-to-live in minutes',
        },
      },
      required: ['credentialIds', 'recipient'],
    },
  },
  {
    name: 'awallet_chat_pay_request',
    description: 'Executes an in-chat micropayment via Token Bound Account or WebLN.',
    input_schema: {
      type: 'object',
      properties: {
        amount: { type: 'string', description: 'Amount to pay' },
        recipient: { type: 'string', description: 'Destination address' },
        rail: {
          type: 'string',
          enum: ['ERC4337_TBA', 'WEBLN_LIGHTNING', 'STRIPE_AGENT_PAY'],
        },
        memo: { type: 'string', description: 'Payment reason' },
      },
      required: ['amount', 'recipient'],
    },
  },
];

/**
 * Vue 3 / Vite SDK Code Snippet Generator
 */
export const VUE3_SDK_CODE_SAMPLE = `// ==========================================
// Vue 3 Composition API: useAWallet Composable
// ==========================================
import { ref, computed, onMounted } from 'vue';

export interface UseAWalletOptions {
  network?: string;
  projectId?: string;
  autoConnect?: boolean;
}

export function useAWallet(options: UseAWalletOptions = {}) {
  const isConnected = ref(false);
  const activeDid = ref('did:key:z6MkuSgW3z9Qj81L9Y8Nq7E4qP7t7eE8mH2nL1vXp9YqK');
  const tbaBalance = ref('4.85 ETH');
  const isPresenting = ref(false);

  const connectAWallet = async () => {
    // Connects to MaaS Gateway via JSON-RPC / WebSocket
    isConnected.value = true;
    return { did: activeDid.value, network: options.network || 'base-l2' };
  };

  const presentSelectiveProof = async (payload: {
    credentialIds: string[];
    recipient: string;
    disclosedClaims: string[];
    ttlMinutes?: number;
    enableZK?: boolean;
  }) => {
    isPresenting.value = true;
    try {
      const res = await fetch('https://api.awallet.dev/v1/maas/presentations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } finally {
      isPresenting.value = false;
    }
  };

  const executeChatPay = async (amount: string, recipient: string, rail: 'ERC4337_TBA' | 'WEBLN_LIGHTNING') => {
    const res = await fetch('https://api.awallet.dev/v1/maas/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, recipient, rail }),
    });
    return await res.json();
  };

  return {
    isConnected,
    activeDid,
    tbaBalance,
    isPresenting,
    connectAWallet,
    presentSelectiveProof,
    executeChatPay,
  };
}
`;
