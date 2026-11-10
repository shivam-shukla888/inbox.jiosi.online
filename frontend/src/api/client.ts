import { HealthApiResponse } from '../types/health';
import {
  EmailThread,
  GmailStatusData,
  GmailMessagesPageData,
  GmailMessageDetail,
  ThreadAiTriageData,
  ThreadSummaryData,
  ActionItemData,
  ReplyDraftResponseData,
  ComposeAssistResponseData,
  UserAiPreferencesData,
  AiTone
} from '../types/email';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:8080');
export const DEFAULT_WORKSPACE_ID = 'a0000000-0000-0000-0000-000000000001';

export interface HealthCheckResult {
  data: HealthApiResponse | null;
  latencyMs: number;
  error: string | null;
}

export interface FolderCountsData {
  inbox: { total: number; unread: number };
  needsReply: { total: number; unread: number };
  starred: number;
  snoozed: number;
  sent: number;
  drafts: number;
  filterAll: number;
  filterUnread: number;
  filterNeedsReply: number;
  filterVip: number;
}

export interface PagedThreadsData {
  threads: EmailThread[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  folderCounts: FolderCountsData;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
  code?: string;
}

export interface AuthSessionData {
  token?: string;
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  defaultWorkspaceId: string;
  defaultWorkspaceName: string;
  role: string;
}

export interface GmailSyncResponse {
  syncedCount: number;
  newMessagesCount: number;
  existingMessagesCount: number;
  failedMessagesCount: number;
  nextPageToken?: string | null;
  resultSizeEstimate: number;
}

function getXsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export class ApiClient {
  private baseUrl: string;
  private workspaceId: string;
  private authToken: string | null = null;
  private onUnauthorizedCallback: (() => void) | null = null;

  constructor(baseUrl: string = API_BASE_URL, workspaceId: string = DEFAULT_WORKSPACE_ID) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.workspaceId = workspaceId;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      this.authToken = sessionStorage.getItem('jiosi_auth_token');
      const savedWs = sessionStorage.getItem('jiosi_workspace_id');
      if (savedWs) {
        this.workspaceId = savedWs;
      }
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getWorkspaceId(): string {
    return this.workspaceId;
  }

  setWorkspaceId(id: string) {
    this.workspaceId = id;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      if (id) {
        sessionStorage.setItem('jiosi_workspace_id', id);
      } else {
        sessionStorage.removeItem('jiosi_workspace_id');
      }
    }
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      if (token) {
        sessionStorage.setItem('jiosi_auth_token', token);
      } else {
        sessionStorage.removeItem('jiosi_auth_token');
      }
    }
  }

  setOnUnauthorized(callback: () => void) {
    this.onUnauthorizedCallback = callback;
  }

  getGoogleOAuthUrl(): string {
    if (import.meta.env.PROD) {
      return '/oauth2/authorization/google';
    }
    return `${this.baseUrl}/oauth2/authorization/google`;
  }

  private getHeaders(isMutating: boolean = false, includeWorkspace: boolean = true): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (includeWorkspace && this.workspaceId) {
      headers['X-Workspace-Id'] = this.workspaceId;
    }
    if (this.authToken) {
      headers['Authorization'] = this.authToken.startsWith('Bearer ') ? this.authToken : `Bearer ${this.authToken}`;
    }
    if (isMutating) {
      const xsrf = getXsrfToken();
      if (xsrf) {
        headers['X-XSRF-TOKEN'] = xsrf;
      }
    }
    return headers;
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    if (res.status === 401) {
      this.setAuthToken(null);
      if (this.onUnauthorizedCallback) {
        this.onUnauthorizedCallback();
      }
      throw new Error('Authentication required');
    }
    if (!res.ok) {
      let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const body = await res.json();
        if (body.message) errorMsg = body.message;
      } catch {
        // use default errorMsg
      }
      throw new Error(errorMsg);
    }
    const json: ApiResponse<T> = await res.json();
    return json.data;
  }

  async fetchCsrf(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/v1/auth/csrf`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });
    } catch {
      // Non-fatal if offline
    }
  }

  async loginWithGoogle(idToken: string): Promise<AuthSessionData> {
    const res = await fetch(`${this.baseUrl}/api/v1/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ idToken }),
    });

    const data = await this.handleResponse<AuthSessionData>(res);
    if (data.token) {
      this.setAuthToken(data.token);
    }
    if (data.defaultWorkspaceId) {
      this.setWorkspaceId(data.defaultWorkspaceId);
    }
    return data;
  }

  async getMe(): Promise<AuthSessionData> {
    const res = await fetch(`${this.baseUrl}/api/v1/auth/me`, {
      method: 'GET',
      headers: this.getHeaders(false, false),
      credentials: 'include',
    });

    const data = await this.handleResponse<AuthSessionData>(res);
    if (data.token) {
      this.setAuthToken(data.token);
    }
    if (data.defaultWorkspaceId) {
      this.setWorkspaceId(data.defaultWorkspaceId);
    }
    return data;
  }

  async initAuth(_deprecatedEmail?: string): Promise<AuthSessionData> {
    return this.getMe();
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/v1/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders(true, false),
        credentials: 'include',
      });
    } finally {
      this.setAuthToken(null);
      this.setWorkspaceId(DEFAULT_WORKSPACE_ID);
    }
  }

  async checkHealth(): Promise<HealthCheckResult> {
    const startTime = performance.now();
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        return {
          data: null,
          latencyMs,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const json = (await response.json()) as HealthApiResponse;
      return {
        data: json,
        latencyMs,
        error: null,
      };
    } catch (err) {
      const latencyMs = Math.round(performance.now() - startTime);
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to backend';
      return {
        data: null,
        latencyMs,
        error: errorMessage,
      };
    }
  }

  async fetchThreads(
    folder: string = 'inbox',
    filter: string = 'all',
    page: number = 0,
    size: number = 20
  ): Promise<PagedThreadsData> {
    const params = new URLSearchParams({
      folder,
      filter,
      page: page.toString(),
      size: size.toString(),
    });

    const res = await fetch(`${this.baseUrl}/api/v1/threads?${params.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(false),
      credentials: 'include',
    });

    return this.handleResponse<PagedThreadsData>(res);
  }

  async fetchThreadDetail(id: string): Promise<EmailThread> {
    const res = await fetch(`${this.baseUrl}/api/v1/threads/${id}`, {
      method: 'GET',
      headers: this.getHeaders(false),
      credentials: 'include',
    });

    return this.handleResponse<EmailThread>(res);
  }

  async searchThreads(query: string, page: number = 0, size: number = 20): Promise<PagedThreadsData> {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      size: size.toString(),
    });

    const res = await fetch(`${this.baseUrl}/api/v1/threads/search?${params.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(false),
      credentials: 'include',
    });

    return this.handleResponse<PagedThreadsData>(res);
  }

  async updateRead(id: string, unread: boolean): Promise<EmailThread> {
    const res = await fetch(`${this.baseUrl}/api/v1/threads/${id}/read`, {
      method: 'PATCH',
      headers: this.getHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ unread }),
    });

    return this.handleResponse<EmailThread>(res);
  }

  async updateStar(id: string, starred: boolean): Promise<EmailThread> {
    const res = await fetch(`${this.baseUrl}/api/v1/threads/${id}/star`, {
      method: 'PATCH',
      headers: this.getHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ starred }),
    });

    return this.handleResponse<EmailThread>(res);
  }

  async updateArchive(id: string, archived: boolean): Promise<EmailThread> {
    const res = await fetch(`${this.baseUrl}/api/v1/threads/${id}/archive`, {
      method: 'PATCH',
      headers: this.getHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ archived }),
    });

    return this.handleResponse<EmailThread>(res);
  }

  async updateSnooze(id: string, snoozed: boolean, snoozedUntil?: string): Promise<EmailThread> {
    const res = await fetch(`${this.baseUrl}/api/v1/threads/${id}/snooze`, {
      method: 'PATCH',
      headers: this.getHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ snoozed, snoozedUntil }),
    });

    return this.handleResponse<EmailThread>(res);
  }

  async batchRead(threadIds: string[], unread: boolean): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/v1/threads/batch/read`, {
      method: 'POST',
      headers: this.getHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ threadIds, unread }),
    });

    await this.handleResponse<void>(res);
  }

  async batchArchive(threadIds: string[], archived: boolean): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/v1/threads/batch/archive`, {
      method: 'POST',
      headers: this.getHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ threadIds, archived }),
    });

    await this.handleResponse<void>(res);
  }

  async sendReply(threadId: string, recipientEmail: string, bodyText: string): Promise<EmailThread> {
    const res = await fetch(`${this.baseUrl}/api/v1/threads/${threadId}/reply`, {
      method: 'POST',
      headers: this.getHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ recipientEmail, body: bodyText }),
    });

    return this.handleResponse<EmailThread>(res);
  }

  async sendNewEmail(toEmail: string, subject: string, bodyText: string): Promise<EmailThread> {
    const res = await fetch(`${this.baseUrl}/api/v1/threads/send`, {
      method: 'POST',
      headers: this.getHeaders(true),
      credentials: 'include',
      body: JSON.stringify({ toEmail, subject, body: bodyText }),
    });

    return this.handleResponse<EmailThread>(res);
  }

  async saveDraft(toEmail: string, recipientName: string, subject: string, bodyText: string, threadId?: string): Promise<{ id: string }> {
    const res = await fetch(`${this.baseUrl}/api/v1/drafts`, {
      method: 'POST',
      headers: this.getHeaders(true),
      credentials: 'include',
      body: JSON.stringify({
        threadId: threadId || null,
        toEmail,
        recipientName,
        subject,
        body: bodyText,
      }),
    });

    return this.handleResponse<{ id: string }>(res);
  }

  async fetchDrafts(): Promise<Array<{ id: string; toEmail: string; subject: string; body: string; updatedAt: string }>> {
    const res = await fetch(`${this.baseUrl}/api/v1/drafts`, {
      method: 'GET',
      headers: this.getHeaders(false),
      credentials: 'include',
    });

    const data = await this.handleResponse<{ content: Array<{ id: string; toEmail: string; subject: string; body: string; updatedAt: string }> }>(res);
    return data.content || [];
  }

  async deleteDraft(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/v1/drafts/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
      credentials: 'include',
    });

    await this.handleResponse<void>(res);
  }

  // =========================================================================
  // GMAIL API INTEGRATION (READ-ONLY)
  // =========================================================================

  async getGmailStatus(): Promise<GmailStatusData> {
    const res = await fetch(`${this.baseUrl}/api/v1/gmail/status`, {
      method: 'GET',
      headers: this.getHeaders(false, true),
      credentials: 'include',
    });
    return this.handleResponse<GmailStatusData>(res);
  }

  async getGmailConnectUrl(): Promise<{ connectUrl: string }> {
    const res = await fetch(`${this.baseUrl}/api/v1/gmail/connect-url`, {
      method: 'GET',
      headers: this.getHeaders(false, true),
      credentials: 'include',
    });
    return this.handleResponse<{ connectUrl: string }>(res);
  }

  async disconnectGmail(): Promise<{ success: boolean; status: string }> {
    const res = await fetch(`${this.baseUrl}/api/v1/gmail/disconnect`, {
      method: 'POST',
      headers: this.getHeaders(true, true),
      credentials: 'include',
    });
    return this.handleResponse<{ success: boolean; status: string }>(res);
  }

  async getGmailMessages(maxResults: number = 20, pageToken?: string): Promise<GmailMessagesPageData> {
    let url = `${this.baseUrl}/api/v1/gmail/messages?maxResults=${maxResults}`;
    if (pageToken) {
      url += `&pageToken=${encodeURIComponent(pageToken)}`;
    }
    const res = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(false, true),
      credentials: 'include',
    });
    return this.handleResponse<GmailMessagesPageData>(res);
  }

  async getGmailMessageDetail(messageId: string): Promise<GmailMessageDetail> {
    const res = await fetch(`${this.baseUrl}/api/v1/gmail/messages/${encodeURIComponent(messageId)}`, {
      method: 'GET',
      headers: this.getHeaders(false, true),
      credentials: 'include',
    });
    return this.handleResponse<GmailMessageDetail>(res);
  }

  async syncGmail(maxResults: number = 25, pageToken?: string): Promise<GmailSyncResponse> {
    const res = await fetch(`${this.baseUrl}/api/v1/gmail/sync`, {
      method: 'POST',
      headers: this.getHeaders(true, true),
      credentials: 'include',
      body: JSON.stringify({ maxResults, pageToken }),
    });
    return this.handleResponse<GmailSyncResponse>(res);
  }

  // =========================================================================
  // GROQ AI EMAIL INTELLIGENCE (SERVER-SIDE)
  // =========================================================================

  async getAiPreferences(): Promise<UserAiPreferencesData> {
    const res = await fetch(`${this.baseUrl}/api/v1/ai/preferences`, {
      method: 'GET',
      headers: this.getHeaders(false, true),
      credentials: 'include',
    });
    return this.handleResponse<UserAiPreferencesData>(res);
  }

  async updateAiPreferences(
    aiProcessingConsent: boolean,
    defaultReplyTone: string = 'professional',
    defaultReplyLanguage: string = 'match_thread'
  ): Promise<UserAiPreferencesData> {
    const res = await fetch(`${this.baseUrl}/api/v1/ai/preferences`, {
      method: 'PUT',
      headers: this.getHeaders(true, true),
      credentials: 'include',
      body: JSON.stringify({ aiProcessingConsent, defaultReplyTone, defaultReplyLanguage }),
    });
    return this.handleResponse<UserAiPreferencesData>(res);
  }

  async summarizeThread(threadId: string): Promise<ThreadSummaryData> {
    const res = await fetch(`${this.baseUrl}/api/v1/ai/threads/${encodeURIComponent(threadId)}/summary`, {
      method: 'POST',
      headers: this.getHeaders(true, true),
      credentials: 'include',
    });
    return this.handleResponse<ThreadSummaryData>(res);
  }

  async extractActionItems(threadId: string): Promise<ActionItemData[]> {
    const res = await fetch(`${this.baseUrl}/api/v1/ai/threads/${encodeURIComponent(threadId)}/action-items`, {
      method: 'POST',
      headers: this.getHeaders(true, true),
      credentials: 'include',
    });
    return this.handleResponse<ActionItemData[]>(res);
  }

  async generateReplyDraft(
    threadId: string,
    tone: AiTone = 'professional',
    language: string = 'match_thread',
    customInstructions?: string
  ): Promise<ReplyDraftResponseData> {
    const res = await fetch(`${this.baseUrl}/api/v1/ai/threads/${encodeURIComponent(threadId)}/reply-draft`, {
      method: 'POST',
      headers: this.getHeaders(true, true),
      credentials: 'include',
      body: JSON.stringify({ tone, language, customInstructions }),
    });
    return this.handleResponse<ReplyDraftResponseData>(res);
  }

  async assistCompose(
    currentText: string,
    action: string,
    targetLanguage?: string,
    instructions?: string
  ): Promise<ComposeAssistResponseData> {
    const res = await fetch(`${this.baseUrl}/api/v1/ai/compose/assist`, {
      method: 'POST',
      headers: this.getHeaders(true, true),
      credentials: 'include',
      body: JSON.stringify({ currentText, action, targetLanguage, instructions }),
    });
    return this.handleResponse<ComposeAssistResponseData>(res);
  }

  async getThreadTriage(threadId: string): Promise<ThreadAiTriageData> {
    const res = await fetch(`${this.baseUrl}/api/v1/ai/threads/${encodeURIComponent(threadId)}/triage`, {
      method: 'POST',
      headers: this.getHeaders(true, true),
      credentials: 'include',
    });
    return this.handleResponse<ThreadAiTriageData>(res);
  }

  async correctThreadTriage(
    threadId: string,
    correctedCategory: string,
    feedbackNotes?: string,
    isFalsePositive?: boolean
  ): Promise<ThreadAiTriageData> {
    const res = await fetch(`${this.baseUrl}/api/v1/ai/threads/${encodeURIComponent(threadId)}/triage/correction`, {
      method: 'POST',
      headers: this.getHeaders(true, true),
      credentials: 'include',
      body: JSON.stringify({ correctedCategory, feedbackNotes, isFalsePositive }),
    });
    return this.handleResponse<ThreadAiTriageData>(res);
  }
}

export const apiClient = new ApiClient();
