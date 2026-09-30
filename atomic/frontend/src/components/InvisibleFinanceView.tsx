import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Bluetooth, 
  BluetoothConnected, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Fingerprint, 
  RotateCcw, 
  Plus, 
  Cpu, 
  ShieldAlert, 
  ShieldCheck,
  Code2,
  FileText,
  Copy,
  X,
  Sparkles,
  ExternalLink,
  Clock,
  Ban,
  CheckSquare,
  Square
} from 'lucide-react';
import { InvisibleAction, InvisibleTier } from '../types';
import { TIER_INFO } from '../services/mockChain';
import { BiometricAuthModal } from '../components/BiometricAuthModal';
import { SlideToConfirm } from '../components/SlideToConfirm';

interface InvisibleFinanceViewProps {
  actions: InvisibleAction[];
  bleConnected: boolean;
  blePairing: boolean;
  onConnectBle: () => void;
  onDisconnectBle: () => void;
  /**
   * viaTap=true means "approve with the Pico W key": the parent MUST run the real hardware flow
   * (services/picoBle.ts + server verification) and must never trust this flag by itself.
   */
  onApproveAction: (id: string, viaTap: boolean) => Promise<void>;
  /** Real, server-verified WebAuthn assertion for Tier 3/4/5 actions (see services/atomicApi.ts). */
  onAuthenticate: (action: InvisibleAction) => Promise<void>;
  onCancelAction?: (id: string) => void;
  onResetActions: () => void;
  onSimulateNewProposal: () => void;
  onBack: () => void;
  userAddress?: string;
  userDid?: string;
}

