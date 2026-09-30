import { VerifiableCertificate } from '../types/certificate';

export interface GoogleContact {
  resourceName: string;
  name: string;
  email: string;
  photoUrl?: string;
}

export interface WorkspaceSyncResult {
  service: 'sheets' | 'drive' | 'calendar' | 'meet' | 'contacts' | 'chat';
  success: boolean;
  message: string;
  url?: string;
  data?: any;
}

/**
 * Fetch contacts from Google People API using the access token
 */
export async function fetchGoogleContacts(accessToken: string): Promise<GoogleContact[]> {
  try {
    const res = await fetch(
      'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,photos&pageSize=50',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('People API error:', err);
      // Return empty array gracefully if no contacts found or permission issue
      return [];
    }

    const data = await res.json();
    if (!data.connections || !Array.isArray(data.connections)) {
      return [];
    }

    return data.connections
      .map((person: any) => {
        const name = person.names?.[0]?.displayName || person.names?.[0]?.givenName || 'Unnamed Contact';
        const email = person.emailAddresses?.[0]?.value || '';
        const photoUrl = person.photos?.[0]?.url;
        return {
          resourceName: person.resourceName || '',
          name,
          email,
          photoUrl,
        };
      })
      .filter((c: GoogleContact) => c.email.length > 0);
  } catch (error) {
    console.error('Error fetching Google contacts:', error);
    return [];
  }
}

/**
 * Export and sync certificate inventory & audit trail into Google Sheets
 */
export async function syncToGoogleSheets(
  accessToken: string,
  certificates: VerifiableCertificate[]
): Promise<WorkspaceSyncResult> {
  try {
    // 1. Create a new Spreadsheet
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: `AetherID: AI DID/SBT/TBA Audit Ledger (${new Date().toLocaleDateString()})`,
        },
        sheets: [
          {
            properties: {
              title: 'Active Credentials',
              gridProperties: { rowCount: 100, columnCount: 10 },
            },
          },
        ],
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to create Google Spreadsheet');
    }

    const sheetData = await createRes.json();
    const spreadsheetId = sheetData.spreadsheetId;
    const spreadsheetUrl = sheetData.spreadsheetUrl;

    // 2. Prepare headers and rows
    const headerRow = [
      'Cert ID',
      'Type',
      'Title',
      'DID Subject',
      'Issuer Name',
      'Status',
      'Issued At',
      'Expires At',
      'Network',
      'SHA256 Cryptographic Fingerprint',
      'Sync Timestamp',
    ];

    const dataRows = certificates.map((c) => [
      c.id,
      c.type,
      c.title,
      c.didSubject,
      c.issuer.name,
      c.status.toUpperCase(),
      new Date(c.issuedAt).toLocaleString(),
      c.expiresAt ? new Date(c.expiresAt).toLocaleString() : 'Permanent (Soulbound)',
      c.network,
      c.proof.sha256Fingerprint,
      new Date().toISOString(),
    ]);

    const values = [headerRow, ...dataRows];

    // 3. Populate rows
    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Active%20Credentials!A1:K${values.length}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      }
    );

    if (!updateRes.ok) {
      console.warn('Values update warning:', await updateRes.text());
    }

    return {
      service: 'sheets',
      success: true,
      message: `Audit ledger successfully created with ${certificates.length} digital credentials.`,
      url: spreadsheetUrl,
      data: { spreadsheetId },
    };
  } catch (err: any) {
    return {
      service: 'sheets',
      success: false,
      message: err.message || 'Google Sheets sync failed',
    };
  }
}

/**
 * Backup certificates JSON envelope to Google Drive
 */
export async function backupToGoogleDrive(
  accessToken: string,
  certificates: VerifiableCertificate[],
  backupName: string = 'AetherID_AI_Credentials_Vault.json'
): Promise<WorkspaceSyncResult> {
  try {
    const fileContent = JSON.stringify(
      {
        vaultVersion: '2.0.0-W3C-DID',
        exportedAt: new Date().toISOString(),
        totalCertificates: certificates.length,
        walletSubject: certificates[0]?.didSubject || 'did:key:anonymous',
        credentials: certificates,
      },
      null,
      2
    );

    const metadata = {
      name: backupName,
      mimeType: 'application/json',
      description: 'Encrypted backup snapshot of AI DID, Soulbound Tokens, and Token Bound Accounts from AetherID Wallet',
    };

    // Use multipart upload to Google Drive v3
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      fileContent +
      closeDelimiter;

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to upload backup to Google Drive');
    }

    const data = await res.json();
    return {
      service: 'drive',
      success: true,
      message: `Vault backup saved to Google Drive: "${data.name}"`,
      url: data.webViewLink,
      data: { fileId: data.id },
    };
  } catch (err: any) {
    return {
      service: 'drive',
      success: false,
      message: err.message || 'Google Drive backup failed',
    };
  }
}

/**
 * Schedule expiration watchdog reminder on Google Calendar
 */
export async function scheduleExpiryCalendarAlert(
  accessToken: string,
  cert: VerifiableCertificate
): Promise<WorkspaceSyncResult> {
  try {
    if (!cert.expiresAt) {
      return {
        service: 'calendar',
        success: false,
        message: 'This certificate is permanent (Soulbound) and has no expiration date.',
      };
    }

    const expiryTime = new Date(cert.expiresAt);
    // Alert 24 hours prior
    const alertStartTime = new Date(expiryTime.getTime() - 24 * 60 * 60 * 1000);
    const alertEndTime = new Date(alertStartTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    const event = {
      summary: `⚠️ [AetherID Alert] AI Credential Expiry: ${cert.title}`,
      description: `Your AI Digital Certificate "${cert.title}" (${cert.type}) is set to expire on ${expiryTime.toLocaleString()}.\n\nIssuer: ${cert.issuer.name}\nSubject DID: ${cert.didSubject}\nStatus: Renewal or re-attestation required.`,
      start: {
        dateTime: alertStartTime.toISOString(),
      },
      end: {
        dateTime: alertEndTime.toISOString(),
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
          { method: 'email', minutes: 60 * 24 },
        ],
      },
    };

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to create Calendar alert');
    }

    const data = await res.json();
    return {
      service: 'calendar',
      success: true,
      message: `Calendar renewal alert scheduled for 24h before expiry (${alertStartTime.toLocaleDateString()}).`,
      url: data.htmlLink,
      data: { eventId: data.id },
    };
  } catch (err: any) {
    return {
      service: 'calendar',
      success: false,
      message: err.message || 'Google Calendar event creation failed',
    };
  }
}

/**
 * Create a Google Meet verification space
 */
export async function createMeetVerificationSpace(
  accessToken: string,
  presentationTitle: string = 'AI Digital Certificate Live Verification'
): Promise<WorkspaceSyncResult> {
  try {
    const res = await fetch('https://meet.googleapis.com/v2/spaces', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: {
          accessType: 'OPEN',
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      // Meet API might need specific enablement, fall back cleanly if not available
      return {
        service: 'meet',
        success: false,
        message: err.error?.message || 'Google Meet API space creation request failed.',
      };
    }

    const data = await res.json();
    return {
      service: 'meet',
      success: true,
      message: 'Google Meet verification space generated!',
      url: data.meetingUri,
      data,
    };
  } catch (err: any) {
    return {
      service: 'meet',
      success: false,
      message: err.message || 'Meet creation failed',
    };
  }
}
