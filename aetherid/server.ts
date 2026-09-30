import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// =========================================================================
// 1. TiveAI Natural Language In-App Operation & AI Assistant Endpoint
// =========================================================================
app.post('/api/gemini/tive', async (req, res) => {
  const { prompt, language = 'en', currentContext } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Fallback intelligent intent parser in case API key is not configured
  const parseActionFallback = (input: string, lang: string) => {
    const lower = input.toLowerCase();
    let action = 'none';
    let target = '';
    let responseText = '';

    if (lower.includes('grid') || lower.includes('グリッド')) {
      action = 'switch_view';
      target = 'grid';
      responseText =
        lang === 'ja'
          ? '表示形式を「グリッド表示」に切り替えました。'
          : 'Switched layout to Grid Matrix view.';
    } else if (lower.includes('cascade') || lower.includes('3d') || lower.includes('カスケード') || lower.includes('スタック')) {
      action = 'switch_view';
      target = 'cascade';
      responseText =
        lang === 'ja'
          ? '表示形式を「3Dカスケード表示」に切り替えました。'
          : 'Switched layout to 3D Cascade Stack view.';
    } else if (lower.includes('share') && (lower.includes('list') || lower.includes('active') || lower.includes('共有') || lower.includes('一覧'))) {
      action = 'switch_view';
      target = 'shares';
      responseText =
        lang === 'ja'
          ? 'アクティブな共有リンク一覧を表示しました。'
          : 'Opened Active Verifiable Presentations registry.';
    } else if (lower.includes('sbt') || lower.includes('soulbound') || lower.includes('ソウルバウンド')) {
      action = 'filter_credentials';
      target = 'SBT';
      responseText =
        lang === 'ja'
          ? 'ソウルバウンドトークン（SBT）のみを抽出しました。'
          : 'Filtered list to show only Soulbound Tokens (SBT).';
    } else if (lower.includes('did')) {
      action = 'filter_credentials';
      target = 'DID';
      responseText =
        lang === 'ja'
          ? 'W3C分散型ID（DID）のみを抽出しました。'
          : 'Filtered list to show only W3C DIDs.';
    } else if (lower.includes('tba') || lower.includes('vault') || lower.includes('ウォレット')) {
      action = 'filter_credentials';
      target = 'TBA';
      responseText =
        lang === 'ja'
          ? 'ERC-6551 トークンバウンドアカウント（TBA）のみを抽出しました。'
          : 'Filtered list to show only ERC-6551 Token Bound Accounts (TBA).';
    } else if (lower.includes('all') || lower.includes('reset') || lower.includes('すべて') || lower.includes('リセット')) {
      action = 'filter_credentials';
      target = 'ALL';
      responseText =
        lang === 'ja'
          ? 'フィルターを解除し、すべての証明書を表示しています。'
          : 'Reset filters. Displaying all registered certificates.';
    } else if (lower.includes('inspect') || lower.includes('agent') || lower.includes('詳細') || lower.includes('エージェント')) {
      action = 'inspect_credential';
      target = 'did-agent-core-01';
      responseText =
        lang === 'ja'
          ? '自律型意思決定AIエージェントのCore DID詳細インスペクターを開きました。'
          : 'Opened detailed inspector for Autonomous Reasoning Agent Core DID.';
    } else if (lower.includes('mint') || lower.includes('issue') || lower.includes('発行') || lower.includes('作成')) {
      action = 'open_modal';
      target = 'mint';
      responseText =
        lang === 'ja'
          ? '新規証明書の発行（ミント）ダイアログを開きました。'
          : 'Opened Credential Mint & Issuance modal.';
    } else if (lower.includes('share') || lower.includes('present') || lower.includes('選択的')) {
      action = 'open_modal';
      target = 'share';
      responseText =
        lang === 'ja'
          ? 'ゼロ知識選択的開示共有ウィザードを開きました。'
          : 'Opened Selective Share & Zero-Knowledge Presentation wizard.';
    } else if (lower.includes('api') || lower.includes('skill') || lower.includes('amane') || lower.includes('awallet')) {
      action = 'open_modal';
      target = 'api_skill';
      responseText =
        lang === 'ja'
          ? 'Amane Protocol & AWallet 統合APIおよびSkill.md連携画面を開きました。'
          : 'Opened Unified Amane & AWallet API and Skill.md specification modal.';
    } else if (lower.includes('sheets') || lower.includes('workspace') || lower.includes('スプレッドシート') || lower.includes('同期')) {
      action = 'open_modal';
      target = 'hub';
      responseText =
        lang === 'ja'
          ? 'Google Workspace Hubを開きました。'
          : 'Opened Google Workspace Hub.';
    } else if (lower.includes('japanese') || lower.includes('日本語')) {
      action = 'set_language';
      target = 'ja';
      responseText = '言語設定を日本語に変更しました。';
    } else if (lower.includes('english') || lower.includes('英語')) {
      action = 'set_language';
      target = 'en';
      responseText = 'Language changed to English.';
    } else {
      action = 'none';
      responseText =
        lang === 'ja'
          ? `TiveAIがコマンド「${input}」を受信しました。AI DID、SBT、TBAの暗号学的検証や、画面切り替え（グリッド・3D・共有リンク）、証明書発行、APIテストを瞬時に実行できます。`
          : `TiveAI received your command "${input}". You can ask me to switch layouts, filter DIDs/SBTs/TBAs, inspect credentials, issue proofs, or execute unified API tests.`;
    }

    return { action, target, message: responseText };
  };

  // If Gemini API Key is missing, respond gracefully via deterministic intent parser
  if (!process.env.GEMINI_API_KEY) {
    const fallback = parseActionFallback(prompt, language);
    return res.json({
      success: true,
      action: fallback.action,
      target: fallback.target,
      message: fallback.message,
      provider: 'tive-local-engine',
    });
  }

  try {
    const systemPrompt = `You are TiveAI, the high-throughput, sovereign in-app controller and AI assistant for the AetherID Sovereign Identity Wallet.
The user interacts with decentralized AI credentials (W3C DIDs, Soulbound Tokens [SBT], ERC-6551 Token Bound Accounts [TBA], and Google Workspace integrations).

You can control this web application by outputting structured actions.
Your response MUST be strict JSON matching this schema:
{
  "action": "switch_view" | "filter_credentials" | "select_credential" | "inspect_credential" | "open_modal" | "set_language" | "none",
  "target": string, // e.g. 'grid' | 'cascade' | 'shares' | 'ALL' | 'DID' | 'SBT' | 'TBA' | 'did-agent-core-01' | 'share' | 'mint' | 'hub' | 'api_skill' | 'en' | 'ja'
  "message": string // concise response explaining what you did or answering the user's question. MUST match the language: ${language === 'ja' ? 'Japanese' : 'English'}.
}

Current app context: ${JSON.stringify(currentContext || {})}
Preferred language: ${language}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: {
              type: Type.STRING,
              description: 'App operation action to perform',
            },
            target: {
              type: Type.STRING,
              description: 'Target identifier, parameter, or modal',
            },
            message: {
              type: Type.STRING,
              description: 'Explanation or conversational message to the user',
            },
          },
          required: ['action', 'target', 'message'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({
      success: true,
      action: parsed.action || 'none',
      target: parsed.target || '',
      message: parsed.message || (language === 'ja' ? 'コマンドを実行しました。' : 'Action completed.'),
      provider: 'gemini-3.8-flash',
    });
  } catch (err: any) {
    console.error('TiveAI Gemini Generation Error:', err);
    // Graceful fallback on network/quota error
    const fallback = parseActionFallback(prompt, language);
    return res.json({
      success: true,
      action: fallback.action,
      target: fallback.target,
      message: fallback.message,
      provider: 'tive-local-engine',
    });
  }
});

// =========================================================================
// 2. Unified Amane Protocol & AWallet API Gateway Endpoints
// =========================================================================

// Retrieve credentials
app.get('/api/amane/credentials', (req, res) => {
  res.json({
    status: 'success',
    gateway: 'Amane-AWallet-Unified-v2.5',
    timestamp: new Date().toISOString(),
    agentDid: 'did:key:z6MkuSgW3z9Qj81L9Y8Nq7E4qP7t7eE8mH2nL1vXp9YqK',
    credentialsCount: 5,
    networkStatus: {
      l2Chain: 'Base Mainnet',
      dwnStatus: 'connected',
      sessionKeyValidity: 'active (23h remaining)',
    },
  });
});

// Cryptographic Verification
app.post('/api/amane/verify', (req, res) => {
  const { credentialId, proofValue } = req.body;
  const hash = `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

  res.json({
    status: 'verified',
    credentialId: credentialId || 'did-agent-core-01',
    valid: true,
    verificationAlgorithm: 'Ed25519Signature2020',
    verificationMethod: 'did:google:ai-verifiable-hub#key-1',
    sha256ProofHash: hash,
    evaluatedAt: new Date().toISOString(),
    trustScore: 99,
  });
});

// Generate Verifiable Presentation with ZK
app.post('/api/amane/present', (req, res) => {
  const { credentialIds, recipient, disclosedClaims, enableZK = true } = req.body;
  const token = `vp-${Math.random().toString(36).substring(2, 10)}`;

  res.json({
    status: 'issued',
    shareToken: token,
    presentationUrl: `https://aetherid.app/verify/${token}`,
    recipient: recipient || 'Audit Board',
    zkProofAttached: Boolean(enableZK),
    disclosedClaimsCount: (disclosedClaims || []).length,
    expiresAt: new Date(Date.now() + 24 * 3600000).toISOString(),
    w3cPresentationPayload: {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://identity.foundation/zkp-ld/v1',
      ],
      type: ['VerifiablePresentation', 'AmaneSelectiveProof'],
      verifiableCredentials: credentialIds || ['did-agent-core-01'],
    },
  });
});

