/**
 * Blockchain Technology BIC702 Laboratory Project
 * Project: Blockchain-Based Smart Contract Agreement System Using Genesis Block
 * Language: JavaScript (Pure JS - No TypeScript)
 */

// ==========================================
// 1. SHA-256 Cryptographic Hash Helper
// ==========================================

// Pure JS SHA-256 implementation (Fallback for environments without crypto.subtle)
function jsSha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i, j;
  let result = '';

  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [];
  const k = [];
  let primeCounter = 0;

  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80';
  while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return; // UTF-8 outside ASCII range
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const i2 = i + j;
      const w15 = w[i - 15],
        w2 = w[i - 2];

      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] =
        i < 16
          ? w[i]
          : (w[i - 16] + s0 + w[i - 7] + s1) | 0;

      const s1Main = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1Main + ch + k[i] + w[i]) | 0;
      const s0Main = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0Main + maj) | 0;

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

// Calculate SHA-256 using Browser Web Crypto API with fallback
async function calculateSHA256(message) {
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
    try {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      // Fallback to JS SHA-256
      return jsSha256(message);
    }
  }
  return jsSha256(message);
}

// Calculate block hash based on index, timestamp, data, and previousHash
async function calculateBlockHash(index, timestamp, data, previousHash) {
  const content = String(index) + String(timestamp) + JSON.stringify(data) + String(previousHash);
  return await calculateSHA256(content);
}

// ==========================================
// 2. Blockchain & Agreement State
// ==========================================

const STORAGE_KEYS = {
  CHAIN: 'bic702_blockchain_chain',
  AGREEMENTS: 'bic702_blockchain_agreements',
  PRISTINE_BACKUP: 'bic702_pristine_backup'
};

let blockchain = [];
let agreements = [];
let isTamperedDemo = false;
let tamperedBlockIndex = null;

// ==========================================
// 3. Smart Contract Agreement Functions
// ==========================================

/**
 * Creates Genesis Block #0
 */
async function createGenesisBlock() {
  const index = 0;
  const timestamp = new Date().toISOString();
  const previousHash = "0";
  const data = "Genesis Block - Smart Contract Agreement System";
  const hash = await calculateBlockHash(index, timestamp, data, previousHash);

  return {
    index: 0,
    timestamp: timestamp,
    data: data,
    previousHash: "0",
    hash: hash,
    isGenesis: true
  };
}

/**
 * Initializes Blockchain from localStorage or builds Genesis Block
 */
async function initBlockchain() {
  const savedChain = localStorage.getItem(STORAGE_KEYS.CHAIN);
  const savedAgreements = localStorage.getItem(STORAGE_KEYS.AGREEMENTS);

  if (savedChain && savedAgreements) {
    try {
      blockchain = JSON.parse(savedChain);
      agreements = JSON.parse(savedAgreements);
      if (blockchain.length === 0) {
        const genesis = await createGenesisBlock();
        blockchain = [genesis];
        agreements = [];
        saveToStorage();
      }
    } catch (e) {
      const genesis = await createGenesisBlock();
      blockchain = [genesis];
      agreements = [];
      saveToStorage();
    }
  } else {
    const genesis = await createGenesisBlock();
    blockchain = [genesis];
    agreements = [];
    saveToStorage();
  }

  // Backup pristine state for tamper reset demo
  backupPristineState();
  
  // Set default dates in form
  initFormDates();
  
  // Render everything
  await updateUI();
}

function initFormDates() {
  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(today.getDate() + 30);

  const startInput = document.getElementById('startDate');
  const endInput = document.getElementById('endDate');
  
  if (startInput && !startInput.value) {
    startInput.value = today.toISOString().split('T')[0];
  }
  if (endInput && !endInput.value) {
    endInput.value = nextMonth.toISOString().split('T')[0];
  }

  suggestNextAgreementId();
}

function suggestNextAgreementId() {
  const idInput = document.getElementById('agreementId');
  if (idInput) {
    const nextNum = (agreements.length + 1).toString().padStart(3, '0');
    idInput.value = `AG-${nextNum}`;
  }
}

function backupPristineState() {
  if (!isTamperedDemo) {
    localStorage.setItem(STORAGE_KEYS.PRISTINE_BACKUP, JSON.stringify({
      blockchain: blockchain,
      agreements: agreements
    }));
  }
}

function saveToStorage() {
  if (!isTamperedDemo) {
    localStorage.setItem(STORAGE_KEYS.CHAIN, JSON.stringify(blockchain));
    localStorage.setItem(STORAGE_KEYS.AGREEMENTS, JSON.stringify(agreements));
    backupPristineState();
  }
}

/**
 * Smart Contract Rule: createAgreement()
 * - Initializes status as 'Active'
 * - Creates a transaction
 * - Generates new block linked to previous block
 */
