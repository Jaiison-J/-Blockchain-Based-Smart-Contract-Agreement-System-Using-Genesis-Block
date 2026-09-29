# Blockchain-Based Smart Contract Agreement System Using Genesis Block

> **BIC702: Blockchain Technology Laboratory Assignment**  
> An educational, client-side blockchain simulation implementing decentralized smart contract agreements, Genesis block linkage, SHA-256 cryptographic proof, and real-time tamper detection using pure JavaScript.

---

## 📌 Repository Description (For GitHub "About" Section)

```text
An educational, client-side blockchain application simulating decentralized smart contract agreements with Genesis Block #0, SHA-256 cryptographic verification, parent hash linkage, and interactive tamper detection using pure JavaScript.
```

**Topics / Tags:** `blockchain`, `smart-contracts`, `sha-256`, `genesis-block`, `cryptography`, `javascript`, `bic702`, `educational-simulation`, `hash-chain`

---

## 📖 Overview

Traditional agreements often suffer from manual record handling, lack of transparency, and vulnerability to back-dated alterations. This project simulates how multi-party legal agreements can be recorded as immutable blockchain transactions. 

Each agreement is packaged into a discrete block cryptographically bound to its parent via a **SHA-256 hash**, anchored by **Genesis Block #0** with `previousHash = "0"`. The system enforces autonomous smart-contract rules governing contract status transitions and features real-time tamper detection.

---

## ⚙️ Key Concepts Demonstrated

- **Genesis Block Root**: Initializes the chain with Block #0, previous hash `0`, and a root system payload.
- **SHA-256 Cryptographic Hashing**: Generates unique 64-character hexadecimal digital fingerprints using the browser's native **Web Crypto API** (`crypto.subtle.digest`).
- **Sequential Hash Linking**: Block $N$ stores `previousHash = Block[N - 1].hash`, creating an immutable forward chain.
- **Smart Contract Rules Engine**:
  - `createAgreement()`: Instantiates new agreements in the `Active` state with unique identifiers.
  - `completeAgreement()`: Transitions `Active` agreements to `Completed` (permanently locked).
  - `cancelAgreement()`: Terminal cancellation; prevents completed agreements from cancellation and cancelled agreements from reactivation.
  - `verifyAgreement()`: Verifies cryptographic hash and chain lineage for any individual contract.
- **Tampering Demonstration**: Modifies contract data in memory to show how hash mismatch instantly breaks the cryptographic chain.
- **Local Storage Persistence**: Persists the chain and agreements across browser reloads without external databases.

---

## 🔄 System Flow Architecture

```text
[Party A (Initiator)] 
        ↓
[Create Agreement Form] 
        ↓
[Smart Contract Validation Rules] 
        ↓
[Transaction Formed] 
        ↓
[Genesis Block / Linked Blockchain] 
        ↓
[SHA-256 Cryptographic Hash Generated] 
        ↓
[Blockchain Verification Engine] 
        ↓
[Party B / Authorized Counterparty]
```

---

## 🚀 Key Features

1. **Real-Time Dashboard**:
   - Total Agreements count
   - Active Agreements count
   - Completed Agreements count
   - Total Blockchain Blocks (including Genesis Block)
   - Real-time Blockchain Status (`Valid ✓` / `Tampered ✗`)

2. **Agreement Creation**:
   - Fields: Agreement ID, Party A, Party B, Title, Description, Contract Amount, Start Date, End Date.
   - Automatically mines a new block, computes previous hash, and updates the ledger.

3. **Blockchain Ledger**:
   - Visual chain representation starting with **Genesis Block #0**.
   - Chronological block cards connected with link indicators.
   - Shows timestamp, transaction payload, `previousHash`, and `hash`.

4. **Agreement Records Table**:
   - Tabular record with status badges (`Active`, `Completed`, `Cancelled`).
   - Actions to **View Details**, **Complete**, **Cancel**, or **Verify** individual agreements.

5. **Chain Verification & Tamper Demo**:
   - One-click cryptographic audit recalculating hashes across all blocks.
   - Interactive tampering simulator showing immediate chain invalidation.
   - One-click reset to restore pristine state.

6. **Preloaded Demo Data**:
   - "Load Sample Agreements" button populates contracts (`A001`, `A002`, `A003`) for live laboratory demonstration.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Semantic Elements
- **Styling**: CSS3 (Light Lavender / White academic theme)
- **Logic**: Pure JavaScript (ES6+ Standards — *No TypeScript, no external frameworks*)
- **Cryptography**: Native Web Crypto API (`crypto.subtle.digest`) with pure JS SHA-256 fallback
- **Storage**: Browser `localStorage` API

---

## 📂 Project Structure

```text
.
├── index.html       # Single-page application structure & semantic layout
├── style.css        # Light purple / lavender theme & responsive styling
├── script.js        # Blockchain core, SHA-256 hashing, smart contract rules, & UI logic
├── package.json     # Node configuration for dev server / Vite build
├── vite.config.js   # Vite server configuration (Port 3000)
└── README.md        # Project documentation
```

---

## 💻 How to Run Locally

### Option 1: Direct in Browser
Simply open `index.html` in any modern web browser (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari).

### Option 2: Using Node / Vite
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/blockchain-smart-contract-system.git
   cd blockchain-smart-contract-system
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run local development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000` in your browser.

---

## 🧪 Evaluation & Demonstration Steps (BIC702 Lab)

1. **Verify Genesis Block**: Observe Block #0 with `Previous Hash: 0` and explanation notice.
2. **Load Sample Data**: Click **"Load Sample Agreements"** to populate demonstration contracts.
3. **Inspect the Ledger**: Scroll down to the **Blockchain Ledger** to inspect how Block #1 links to Block #0's hash.
4. **Create a New Agreement**: Fill out the form and click **"Create Agreement & Mine Block"**. Notice Block #N being appended.
5. **Execute Smart Contract Transition**: Click **"Complete"** on an active agreement. Notice the state change and immutability lock.
6. **Verify Blockchain**: Click **"Verify Blockchain"** — observe the green `Valid ✓` indicator.
7. **Test Tamper Detection**: Click **"Demo Tampering"** — observe the instant red warning, mismatched block hash, and chain failure.
8. **Restore Integrity**: Click **"Reset Blockchain"** to restore pristine valid state.

---

## ⚖️ Academic Disclaimer

This project is an educational simulation developed for the **BIC702 Blockchain Technology** laboratory assignment. It illustrates fundamental decentralized ledger principles without requiring gas fees or public blockchain networks.
