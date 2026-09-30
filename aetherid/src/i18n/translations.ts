export type Language = 'en' | 'ja';

export interface Translations {
  // Navigation & Branding
  brandTagline: string;
  badgeAiIdentity: string;
  viewCascade: string;
  viewGrid: string;
  viewShares: string;
  openTiveAi: string;
  tiveAiBadge: string;
  unifiedApiSkill: string;
  workspaceHub: string;
  selectiveShare: string;
  shareSelected: string;
  signInGoogle: string;
  connecting: string;
  signOut: string;
  workspaceSyncActive: string;

  // Deck / Matrix Controls
  searchPlaceholder: string;
  filterAll: string;
  filterDid: string;
  filterSbt: string;
  filterTba: string;
  tiltCascade: string;
  tiltIsometric: string;
  tiltFan: string;
  spreadTight: string;
  spreadWide: string;
  inspectDetails: string;
  sharePresentation: string;
  selectAll: string;
  clearSelection: string;
  selectedCount: string;
  mintNewCert: string;
  noCertificatesFound: string;
  cardsInDeck: string;
  activeCard: string;

  // Credential Details
  issuer: string;
  trustScore: string;
  issuedOn: string;
  expiresOn: string;
  neverExpires: string;
  didSubject: string;
  network: string;
  statusActive: string;
  statusBound: string;
  statusRevoked: string;
  attributesTitle: string;
  zkProofAvailable: string;
  zkEncrypted: string;
  disclosed: string;
  cryptographicProof: string;
  signatureType: string;
  fingerprint: string;
  syncToSheets: string;
  backupToDrive: string;
  calendarAlert: string;

  // Active Shares
  sharesTitle: string;
  sharesSubtitle: string;
  createNewShare: string;
  activeSharesCount: string;
  recipient: string;
  created: string;
  expires: string;
  viewsRemaining: string;
  burnAfterRead: string;
  revokeAccess: string;
  previewVerification: string;
  shareLinkCopied: string;

  // TiveAI Assistant
  tiveTitle: string;
  tiveSubtitle: string;
  tiveInputPlaceholder: string;
  tiveExecute: string;
  tiveThinking: string;
  tiveQuickActionsTitle: string;
  actionSwitchGrid: string;
  actionSwitchCascade: string;
  actionShowShares: string;
  actionFilterSbt: string;
  actionInspectCore: string;
  actionOpenShare: string;
  actionOpenMint: string;
  actionSyncSheets: string;
  actionSwitchLang: string;
  actionTestApi: string;

  // Unified API & Skill
  apiGatewayTitle: string;
  apiGatewaySubtitle: string;
  tabApiGateway: string;
  tabSkillMd: string;
  testEndpoint: string;
  testingEndpoint: string;
  apiStatusOnline: string;
  endpointVerified: string;
  skillSpecTitle: string;
  skillSpecSubtitle: string;
  copyJsonSchema: string;
  copied: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    brandTagline: 'Sovereign AI Identity & Decentralized Agent Account Abstraction',
    badgeAiIdentity: 'AI DID • SBT • TBA',
    viewCascade: '3D Cascade',
    viewGrid: 'Grid Matrix',
    viewShares: 'Active Shares',
    openTiveAi: 'TiveAI Control',
    tiveAiBadge: 'TiveAI Online',
    unifiedApiSkill: 'Unified API & Skill',
    workspaceHub: 'Workspace Hub',
    selectiveShare: 'Selective Share',
    shareSelected: 'Share Selected',
    signInGoogle: 'Sign in with Google',
    connecting: 'Connecting...',
    signOut: 'Sign out',
    workspaceSyncActive: 'Workspace Linked',

    searchPlaceholder: 'Search AI Model DID, SBT Attestation, TBA Vault...',
    filterAll: 'All Credentials',
    filterDid: 'W3C DID',
    filterSbt: 'Soulbound SBT',
    filterTba: 'ERC-6551 TBA',
    tiltCascade: '3D Stack',
    tiltIsometric: 'Isometric',
    tiltFan: 'Horizontal',
    spreadTight: 'Compact',
    spreadWide: 'Expanded',
    inspectDetails: 'Inspect Credential',
    sharePresentation: 'Generate Share Link',
    selectAll: 'Select All',
    clearSelection: 'Clear Selection',
    selectedCount: 'Selected',
    mintNewCert: 'Mint / Issue Credential',
    noCertificatesFound: 'No certificates match your query.',
    cardsInDeck: 'credentials in active deck',
    activeCard: 'Viewing',

