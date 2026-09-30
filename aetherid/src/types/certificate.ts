export type CertificateType = 'DID' | 'SBT' | 'TBA';
export type CertificateStatus = 'active' | 'expiring' | 'revoked' | 'bound';

export interface AttributeItem {
  key: string;
  label: string;
  value: string | number | boolean;
  category: 'identity' | 'capability' | 'compliance' | 'security';
  zkProofAvailable: boolean;
  disclosedByDefault: boolean;
}

export interface IssuerInfo {
  name: string;
  did: string;
  avatarUrl?: string;
  trustScore: number; // 0 - 100
  verified: boolean;
  domain: string;
  complianceRating: string;
}

export interface TokenBoundAccountInfo {
  accountAddress: string;
  registryContract: string;
  tokenContract: string;
  tokenId: string;
  chainId: number;
  networkName: string;
  balanceEth: string;
  dailyGasLimitEth: string;
  dailyGasUsedEth: string;
  autonomousExecutionEnabled: boolean;
  delegatedKeyCount: number;
}

export interface SoulboundInfo {
  isSoulbound: boolean;
  nonTransferableReason: string;
  mintTxHash: string;
  blockHeight: number;
  governanceWeight: number;
  revocableByIssuer: boolean;
}

export interface CryptographicProof {
  type: string; // e.g. "Ed25519Signature2020" | "JsonWebSignature2020"
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  proofValue: string;
  sha256Fingerprint: string;
}

export interface VerifiableCertificate {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  type: CertificateType;
  didSubject: string;
  issuer: IssuerInfo;
  issuedAt: string; // ISO
  expiresAt: string | null; // ISO or null
  status: CertificateStatus;
  network: string;
  accentColor: string; // 'cyan' | 'purple' | 'emerald' | 'amber' | 'blue'
  iconName: string;
  previewImageUrl?: string;
  tbaInfo?: TokenBoundAccountInfo;
  sbtInfo?: SoulboundInfo;
  attributes: AttributeItem[];
  proof: CryptographicProof;
  tags: string[];
}

export interface ShareRecipient {
  name: string;
  emailOrDid: string;
  avatarUrl?: string;
  notes?: string;
  source?: 'contacts' | 'manual';
}

export interface SelectiveShareConfig {
  selectedCertIds: string[];
  disclosedAttributeKeys: Record<string, string[]>; // certId -> array of attribute keys
  recipient: ShareRecipient;
  expirationMinutes: number; // 10, 60, 1440, 10080, -1 (never)
  oneTimeView: boolean;
  enableZeroKnowledgeProof: boolean;
  allowDownloadRawVC: boolean;
  exportToGoogleSheets: boolean;
  createCalendarEvent: boolean;
}

export interface SharedPresentationRecord {
  id: string;
  shareToken: string;
  shareUrl: string;
  createdAt: string;
  expiresAt: string | null;
  recipientName: string;
  recipientEmailOrDid: string;
  includedCerts: {
    certId: string;
    certTitle: string;
    certType: CertificateType;
    disclosedAttributesCount: number;
    zkEnabled: boolean;
  }[];
  oneTimeView: boolean;
  viewsRemaining: number;
  status: 'active' | 'accessed' | 'expired' | 'revoked';
  accessLogs: { timestamp: string; ipOrDomain: string; verifier: string }[];
}