async function createAgreement(formData) {
  // Check if Agreement ID already exists
  const existing = agreements.find(a => a.agreementId.toLowerCase() === formData.agreementId.trim().toLowerCase());
  if (existing) {
    throw new Error(`Agreement ID "${formData.agreementId}" already exists in the blockchain. Duplicate IDs are rejected by Smart Contract rules.`);
  }

  const newIndex = blockchain.length;
  const previousBlock = blockchain[blockchain.length - 1];
  const previousHash = previousBlock.hash;
  const timestamp = new Date().toISOString();

  // Smart Contract Agreement Payload
  const agreementRecord = {
    agreementId: formData.agreementId.trim(),
    partyA: formData.partyA.trim(),
    partyB: formData.partyB.trim(),
    title: formData.title.trim(),
    description: formData.description.trim() || 'No additional terms provided.',
    amount: formData.amount.trim(),
    startDate: formData.startDate,
    endDate: formData.endDate,
    status: 'Active', // Rule: A new agreement starts as Active
    blockNumber: newIndex,
    createdAt: timestamp,
    isDemo: !!formData.isDemo
  };

  // Block payload
  const blockData = {
    type: 'SMART_CONTRACT_AGREEMENT',
    agreementId: agreementRecord.agreementId,
    partyA: agreementRecord.partyA,
    partyB: agreementRecord.partyB,
    title: agreementRecord.title,
    amount: agreementRecord.amount,
    status: agreementRecord.status,
    startDate: agreementRecord.startDate,
    endDate: agreementRecord.endDate
  };

  // Generate SHA-256 block hash
  const hash = await calculateBlockHash(newIndex, timestamp, blockData, previousHash);

  const newBlock = {
    index: newIndex,
    timestamp: timestamp,
    data: blockData,
    previousHash: previousHash,
    hash: hash,
    isGenesis: false
  };

  agreementRecord.hash = hash;

  // Add to blockchain and agreement list
  blockchain.push(newBlock);
  agreements.push(agreementRecord);

  saveToStorage();
  await updateUI();

  return agreementRecord;
}

/**
 * Smart Contract Rule: completeAgreement(id)
 * - Rule: An Active agreement can become Completed.
 * - Rule: A Completed agreement cannot be edited.
 * - Rule: A Cancelled agreement cannot be completed.
 */
async function completeAgreement(agreementId) {
  const agreement = agreements.find(a => a.agreementId === agreementId);
  if (!agreement) {
    showToast(`Agreement "${agreementId}" not found.`, 'error');
    return false;
  }

  if (agreement.status === 'Completed') {
    showToast(`Smart Contract Rule Violation: Agreement "${agreementId}" is already Completed and cannot be modified.`, 'error');
    return false;
  }

  if (agreement.status === 'Cancelled') {
    showToast(`Smart Contract Rule Violation: Agreement "${agreementId}" was Cancelled and cannot be Completed.`, 'error');
    return false;
  }

  // Update agreement status
  agreement.status = 'Completed';
  agreement.completedAt = new Date().toISOString();

  // Update corresponding block data
  const targetBlock = blockchain.find(b => !b.isGenesis && b.data && b.data.agreementId === agreementId);
  if (targetBlock) {
    targetBlock.data.status = 'Completed';
    // Recalculate block hash to reflect valid state transition in this educational model
    targetBlock.hash = await calculateBlockHash(targetBlock.index, targetBlock.timestamp, targetBlock.data, targetBlock.previousHash);
    agreement.hash = targetBlock.hash;
    
    // Update subsequent blocks if any to maintain chain validity
    for (let i = targetBlock.index + 1; i < blockchain.length; i++) {
      blockchain[i].previousHash = blockchain[i - 1].hash;
      blockchain[i].hash = await calculateBlockHash(blockchain[i].index, blockchain[i].timestamp, blockchain[i].data, blockchain[i].previousHash);
      const nextAg = agreements.find(a => a.blockNumber === blockchain[i].index);
      if (nextAg) nextAg.hash = blockchain[i].hash;
    }
  }

  saveToStorage();
  await updateUI();
  showToast(`Agreement "${agreementId}" successfully Completed under Smart Contract terms.`, 'success');
  return true;
}

/**
 * Smart Contract Rule: cancelAgreement(id)
 * - Rule: Only Active agreements can be cancelled.
 * - Rule: A Completed agreement cannot be cancelled.
 * - Rule: A Cancelled agreement cannot be re-activated.
 */
async function cancelAgreement(agreementId) {
  const agreement = agreements.find(a => a.agreementId === agreementId);
  if (!agreement) {
    showToast(`Agreement "${agreementId}" not found.`, 'error');
    return false;
  }

  if (agreement.status === 'Completed') {
    showToast(`Smart Contract Rule Violation: A Completed agreement cannot be cancelled.`, 'error');
    return false;
  }

  if (agreement.status === 'Cancelled') {
    showToast(`Smart Contract Rule Violation: Agreement "${agreementId}" is already Cancelled.`, 'error');
    return false;
  }

  agreement.status = 'Cancelled';
  agreement.cancelledAt = new Date().toISOString();

  const targetBlock = blockchain.find(b => !b.isGenesis && b.data && b.data.agreementId === agreementId);
  if (targetBlock) {
    targetBlock.data.status = 'Cancelled';
    targetBlock.hash = await calculateBlockHash(targetBlock.index, targetBlock.timestamp, targetBlock.data, targetBlock.previousHash);
    agreement.hash = targetBlock.hash;

    for (let i = targetBlock.index + 1; i < blockchain.length; i++) {
      blockchain[i].previousHash = blockchain[i - 1].hash;
      blockchain[i].hash = await calculateBlockHash(blockchain[i].index, blockchain[i].timestamp, blockchain[i].data, blockchain[i].previousHash);
      const nextAg = agreements.find(a => a.blockNumber === blockchain[i].index);
      if (nextAg) nextAg.hash = blockchain[i].hash;
    }
  }

  saveToStorage();
  await updateUI();
  showToast(`Agreement "${agreementId}" has been marked Cancelled.`, 'success');
  return true;
}

