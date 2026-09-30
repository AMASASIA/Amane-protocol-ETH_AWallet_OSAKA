# AWallet MaaS (Multi-Agent Account Abstraction Service) Architecture Blueprint
# AWallet MaaS（マルチエージェント・アカウント抽象化サービス）アーキテクチャ設計図・仕様書

---

## 1. Executive Summary / 概要

### English
**AWallet MaaS** is a decentralized, high-throughput Account Abstraction and Decentralized Identity (DID / SBT / TBA) infrastructure designed for autonomous AI agents (Google Gemini, Anthropic Claude, autonomous swarms) and human users. It enables seamless integration with Vue 3 / Vite frontends, multi-wallet providers (MetaMask, Phantom, Coinbase Smart Wallet, WalletConnect v2), in-chat micro-settlements (Chat Pay via WebLN / Stripe Agent Toolkit / ERC-4337), and Google Workspace enterprise synchronization.

### 日本語
**AWallet MaaS**は、自律型AIエージェント（Google Gemini、Anthropic Claude、自律分散スウォーム）および人間のユーザー向けに設計された、分散型アカウント抽象化（ERC-4337 / ERC-6551）および分散型アイデンティティ（DID / SBT / TBA）インフラストラクチャです。Vue 3 / Viteフロントエンドとの連携、マルチウォレット接続（MetaMask、Phantom、Coinbase Smart Wallet、WalletConnect v2）、チャット内即時決済（Chat Pay: WebLN / ERC-4337セッションキー / Stripe Agent Toolkit）、およびGoogle Workspace企業連携を包括的に提供します。

---

## 2. High-Level System Architecture Diagram / システム全体アーキテクチャ設計図

```
+----------------------------------------------------------------------------------------------------+
|                                    CLIENT TIER / クライアント層                                    |
|                                                                                                    |
|  [ Vue 3 + Vite SPA (VueUse / Pinia) ] <====> [ React 19 + Tailwind Hybrid Dashboard ]             |
|          |                                            |                                            |
|          +------------ [ AWallet Core TypeScript SDK ] <-----------+                               |
+----------------------------------------------------------------------------------------------------+
                                               |
                                     JSON-RPC 2.0 / REST / SSE
                                               |
+----------------------------------------------------------------------------------------------------+
|                                  MAAS GATEWAY / MaaS ゲートウェイ層                                |
|                                                                                                    |
|   +-----------------------+   +-------------------------+   +----------------------------------+   |
|   |  W3C DID & ZK-Engine  |   | ERC-6551 / 4337 Bundler |   | Chat Pay & Stream Settlement Hub |   |
|   |  - Ed25519 Signer     |   | - Session Key Enforcer  |   | - Google Chat / Slack Bot Pay    |   |
|   |  - zk-SNARK Redaction |   | - Paymaster Sponsorship |   | - WebLN / Lightning L402 / Base  |   |
|   +-----------------------+   +-------------------------+   +----------------------------------+   |
+----------------------------------------------------------------------------------------------------+
          |                                  |                                   |
          v                                  v                                   v
+-----------------------+      +---------------------------+       +-----------------------------+
| AI AGENT & SKILL TIER |      | MULTI-WALLET CONNECTIVITY |       |  ENTERPRISE WORKSPACE SYNC  |
|                       |      |                           |       |                             |
| [ Gemini 2.5 Pro ]    |      | [ MetaMask / EVM ]        |       | [ Google Sheets Audit Log ] |
|  - Function Calling   |      | [ Phantom / Solana ]      |       | [ Google Drive JSON Vault ] |
| [ Claude 3.7 Sonnet ] |      | [ Coinbase Smart Wallet ] |       | [ Google Calendar Alarms ]  |
|  - Tool Use & MCP     |      | [ ERC-6551 TBA Vaults ]   |       | [ Google Contacts Picker ]  |
| [ Markdown SKILL.md ] |      | [ WalletConnect v2 ]      |       | [ Google Meet Sync Review ] |
+-----------------------+      +---------------------------+       +-----------------------------+
```

---

## 3. Core Component Specifications / 各コンポーネント詳細仕様

### 3.1 Vue 3 / Vite SDK Integration (`@awallet/vue-sdk`)

#### English
Vue 3 applications connect to AWallet via the `useAWallet()` composable, exposing reactive state for active DIDs, soulbound tokens, token-bound account balances, and automated signing hooks.

#### 日本語
Vue 3 アプリケーションは `useAWallet()` コンポーザブルを通じて AWallet に接続し、アクティブなDID、SBTバッジ、TBAスマートアカウント残高、および自律署名フックのリアクティブな状態を購読できます。

