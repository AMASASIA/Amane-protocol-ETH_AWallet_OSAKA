import React, { useState } from 'react';
import {
  VerifiableCertificate,
  CertificateType,
  CertificateStatus,
} from '../types/certificate';
import {
  Shield,
  Search,
  CheckCircle2,
  Calendar,
  Lock,
  Wallet,
  Cpu,
  Eye,
  Share2,
  Fingerprint,
  PlusCircle,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface GridViewProps {
  certificates: VerifiableCertificate[];
  selectedCertIds: string[];
  onToggleSelectCert: (certId: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onInspectCert: (cert: VerifiableCertificate) => void;
  onOpenSelectiveShare: () => void;
  onOpenMintModal: () => void;
  onQuickSyncToSheets: (cert: VerifiableCertificate) => void;
  language: Language;
}

export const GridView: React.FC<GridViewProps> = ({
  certificates,
  selectedCertIds,
  onToggleSelectCert,
  onSelectAll,
  onClearSelection,
  onInspectCert,
  onOpenSelectiveShare,
  onOpenMintModal,
  onQuickSyncToSheets,
  language,
}) => {
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<CertificateType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<CertificateStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'trust' | 'title'>('newest');

  const filteredCerts = certificates
    .filter((cert) => {
      const matchType = typeFilter === 'ALL' || cert.type === typeFilter;
      const matchStatus = statusFilter === 'ALL' || cert.status === statusFilter;
      const matchSearch =
        cert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.issuer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.didSubject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchType && matchStatus && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
      }
      if (sortBy === 'trust') {
        return b.issuer.trustScore - a.issuer.trustScore;
      }
      return a.title.localeCompare(b.title);
    });

  const getTypeStyle = (type: CertificateType) => {
    switch (type) {
      case 'DID':
        return {
          label: t.filterDid,
          pill: 'bg-zinc-800 text-zinc-100 border-zinc-700',
          icon: Fingerprint,
        };
      case 'SBT':
        return {
          label: t.filterSbt,
          pill: 'bg-zinc-800 text-zinc-100 border-zinc-700',
          icon: Lock,
        };
      case 'TBA':
        return {
          label: t.filterTba,
          pill: 'bg-zinc-800 text-zinc-100 border-zinc-700',
          icon: Wallet,
        };
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Controls & Filtering Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 backdrop-blur-xl mb-6 sm:mb-8 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-black/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white transition-all"
            />
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={onOpenMintModal}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-zinc-300" />
              <span>{t.mintNewCert}</span>
            </button>

            {selectedCertIds.length > 0 && (
              <button
                onClick={onOpenSelectiveShare}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-all shadow-md active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                <span>{t.shareSelected} ({selectedCertIds.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters and Sort Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/80 text-xs">
          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-zinc-500 font-medium mr-1 hidden sm:inline">Type:</span>
            {(['ALL', 'DID', 'SBT', 'TBA'] as const).map((type) => {
              const label =
                type === 'ALL'
                  ? t.filterAll
                  : type === 'DID'
                  ? t.filterDid
                  : type === 'SBT'
                  ? t.filterSbt
                  : t.filterTba;
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                    typeFilter === type
                      ? 'bg-white text-black shadow-sm'
                      : 'bg-zinc-950/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Bulk Selection Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onSelectAll}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
            >
              {t.selectAll}
            </button>
            <button
              onClick={onClearSelection}
              disabled={selectedCertIds.length === 0}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-40 transition-colors"
            >
              {t.clearSelection}
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Certificates */}
      {filteredCerts.length === 0 ? (
        <div className="text-center py-16 px-4 bg-zinc-900/40 rounded-3xl border border-zinc-800 max-w-lg mx-auto">
          <Shield className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">{t.noCertificatesFound}</h3>
          <p className="text-xs text-zinc-400 mb-4">{t.cardsInDeck}</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setTypeFilter('ALL');
              setStatusFilter('ALL');
            }}
            className="px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredCerts.map((cert) => {
            const isSelected = selectedCertIds.includes(cert.id);
            const style = getTypeStyle(cert.type);
            const TypeIcon = style.icon;

            return (
              <div
                key={cert.id}
                onClick={() => onInspectCert(cert)}
                className={`relative rounded-3xl p-5 sm:p-6 bg-gradient-to-b from-zinc-900 to-black border transition-all duration-300 cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? 'border-white shadow-xl shadow-black ring-1 ring-white/30'
                    : 'border-zinc-800/90 hover:border-zinc-600 shadow-md hover:shadow-xl'
                }`}
              >
                <div>
                  {/* Top Badges & Select */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-mono font-bold uppercase border flex items-center gap-1.5 ${style.pill}`}>
                        <TypeIcon className="w-3.5 h-3.5" />
                        <span>{style.label}</span>
                      </span>
                      {cert.status === 'bound' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-zinc-300 border border-zinc-700">
                          {t.statusBound}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelectCert(cert.id);
                      }}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-white text-black font-bold'
                          : 'bg-zinc-900 border border-zinc-700 text-transparent hover:border-white'
                      }`}
                      title={isSelected ? 'Deselect' : 'Select for presentation'}
                    >
                      <CheckCircle2 className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-zinc-200 transition-colors line-clamp-2">
                    {cert.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                    {cert.description}
                  </p>

                  {/* Key Claims / Attributes */}
                  <div className="my-4 space-y-1.5">
                    {cert.attributes.slice(0, 3).map((attr) => (
                      <div
                        key={attr.key}
                        className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-black/60 border border-zinc-800/80"
                      >
                        <span className="text-zinc-400 truncate mr-2">{attr.label}</span>
                        <span className="text-zinc-200 font-mono font-semibold truncate max-w-[140px]">
                          {attr.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer / Issuer & Actions */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <img
                      src={cert.issuer.avatarUrl}
                      alt={cert.issuer.name}
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-zinc-700 shrink-0"
                    />
                    <div className="truncate">
                      <div className="text-[11px] font-semibold text-zinc-200 truncate">
                        {cert.issuer.name}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500">
                        {t.trustScore}: {cert.issuer.trustScore}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickSyncToSheets(cert);
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      title={t.syncToSheets}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectCert(cert);
                      }}
                      className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-colors shadow"
                    >
                      {t.inspectDetails}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