/**
 * Smart Contract Rule: activateAgreement(id)
 */
async function activateAgreement(agreementId) {
  const agreement = agreements.find(a => a.agreementId === agreementId);
  if (!agreement) {
    showToast(`Agreement "${agreementId}" not found.`, 'error');
    return false;
  }

  if (agreement.status === 'Cancelled') {
    showToast(`Smart Contract Rule Violation: A Cancelled agreement cannot be activated again.`, 'error');
    return false;
  }

  if (agreement.status === 'Completed') {
    showToast(`Smart Contract Rule Violation: A Completed agreement is immutable.`, 'error');
    return false;
  }

  showToast(`Agreement "${agreementId}" is currently Active.`, 'success');
  return true;
}

/**
 * 8. Verify Blockchain
 * Recalculates each block hash, checks previousHash chain links
 */
async function verifyBlockchain() {
  const logs = [];
  let isValid = true;
  let failedIndex = null;
  let errorDetails = null;

  if (blockchain.length === 0) {
    return { isValid: false, errorDetails: 'Blockchain is empty.', failedIndex: null, logs: ['Empty chain'] };
  }

  for (let i = 0; i < blockchain.length; i++) {
    const block = blockchain[i];

    // Genesis Block check
    if (i === 0) {
      if (block.previousHash !== "0") {
        isValid = false;
        failedIndex = 0;
        errorDetails = `Genesis Block #0 previousHash is "${block.previousHash}", expected "0".`;
        logs.push(`Block #0 (Genesis): FAILED - Previous hash must be 0.`);
        break;
      }

      const calculatedGenesisHash = await calculateBlockHash(block.index, block.timestamp, block.data, block.previousHash);
      if (calculatedGenesisHash !== block.hash) {
        isValid = false;
        failedIndex = 0;
        errorDetails = `Genesis Block #0 hash mismatch! Expected ${calculatedGenesisHash}, found ${block.hash}.`;
        logs.push(`Block #0 (Genesis): FAILED - Hash altered.`);
        break;
      }

      logs.push(`Block #0 (Genesis): VALID - Previous Hash: "0", Hash verified ✓`);
    } else {
      const prevBlock = blockchain[i - 1];

      // Check link to previous block
      if (block.previousHash !== prevBlock.hash) {
        isValid = false;
        failedIndex = i;
        errorDetails = `Broken Link at Block #${i}: block.previousHash does not match Block #${i - 1} hash!`;
        logs.push(`Block #${i}: FAILED - Broken linkage with Block #${i - 1}.`);
        break;
      }

      // Check block hash integrity
      const calculatedHash = await calculateBlockHash(block.index, block.timestamp, block.data, block.previousHash);
      if (calculatedHash !== block.hash) {
        isValid = false;
        failedIndex = i;
        errorDetails = `Data Tampering Detected in Block #${i}! Calculated SHA-256 hash does not match stored block hash.`;
        logs.push(`Block #${i}: FAILED - Hash recalculation mismatch.`);
        break;
      }

      logs.push(`Block #${i}: VALID - Correctly linked to Block #${i - 1} and SHA-256 hash intact ✓`);
    }
  }

  return {
    isValid: isValid,
    failedIndex: failedIndex,
    errorDetails: errorDetails,
    logs: logs
  };
}

/**
 * 9. Verify Agreement
 * Searches blockchain and returns full verification report
 */
async function verifyAgreement(agreementId) {
  const query = agreementId.trim().toLowerCase();
  const agreement = agreements.find(a => a.agreementId.toLowerCase() === query);

  if (!agreement) {
    return {
      found: false,
      message: `Agreement ID "${agreementId}" was not found in the blockchain records.`
    };
  }

  // Find corresponding block in blockchain
  const block = blockchain.find(b => b.index === agreement.blockNumber);
  if (!block) {
    return {
      found: true,
      agreement: agreement,
      blockFound: false,
      verified: false,
      message: `Agreement record exists, but Block #${agreement.blockNumber} is missing from the ledger!`
    };
  }

  // Recalculate hash of this block
  const calculatedHash = await calculateBlockHash(block.index, block.timestamp, block.data, block.previousHash);
  const hashMatches = (calculatedHash === block.hash);

  // Check previous link
  let linkValid = true;
  if (block.index > 0) {
    const prevBlock = blockchain[block.index - 1];
    linkValid = prevBlock && (block.previousHash === prevBlock.hash);
  } else {
    linkValid = (block.previousHash === "0");
  }

  const isAuthentic = hashMatches && linkValid;

  return {
    found: true,
    agreement: agreement,
    blockFound: true,
    block: block,
    storedHash: block.hash,
    calculatedHash: calculatedHash,
    hashMatches: hashMatches,
    linkValid: linkValid,
    verified: isAuthentic,
    message: isAuthentic 
      ? `Agreement "${agreement.agreementId}" is 100% Authentic and cryptographically verified in Block #${block.index}.`
      : `Tamper Warning! Agreement "${agreement.agreementId}" record in Block #${block.index} failed cryptographic hash verification.`
  };
}

