import React, { useState } from 'react';
import {
  VerifiableCertificate,
  CertificateType,
  AttributeItem,
} from '../types/certificate';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Shield,
  Fingerprint,
  Lock,
  Wallet,
} from 'lucide-react';

interface MintCustomCertModalProps {
  onClose: () => void;
  onMintCertificate: (cert: VerifiableCertificate) => void;
}

export const MintCustomCertModal: React.FC<MintCustomCertModalProps> = ({
  onClose,
  onMintCertificate,
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CertificateType>('DID');
  const [issuerName, setIssuerName] = useState('Frontier AI Verified Issuer');
  const [expiresInDays, setExpiresInDays] = useState<number>(365);
  const [isPermanent, setIsPermanent] = useState(false);
  const [accentColor, setAccentColor] = useState<'cyan' | 'purple' | 'emerald' | 'amber'>('cyan');

  // Custom attributes list
  const [attributes, setAttributes] = useState<AttributeItem[]>([
    {
      key: 'model_engine',
      label: 'Model Architecture',
      value: 'Gemini 2.5 Flash Sovereign',
      category: 'capability',
      zkProofAvailable: true,
      disclosedByDefault: true,
    },
    {
      key: 'autonomy_tier',
      label: 'Autonomy Level',
      value: 'Tier 3 (Supervised Agent)',
      category: 'capability',
      zkProofAvailable: true,
      disclosedByDefault: true,
    },
  ]);

  const [newAttrLabel, setNewAttrLabel] = useState('');
  const [newAttrValue, setNewAttrValue] = useState('');

  const handleAddAttribute = () => {
    if (!newAttrLabel.trim() || !newAttrValue.trim()) return;
    const key = newAttrLabel.toLowerCase().replace(/\s+/g, '_');
    setAttributes((prev) => [
      ...prev,
      {
        key,
        label: newAttrLabel.trim(),
        value: newAttrValue.trim(),
        category: 'capability',
        zkProofAvailable: true,
        disclosedByDefault: true,
      },
    ]);
    setNewAttrLabel('');
    setNewAttrValue('');
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const id = `${type.toLowerCase()}-custom-${randomSuffix}`;
    const didSubject = `did:key:z6Mku${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const now = new Date();
    const expiryDate = isPermanent
      ? null
      : new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

    const newCert: VerifiableCertificate = {
      id,
      title: title.trim(),
      subtitle: subtitle.trim() || `Verifiable ${type} Digital Identity`,
      description: description.trim() || `Cryptographically verified ${type} attestation minted in AetherID Wallet.`,
      type,
      didSubject,
      issuer: {
        name: issuerName.trim() || 'Sovereign AI Identity Registry',
        did: `did:org:issuer:${Math.random().toString(36).substring(2, 10)}`,
        trustScore: 98,
        verified: true,
        domain: 'identity.verifiable.ai',
        complianceRating: 'A+',
      },
      issuedAt: now.toISOString(),
      expiresAt: expiryDate,
      status: 'active',
      network: type === 'TBA' ? 'Base Sovereign L2' : type === 'SBT' ? 'Ethereum (EIP-5192)' : 'Decentralized Web Node (DWN)',
      accentColor,
      iconName: type === 'DID' ? 'Fingerprint' : type === 'SBT' ? 'ShieldCheck' : 'Wallet',
      attributes,
      proof: {
        type: 'Ed25519Signature2020',
        created: now.toISOString(),
        verificationMethod: `did:org:issuer#key-1`,
        proofPurpose: 'assertionMethod',
        proofValue: `z${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
        sha256Fingerprint: `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      },
      tags: [type, 'Custom Issued', 'Cryptographically Valid'],
      ...(type === 'TBA'
        ? {
            tbaInfo: {
              accountAddress: `0x${Array.from({ length: 20 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
              registryContract: '0x02101dfB77FDE0926b46098115302927d4253e70',
              tokenContract: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
              tokenId: String(Math.floor(Math.random() * 9000 + 1000)),
              chainId: 8453,
              networkName: 'Base L2',
              balanceEth: '1.25 ETH ($4,120 USD)',
              dailyGasLimitEth: '0.10 ETH',
              dailyGasUsedEth: '0.01 ETH',
              autonomousExecutionEnabled: true,
              delegatedKeyCount: 2,
            },
          }
        : {}),
      ...(type === 'SBT'
        ? {
            sbtInfo: {
              isSoulbound: true,
              nonTransferableReason: 'EIP-5192: Bound permanently to agent DID',
              mintTxHash: `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
              blockHeight: 22001928,
              governanceWeight: 100,
              revocableByIssuer: true,
            },
          }
        : {}),
    };

    onMintCertificate(newCert);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl shadow-purple-950/40 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-2 w-full bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500" />

        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Mint / Register Digital Credential</h2>
              <p className="text-xs text-slate-400">Create a sovereign AI DID, Soulbound Token, or Token Bound Account.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Credential Type Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">Credential Type</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: 'DID' as CertificateType, label: 'W3C DID', desc: 'Agent Identity', icon: Fingerprint },
                { type: 'SBT' as CertificateType, label: 'Soulbound SBT', desc: 'Non-transferable', icon: Lock },
                { type: 'TBA' as CertificateType, label: 'ERC-6551 TBA', desc: 'Token Bound Account', icon: Wallet },
              ].map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => {
                      setType(opt.type);
                      if (opt.type === 'DID') setAccentColor('cyan');
                      if (opt.type === 'SBT') setAccentColor('purple');
                      if (opt.type === 'TBA') setAccentColor('emerald');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      type === opt.type
                        ? 'bg-slate-800 border-cyan-400 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1.5 text-cyan-400" />
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[10px] text-slate-400">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Credential Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Autonomous Multimodal Reasoning DID"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Subtitle / Purpose</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Verified Autonomous Decision Engine"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          {/* Issuer & Validity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Issuer Authority Name</label>
              <input
                type="text"
                value={issuerName}
                onChange={(e) => setIssuerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Validity Lifetime</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  disabled={isPermanent}
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 disabled:opacity-40"
                />
                <span className="text-xs text-slate-400">days</span>
                <label className="flex items-center gap-1.5 ml-auto text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPermanent}
                    onChange={(e) => setIsPermanent(e.target.checked)}
                    className="accent-cyan-500"
                  />
                  <span>Permanent (SBT)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Custom Attributes */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-300 block">Custom Claims & Attributes</label>
            <div className="space-y-2">
              {attributes.map((attr, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs"
                >
                  <div>
                    <span className="text-slate-400 font-medium">{attr.label}: </span>
                    <span className="text-cyan-300 font-mono">{String(attr.value)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttribute(idx)}
                    className="p-1 text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newAttrLabel}
                onChange={(e) => setNewAttrLabel(e.target.value)}
                placeholder="Attribute Label (e.g. Model)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
              />
              <input
                type="text"
                value={newAttrValue}
                onChange={(e) => setNewAttrValue(e.target.value)}
                placeholder="Value (e.g. Gemini 2.5)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
              />
              <button
                type="button"
                onClick={handleAddAttribute}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-slate-950 transition-all shadow-md shadow-purple-500/20"
            >
              Mint & Anchor Credential
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
