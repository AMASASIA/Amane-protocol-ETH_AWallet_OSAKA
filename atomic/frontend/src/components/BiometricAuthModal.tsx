import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Fingerprint,
  ScanFace,
  Check,
  X,
  Lock,
  Unlock,
  Loader2,
  AlertTriangle,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { InvisibleAction } from '../types';

interface BiometricAuthModalProps {
  isOpen: boolean;
  action: InvisibleAction | null;
  onClose: () => void;
  /**
   * REQUIRED. Performs a real WebAuthn assertion whose result is verified by the server
   * (e.g. approveWithPasskey from services/atomicApi.ts). It must reject on failure.
   */
  authenticate: (action: InvisibleAction) => Promise<void>;
  onSuccess: (action: InvisibleAction) => Promise<void> | void;
  userAddress?: string;
  userDid?: string;
}

type AuthState = 'idle' | 'scanning' | 'verifying' | 'success' | 'failed';
type BiometricType = 'fingerprint' | 'face';

export const BiometricAuthModal: React.FC<BiometricAuthModalProps> = ({
  isOpen,
  action,
  onClose,
  authenticate,
  onSuccess,
  userAddress = '0x71C...3a42',
  userDid = 'did:key:z6Mku...base',
}) => {
  const [authState, setAuthState] = useState<AuthState>('idle');
  const [biometricType, setBiometricType] = useState<BiometricType>('fingerprint');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAuthState('idle');
      setErrorMessage(null);
    }
  }, [isOpen, action]);

  // Audio & Haptic Feedback synthesis
  const playAuthTone = (success: boolean) => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (success) {
        // High-fidelity two-tone Apple Pay-style chime
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc1.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, ctx.currentTime);
        osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.1); // D6

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.45);
        osc2.stop(ctx.currentTime + 0.45);

        // Haptic feedback if supported
        if (navigator.vibrate) {
          navigator.vibrate([40, 50, 80]);
        }
      } else {
        // Subtle error buzz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);

        if (navigator.vibrate) {
          navigator.vibrate([80, 50, 80]);
        }
      }
    } catch {
      // AudioContext might be constrained by autoplay policy, harmless fallback
    }
  };

  // Real authentication: the assertion is created by the platform authenticator and verified by the server.
  const triggerAuthentication = async () => {
    if (!action || authState === 'scanning' || authState === 'verifying' || authState === 'success') return;

    setAuthState('scanning');
    setErrorMessage(null);
    try {
      await authenticate(action);
      setAuthState('success');
      playAuthTone(true);
      await new Promise((resolve) => setTimeout(resolve, 700));
      await onSuccess(action);
      onClose();
    } catch (err: unknown) {
      setAuthState('failed');
      playAuthTone(false);
      setErrorMessage(err instanceof Error ? err.message : '認証に失敗しました');
    }
  };

  if (!isOpen || !action) return null;

  const isTier4 = action.tier === 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-sm rounded-[32px] bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border border-zinc-800/90 shadow-2xl shadow-black/80 overflow-hidden relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="biometric-modal-title"
      >
        {/* Subtle Ambient Radial Glow */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
            authState === 'success'
              ? 'bg-emerald-500/20'
              : isTier4
              ? 'bg-rose-500/20'
              : 'bg-amber-500/15'
          }`}
        />

        {/* Modal Header & Shield Badge */}
        <div className="p-5 pb-3 relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2.5">
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg ${
                  isTier4
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}
              >
                {isTier4 ? (
                  <ShieldAlert size={18} className="stroke-[2.2]" />
                ) : (
                  <ShieldCheck size={18} className="stroke-[2.2]" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                    {isTier4 ? 'Circuit Breaker Shield' : 'Secure Enclave'}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <h2 id="biometric-modal-title" className="text-sm font-bold text-white tracking-tight">
                  {isTier4 ? '高額・安全停止解除' : '本人確認 (生体パスキー認証)'}
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={authState === 'scanning' || authState === 'verifying'}
              className="w-8 h-8 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors border border-zinc-800 disabled:opacity-40"
              aria-label="Cancel authentication"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Transaction Protective Card (Tive AI ApprovalCard format) */}
        <div className="px-5 py-2">
          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
                  isTier4
                    ? 'border-rose-800/80 text-rose-300 bg-rose-950/40'
                    : 'border-amber-800/80 text-amber-300 bg-amber-950/40'
                }`}
              >
                {isTier4 ? 'Tier 4 · 高リスク/安全停止' : 'Tier 3 · 本人生体署名必須'}
              </span>
              <span className="text-base font-mono font-bold text-white tabular-nums">
                {action.amountLabel || action.amount}
              </span>
            </div>

            <div>
              <div className="text-xs font-semibold text-white tracking-tight">
                {action.desc}
              </div>
              {action.destination && (
                <div className="text-[11px] font-mono text-zinc-400 mt-1 flex items-center space-x-1">
                  <span className="text-zinc-500">送り先:</span>
                  <span className="text-zinc-200 truncate">{action.destination}</span>
                </div>
              )}
            </div>

            {/* Tive AI Reason (User Intent) */}
            {action.reason && (
              <div className="p-2 rounded-xl bg-zinc-900/70 border border-zinc-800/60 text-[11px] space-y-1">
                <div className="text-[10px] font-mono text-zinc-400 font-semibold flex items-center space-x-1">
                  <span className="text-zinc-500">Tive ◉AI 提案根拠:</span>
                </div>
                <p className="text-zinc-300 leading-snug">
                  {action.reason}
                </p>
              </div>
            )}

            {/* Why Approval Needed (Mandatory Policy Engine Reason) */}
            {action.whyApprovalNeeded && (
              <div className={`p-2 rounded-xl border text-[11px] space-y-0.5 ${
                isTier4 
                  ? 'bg-rose-950/30 border-rose-900/60 text-rose-200' 
                  : 'bg-amber-950/30 border-amber-900/60 text-amber-200'
              }`}>
                <div className="text-[10px] font-mono font-semibold flex items-center space-x-1">
                  <span className={isTier4 ? 'text-rose-400' : 'text-amber-400'}>
                    承認が必要な理由 (Policy Engine):
                  </span>
                </div>
                <p className="leading-snug">
                  {action.whyApprovalNeeded}
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span className="flex items-center space-x-1">
                <span>発議:</span>
                <span className="text-zinc-200 font-medium">{action.initiatedBy}</span>
              </span>
              <span className="text-zinc-500 truncate max-w-[120px]" title={action.id}>
                Action: {action.id.slice(0, 10)}
              </span>
            </div>
          </div>
        </div>

        {/* Biometric Sensor / Touchpad Area */}
        <div className="px-5 py-4 flex flex-col items-center">
          {(
            <>
              {/* Biometric Type Switcher (Touch ID vs Face ID) */}
              <div className="flex items-center p-0.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-mono mb-4">
                <button
                  type="button"
                  onClick={() => setBiometricType('fingerprint')}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition-all ${
                    biometricType === 'fingerprint'
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Fingerprint size={13} />
                  <span>Touch ID (指紋)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBiometricType('face')}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg transition-all ${
                    biometricType === 'face'
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <ScanFace size={13} />
                  <span>Face ID (顔)</span>
                </button>
              </div>

              {/* Glowing Interactive Biometric Scanner Button */}
              <div className="relative my-2">
                {/* Radar Scanning Ripples */}
                {authState === 'scanning' && (
                  <>
                    <span className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                    <span className="absolute -inset-3 rounded-full border border-blue-500/30 animate-pulse" />
                  </>
                )}
                {authState === 'success' && (
                  <span className="absolute -inset-3 rounded-full border-2 border-emerald-500/60 animate-ping" />
                )}

                <button
                  type="button"
                  onClick={triggerAuthentication}
                  disabled={authState === 'scanning' || authState === 'verifying' || authState === 'success'}
                  className={`w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 relative border-2 active:scale-95 shadow-xl ${
                    authState === 'success'
                      ? 'bg-emerald-500 text-black border-emerald-400 shadow-emerald-500/40 scale-105'
                      : authState === 'verifying'
                      ? 'bg-zinc-900 text-amber-400 border-amber-500/60 shadow-amber-500/20'
                      : authState === 'scanning'
                      ? 'bg-blue-950/60 text-blue-400 border-blue-500 shadow-blue-500/30 animate-pulse'
                      : 'bg-zinc-950 hover:bg-zinc-900 text-white border-zinc-700 hover:border-zinc-500 shadow-black/60'
                  }`}
                  aria-label="Tap to authenticate"
                >
                  {authState === 'success' ? (
                    <Check size={38} className="stroke-[3] animate-scale-in" />
                  ) : authState === 'verifying' ? (
                    <Loader2 size={36} className="animate-spin text-amber-400" />
                  ) : biometricType === 'fingerprint' ? (
                    <Fingerprint
                      size={38}
                      className={`stroke-[1.8] transition-transform ${
                        authState === 'scanning' ? 'scale-110 text-blue-400' : 'text-zinc-200'
                      }`}
                    />
                  ) : (
                    <ScanFace
                      size={38}
                      className={`stroke-[1.8] transition-transform ${
                        authState === 'scanning' ? 'scale-110 text-blue-400' : 'text-zinc-200'
                      }`}
                    />
                  )}

                  {/* Scanline effect during scanning */}
                  {authState === 'scanning' && (
                    <div className="absolute inset-x-2 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-bounce opacity-75" />
                  )}
                </button>
              </div>

              {/* Status Text & Instruction */}
              <div className="text-center mt-3 space-y-1">
                <div
                  className={`text-xs font-semibold tracking-tight transition-colors ${
                    authState === 'success'
                      ? 'text-emerald-400'
                      : authState === 'verifying'
                      ? 'text-amber-400'
                      : authState === 'scanning'
                      ? 'text-blue-400'
                      : 'text-white'
                  }`}
                >
                  {authState === 'success'
                    ? '生体認証成功 · 署名実行中…'
                    : authState === 'verifying'
                    ? 'セキュアエンクレーブ検証中…'
                    : authState === 'scanning'
                    ? biometricType === 'fingerprint'
                      ? '指紋センサーを読み取り中…'
                      : 'Face IDで顔を照合中…'
                    : 'センサーをタップして認証'}
                </div>
                <div className="text-[11px] text-zinc-400 font-mono">
                  {authState === 'idle' && (
                    <span>WebAuthn Passkey · サーバー検証</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-5 pt-2 border-t border-zinc-900 bg-zinc-950/50 space-y-2">
          {authState === 'idle' && (
            <>
              <button
                type="button"
                onClick={triggerAuthentication}
                className="w-full py-3 rounded-full bg-white hover:bg-zinc-200 active:scale-[0.99] text-black text-xs font-semibold flex items-center justify-center space-x-2 transition-all shadow-md"
              >
                {biometricType === 'fingerprint' ? (
                  <Fingerprint size={16} />
                ) : (
                  <ScanFace size={16} />
                )}
                <span>
                  {isTier4 ? '生体認証で承認・ロック解除' : '生体パスキーで署名承認'}
                </span>
              </button>

              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors font-mono"
                >
                  実行を拒否して閉じる
                </button>
              </div>
            </>
          )}

          {(authState === 'scanning' || authState === 'verifying') && (
            <div className="w-full py-2.5 flex items-center justify-center space-x-2 text-xs text-zinc-400 font-mono">
              <Loader2 size={14} className="animate-spin text-white" />
              <span>ハードウェア暗号鍵で署名生成中…</span>
            </div>
          )}

          {authState === 'failed' && (
            <div className="space-y-2">
              <p className="text-[11px] text-rose-300 font-mono text-center break-words">{errorMessage}</p>
              <button
                type="button"
                onClick={() => setAuthState('idle')}
                className="w-full py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold border border-zinc-800"
              >
                もう一度試す
              </button>
            </div>
          )}

          {authState === 'success' && (
            <div className="w-full py-2.5 flex items-center justify-center space-x-2 text-xs text-emerald-400 font-semibold">
              <Check size={16} className="stroke-[2.5]" />
              <span>トランザクションが安全に認可されました</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