/**
 * 10. Tampering Demonstration
 * Deliberately modifies data in a block without recalculating hash
 */
async function demoTampering() {
  if (blockchain.length <= 1) {
    // If only Genesis block, load sample agreements first
    await loadSampleAgreements();
  }

  // Pick Block 1 (or highest agreement block) to tamper
  const targetIndex = 1;
  const targetBlock = blockchain[targetIndex];
  
  if (!targetBlock) {
    showToast('Please add at least one agreement block before running the tamper demo.', 'error');
    return;
  }

  isTamperedDemo = true;
  tamperedBlockIndex = targetIndex;

  // Tamper with data in memory: Change contract amount or title without recalculating hash!
  const originalAmount = targetBlock.data.amount;
  targetBlock.data.amount = "₹ 9,999,999 (UNAUTHORIZED MODIFICATION)";
  targetBlock.data.title = "[TAMPERED] " + (targetBlock.data.title || "Modified Agreement");

  // Also modify the agreement in agreements array to reflect tampered state
  const targetAg = agreements.find(a => a.blockNumber === targetIndex);
  if (targetAg) {
    targetAg.amount = targetBlock.data.amount;
    targetAg.title = targetBlock.data.title;
  }

  // Update UI and verify immediately
  await updateUI();
  const verification = await verifyBlockchain();

  showToast(`Tampering injected into Block #${targetIndex}: Amount illegally modified!`, 'error');
  
  // Highlight result
  updateStatusBanner(verification);
}

/**
 * Reset Blockchain from pristine state
 */
async function resetBlockchain() {
  const pristine = localStorage.getItem(STORAGE_KEYS.PRISTINE_BACKUP);
  if (pristine) {
    try {
      const parsed = JSON.parse(pristine);
      blockchain = parsed.blockchain;
      agreements = parsed.agreements;
    } catch (e) {
      // Re-initialize fresh
      const genesis = await createGenesisBlock();
      blockchain = [genesis];
      agreements = [];
    }
  } else {
    const genesis = await createGenesisBlock();
    blockchain = [genesis];
    agreements = [];
  }

  isTamperedDemo = false;
  tamperedBlockIndex = null;
  saveToStorage();
  await updateUI();

  showToast('Blockchain restored to valid pristine state.', 'success');
}

/**
 * Reset chain to ONLY Genesis Block
 */
async function resetToGenesisOnly() {
  const genesis = await createGenesisBlock();
  blockchain = [genesis];
  agreements = [];
  isTamperedDemo = false;
  tamperedBlockIndex = null;
  saveToStorage();
  await updateUI();
  showToast('Blockchain reset to Genesis Block #0 only.', 'success');
}

/**
 * 15. Load Sample Agreements
 */
async function loadSampleAgreements() {
  // If demo tampering was active, reset first
  isTamperedDemo = false;
  tamperedBlockIndex = null;

  // Sample data specified in prompt
  const samples = [
    {
      agreementId: 'A001',
      partyA: 'ABC Construction',
      partyB: 'XYZ Supplier',
      title: 'Material Supply Agreement',
      description: 'Procurement of 500 bags of Portland Cement and reinforcement steel bars.',
      amount: '₹ 50,000',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      isDemo: true
    },
    {
      agreementId: 'A002',
      partyA: 'Student Association',
      partyB: 'Event Sponsor',
      title: 'Event Sponsorship Agreement',
      description: 'Title sponsorship rights for annual college technical fest TechVision 2026.',
      amount: '₹ 25,000',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      isDemo: true
    },
    {
      agreementId: 'A003',
      partyA: 'TechSolutions Enterprise',
      partyB: 'Cloud Infrastructure Inc.',
      title: 'Cloud Server Hosting Agreement',
      description: 'Dedicated cloud server provisioning with 99.9% uptime SLA.',
      amount: '₹ 80,000',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      isDemo: true
    }
  ];

  let addedCount = 0;
  for (const s of samples) {
    if (!agreements.some(a => a.agreementId.toLowerCase() === s.agreementId.toLowerCase())) {
      await createAgreement(s);
      addedCount++;
    }
  }

  if (addedCount > 0) {
    showToast(`Loaded ${addedCount} sample demo agreements successfully.`, 'success');
  } else {
    showToast(`Sample agreements are already loaded.`, 'success');
  }
}

// ==========================================
// 4. UI Rendering & Interactions
// ==========================================

async function updateUI() {
  renderDashboard();
  renderAgreementsTable();
  renderBlockchainLedger();
  populateVerifyDropdown();
  
  // Update verification banner
  const verification = await verifyBlockchain();
  updateStatusBanner(verification);
}

