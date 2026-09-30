import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  VerifiableCertificate,
  CertificateType,
} from '../types/certificate';
import {
  Shield,
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Share2,
  Lock,
  Wallet,
  Cpu,
  Key,
  Eye,
  Sliders,
  Maximize2,
  PlusCircle,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  Fingerprint,
} from 'lucide-react';
import { Language, translations } from '../i18n/translations';

interface CascadeDeckProps {
  certificates: VerifiableCertificate[];
  selectedCertIds: string[];
  onToggleSelectCert: (certId: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onInspectCert: (cert: VerifiableCertificate) => void;
  onOpenSelectiveShare: () => void;
  onOpenMintModal: () => void;
  language: Language;
}

export const CascadeDeck: React.FC<CascadeDeckProps> = ({
  certificates,
  selectedCertIds,
  onToggleSelectCert,
  onInspectCert,
  onOpenSelectiveShare,
  onOpenMintModal,
  language,
}) => {
  const t = translations[language];
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<CertificateType | 'ALL'>('ALL');
  const [perspectiveTilt, setPerspectiveTilt] = useState<'cascade' | 'isometric' | 'fan'>('cascade');
  const [cardSpread, setCardSpread] = useState<number>(45);

  // Filter certificates
  const filteredCerts = certificates.filter((cert) => {
    const matchesType = filterType === 'ALL' || cert.type === filterType;
    const matchesSearch =
      cert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.issuer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.didSubject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const activeCert = filteredCerts[activeIndex] || filteredCerts[0];

  const getTypeBadge = (type: CertificateType) => {
    switch (type) {
      case 'DID':
        return {
          label: t.filterDid,
          bg: 'bg-zinc-800 text-white border-zinc-700',
          icon: Fingerprint,
        };
      case 'SBT':
        return {
          label: t.filterSbt,
          bg: 'bg-zinc-800 text-white border-zinc-700',
          icon: Lock,
        };
      case 'TBA':
        return {
          label: t.filterTba,
          bg: 'bg-zinc-800 text-white border-zinc-700',
          icon: Wallet,
        };
    }
  };

  return (
    <div className="w-full relative min-h-[calc(100vh-80px)] flex flex-col justify-between py-4 sm:py-6 px-3 sm:px-6 lg:px-8 overflow-hidden select-none">
      {/* Background ambient lighting in monochrome noir */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-white/[0.03] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-white/[0.02] rounded-full blur-[140px] pointer-events-none" />

      {/* Top Filter and Controls Bar */}
      <div className="relative z-20 max-w-5xl mx-auto w-full mb-3 sm:mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5 bg-zinc-900/80 p-2.5 sm:p-3 rounded-2xl border border-zinc-800/80 backdrop-blur-md">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveIndex(0);
              }}
              placeholder={t.searchPlaceholder}
              className="w-full bg-black/70 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 sm:py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white transition-all"
            />
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
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
                  onClick={() => {
                    setFilterType(type);
                    setActiveIndex(0);
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    filterType === type
                      ? 'bg-white text-black shadow-md'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* 3D Tilt View Mode Switcher */}
          <div className="hidden sm:flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setPerspectiveTilt('cascade')}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                perspectiveTilt === 'cascade'
                  ? 'bg-zinc-800 text-white font-medium'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t.tiltCascade}
            </button>
            <button
              onClick={() => setPerspectiveTilt('isometric')}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                perspectiveTilt === 'isometric'
                  ? 'bg-zinc-800 text-white font-medium'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t.tiltIsometric}
            </button>
            <button
              onClick={() => setPerspectiveTilt('fan')}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                perspectiveTilt === 'fan'
                  ? 'bg-zinc-800 text-white font-medium'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t.tiltFan}
            </button>
          </div>
        </div>
      </div>

      {/* Main 3D Cascading Stack Area */}
      <div className="relative flex-1 flex items-center justify-center my-2 sm:my-6 overflow-hidden perspective-container">
        {filteredCerts.length === 0 ? (
          <div className="text-center p-8 bg-zinc-900/60 rounded-3xl border border-zinc-800 max-w-md mx-auto">
            <Shield className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">{t.noCertificatesFound}</h3>
            <p className="text-xs text-zinc-400 mb-4">{t.cardsInDeck}</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="relative w-full max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl h-[420px] sm:h-[480px] md:h-[520px] flex items-center justify-center preserve-3d">
            {filteredCerts.map((cert, index) => {
              const isCurrent = index === activeIndex;
              const offsetFromActive = index - activeIndex;
              const typeBadge = getTypeBadge(cert.type);
              const BadgeIcon = typeBadge.icon;
              const isSelected = selectedCertIds.includes(cert.id);

              // 3D Matrix transform calculation
              let transformStyles = {};
              let zIndex = filteredCerts.length - Math.abs(offsetFromActive);

              if (perspectiveTilt === 'cascade') {
                const xOffset = offsetFromActive * cardSpread;
                const yOffset = offsetFromActive * -26;
                const zOffset = -Math.abs(offsetFromActive) * 70;
                const rotateY = -18;
                const rotateX = 8;
                const rotateZ = -4;

                transformStyles = {
                  transform: `translateX(${xOffset}px) translateY(${yOffset}px) translateZ(${zOffset}px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg)`,
                  opacity: Math.abs(offsetFromActive) > 4 ? 0 : 1 - Math.abs(offsetFromActive) * 0.16,
                };
              } else if (perspectiveTilt === 'isometric') {
                const xOffset = offsetFromActive * (cardSpread * 0.85);
                const yOffset = offsetFromActive * 30;
                const zOffset = -Math.abs(offsetFromActive) * 80;

                transformStyles = {
                  transform: `translateX(${xOffset}px) translateY(${yOffset}px) translateZ(${zOffset}px) rotateX(25deg) rotateZ(-20deg)`,
                  opacity: Math.abs(offsetFromActive) > 4 ? 0 : 1 - Math.abs(offsetFromActive) * 0.18,
                };
              } else {
                // Fan view
                const xOffset = offsetFromActive * (cardSpread * 1.1);
                const rotateZ = offsetFromActive * 4.5;
                const zOffset = -Math.abs(offsetFromActive) * 60;

                transformStyles = {
                  transform: `translateX(${xOffset}px) translateZ(${zOffset}px) rotateZ(${rotateZ}deg)`,
                  opacity: Math.abs(offsetFromActive) > 4 ? 0 : 1 - Math.abs(offsetFromActive) * 0.15,
                };
              }

              return (
                <motion.div
                  key={cert.id}
                  onClick={() => setActiveIndex(index)}
                  style={{
                    ...transformStyles,
                    zIndex: isCurrent ? 50 : zIndex,
                  }}
                  className={`absolute w-full max-w-[340px] sm:max-w-[420px] md:max-w-[480px] h-[380px] sm:h-[440px] md:h-[480px] rounded-3xl p-5 sm:p-6 cursor-pointer transition-all duration-500 ease-out select-none flex flex-col justify-between ${
                    isCurrent
                      ? 'border border-white/40 shadow-2xl shadow-black ring-1 ring-white/20 bg-gradient-to-b from-zinc-800 to-black'
                      : 'border border-zinc-800/80 shadow-lg bg-zinc-950/90 hover:border-zinc-700'
                  }`}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold uppercase border flex items-center gap-1.5 ${typeBadge.bg}`}>
                          <BadgeIcon className="w-3.5 h-3.5" />
                          <span>{typeBadge.label}</span>
                        </span>
                        {cert.status === 'bound' && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-zinc-900 text-zinc-300 border border-zinc-700">
                            {t.statusBound}
                          </span>
                        )}
                      </div>

                      {/* Selection checkbox */}
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
                      >
                        <CheckCircle2 className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight leading-snug line-clamp-2">
                      {cert.title}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                      {cert.subtitle}
                    </p>
                  </div>

                  {/* Claims List Preview */}
                  <div className="my-auto py-2 space-y-1.5">
                    {cert.attributes.slice(0, 3).map((attr) => (
                      <div
                        key={attr.key}
                        className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-black/60 border border-zinc-800/80"
                      >
                        <span className="text-zinc-400 truncate mr-2">{attr.label}</span>
                        <span className="text-zinc-200 font-mono font-medium truncate max-w-[160px]">
                          {attr.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={cert.issuer.avatarUrl}
                        alt={cert.issuer.name}
                        className="w-6 h-6 rounded-full object-cover ring-1 ring-zinc-700"
                      />
                      <div className="truncate max-w-[120px] sm:max-w-[160px]">
                        <div className="text-[11px] font-semibold text-zinc-200 truncate">
                          {cert.issuer.name}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500">
                          {t.trustScore}: {cert.issuer.trustScore}%
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectCert(cert);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-colors shadow"
                    >
                      <span>{t.inspectDetails}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Floating Navigation Bar */}
      <div className="relative z-20 max-w-2xl mx-auto w-full mt-2">
        <div className="flex items-center justify-between gap-3 bg-zinc-900/90 p-2.5 sm:p-3 rounded-2xl border border-zinc-800 shadow-xl backdrop-blur-xl">
          {/* Deck pager arrows */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeIndex === 0}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white transition-colors"
              title="Previous Certificate"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-zinc-300 px-2">
              {filteredCerts.length > 0 ? activeIndex + 1 : 0} / {filteredCerts.length}
            </span>
            <button
              onClick={() => setActiveIndex((prev) => Math.min(filteredCerts.length - 1, prev + 1))}
              disabled={activeIndex >= filteredCerts.length - 1}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white transition-colors"
              title="Next Certificate"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenMintModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-zinc-300" />
              <span className="hidden sm:inline">{t.mintNewCert}</span>
            </button>
            <button
              onClick={onOpenSelectiveShare}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-colors shadow"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{t.sharePresentation}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
