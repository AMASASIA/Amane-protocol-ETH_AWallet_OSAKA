import React, { useState } from 'react';
import { SharedPresentationRecord } from '../types/certificate';
import {
  Share2,
  Clock,
  User,
  Shield,
  Eye,
  Trash2,
  Copy,
  Check,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  PlusCircle,
} from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface ActiveSharesViewProps {
  shares: SharedPresentationRecord[];
  onInspectShare: (share: SharedPresentationRecord) => void;
  onRevokeShare: (shareId: string) => void;
  onCreateNewShare: () => void;
  language: Language;
}

export const ActiveSharesView: React.FC<ActiveSharesViewProps> = ({
  shares,
  onInspectShare,
  onRevokeShare,
  onCreateNewShare,
  language,
}) => {
  const t = translations[language];
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 backdrop-blur-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-white" />
            <span>{t.sharesTitle}</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {t.sharesSubtitle}
          </p>
        </div>

        <button
          onClick={onCreateNewShare}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t.createNewShare}</span>
        </button>
      </div>

      {shares.length === 0 ? (
        <div className="py-20 text-center bg-zinc-900/40 rounded-3xl border border-zinc-800 max-w-lg mx-auto p-6">
          <Share2 className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-white">No active presentations shared yet</p>
          <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
            You can select any combination of DIDs, SBTs, or TBAs and generate temporary, zero-knowledge verifiable presentations for specific recipients.
          </p>
          <button
            onClick={onCreateNewShare}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-colors shadow"
          >
            {t.createNewShare}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shares.map((share) => {
            const isExpired = share.expiresAt && new Date(share.expiresAt).getTime() < Date.now();
            const isRevoked = share.status === 'revoked';

            return (
              <div
                key={share.id}
                className={`p-5 rounded-3xl border transition-all bg-gradient-to-b from-zinc-900 to-black backdrop-blur-xl space-y-4 ${
                  isRevoked
                    ? 'border-zinc-800 opacity-60'
                    : isExpired
                    ? 'border-zinc-700 opacity-75'
                    : 'border-zinc-800 hover:border-zinc-600 shadow-xl'
                }`}
              >
                {/* Header: Recipient & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{share.recipientName}</span>
                        {share.oneTimeView && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1">
                            <Flame className="w-3 h-3 text-zinc-400" />
                            {t.burnAfterRead}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-zinc-400 truncate max-w-[200px] sm:max-w-xs">
                        {share.recipientEmailOrDid}
                      </div>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <span
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold uppercase border ${
                      isRevoked
                        ? 'bg-zinc-900 text-zinc-500 border-zinc-800'
                        : isExpired
                        ? 'bg-zinc-900 text-zinc-400 border-zinc-700'
                        : 'bg-zinc-800 text-zinc-200 border-zinc-600'
                    }`}
                  >
                    {isRevoked ? 'Revoked' : isExpired ? 'Expired' : 'Active'}
                  </span>
                </div>

                {/* Included Credentials list */}
                <div className="bg-black/60 rounded-2xl p-3 border border-zinc-800/80 space-y-2">
                  <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Included Verifiable Credentials ({share.includedCerts.length})
                  </div>
                  <div className="space-y-1.5">
                    {share.includedCerts.map((cert) => (
                      <div
                        key={cert.certId}
                        className="flex items-center justify-between text-xs p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {cert.certType}
                          </span>
                          <span className="text-zinc-200 truncate">{cert.certTitle}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-mono text-zinc-400">
                          {cert.zkEnabled && <Shield className="w-3 h-3 text-zinc-300" />}
                          <span>{cert.disclosedAttributesCount} claims</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Share Link & Expiry Information */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2 bg-black/80 p-2 rounded-xl border border-zinc-800">
                    <span className="font-mono text-zinc-300 truncate text-[11px]">
                      {share.shareUrl}
                    </span>
                    <button
                      onClick={() => handleCopy(share.shareUrl, share.id)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors shrink-0 flex items-center gap-1 text-[11px]"
                    >
                      {copiedId === share.id ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === share.id ? t.copied : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {share.expiresAt
                          ? `Expires: ${new Date(share.expiresAt).toLocaleDateString()}`
                          : t.neverExpires}
                      </span>
                    </div>
                    <div>
                      {share.accessLogs.length} audit accesses recorded
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-end gap-2">
                  {!isRevoked && (
                    <button
                      onClick={() => onRevokeShare(share.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.revokeAccess}</span>
                    </button>
                  )}
                  <button
                    onClick={() => onInspectShare(share)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-colors shadow flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t.previewVerification}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
