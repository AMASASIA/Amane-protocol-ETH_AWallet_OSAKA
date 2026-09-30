/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  VerifiableCertificate,
  SharedPresentationRecord,
  SelectiveShareConfig,
} from './types/certificate';
import { INITIAL_CERTIFICATES } from './data/mockCertificates';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/firebaseAuth';
import {
  GoogleContact,
  fetchGoogleContacts,
  syncToGoogleSheets,
  backupToGoogleDrive,
  scheduleExpiryCalendarAlert,
  createMeetVerificationSpace,
  WorkspaceSyncResult,
} from './services/workspaceServices';

import { Header } from './components/Header';
import { CascadeDeck } from './components/CascadeDeck';
import { GridView } from './components/GridView';
import { ActiveSharesView } from './components/ActiveSharesView';
import { CertificateDetailModal } from './components/CertificateDetailModal';
import { SelectiveShareModal } from './components/SelectiveShareModal';
import { VerifierViewModal } from './components/VerifierViewModal';
import { WorkspaceHub } from './components/WorkspaceHub';
import { MintCustomCertModal } from './components/MintCustomCertModal';
import { UnifiedApiSkillModal } from './components/UnifiedApiSkillModal';
import { TiveAiAssistant } from './components/TiveAiAssistant';

import {
  Shield,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Share2,
  Bot,
} from 'lucide-react';
import { Language, translations } from './i18n/translations';