    issuer: 'Authorized Issuer',
    trustScore: 'Trust Index',
    issuedOn: 'Issued At',
    expiresOn: 'Expires',
    neverExpires: 'Perpetual (No Expiry)',
    didSubject: 'DID Subject',
    network: 'Verification Network',
    statusActive: 'Active & Verified',
    statusBound: 'Soulbound (Locked)',
    statusRevoked: 'Revoked',
    attributesTitle: 'Cryptographic Claims & Attributes',
    zkProofAvailable: 'ZK-Proof Enabled',
    zkEncrypted: 'Zero-Knowledge Encrypted',
    disclosed: 'Plaintext Disclosed',
    cryptographicProof: 'W3C Cryptographic Proof',
    signatureType: 'Signature Suite',
    fingerprint: 'SHA-256 Fingerprint',
    syncToSheets: 'Sync to Sheets',
    backupToDrive: 'Backup to Drive',
    calendarAlert: 'Calendar Watchdog',

    sharesTitle: 'Active Verifiable Presentations',
    sharesSubtitle: 'Inspect, audit, or burn live selective disclosure links shared with external evaluators.',
    createNewShare: 'New Selective Presentation',
    activeSharesCount: 'Active Shared Links',
    recipient: 'Target Recipient',
    created: 'Created At',
    expires: 'Expires At',
    viewsRemaining: 'Remaining Views',
    burnAfterRead: 'Burn After 1 Read',
    revokeAccess: 'Revoke Proof Link',
    previewVerification: 'Audit as Verifier',
    shareLinkCopied: 'Share URL copied to clipboard!',

    tiveTitle: 'TiveAI Sovereign In-App Controller',
    tiveSubtitle: 'Operate this application via natural language commands, execute API calls, or inquire about AI identity.',
    tiveInputPlaceholder: 'Type a command (e.g. "switch to grid", "filter SBTs", "inspect agent DID", "日本語にして")...',
    tiveExecute: 'Run',
    tiveThinking: 'Processing command...',
    tiveQuickActionsTitle: 'Quick In-App Commands',
    actionSwitchGrid: 'Switch to Grid View',
    actionSwitchCascade: 'Switch to 3D Cascade Deck',
    actionShowShares: 'View Active Shares',
    actionFilterSbt: 'Filter Soulbound Tokens (SBT)',
    actionInspectCore: 'Inspect Core AI Agent DID',
    actionOpenShare: 'Open Selective Share Wizard',
    actionOpenMint: 'Mint New Credential',
    actionSyncSheets: 'Sync Credentials to Google Sheets',
    actionSwitchLang: '日本語に切り替え (Japanese)',
    actionTestApi: 'Run Unified Amane / AWallet API Check',

