import { HealthApiResponse } from '../types/health';
import { EmailThread } from '../types/email';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
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
  timestamp: string;
}

export interface AuthSessionData {
  token: string;
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  defaultWorkspaceId: string;
  defaultWorkspaceName: string;
  role: string;
}

export class ApiClient {
  private baseUrl: string;
  private workspaceId: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = API_BASE_URL, workspaceId: string = DEFAULT_WORKSPACE_ID) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.workspaceId = workspaceId;
    // Check if token was saved in localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      this.authToken = localStorage.getItem('jiosi_auth_token');
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
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
    if (typeof window !== 'undefined' && window.localStorage) {
      if (token) {
        localStorage.setItem('jiosi_auth_token', token);
      } else {
        localStorage.removeItem('jiosi_auth_token');
      }
    }
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Workspace-Id': this.workspaceId,
    };
    if (this.authToken) {
      headers['Authorization'] = this.authToken.startsWith('Bearer ') ? this.authToken : `Bearer ${this.authToken}`;
    }
    return headers;
  }

  async initAuth(email: string = 'alex@jiosi.online'): Promise<AuthSessionData> {
    const res = await fetch(`${this.baseUrl}/api/v1/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      throw new Error(`Authentication failed: HTTP ${res.status}`);
    }

    const body: ApiResponse<AuthSessionData> = await res.json();
    if (body.data && body.data.token) {
      this.setAuthToken(body.data.token);
      if (body.data.defaultWorkspaceId) {
        this.setWorkspaceId(body.data.defaultWorkspaceId);
      }
    }
    return body.data;
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
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch threads: HTTP ${res.status}`);
    }

    const body: ApiResponse<PagedThreadsData> = await res.json();
    return body.data;
  }

  async fetchThreadDetail(id: string): Promise<EmailThread> {
    const res = await fetch(`${this.baseUrl}/api/v1/threads/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch thread: HTTP ${res.status}`);
    }

    const body: ApiResponse<EmailThread> = await res.json();
    return body.data;
  }

  async searchThreads(query: string, page: number = 0, size: number = 20): Promise<PagedThreadsData> {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      size: size.toString(),
    });

    const res = await fetch(`${this.baseUrl}/api/v1/threads/search?${params.toString()}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Search failed: HTTP ${res.status}`);
    }

    const body: ApiResponse<PagedThreadsData> = await res.json();
    return body.data;
  }

  async updateRead(id: string, unread: boolean): Promise<EmailThread> {
    const res = await fetch(`${this.baseUrl}/api/v1/threads/${id}/read`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ unread }),
    });

    if (!res.ok) {
      throw new Error(`Failed to update read status: HTTP ${res.status}`);
    }

    const body: ApiResponse<EmailThread> = await res.json();
    return body.data;
  }

  async updateStar(id: string, starred: boolean): Promise<EmailThread> {
    const res = await fetch(`${this.baseUrl}/api/v1/threads/${id}/star`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ starred }),
    });

    if (!res.ok) {
      throw new Error(`Failed to update star status: HTTP ${res.status}`);
    }

    const body: ApiResponse<EmailThread> = await res.json();
    return body.data;
  }

  async updateArchive(id: string, archived: boolean): Promise<EmailThread> {
    const res = await fetch(`${this.baseUrl}/api/v1/threads/${id}/archive`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ archived }),
    });

    if (!res.ok) {
      throw new Error(`Failed to update archive status: HTTP ${res.status}`);
    }

    const body: ApiResponse<EmailThread> = await res.json();
    return body.data;
  }

  async updateSnooze(id: string, snoozed: boolean, snoozedUntil?: string): Promise<EmailThread> {
    const res = await fetch(`${this.baseUrl}/api/v1/threads/${id}/snooze`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ snoozed, snoozedUntil }),
    });

    if (!res.ok) {
      throw new Error(`Failed to snooze thread: HTTP ${res.status}`);
    }

    const body: ApiResponse<EmailThread> = await res.json();
    return body.data;
  }

  async batchRead(threadIds: string[], unread: boolean): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/v1/threads/batch/read`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ threadIds, unread }),
    });

    if (!res.ok) {
      throw new Error(`Failed to batch update read status: HTTP ${res.status}`);
    }
  }

  async batchArchive(threadIds: string[], archived: boolean): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/v1/threads/batch/archive`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ threadIds, archived }),
    });

    if (!res.ok) {
      throw new Error(`Failed to batch archive: HTTP ${res.status}`);
    }
  }

  async sendReply(threadId: string, recipientEmail: string, bodyText: string): Promise<EmailThread> {
    const res = await fetch(`${this.baseUrl}/api/v1/threads/${threadId}/reply`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ recipientEmail, body: bodyText }),
    });

    if (!res.ok) {
      throw new Error(`Failed to send reply: HTTP ${res.status}`);
    }

    const body: ApiResponse<EmailThread> = await res.json();
    return body.data;
  }

  async sendNewEmail(toEmail: string, subject: string, bodyText: string): Promise<EmailThread> {
    const res = await fetch(`${this.baseUrl}/api/v1/threads/send`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ toEmail, subject, body: bodyText }),
    });

    if (!res.ok) {
      throw new Error(`Failed to send email: HTTP ${res.status}`);
    }

    const body: ApiResponse<EmailThread> = await res.json();
    return body.data;
  }

  async saveDraft(toEmail: string, recipientName: string, subject: string, bodyText: string, threadId?: string): Promise<{ id: string }> {
    const res = await fetch(`${this.baseUrl}/api/v1/drafts`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        threadId: threadId || null,
        toEmail,
        recipientName,
        subject,
        body: bodyText,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to save draft: HTTP ${res.status}`);
    }

    const body: ApiResponse<{ id: string }> = await res.json();
    return body.data;
  }

  async fetchDrafts(): Promise<Array<{ id: string; toEmail: string; subject: string; body: string; updatedAt: string }>> {
    const res = await fetch(`${this.baseUrl}/api/v1/drafts`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch drafts: HTTP ${res.status}`);
    }

    const body: ApiResponse<{ content: Array<{ id: string; toEmail: string; subject: string; body: string; updatedAt: string }> }> = await res.json();
    return body.data.content;
  }

  async deleteDraft(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/v1/drafts/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to delete draft: HTTP ${res.status}`);
    }
  }
}

export const apiClient = new ApiClient();