export default function App() {
  // App state
  const [certificates, setCertificates] = useState<VerifiableCertificate[]>(INITIAL_CERTIFICATES);
  const [selectedCertIds, setSelectedCertIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'cascade' | 'grid' | 'shares'>('cascade');
  const [language, setLanguage] = useState<Language>('en');

  // Active shares registry
  const [shares, setShares] = useState<SharedPresentationRecord[]>([
    {
      id: 'share-foster-meeting-01',
      shareToken: 'vp-foster-meeting-88a',
      shareUrl: 'https://aetherid.app/verify/vp-foster-meeting-88a',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      expiresAt: new Date(Date.now() + 23 * 3600000).toISOString(),
      recipientName: 'Foster Verification Committee',
      recipientEmailOrDid: 'foster@ai-standards.org',
      includedCerts: [
        {
          certId: 'did-agent-core-01',
          certTitle: 'Autonomous Reasoning Agent Core DID',
          certType: 'DID',
          disclosedAttributesCount: 4,
          zkEnabled: true,
        },
        {
          certId: 'sbt-safety-02',
          certTitle: 'AI Alignment & Safety Ethics Attestation',
          certType: 'SBT',
          disclosedAttributesCount: 3,
          zkEnabled: true,
        },
      ],
      oneTimeView: false,
      viewsRemaining: 5,
      status: 'active',
      accessLogs: [
        {
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          ipOrDomain: 'verify.frontier-ai.org',
          verifier: 'Audit Bot #12',
        },
      ],
    },
  ]);

  // Auth & Workspace state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [googleContacts, setGoogleContacts] = useState<GoogleContact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // Active Modals
  const [inspectedCert, setInspectedCert] = useState<VerifiableCertificate | null>(null);
  const [isSelectiveShareOpen, setIsSelectiveShareOpen] = useState(false);
  const [isWorkspaceHubOpen, setIsWorkspaceHubOpen] = useState(false);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [isUnifiedApiSkillOpen, setIsUnifiedApiSkillOpen] = useState(false);
  const [isTiveAiOpen, setIsTiveAiOpen] = useState(false);
  const [inspectedShare, setInspectedShare] = useState<SharedPresentationRecord | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
    url?: string;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success', url?: string) => {
    setToast({ type, message, url });
    setTimeout(() => setToast(null), 5000);
  };

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsTiveAiOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      async (firebaseUser, token) => {
        setUser(firebaseUser);
        if (token) {
          setAccessToken(token);
          loadContacts(token);
        }
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const loadContacts = async (token: string) => {
    setIsLoadingContacts(true);
    try {
      const contacts = await fetchGoogleContacts(token);
      setGoogleContacts(contacts);
    } catch (e) {
      console.warn('Could not load contacts:', e);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        showToast(
          language === 'ja'
            ? `Google Workspaceに接続しました: ${res.user.email}`
            : `Connected to Google Workspace as ${res.user.email}!`,
          'success'
        );
        loadContacts(res.accessToken);
      }
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      showToast(
        language === 'ja' ? 'Googleサインインを完了できませんでした。' : 'Google sign-in could not be completed. Please retry.',
        'error'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setGoogleContacts([]);
    showToast(language === 'ja' ? 'Google Workspaceからログアウトしました。' : 'Signed out of Google Workspace.', 'info');
  };

  // Selection handlers
  const handleToggleSelectCert = (id: string) => {
    setSelectedCertIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedCertIds(certificates.map((c) => c.id));
  };

  const handleClearSelection = () => {
    setSelectedCertIds([]);
  };

  // Generate a selective presentation record
  const handleGenerateShare = (config: SelectiveShareConfig): SharedPresentationRecord => {
    const shareToken = `vp-${Math.random().toString(36).substring(2, 10)}`;
    const shareUrl = `https://aetherid.app/verify/${shareToken}`;
    const now = new Date();
    const expiresAt =
      config.expirationMinutes > 0
        ? new Date(now.getTime() + config.expirationMinutes * 60 * 1000).toISOString()
        : null;

    const newRecord: SharedPresentationRecord = {
      id: `share-${Date.now()}`,
      shareToken,
      shareUrl,
      createdAt: now.toISOString(),
      expiresAt,
      recipientName: config.recipient.name,
      recipientEmailOrDid: config.recipient.emailOrDid,
      includedCerts: config.selectedCertIds.map((cid) => {
        const cert = certificates.find((c) => c.id === cid);
        return {
          certId: cid,
          certTitle: cert?.title || 'Certificate',
          certType: cert?.type || 'DID',
          disclosedAttributesCount: (config.disclosedAttributeKeys[cid] || []).length,
          zkEnabled: config.enableZeroKnowledgeProof,
        };
      }),
      oneTimeView: config.oneTimeView,
      viewsRemaining: config.oneTimeView ? 1 : 999,
      status: 'active',
      accessLogs: [],
    };

    setShares((prev) => [newRecord, ...prev]);

    // Background Google Workspace Automations
    if (config.exportToGoogleSheets && accessToken) {
      syncToGoogleSheets(accessToken, certificates).then((res) => {
        if (res.success) {
          showToast(
            language === 'ja'
              ? '選択的プレゼンテーションをGoogleスプレッドシートに記録しました！'
              : 'Selective presentation event logged in Google Sheets!',
            'success',
            res.url
          );
        }
      });
    }

    if (config.createCalendarEvent && accessToken && expiresAt) {
      const firstCert = certificates.find((c) => c.id === config.selectedCertIds[0]);
      if (firstCert) {
        scheduleExpiryCalendarAlert(accessToken, {
          ...firstCert,
          expiresAt,
          title: `[Share Alert] Presentation to ${config.recipient.name}`,
        }).then((res) => {
          if (res.success) {
            showToast(
              language === 'ja'
                ? 'プレゼンテーションの失効アラートをCalendarに作成しました。'
                : 'Calendar expiry alert created for this presentation.',
              'info',
              res.url
            );
          }
        });
      }
    }

    return newRecord;
  };

  const handleRevokeShare = (shareId: string) => {
    setShares((prev) =>
      prev.map((s) => (s.id === shareId ? { ...s, status: 'revoked' as const } : s))
    );
    showToast(
      language === 'ja'
        ? 'プレゼンテーションを失効しました。今後のアクセスは遮断されます。'
        : 'Verifiable presentation revoked. Future verifier requests will be rejected.',
      'info'
    );
  };

  const handleMintCertificate = (newCert: VerifiableCertificate) => {
    setCertificates((prev) => [newCert, ...prev]);
    showToast(
      language === 'ja'
        ? `新しい${newCert.type}「${newCert.title}」を発行しました！`
        : `New ${newCert.type} "${newCert.title}" minted successfully!`,
      'success'
    );
  };

  // Google Workspace operations
  const handleSyncAllToSheets = async (): Promise<WorkspaceSyncResult> => {
    if (!accessToken) {
      await handleLogin();
      const token = await getAccessToken();
      if (!token) return { service: 'sheets', success: false, message: 'Google authentication required.' };
      return syncToGoogleSheets(token, certificates);
    }
    return syncToGoogleSheets(accessToken, certificates);
  };

  const handleBackupAllToDrive = async (): Promise<WorkspaceSyncResult> => {
    if (!accessToken) {
      await handleLogin();
      const token = await getAccessToken();
      if (!token) return { service: 'drive', success: false, message: 'Google authentication required.' };
      return backupToGoogleDrive(token, certificates);
    }
    return backupToGoogleDrive(accessToken, certificates);
  };

  const handleCreateMeet = async (): Promise<WorkspaceSyncResult> => {
    if (!accessToken) {
      await handleLogin();
      const token = await getAccessToken();
      if (!token) return { service: 'meet', success: false, message: 'Google authentication required.' };
      return createMeetVerificationSpace(token);
    }
    return createMeetVerificationSpace(accessToken);
  };

  const handleSingleCertSyncSheets = async (cert: VerifiableCertificate) => {
    if (!accessToken) {
      showToast(language === 'ja' ? 'Googleサインインが必要です。' : 'Please sign in with Google to sync with Sheets.', 'info');
      setIsWorkspaceHubOpen(true);
      return;
    }
    showToast(language === 'ja' ? `「${cert.title}」を同期中...` : `Syncing "${cert.title}" to Google Sheets...`, 'info');
    const res = await syncToGoogleSheets(accessToken, [cert]);
    if (res.success) {
      showToast(language === 'ja' ? `「${cert.title}」を同期しました！` : `Synced "${cert.title}" to Google Sheets!`, 'success', res.url);
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleSingleCertBackupDrive = async (cert: VerifiableCertificate) => {
    if (!accessToken) {
      showToast(language === 'ja' ? 'Googleサインインが必要です。' : 'Please sign in with Google to backup to Drive.', 'info');
      setIsWorkspaceHubOpen(true);
      return;
    }
    showToast(language === 'ja' ? `Driveに保存中...` : `Backing up "${cert.title}" to Google Drive...`, 'info');
    const res = await backupToGoogleDrive(accessToken, [cert], `AetherID_${cert.id}.json`);
    if (res.success) {
      showToast(language === 'ja' ? '暗号化レコードをDriveに保存しました！' : `Encrypted record saved to Google Drive!`, 'success', res.url);
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleSingleCertCalendarAlert = async (cert: VerifiableCertificate) => {
    if (!accessToken) {
      showToast(language === 'ja' ? 'Googleサインインが必要です。' : 'Please sign in with Google for Calendar alerts.', 'info');
      setIsWorkspaceHubOpen(true);
      return;
    }
    showToast(language === 'ja' ? `Calendarアラートを設定中...` : `Scheduling Calendar expiry watchdog for "${cert.title}"...`, 'info');
    const res = await scheduleExpiryCalendarAlert(accessToken, cert);
    if (res.success) {
      showToast(res.message, 'success', res.url);
    } else {
      showToast(res.message, 'error');
    }
  };

  // TiveAI In-App Action Dispatcher
  const handleTiveAction = (action: string, target?: string) => {
    switch (action) {
      case 'switch_view':
        if (target === 'cascade' || target === 'grid' || target === 'shares') {
          setViewMode(target);
          showToast(language === 'ja' ? `ビューを「${target}」に変更しました` : `Switched view to ${target}`, 'info');
        }
        break;
      case 'filter_credentials':
        setViewMode('grid');
        break;
      case 'inspect_credential': {
        const found = certificates.find(
          (c) => c.id === target || c.title.toLowerCase().includes((target || '').toLowerCase())
        );
        if (found) {
          setInspectedCert(found);
        } else if (certificates[0]) {
          setInspectedCert(certificates[0]);
        }
        break;
      }
      case 'open_modal':
        if (target === 'share') setIsSelectiveShareOpen(true);
        else if (target === 'mint') setIsMintModalOpen(true);
        else if (target === 'hub') setIsWorkspaceHubOpen(true);
        else if (target === 'api_skill') setIsUnifiedApiSkillOpen(true);
        break;
      case 'set_language':
        if (target === 'ja' || target === 'en') {
          setLanguage(target);
          showToast(target === 'ja' ? '言語を日本語に切り替えました。' : 'Switched language to English.', 'info');
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 text-xs bg-zinc-900/95 border-zinc-700 text-white`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-zinc-300 shrink-0" />
              )}
              <span className="font-medium">{toast.message}</span>
            </div>

            {toast.url && (
              <a
                href={toast.url}
                target="_blank"
                rel="noreferrer"
                className="text-white hover:underline font-semibold flex items-center gap-1 shrink-0 ml-2"
              >
                <span>View</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Main Header */}
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        user={user}
        accessToken={accessToken}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
        onOpenWorkspaceHub={() => setIsWorkspaceHubOpen(true)}
        onOpenSelectiveShare={() => setIsSelectiveShareOpen(true)}
        onOpenUnifiedApiSkill={() => setIsUnifiedApiSkillOpen(true)}
        onOpenTiveAi={() => setIsTiveAiOpen(true)}
        selectedCount={selectedCertIds.length}
        totalCertCount={certificates.length}
        sharedLinksCount={shares.filter((s) => s.status === 'active').length}
        language={language}
        onLanguageChange={setLanguage}
      />

      {/* Main View Router */}
      <main className="flex-1 flex flex-col">
        {viewMode === 'cascade' && (
          <CascadeDeck
            certificates={certificates}
            selectedCertIds={selectedCertIds}
            onToggleSelectCert={handleToggleSelectCert}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onInspectCert={(cert) => setInspectedCert(cert)}
            onOpenSelectiveShare={() => setIsSelectiveShareOpen(true)}
            onOpenMintModal={() => setIsMintModalOpen(true)}
            language={language}
          />
        )}

        {viewMode === 'grid' && (
          <GridView
            certificates={certificates}
            selectedCertIds={selectedCertIds}
            onToggleSelectCert={handleToggleSelectCert}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onInspectCert={(cert) => setInspectedCert(cert)}
            onOpenSelectiveShare={() => setIsSelectiveShareOpen(true)}
            onOpenMintModal={() => setIsMintModalOpen(true)}
            onQuickSyncToSheets={handleSingleCertSyncSheets}
            language={language}
          />
        )}

        {viewMode === 'shares' && (
          <ActiveSharesView
            shares={shares}
            onInspectShare={(share) => setInspectedShare(share)}
            onRevokeShare={handleRevokeShare}
            onCreateNewShare={() => setIsSelectiveShareOpen(true)}
            language={language}
          />
        )}
      </main>

      {/* Floating TiveAI Button for quick access on any view */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={() => setIsTiveAiOpen(true)}
          className="group flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700/80 shadow-2xl hover:border-white transition-all active:scale-95"
          title="Open TiveAI Controller (⌘K)"
        >
          <div className="w-6 h-6 rounded-lg bg-white text-black flex items-center justify-center font-bold text-xs">
            <Bot className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold tracking-tight">TiveAI</span>
          <kbd className="hidden sm:inline px-1 py-0.5 text-[9px] font-mono bg-zinc-800 text-zinc-400 rounded border border-zinc-700">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* TiveAI Natural Language In-App Assistant Modal */}
      <TiveAiAssistant
        isOpen={isTiveAiOpen}
        onClose={() => setIsTiveAiOpen(false)}
        language={language}
        onLanguageChange={setLanguage}
        onExecuteAction={handleTiveAction}
        currentContext={{
          viewMode,
          totalCertificates: certificates.length,
          selectedCount: selectedCertIds.length,
          activeSharesCount: shares.filter((s) => s.status === 'active').length,
        }}
      />

      {/* Unified Amane & AWallet API & Skill.md Modal */}
      <UnifiedApiSkillModal
        isOpen={isUnifiedApiSkillOpen}
        onClose={() => setIsUnifiedApiSkillOpen(false)}
        language={language}
        onLanguageChange={setLanguage}
      />

      {/* Certificate Inspector Modal */}
      {inspectedCert && (
        <CertificateDetailModal
          certificate={inspectedCert}
          onClose={() => setInspectedCert(null)}
          onOpenShareModal={(cert) => {
            if (!selectedCertIds.includes(cert.id)) {
              setSelectedCertIds([cert.id]);
            }
            setIsSelectiveShareOpen(true);
          }}
          onSyncSheets={handleSingleCertSyncSheets}
          onBackupDrive={handleSingleCertBackupDrive}
          onCalendarAlert={handleSingleCertCalendarAlert}
          hasGoogleToken={Boolean(accessToken)}
          onGoogleLogin={handleLogin}
          language={language}
        />
      )}

      {/* Selective Share & Verifiable Presentation Wizard Modal */}
      {isSelectiveShareOpen && (
        <SelectiveShareModal
          allCertificates={certificates}
          initialSelectedCertIds={selectedCertIds}
          googleContacts={googleContacts}
          isLoadingContacts={isLoadingContacts}
          onFetchGoogleContacts={() => accessToken && loadContacts(accessToken)}
          hasGoogleToken={Boolean(accessToken)}
          onGenerateShare={handleGenerateShare}
          onClose={() => setIsSelectiveShareOpen(false)}
          onPreviewSharedPresentation={(record) => setInspectedShare(record)}
        />
      )}

      {/* Verifier Simulation Portal Modal */}
      {inspectedShare && (
        <VerifierViewModal
          shareRecord={inspectedShare}
          allCertificates={certificates}
          onClose={() => setInspectedShare(null)}
          onRevokeShare={handleRevokeShare}
        />
      )}

      {/* Google Workspace Hub Modal */}
      {isWorkspaceHubOpen && (
        <WorkspaceHub
          user={user}
          accessToken={accessToken}
          onLogin={handleLogin}
          isLoggingIn={isLoggingIn}
          certificates={certificates}
          googleContacts={googleContacts}
          isLoadingContacts={isLoadingContacts}
          onRefreshContacts={() => accessToken && loadContacts(accessToken)}
          onSyncSheets={handleSyncAllToSheets}
          onBackupDrive={handleBackupAllToDrive}
          onCreateMeet={handleCreateMeet}
          onClose={() => setIsWorkspaceHubOpen(false)}
          onSelectContactToShare={() => {
            setIsWorkspaceHubOpen(false);
            setIsSelectiveShareOpen(true);
          }}
        />
      )}

      {/* Mint / Issue Custom Credential Modal */}
      {isMintModalOpen && (
        <MintCustomCertModal
          onClose={() => setIsMintModalOpen(false)}
          onMintCertificate={handleMintCertificate}
        />
      )}
    </div>
  );
}
