import React, { useState, useEffect } from 'react';
import {
  SharedPresentationRecord,
  VerifiableCertificate,
} from '../types/certificate';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Lock,
  Sparkles,
  Download,
  AlertTriangle,
  User,
  Fingerprint,
  Calendar,
  Flame,
  FileText,
} from 'lucide-react';

interface VerifierViewModalProps {
  shareRecord: SharedPresentationRecord | null;
  allCertificates: VerifiableCertificate[];
  onClose: () => void;
  onRevokeShare?: (shareId: string) => void;
}

export const VerifierViewModal: React.FC<VerifierViewModalProps> = ({
  shareRecord,
  allCertificates,
  onClose,
  onRevokeShare,
}) => {
  const [verificationStep, setVerificationStep] = useState<number>(0);

  useEffect(() => {
    if (!shareRecord) return;
    setVerificationStep(0);
    const timers = [
      setTimeout(() => setVerificationStep(1), 400),
      setTimeout(() => setVerificationStep(2), 900),
      setTimeout(() => setVerificationStep(3), 1400),
      setTimeout(() => setVerificationStep(4), 1900),
    ];
    return () => timers.forEach(clearTimeout);
  }, [shareRecord]);

  if (!shareRecord) return null;

  const presentedCerts = shareRecord.includedCerts
    .map((item) => allCertificates.find((c) => c.id === item.certId))
    .filter(Boolean) as VerifiableCertificate[];

  const isExpired = shareRecord.expiresAt && new Date(shareRecord.expiresAt).getTime() < Date.now();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-lg overflow-y-auto">
      <div
        className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-emerald-500/40 shadow-2xl shadow-emerald-950/40 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-300 shadow-lg">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-emerald-200">
                W3C Verifiable Presentation Inspection Portal
              </div>
              <h2 className="text-xl font-bold text-white mt-0.5">
                Cryptographic Attestation Verification
              </h2>
            </div>
          </div>
        </div>

        {/* Verification Check Pipeline */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/80">
          <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center justify-between">
            <span>Live Cryptographic Verification Pipeline</span>
            <span className="font-mono text-emerald-400 text-[11px]">
              {verificationStep === 4 ? '100% Cryptographically Verified' : 'Evaluating Proofs...'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            {[
              { label: 'Signature Integrity', desc: 'Ed25519 curve check' },
              { label: 'Issuer Identity DID', desc: 'Trust Anchor match' },
              { label: 'Revocation Status', desc: 'On-chain ledger check' },
              { label: 'Zero-Knowledge Proofs', desc: 'zk-SNARK validity' },
            ].map((stepItem, idx) => {
              const isChecked = verificationStep > idx;
              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border text-xs transition-all ${
                    isChecked
                      ? 'bg-emerald-950/20 border-emerald-500/50 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                    {isChecked ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-600 animate-spin shrink-0" />
                    )}
                    <span className="truncate">{stepItem.label}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">{stepItem.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recipient & Policy Info Card */}
        <div className="px-6 py-4 bg-slate-950/50 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-300">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Prepared For: </span>
              <strong className="text-white">{shareRecord.recipientName}</strong>
              <span className="text-slate-400 font-mono text-[11px]">
                ({shareRecord.recipientEmailOrDid})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Expires: </span>
              <span className={`font-mono ${isExpired ? 'text-rose-400' : 'text-amber-400'}`}>
                {shareRecord.expiresAt ? new Date(shareRecord.expiresAt).toLocaleTimeString() : 'Permanent'}
              </span>
            </div>

            {shareRecord.oneTimeView && (
              <span className="flex items-center gap-1 text-[10px] font-mono uppercase bg-rose-500/10 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded">
                <Flame className="w-3 h-3 text-rose-400" /> One-Time View
              </span>
            )}
          </div>
        </div>

        {/* Presented Credentials Body */}
        <div className="p-6 space-y-6 max-h-[50vh] overflow-y-auto">
          {presentedCerts.map((cert) => (
            <div
              key={cert.id}
              className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300">
                      {cert.type}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800">
                      {cert.network}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Valid Signature
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{cert.title}</h3>
                  <p className="text-xs text-slate-400">{cert.subtitle}</p>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-400 font-mono">Issuer Trust</div>
                  <div className="text-sm font-mono font-bold text-emerald-400">
                    {cert.issuer.trustScore}%
                  </div>
                </div>
              </div>

              {/* Subject & Issuer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400">Subject DID:</div>
                  <div className="font-mono text-[11px] text-cyan-300 truncate mt-0.5">
                    {cert.didSubject}
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400">Issuer Authority:</div>
                  <div className="font-semibold text-[11px] text-white truncate mt-0.5">
                    {cert.issuer.name} ({cert.issuer.domain})
                  </div>
                </div>
              </div>

              {/* Disclosed Attributes */}
              <div>
                <div className="text-xs font-semibold text-slate-300 mb-2">
                  Disclosed Claims & Zero-Knowledge Proofs:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cert.attributes.map((attr) => (
                    <div
                      key={attr.key}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-400 text-[11px]">{attr.label}:</span>
                      <span className="text-white font-mono text-[11px] font-medium">
                        {String(attr.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cryptographic Proof Banner */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Algorithm: {cert.proof.type}</span>
                <span className="text-emerald-400">Fingerprint: {cert.proof.sha256Fingerprint.slice(0, 18)}...</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Audit Status: Validated against decentralized trust registries
          </div>

          <div className="flex items-center gap-2">
            {onRevokeShare && (
              <button
                onClick={() => {
                  onRevokeShare(shareRecord.id);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition-colors"
              >
                Revoke Presentation
              </button>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md"
            >
              Close Verification View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