```typescript
// Example Vue 3 Composable Usage / Vue 3 実装例
import { defineComponent, onMounted } from 'vue';
import { useAWallet } from '@awallet/vue-sdk';

export default defineComponent({
  name: 'AgentIdentityWidget',
  setup() {
    const { 
      isConnected, 
      activeDid, 
      sbtCertificates, 
      tbaBalance, 
      connectAWallet, 
      presentSelectiveProof,
      executeChatPay 
    } = useAWallet({
      network: 'base-mainnet',
      projectId: 'aim3-ai-map-project',
      autoConnect: true
    });

    const handleSendProof = async (recipient: string) => {
      const presentation = await presentSelectiveProof({
        credentialIds: ['did-agent-core-01'],
        disclosedClaims: ['model_arch', 'autonomy_level'],
        recipient,
        ttlMinutes: 60,
        enableZK: true,
      });
      console.log('Verifiable Presentation Generated:', presentation);
    };

    return { isConnected, activeDid, sbtCertificates, tbaBalance, connectAWallet, handleSendProof };
  }
});
```

---

### 3.2 AI Agent Skill & Tool Calling Integration (Gemini / Claude)

#### English
The MaaS engine exports standards-compliant function calling schemas for **Google Gemini** (`@google/genai`) and **Anthropic Claude** (`tools` definition / Model Context Protocol - MCP). Agents can query credentials, generate zero-knowledge verifiable presentations, and execute micropayments within conversations.

#### 日本語
MaaSエンジンは、**Google Gemini**（`@google/genai`）および**Anthropic Claude**（Tool Use / MCPサーバー）向けに関数呼び出しスキーマを標準提供します。AIエージェントは自律的に自身の証明書を照会し、ゼロ知識開示プレゼンテーションを生成し、チャット決済を実行できます。

#### Gemini Tool Schema / Gemini ツール定義
```json
{
  "name": "present_agent_credential",
  "description": "Selectively present an AI DID, Soulbound Token (SBT), or Token Bound Account (TBA) to an external verifier with zero-knowledge mathematical proof.",
  "parameters": {
    "type": "OBJECT",
    "properties": {
      "credentialId": { "type": "STRING", "description": "ID of credential to present" },
      "recipient": { "type": "STRING", "description": "Verifier DID or email address" },
      "disclosedFields": { "type": "ARRAY", "items": { "type": "STRING" }, "description": "Fields to expose without redaction" },
      "validityMinutes": { "type": "INTEGER", "description": "Time-to-live in minutes" },
      "oneTimeBurn": { "type": "BOOLEAN", "description": "Burn link after first verification" }
    },
    "required": ["credentialId", "recipient"]
  }
}
```

---

### 3.3 Chat Pay & In-Session Micropayments / チャットペイ・セッション決済

#### English
**Chat Pay** enables conversational payments through Google Chat, Slack, Telegram, or embedded chat interfaces:
1. **ERC-4337 Session Keys**: Grants the AI agent a deterministic daily budget (e.g. 0.25 ETH or $50 USDC) without requiring manual biometric confirmation for each micro-tx.
2. **L402 / WebLN Protocol**: Native Bitcoin Lightning Network micropayments for inference token accounting.
3. **Stripe Agent Toolkit**: Direct fiat-to-token settlement rails.

#### 日本語
**Chat Pay**は、Google Chat、Slack、Telegram、またはWeb埋め込みチャット内で即時マイクロペイメントを実現します：
1. **ERC-4337 セッションキー**: 毎回の確認不要で、AIエージェントに事前認可された日次予算（例: 0.25 ETH または $50 USDC）を付与。
2. **L402 / WebLN プロトコル**: トークン推論課金に対応したビットコイン・ライトニング決済。
3. **Stripe Agent Toolkit**: 法定通貨と暗号資産の双方向自動決済レール。

---

### 3.4 Multi-Wallet Connectivity / 他のウォレット連携仕様

#### English
AWallet acts as an Account Abstraction layer that binds multiple external wallets via EIP-6551:
- **MetaMask / EVM**: Browser extension & mobile deep linking (EIP-1193).
- **Phantom / Solana**: Cross-chain Solana AI agent identity bridge.
- **Coinbase Smart Wallet**: Passkey / WebAuthn biometric zero-seed phrase onboarding.
- **WalletConnect v2**: Universal QR code pairing across 300+ crypto wallets.

#### 日本語
AWalletは、ERC-6551を通じて複数の外部ウォレットを統合するアカウント抽象化ハブとして機能します：
- **MetaMask / EVM**: ブラウザ拡張機能およびモバイルディープリンク（EIP-1193）。
- **Phantom / Solana**: ソラナエコシステム向けクロスチェーンAIエージェントブリッジ。
- **Coinbase Smart Wallet**: パスキー（Passkey/WebAuthn）によるシードフレーズ不要の生体認証。
- **WalletConnect v2**: 300種類以上のウォレットと接続可能な汎用QRペアリング。
