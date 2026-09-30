import React, { useState } from 'react';
import {
  X,
  Cpu,
  Layers,
  Code2,
  FileCode,
  Share2,
  Wallet,
  Sparkles,
  Bot,
  Copy,
  Check,
  Languages,
  ArrowRight,
  Shield,
  CreditCard,
  MessageSquare,
  CheckCircle2,
  Send,
  ExternalLink,
  Flame,
} from 'lucide-react';
import {
  GEMINI_TOOL_DEFINITIONS,
  CLAUDE_TOOL_DEFINITIONS,
  VUE3_SDK_CODE_SAMPLE,
  INITIAL_EXTERNAL_WALLETS,
  executeChatPayRequest,
  ChatPayTransaction,
  PaymentRail,
} from '../services/maasAgentSdk';

interface MaaSArchitectureModalProps {
  onClose: () => void;
  didSubject: string;
  tbaAddress?: string;
}

export const MaaSArchitectureModal: React.FC<MaaSArchitectureModalProps> = ({
  onClose,
  didSubject,
  tbaAddress = '0x7F92cB3176B3f7A39eD9D1083e9Fe0A027117C38',
}) => {
  const [lang, setLang] = useState<'ja' | 'en'>('ja');
  const [activeTab, setActiveTab] = useState<'blueprint' | 'vue_sdk' | 'ai_skills' | 'chat_pay' | 'multi_wallet'>('blueprint');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Chat Pay Playground State
  const [payAmount, setPayAmount] = useState('0.025');
  const [payRecipient, setPayRecipient] = useState('audit-committee.eth');
  const [payMemo, setPayMemo] = useState('Inference Token Verification Quota');
  const [payRail, setPayRail] = useState<PaymentRail>('ERC4337_TBA');
  const [isPaying, setIsPaying] = useState(false);
  const [recentPayTx, setRecentPayTx] = useState<ChatPayTransaction | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestChatPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPaying(true);
    try {
      const tx = await executeChatPayRequest({
        amount: `${payAmount} ${payRail === 'WEBLN_LIGHTNING' ? 'SATS' : payRail === 'STRIPE_AGENT_PAY' ? 'USD' : 'ETH'}`,
        recipient: payRecipient,
        memo: payMemo,
        rail: payRail,
        tbaAddress,
      });
      setRecentPayTx(tx);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl overflow-y-auto">
      <div
        className="relative w-full max-w-5xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl shadow-cyan-950/50 overflow-hidden my-6 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient Accent */}
        <div className="h-2 w-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/60">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {lang === 'ja'
                    ? 'AWallet MaaS 設計図 & AI エージェント連携仕様'
                    : 'AWallet MaaS Architecture Blueprint & AI Agent Spec'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Vue 3 • Gemini • Claude • Chat Pay
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'ja'
                  ? 'Vue 3 / Vite 向け SDK、Gemini / Claude 用 Skill (md)、マルチウォレット及びチャット決済の統合仕様書'
                  : 'Architecture blueprint, Vue 3 / Vite SDK, Gemini & Claude skills, multi-wallet & in-chat micro-settlement'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bilingual Switcher */}
            <button
              onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
              title="Toggle Language / 言語切替"
            >
              <Languages className="w-3.5 h-3.5 text-cyan-400" />
              <span>{lang === 'ja' ? 'English' : '日本語'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-2 border-b border-slate-800 bg-slate-950/40 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`pb-3 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'blueprint'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{lang === 'ja' ? 'システム設計図 (Blueprint)' : 'System Blueprint'}</span>
          </button>

          <button
            onClick={() => setActiveTab('vue_sdk')}
            className={`pb-3 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'vue_sdk'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>{lang === 'ja' ? 'Vue 3 / Vite SDK (Composable)' : 'Vue 3 / Vite SDK'}</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_skills')}
            className={`pb-3 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ai_skills'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>{lang === 'ja' ? 'AI Agent 連携 (Gemini / Claude)' : 'AI Agent Skills'}</span>
          </button>

          <button
            onClick={() => setActiveTab('chat_pay')}
            className={`pb-3 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'chat_pay'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>{lang === 'ja' ? 'Chat Pay (チャット内決済)' : 'Chat Pay Settlement'}</span>
          </button>

          <button
            onClick={() => setActiveTab('multi_wallet')}
            className={`pb-3 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'multi_wallet'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>{lang === 'ja' ? 'マルチウォレット連携' : 'Multi-Wallet Adapters'}</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: BLUEPRINT */}
          {activeTab === 'blueprint' && (
            <div className="space-y-6">
              {/* Architecture Visual Diagram Card */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>
                      {lang === 'ja'
                        ? 'AWallet MaaS 全体アーキテクチャ・データフロー'
                        : 'AWallet MaaS End-to-End Dataflow Diagram'}
                    </span>
                  </h3>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded border border-cyan-800">
                    JSON-RPC 2.0 • WebSockets • ERC-4337
                  </span>
                </div>

                {/* Visual Block Diagram */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  {/* Client */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/40 space-y-2">
                    <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold">
                      1. Client Layer
                    </div>
                    <div className="font-semibold text-white">Vue 3 + Vite SPA</div>
                    <p className="text-[11px] text-slate-400">
                      {lang === 'ja'
                        ? 'useAWallet() コンポーザブルによるリアクティブ認証と証明書スタック'
                        : 'useAWallet() composable with reactive DID state & 3D holographic deck'}
                    </p>
                  </div>

                  {/* Gateway */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-purple-500/40 space-y-2">
                    <div className="text-[10px] font-mono uppercase text-purple-400 font-bold">
                      2. MaaS Gateway
                    </div>
                    <div className="font-semibold text-white">Account Abstraction</div>
                    <p className="text-[11px] text-slate-400">
                      {lang === 'ja'
                        ? 'W3C DID署名エンジン、ERC-4337バンドラー、ZKゼロ知識開示処理'
                        : 'W3C DID signer, ERC-4337 bundler, and ZK-proof selective disclosure'}
                    </p>
                  </div>

                  {/* AI & Chat Pay */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-2">
                    <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                      3. AI Agent & Pay
                    </div>
                    <div className="font-semibold text-white">Gemini / Claude / Pay</div>
                    <p className="text-[11px] text-slate-400">
                      {lang === 'ja'
                        ? 'SKILL.md 準拠のツール呼出、WebLN/TBAによるチャット内即時決済'
                        : 'SKILL.md function calling, in-chat micropayments via WebLN & TBA session keys'}
                    </p>
                  </div>

                  {/* Workspace Sync */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-blue-500/40 space-y-2">
                    <div className="text-[10px] font-mono uppercase text-blue-400 font-bold">
                      4. Enterprise
                    </div>
                    <div className="font-semibold text-white">Google Workspace</div>
                    <p className="text-[11px] text-slate-400">
                      {lang === 'ja'
                        ? 'Sheets監査台帳、Drive暗号化保管、Calendar期限アラーム、Meet検証'
                        : 'Sheets audit trail, Drive vault backup, Calendar watchdogs, Meet spaces'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical Specifications Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span>{lang === 'ja' ? 'アイデンティティと証明書仕様' : 'Identity & Certificate Spec'}</span>
                  </h4>
                  <ul className="space-y-2 text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>W3C DID v2.0:</strong> {lang === 'ja' ? 'Ed25519鍵ペアによる改ざん不能な自律AI署名。' : 'Cryptographically tamper-proof AI agent signatures via Ed25519.'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>EIP-5192 Soulbound (SBT):</strong> {lang === 'ja' ? 'AIの倫理認証や安全性クリアランスをDIDに恒久ロック。' : 'Irrevocably binds AI safety & alignment credentials to the agent DID.'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>ERC-6551 Token Bound Accounts:</strong> {lang === 'ja' ? 'NFT/DID自身が資産・ガスを保有し契約を自律実行。' : 'Enables the AI agent identity to hold assets, gas limits, and execute calls.'}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>{lang === 'ja' ? 'チャット決済 & マルチウォレット仕様' : 'Chat Pay & Multi-Wallet Spec'}</span>
                  </h4>
                  <ul className="space-y-2 text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Chat Pay Rails:</strong> {lang === 'ja' ? 'ERC-4337セッションキー（日次ガス枠）、WebLN（Lightning）、Stripe Agent。' : 'ERC-4337 session keys (daily gas caps), WebLN Lightning, and Stripe Agent.'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Multi-Wallet Connector:</strong> {lang === 'ja' ? 'MetaMask、Phantom (Solana)、Coinbase Passkey、WalletConnect v2。' : 'MetaMask, Phantom (Solana), Coinbase Passkey, and WalletConnect v2.'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Zero-Knowledge Proofs:</strong> {lang === 'ja' ? '秘密属性を一切平文露出することなく、検証者に正当性を数学的証明。' : 'Mathematically proves claims without exposing sensitive attribute plaintexts.'}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VUE 3 / VITE SDK */}
          {activeTab === 'vue_sdk' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {lang === 'ja' ? 'Vue 3 Composition API: useAWallet() 実装コード' : 'Vue 3 Composition API: useAWallet() SDK Code'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {lang === 'ja'
                      ? 'Vue 3 + Vite プロジェクトに即座に組み込める完全な Composable 実装です。'
                      : 'Drop-in Vue 3 Composable for sovereign AI wallet connections and presentations.'}
                  </p>
                </div>

                <button
                  onClick={() => handleCopy(VUE3_SDK_CODE_SAMPLE, 'vue_sdk')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {copiedKey === 'vue_sdk' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'vue_sdk' ? (lang === 'ja' ? 'コピー完了' : 'Copied!') : (lang === 'ja' ? 'コードをコピー' : 'Copy Code')}</span>
                </button>
              </div>

              {/* Code display */}
              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto max-h-[460px]">
                {VUE3_SDK_CODE_SAMPLE}
              </pre>

              {/* Quick Install Snippet */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">npm install @awallet/vue-sdk @awallet/core ethers</span>
                <button
                  onClick={() => handleCopy('npm install @awallet/vue-sdk @awallet/core ethers', 'npm')}
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  {copiedKey === 'npm' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: AI SKILLS & TOOLS (GEMINI / CLAUDE) */}
          {activeTab === 'ai_skills' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {lang === 'ja' ? 'AI エージェント向け Skill & 関数呼出スキーマ' : 'AI Agent Skill & Function Calling Schemas'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'ja'
                    ? 'Google Gemini および Anthropic Claude が自律的に証明書を提示し、Chat Pay を実行できる定義です。'
                    : 'Universal function calling schemas and SKILL.md specs for Gemini and Claude.'}
                </p>
              </div>

              {/* Gemini Schema */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                    <h4 className="text-xs font-bold text-white">Google Gemini Tools (`@google/genai`)</h4>
                  </div>
                  <button
                    onClick={() => handleCopy(JSON.stringify(GEMINI_TOOL_DEFINITIONS, null, 2), 'gemini')}
                    className="text-cyan-400 hover:text-cyan-300 text-xs font-mono flex items-center gap-1"
                  >
                    {copiedKey === 'gemini' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'gemini' ? 'Copied' : 'Copy Gemini Schema'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300 max-h-52 overflow-y-auto">
                  {JSON.stringify(GEMINI_TOOL_DEFINITIONS, null, 2)}
                </pre>
              </div>

              {/* Claude Schema */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                    <h4 className="text-xs font-bold text-white">Anthropic Claude Tools (MCP Server Compatible)</h4>
                  </div>
                  <button
                    onClick={() => handleCopy(JSON.stringify(CLAUDE_TOOL_DEFINITIONS, null, 2), 'claude')}
                    className="text-purple-400 hover:text-purple-300 text-xs font-mono flex items-center gap-1"
                  >
                    {copiedKey === 'claude' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'claude' ? 'Copied' : 'Copy Claude Schema'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-purple-300 max-h-52 overflow-y-auto">
                  {JSON.stringify(CLAUDE_TOOL_DEFINITIONS, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: CHAT PAY INTERACTIVE TESTER */}
          {activeTab === 'chat_pay' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {lang === 'ja' ? 'Chat Pay 即時決済シミュレーター' : 'Chat Pay Micro-Settlement Simulator'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {lang === 'ja'
                      ? 'ERC-4337 セッションキー、WebLN ライトニング、または Stripe Agent を通じた会話内決済テスト'
                      : 'Test live in-chat micropayments via ERC-4337 session keys, WebLN, or Stripe Agent Rail'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>TBA Balance: 4.85 ETH</span>
                </div>
              </div>

              {/* Payment form */}
              <form onSubmit={handleTestChatPay} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Payment Rail</label>
                    <select
                      value={payRail}
                      onChange={(e) => setPayRail(e.target.value as PaymentRail)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="ERC4337_TBA">ERC-4337 TBA (Session Key)</option>
                      <option value="WEBLN_LIGHTNING">WebLN (Bitcoin Lightning L402)</option>
                      <option value="STRIPE_AGENT_PAY">Stripe Agent Pay (USD Card)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Amount</label>
                    <input
                      type="text"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="0.025"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Recipient Address / DID</label>
                    <input
                      type="text"
                      value={payRecipient}
                      onChange={(e) => setPayRecipient(e.target.value)}
                      placeholder="audit-committee.eth"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Invoice Memo / Agent Task</label>
                  <input
                    type="text"
                    value={payMemo}
                    onChange={(e) => setPayMemo(e.target.value)}
                    placeholder="e.g. Autonomous GPU Inference Settlement"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-400 font-mono">
                    Autonomous Session Key Limit: 0.25 ETH / day
                  </div>

                  <button
                    type="submit"
                    disabled={isPaying}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${isPaying ? 'animate-bounce' : ''}`} />
                    <span>{isPaying ? 'Broadcasting Settlement...' : 'Execute In-Chat Payment'}</span>
                  </button>
                </div>
              </form>

              {/* Settlement Receipt */}
              {recentPayTx && (
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{lang === 'ja' ? '決済完了 (Settled on-chain)' : 'Settlement Succeeded'}</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-300">{recentPayTx.txId}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="p-2 bg-slate-900 rounded-lg">
                      <div className="text-[10px] text-slate-400">Amount</div>
                      <div className="text-white font-bold">{recentPayTx.amount}</div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg">
                      <div className="text-[10px] text-slate-400">Rail</div>
                      <div className="text-cyan-300">{recentPayTx.rail}</div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg col-span-2">
                      <div className="text-[10px] text-slate-400">Cryptographic Receipt</div>
                      <div className="text-emerald-400 truncate">{recentPayTx.proofReceipt}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: MULTI-WALLET CONNECTORS */}
          {activeTab === 'multi_wallet' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {lang === 'ja' ? 'マルチウォレット連携ハブ' : 'Multi-Wallet Ecosystem Connectors'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'ja'
                    ? 'AWallet は ERC-6551 TBA により、MetaMask、Phantom、Passkey、WalletConnect とシームレスに相互運用可能です。'
                    : 'AWallet interoperates with EVM, Solana, Passkey WebAuthn, and WalletConnect v2 relays.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {INITIAL_EXTERNAL_WALLETS.map((w) => (
                  <div
                    key={w.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl p-2 bg-slate-900 rounded-xl border border-slate-800">
                        {w.icon}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{w.name}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{w.network}</div>
                        {w.address && (
                          <div className="text-[11px] text-cyan-400 font-mono mt-1">
                            Address: {w.address}
                          </div>
                        )}
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                        w.status === 'connected'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {w.status === 'connected' ? 'Connected' : 'Available'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <div className="text-slate-400 font-mono text-[11px] hidden sm:block">
            MaaS Protocol: W3C DID • ERC-6551 • ERC-4337 • WebLN
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={() => {
                const sampleBlob = new Blob([VUE3_SDK_CODE_SAMPLE], { type: 'text/typescript' });
                const url = URL.createObjectURL(sampleBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'useAWallet.ts';
                a.click();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              {lang === 'ja' ? 'useAWallet.ts をダウンロード' : 'Download useAWallet.ts'}
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-md shadow-cyan-500/20"
            >
              {lang === 'ja' ? '閉じる' : 'Close Studio'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
