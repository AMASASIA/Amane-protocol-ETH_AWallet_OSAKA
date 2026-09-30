import React, { useState } from 'react';
import { VerifiableCertificate } from '../types/certificate';
import {
  X,
  Shield,
  CheckCircle2,
  Calendar,
  Lock,
  Wallet,
  Cpu,
  Share2,
  Copy,
  Check,
  FileSpreadsheet,
  HardDrive,
  ExternalLink,
  Fingerprint,
  Code2,
  Clock,
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface CertificateDetailModalProps {
  certificate: VerifiableCertificate | null;
  onClose: () => void;
  onOpenShareModal: (cert: VerifiableCertificate) => void;
  onSyncSheets: (cert: VerifiableCertificate) => void;
  onBackupDrive: (cert: VerifiableCertificate) => void;
  onCalendarAlert: (cert: VerifiableCertificate) => void;
  hasGoogleToken: boolean;
  onGoogleLogin: () => void;
  language: Language;
}

export const CertificateDetailModal: React.FC<CertificateDetailModalProps> = ({
  certificate,
  onClose,
  onOpenShareModal,
  onSyncSheets,
  onBackupDrive,
  onCalendarAlert,
  hasGoogleToken,
  onGoogleLogin,
  language,
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'overview' | 'attributes' | 'smart_contract' | 'raw_vc'>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!certificate) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formattedVC = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://schema.org',
      'https://w3id.org/security/suites/ed25519-2020/v1',
    ],
    id: `urn:uuid:${certificate.id}`,
    type: ['VerifiableCredential', `${certificate.type}Credential`],
    issuer: certificate.issuer.did,
    issuanceDate: certificate.issuedAt,
    expirationDate: certificate.expiresAt,
    credentialSubject: {
      id: certificate.didSubject,
      title: certificate.title,
      type: certificate.type,
      ...certificate.attributes.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, any>),
    },
    proof: certificate.proof,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-3xl bg-gradient-to-b from-zinc-900 to-black border border-zinc-700/80 shadow-2xl shadow-black overflow-hidden my-4 sm:my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle silver gradient top bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-white/80 to-transparent" />

        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-800 bg-zinc-950/80 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0">
              {certificate.type === 'DID' ? (
                <Fingerprint className="w-6 h-6" />
              ) : certificate.type === 'SBT' ? (
                <Lock className="w-6 h-6" />
              ) : (
                <Wallet className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase bg-zinc-800 text-zinc-200 border border-zinc-700">
                  {certificate.type === 'DID' ? t.filterDid : certificate.type === 'SBT' ? t.filterSbt : t.filterTba}
                </span>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-zinc-900 text-zinc-300 border border-zinc-800">
                  {certificate.network}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {certificate.title}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                {certificate.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-4 px-4 sm:px-6 pt-2 border-b border-zinc-800 bg-zinc-950/40 text-xs overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 font-semibold transition-all border-b-2 ${
              activeTab === 'overview'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('attributes')}
            className={`pb-2.5 font-semibold transition-all border-b-2 ${
              activeTab === 'attributes'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Attributes ({certificate.attributes.length})
          </button>
          <button
            onClick={() => setActiveTab('smart_contract')}
            className={`pb-2.5 font-semibold transition-all border-b-2 ${
              activeTab === 'smart_contract'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Proof & Signature
          </button>
          <button
            onClick={() => setActiveTab('raw_vc')}
            className={`pb-2.5 font-semibold transition-all border-b-2 ${
              activeTab === 'raw_vc'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Raw W3C JSON-LD
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Description */}
              <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800">
                <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Description & Intended Scope
                </div>
                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                  {certificate.description}
                </p>
              </div>

              {/* Core Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-black/60 rounded-xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                    {t.didSubject}
                  </div>
                  <div className="text-xs font-mono text-zinc-200 mt-1 truncate">
                    {certificate.didSubject}
                  </div>
                </div>

                <div className="p-3.5 bg-black/60 rounded-xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                    {t.issuer}
                  </div>
                  <div className="text-xs text-zinc-200 mt-1 flex items-center justify-between">
                    <span className="font-semibold">{certificate.issuer.name}</span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      Trust: {certificate.issuer.trustScore}%
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-black/60 rounded-xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                    {t.issuedOn}
                  </div>
                  <div className="text-xs text-zinc-200 mt-1">
                    {new Date(certificate.issuedAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="p-3.5 bg-black/60 rounded-xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                    {t.expiresOn}
                  </div>
                  <div className="text-xs text-zinc-200 mt-1">
                    {certificate.expiresAt ? new Date(certificate.expiresAt).toLocaleDateString() : t.neverExpires}
                  </div>
                </div>
              </div>

              {/* Workspace Sync Action Bar */}
              <div className="p-4 bg-zinc-950/80 rounded-2xl border border-zinc-800 space-y-2">
                <div className="text-xs font-semibold text-zinc-300">
                  Google Workspace Synchronizations
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => onSyncSheets(certificate)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-300" />
                    <span>{t.syncToSheets}</span>
                  </button>

                  <button
                    onClick={() => onBackupDrive(certificate)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-zinc-300" />
                    <span>{t.backupToDrive}</span>
                  </button>

                  <button
                    onClick={() => onCalendarAlert(certificate)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5 text-zinc-300" />
                    <span>{t.calendarAlert}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attributes' && (
            <div className="space-y-2">
              {certificate.attributes.map((attr) => (
                <div
                  key={attr.key}
                  className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-zinc-200">{attr.label}</div>
                    <div className="text-[11px] font-mono text-zinc-400 mt-0.5">{attr.key}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-white font-medium">{attr.value}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      {attr.zkProofAvailable ? t.zkProofAvailable : 'Standard Plaintext'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'smart_contract' && (
            <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-300">{t.signatureType}</span>
                <span className="font-mono text-white">{certificate.proof.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-300">Verification Method</span>
                <span className="font-mono text-zinc-400 truncate max-w-xs">{certificate.proof.verificationMethod}</span>
              </div>
              <div className="pt-2 border-t border-zinc-800">
                <span className="font-semibold text-zinc-400 block mb-1">{t.fingerprint}</span>
                <span className="font-mono text-[11px] text-zinc-300 break-all bg-black/60 p-2 rounded-lg block border border-zinc-800">
                  {certificate.proof.sha256Fingerprint}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'raw_vc' && (
            <div className="relative">
              <button
                onClick={() => handleCopy(JSON.stringify(formattedVC, null, 2), 'raw_json')}
                className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1"
              >
                {copiedKey === 'raw_json' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'raw_json' ? t.copied : 'Copy JSON'}</span>
              </button>
              <pre className="p-4 bg-black border border-zinc-800 rounded-2xl text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-96">
                {JSON.stringify(formattedVC, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => onOpenShareModal(certificate)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-colors shadow"
          >
            <Share2 className="w-4 h-4" />
            <span>{t.sharePresentation}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
