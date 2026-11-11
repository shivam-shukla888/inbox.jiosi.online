// JIOSI Inbox — Chrome Side Panel Companion Script
// Connects to JIOSI Backend API with workspace context and zero local secrets

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Config State
  const DEFAULT_BACKEND_URL = 'https://jiosi-inbox-api.onrender.com';
  let backendUrl = DEFAULT_BACKEND_URL;
  let workspaceId = '';
  let activeProfile = 'generic';
  let sessionAuthToken = null;

  // Active View State
  let currentThreadId = null;
  let currentThreadData = null;
  let activeTabName = 'thread';

  // DOM Elements
  const tabThread = document.getElementById('tabThread');
  const tabBrief = document.getElementById('tabBrief');
  const tabCommitments = document.getElementById('tabCommitments');
  const viewThread = document.getElementById('viewThread');
  const viewBrief = document.getElementById('viewBrief');
  const viewCommitments = document.getElementById('viewCommitments');
  const configToggleBtn = document.getElementById('configToggleBtn');
  const settingsPanel = document.getElementById('settingsPanel');
  const connectionDot = document.getElementById('connectionDot');
  const profileBadge = document.getElementById('profileBadge');

  // Config fields
  const backendUrlInput = document.getElementById('backendUrl');
  const sessionTokenInput = document.getElementById('sessionToken');
  const workspaceIdInput = document.getElementById('workspaceId');
  const profileSelect = document.getElementById('profileSelect');
  const saveConfigBtn = document.getElementById('saveConfigBtn');
  const closeConfigBtn = document.getElementById('closeConfigBtn');

  // Thread view elements
  const threadSearchInput = document.getElementById('threadSearchInput');
  const refreshThreadBtn = document.getElementById('refreshThreadBtn');
  const threadLoadingSpinner = document.getElementById('threadLoadingSpinner');
  const threadEmptyState = document.getElementById('threadEmptyState');
  const recentThreadsList = document.getElementById('recentThreadsList');
  const threadContent = document.getElementById('threadContent');
  const threadSubject = document.getElementById('threadSubject');
  const threadSender = document.getElementById('threadSender');
  const threadDate = document.getElementById('threadDate');

  const importanceBadge = document.getElementById('importanceBadge');
  const urgencyBadge = document.getElementById('urgencyBadge');
  const categoryBadge = document.getElementById('categoryBadge');
  const whoOwesBadge = document.getElementById('whoOwesBadge');

  const takeawayGist = document.getElementById('takeawayGist');
  const takeawayQuestion = document.getElementById('takeawayQuestion');
  const takeawayDeadline = document.getElementById('takeawayDeadline');
  const takeawayNextAction = document.getElementById('takeawayNextAction');
  const commitmentsList = document.getElementById('commitmentsList');
  const syncCommitmentsBtn = document.getElementById('syncCommitmentsBtn');

  const draftTone = document.getElementById('draftTone');
  const draftLanguage = document.getElementById('draftLanguage');
  const generateDraftBtn = document.getElementById('generateDraftBtn');
  const draftResultArea = document.getElementById('draftResultArea');
  const draftText = document.getElementById('draftText');
  const copyDraftBtn = document.getElementById('copyDraftBtn');

  const btnNotSpam = document.getElementById('btnNotSpam');
  const btnMarkSuspicious = document.getElementById('btnMarkSuspicious');
  const btnMarkImportant = document.getElementById('btnMarkImportant');

  // Daily Brief elements
  const refreshBriefBtn = document.getElementById('refreshBriefBtn');
  const briefLoading = document.getElementById('briefLoading');
  const briefSummaryText = document.getElementById('briefSummaryText');
  const itemsNeedsYouToday = document.getElementById('itemsNeedsYouToday');
  const itemsWaiting = document.getElementById('itemsWaiting');
  const itemsPromises = document.getElementById('itemsPromises');
  const itemsImportant = document.getElementById('itemsImportant');
  const itemsNewsletters = document.getElementById('itemsNewsletters');
  const itemsSpam = document.getElementById('itemsSpam');

  // Tracker elements
  const allCommitmentsList = document.getElementById('allCommitmentsList');
  const filterChips = document.querySelectorAll('.filter-chip');

  // Toast
  const toast = document.getElementById('toast');

  // -------------------------------------------------------------
  // URL VALIDATION & HELPERS
  // -------------------------------------------------------------
  function validateBackendUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') {
      throw new Error('Backend URL cannot be empty.');
    }
    const trimmed = rawUrl.trim().replace(/\/+$/, '');
    let parsed;
    try {
      parsed = new URL(trimmed);
    } catch (e) {
      throw new Error('Invalid URL format for Backend API.');
    }

    // Reject embedded user/password credentials
    if (parsed.username || parsed.password) {
      throw new Error('Backend URL must not contain embedded username or password credentials.');
    }

    // Reject unsafe schemes
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error('Unsafe protocol: only HTTPS (or HTTP for localhost) is permitted.');
    }

    // Require HTTPS in production; allow HTTP only for localhost/127.0.0.1
    const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    if (parsed.protocol === 'http:' && !isLocal) {
      throw new Error('HTTPS is required for production backend URLs. HTTP is only permitted on localhost.');
    }

    // Reject empty host
    if (!parsed.hostname || parsed.hostname.length < 3) {
      throw new Error('Invalid host in Backend URL.');
    }

    return trimmed;
  }

  // -------------------------------------------------------------
  // INITIALIZATION & CONFIG
  // -------------------------------------------------------------
  function init() {
    loadStoredConfig(() => {
      setupEventListeners();
      checkBackendHealth();
      detectCurrentGmailThread();
      loadRecentThreads();
    });
  }

  function loadStoredConfig(callback) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      if (chrome.storage.local) {
        chrome.storage.local.get(['jiosiBackendUrl', 'jiosiWorkspaceId', 'jiosiProfile'], (res) => {
          if (res && res.jiosiBackendUrl) {
            try {
              backendUrl = validateBackendUrl(res.jiosiBackendUrl);
            } catch (e) {
              backendUrl = DEFAULT_BACKEND_URL;
            }
          } else {
            backendUrl = DEFAULT_BACKEND_URL;
          }
          if (res && res.jiosiWorkspaceId) workspaceId = res.jiosiWorkspaceId;
          if (res && res.jiosiProfile) activeProfile = res.jiosiProfile;

          if (backendUrlInput) backendUrlInput.value = backendUrl;
          if (workspaceIdInput) workspaceIdInput.value = workspaceId;
          if (profileSelect) profileSelect.value = activeProfile;
          updateProfileBadge();

          // Ensure any legacy plaintext tokens are purged from local storage
          chrome.storage.local.remove(['jiosiSessionToken', 'authToken', 'token']);
        });
      }

      // Load session token strictly from in-memory session storage (never from local storage)
      if (chrome.storage.session) {
        chrome.storage.session.get(['jiosiSessionToken'], (res) => {
          if (res && res.jiosiSessionToken) {
            sessionAuthToken = res.jiosiSessionToken;
            if (sessionTokenInput) sessionTokenInput.value = sessionAuthToken;
          }
          if (callback) callback();
        });
      } else {
        if (callback) callback();
      }
    } else {
      if (callback) callback();
    }
  }

  function saveConfig() {
    let validatedUrl;
    try {
      validatedUrl = validateBackendUrl(backendUrlInput ? backendUrlInput.value : '');
    } catch (err) {
      showToast('Error: ' + err.message);
      return;
    }

    backendUrl = validatedUrl;
    if (backendUrlInput) backendUrlInput.value = backendUrl;
    workspaceId = workspaceIdInput ? workspaceIdInput.value.trim() : '';
    activeProfile = profileSelect ? profileSelect.value : 'generic';
    const tokenVal = sessionTokenInput ? sessionTokenInput.value.trim() : '';

    if (typeof chrome !== 'undefined' && chrome.storage) {
      if (chrome.storage.local) {
        chrome.storage.local.set({
          jiosiBackendUrl: backendUrl,
          jiosiWorkspaceId: workspaceId,
          jiosiProfile: activeProfile
        }, () => {
          // Never persist session tokens in plaintext local storage
          chrome.storage.local.remove(['jiosiSessionToken', 'authToken', 'token']);
        });
      }

      if (chrome.storage.session) {
        sessionAuthToken = tokenVal || null;
        if (sessionAuthToken) {
          chrome.storage.session.set({ jiosiSessionToken: sessionAuthToken }, () => {
            showToast('Settings saved (session token stored in-memory)');
            if (settingsPanel) settingsPanel.classList.add('hidden');
            updateProfileBadge();
            checkBackendHealth();
          });
        } else {
          chrome.storage.session.remove(['jiosiSessionToken'], () => {
            showToast('Settings saved');
            if (settingsPanel) settingsPanel.classList.add('hidden');
            updateProfileBadge();
            checkBackendHealth();
          });
        }
      } else {
        sessionAuthToken = tokenVal || null;
        showToast('Settings saved');
        if (settingsPanel) settingsPanel.classList.add('hidden');
        updateProfileBadge();
        checkBackendHealth();
      }
    } else {
      sessionAuthToken = tokenVal || null;
      showToast('Settings saved');
      if (settingsPanel) settingsPanel.classList.add('hidden');
      updateProfileBadge();
    }
  }

  function updateProfileBadge() {
    const labels = {
      generic: 'Small Business',
      freelancer_agency: 'Freelancer/Agency',
      local_service: 'Local Service',
      retail_ecommerce: 'Retail/E-com',
      professional_services: 'Pro Services',
      small_saas: 'Small SaaS'
    };
    if (profileBadge) profileBadge.textContent = labels[activeProfile] || 'Small Business';
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 2800);
  }

  // -------------------------------------------------------------
  // API HELPERS
  // -------------------------------------------------------------
  async function apiFetch(endpoint, options = {}) {
    const url = `${backendUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(workspaceId ? { 'X-Workspace-Id': workspaceId } : {}),
      ...(sessionAuthToken ? { 'Authorization': `Bearer ${sessionAuthToken}` } : {}),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include' // include session cookies
      });

      if (response.status === 401) {
        setConnectionState(false, 'Unauthorized');
        throw new Error('Authentication required. Please sign in to JIOSI Inbox or update your Companion Session Token in settings.');
      }

      if (response.status === 403) {
        setConnectionState(false, 'Forbidden');
        throw new Error('Access denied to workspace. Please check your Workspace ID in settings.');
      }

      const json = await response.json();
      setConnectionState(true);
      return json.data !== undefined ? json.data : json;
    } catch (err) {
      setConnectionState(false, err.message);
      throw err;
    }
  }

  function setConnectionState(isConnected, statusText = '') {
    if (isConnected) {
      connectionDot.classList.remove('disconnected');
      connectionDot.title = 'JIOSI API Connected';
    } else {
      connectionDot.classList.add('disconnected');
      connectionDot.title = `Disconnected: ${statusText}`;
    }
  }

  async function checkBackendHealth() {
    try {
      const me = await apiFetch('/api/v1/auth/me');
      if (me && me.defaultWorkspaceId && !workspaceId) {
        workspaceId = me.defaultWorkspaceId;
        workspaceIdInput.value = workspaceId;
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ jiosiWorkspaceId: workspaceId });
        }
      }
      setConnectionState(true);
    } catch (e) {
      setConnectionState(false, 'Offline or Unauthenticated');
    }
  }

  // -------------------------------------------------------------
  // EVENT LISTENERS
  // -------------------------------------------------------------
  function setupEventListeners() {
    // Navigation Tabs
    tabThread.addEventListener('click', () => switchTab('thread'));
    tabBrief.addEventListener('click', () => {
      switchTab('brief');
      loadDailyBrief();
    });
    tabCommitments.addEventListener('click', () => {
      switchTab('commitments');
      loadAllCommitments('all');
    });

    // Settings Toggle
    configToggleBtn.addEventListener('click', () => {
      settingsPanel.classList.toggle('hidden');
    });
    closeConfigBtn.addEventListener('click', () => settingsPanel.classList.add('hidden'));
    saveConfigBtn.addEventListener('click', saveConfig);

    // Thread View
    refreshThreadBtn.addEventListener('click', detectCurrentGmailThread);
    threadSearchInput.addEventListener('input', (e) => filterRecentThreads(e.target.value));

    // Commitments & Draft
    syncCommitmentsBtn.addEventListener('click', syncThreadCommitments);
    generateDraftBtn.addEventListener('click', generateReplyDraft);
    copyDraftBtn.addEventListener('click', copyDraftToClipboard);

    // Feedback
    btnNotSpam.addEventListener('click', () => submitTriageCorrection('legitimate', 'User confirmed not spam'));
    btnMarkSuspicious.addEventListener('click', () => submitTriageCorrection('suspicious', 'User marked as suspicious candidate'));
    btnMarkImportant.addEventListener('click', () => submitTriageCorrection('primary', 'User prioritized as important'));

    // Daily Brief
    refreshBriefBtn.addEventListener('click', () => loadDailyBrief(true));

    // Tracker Filter
    filterChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        filterChips.forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        loadAllCommitments(e.target.dataset.actor);
      });
    });
  }

  function switchTab(tab) {
    activeTabName = tab;
    tabThread.classList.toggle('active', tab === 'thread');
    tabBrief.classList.toggle('active', tab === 'brief');
    tabCommitments.classList.toggle('active', tab === 'commitments');

    viewThread.classList.toggle('active', tab === 'thread');
    viewBrief.classList.toggle('active', tab === 'brief');
    viewCommitments.classList.toggle('active', tab === 'commitments');
  }

  // -------------------------------------------------------------
  // GMAIL URL DETECTION
  // -------------------------------------------------------------
  function detectCurrentGmailThread() {
    if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.query) {
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs || tabs.length === 0) return;
      const url = tabs[0].url || '';

      if (!url.includes('mail.google.com')) {
        return;
      }

      // Gmail URL formats:
      // https://mail.google.com/mail/u/0/#inbox/FMfcgz...
      // https://mail.google.com/mail/u/0/#all/18c5...
      const match = url.match(/#(?:[a-zA-Z0-9_\-]+)\/([a-zA-Z0-9_\-]+)/);
      if (match && match[1]) {
        const externalThreadId = match[1];
        try {
          threadLoadingSpinner.classList.remove('hidden');
          threadEmptyState.classList.add('hidden');
          const thread = await apiFetch(`/api/v1/threads/by-external/${externalThreadId}`);
          if (thread && thread.id) {
            loadThreadDetails(thread.id);
          }
        } catch (e) {
          threadLoadingSpinner.classList.add('hidden');
          threadEmptyState.classList.remove('hidden');
          showToast('Thread not synced in JIOSI yet. Sync in JIOSI Inbox.');
        }
      }
    });
  }

  // -------------------------------------------------------------
  // THREAD VIEW & ANALYSIS
  // -------------------------------------------------------------
  async function loadRecentThreads() {
    try {
      const paged = await apiFetch('/api/v1/threads?folder=inbox&size=10');
      const threads = paged.content || [];
      renderRecentThreads(threads);
    } catch (e) {
      console.warn('Could not load recent threads:', e);
    }
  }

  function renderRecentThreads(threads) {
    recentThreadsList.innerHTML = '';
    if (threads.length === 0) {
      recentThreadsList.innerHTML = '<p class="text-muted">No synced threads found. Connect Gmail in JIOSI.</p>';
      return;
    }

    threads.forEach(t => {
      const item = document.createElement('div');
      item.className = 'recent-thread-item';
      item.innerHTML = `
        <strong>${escapeHtml(t.sender ? t.sender.name : 'Unknown')}</strong> — ${escapeHtml(t.subject || 'No Subject')}
        <div class="text-muted" style="font-size:10.5px">${escapeHtml(t.snippet || '')}</div>
      `;
      item.addEventListener('click', () => loadThreadDetails(t.id));
      recentThreadsList.appendChild(item);
    });
  }

  function filterRecentThreads(query) {
    const items = recentThreadsList.querySelectorAll('.recent-thread-item');
    const q = query.toLowerCase();
    items.forEach(el => {
      const text = el.textContent.toLowerCase();
      el.style.display = text.includes(q) ? 'block' : 'none';
    });
  }

  async function loadThreadDetails(threadId) {
    currentThreadId = threadId;
    threadLoadingSpinner.classList.remove('hidden');
    threadEmptyState.classList.add('hidden');
    threadContent.classList.add('hidden');

    try {
      // 1. Thread Detail
      const thread = await apiFetch(`/api/v1/threads/${threadId}`);
      currentThreadData = thread;

      threadSubject.textContent = thread.subject || '(No Subject)';
      threadSender.textContent = `${thread.sender ? thread.sender.name : 'Sender'} <${thread.sender ? thread.sender.email : ''}>`;
      threadDate.textContent = thread.timestamp || '';

      // 2. Fetch Triage & Scores
      const triage = await apiFetch(`/api/v1/ai/threads/${threadId}/triage`, { method: 'POST' });
      renderTriageBadges(triage);

      // 3. Fetch Summary
      const summary = await apiFetch(`/api/v1/ai/threads/${threadId}/summary`, { method: 'POST' });
      renderTakeaways(summary);

      // 4. Fetch Commitments
      const commitments = await apiFetch(`/api/v1/ai/threads/${threadId}/commitments`);
      renderCommitments(commitments);

      threadLoadingSpinner.classList.add('hidden');
      threadContent.classList.remove('hidden');
    } catch (e) {
      threadLoadingSpinner.classList.add('hidden');
      threadEmptyState.classList.remove('hidden');
      showToast(`Error: ${e.message}`);
    }
  }

  function renderTriageBadges(triage) {
    importanceBadge.textContent = `Importance ${triage.importanceScore}/100`;
    importanceBadge.title = triage.importanceReason || 'Explainable importance';

    urgencyBadge.textContent = `Urgency ${triage.urgencyScore}/100`;
    urgencyBadge.title = triage.urgencyReason || 'Explainable urgency';

    categoryBadge.textContent = triage.category.toUpperCase();

    if (triage.needsReply) {
      whoOwesBadge.textContent = 'YOU OWE REPLY';
      whoOwesBadge.className = 'badge badge-who-owes actor-user';
    } else {
      whoOwesBadge.textContent = 'WAITING / NO ACTION';
      whoOwesBadge.className = 'badge badge-who-owes actor-other';
    }
  }

  function renderTakeaways(summary) {
    takeawayGist.textContent = summary.gist || 'No summary available.';
    takeawayQuestion.textContent = summary.openQuestion || 'None detected';
    takeawayDeadline.textContent = summary.explicitDeadline || 'No explicit deadline';
    takeawayNextAction.textContent = summary.suggestedNextAction || 'Review thread details';
  }

  function renderCommitments(commitments) {
    commitmentsList.innerHTML = '';
    if (!commitments || commitments.length === 0) {
      commitmentsList.innerHTML = '<p class="text-muted">No explicit commitments detected yet. Click "Sync" to analyze obligations.</p>';
      return;
    }

    commitments.forEach(c => {
      const item = document.createElement('div');
      item.className = 'commitment-item';

      const actorLabel = c.actor === 'user' ? 'You Promised' : (c.actor === 'other' ? 'Counterpart Promised' : 'Obligation');
      const actorClass = c.actor === 'user' ? 'actor-user' : 'actor-other';
      const isDone = c.effectiveStatus === 'done';

      item.innerHTML = `
        <div class="commitment-header">
          <span class="commitment-actor ${actorClass}">${actorLabel}</span>
          <button class="btn btn-xs ${isDone ? 'btn-secondary' : 'btn-outline'}" data-id="${c.id}" data-status="${isDone ? 'open' : 'done'}">
            ${isDone ? '✓ Completed' : 'Mark Done'}
          </button>
        </div>
        <div style="font-weight:500">${escapeHtml(c.action)}</div>
        ${c.dueDate ? `<div class="text-deadline">Due: ${formatDateStr(c.dueDate)}</div>` : ''}
        ${c.evidenceQuote ? `<div class="commitment-quote">"${escapeHtml(c.evidenceQuote)}"</div>` : ''}
      `;

      item.querySelector('button').addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const newStatus = e.target.dataset.status;
        await updateCommitmentStatus(id, newStatus);
      });

      commitmentsList.appendChild(item);
    });
  }

  async function syncThreadCommitments() {
    if (!currentThreadId) return;
    try {
      showToast('Extracting commitments with Groq AI...');
      const list = await apiFetch(`/api/v1/ai/threads/${currentThreadId}/commitments/sync`, { method: 'POST' });
      renderCommitments(list);
      showToast('Commitments synchronized');
    } catch (e) {
      showToast(`Sync failed: ${e.message}`);
    }
  }

  async function updateCommitmentStatus(id, newStatus) {
    try {
      await apiFetch(`/api/v1/ai/commitments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, auditNote: `Updated in Side Panel to ${newStatus}` })
      });
      showToast(`Commitment marked as ${newStatus}`);
      // Refresh list
      const list = await apiFetch(`/api/v1/ai/threads/${currentThreadId}/commitments`);
      renderCommitments(list);
    } catch (e) {
      showToast(`Update error: ${e.message}`);
    }
  }

  // -------------------------------------------------------------
  // REPLY DRAFTING
  // -------------------------------------------------------------
  async function generateReplyDraft() {
    if (!currentThreadId) return;
    generateDraftBtn.disabled = true;
    generateDraftBtn.textContent = 'Generating draft with Groq...';

    try {
      const tone = draftTone.value;
      const language = draftLanguage.value;
      const res = await apiFetch(`/api/v1/ai/threads/${currentThreadId}/reply-draft`, {
        method: 'POST',
        body: JSON.stringify({ tone, language, customInstructions: '' })
      });

      draftText.value = res.draftText || '';
      draftResultArea.classList.remove('hidden');
    } catch (e) {
      showToast(`Draft error: ${e.message}`);
    } finally {
      generateDraftBtn.disabled = false;
      generateDraftBtn.textContent = 'Generate Reply Draft';
    }
  }

  function copyDraftToClipboard() {
    const text = draftText.value;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      showToast('✓ Draft copied to clipboard! Paste in Gmail compose.');
    }).catch(() => {
      showToast('Could not copy automatically. Select text manually.');
    });
  }

  // -------------------------------------------------------------
  // TRIAGE CORRECTION
  // -------------------------------------------------------------
  async function submitTriageCorrection(category, note) {
    if (!currentThreadId) return;
    try {
      await apiFetch(`/api/v1/ai/threads/${currentThreadId}/triage/correction`, {
        method: 'POST',
        body: JSON.stringify({ correctedCategory: category, feedbackNotes: note })
      });
      showToast(`Updated JIOSI classification: ${category}`);
      categoryBadge.textContent = category.toUpperCase();
    } catch (e) {
      showToast(`Feedback error: ${e.message}`);
    }
  }

  // -------------------------------------------------------------
  // DAILY BRIEF
  // -------------------------------------------------------------
  async function loadDailyBrief(forceRefresh = false) {
    briefLoading.classList.remove('hidden');
    try {
      const brief = await apiFetch(`/api/v1/ai/daily-brief?forceRefresh=${forceRefresh}`);
      renderDailyBrief(brief);
    } catch (e) {
      briefSummaryText.textContent = `Error loading brief: ${e.message}`;
    } finally {
      briefLoading.classList.add('hidden');
    }
  }

  function renderDailyBrief(brief) {
    briefSummaryText.textContent = brief.summaryMessage || 'Daily Business Overview';

    renderBriefSection(itemsNeedsYouToday, brief.needsYouToday, 'Needs action today');
    renderBriefSection(itemsWaiting, brief.waitingOnSomeoneElse, 'Waiting on response');
    renderBriefSection(itemsPromises, brief.promisesYouMade, 'Promise made by you');
    renderBriefSection(itemsImportant, brief.importantNotUrgent, 'Important background');
    renderBriefSection(itemsNewsletters, brief.newslettersBulk, 'Newsletter / Promo');
    renderBriefSection(itemsSpam, brief.possibleSpamOrSuspicious, 'Spam / Suspicious review');
  }

  function renderBriefSection(container, items, defaultLabel) {
    container.innerHTML = '';
    if (!items || items.length === 0) {
      container.innerHTML = '<p class="text-muted" style="font-size:11px; margin-left:8px">None</p>';
      return;
    }

    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'brief-item';
      div.innerHTML = `
        <div class="brief-item-subject">${escapeHtml(item.subject || '(No Subject)')}</div>
        <div class="brief-item-reason">${escapeHtml(item.briefReason)} ${item.explicitDeadline ? `· <span class="text-danger">${escapeHtml(item.explicitDeadline)}</span>` : ''}</div>
        <div class="brief-item-action">→ ${escapeHtml(item.suggestedNextAction)}</div>
      `;
      div.addEventListener('click', () => {
        switchTab('thread');
        loadThreadDetails(item.threadId);
      });
      container.appendChild(div);
    });
  }

  // -------------------------------------------------------------
  // COMMITMENT TRACKER
  // -------------------------------------------------------------
  async function loadAllCommitments(actorFilter = 'all') {
    allCommitmentsList.innerHTML = '<div class="spinner"></div>';
    try {
      const endpoint = actorFilter === 'all'
        ? '/api/v1/ai/commitments'
        : `/api/v1/ai/commitments?actor=${actorFilter}`;
      const commitments = await apiFetch(endpoint);

      allCommitmentsList.innerHTML = '';
      if (!commitments || commitments.length === 0) {
        allCommitmentsList.innerHTML = '<p class="text-muted">No commitments found for this view.</p>';
        return;
      }

      commitments.forEach(c => {
        const item = document.createElement('div');
        item.className = 'card';
        const actorLabel = c.actor === 'user' ? 'You Promised' : (c.actor === 'other' ? 'Owed by Counterpart' : 'Obligation');
        const actorClass = c.actor === 'user' ? 'actor-user' : 'actor-other';
        const isDone = c.effectiveStatus === 'done';

        item.innerHTML = `
          <div class="commitment-header" style="margin-bottom:6px">
            <span class="commitment-actor ${actorClass}">${actorLabel}</span>
            <span class="badge ${isDone ? 'badge-category' : 'badge-urgency'}">${c.effectiveStatus.toUpperCase()}</span>
          </div>
          <div style="font-weight:600; font-size:12px">${escapeHtml(c.action)}</div>
          <div class="text-muted" style="font-size:11px; margin: 4px 0">Thread: ${escapeHtml(c.threadSubject || '')}</div>
          ${c.dueDate ? `<div class="text-deadline">Due: ${formatDateStr(c.dueDate)}</div>` : ''}
          ${c.evidenceQuote ? `<div class="commitment-quote">"${escapeHtml(c.evidenceQuote)}"</div>` : ''}
          <div style="margin-top:8px; display:flex; gap:6px">
            <button class="btn btn-xs ${isDone ? 'btn-secondary' : 'btn-outline'} toggle-done" data-id="${c.id}" data-status="${isDone ? 'open' : 'done'}">
              ${isDone ? 'Reopen' : '✓ Mark as Done'}
            </button>
            <button class="btn btn-xs btn-outline view-thread" data-thread="${c.threadId}">View Thread</button>
          </div>
        `;

        item.querySelector('.toggle-done').addEventListener('click', async (e) => {
          await updateCommitmentStatus(e.target.dataset.id, e.target.dataset.status);
          loadAllCommitments(actorFilter);
        });

        item.querySelector('.view-thread').addEventListener('click', (e) => {
          switchTab('thread');
          loadThreadDetails(e.target.dataset.thread);
        });

        allCommitmentsList.appendChild(item);
      });
    } catch (e) {
      allCommitmentsList.innerHTML = `<p class="text-danger">Failed to load tracker: ${e.message}</p>`;
    }
  }

  // Helper
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  function formatDateStr(isoStr) {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoStr;
    }
  }

  // Start if in extension sidepanel DOM
  if (typeof window !== 'undefined' && typeof document !== 'undefined' && document.getElementById('tabThread')) {
    init();
  }

  return {
    validateBackendUrl
  };
});

