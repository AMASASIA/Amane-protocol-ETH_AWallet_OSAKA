import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Check, Copy, ExternalLink, Fingerprint, Bluetooth, KeyRound, Loader2, ShieldCheck, Link2, Sparkles } from 'lucide-react';
import { SlideToConfirm } from './SlideToConfirm';
import {
  ApprovalMethod,
  Health,
  HistoryEvent,
  MintResult,
  UserStatus,
  explorerAddress,
  explorerTx,
  getHealth,
  getHistory,
  getUserStatus,
  issueAtomic,
  registerPasskey,
} from '../services/atomicApi';
import { isPicoSupported } from '../services/picoBle';

interface AtomicMintSheetProps {
  /** Wallet address that receives the NFT + SBT (and owns the TBA). */
  userAddress: string;
  onClose: () => void;
  onIssued?: (result: MintResult) => void;
}

const URI_OK = /^(ipfs:\/\/|https:\/\/)\S{1,500}$/;
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const STEP_LABEL = {
  approval: '承認リクエストを作成中…',
  signing: '本人確認中…（パスキー / Pico W）',
  sending: 'UserOperationを送信中 (Pimlico)…',
} as const;

const CopyChip: React.FC<{ text: string }> = ({ text }) => {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="text-zinc-400 hover:text-white transition-colors"
      aria-label="Copy"
    >
      {done ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
};

const ResultCard: React.FC<{ title: string; badge: string; children: React.ReactNode }> = ({ title, badge, children }) => (
  <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-1.5">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-white">{title}</span>
      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">{badge}</span>
    </div>
    {children}
  </div>
);

export const AtomicMintSheet: React.FC<AtomicMintSheetProps> = ({ userAddress, onClose, onIssued }) => {
  const [health, setHealth] = useState<Health | null>(null);
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [history, setHistory] = useState<HistoryEvent[] | null>(null);
  const [tokenUri, setTokenUri] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [method, setMethod] = useState<ApprovalMethod>('passkey');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MintResult | null>(null);

  const reload = useCallback(async () => {
    try {
      const [h, s] = await Promise.all([getHealth(), getUserStatus(userAddress)]);
      setHealth(h);
      setStatus(s);
      if (s.minted) setResult(s.minted);
      if (h.multibaas) getHistory().then((r) => setHistory(r.events)).catch(() => setHistory(null));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'サーバーに接続できません');
    }
  }, [userAddress]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const deviceAllowed = health?.atomicMintTier === 2 && isPicoSupported();
  const uriValid = URI_OK.test(tokenUri.trim());

  const handleRegister = async () => {
    setError(null);
    setBusy('パスキーを登録中…');
    try {
      await registerPasskey(userAddress, inviteCode || undefined);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'パスキー登録に失敗しました');
    } finally {
      setBusy(null);
    }
  };

  // SlideToConfirm resets itself when this throws, so rethrow after surfacing the message.
  const handleIssue = async () => {
    setError(null);
    try {
      const r = await issueAtomic(userAddress, tokenUri.trim(), method, (step) => setBusy(STEP_LABEL[step]));
      setResult(r);
      onIssued?.(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : '発行に失敗しました');
      throw e;
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col text-white animate-fade-in">
      <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-900">
        <button onClick={onClose} disabled={Boolean(busy)} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors" aria-label="Back">
          <ArrowLeft size={22} />
        </button>
        <div className="flex items-center space-x-1.5">
          <span className="font-semibold text-sm tracking-tight">Atomic Mint</span>
          <span className="text-[10px] font-mono bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded">Base Sepolia</span>
        </div>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto max-w-md w-full mx-auto p-5 space-y-4">
        <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-900 text-xs space-y-1">
          <div className="flex items-center justify-between font-mono">
            <span className="text-zinc-500">発行先</span>
            <span className="text-zinc-200">{short(userAddress)}</span>
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            NFT・SBT（譲渡不可）・トークンバウンドアカウント(ERC-6551) を1回のUserOperationで同時発行します。ガス代はPaymasterが負担します。
          </p>
        </div>

        {result ? (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <Check size={14} /> 発行完了（{result.approvedBy === 'device' ? 'Pico W' : 'パスキー'}で承認）
            </div>
            <ResultCard title="NFT" badge={`#${result.tokenId}`}>
              <p className="text-[11px] font-mono text-zinc-400 break-all">{result.uri}</p>
            </ResultCard>
            <ResultCard title="SBT" badge={`#${result.sbtId} · Soulbound`}>
              <p className="text-[11px] text-zinc-500">譲渡不可（ERC-5192）。参加メンバー証明として固定されます。</p>
            </ResultCard>
            <ResultCard title="TBA (ERC-6551)" badge="Token Bound Account">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-300">
                <span className="break-all">{result.tba}</span>
                <span className="flex items-center gap-2 ml-2 shrink-0">
                  <CopyChip text={result.tba} />
                  <a href={explorerAddress(result.tba)} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white">
                    <ExternalLink size={13} />
                  </a>
                </span>
              </div>
            </ResultCard>
            <a
              href={explorerTx(result.txHash)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-zinc-400 hover:text-white pt-1"
            >
              <Link2 size={12} /> Tx {short(result.txHash)} on Basescan
            </a>
          </div>
        ) : (
          <>
            {/* Step 1: passkey */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold flex items-center gap-1.5"><KeyRound size={13} /> 1. パスキー登録</span>
                <span className={`text-[10px] font-mono ${status?.registered ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {status?.registered ? '登録済み' : '未登録'}
                </span>
              </div>
              {status && !status.registered && (
                <>
                  <input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="招待コード（デモ参加者のみ）"
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-mono placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={Boolean(busy)}
                    className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <Fingerprint size={14} /> パスキーを登録
                  </button>
                </>
              )}
            </div>

            {/* Step 2: metadata + approval method */}
            <div className={`p-3.5 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-2.5 ${status?.registered ? '' : 'opacity-40 pointer-events-none'}`}>
              <div className="text-xs font-semibold flex items-center gap-1.5"><Sparkles size={13} /> 2. NFTメタデータ</div>
              <input
                value={tokenUri}
                onChange={(e) => setTokenUri(e.target.value)}
                placeholder="ipfs://… または https://…（tokenURI）"
                className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-mono placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
              />
              {tokenUri && !uriValid && <p className="text-[11px] text-zinc-500">ipfs:// か https:// のURIを入力してください</p>}

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-semibold flex items-center gap-1.5"><ShieldCheck size={13} /> 承認方法</span>
                <div className="flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => setMethod('passkey')}
                    className={`px-2.5 py-1 rounded flex items-center gap-1 ${method === 'passkey' ? 'bg-white text-black font-semibold' : 'text-zinc-400'}`}
                  >
                    <Fingerprint size={11} /> Passkey
                  </button>
                  {deviceAllowed && (
                    <button
                      type="button"
                      onClick={() => setMethod('device')}
                      className={`px-2.5 py-1 rounded flex items-center gap-1 ${method === 'device' ? 'bg-white text-black font-semibold' : 'text-zinc-400'}`}
                    >
                      <Bluetooth size={11} /> Pico W
                    </button>
                  )}
                </div>
              </div>
              {method === 'device' && (
                <p className="text-[11px] text-zinc-500">押すと接続ダイアログが開きます。Pico WのGP15ボタンを一度離してから押してください（30秒以内）。</p>
              )}
            </div>
          </>
        )}

        {busy && (
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-2">
            <Loader2 size={13} className="animate-spin" /> {busy}
          </div>
        )}
        {error && <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300">{error}</div>}

        {history && history.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">MultiBaas · 最近の発行</p>
            {history.slice(0, 5).map((h) => (
              <div key={`${h.txHash}-${h.tokenId}`} className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-1">
                <span>NFT #{h.tokenId} / SBT #{h.sbtId}</span>
                <span>{short(h.to)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!result && (
        <div className="max-w-md w-full mx-auto px-5 pb-6 pt-2">
          <SlideToConfirm
            id="atomic-mint-slide"
            color="emerald"
            label="スライドして Atomic 発行"
            disabled={!status?.registered || !uriValid || Boolean(busy) || !health?.pimlico}
            onConfirm={handleIssue}
          />
          {health && !health.pimlico && <p className="text-[11px] text-zinc-500 text-center mt-2">サーバーのPimlico設定が未完了です</p>}
        </div>
      )}
    </div>
  );
};