export const InvisibleFinanceView: React.FC<InvisibleFinanceViewProps> = ({
  actions,
  bleConnected,
  blePairing,
  onConnectBle,
  onDisconnectBle,
  onApproveAction,
  onAuthenticate,
  onCancelAction,
  onResetActions,
  onSimulateNewProposal,
  onBack,
  userAddress,
  userDid,
}) => {
  const [lang, setLang] = useState<'ja' | 'en'>('ja');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [biometricAction, setBiometricAction] = useState<InvisibleAction | null>(null);
  const [activeJsonId, setActiveJsonId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false);

  const awaitingCount = actions.filter((a) => a.status === 'awaiting').length;

  const handleApprove = async (id: string, viaTap: boolean) => {
    setProcessingId(id);
    try {
      await onApproveAction(id, viaTap);
    } finally {
      setProcessingId(null);
    }
  };

  const isJa = lang === 'ja';

  const copyProposalJson = (action: InvisibleAction) => {
    const jsonPayload = {
      destination: action.destination || action.target || 'Unspecified Address',
      amountLabel: action.amountLabel || action.amount,
      reason: (!isJa && action.reasonEn) ? action.reasonEn : (action.reason || action.desc),
      whyApprovalNeeded: (!isJa && action.whyApprovalNeededEn) 
        ? action.whyApprovalNeededEn 
        : (action.whyApprovalNeeded || 'Policy Engine tier verification required'),
    };
    navigator.clipboard?.writeText(JSON.stringify(jsonPayload, null, 2));
    setCopiedId(action.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-1 h-12 border-b border-zinc-900">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-zinc-400 hover:text-white transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Brand with ◉ Icon */}
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold select-none shadow leading-none">
            ◉
          </div>
          <span className="font-semibold text-sm text-white tracking-tight">Tive ◉AI</span>
        </div>

        {/* Right Actions: System Prompt Spec & Language Switcher */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setShowPromptModal(true)}
            title={isJa ? 'Tive ◉AI システムプロンプト仕様' : 'Tive ◉AI System Prompt Spec'}
            className="p-1 rounded-lg text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800 text-[11px] font-mono flex items-center space-x-1 transition-colors px-2 py-0.5"
          >
            <FileText size={12} />
            <span className="hidden sm:inline">{isJa ? 'AI仕様' : 'Spec'}</span>
          </button>

          {/* Language Switcher (JA / EN) */}
          <div className="flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono">
            <button
              onClick={() => setLang('ja')}
              className={`px-2 py-0.5 rounded transition-all ${
                isJa ? 'bg-white text-black font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              JA
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 rounded transition-all ${
                !isJa ? 'bg-white text-black font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Policy Engine Overview Card (Concise & Minimal Text) */}
      <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-white">
              {isJa ? 'Tive ◉AI 自律オーケストレーション' : 'Tive ◉AI Autonomous Orchestration'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-purple-300 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-800/60 font-semibold">
            Tier 5 Gate → Tier 1–4 Gated
          </span>
        </div>

        <p className="text-xs text-zinc-400 leading-snug">
          {isJa
            ? 'Gemini基盤のオーケストレーション層。秘密鍵・実行権限を持たず、Policy Engineの決定論的ルールに従って提案します。規制商品（STO/CFD/電力）は前置ゲート「Tier 5」で適格性を厳格検査します。'
            : 'Gemini orchestration layer. Holds no private keys. Proposes actions evaluated deterministically by Policy Engine, with Tier 5 regulatory gating for STO/CFD/Power.'}
        </p>

        {/* 5 Tier Architecture Flow & Badges */}
        <div className="space-y-1.5 pt-0.5">
          {/* Tier 5 Pre-gate Banner */}
          <div className="px-2.5 py-1.5 rounded-xl bg-purple-950/40 border border-purple-800/60 text-purple-200 flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-purple-300">T5 前置ゲート</span>
              <span className="text-zinc-300">{isJa ? '規制商品適格性 (年額5万円〜 特別会員限定)' : 'Regulatory Gate (Executive ¥50k/yr)'}</span>
            </div>
            <span className="text-[10px] text-purple-400 font-semibold">{isJa ? 'STO・CFD・電力' : 'STO / CFD / Power'}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-mono">
            <div className="px-2 py-1 rounded bg-zinc-900/80 border border-zinc-800/80 text-emerald-400 flex items-center justify-between">
              <span>T1</span>
              <span className="text-zinc-400">{isJa ? '自動実行' : 'Auto'}</span>
            </div>
            <div className="px-2 py-1 rounded bg-zinc-900/80 border border-zinc-800/80 text-blue-400 flex items-center justify-between">
              <span>T2</span>
              <span className="text-zinc-400">{isJa ? 'Pico W' : 'Pico W'}</span>
            </div>
            <div className="px-2 py-1 rounded bg-zinc-900/80 border border-zinc-800/80 text-amber-400 flex items-center justify-between">
              <span>T3</span>
              <span className="text-zinc-400">{isJa ? '本人署名' : 'Sign'}</span>
            </div>
            <div className="px-2 py-1 rounded bg-zinc-900/80 border border-zinc-800/80 text-rose-400 flex items-center justify-between">
              <span>T4</span>
              <span className="text-zinc-400">{isJa ? '安全停止' : 'Blocked'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pico W BLE Pairing Card */}
      <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors shrink-0 ${
              bleConnected 
                ? 'bg-white text-black border-white' 
                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
            }`}
          >
            {blePairing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : bleConnected ? (
              <BluetoothConnected size={16} />
            ) : (
              <Bluetooth size={16} />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <h3 className="text-xs font-semibold text-white">
                {isJa ? 'Pico W 承認キー' : 'Pico W Key'}
              </h3>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full border ${
                  bleConnected
                    ? 'bg-blue-950/80 text-blue-400 border-blue-800/60'
                    : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                }`}
              >
                {bleConnected ? (isJa ? '接続中' : 'Connected') : (isJa ? '未接続' : 'Disconnected')}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono truncate mt-0.5">
              {bleConnected
                ? (isJa ? 'GP15 タクトスイッチ待機' : 'GP15 Button ready')
                : (isJa ? 'ワンタップでBluetoothペアリング' : 'Tap to pair Bluetooth')}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          {bleConnected ? (
            <button
              onClick={onDisconnectBle}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              {isJa ? '切断' : 'Disconnect'}
            </button>
          ) : (
            <button
              onClick={onConnectBle}
              disabled={blePairing}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center space-x-1.5 shadow"
            >
              {blePairing && <Loader2 size={12} className="animate-spin" />}
              <span>{blePairing ? (isJa ? '接続中…' : 'Connecting…') : (isJa ? '接続' : 'Connect')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Actions Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
              {isJa ? '承認カード (ApprovalCards)' : 'PROPOSED APPROVAL CARDS'}
            </h2>
            {awaitingCount > 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-black font-semibold">
                {awaitingCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 font-mono text-[11px]">
            <button
              onClick={onSimulateNewProposal}
              className="text-zinc-400 hover:text-white flex items-center space-x-1 transition-colors px-2 py-1 rounded bg-zinc-900/60 border border-zinc-900 hover:border-zinc-800"
            >
              <Plus size={11} />
              <span>{isJa ? '提案追加' : 'Add'}</span>
            </button>
            <button
              onClick={onResetActions}
              className="text-zinc-400 hover:text-white flex items-center space-x-1 transition-colors px-2 py-1 rounded bg-zinc-900/60 border border-zinc-900 hover:border-zinc-800"
            >
              <RotateCcw size={11} />
              <span>{isJa ? 'リセット' : 'Reset'}</span>
            </button>
          </div>
        </div>

        {/* Action Cards List */}
        <div className="space-y-2.5">
          {actions.map((action) => {
            const tierMeta = TIER_INFO[action.tier];
            const isProcessing = processingId === action.id;
            const description = (!isJa && action.descEn) ? action.descEn : action.desc;
            const reason = (!isJa && action.reasonEn) ? action.reasonEn : (action.reason || action.desc);
            const whyApproval = (!isJa && action.whyApprovalNeededEn) 
              ? action.whyApprovalNeededEn 
              : action.whyApprovalNeeded;
            const isJsonOpen = activeJsonId === action.id;

            const jsonPayload = {
              destination: action.destination || action.target || '0xRecipient...',
              amountLabel: action.amountLabel || action.amount,
              reason: reason,
              whyApprovalNeeded: whyApproval || 'Deterministic Policy Engine Evaluation',
            };

            return (
              <div
                key={action.id}
                className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-all space-y-3 shadow-sm"
              >
                {/* Tier & Amount Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${tierMeta.badgeColor}`}
                    >
                      {tierMeta.label}: {isJa ? tierMeta.descJa : tierMeta.descEn}
                    </span>
                    {action.category && (
                      <span className="text-[10px] font-mono text-zinc-500">
                        {action.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-mono font-bold text-white tabular-nums">
                      {action.amountLabel || action.amount}
                    </span>
                    <button
                      onClick={() => setActiveJsonId(isJsonOpen ? null : action.id)}
                      title={isJa ? 'Tive ◉AI 出力JSON' : 'Tive ◉AI Output JSON'}
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors flex items-center space-x-1 ${
                        isJsonOpen
                          ? 'bg-blue-950 border-blue-800 text-blue-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Code2 size={11} />
                      <span>JSON</span>
                    </button>
                  </div>
                </div>

                {/* Description & Destination */}
                <div>
                  <h3 className="text-xs font-semibold text-white leading-snug">
                    {description}
                  </h3>
                  {action.destination && (
                    <div className="text-[11px] font-mono text-zinc-400 mt-1 flex items-center space-x-1">
                      <span className="text-zinc-500">送り先 (destination):</span>
                      <span className="text-zinc-200 truncate">{action.destination}</span>
                    </div>
                  )}
                  <p className="text-[11px] text-zinc-500 mt-1 font-mono flex items-center space-x-1.5">
                    <span>発議: {action.initiatedBy}</span>
                    {action.timestamp && (
                      <>
                        <span>·</span>
                        <span>{action.timestamp}</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Structured Tive ◉AI Reason & Policy Engine WhyApprovalNeeded */}
                <div className="space-y-1.5 text-[11px]">
                  {/* Reason based on user statement */}
                  {reason && (
                    <div className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-900 text-zinc-300 space-y-0.5">
                      <span className="text-[10px] font-mono text-zinc-400 font-semibold block">
                        {isJa ? '【提案根拠 (reason)】' : '[Proposal Reason]'}
                      </span>
                      <p className="leading-snug text-zinc-300">
                        {reason}
                      </p>
                    </div>
                  )}

                  {/* Why Approval Needed (Mandatory for Tier 2, 3, 4, 5) */}
                  {whyApproval && (
                    <div
                      className={`p-2 rounded-xl border space-y-0.5 ${
                        action.tier === 5 && action.status === 'rejected_tier5'
                          ? 'bg-purple-950/40 border-purple-800/80 text-purple-200'
                          : action.tier === 5
                          ? 'bg-purple-950/20 border-purple-800/50 text-purple-200'
                          : action.tier === 4
                          ? 'bg-rose-950/20 border-rose-900/50 text-rose-200'
                          : action.tier === 3
                          ? 'bg-amber-950/20 border-amber-900/50 text-amber-200'
                          : 'bg-blue-950/20 border-blue-900/50 text-blue-200'
                      }`}
                    >
                      <span
                        className={`text-[10px] font-mono font-semibold block ${
                          action.tier === 5 && action.status === 'rejected_tier5'
                            ? 'text-rose-400'
                            : action.tier === 5
                            ? 'text-purple-300'
                            : action.tier === 4
                            ? 'text-rose-400'
                            : action.tier === 3
                            ? 'text-amber-400'
                            : 'text-blue-400'
                        }`}
                      >
                        {action.tier === 5
                          ? (isJa ? '【Tier 5 規制商品ゲート判定】' : '[Tier 5 Regulatory Gate Evaluation]')
                          : (isJa ? '【承認が必要な理由 (whyApprovalNeeded)】' : '[Why Approval Needed]')}
                      </span>
                      <p className="leading-snug">
                        {whyApproval}
                      </p>
                    </div>
                  )}

                  {/* Tier 5 Check Breakdown & ApprovalCard v2 if present */}
                  {action.tier === 5 && action.tier5Check && (
                    <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-900/50 space-y-2.5 text-[11px] font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-300 font-bold flex items-center space-x-1">
                          <ShieldCheck size={12} />
                          <span>{isJa ? 'Tier 5 決定論的チェック項目' : 'Tier 5 Deterministic Audit Checks'}</span>
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {action.tier5CardData?.actionType ? `Type: ${action.tier5CardData.actionType.toUpperCase()}` : (isJa ? '特別会員枠' : 'Executive')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                        <div className={`p-1.5 rounded-lg border flex items-center justify-between ${
                          action.tier5Check.isExecutiveMember ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                        }`}>
                          <span>1. 会員資格 (5万円〜)</span>
                          <span>{action.tier5Check.isExecutiveMember ? '✓ PASS' : '✗ FAIL'}</span>
                        </div>
                        <div className={`p-1.5 rounded-lg border flex items-center justify-between ${
                          action.tier5Check.productClassificationPass ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                        }`}>
                          <span>2. 変動リターン型</span>
                          <span>{action.tier5Check.productClassificationPass ? '✓ PASS' : '✗ FAIL'}</span>
                        </div>
                        <div className={`p-1.5 rounded-lg border flex items-center justify-between ${
                          action.tier5Check.statementSanityPass ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                        }`}>
                          <span>3. 表示文言スキャン</span>
                          <span>{action.tier5Check.statementSanityPass ? '✓ PASS' : '✗ FAIL'}</span>
                        </div>
                        <div className={`p-1.5 rounded-lg border flex items-center justify-between ${
                          action.tier5Check.licenseStatusPass ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                        }`}>
                          <span>4. ライセンス有効性</span>
                          <span>{action.tier5Check.licenseStatusPass ? '✓ PASS' : '✗ FAIL'}</span>
                        </div>
                      </div>

                      {action.tier5Check.failReason && (
                        <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-200 text-[10px]">
                          <span className="font-bold text-rose-400 block mb-0.5">
                            {isJa ? '【FAIL理由 - 実行不可】' : '[FAIL Reason - Execution Prohibited]'}
                          </span>
                          {isJa ? action.tier5Check.failReason : (action.tier5Check.failReasonEn || action.tier5Check.failReason)}
                        </div>
                      )}

                      {/* Tier 5 ApprovalCard v2 Expanded Metadata */}
                      {action.tier5CardData && (
                        <div className="pt-2 border-t border-purple-900/40 space-y-2 text-[10px]">
                          {/* Mandatory Disclaimer Box */}
                          <div className="p-2 rounded-lg bg-black/60 border border-purple-800/50 space-y-1">
                            <span className="text-purple-300 font-semibold block">
                              {isJa ? '法的免責事項 (必須・省略不可)' : 'Statutory Regulatory Disclaimer'}
                            </span>
                            <p className="text-zinc-300 text-[10px] leading-snug">
                              {action.tier5CardData.regulatoryDisclaimer}
                            </p>
                            {action.tier5CardData.disclaimerAcknowledged && (
                              <span className="inline-flex items-center space-x-1 text-emerald-400 text-[9px]">
                                <Check size={10} />
                                <span>{isJa ? 'アンカー本人により確認・同意済' : 'Acknowledged by Anchor'}</span>
                              </span>
                            )}
                          </div>

                          {/* Multisig & Deadlines row */}
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="p-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                              <span className="text-zinc-400 block">{isJa ? 'マルチシグ承認状況' : 'Multisig Status'}</span>
                              <span className="text-purple-300 font-bold">
                                {action.tier5CardData.multisigStatus?.required || '2-of-3'}
                              </span>
                              <span className="text-zinc-500 text-[9px] block">
                                {isJa ? `署名済: ${action.tier5CardData.multisigStatus?.signedCount || 0}` : `Signed: ${action.tier5CardData.multisigStatus?.signedCount || 0}`}
                              </span>
                            </div>

                            <div className="p-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800">
                              <span className="text-zinc-400 block">
                                {action.tier5CardData.coolingOffDeadline ? (isJa ? 'クーリングオフ期限' : 'Cooling-off Deadline') : (isJa ? '権利行使期限' : 'Exercise Deadline')}
                              </span>
                              <span className="text-amber-300 font-bold">
                                {action.tier5CardData.coolingOffDeadline 
                                  ? action.tier5CardData.coolingOffDeadline.slice(0, 10) 
                                  : action.tier5CardData.exerciseDeadline ? action.tier5CardData.exerciseDeadline.slice(0, 10) : 'N/A'}
                              </span>
                              <span className="text-zinc-500 text-[9px] block">
                                {action.tier5CardData.cancellationRight?.available ? (isJa ? '無条件取消可能' : 'Unconditional') : (isJa ? '取消不可' : 'Irreversible')}
                              </span>
                            </div>
                          </div>

                          {/* License Reference */}
                          {action.tier5CardData.licenseReference && (
                            <div className="text-[9px] text-zinc-400 font-mono truncate">
                              <span className="text-zinc-500">Ref: </span>
                              {action.tier5CardData.licenseReference}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Function Calling JSON View (Collapsible) */}
                {isJsonOpen && (
                  <div className="p-2.5 rounded-xl bg-black border border-zinc-800 text-[10px] font-mono space-y-1.5">
                    <div className="flex items-center justify-between text-zinc-400 pb-1 border-b border-zinc-900">
                      <span className="flex items-center space-x-1">
                        <Code2 size={12} className="text-blue-400" />
                        <span>Tive ◉AI Function Calling Payload</span>
                      </span>
                      <button
                        onClick={() => copyProposalJson(action)}
                        className="flex items-center space-x-1 text-zinc-400 hover:text-white transition-colors"
                      >
                        {copiedId === action.id ? (
                          <>
                            <Check size={11} className="text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} />
                            <span>Copy JSON</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="text-zinc-300 overflow-x-auto whitespace-pre leading-relaxed p-1">
                      {JSON.stringify(jsonPayload, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Status and Action Buttons */}
                <div className="pt-2 border-t border-zinc-900/80">
                  {/* 1. Auto Approved (Tier 1) */}
                  {action.status === 'auto_approved' && (
                    <div className="flex items-center space-x-1.5 text-xs text-emerald-400 py-0.5">
                      <Check size={14} className="text-emerald-400 shrink-0" />
                      <span className="font-medium">
                        {isJa ? '自動承認済 (Policy Engine 適合)' : 'Auto-Approved by Policy Engine'}
                      </span>
                    </div>
                  )}

                  {/* 2. Approved via Pico W Tap */}
                  {action.status === 'approved_tap' && (
                    <div className="flex items-center space-x-1.5 text-xs text-blue-400 py-0.5">
                      <CheckCircle2 size={14} className="text-blue-400 shrink-0" />
                      <span className="font-medium font-mono">
                        {isJa ? 'Pico W (GP15) ボタンで承認完了' : 'Approved via Pico W (GP15)'}
                      </span>
                    </div>
                  )}

                  {/* 3. Approved in-app by Anchor Owner */}
                  {action.status === 'approved_app' && (
                    <div className="flex items-center space-x-1.5 text-xs text-emerald-400 py-0.5">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <span className="font-medium font-mono">
                        {isJa ? '本人署名で承認完了' : 'Signed & Approved'}
                      </span>
                    </div>
                  )}

                  {/* 4. Escalated to Human (Tier 4) */}
                  {action.status === 'escalated' && (
                    <div className="space-y-2 pt-0.5">
                      <div className="flex items-center space-x-1.5 text-xs text-rose-400 py-0.5">
                        <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                        <span className="font-medium">
                          {isJa ? '安全保護のため停止中 (高額・不審フラグ)' : 'Blocked for Safety (High-Value / Review Required)'}
                        </span>
                      </div>
                      <button
                        onClick={() => setBiometricAction(action)}
                        disabled={isProcessing}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-[0.99] text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-md shadow-rose-950/40"
                      >
                        <ShieldAlert size={14} />
                        <span>{isJa ? '本人生体認証で安全ロック解除・承認' : 'Unlock & Authorize via Biometrics'}</span>
                      </button>
                    </div>
                  )}

                  {/* 5. Awaiting Approval - Modern Slide to Confirm & Hardware Fallback */}
                  {action.status === 'awaiting' && (
                    <div className="pt-1 space-y-2">
                      <SlideToConfirm
                        id={`slide-${action.id}`}
                        label={
                          action.tier === 5
                            ? (isJa ? 'スライドしてTier 5 規制商品を約定' : 'Slide to Settle Tier 5 Asset')
                            : action.tier === 2
                            ? (isJa ? '右にスライドして即時承認' : 'Slide right to approve')
                            : (isJa ? 'スライドしてパスキー署名' : 'Slide to sign & execute')
                        }
                        color={action.tier === 5 ? 'purple' : 'pink'}
                        onConfirm={async () => {
                          if (action.tier === 3 || action.tier === 5) {
                            setBiometricAction(action);
                          } else {
                            await handleApprove(action.id, false);
                          }
                        }}
                      />

                      {/* Optional Pico W hardware button if Tier 2 */}
                      {action.tier === 2 && (
                        <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-0.5 px-1 font-mono">
                          <span>またはハードウェア承認:</span>
                          {bleConnected ? (
                            <button
                              onClick={() => handleApprove(action.id, true)}
                              disabled={isProcessing}
                              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                            >
                              <BluetoothConnected size={12} />
                              <span>Pico W GP15 タップ</span>
                            </button>
                          ) : (
                            <button
                              onClick={onConnectBle}
                              disabled={blePairing}
                              className="text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                            >
                              <Bluetooth size={12} />
                              <span>{blePairing ? '接続中…' : 'Pico W 接続'}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 7. Cooling-off Window (Tier 5 Issuance - Unconditional Cancellation) */}
                  {action.status === 'cooling_off' && (
                    <div className="space-y-2 pt-0.5">
                      <div className="flex items-center justify-between text-xs text-amber-300 py-0.5">
                        <div className="flex items-center space-x-1.5">
                          <Clock size={14} className="text-amber-400 shrink-0" />
                          <span className="font-medium">
                            {isJa ? 'クーリングオフ猶予期間中（無条件取消可）' : 'Cooling-off Window (Unconditional Cancel)'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800">
                          {action.tier5CardData?.coolingOffDeadline?.slice(0, 10) || 'Active'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onCancelAction && onCancelAction(action.id)}
                          className="py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-rose-300 hover:text-rose-200 border border-zinc-800 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all"
                        >
                          <Ban size={13} />
                          <span>{isJa ? '申込を取り消す' : 'Cancel Application'}</span>
                        </button>
                        <button
                          onClick={() => setBiometricAction(action)}
                          className="py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow"
                        >
                          <Fingerprint size={13} />
                          <span>{isJa ? '早期確定・署名' : 'Sign & Settle'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 8. Cancelled State (Cooling-off Exercised) */}
                  {action.status === 'cancelled' && (
                    <div className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                      <div className="flex items-center space-x-1.5">
                        <Ban size={14} className="text-zinc-400 shrink-0" />
                        <span className="font-mono">
                          {isJa ? 'クーリングオフ権利行使により無条件取消済' : 'Cancelled via Cooling-off Right'}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500">ペナルティなし</span>
                    </div>
                  )}

                  {/* 9. Suspended State (Treasury Solvency Insufficient) */}
                  {action.status === 'suspended' && (
                    <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-900/60 flex items-center justify-between text-xs text-amber-300">
                      <div className="flex items-center space-x-1.5">
                        <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                        <span className="font-mono">
                          {isJa ? 'トレジャリー流動性一時不足により保留中' : 'Suspended: Awaiting Treasury Liquidity'}
                        </span>
                      </div>
                      <span className="text-[10px] bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800">
                        エスカレーション
                      </span>
                    </div>
                  )}

                  {/* 10. Rejected at Tier 5 Gate (Execution Prohibited - No Override) */}
                  {action.status === 'rejected_tier5' && (
                    <div className="p-2 rounded-xl bg-rose-950/30 border border-rose-900/60 flex items-center justify-between text-xs text-rose-300">
                      <div className="flex items-center space-x-2">
                        <ShieldAlert size={14} className="text-rose-400 shrink-0" />
                        <span className="font-semibold font-mono">
                          {isJa ? 'Tier 5 規制ゲート拒絶：完全実行不可' : 'Tier 5 Regulatory Gate: Strictly Prohibited'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-800">
                        {isJa ? '法定義務ブロック' : 'Statutory Block'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tive ◉AI System Prompt Specification Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg max-h-[85vh] rounded-[28px] bg-zinc-950 border border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-[9px] font-bold select-none">
                  ▼
                </div>
                <h3 className="text-sm font-bold text-white">
                  Tive ◉AI — システムプロンプト仕様
                </h3>
              </div>
              <button
                onClick={() => setShowPromptModal(false)}
                className="w-7 h-7 rounded-full bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-800 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs text-zinc-300 font-sans leading-relaxed">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
                <span className="text-[11px] font-mono text-blue-400 font-semibold">
                  オーケストレーション原則
                </span>
                <p className="text-zinc-300">
                  Tive ◉AI自体はGeminiベースのオーケストレーション層であり、生の秘密鍵・実行権限を持ちません。
                  実行はAutomation Engineが、可否の判定はPolicy Engineが決定論的に行います。
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-white font-mono text-[11px] uppercase tracking-wider">
                  1. 権限の範囲
                </h4>
                <ul className="list-disc pl-4 space-y-1 text-zinc-400">
                  <li>AIは「提案」のみを行い、Policy Engineが決定論的に可否判定。</li>
                  <li>秘密鍵・APIキー・署名権限はSecret VaultがTTL付き動的トークンとして一時発行。</li>
                  <li>Tier 3/4の提案時、ユーザーに対して「なぜ承認が必要か」を明確に説明する義務。</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-white font-mono text-[11px] uppercase tracking-wider">
                  2. 出力形式 (Function Calling JSON)
                </h4>
                <pre className="p-3 rounded-xl bg-black border border-zinc-800 text-[11px] font-mono text-emerald-400 whitespace-pre overflow-x-auto">
{`{
  "destination": "送り先（アドレスまたは登録済みウォレット名）",
  "amountLabel": "金額（現地通貨換算＋実際のトークン量）",
  "reason": "なぜこの提案をしたか（ユーザーの発言に基づく具体的な根拠）",
  "whyApprovalNeeded": "なぜ自動実行ではなく承認が必要か"
}`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-white font-mono text-[11px] uppercase tracking-wider">
                  3. 禁止事項
                </h4>
                <ul className="list-disc pl-4 space-y-1 text-zinc-400">
                  <li>ユーザーの発言にない資産移動を提案しない。</li>
                  <li>Policy Engineの判定結果を覆すような文言を出力しない。</li>
                  <li>曖昧な通知を生成しない。常に具体的根拠を示す。</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/60 space-y-2">
                <h4 className="font-semibold text-purple-200 font-mono text-[11px] uppercase tracking-wider flex items-center justify-between">
                  <span>4. Tier 5 規制商品ゲート（特別会員限定）</span>
                  <span className="text-[10px] text-purple-400">年額5万円〜</span>
                </h4>
                <p className="text-zinc-300 text-[11px] leading-snug">
                  STO・貴金属CFD・電力取引などの規制対象商品は、金額・可逆性を問わずTier1〜4の前段でTier 5ゲートを必ず通過します。
                </p>
                <div className="text-[10px] font-mono text-zinc-400 space-y-1">
                  <div>• <b>商品分類</b>: <code>compliance_profile: variable_return_only</code> 必須</div>
                  <div>• <b>文言検証</b>: 「確定利回り」「元本保証」の語を機械的完全遮断</div>
                  <div>• <b>ライセンス</b>: 第一種金融商品取引業/小売電気事業者ライセンスの決定論的照合</div>
                  <div>• <b>適合性原則</b>: アンカーのリスク許容度との自動突合</div>
                  <div className="text-rose-400 pt-0.5">• FAIL時は承認待ちにならず「即時実行不可」として理由明示</div>
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-zinc-900 bg-zinc-900/40 text-right">
              <button
                onClick={() => setShowPromptModal(false)}
                className="px-4 py-1.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* High-Value Transaction Protective Biometrics Modal (Tier 3 & 4) */}
      <BiometricAuthModal
        isOpen={Boolean(biometricAction)}
        action={biometricAction}
        onClose={() => setBiometricAction(null)}
        authenticate={onAuthenticate}
        onSuccess={async (act) => {
          await handleApprove(act.id, false);
        }}
        userAddress={userAddress}
        userDid={userDid}
      />
    </div>
  );
};