function updateStatusBanner(verification) {
  const banner = document.getElementById('statusBanner');
  const bannerTitle = document.getElementById('bannerTitle');
  const bannerDesc = document.getElementById('bannerDesc');
  const indicator = document.getElementById('statusIndicatorDot');
  const statStatus = document.getElementById('statBlockchainStatus');

  if (!banner) return;

  if (verification.isValid) {
    banner.className = 'status-banner valid';
    if (indicator) indicator.className = 'status-indicator-dot green';
    if (bannerTitle) bannerTitle.textContent = 'Blockchain Valid – Cryptographic Proof Intact';
    if (bannerDesc) bannerDesc.textContent = `All ${blockchain.length} block(s) verified via SHA-256 hash recalculation and sequential linkage.`;
    if (statStatus) {
      statStatus.innerHTML = '<span class="text-green font-bold">Valid ✓</span>';
    }
  } else {
    banner.className = 'status-banner tampered';
    if (indicator) indicator.className = 'status-indicator-dot red';
    if (bannerTitle) bannerTitle.textContent = 'Tampering Detected – Blockchain Verification Failed';
    if (bannerDesc) bannerDesc.textContent = verification.errorDetails || 'Hash mismatch detected in one or more blocks.';
    if (statStatus) {
      statStatus.innerHTML = '<span class="text-red font-bold">Tampered ✗</span>';
    }
  }
}

function renderDashboard() {
  const totalAgreementsEl = document.getElementById('statTotalAgreements');
  const activeAgreementsEl = document.getElementById('statActiveAgreements');
  const completedAgreementsEl = document.getElementById('statCompletedAgreements');
  const totalBlocksEl = document.getElementById('statTotalBlocks');

  const total = agreements.length;
  const active = agreements.filter(a => a.status === 'Active').length;
  const completed = agreements.filter(a => a.status === 'Completed').length;

  if (totalAgreementsEl) totalAgreementsEl.textContent = total;
  if (activeAgreementsEl) activeAgreementsEl.textContent = active;
  if (completedAgreementsEl) completedAgreementsEl.textContent = completed;
  if (totalBlocksEl) totalBlocksEl.textContent = blockchain.length;
}

