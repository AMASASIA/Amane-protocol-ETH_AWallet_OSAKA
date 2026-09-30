import React, { useState, useMemo } from 'react';
import { ArrowLeft, Check, RefreshCw, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';
import { Token, PolicyEngineConfig } from '../types';
import { resolveDID, formatAddress } from '../services/mockChain';
import { evaluateTransactionPolicy } from '../services/sessionPolicyEngine';
import { getTokenPriceUsd } from './NFTCard';

interface SendSheetProps {
  tokens: Token[];
  policyConfig?: PolicyEngineConfig;
  userAddress?: string;
  onClose: () => void;
  onSend: (to: string, amount: number, symbol: string, onStatus?: (msg: string) => void) => Promise<void>;
  onTripCircuitBreaker?: (reason: string) => void;
}

export const SendSheet: React.FC<SendSheetProps> = ({
  tokens,
  policyConfig,
  userAddress,
  onClose,
  onSend,
  onTripCircuitBreaker,
}) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState(tokens[0]?.symbol || 'USDC');
  const [isResolving, setIsResolving] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const selectedToken = tokens.find((t) => t.symbol === selectedSymbol) || tokens[0];

  const handleRecipientChange = async (val: string) => {
    setRecipient(val);
    setResolvedAddress(null);
    setErrorMsg(null);

    const trimmed = val.trim();
    if (trimmed.startsWith('did:') || trimmed.endsWith('.eth') || trimmed.endsWith('.base.eth')) {
      setIsResolving(true);
      try {
        const addr = await resolveDID(trimmed);
        setResolvedAddress(addr);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMsg(err.message);
        } else {
          setErrorMsg('Resolution failed');
        }
      } finally {
        setIsResolving(false);
      }
    }
  };

  const handleSetMax = () => {
    if (selectedToken) {
      setAmount(selectedToken.balance.toString());
    }
  };

  const tokenPrice = selectedToken ? getTokenPriceUsd(selectedToken) : 1;
  const estUsd = (parseFloat(amount) || 0) * tokenPrice;
  const targetAddr = resolvedAddress || recipient.trim();

  // Evaluate against Policy Engine
  const policyResult = useMemo(() => {
    if (!policyConfig) {
      return { allowed: true, sessionKeyEligible: false, requiresGuardianApproval: false };
    }
    return evaluateTransactionPolicy(estUsd, targetAddr || '0x0000000000000000000000000000000000000000', policyConfig);
  }, [estUsd, targetAddr, policyConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!recipient.trim()) {
      setErrorMsg('Please enter a recipient address or DID');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid amount');
      return;
    }
    if (selectedToken && numAmount > selectedToken.balance) {
      setErrorMsg(`Insufficient ${selectedToken.symbol} balance`);
      return;
    }

    // Policy Engine Enforcement
    if (policyConfig?.circuitBreakerStatus === 'TRIPPED' || policyResult.circuitBreakerTriggered) {
      const reason = policyResult.reason || 'Circuit Breaker is activated. All transfers are locked.';
      if (onTripCircuitBreaker) onTripCircuitBreaker(reason);
      setErrorMsg(reason);
      return;
    }

    if (!policyResult.allowed) {
      setErrorMsg(policyResult.reason || 'Transfer rejected by Policy Engine');
      return;
    }

    setIsSending(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      await onSend(targetAddr, numAmount, selectedSymbol, (msg) => setStatusMsg(msg));
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to send transaction');
      }
    } finally {
      setIsSending(false);
      setStatusMsg(null);
    }
  };


  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col text-white animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-900">
        <button
          onClick={onClose}
          disabled={isSending}
          className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        <span className="font-semibold text-sm tracking-tight">Send</span>
        <div className="w-8" />
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between max-w-md w-full mx-auto p-5 overflow-y-auto">
        <div className="space-y-6">
          {/* Circuit Breaker Banner if Tripped */}
          {policyConfig?.circuitBreakerStatus === 'TRIPPED' && (
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white flex items-start space-x-2.5">
              <AlertTriangle className="text-zinc-400 shrink-0 mt-0.5" size={16} />
              <div>
                <span className="font-semibold block font-mono uppercase text-[11px] tracking-wider text-zinc-300">
                  Circuit Breaker Tripped
                </span>
                <p className="text-zinc-400 mt-0.5">
                  {policyConfig.circuitBreakerReason || 'Emergency pause active. Outgoing transfers are locked.'}
                </p>
              </div>
            </div>
          )}

          {/* Big Amount Input */}
          <div className="pt-6 pb-2 text-center">
            <div className="inline-flex items-baseline justify-center">
              <input
                type="number"
                step="any"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="bg-transparent text-5xl font-light text-center w-full focus:outline-none placeholder:text-zinc-700 tracking-tight font-mono"
              />
            </div>
            <p className="text-sm text-zinc-500 font-mono mt-2">
              ≈ ${estUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </p>

            {/* Policy Engine Badge */}
            {estUsd > 0 && (
              <div className="mt-3 flex justify-center">
                {policyResult.circuitBreakerTriggered ? (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-[11px] font-mono text-zinc-300">
                    <AlertTriangle size={12} className="text-zinc-400" />
                    <span>Tier 4: Circuit Breaker Locked</span>
                  </span>
                ) : policyResult.sessionKeyEligible ? (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
                    <Zap size={12} className="text-white" />
                    <span>Tier 1: 0-Click Session Key (Auto-Approved)</span>
                  </span>
                ) : policyResult.requiresGuardianApproval ? (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
                    <ShieldCheck size={12} className="text-white" />
                    <span>Tier 3: Passkey Biometric Signing Required</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
                    <ShieldCheck size={12} className="text-white" />
                    <span>Tier 2: Physical Confirmation</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Asset Selector */}
          <div className="flex items-center justify-between py-3 border-b border-zinc-900">
            <span className="text-xs text-zinc-400">Asset</span>
            <div className="flex items-center space-x-2">
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="bg-transparent text-white font-medium text-sm focus:outline-none text-right cursor-pointer"
              >
                {tokens.map((t) => (
                  <option key={t.symbol} value={t.symbol} className="bg-zinc-950 text-white">
                    {t.symbol} (Bal: {t.balance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Balance Pill with Max button */}
          <div className="flex justify-between items-center text-xs text-zinc-500 -mt-2">
            <span>Available: {selectedToken?.balance.toLocaleString()} {selectedToken?.symbol}</span>
            <button
              type="button"
              onClick={handleSetMax}
              className="text-xs text-white hover:text-zinc-300 font-mono underline ml-2"
            >
              Use Max
            </button>
          </div>

          {/* Recipient Input */}
          <div className="space-y-2 pt-2">
            <label className="text-xs text-zinc-400 block">To</label>
            <div className="relative">
              <input
                type="text"
                value={recipient}
                onChange={(e) => handleRecipientChange(e.target.value)}
                placeholder="Address, Base Name, or DID"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
              />
              {isResolving && (
                <div className="absolute right-3 top-3.5 text-zinc-400 animate-spin">
                  <RefreshCw size={16} />
                </div>
              )}
            </div>

            {resolvedAddress && (
              <div className="flex items-center space-x-1.5 text-xs text-zinc-400 font-mono pt-1">
                <Check size={12} className="text-white" />
                <span>Resolved: {formatAddress(resolvedAddress)}</span>
              </div>
            )}

            {/* Quick Demo Recipient Tap */}
            <div className="flex items-center space-x-2 pt-1">
              <span className="text-[11px] text-zinc-600">Quick:</span>
              <button
                type="button"
                onClick={() => handleRecipientChange('alex.base.eth')}
                className="text-[11px] text-zinc-400 hover:text-white bg-zinc-900 px-2 py-0.5 rounded font-mono"
              >
                alex.base.eth
              </button>
              <button
                type="button"
                onClick={() => handleRecipientChange('did:ion:EiCPH...8Yt1')}
                className="text-[11px] text-zinc-400 hover:text-white bg-zinc-900 px-2 py-0.5 rounded font-mono"
              >
                did:ion:...
              </button>
            </div>
          </div>

          {statusMsg && !errorMsg && (
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {statusMsg}
            </div>
          )}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-6 pb-4">
          <button
            type="submit"
            disabled={
              isSending ||
              !recipient.trim() ||
              !amount ||
              parseFloat(amount) <= 0 ||
              policyConfig?.circuitBreakerStatus === 'TRIPPED' ||
              policyResult.circuitBreakerTriggered ||
              !policyResult.allowed
            }
            className="w-full bg-white hover:bg-zinc-200 text-black py-4 rounded-2xl font-semibold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isSending ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Signing on Base...</span>
              </>
            ) : policyConfig?.circuitBreakerStatus === 'TRIPPED' || policyResult.circuitBreakerTriggered ? (
              <span>Locked: Circuit Breaker Active</span>
            ) : !policyResult.allowed ? (
              <span>Blocked by Policy Engine</span>
            ) : policyResult.sessionKeyEligible ? (
              <span>Instant Send (Session Key 0-Click)</span>
            ) : policyResult.requiresGuardianApproval ? (
              <span>Authenticate &amp; Send (Passkey)</span>
            ) : (
              <span>Review &amp; Send</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
