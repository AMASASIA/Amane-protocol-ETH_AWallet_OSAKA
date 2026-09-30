import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { VerifiableCertificate } from '../types/certificate';
import {
  GoogleContact,
  WorkspaceSyncResult,
} from '../services/workspaceServices';
import {
  X,
  Cloud,
  FileSpreadsheet,
  HardDrive,
  Calendar,
  Users,
  Video,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Lock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface WorkspaceHubProps {
  user: User | null;
  accessToken: string | null;
  onLogin: () => void;
  isLoggingIn: boolean;
  certificates: VerifiableCertificate[];
  googleContacts: GoogleContact[];
  isLoadingContacts: boolean;
  onRefreshContacts: () => void;
  onSyncSheets: () => Promise<WorkspaceSyncResult>;
  onBackupDrive: () => Promise<WorkspaceSyncResult>;
  onCreateMeet: () => Promise<WorkspaceSyncResult>;
  onClose: () => void;
  onSelectContactToShare: (contact: GoogleContact) => void;
}

export const WorkspaceHub: React.FC<WorkspaceHubProps> = ({
  user,
  accessToken,
  onLogin,
  isLoggingIn,
  certificates,
  googleContacts,
  isLoadingContacts,
  onRefreshContacts,
  onSyncSheets,
  onBackupDrive,
  onCreateMeet,
  onClose,
  onSelectContactToShare,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sheets' | 'drive' | 'contacts' | 'meet'>('overview');
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [isBackingUpDrive, setIsBackingUpDrive] = useState(false);
  const [isCreatingMeet, setIsCreatingMeet] = useState(false);

  // Result messages
  const [syncResult, setSyncResult] = useState<WorkspaceSyncResult | null>(null);

  // Destructive / mutating operation confirmation modal
  const [pendingConfirmAction, setPendingConfirmAction] = useState<{
    title: string;
    description: string;
    action: () => Promise<void>;
  } | null>(null);

  const handleSheetsClick = () => {
    setPendingConfirmAction({
      title: 'Export AI Credential Ledger to Google Sheets?',
      description: `This will create or update an audit spreadsheet named "AetherID: AI DID/SBT/TBA Audit Ledger" in your Google Drive with ${certificates.length} digital credentials.`,
      action: async () => {
        setIsSyncingSheets(true);
        const res = await onSyncSheets();
        setSyncResult(res);
        setIsSyncingSheets(false);
      },
    });
  };

  const handleDriveBackupClick = () => {
    setPendingConfirmAction({
      title: 'Create Encrypted Credential Vault Backup in Google Drive?',
      description: `This will create a new backup file "AetherID_AI_Credentials_Vault.json" in your Google Drive containing your DIDs, Soulbound attestation records, and Token Bound Accounts.`,
      action: async () => {
        setIsBackingUpDrive(true);
        const res = await onBackupDrive();
        setSyncResult(res);
        setIsBackingUpDrive(false);
      },
    });
  };

  const handleMeetClick = async () => {
    setIsCreatingMeet(true);
    const res = await onCreateMeet();
    setSyncResult(res);
    setIsCreatingMeet(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl shadow-blue-950/40 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner */}
        <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600" />

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Google Workspace Hub</h2>
                {user && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Sync digital credentials, backup sovereign keys, and share presentations seamlessly.
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

        {/* Auth Notice if not connected */}
        {!user ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Connect your Google Workspace Account
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Link Google Drive, Sheets, Calendar, Contacts, Chat, and Meet to enable bidirectional synchronization, recipient address book picker, and automated audit logging.
              </p>
            </div>

            <button
              onClick={onLogin}
              disabled={isLoggingIn}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs transition-all shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isLoggingIn ? 'Signing in with Google...' : 'Sign in with Google'}</span>
            </button>
          </div>
        ) : (
          <div>
            {/* Tab navigation */}
            <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-800 bg-slate-950/40 text-xs overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-3 px-3 font-medium border-b-2 transition-all ${
                  activeTab === 'overview'
                    ? 'border-blue-400 text-blue-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Sync Overview
              </button>

              <button
                onClick={() => setActiveTab('sheets')}
                className={`pb-3 px-3 font-medium border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'sheets'
                    ? 'border-emerald-400 text-emerald-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Google Sheets</span>
              </button>

              <button
                onClick={() => setActiveTab('drive')}
                className={`pb-3 px-3 font-medium border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'drive'
                    ? 'border-blue-400 text-blue-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Google Drive</span>
              </button>

              <button
                onClick={() => setActiveTab('contacts')}
                className={`pb-3 px-3 font-medium border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'contacts'
                    ? 'border-purple-400 text-purple-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Contacts ({googleContacts.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('meet')}
                className={`pb-3 px-3 font-medium border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'meet'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Google Meet</span>
              </button>
            </div>

            {/* Sync Status Banner if any */}
            {syncResult && (
              <div
                className={`mx-6 mt-4 p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                  syncResult.success
                    ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {syncResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{syncResult.message}</span>
                </div>

                {syncResult.url && (
                  <a
                    href={syncResult.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 font-semibold underline text-white hover:text-cyan-300 shrink-0"
                  >
                    <span>Open in {syncResult.service}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {/* Tab Contents */}
            <div className="p-6 max-h-[55vh] overflow-y-auto space-y-6">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Account strip */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {user.photoURL && (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'User'}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/30"
                        />
                      )}
                      <div>
                        <div className="text-sm font-bold text-white">{user.displayName}</div>
                        <div className="text-xs text-slate-400 font-mono">{user.email}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                        OAuth 2.0 Token Active
                      </span>
                    </div>
                  </div>

                  {/* 5-Product Integration Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Sheets */}
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                          <h4 className="text-xs font-bold text-white">Google Sheets</h4>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400">Live Sync</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Export full certificate inventory, cryptographic fingerprints, and presentation audit logs.
                      </p>
                      <button
                        onClick={handleSheetsClick}
                        disabled={isSyncingSheets}
                        className="w-full mt-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center justify-center gap-1.5"
                      >
                        {isSyncingSheets ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <FileSpreadsheet className="w-3 h-3" />
                        )}
                        <span>Sync All to Sheets</span>
                      </button>
                    </div>

                    {/* Drive */}
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-blue-400" />
                          <h4 className="text-xs font-bold text-white">Google Drive</h4>
                        </div>
                        <span className="text-[10px] font-mono text-blue-400">Vault Backup</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Store client-side encrypted JSON snapshots of sovereign DIDs and TBA smart accounts.
                      </p>
                      <button
                        onClick={handleDriveBackupClick}
                        disabled={isBackingUpDrive}
                        className="w-full mt-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 transition-colors flex items-center justify-center gap-1.5"
                      >
                        {isBackingUpDrive ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <HardDrive className="w-3 h-3" />
                        )}
                        <span>Backup Vault to Drive</span>
                      </button>
                    </div>

                    {/* Contacts */}
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-400" />
                          <h4 className="text-xs font-bold text-white">Google Contacts</h4>
                        </div>
                        <span className="text-[10px] font-mono text-purple-400">
                          {googleContacts.length} Loaded
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Select presentation recipients directly from your authenticated Google address book.
                      </p>
                      <button
                        onClick={() => {
                          setActiveTab('contacts');
                          if (googleContacts.length === 0) onRefreshContacts();
                        }}
                        className="w-full mt-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Users className="w-3 h-3" />
                        <span>Browse Contacts</span>
                      </button>
                    </div>

                    {/* Meet */}
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-amber-400" />
                          <h4 className="text-xs font-bold text-white">Google Meet</h4>
                        </div>
                        <span className="text-[10px] font-mono text-amber-400">Live Space</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Launch real-time verification spaces to audit cryptographic credentials in meeting rooms.
                      </p>
                      <button
                        onClick={handleMeetClick}
                        disabled={isCreatingMeet}
                        className="w-full mt-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Video className="w-3 h-3" />
                        <span>Create Meet Space</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'sheets' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-white">Google Sheets Synchronization</h4>
                    <p className="text-xs text-slate-300">
                      Export your active digital credentials directly to a new or existing Google Spreadsheet. The ledger includes:
                    </p>
                    <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside font-mono text-[11px]">
                      <li>Unique Certificate ID & Credential Type (DID / SBT / TBA)</li>
                      <li>Subject DID identifier & Issuer Authority name</li>
                      <li>Cryptographic SHA-256 fingerprint & issuance timestamps</li>
                      <li>Network protocol and current validity status</li>
                    </ul>

                    <button
                      onClick={handleSheetsClick}
                      disabled={isSyncingSheets}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex items-center gap-2"
                    >
                      {isSyncingSheets ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileSpreadsheet className="w-4 h-4" />
                      )}
                      <span>Export Audit Ledger to Google Sheets</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'drive' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-white">Google Drive Sovereign Vault Backup</h4>
                    <p className="text-xs text-slate-300">
                      Creates an encrypted JSON snapshot backup on your Google Drive storage under:
                      <code className="block mt-1 font-mono text-cyan-300 bg-slate-900 p-2 rounded border border-slate-800">
                        AetherID_AI_Credentials_Vault.json
                      </code>
                    </p>

                    <button
                      onClick={handleDriveBackupClick}
                      disabled={isBackingUpDrive}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-500 hover:bg-blue-400 text-white transition-colors flex items-center gap-2"
                    >
                      {isBackingUpDrive ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <HardDrive className="w-4 h-4" />
                      )}
                      <span>Backup Encrypted Vault to Google Drive</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'contacts' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-300">
                      Your Google Contacts (Select any contact to quickly issue a selective presentation):
                    </div>
                    <button
                      onClick={onRefreshContacts}
                      disabled={isLoadingContacts}
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingContacts ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {isLoadingContacts ? (
                    <div className="text-center py-8 text-xs text-slate-400">Fetching contacts...</div>
                  ) : googleContacts.length === 0 ? (
                    <div className="text-center py-8 bg-slate-950 rounded-2xl border border-slate-800">
                      <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">No contacts retrieved yet.</p>
                      <button
                        onClick={onRefreshContacts}
                        className="mt-2 text-xs text-purple-400 hover:underline"
                      >
                        Fetch Google Contacts
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {googleContacts.map((contact) => (
                        <div
                          key={contact.resourceName || contact.email}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            {contact.photoUrl ? (
                              <img
                                src={contact.photoUrl}
                                alt={contact.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                                {contact.name[0]}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-white">{contact.name}</div>
                              <div className="text-slate-400 font-mono text-[11px]">
                                {contact.email}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              onSelectContactToShare(contact);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 transition-colors flex items-center gap-1"
                          >
                            <span>Share to Contact</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'meet' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-white">Google Meet Verification Space</h4>
                    <p className="text-xs text-slate-300">
                      Generate an open Google Meet space for synchronous credential presentation reviews with auditors or clients.
                    </p>

                    <button
                      onClick={handleMeetClick}
                      disabled={isCreatingMeet}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-2"
                    >
                      {isCreatingMeet ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Video className="w-4 h-4" />
                      )}
                      <span>Create Real-Time Meet Space</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Confirmation Modal for Destructive / Mutating operations (Workspace Skill MANDATORY) */}
        {pendingConfirmAction && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="relative w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-amber-500/50 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-amber-400">
                <ShieldAlert className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-bold text-white">{pendingConfirmAction.title}</h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {pendingConfirmAction.description}
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setPendingConfirmAction(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const action = pendingConfirmAction.action;
                    setPendingConfirmAction(null);
                    await action();
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
                >
                  Confirm Operation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