function renderAgreementsTable() {
  const tableBody = document.getElementById('agreementsTableBody');
  const emptyState = document.getElementById('agreementsEmptyState');

  if (!tableBody) return;

  if (agreements.length === 0) {
    tableBody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  let html = '';
  agreements.forEach(ag => {
    let statusBadge = '';
    if (ag.status === 'Active') {
      statusBadge = '<span class="badge badge-active">Active</span>';
    } else if (ag.status === 'Completed') {
      statusBadge = '<span class="badge badge-completed">Completed</span>';
    } else {
      statusBadge = '<span class="badge badge-cancelled">Cancelled</span>';
    }

    const demoBadge = ag.isDemo ? ' <span style="font-size:10px; background:#f3e8ff; color:#7e22ce; padding:1px 5px; border-radius:4px; font-weight:600;">DEMO</span>' : '';

    html += `
      <tr>
        <td><strong>${escapeHtml(ag.agreementId)}</strong>${demoBadge}</td>
        <td>${escapeHtml(ag.partyA)}</td>
        <td>${escapeHtml(ag.partyB)}</td>
        <td>${escapeHtml(ag.title)}</td>
        <td><strong>${escapeHtml(ag.amount)}</strong></td>
        <td><span style="font-size:11.5px; color:var(--text-secondary);">${escapeHtml(ag.startDate)} to ${escapeHtml(ag.endDate)}</span></td>
        <td>${statusBadge}</td>
        <td><span class="badge badge-genesis">Block #${ag.blockNumber}</span></td>
        <td><span class="hash-cell" title="${escapeHtml(ag.hash)}">${escapeHtml(ag.hash.substring(0, 14))}...</span></td>
        <td>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" onclick="viewAgreementModal('${escapeHtml(ag.agreementId)}')">View</button>
            ${ag.status === 'Active' ? `
              <button class="btn btn-success btn-sm" onclick="completeAgreement('${escapeHtml(ag.agreementId)}')">Complete</button>
              <button class="btn btn-outline btn-sm" onclick="cancelAgreement('${escapeHtml(ag.agreementId)}')">Cancel</button>
            ` : `
              <button class="btn btn-outline btn-sm" disabled style="opacity:0.5; cursor:not-allowed;">Locked</button>
            `}
            <button class="btn btn-secondary btn-sm" onclick="runVerifyForId('${escapeHtml(ag.agreementId)}')">Verify</button>
          </div>
        </td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
}

function renderBlockchainLedger() {
  const chainContainer = document.getElementById('blockchainLedgerContainer');
  if (!chainContainer) return;

  let html = '';

  blockchain.forEach((block, idx) => {
    const isGenesis = block.isGenesis;
    const isTampered = isTamperedDemo && (tamperedBlockIndex === idx);

    let cardClasses = 'block-card';
    if (isGenesis) cardClasses += ' genesis';
    if (isTampered) cardClasses += ' tampered-block';

    let dataSectionHtml = '';
    if (isGenesis) {
      dataSectionHtml = `
        <div class="block-detail-item" style="grid-column: span 2;">
          <div class="detail-label">Block Payload Data</div>
          <div class="detail-value data-box font-mono" style="background:#fcfaff; border-color:#e9d5ff;">
            "${escapeHtml(block.data)}"
          </div>
        </div>
        <div class="genesis-explanation-box" style="grid-column: span 2;">
          <span>ℹ️ <strong>Genesis Block Note:</strong> The Genesis Block is the first block in a blockchain. It has no previous block, so its previous hash is set to 0.</span>
        </div>
      `;
    } else {
      const d = block.data || {};
      let statusPill = d.status === 'Completed' 
        ? '<span class="badge badge-completed">Completed</span>' 
        : (d.status === 'Cancelled' ? '<span class="badge badge-cancelled">Cancelled</span>' : '<span class="badge badge-active">Active</span>');

      dataSectionHtml = `
        <div class="block-detail-item">
          <div class="detail-label">Agreement ID & Title</div>
          <div class="detail-value"><strong>${escapeHtml(d.agreementId || 'N/A')}</strong> – ${escapeHtml(d.title || '')}</div>
        </div>
        <div class="block-detail-item">
          <div class="detail-label">Contract Amount & Status</div>
          <div class="detail-value"><strong>${escapeHtml(d.amount || '')}</strong> &nbsp;${statusPill}</div>
        </div>
        <div class="block-detail-item">
          <div class="detail-label">Party A (Initiator)</div>
          <div class="detail-value">${escapeHtml(d.partyA || '')}</div>
        </div>
        <div class="block-detail-item">
          <div class="detail-label">Party B (Counterparty)</div>
          <div class="detail-value">${escapeHtml(d.partyB || '')}</div>
        </div>
      `;
    }

    html += `
      <div class="${cardClasses}" id="block-card-${idx}">
        <div class="block-header">
          <div class="block-title-group">
            <span class="block-index-badge">${isGenesis ? 'GENESIS BLOCK' : 'BLOCK #' + block.index}</span>
            <span style="font-size:14px; font-weight:700; color:var(--text-main);">
              ${isGenesis ? 'Root Anchor of Blockchain' : 'Smart Contract Agreement Block'}
            </span>
          </div>
          <div class="block-timestamp">
            🕒 Timestamp: <span class="font-mono">${escapeHtml(block.timestamp)}</span>
          </div>
        </div>

        <div class="block-grid">
          ${dataSectionHtml}
        </div>

        <div class="hash-group">
          <div class="hash-row prev-hash">
            <div class="hash-label">
              <span>Previous Block Hash (Link):</span>
              ${block.previousHash === "0" ? '<span style="color:#7e22ce;">GENESIS ROOT (0)</span>' : '<span>SHA-256 Link</span>'}
            </div>
            <div class="hash-value">${escapeHtml(block.previousHash)}</div>
          </div>

          <div class="hash-row">
            <div class="hash-label">
              <span>Block Hash (Current Block SHA-256):</span>
              ${isTampered ? '<span style="color:var(--danger-accent); font-weight:bold;">TAMPERED MISMATCH</span>' : '<span style="color:var(--success-text);">Calculated & Signed</span>'}
            </div>
            <div class="hash-value">${escapeHtml(block.hash)}</div>
          </div>
        </div>
      </div>
    `;

    // Connector arrow if not the last block
    if (idx < blockchain.length - 1) {
      html += `
        <div class="chain-connector">
          <div class="connector-line"></div>
          <div class="connector-arrow">↓</div>
          <div class="connector-line"></div>
        </div>
      `;
    }
  });

  chainContainer.innerHTML = html;
}

function populateVerifyDropdown() {
  const select = document.getElementById('verifySelectId');
  if (!select) return;

  const currentVal = select.value;
  let options = '<option value="">-- Or select an agreement to verify --</option>';
  agreements.forEach(ag => {
    options += `<option value="${escapeHtml(ag.agreementId)}">${escapeHtml(ag.agreementId)} (${escapeHtml(ag.partyA)} & ${escapeHtml(ag.partyB)})</option>`;
  });
  select.innerHTML = options;
  if (currentVal) select.value = currentVal;
}

function runVerifyForId(id) {
  const searchInput = document.getElementById('verifySearchInput');
  if (searchInput) searchInput.value = id;
  handleAgreementVerifySubmit();
  
  // Smooth scroll to verify section
  const verifySec = document.getElementById('verifyAgreementSection');
  if (verifySec) {
    verifySec.scrollIntoView({ behavior: 'smooth' });
  }
}

async function handleAgreementVerifySubmit() {
  const searchInput = document.getElementById('verifySearchInput');
  const resultBox = document.getElementById('verifyResultBox');

  if (!searchInput || !resultBox) return;

  const id = searchInput.value.trim();
  if (!id) {
    showToast('Please enter an Agreement ID to verify.', 'error');
    return;
  }

  const result = await verifyAgreement(id);

  resultBox.className = 'verify-result show ' + (result.verified ? 'success' : 'fail');

  if (!result.found) {
    resultBox.innerHTML = `
      <div style="font-weight:700; font-size:14px; margin-bottom:4px;">❌ Agreement Not Found</div>
      <p>${escapeHtml(result.message)}</p>
    `;
    return;
  }

  const ag = result.agreement;
  resultBox.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
      <div style="font-size:15px; font-weight:700;">
        ${result.verified ? '✅ Agreement Verified & Authentic' : '⚠️ Cryptographic Verification Failed!'}
      </div>
      <span class="badge ${ag.status === 'Active' ? 'badge-active' : (ag.status === 'Completed' ? 'badge-completed' : 'badge-cancelled')}">${escapeHtml(ag.status)}</span>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:12.5px; margin-bottom:12px;">
      <div><strong>Agreement ID:</strong> ${escapeHtml(ag.agreementId)}</div>
      <div><strong>Block Number:</strong> Block #${ag.blockNumber}</div>
      <div><strong>Party A:</strong> ${escapeHtml(ag.partyA)}</div>
      <div><strong>Party B:</strong> ${escapeHtml(ag.partyB)}</div>
      <div><strong>Contract Amount:</strong> ${escapeHtml(ag.amount)}</div>
      <div><strong>Agreement Title:</strong> ${escapeHtml(ag.title)}</div>
    </div>

    <div style="background:rgba(255,255,255,0.7); border-radius:6px; padding:10px; font-size:11.5px; margin-top:8px;">
      <div style="margin-bottom:4px;"><strong>Stored SHA-256 Hash:</strong> <span class="font-mono">${escapeHtml(result.storedHash)}</span></div>
      <div style="margin-bottom:4px;"><strong>Calculated Hash:</strong> <span class="font-mono">${escapeHtml(result.calculatedHash)}</span></div>
      <div><strong>Hash Match:</strong> ${result.hashMatches ? '✓ Exact Match' : '✗ Hash Mismatch (Tampered)'}</div>
      <div><strong>Previous Link:</strong> ${result.linkValid ? '✓ Valid Chain Link' : '✗ Broken Link to Previous Block'}</div>
    </div>

    <div style="margin-top:10px; font-size:12.5px; font-weight:600;">
      ${escapeHtml(result.message)}
    </div>
  `;
}

// Modal View Agreement
function viewAgreementModal(id) {
  const ag = agreements.find(a => a.agreementId === id);
  if (!ag) return;

  const modalOverlay = document.getElementById('agreementModalOverlay');
  const modalBody = document.getElementById('modalContentBody');

  if (!modalOverlay || !modalBody) return;

  modalBody.innerHTML = `
    <div class="contract-seal">📜</div>
    <div class="modal-header">
      <h2>Smart Contract Agreement Specification</h2>
      <p style="font-size:13px; color:var(--text-secondary);">Decentralized Cryptographic Record • Block #${ag.blockNumber}</p>
    </div>

    <div class="modal-details-grid">
      <div class="block-detail-item">
        <div class="detail-label">Agreement Identifier</div>
        <div class="detail-value"><strong>${escapeHtml(ag.agreementId)}</strong></div>
      </div>
      <div class="block-detail-item">
        <div class="detail-label">Current Status</div>
        <div class="detail-value">
          <span class="badge ${ag.status === 'Active' ? 'badge-active' : (ag.status === 'Completed' ? 'badge-completed' : 'badge-cancelled')}">${escapeHtml(ag.status)}</span>
        </div>
      </div>
      <div class="block-detail-item">
        <div class="detail-label">Party A (First Party)</div>
        <div class="detail-value"><strong>${escapeHtml(ag.partyA)}</strong></div>
      </div>
      <div class="block-detail-item">
        <div class="detail-label">Party B (Second Party)</div>
        <div class="detail-value"><strong>${escapeHtml(ag.partyB)}</strong></div>
      </div>
      <div class="block-detail-item">
        <div class="detail-label">Contract Amount</div>
        <div class="detail-value"><strong>${escapeHtml(ag.amount)}</strong></div>
      </div>
      <div class="block-detail-item">
        <div class="detail-label">Validity Period</div>
        <div class="detail-value">${escapeHtml(ag.startDate)} to ${escapeHtml(ag.endDate)}</div>
      </div>
    </div>

    <div style="margin-bottom:16px;">
      <div class="detail-label" style="margin-bottom:4px;">Agreement Title</div>
      <div style="font-size:14px; font-weight:600; color:var(--text-main);">${escapeHtml(ag.title)}</div>
    </div>

    <div style="margin-bottom:16px;">
      <div class="detail-label" style="margin-bottom:4px;">Terms & Description</div>
      <div class="detail-value data-box" style="white-space:pre-wrap;">${escapeHtml(ag.description)}</div>
    </div>

    <div class="hash-group">
      <div class="hash-row">
        <div class="hash-label">Blockchain Block Assignment</div>
        <div style="font-size:12px; color:var(--text-main);">Block Index #${ag.blockNumber} &bull; Mined at ${escapeHtml(ag.createdAt)}</div>
      </div>
      <div class="hash-row">
        <div class="hash-label">Cryptographic SHA-256 Seal</div>
        <div class="hash-value">${escapeHtml(ag.hash)}</div>
      </div>
    </div>

    <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:24px;">
      <button class="btn btn-secondary" onclick="closeAgreementModal()">Close</button>
      <button class="btn btn-primary" onclick="closeAgreementModal(); runVerifyForId('${escapeHtml(ag.agreementId)}')">Verify Cryptographic Integrity</button>
    </div>
  `;

  modalOverlay.classList.add('active');
}

function closeAgreementModal() {
  const modalOverlay = document.getElementById('agreementModalOverlay');
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
  }
}

// Toast Notification
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'success' ? 'toast-success' : (type === 'error' ? 'toast-error' : '')}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✓';
  if (type === 'error') icon = '⚠️';

  toast.innerHTML = `<span style="font-weight:bold;">${icon}</span> <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 4000);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================
// 5. Event Listeners & Initialization
// ==========================================

window.addEventListener('DOMContentLoaded', () => {
  initBlockchain();

  // Create Agreement Form Handler
  const form = document.getElementById('createAgreementForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const agreementId = document.getElementById('agreementId').value.trim();
      const partyA = document.getElementById('partyA').value.trim();
      const partyB = document.getElementById('partyB').value.trim();
      const title = document.getElementById('agreementTitle').value.trim();
      const description = document.getElementById('agreementDesc').value.trim();
      const amount = document.getElementById('contractAmount').value.trim();
      const startDate = document.getElementById('startDate').value;
      const endDate = document.getElementById('endDate').value;

      if (!agreementId || !partyA || !partyB || !title || !amount || !startDate || !endDate) {
        showToast('Please fill in all required fields.', 'error');
        return;
      }

      try {
        const newRecord = await createAgreement({
          agreementId,
          partyA,
          partyB,
          title,
          description,
          amount,
          startDate,
          endDate
        });

        showToast(`Agreement "${newRecord.agreementId}" created and recorded in Block #${newRecord.blockNumber}!`, 'success');
        
        // Reset form & generate next ID
        form.reset();
        initFormDates();

        // Scroll to the new block
        setTimeout(() => {
          const newBlockEl = document.getElementById(`block-card-${newRecord.blockNumber}`);
          if (newBlockEl) {
            newBlockEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            newBlockEl.style.transition = 'background-color 0.5s';
            newBlockEl.style.backgroundColor = '#f3edfc';
            setTimeout(() => {
              newBlockEl.style.backgroundColor = '';
            }, 1500);
          }
        }, 100);

      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Verify Blockchain Button
  const verifyChainBtn = document.getElementById('verifyBlockchainBtn');
  if (verifyChainBtn) {
    verifyChainBtn.addEventListener('click', async () => {
      const res = await verifyBlockchain();
      updateStatusBanner(res);
      if (res.isValid) {
        showToast(`Blockchain verification passed! All ${blockchain.length} blocks are cryptographically valid.`, 'success');
      } else {
        showToast(`Verification FAILED: ${res.errorDetails}`, 'error');
      }
    });
  }

  // Demo Tampering Button
  const demoTamperBtn = document.getElementById('demoTamperBtn');
  if (demoTamperBtn) {
    demoTamperBtn.addEventListener('click', () => {
      demoTampering();
    });
  }

  // Reset Blockchain Button
  const resetChainBtn = document.getElementById('resetBlockchainBtn');
  if (resetChainBtn) {
    resetChainBtn.addEventListener('click', () => {
      resetBlockchain();
    });
  }

  // Load Sample Agreements Button
  const loadSamplesBtn = document.getElementById('loadSamplesBtn');
  if (loadSamplesBtn) {
    loadSamplesBtn.addEventListener('click', () => {
      loadSampleAgreements();
    });
  }

  // Reset to Genesis Only Button
  const resetGenesisBtn = document.getElementById('resetGenesisBtn');
  if (resetGenesisBtn) {
    resetGenesisBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset the blockchain to Genesis Block #0 only? All user agreements will be removed.')) {
        resetToGenesisOnly();
      }
    });
  }

  // Agreement Verify Search Button
  const verifySearchBtn = document.getElementById('verifySearchBtn');
  if (verifySearchBtn) {
    verifySearchBtn.addEventListener('click', () => {
      handleAgreementVerifySubmit();
    });
  }

  const verifySelect = document.getElementById('verifySelectId');
  if (verifySelect) {
    verifySelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val) {
        const searchInput = document.getElementById('verifySearchInput');
        if (searchInput) searchInput.value = val;
        handleAgreementVerifySubmit();
      }
    });
  }

  // Modal Close on backdrop click
  const modalOverlay = document.getElementById('agreementModalOverlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeAgreementModal();
      }
    });
  }
});

// Expose functions globally for inline onclick handlers in table
window.viewAgreementModal = viewAgreementModal;
window.closeAgreementModal = closeAgreementModal;
window.completeAgreement = completeAgreement;
window.cancelAgreement = cancelAgreement;
window.activateAgreement = activateAgreement;
window.runVerifyForId = runVerifyForId;
window.demoTampering = demoTampering;
window.resetBlockchain = resetBlockchain;
