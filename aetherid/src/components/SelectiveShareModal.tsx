import React, { useState } from 'react';
import {
  VerifiableCertificate,
  ShareRecipient,
  SelectiveShareConfig,
  SharedPresentationRecord,
} from '../types/certificate';
import { GoogleContact } from '../services/workspaceServices';
import {
  X,
  Share2,
  Shield,
  CheckCircle2,
  Clock,
  User,
  Sliders,
  QrCode,
  Copy,
  Check,
  Eye,
  FileSpreadsheet,
  Calendar,
  Lock,
  Flame,
  Sparkles,
  Users,
  Search,
  ExternalLink,
} from 'lucide-react';

interface SelectiveShareModalProps {
  allCertificates: VerifiableCertificate[];
  initialSelectedCertIds: string[];
  googleContacts: GoogleContact[];
  isLoadingContacts: boolean;
  onFetchGoogleContacts: () => void;
  hasGoogleToken: boolean;
  onGenerateShare: (config: SelectiveShareConfig) => SharedPresentationRecord;
  onClose: () => void;
  onPreviewSharedPresentation: (record: SharedPresentationRecord) => void;
}

export const SelectiveShareModal: React.FC<SelectiveShareModalProps> = ({
  allCertificates,
  initialSelectedCertIds,
  googleContacts,
  isLoadingContacts,
  onFetchGoogleContacts,
  hasGoogleToken,
  onGenerateShare,
  onClose,
  onPreviewSharedPresentation,
}) => {
  // Wizard steps
  const [step, setStep] = useState<'certs' | 'attributes' | 'recipient_and_policy' | 'result'>('certs');

  // Selected certificates
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialSelectedCertIds.length > 0 ? initialSelectedCertIds : [allCertificates[0]?.id].filter(Boolean)
  );

  // Selected attributes for each certificate
  const [disclosedAttributes, setDisclosedAttributes] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    allCertificates.forEach((c) => {
      map[c.id] = c.attributes.filter((a) => a.disclosedByDefault).map((a) => a.key);
    });
    return map;
  });

  // Recipient info
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmailOrDid, setRecipientEmailOrDid] = useState('');
  const [showContactsPicker, setShowContactsPicker] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  // Policies
  const [expirationMinutes, setExpirationMinutes] = useState<number>(1440); // 24 hours
  const [oneTimeView, setOneTimeView] = useState<boolean>(false);
  const [enableZeroKnowledgeProof, setEnableZeroKnowledgeProof] = useState<boolean>(true);
  const [allowDownloadRawVC, setAllowDownloadRawVC] = useState<boolean>(true);
  const [exportToGoogleSheets, setExportToGoogleSheets] = useState<boolean>(hasGoogleToken);
  const [createCalendarEvent, setCreateCalendarEvent] = useState<boolean>(hasGoogleToken);

  // Generated share record
  const [generatedRecord, setGeneratedRecord] = useState<SharedPresentationRecord | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Handle cert selection toggle
  const toggleCert = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Handle attribute disclosure toggle
  const toggleAttribute = (certId: string, attrKey: string) => {
    setDisclosedAttributes((prev) => {
      const current = prev[certId] || [];
      const updated = current.includes(attrKey)
        ? current.filter((k) => k !== attrKey)
        : [...current, attrKey];
      return { ...prev, [certId]: updated };
    });
  };

  // Choose from Google contacts
  const handleSelectContact = (contact: GoogleContact) => {
    setRecipientName(contact.name);
    setRecipientEmailOrDid(contact.email);
    setShowContactsPicker(false);
  };

  // Submit and create presentation
  const handleCreatePresentation = () => {
    if (selectedIds.length === 0) return;

    const config: SelectiveShareConfig = {
      selectedCertIds: selectedIds,
      disclosedAttributeKeys: disclosedAttributes,
      recipient: {
        name: recipientName || 'Authorized Verifier',
        emailOrDid: recipientEmailOrDid || 'anonymous-verifier',
      },
      expirationMinutes,
      oneTimeView,
      enableZeroKnowledgeProof,
      allowDownloadRawVC,
      exportToGoogleSheets,
      createCalendarEvent,
    };

    const record = onGenerateShare(config);
    setGeneratedRecord(record);
    setStep('result');
  };

  const handleCopyLink = () => {
    if (!generatedRecord) return;
    navigator.clipboard.writeText(generatedRecord.shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredContacts = googleContacts.filter(
    (c) =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(contactSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl shadow-cyan-950/50 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Top Line */}
        <div className="h-2 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600" />

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Selective Credential Presentation
              </h2>
              <p className="text-xs text-slate-400">
                Grant temporary, scoped verification of selected AI DIDs, SBTs, or TBAs.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Step Indicator */}
        {step !== 'result' && (
          <div className="grid grid-cols-3 border-b border-slate-800 text-xs text-center font-medium bg-slate-950/50">
            <button
              onClick={() => setStep('certs')}
              className={`py-3 px-2 border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                step === 'certs'
                  ? 'border-cyan-400 text-cyan-300 font-bold bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-mono">
                1
              </span>
              <span>1. Select Certificates ({selectedIds.length})</span>
            </button>

            <button
              onClick={() => setStep('attributes')}
              disabled={selectedIds.length === 0}
              className={`py-3 px-2 border-b-2 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 ${
                step === 'attributes'
                  ? 'border-cyan-400 text-cyan-300 font-bold bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-mono">
                2
              </span>
              <span>2. Disclose Attributes (ZK)</span>
            </button>

            <button
              onClick={() => setStep('recipient_and_policy')}
              disabled={selectedIds.length === 0}
              className={`py-3 px-2 border-b-2 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 ${
                step === 'recipient_and_policy'
                  ? 'border-cyan-400 text-cyan-300 font-bold bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-mono">
                3
              </span>
              <span>3. Recipient & Scope Policy</span>
            </button>
          </div>
        )}

        {/* Step 1: Select Certificates */}
        {step === 'certs' && (
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="text-xs text-slate-300 flex items-center justify-between">
              <span>Choose which credentials to bundle into this verifiable presentation:</span>
              <span className="text-cyan-400 font-mono font-medium">
                {selectedIds.length} of {allCertificates.length} selected
              </span>
            </div>

            <div className="space-y-3">
              {allCertificates.map((cert) => {
                const isSelected = selectedIds.includes(cert.id);
                return (
                  <div
                    key={cert.id}
                    onClick={() => toggleCert(cert.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-cyan-950/30 border-cyan-500/70 shadow-md shadow-cyan-950/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 shadow-sm'
                            : 'border border-slate-700 bg-slate-900 text-transparent'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 fill-current" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-slate-800 text-slate-300">
                            {cert.type}
                          </span>
                          <span className="text-xs font-bold text-white">{cert.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {cert.subtitle} • Issuer: {cert.issuer.name}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-cyan-400">
                        {cert.attributes.length} Attributes
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Attribute-Level Zero-Knowledge Selective Disclosure */}
        {step === 'attributes' && (
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white font-semibold">Zero-Knowledge Selective Disclosure:</strong>{' '}
                Toggle off any sensitive fields. Cryptographic ZK proofs will verify their validity mathematically to the verifier without revealing the private plaintext!
              </div>
            </div>

            {selectedIds.map((certId) => {
              const cert = allCertificates.find((c) => c.id === certId);
              if (!cert) return null;
              const disclosed = disclosedAttributes[cert.id] || [];

              return (
                <div key={cert.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-slate-800 text-slate-300">
                        {cert.type}
                      </span>
                      <h4 className="text-xs font-bold text-white">{cert.title}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      Disclosing {disclosed.length} of {cert.attributes.length} attributes
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cert.attributes.map((attr) => {
                      const isDisclosed = disclosed.includes(attr.key);
                      return (
                        <div
                          key={attr.key}
                          onClick={() => toggleAttribute(cert.id, attr.key)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                            isDisclosed
                              ? 'bg-slate-900 border-cyan-500/50 text-white'
                              : 'bg-slate-950/40 border-slate-800/80 text-slate-500 line-through'
                          }`}
                        >
                          <div className="truncate">
                            <div className="font-semibold text-[11px] truncate">{attr.label}</div>
                            <div className="font-mono text-[10px] text-cyan-400 truncate">
                              {isDisclosed ? String(attr.value) : '[ZK-Encrypted]'}
                            </div>
                          </div>

                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                              isDisclosed
                                ? 'bg-cyan-500 text-slate-950'
                                : 'bg-slate-800 text-transparent'
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Step 3: Recipient & Expiration Policy */}
        {step === 'recipient_and_policy' && (
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Recipient Specification */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Designated Recipient (Person, Org, or Verifier DID)</span>
                </label>

                {/* Google Contacts Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    setShowContactsPicker(!showContactsPicker);
                    if (googleContacts.length === 0 && hasGoogleToken) {
                      onFetchGoogleContacts();
                    }
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Choose from Google Contacts</span>
                </button>
              </div>

              {/* Contacts Picker Dropdown / Modal */}
              {showContactsPicker && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      placeholder="Search Google Contacts..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500"
                    />
                  </div>

                  {isLoadingContacts ? (
                    <div className="text-center py-4 text-xs text-slate-400">Loading contacts...</div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="text-center py-3 text-xs text-slate-500">
                      {hasGoogleToken
                        ? 'No matching contacts found.'
                        : 'Sign in with Google to load your address book contacts.'}
                    </div>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-1">
                      {filteredContacts.slice(0, 10).map((c) => (
                        <div
                          key={c.resourceName || c.email}
                          onClick={() => handleSelectContact(c)}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2">
                            {c.photoUrl ? (
                              <img src={c.photoUrl} alt={c.name} className="w-5 h-5 rounded-full" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px]">
                                {c.name[0]}
                              </div>
                            )}
                            <span className="font-medium text-slate-200">{c.name}</span>
                          </div>
                          <span className="text-slate-400 font-mono text-[11px]">{c.email}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Recipient Name (e.g. Audit Committee)"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
                <input
                  type="text"
                  value={recipientEmailOrDid}
                  onChange={(e) => setRecipientEmailOrDid(e.target.value)}
                  placeholder="Recipient Email or did:key:... / did:ion:..."
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            {/* Expiration Duration Policy */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Presentation Validity Lifetime (Time-to-Live)</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label: '10 Minutes', value: 10, desc: 'Ephemeral / Demo' },
                  { label: '1 Hour', value: 60, desc: 'Meeting Review' },
                  { label: '24 Hours', value: 1440, desc: 'Standard Audit' },
                  { label: '7 Days', value: 10080, desc: 'Extended Verification' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExpirationMinutes(opt.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      expirationMinutes === opt.value
                        ? 'bg-cyan-500/15 border-cyan-500 text-white font-semibold shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[10px] text-slate-400">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Security Scope Toggles */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Security Restrictions & Policies</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* One-Time View */}
                <div
                  onClick={() => setOneTimeView(!oneTimeView)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    oneTimeView
                      ? 'bg-rose-950/20 border-rose-500/50 text-rose-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Flame className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        Burn After Reading (1 View)
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Link auto-revokes immediately once inspected
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={oneTimeView}
                    onChange={() => {}}
                    className="accent-rose-500"
                  />
                </div>

                {/* ZK Mathematical Proof */}
                <div
                  onClick={() => setEnableZeroKnowledgeProof(!enableZeroKnowledgeProof)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    enableZeroKnowledgeProof
                      ? 'bg-purple-950/20 border-purple-500/50 text-purple-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        ZK Proof Anchoring
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Attach cryptographic proof of secret attributes
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableZeroKnowledgeProof}
                    onChange={() => {}}
                    className="accent-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Google Workspace Automations */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google Workspace Automation Options</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportToGoogleSheets}
                    onChange={(e) => setExportToGoogleSheets(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  <div>
                    <span className="text-slate-200 font-medium">Log to Google Sheets</span>
                    <p className="text-[10px] text-slate-400">Record share event in audit spreadsheet</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createCalendarEvent}
                    onChange={(e) => setCreateCalendarEvent(e.target.checked)}
                    className="accent-amber-500"
                  />
                  <div>
                    <span className="text-slate-200 font-medium">Calendar Expiry Check</span>
                    <p className="text-[10px] text-slate-400">Add presentation expiration to Calendar</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Result & Share Link Generated */}
        {step === 'result' && generatedRecord && (
          <div className="p-6 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border-2 border-cyan-400/50 flex items-center justify-center mx-auto text-cyan-400 shadow-xl shadow-cyan-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                Verifiable Presentation Ready!
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Your temporary presentation has been cryptographically signed with your DID key.
                Share this secure link or QR code with {generatedRecord.recipientName}.
              </p>
            </div>

            {/* QR Code representation */}
            <div className="inline-block p-4 bg-white rounded-2xl shadow-xl">
              <div className="w-40 h-40 bg-slate-950 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden">
                {/* SVG mock QR pattern with cyan accents */}
                <div className="grid grid-cols-6 gap-1 w-full h-full p-1 opacity-90">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-sm ${
                        (i % 2 === 0 && i % 3 === 0) || i < 6 || i > 29 || i % 7 === 0
                          ? 'bg-cyan-400'
                          : (i * 7) % 5 === 0
                          ? 'bg-purple-400'
                          : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-lg bg-slate-950 border border-cyan-400 flex items-center justify-center text-cyan-300">
                    <Shield className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <div className="text-[10px] font-mono text-slate-800 mt-2 font-semibold">
                Scan with any W3C Verifier
              </div>
            </div>

            {/* Copyable Share URL */}
            <div className="max-w-xl mx-auto bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
              <div className="font-mono text-xs text-cyan-300 truncate pl-2 text-left">
                {generatedRecord.shareUrl}
              </div>

              <button
                onClick={handleCopyLink}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors flex items-center gap-1.5 shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            {/* Scope Summary Card */}
            <div className="max-w-xl mx-auto bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-left text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span>Designated Recipient:</span>
                <span className="text-white font-medium">{generatedRecord.recipientName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Expires At:</span>
                <span className="text-amber-400 font-mono">
                  {generatedRecord.expiresAt ? new Date(generatedRecord.expiresAt).toLocaleString() : 'Permanent'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Included Credentials:</span>
                <span className="text-cyan-400 font-mono">
                  {generatedRecord.includedCerts.length} certificates
                </span>
              </div>
              {generatedRecord.oneTimeView && (
                <div className="flex items-center gap-1.5 text-rose-400 text-[11px] pt-1 border-t border-slate-800/80">
                  <Flame className="w-3.5 h-3.5" />
                  <span>One-Time View: Link burns after first access</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  onClose();
                  onPreviewSharedPresentation(generatedRecord);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2"
              >
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>Simulate Recipient Verifier View</span>
              </button>

              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/20"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        {step !== 'result' && (
          <div className="p-6 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between gap-4">
            {step === 'certs' ? (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            ) : (
              <button
                onClick={() => {
                  if (step === 'attributes') setStep('certs');
                  if (step === 'recipient_and_policy') setStep('attributes');
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700"
              >
                Back
              </button>
            )}

            {step === 'certs' && (
              <button
                onClick={() => setStep('attributes')}
                disabled={selectedIds.length === 0}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
              >
                Continue to Disclose Attributes
              </button>
            )}

            {step === 'attributes' && (
              <button
                onClick={() => setStep('recipient_and_policy')}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/20"
              >
                Configure Recipient & Policy
              </button>
            )}

            {step === 'recipient_and_policy' && (
              <button
                onClick={handleCreatePresentation}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Issue & Generate Verifiable Link</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