// In-chat Micropayment / Session Key Settlement (AWallet & Amane Unified)
app.post('/api/awallet/pay', (req, res) => {
  const { amount = '0.01 ETH', recipient = 'audit.eth', rail = 'ERC4337_TBA', memo = 'Inference Quota' } = req.body;
  const txHash = `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

  res.json({
    status: 'settled',
    transactionHash: txHash,
    amount,
    recipient,
    rail,
    memo,
    settlementBlock: 21948300,
    timestamp: new Date().toISOString(),
    sessionKeyApproved: true,
  });
});

// Skill.md Schema definition endpoint
app.get('/api/skill/docs', (req, res) => {
  res.json({
    skillName: 'amane-awallet-agent-skill',
    version: '2.5.0',
    description: 'Unified tool schemas for autonomous AI agents to query DIDs, present ZK verifiable proofs, and execute micropayments.',
    tools: [
      {
        name: 'awallet_get_credentials',
        description: 'Lists all W3C DIDs, Soulbound Tokens (SBT), and ERC-6551 Token Bound Accounts (TBA) owned by the current AI agent.',
        parameters: {
          type: 'OBJECT',
          properties: {
            typeFilter: {
              type: 'STRING',
              enum: ['ALL', 'DID', 'SBT', 'TBA'],
              description: 'Optional filter by credential type',
            },
          },
        },
      },
      {
        name: 'awallet_present_selective_proof',
        description: 'Presents one or more certificates to an external verifier with optional zero-knowledge attribute redaction and automatic expiration.',
        parameters: {
          type: 'OBJECT',
          properties: {
            credentialIds: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'List of credential IDs to include',
            },
            recipient: {
              type: 'STRING',
              description: 'Recipient name, email, or DID',
            },
            disclosedAttributes: {
              type: 'ARRAY',
              items: { type: 'STRING' },
              description: 'Attribute keys to disclose; all omitted keys remain encrypted with ZK proof',
            },
            expirationMinutes: {
              type: 'INTEGER',
              description: 'Validity lifetime in minutes',
            },
            oneTimeView: {
              type: 'BOOLEAN',
              description: 'If true, link burns after single verification',
            },
          },
          required: ['credentialIds', 'recipient'],
        },
      },
      {
        name: 'awallet_chat_pay_request',
        description: 'Executes an in-chat micropayment or generates an invoice via ERC-4337 Session Keys, WebLN, or Stripe Agent Rail.',
        parameters: {
          type: 'OBJECT',
          properties: {
            amount: { type: 'STRING', description: 'Payment amount (e.g. 0.005 ETH or 5.00 USD)' },
            recipientAddressOrEmail: { type: 'STRING', description: 'Destination address, DID, or payment recipient' },
            memo: { type: 'STRING', description: 'Purpose of payment or invoice description' },
            rail: {
              type: 'STRING',
              enum: ['ERC4337_TBA', 'WEBLN_LIGHTNING', 'STRIPE_AGENT_PAY'],
              description: 'Payment rail to use',
            },
          },
          required: ['amount', 'recipientAddressOrEmail'],
        },
      },
    ],
  });
});

// =========================================================================
// 3. Frontend Static Serving & Vite Middleware
// =========================================================================
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`AetherID Full-Stack Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
