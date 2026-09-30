import React, { useState } from 'react';
import {
  X,
  Cpu,
  Layers,
  Code2,
  Terminal,
  Share2,
  Wallet,
  Sparkles,
  Bot,
  Copy,
  Check,
  Globe,
  ArrowRight,
  Shield,
  CreditCard,
  CheckCircle2,
  Send,
  ExternalLink,
  Flame,
  Play,
  RefreshCw,
} from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface UnifiedApiSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

interface ApiEndpointDef {
  id: string;
  name: string;
  method: 'GET' | 'POST';
  endpoint: string;
  descriptionEn: string;
  descriptionJa: string;
  payload?: any;
}

export const UnifiedApiSkillModal: React.FC<UnifiedApiSkillModalProps> = ({
  isOpen,
  onClose,
  language,
  onLanguageChange,
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'api' | 'skill'>('api');
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('verify');
  const [isCallingApi, setIsCallingApi] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const endpoints: ApiEndpointDef[] = [
    {
      id: 'credentials',
      name: language === 'ja' ? 'エージェント証明書一覧の取得' : 'Query Agent Credentials',
      method: 'GET',
      endpoint: '/api/amane/credentials',
      descriptionEn: 'Fetches active W3C DIDs, Soulbound attestation tokens, and ERC-6551 accounts.',
      descriptionJa: 'アクティブなW3C DID、ソウルバウンド証明トークン、およびERC-6551スマートアカウントを取得します。',
    },
    {
      id: 'verify',
      name: language === 'ja' ? 'DID / SBT 暗号検証' : 'Cryptographic DID/SBT Verification',
      method: 'POST',
      endpoint: '/api/amane/verify',
      descriptionEn: 'Validates Ed25519 signature proof and integrity against decentralized web nodes.',
      descriptionJa: 'Ed25519暗号署名と整合性を分散型Webノード（DWN）経由で検証します。',
      payload: {
        credentialId: 'did-agent-core-01',
        verificationMethod: 'did:google:ai-verifiable-hub#key-1',
      },
    },
    {
      id: 'present',
      name: language === 'ja' ? 'ゼロ知識選択的開示の生成' : 'Issue ZK Selective Presentation',
      method: 'POST',
      endpoint: '/api/amane/present',
      descriptionEn: 'Generates a W3C Verifiable Presentation with selective attribute redaction.',
      descriptionJa: '不要な機密情報を数学的に隠蔽した選択的ゼロ知識開示プレゼンテーションを生成します。',
      payload: {
        credentialIds: ['did-agent-core-01', 'sbt-safety-02'],
        recipient: 'Foster Verification Committee',
        disclosedClaims: ['model_arch', 'autonomy_level'],
        enableZK: true,
      },
    },
    {
      id: 'pay',
      name: language === 'ja' ? 'セッション決済 / Chat Pay' : 'Session Key Micropayment (Chat Pay)',
      method: 'POST',
      endpoint: '/api/awallet/pay',
      descriptionEn: 'Executes an autonomous micropayment via ERC-4337 Session Key or WebLN rail.',
      descriptionJa: '事前認可されたERC-4337セッションキーまたはWebLNにより自律マイクロ決済を実行します。',
      payload: {
        amount: '0.025 ETH',
        recipient: 'audit-committee.eth',
        rail: 'ERC4337_TBA',
        memo: 'AI Verification Quota',
      },
    },
  ];

  const activeEndpoint = endpoints.find((e) => e.id === selectedEndpointId) || endpoints[0];

  const handleTestApi = async () => {
    setIsCallingApi(true);
    setApiResponse(null);
    try {
      const options: RequestInit = {
        method: activeEndpoint.method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (activeEndpoint.method === 'POST' && activeEndpoint.payload) {
        options.body = JSON.stringify(activeEndpoint.payload);
      }

      const res = await fetch(activeEndpoint.endpoint, options);
      const data = await res.json();
      setApiResponse({
        statusCode: res.status,
        statusText: res.statusText,
        data,
      });
    } catch (err: any) {
      setApiResponse({
        error: err.message || 'Network request failed',
      });
    } finally {
      setIsCallingApi(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const skillMarkdownSample = `---
name: amane-awallet-agent-skill
description: >-
  Interact with Amane Protocol & AWallet Unified Gateway to inspect sovereign AI DIDs,
  Soulbound Tokens (SBT), Token Bound Accounts (TBA), and issue zero-knowledge verifiable proofs.
---

# Unified Amane & AWallet AI Agent Skill (Gemini & Claude Compatible)

## Tool Declarations:
1. awallet_get_credentials: Lists active W3C DIDs, SBTs, and ERC-6551 accounts.
2. awallet_present_selective_proof: Generates scoped ZK verifiable presentation.
3. awallet_chat_pay_request: Settles in-chat micropayment via ERC-4337 Session Key.
`;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-3xl bg-gradient-to-b from-zinc-900 to-black border border-zinc-700/80 shadow-2xl shadow-black overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle silver gradient accent */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-white/80 to-transparent" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {t.apiGatewayTitle}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-white/10 text-zinc-200 border border-white/20">
                  Amane & AWallet
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                {t.apiGatewaySubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onLanguageChange(language === 'en' ? 'ja' : 'en')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'JA' : 'EN'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 sm:px-6 pt-3 border-b border-zinc-800 bg-zinc-950/50 flex gap-4">
          <button
            onClick={() => setActiveTab('api')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'api'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>{t.tabApiGateway}</span>
          </button>
          <button
            onClick={() => setActiveTab('skill')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'skill'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>{t.tabSkillMd}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'api' ? (
            <div className="space-y-6">
              {/* Endpoint Selector Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {endpoints.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => {
                      setSelectedEndpointId(ep.id);
                      setApiResponse(null);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedEndpointId === ep.id
                        ? 'bg-zinc-800 border-white text-white shadow-md'
                        : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          ep.method === 'GET'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {ep.method}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-zinc-100 line-clamp-1">
                      {ep.name}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500 mt-1 truncate">
                      {ep.endpoint}
                    </div>
                  </button>
                ))}
              </div>

              {/* Active Endpoint Details & Live Test Panel */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-inner">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          activeEndpoint.method === 'GET'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {activeEndpoint.method}
                      </span>
                      <span className="text-xs font-mono text-white font-semibold">
                        {activeEndpoint.endpoint}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      {language === 'ja' ? activeEndpoint.descriptionJa : activeEndpoint.descriptionEn}
                    </p>
                  </div>

                  <button
                    onClick={handleTestApi}
                    disabled={isCallingApi}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50 shrink-0 shadow"
                  >
                    {isCallingApi ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{t.testingEndpoint}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{t.testEndpoint}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Payload if POST */}
                {activeEndpoint.payload && (
                  <div>
                    <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Request Payload:
                    </div>
                    <pre className="p-3 bg-black/80 border border-zinc-800 rounded-xl text-[11px] font-mono text-zinc-300 overflow-x-auto">
                      {JSON.stringify(activeEndpoint.payload, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Response Visualizer */}
                {apiResponse && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Live API Response ({apiResponse.statusCode || 200}):
                      </span>
                      <button
                        onClick={() => handleCopy(JSON.stringify(apiResponse, null, 2), 'response')}
                        className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedKey === 'response' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'response' ? t.copied : 'Copy JSON'}</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-black border border-zinc-700/80 rounded-xl text-[11px] font-mono text-emerald-400/90 overflow-x-auto max-h-56">
                      {JSON.stringify(apiResponse, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Skill.md Overview */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      {t.skillSpecTitle}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {t.skillSpecSubtitle}
                    </p>
                  </div>

                  <button
                    onClick={() => handleCopy(skillMarkdownSample, 'skill')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-all shrink-0"
                  >
                    {copiedKey === 'skill' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'skill' ? t.copied : t.copyJsonSchema}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-black/60 border border-zinc-800 rounded-xl">
                    <div className="text-xs font-mono font-bold text-white mb-1">
                      awallet_get_credentials
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      {language === 'ja'
                        ? '自律エージェントが保有するW3C DID、SBT、TBAの一覧を全件照会。'
                        : 'Retrieves all registered DIDs, Soulbound tokens, and TBAs owned by the agent.'}
                    </p>
                  </div>

                  <div className="p-3 bg-black/60 border border-zinc-800 rounded-xl">
                    <div className="text-xs font-mono font-bold text-white mb-1">
                      awallet_present_selective_proof
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      {language === 'ja'
                        ? '指定属性のみを開示し、残りをZK暗号化した証明書を生成。'
                        : 'Generates a verifiable presentation with attribute-level zero-knowledge redaction.'}
                    </p>
                  </div>

                  <div className="p-3 bg-black/60 border border-zinc-800 rounded-xl">
                    <div className="text-xs font-mono font-bold text-white mb-1">
                      awallet_chat_pay_request
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      {language === 'ja'
                        ? 'ERC-4337セッションキーによるチャット内自律マイクロ決済。'
                        : 'Executes conversational micropayments via pre-authorized ERC-4337 Session Keys.'}
                    </p>
                  </div>
                </div>

                <pre className="p-3 bg-black border border-zinc-800 rounded-xl text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-64">
                  {skillMarkdownSample}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Amane Gateway & AWallet API: Online</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
