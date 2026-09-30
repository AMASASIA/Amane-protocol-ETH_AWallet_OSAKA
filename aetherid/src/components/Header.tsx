import React, { useState } from 'react';
import {
  Shield,
  Sparkles,
  Layers,
  Grid3X3,
  Share2,
  Cloud,
  LogOut,
  CheckCircle2,
  Terminal,
  Globe,
  Menu,
  X,
  Bot,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Language, translations } from '../i18n/translations';

interface HeaderProps {
  viewMode: 'cascade' | 'grid' | 'shares';
  setViewMode: (mode: 'cascade' | 'grid' | 'shares') => void;
  user: User | null;
  accessToken: string | null;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  onOpenWorkspaceHub: () => void;
  onOpenSelectiveShare: () => void;
  onOpenUnifiedApiSkill: () => void;
  onOpenTiveAi: () => void;
  selectedCount: number;
  totalCertCount: number;
  sharedLinksCount: number;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  user,
  accessToken,
  onLogin,
  onLogout,
  isLoggingIn,
  onOpenWorkspaceHub,
  onOpenSelectiveShare,
  onOpenUnifiedApiSkill,
  onOpenTiveAi,
  selectedCount,
  totalCertCount,
  sharedLinksCount,
  language,
  onLanguageChange,
}) => {
  const t = translations[language];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-black/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3">
        {/* Left: Branding & Tagline */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => setViewMode('cascade')}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-white/30 via-white/10 to-zinc-800 p-[1.5px] transition-transform duration-300 group-hover:scale-105 shadow-md shadow-white/5">
              <div className="w-full h-full rounded-[14px] bg-zinc-950 flex items-center justify-center">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:rotate-6 transition-transform" />
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3 sm:h-3.5 sm:w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 sm:h-3.5 sm:w-3.5 bg-white border-2 border-black"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                AetherID
              </h1>
              <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-mono font-semibold uppercase tracking-wider rounded-md bg-zinc-900 text-zinc-300 border border-zinc-700">
                {t.badgeAiIdentity}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden md:block line-clamp-1">
              {t.brandTagline}
            </p>
          </div>
        </div>

        {/* Center: Desktop View Switcher */}
        <div className="hidden md:flex items-center bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 shadow-inner">
          <button
            onClick={() => setViewMode('cascade')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'cascade'
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
            }`}
            title="3D Cascade Deck"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t.viewCascade}</span>
          </button>

          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'grid'
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
            }`}
            title="Grid Matrix"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>{t.viewGrid}</span>
          </button>

          <button
            onClick={() => setViewMode('shares')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'shares'
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
            }`}
            title="Active Presentations"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{t.viewShares}</span>
            {sharedLinksCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-black text-[10px] font-mono font-bold flex items-center justify-center">
                {sharedLinksCount}
              </span>
            )}
          </button>
        </div>

        {/* Right: Actions, TiveAI & Language Toggle */}
        <div className="flex items-center gap-2">
          {/* TiveAI In-App Control Button */}
          <button
            onClick={onOpenTiveAi}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-all shadow-md active:scale-95"
            title="TiveAI Natural Language In-App Controller (⌘K)"
          >
            <Bot className="w-4 h-4 text-black" />
            <span className="hidden sm:inline">{t.openTiveAi}</span>
            <kbd className="hidden lg:inline px-1.5 py-0.5 text-[9px] font-mono bg-zinc-200 text-zinc-800 rounded border border-zinc-300">
              ⌘K
            </kbd>
          </button>

          {/* Unified API & Skill Trigger */}
          <button
            onClick={onOpenUnifiedApiSkill}
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition-all"
            title="Unified Amane & AWallet API and Skill.md Spec"
          >
            <Terminal className="w-3.5 h-3.5 text-zinc-300" />
            <span>{t.unifiedApiSkill}</span>
          </button>

          {/* Language Switcher Button (EN / JA) */}
          <button
            onClick={() => onLanguageChange(language === 'en' ? 'ja' : 'en')}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition-all"
            title={language === 'en' ? '日本語に切り替え' : 'Switch to English'}
          >
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            <span>{language === 'en' ? 'EN' : 'JA'}</span>
          </button>

          {/* Selective Share CTA */}
          <button
            onClick={onOpenSelectiveShare}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
              selectedCount > 0
                ? 'bg-gradient-to-r from-zinc-100 to-zinc-300 text-black border border-white'
                : 'bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{selectedCount > 0 ? `${t.shareSelected} (${selectedCount})` : t.selectiveShare}</span>
          </button>

          {/* Google Workspace Hub Trigger */}
          <button
            onClick={onOpenWorkspaceHub}
            className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all"
            title="Google Workspace Hub"
          >
            <Cloud className="w-3.5 h-3.5 text-zinc-300" />
            <span>{t.workspaceHub}</span>
            {accessToken && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
          </button>

          {/* Google Auth status / button */}
          {user ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenWorkspaceHub}
                className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all"
                title={`Signed in as ${user.email}`}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-6 h-6 rounded-lg object-cover ring-1 ring-zinc-700"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-lg bg-zinc-800 text-white flex items-center justify-center font-bold text-xs">
                    {user.email?.[0].toUpperCase() || 'U'}
                  </div>
                )}
                <span className="text-xs text-zinc-200 hidden lg:inline max-w-[80px] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </button>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title={t.signOut}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              disabled={isLoggingIn}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold transition-all disabled:opacity-50"
            >
              <span>{isLoggingIn ? t.connecting : t.signInGoogle}</span>
            </button>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setViewMode('cascade');
                setMobileMenuOpen(false);
              }}
              className={`p-2 rounded-xl text-xs font-medium text-center border ${
                viewMode === 'cascade' ? 'bg-zinc-800 border-white text-white' : 'border-zinc-800 text-zinc-400'
              }`}
            >
              <Layers className="w-4 h-4 mx-auto mb-1" />
              {t.viewCascade}
            </button>
            <button
              onClick={() => {
                setViewMode('grid');
                setMobileMenuOpen(false);
              }}
              className={`p-2 rounded-xl text-xs font-medium text-center border ${
                viewMode === 'grid' ? 'bg-zinc-800 border-white text-white' : 'border-zinc-800 text-zinc-400'
              }`}
            >
              <Grid3X3 className="w-4 h-4 mx-auto mb-1" />
              {t.viewGrid}
            </button>
            <button
              onClick={() => {
                setViewMode('shares');
                setMobileMenuOpen(false);
              }}
              className={`p-2 rounded-xl text-xs font-medium text-center border ${
                viewMode === 'shares' ? 'bg-zinc-800 border-white text-white' : 'border-zinc-800 text-zinc-400'
              }`}
            >
              <Share2 className="w-4 h-4 mx-auto mb-1" />
              {t.viewShares}
            </button>
          </div>

          <div className="pt-2 border-t border-zinc-800/80 flex flex-col gap-2">
            <button
              onClick={() => {
                onOpenTiveAi();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white text-black font-bold text-xs"
            >
              <Bot className="w-4 h-4" />
              <span>{t.openTiveAi}</span>
            </button>
            <button
              onClick={() => {
                onOpenUnifiedApiSkill();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-semibold"
            >
              <Terminal className="w-4 h-4" />
              <span>{t.unifiedApiSkill}</span>
            </button>
            <button
              onClick={() => {
                onOpenWorkspaceHub();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-semibold"
            >
              <Cloud className="w-4 h-4" />
              <span>{t.workspaceHub}</span>
            </button>
            <button
              onClick={() => {
                onOpenSelectiveShare();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-800 text-white text-xs font-semibold"
            >
              <Share2 className="w-4 h-4" />
              <span>{t.selectiveShare}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
