---
name: awallet-maas-skill
description: >-
  Interact with AWallet MaaS (Multi-Agent Account Abstraction Service) to inspect sovereign AI DIDs, Soulbound Tokens (SBT), Token Bound Accounts (TBA), generate zero-knowledge verifiable presentations, execute Chat Pay micropayments, and sync audit trails with Google Workspace.
---

# AWallet MaaS AI Agent Skill (Gemini & Claude Compatible)

This skill enables AI agents (Google Gemini and Anthropic Claude) to interface directly with the AWallet MaaS API gateway.

## Capabilities

1. **Query Sovereign Identity**: Retrieve agent DIDs, Soulbound attestation badges, and Token Bound Accounts.
2. **Selective Zero-Knowledge Presentation**: Generate cryptographically signed W3C Verifiable Presentations with attribute redaction and ZK proofs.
3. **Execute Chat Pay**: Initiate and settle micropayments or API inference invoices within conversational threads.
4. **Google Workspace Sync**: Audit credential interactions directly to Google Sheets and schedule expiry reminders in Google Calendar.

---

## Tool Definitions (JSON Schema)

### 1. `awallet_get_credentials`
Retrieves all active decentralized credentials registered to this AI agent.

```json
{
  "name": "awallet_get_credentials",
  "description": "Lists all W3C DIDs, Soulbound Tokens (SBT), and ERC-6551 Token Bound Accounts (TBA) owned by the current AI agent.",
  "parameters": {
    "type": "OBJECT",
    "properties": {
      "typeFilter": {
        "type": "STRING",
        "enum": ["ALL", "DID", "SBT", "TBA"],
        "description": "Optional filter by credential type"
      }
    }
  }
}
```

### 2. `awallet_present_selective_proof`
Creates a scoped, temporary verifiable presentation for a designated recipient.

```json
{
  "name": "awallet_present_selective_proof",
  "description": "Presents one or more certificates to an external verifier with optional zero-knowledge attribute redaction and automatic expiration.",
  "parameters": {
    "type": "OBJECT",
    "properties": {
      "credentialIds": {
        "type": "ARRAY",
        "items": { "type": "STRING" },
        "description": "List of credential IDs to include"
      },
      "recipient": {
        "type": "STRING",
        "description": "Recipient name, email, or DID"
      },
      "disclosedAttributes": {
        "type": "ARRAY",
        "items": { "type": "STRING" },
        "description": "Attribute keys to disclose; all omitted keys remain encrypted with ZK proof"
      },
      "expirationMinutes": {
        "type": "INTEGER",
        "description": "Validity lifetime (e.g. 10, 60, 1440)"
      },
      "oneTimeView": {
        "type": "BOOLEAN",
        "description": "If true, link burns after single verification"
      }
    },
    "required": ["credentialIds", "recipient"]
  }
}
```

### 3. `awallet_chat_pay_request`
Initiates an in-chat settlement or micropayment.

```json
{
  "name": "awallet_chat_pay_request",
  "description": "Executes an in-chat micropayment or generates an invoice via ERC-4337 Session Keys, WebLN, or Stripe Agent Rail.",
  "parameters": {
    "type": "OBJECT",
    "properties": {
      "amount": { "type": "STRING", "description": "Payment amount (e.g., '0.005 ETH' or '5.00 USD')" },
      "recipientAddressOrEmail": { "type": "STRING", "description": "Destination address, DID, or payment recipient" },
      "memo": { "type": "STRING", "description": "Purpose of payment or invoice description" },
      "rail": {
        "type": "STRING",
        "enum": ["ERC4337_TBA", "WEBLN_LIGHTNING", "STRIPE_AGENT_PAY"],
        "description": "Payment rail to use"
      }
    },
    "required": ["amount", "recipientAddressOrEmail"]
  }
}
```

---

## Agent Behavioral Guidelines

- **Principle of Least Privilege**: When presenting credentials, never disclose sensitive fields (such as owner private keys, raw internal weights, or user admin emails) unless strictly requested by the verified auditor. Always activate Zero-Knowledge mathematical verification.
- **Confirmation for High-Value Transactions**: If a Chat Pay amount exceeds the agent's autonomous daily limit (0.25 ETH), prompt the user for explicit confirmation before broadcasting the transaction.