    apiGatewayTitle: 'Unified Amane & AWallet API Gateway',
    apiGatewaySubtitle: 'Consolidated API endpoints and Skill.md specifications for sovereign AI identity and micropayments.',
    tabApiGateway: 'REST API Endpoints',
    tabSkillMd: 'AI Agent Skill.md Spec',
    testEndpoint: 'Test API Call',
    testingEndpoint: 'Invoking endpoint...',
    apiStatusOnline: 'Operational (200 OK)',
    endpointVerified: 'Cryptographic response validated',
    skillSpecTitle: 'Skill.md Schema for Gemini & Claude',
    skillSpecSubtitle: 'Autonomous AI function definitions standardized across multi-agent environments.',
    copyJsonSchema: 'Copy Tool Definitions',
    copied: 'Copied!',
  },
  ja: {
    brandTagline: '自律型AI DID・SBT・TBA ソブリンアイデンティティ＆アカウント抽象化',
    badgeAiIdentity: 'AI DID • SBT • TBA',
    viewCascade: '3Dカスケード',
    viewGrid: 'グリッド表示',
    viewShares: '共有中リンク',
    openTiveAi: 'TiveAI 操作',
    tiveAiBadge: 'TiveAI 接続中',
    unifiedApiSkill: '統合API & Skill',
    workspaceHub: 'Workspace連携',
    selectiveShare: '選択的開示共有',
    shareSelected: '選択項目を共有',
    signInGoogle: 'Googleでサインイン',
    connecting: '接続中...',
    signOut: 'ログアウト',
    workspaceSyncActive: 'Workspace連携中',

    searchPlaceholder: 'AIモデルDID、SBT証明、TBAウォレットを検索...',
    filterAll: 'すべての証明書',
    filterDid: 'W3C DID',
    filterSbt: 'ソウルバウンド SBT',
    filterTba: 'ERC-6551 TBA',
    tiltCascade: '3Dスタック',
    tiltIsometric: 'アイソメトリック',
    tiltFan: '横並び',
    spreadTight: 'コンパクト',
    spreadWide: 'ワイド',
    inspectDetails: '詳細を確認',
    sharePresentation: '共有リンクを生成',
    selectAll: 'すべて選択',
    clearSelection: '選択を解除',
    selectedCount: '件選択中',
    mintNewCert: '証明書を発行 / ミント',
    noCertificatesFound: '条件に一致する証明書が見つかりませんでした。',
    cardsInDeck: '件の証明書を管理中',
    activeCard: '表示中',

    issuer: '発行元オーソリティ',
    trustScore: '信頼スコア',
    issuedOn: '発行日時',
    expiresOn: '有効期限',
    neverExpires: '無期限（恒久証明）',
    didSubject: 'DIDサブジェクト',
    network: '検証ネットワーク',
    statusActive: 'アクティブ（検証済）',
    statusBound: 'ソウルバウンド（譲渡不可）',
    statusRevoked: '失効',
    attributesTitle: '暗号学的属性およびクレーム',
    zkProofAvailable: 'ゼロ知識証明（ZK）対応',
    zkEncrypted: 'ゼロ知識暗号化中',
    disclosed: '平文開示',
    cryptographicProof: 'W3C暗号学的署名証明',
    signatureType: '署名アルゴリズム',
    fingerprint: 'SHA-256フィンガープリント',
    syncToSheets: 'スプレッドシートに同期',
    backupToDrive: 'Driveに暗号化バックアップ',
    calendarAlert: 'Calendar期限アラート',

    sharesTitle: 'アクティブな検証可能プレゼンテーション',
    sharesSubtitle: '外部監査機関や検証者に共有した選択的開示リンクの追跡・失効管理。',
    createNewShare: '新規プレゼンテーションを作成',
    activeSharesCount: '有効な共有リンク数',
    recipient: '開示先',
    created: '作成日時',
    expires: '失効日時',
    viewsRemaining: '残り閲覧可能回数',
    burnAfterRead: '1回閲覧後に消滅',
    revokeAccess: 'リンクを即時失効',
    previewVerification: '検証者ビューで確認',
    shareLinkCopied: '共有リンクをクリップボードにコピーしました！',

    tiveTitle: 'TiveAI Webアプリ内自律操作コントローラー',
    tiveSubtitle: '自然言語コマンドでWebアプリ内の操作を実行し、API連携や暗号証明書を操作・解説します。',
    tiveInputPlaceholder: '指示を入力（例: 「グリッド表示にして」「SBTのみ表示」「共有作成」「英語にして」）...',
    tiveExecute: '実行',
    tiveThinking: 'コマンドを解析・実行中...',
    tiveQuickActionsTitle: 'クイック操作コマンド',
    actionSwitchGrid: 'グリッド表示に切り替え',
    actionSwitchCascade: '3Dカスケード表示に切り替え',
    actionShowShares: '共有リンク一覧を表示',
    actionFilterSbt: 'SBT（ソウルバウンド）のみを抽出',
    actionInspectCore: '自律AIエージェントのDID詳細を確認',
    actionOpenShare: '選択的開示共有ウィザードを開く',
    actionOpenMint: '新しい証明書を発行（ミント）',
    actionSyncSheets: 'Googleスプレッドシートに同期',
    actionSwitchLang: 'Switch to English (英語)',
    actionTestApi: 'Amane / AWallet 統合API疎通テストを実行',

    apiGatewayTitle: 'Amane Protocol & AWallet 統合APIゲートウェイ',
    apiGatewaySubtitle: '重複機能を排除し一本化されたREST APIエンドポイントと、自律エージェント向けSkill.md仕様書。',
    tabApiGateway: 'REST API エンドポイント',
    tabSkillMd: 'AIエージェント Skill.md 仕様',
    testEndpoint: 'API疎通テストを実行',
    testingEndpoint: 'APIリクエスト送信中...',
    apiStatusOnline: '正常稼働中 (200 OK)',
    endpointVerified: '暗号学的署名レスポンス検証完了',
    skillSpecTitle: 'Gemini / Claude 対応 Skill.md スキーマ',
    skillSpecSubtitle: 'マルチエージェント環境向けに標準化された自律関数呼び出し定義。',
    copyJsonSchema: 'ツール定義JSONをコピー',
    copied: 'コピー完了！',
  },
};
