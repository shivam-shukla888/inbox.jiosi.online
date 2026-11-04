package com.jiosi.inbox.gmail;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiosi.inbox.common.ApiResponse;
import com.jiosi.inbox.common.ResourceNotFoundException;
import com.jiosi.inbox.common.UnauthorizedException;
import com.jiosi.inbox.common.WorkspaceAccessDeniedException;
import com.jiosi.inbox.config.CustomOAuth2AuthorizationRequestResolver;
import com.jiosi.inbox.connectedaccount.ConnectedAccount;
import com.jiosi.inbox.connectedaccount.ConnectedAccountRepository;
import com.jiosi.inbox.email.Email;
import com.jiosi.inbox.email.EmailRepository;
import com.jiosi.inbox.email.EmailThread;
import com.jiosi.inbox.email.EmailThreadRepository;
import com.jiosi.inbox.gmail.dto.*;
import com.jiosi.inbox.security.TokenEncryptionService;
import com.jiosi.inbox.security.UserContext;
import com.jiosi.inbox.security.WorkspaceAuthorizationService;
import com.jiosi.inbox.user.User;
import com.jiosi.inbox.user.UserRepository;
import com.jiosi.inbox.workspace.Workspace;
import com.jiosi.inbox.workspace.WorkspaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GmailIntegrationTests {

    private final ObjectMapper objectMapper = new ObjectMapper();

    // =========================================================================
    // 1. TOKEN ENCRYPTION SERVICE TESTS (AES-256-GCM)
    // =========================================================================
    @Nested
    @DisplayName("Token Encryption Service Security Tests")
    class EncryptionTests {

        private TokenEncryptionService encryptionService;

        @BeforeEach
        void setUp() {
            encryptionService = new TokenEncryptionService("test_secret_key_minimum_32_bytes_length_for_aes_gcm");
        }

        @Test
        @DisplayName("Encrypts and decrypts OAuth access and refresh tokens flawlessly")
        void shouldEncryptAndDecryptTokens() {
            String rawToken = "ya29.a0AcM61234567890abcdef-secret-oauth-access-token";
            String encrypted = encryptionService.encrypt(rawToken);

            assertThat(encrypted).isNotNull();
            assertThat(encrypted).isNotEqualTo(rawToken);
            assertThat(encrypted).doesNotContain("ya29.");

            String decrypted = encryptionService.decrypt(encrypted);
            assertThat(decrypted).isEqualTo(rawToken);
        }

        @Test
        @DisplayName("Generates unique IVs on every encryption ensuring semantic security")
        void shouldGenerateDistinctCiphertextsForSameInput() {
            String rawToken = "identical_refresh_token_value_12345";
            String enc1 = encryptionService.encrypt(rawToken);
            String enc2 = encryptionService.encrypt(rawToken);

            assertThat(enc1).isNotEqualTo(enc2);
            assertThat(encryptionService.decrypt(enc1)).isEqualTo(rawToken);
            assertThat(encryptionService.decrypt(enc2)).isEqualTo(rawToken);
        }

        @Test
        @DisplayName("Fails cleanly on tampered or corrupted ciphertext")
        void shouldRejectTamperedPayload() {
            String rawToken = "genuine_access_token";
            String enc = encryptionService.encrypt(rawToken);

            byte[] decoded = Base64.getDecoder().decode(enc);
            decoded[decoded.length - 1] ^= 0xFF; // Flip bit in GCM auth tag
            String tampered = Base64.getEncoder().encodeToString(decoded);

            assertThatThrownBy(() -> encryptionService.decrypt(tampered))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cryptographic decryption failure");
        }
    }

    // =========================================================================
    // 2. OAUTH AUTHORIZATION REQUEST RESOLVER TESTS
    // =========================================================================
    @Nested
    @DisplayName("Custom OAuth2 Authorization Request Resolver Tests")
    class AuthorizationResolverTests {

        @Mock
        private ClientRegistrationRepository clientRegistrationRepository;

        private CustomOAuth2AuthorizationRequestResolver resolver;

        @BeforeEach
        void setUp() {
            ClientRegistration googleRegistration = ClientRegistration.withRegistrationId("google")
                    .clientId("test-client-id")
                    .clientSecret("test-client-secret")
                    .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                    .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                    .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                    .tokenUri("https://oauth2.googleapis.com/token")
                    .scope("openid", "profile", "email")
                    .build();

            when(clientRegistrationRepository.findByRegistrationId("google")).thenReturn(googleRegistration);
            resolver = new CustomOAuth2AuthorizationRequestResolver(clientRegistrationRepository);
        }

        @Test
        @DisplayName("Preserves standard login request when no connect_gmail action is present")
        void shouldPreserveStandardLogin() {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/oauth2/authorization/google");
            request.setServletPath("/oauth2/authorization/google");

            OAuth2AuthorizationRequest resolved = resolver.resolve(request);

            assertThat(resolved).isNotNull();
            assertThat(resolved.getScopes()).containsExactlyInAnyOrder("openid", "profile", "email");
            assertThat(resolved.getScopes()).doesNotContain("https://www.googleapis.com/auth/gmail.readonly");
            assertThat(resolved.getAdditionalParameters()).doesNotContainKey("access_type");
        }

        @Test
        @DisplayName("Injects gmail.readonly scope, access_type=offline, and prompt=consent when action=connect_gmail")
        void shouldInjectGmailScopeAndOfflineParams() {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/oauth2/authorization/google");
            request.setServletPath("/oauth2/authorization/google");
            request.setParameter("action", "connect_gmail");
            request.setParameter("user_id", "11111111-1111-1111-1111-111111111111");

            OAuth2AuthorizationRequest resolved = resolver.resolve(request);

            assertThat(resolved).isNotNull();
            assertThat(resolved.getScopes()).contains("https://www.googleapis.com/auth/gmail.readonly");
            assertThat(resolved.getAdditionalParameters())
                    .containsEntry("access_type", "offline")
                    .containsEntry("prompt", "consent")
                    .containsEntry("include_granted_scopes", "true");

            assertThat(request.getSession().getAttribute(CustomOAuth2AuthorizationRequestResolver.SESSION_GMAIL_CONNECT_ACTION))
                    .isEqualTo(Boolean.TRUE);
            // SECURITY HARDENED: Resolver must NOT bind user_id from untrusted query parameters
            assertThat(request.getSession().getAttribute(CustomOAuth2AuthorizationRequestResolver.SESSION_CONNECTING_USER_ID))
                    .isNull();
        }
    }

    // =========================================================================
    // 3. GMAIL SERVICE WORKFLOW & RESILIENCE TESTS
    // =========================================================================
    @Nested
    @DisplayName("Gmail Service Tests (Status, Refresh, Pagination, Disconnect)")
    class GmailServiceWorkflowTests {

        @Mock
        private ConnectedAccountRepository connectedAccountRepository;
        @Mock
        private GmailClient gmailApiClient;

        private TokenEncryptionService tokenEncryptionService;
        private GmailService gmailService;

        private final UUID testUserId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        private final UUID testWorkspaceId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        private User testUser;
        private Workspace testWorkspace;

        @BeforeEach
        void setUp() {
            tokenEncryptionService = new TokenEncryptionService("test_secret_key_minimum_32_bytes_length_for_aes_gcm");
            gmailService = new GmailService(
                    connectedAccountRepository,
                    tokenEncryptionService,
                    gmailApiClient,
                    "test-google-client-id",
                    "test-google-client-secret"
            );

            testUser = new User("user@jiosi.online", "Test User", null);
            testUser.setId(testUserId);
            testWorkspace = new Workspace("Primary Workspace", "primary-workspace", testUser);
            testWorkspace.setId(testWorkspaceId);
        }

        @Test
        @DisplayName("Returns disconnected status when no account is associated")
        void shouldReturnDisconnectedWhenNoAccount() {
            when(connectedAccountRepository.findFirstByUserIdAndWorkspaceIdAndProvider(testUserId, testWorkspaceId, "gmail"))
                    .thenReturn(Optional.empty());
            when(connectedAccountRepository.findFirstByUserIdAndProvider(testUserId, "gmail"))
                    .thenReturn(Optional.empty());

            GmailStatusResponse status = gmailService.getStatus(testUserId, testWorkspaceId);

            assertThat(status.connected()).isFalse();
            assertThat(status.status()).isEqualTo("DISCONNECTED");
        }

        @Test
        @DisplayName("Returns active status when connected account exists")
        void shouldReturnActiveStatus() {
            ConnectedAccount account = new ConnectedAccount(testUser, "gmail", "user@jiosi.online", "CONNECTED");
            account.setLastSyncAt(Instant.now());
            account.setTokenExpiresAt(Instant.now().plusSeconds(3600));

            when(connectedAccountRepository.findFirstByUserIdAndWorkspaceIdAndProvider(testUserId, testWorkspaceId, "gmail"))
                    .thenReturn(Optional.of(account));

            GmailStatusResponse status = gmailService.getStatus(testUserId, testWorkspaceId);

            assertThat(status.connected()).isTrue();
            assertThat(status.status()).isEqualTo("CONNECTED");
            assertThat(status.email()).isEqualTo("user@jiosi.online");
        }

        @Test
        @DisplayName("Automatically refreshes token when token is near expiration")
        void shouldRefreshTokenWhenNearExpiration() throws Exception {
            ConnectedAccount account = new ConnectedAccount(testUser, "gmail", "user@jiosi.online", "CONNECTED");
            account.setAccessTokenEncrypted(tokenEncryptionService.encrypt("raw_old_access_token"));
            account.setRefreshTokenEncrypted(tokenEncryptionService.encrypt("raw_refresh_token"));
            account.setTokenExpiresAt(Instant.now().plusSeconds(60)); // Only 60s left, threshold is 300s

            when(connectedAccountRepository.findFirstByUserIdAndWorkspaceIdAndProvider(testUserId, testWorkspaceId, "gmail"))
                    .thenReturn(Optional.of(account));
            when(gmailApiClient.refreshAccessToken("raw_refresh_token", "test-google-client-id", "test-google-client-secret"))
                    .thenReturn(new GmailApiClient.TokenRefreshResult("new_access_token", Instant.now().plusSeconds(3600), "gmail.readonly"));

            // Mock list response
            JsonNode listJson = objectMapper.readTree("{\"messages\": [], \"resultSizeEstimate\": 0}");
            when(gmailApiClient.listMessages("new_access_token", 20, null, "in:inbox")).thenReturn(listJson);

            GmailMessagesPageResponse page = gmailService.getInboxMessages(testUserId, testWorkspaceId, 20, null);

            assertThat(page).isNotNull();
            verify(gmailApiClient).refreshAccessToken("raw_refresh_token", "test-google-client-id", "test-google-client-secret");
            verify(connectedAccountRepository, atLeastOnce()).save(account);
            assertThat(tokenEncryptionService.decrypt(account.getAccessTokenEncrypted())).isEqualTo("new_access_token");
        }

        @Test
        @DisplayName("Handles expired/revoked Google OAuth grant gracefully")
        void shouldHandleRevokedGoogleGrant() {
            ConnectedAccount account = new ConnectedAccount(testUser, "gmail", "user@jiosi.online", "CONNECTED");
            account.setAccessTokenEncrypted(tokenEncryptionService.encrypt("raw_old_access_token"));
            account.setRefreshTokenEncrypted(tokenEncryptionService.encrypt("raw_refresh_token"));
            account.setTokenExpiresAt(Instant.now().minusSeconds(10)); // Expired

            when(connectedAccountRepository.findFirstByUserIdAndWorkspaceIdAndProvider(testUserId, testWorkspaceId, "gmail"))
                    .thenReturn(Optional.of(account));
            when(gmailApiClient.refreshAccessToken(anyString(), anyString(), anyString()))
                    .thenThrow(new GmailAuthRevokedException("User revoked Google OAuth grant"));

            assertThatThrownBy(() -> gmailService.getInboxMessages(testUserId, testWorkspaceId, 20, null))
                    .isInstanceOf(GmailAuthRevokedException.class)
                    .hasMessageContaining("User revoked Google OAuth grant");

            verify(connectedAccountRepository).save(account);
            assertThat(account.getStatus()).isEqualTo("REVOKED");
        }

        @Test
        @DisplayName("Paginates messages and correctly parses headers and unread status")
        void shouldPaginateAndParseMessages() throws Exception {
            ConnectedAccount account = new ConnectedAccount(testUser, "gmail", "user@jiosi.online", "CONNECTED");
            account.setAccessTokenEncrypted(tokenEncryptionService.encrypt("valid_access_token"));
            account.setRefreshTokenEncrypted(tokenEncryptionService.encrypt("valid_refresh_token"));
            account.setTokenExpiresAt(Instant.now().plusSeconds(3000));

            when(connectedAccountRepository.findFirstByUserIdAndWorkspaceIdAndProvider(testUserId, testWorkspaceId, "gmail"))
                    .thenReturn(Optional.of(account));

            String listJsonStr = "{" +
                    "\"messages\": [{\"id\": \"msg-1\", \"threadId\": \"th-1\"}]," +
                    "\"nextPageToken\": \"page-token-2\"," +
                    "\"resultSizeEstimate\": 45" +
                    "}";
            when(gmailApiClient.listMessages("valid_access_token", 10, null, "in:inbox"))
                    .thenReturn(objectMapper.readTree(listJsonStr));

            String detailJsonStr = "{" +
                    "\"id\": \"msg-1\"," +
                    "\"threadId\": \"th-1\"," +
                    "\"snippet\": \"Meeting notes from today\"," +
                    "\"internalDate\": \"1700000000000\"," +
                    "\"labelIds\": [\"UNREAD\", \"INBOX\"]," +
                    "\"payload\": {" +
                    "  \"headers\": [" +
                    "    {\"name\": \"Subject\", \"value\": \"Team Strategy Sync\"}," +
                    "    {\"name\": \"From\", \"value\": \"Elena Rostova <elena@enterprise.com>\"}," +
                    "    {\"name\": \"To\", \"value\": \"user@jiosi.online\"}" +
                    "  ]" +
                    "}" +
                    "}";
            when(gmailApiClient.getMessage("valid_access_token", "msg-1"))
                    .thenReturn(objectMapper.readTree(detailJsonStr));

            GmailMessagesPageResponse page = gmailService.getInboxMessages(testUserId, testWorkspaceId, 10, null);

            assertThat(page.messages()).hasSize(1);
            assertThat(page.nextPageToken()).isEqualTo("page-token-2");
            assertThat(page.resultSizeEstimate()).isEqualTo(45);

            var summary = page.messages().get(0);
            assertThat(summary.id()).isEqualTo("msg-1");
            assertThat(summary.subject()).isEqualTo("Team Strategy Sync");
            assertThat(summary.senderName()).isEqualTo("Elena Rostova");
            assertThat(summary.senderEmail()).isEqualTo("elena@enterprise.com");
            assertThat(summary.isUnread()).isTrue();
        }

        @Test
        @DisplayName("Parses full message detail with decoded text and html bodies")
        void shouldParseMessageDetailWithDecodedBody() throws Exception {
            ConnectedAccount account = new ConnectedAccount(testUser, "gmail", "user@jiosi.online", "CONNECTED");
            account.setAccessTokenEncrypted(tokenEncryptionService.encrypt("valid_access_token"));
            account.setTokenExpiresAt(Instant.now().plusSeconds(3000));

            when(connectedAccountRepository.findFirstByUserIdAndWorkspaceIdAndProvider(testUserId, testWorkspaceId, "gmail"))
                    .thenReturn(Optional.of(account));

            String bodyPlainText = "Hello, this is a confidential email content.";
            String encodedBody = Base64.getUrlEncoder().withoutPadding().encodeToString(bodyPlainText.getBytes(StandardCharsets.UTF_8));

            String detailJsonStr = "{" +
                    "\"id\": \"msg-detailed\"," +
                    "\"threadId\": \"th-detailed\"," +
                    "\"snippet\": \"Hello, this is...\"," +
                    "\"internalDate\": \"1700000000000\"," +
                    "\"labelIds\": [\"INBOX\"]," +
                    "\"payload\": {" +
                    "  \"mimeType\": \"text/plain\"," +
                    "  \"body\": {\"data\": \"" + encodedBody + "\"}," +
                    "  \"headers\": [" +
                    "    {\"name\": \"Subject\", \"value\": \"Confidential Q4 Review\"}," +
                    "    {\"name\": \"From\", \"value\": \"Marcus Vance <marcus@jiosi.online>\"}," +
                    "    {\"name\": \"To\", \"value\": \"user@jiosi.online\"}" +
                    "  ]" +
                    "}" +
                    "}";
            when(gmailApiClient.getMessage("valid_access_token", "msg-detailed"))
                    .thenReturn(objectMapper.readTree(detailJsonStr));

            GmailMessageDetail detail = gmailService.getMessageDetail(testUserId, testWorkspaceId, "msg-detailed");

            assertThat(detail.id()).isEqualTo("msg-detailed");
            assertThat(detail.subject()).isEqualTo("Confidential Q4 Review");
            assertThat(detail.senderName()).isEqualTo("Marcus Vance");
            assertThat(detail.senderEmail()).isEqualTo("marcus@jiosi.online");
            assertThat(detail.bodyText()).isEqualTo(bodyPlainText);
            assertThat(detail.isUnread()).isFalse();
        }

        @Test
        @DisplayName("Disconnects Gmail account, revokes token, and clears sensitive tokens from database")
        void shouldDisconnectGmailAccount() {
            ConnectedAccount account = new ConnectedAccount(testUser, "gmail", "user@jiosi.online", "CONNECTED");
            account.setAccessTokenEncrypted(tokenEncryptionService.encrypt("enc_access"));
            account.setRefreshTokenEncrypted(tokenEncryptionService.encrypt("raw_refresh"));
            account.setTokenExpiresAt(Instant.now().plusSeconds(3600));

            when(connectedAccountRepository.findFirstByUserIdAndWorkspaceIdAndProvider(testUserId, testWorkspaceId, "gmail"))
                    .thenReturn(Optional.of(account));

            gmailService.disconnect(testUserId, testWorkspaceId);

            verify(gmailApiClient).revokeToken("raw_refresh");
            verify(connectedAccountRepository).save(account);

            assertThat(account.getStatus()).isEqualTo("DISCONNECTED");
            assertThat(account.getAccessTokenEncrypted()).isNull();
            assertThat(account.getRefreshTokenEncrypted()).isNull();
            assertThat(account.getTokenExpiresAt()).isNull();
        }
    }

    // =========================================================================
    // 4. CROSS-USER ISOLATION & ACCESS CONTROL TESTS
    // =========================================================================
    @Nested
    @DisplayName("Cross-User Isolation Tests")
    class CrossUserIsolationTests {

        @Mock
        private ConnectedAccountRepository connectedAccountRepository;
        @Mock
        private GmailClient gmailApiClient;

        private TokenEncryptionService tokenEncryptionService;
        private GmailService gmailService;

        private final UUID userAId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        private final UUID userBId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        @BeforeEach
        void setUp() {
            tokenEncryptionService = new TokenEncryptionService("test_secret_key_minimum_32_bytes_length_for_aes_gcm");
            gmailService = new GmailService(
                    connectedAccountRepository,
                    tokenEncryptionService,
                    gmailApiClient,
                    "test-client-id",
                    "test-client-secret"
            );
        }

        @Test
        @DisplayName("User A cannot access User B's Gmail inbox messages")
        void shouldPreventCrossUserMailboxAccess() {
            when(connectedAccountRepository.findFirstByUserIdAndProvider(userAId, "gmail"))
                    .thenReturn(Optional.empty());

            // User A attempts to request inbox messages
            assertThatThrownBy(() -> gmailService.getInboxMessages(userAId, null, 20, null))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("No connected Gmail account found for this user");

            verifyNoInteractions(gmailApiClient);
        }

        @Test
        @DisplayName("User A cannot disconnect User B's Gmail account")
        void shouldPreventCrossUserDisconnect() {
            when(connectedAccountRepository.findFirstByUserIdAndProvider(userAId, "gmail"))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> gmailService.disconnect(userAId, null))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("No connected Gmail account found for user");
        }
    }

    // =========================================================================
    // 5. GMAIL SYNCHRONIZATION & ENTITY PERSISTENCE TESTS
    // =========================================================================
    @Nested
    @DisplayName("Gmail Synchronization & Entity Persistence Tests")
    class GmailMailboxSynchronizationTests {

        @Mock
        private ConnectedAccountRepository connectedAccountRepository;
        @Mock
        private GmailClient gmailApiClient;
        @Mock
        private EmailThreadRepository threadRepository;
        @Mock
        private EmailRepository emailRepository;
        @Mock
        private WorkspaceRepository workspaceRepository;

        private WorkspaceAuthorizationService workspaceAuthorizationService;
        private boolean accessDeniedTriggered;
        private boolean validatedAccessCalled;

        private TokenEncryptionService tokenEncryptionService;
        private GmailService gmailService;
        private GmailController gmailController;

        private final UUID testUserId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        private final UUID testWorkspaceId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        private User testUser;
        private Workspace testWorkspace;
        private ConnectedAccount testAccount;

        @BeforeEach
        void setUp() {
            tokenEncryptionService = new TokenEncryptionService("test_secret_key_minimum_32_bytes_length_for_aes_gcm");
            gmailService = new GmailService(
                    connectedAccountRepository,
                    tokenEncryptionService,
                    gmailApiClient,
                    threadRepository,
                    emailRepository,
                    workspaceRepository,
                    "test-google-client-id",
                    "test-google-client-secret"
            );

            accessDeniedTriggered = false;
            validatedAccessCalled = false;
            workspaceAuthorizationService = new WorkspaceAuthorizationService(null, null) {
                @Override
                public WorkspaceAuthorizationService.WorkspaceMemberAccess validateAccess(UUID workspaceId, User user) {
                    validatedAccessCalled = true;
                    if (accessDeniedTriggered) {
                        throw new WorkspaceAccessDeniedException("Workspace access denied");
                    }
                    return null;
                }
            };

            gmailController = new GmailController(
                    gmailService,
                    workspaceAuthorizationService,
                    "https://inbox.jiosi.online",
                    "https://jiosi-inbox-api.onrender.com"
            );

            testUser = new User("user@jiosi.online", "Test User", null);
            testUser.setId(testUserId);
            testWorkspace = new Workspace("Primary Workspace", "primary-workspace", testUser);
            testWorkspace.setId(testWorkspaceId);

            testAccount = new ConnectedAccount(testUser, "gmail", "user@jiosi.online", "CONNECTED");
            testAccount.setId(UUID.fromString("33333333-3333-3333-3333-333333333333"));
            testAccount.setWorkspace(testWorkspace);
            testAccount.setAccessTokenEncrypted(tokenEncryptionService.encrypt("valid_access_token"));
            testAccount.setRefreshTokenEncrypted(tokenEncryptionService.encrypt("valid_refresh_token"));
            testAccount.setTokenExpiresAt(Instant.now().plusSeconds(3600));

            UserContext.set(testUser, "OWNER");
        }

        @org.junit.jupiter.api.AfterEach
        void tearDown() {
            UserContext.clear();
        }

        @Test
        @DisplayName("Synchronizes new Gmail messages, persists EmailThread and Email entities, and updates metadata")
        void shouldSynchronizeAndPersistNewGmailMessages() throws Exception {
            when(workspaceRepository.findById(testWorkspaceId)).thenReturn(Optional.of(testWorkspace));
            when(connectedAccountRepository.findFirstByUserIdAndWorkspaceIdAndProvider(testUserId, testWorkspaceId, "gmail"))
                    .thenReturn(Optional.of(testAccount));

            String listJson = "{\"messages\": [{\"id\": \"msg-101\", \"threadId\": \"th-101\"}], \"nextPageToken\": \"next-page-tok\", \"resultSizeEstimate\": 1}";
            when(gmailApiClient.listMessages("valid_access_token", 25, null, "in:inbox"))
                    .thenReturn(objectMapper.readTree(listJson));

            when(emailRepository.existsByAccountIdAndExternalMessageId(testAccount.getId(), "msg-101"))
                    .thenReturn(false);

            String detailJson = "{" +
                    "\"id\": \"msg-101\"," +
                    "\"threadId\": \"th-101\"," +
                    "\"snippet\": \"Alex, attached is the revised term sheet...\"," +
                    "\"internalDate\": \"1700000000000\"," +
                    "\"labelIds\": [\"UNREAD\", \"INBOX\", \"STARRED\"]," +
                    "\"payload\": {" +
                    "  \"headers\": [" +
                    "    {\"name\": \"Subject\", \"value\": \"Q3 Seed Extension Term Sheet\"}," +
                    "    {\"name\": \"From\", \"value\": \"Sarah Jenkins <sarah@kinto.ventures>\"}," +
                    "    {\"name\": \"To\", \"value\": \"alex@jiosi.online\"}" +
                    "  ]" +
                    "}" +
                    "}";
            when(gmailApiClient.getMessage("valid_access_token", "msg-101"))
                    .thenReturn(objectMapper.readTree(detailJson));

            when(threadRepository.findByAccountIdAndExternalThreadId(testAccount.getId(), "th-101"))
                    .thenReturn(Optional.empty());
            when(threadRepository.findByWorkspaceIdAndExternalThreadId(testWorkspace.getId(), "th-101"))
                    .thenReturn(Optional.empty());

            when(threadRepository.save(any(EmailThread.class))).thenAnswer(inv -> {
                EmailThread t = inv.getArgument(0);
                t.setId(UUID.randomUUID());
                return t;
            });

            GmailSyncResponse response = gmailService.syncInboxMessages(testUserId, testWorkspaceId, 25);

            assertThat(response).isNotNull();
            assertThat(response.syncedCount()).isEqualTo(1);
            assertThat(response.newMessagesCount()).isEqualTo(1);
            assertThat(response.existingMessagesCount()).isEqualTo(0);
            assertThat(response.failedMessagesCount()).isEqualTo(0);
            assertThat(response.nextPageToken()).isEqualTo("next-page-tok");

            ArgumentCaptor<EmailThread> threadCaptor = ArgumentCaptor.forClass(EmailThread.class);
            verify(threadRepository, atLeastOnce()).save(threadCaptor.capture());
            EmailThread savedThread = threadCaptor.getValue();
            assertThat(savedThread.getSubject()).isEqualTo("Q3 Seed Extension Term Sheet");
            assertThat(savedThread.getSenderEmail()).isEqualTo("sarah@kinto.ventures");
            assertThat(savedThread.getExternalThreadId()).isEqualTo("th-101");
            assertThat(savedThread.isUnread()).isTrue();
            assertThat(savedThread.isStarred()).isTrue();

            ArgumentCaptor<Email> emailCaptor = ArgumentCaptor.forClass(Email.class);
            verify(emailRepository).save(emailCaptor.capture());
            Email savedEmail = emailCaptor.getValue();
            assertThat(savedEmail.getExternalMessageId()).isEqualTo("msg-101");
            assertThat(savedEmail.getSenderName()).isEqualTo("Sarah Jenkins");
            assertThat(savedEmail.getSenderEmail()).isEqualTo("sarah@kinto.ventures");
            assertThat(savedEmail.getBodyText()).contains("Alex, attached is the revised term sheet");

            verify(connectedAccountRepository).save(testAccount);
            assertThat(testAccount.getLastSyncAt()).isNotNull();
        }

        @Test
        @DisplayName("Enforces idempotency: does not duplicate already-imported messages")
        void shouldEnforceIdempotencyAndSkipExistingMessages() throws Exception {
            when(workspaceRepository.findById(testWorkspaceId)).thenReturn(Optional.of(testWorkspace));
            when(connectedAccountRepository.findFirstByUserIdAndWorkspaceIdAndProvider(testUserId, testWorkspaceId, "gmail"))
                    .thenReturn(Optional.of(testAccount));

            String listJson = "{\"messages\": [{\"id\": \"msg-duplicate\", \"threadId\": \"th-duplicate\"}], \"resultSizeEstimate\": 1}";
            when(gmailApiClient.listMessages("valid_access_token", 25, null, "in:inbox"))
                    .thenReturn(objectMapper.readTree(listJson));

            // Message already persisted in database
            when(emailRepository.existsByAccountIdAndExternalMessageId(testAccount.getId(), "msg-duplicate"))
                    .thenReturn(true);

            GmailSyncResponse response = gmailService.syncInboxMessages(testUserId, testWorkspaceId, 25);

            assertThat(response.syncedCount()).isEqualTo(0);
            assertThat(response.newMessagesCount()).isEqualTo(0);
            assertThat(response.existingMessagesCount()).isEqualTo(1);
            assertThat(response.failedMessagesCount()).isEqualTo(0);

            // Verified: detail fetch and save are bypassed for duplicate
            verify(gmailApiClient, never()).getMessage(anyString(), anyString());
            verify(emailRepository, never()).save(any(Email.class));
        }

        @Test
        @DisplayName("Updates existing thread metadata and message count when a new reply arrives in thread")
        void shouldUpdateExistingThreadWhenNewReplyArrives() throws Exception {
            when(workspaceRepository.findById(testWorkspaceId)).thenReturn(Optional.of(testWorkspace));
            when(connectedAccountRepository.findFirstByUserIdAndWorkspaceIdAndProvider(testUserId, testWorkspaceId, "gmail"))
                    .thenReturn(Optional.of(testAccount));

            String listJson = "{\"messages\": [{\"id\": \"msg-reply-2\", \"threadId\": \"th-existing\"}]}";
            when(gmailApiClient.listMessages("valid_access_token", 25, null, "in:inbox"))
                    .thenReturn(objectMapper.readTree(listJson));

            when(emailRepository.existsByAccountIdAndExternalMessageId(testAccount.getId(), "msg-reply-2"))
                    .thenReturn(false);

            String detailJson = "{" +
                    "\"id\": \"msg-reply-2\"," +
                    "\"threadId\": \"th-existing\"," +
                    "\"snippet\": \"Latest reply to thread\"," +
                    "\"internalDate\": \"1700050000000\"," +
                    "\"labelIds\": [\"UNREAD\", \"INBOX\"]," +
                    "\"payload\": {" +
                    "  \"headers\": [" +
                    "    {\"name\": \"Subject\", \"value\": \"Re: Q3 Extension\"}," +
                    "    {\"name\": \"From\", \"value\": \"Elena Rostova <elena@partner.com>\"}," +
                    "    {\"name\": \"To\", \"value\": \"user@jiosi.online\"}" +
                    "  ]" +
                    "}" +
                    "}";
            when(gmailApiClient.getMessage("valid_access_token", "msg-reply-2"))
                    .thenReturn(objectMapper.readTree(detailJson));

            EmailThread existingThread = new EmailThread();
            existingThread.setId(UUID.randomUUID());
            existingThread.setWorkspace(testWorkspace);
            existingThread.setAccount(testAccount);
            existingThread.setExternalThreadId("th-existing");
            existingThread.setMessageCount(1);
            existingThread.setLastMessageAt(Instant.ofEpochMilli(1700000000000L));

            when(threadRepository.findByAccountIdAndExternalThreadId(testAccount.getId(), "th-existing"))
                    .thenReturn(Optional.of(existingThread));
            when(threadRepository.save(existingThread)).thenReturn(existingThread);

            GmailSyncResponse response = gmailService.syncInboxMessages(testUserId, testWorkspaceId, 25);

            assertThat(response.newMessagesCount()).isEqualTo(1);
            assertThat(existingThread.getMessageCount()).isEqualTo(2);
            assertThat(existingThread.getLastMessageAt()).isEqualTo(Instant.ofEpochMilli(1700050000000L));
            assertThat(existingThread.isUnread()).isTrue();
            verify(emailRepository).save(any(Email.class));
        }

        @Test
        @DisplayName("Handles empty Gmail inbox without failure")
        void shouldHandleEmptyGmailInboxCleanly() throws Exception {
            when(workspaceRepository.findById(testWorkspaceId)).thenReturn(Optional.of(testWorkspace));
            when(connectedAccountRepository.findFirstByUserIdAndWorkspaceIdAndProvider(testUserId, testWorkspaceId, "gmail"))
                    .thenReturn(Optional.of(testAccount));

            when(gmailApiClient.listMessages("valid_access_token", 25, null, "in:inbox"))
                    .thenReturn(objectMapper.readTree("{\"messages\": [], \"resultSizeEstimate\": 0}"));

            GmailSyncResponse response = gmailService.syncInboxMessages(testUserId, testWorkspaceId, 25);

            assertThat(response.syncedCount()).isEqualTo(0);
            assertThat(response.newMessagesCount()).isEqualTo(0);
            assertThat(response.existingMessagesCount()).isEqualTo(0);
            assertThat(response.failedMessagesCount()).isEqualTo(0);

            verify(emailRepository, never()).save(any());
        }

        @Test
        @DisplayName("Handles individual message fetch failures gracefully and reports failed count")
        void shouldHandlePartialFetchFailureGracefully() throws Exception {
            when(workspaceRepository.findById(testWorkspaceId)).thenReturn(Optional.of(testWorkspace));
            when(connectedAccountRepository.findFirstByUserIdAndWorkspaceIdAndProvider(testUserId, testWorkspaceId, "gmail"))
                    .thenReturn(Optional.of(testAccount));

            String listJson = "{\"messages\": [{\"id\": \"msg-ok\", \"threadId\": \"th-ok\"}, {\"id\": \"msg-broken\", \"threadId\": \"th-broken\"}]}";
            when(gmailApiClient.listMessages("valid_access_token", 25, null, "in:inbox"))
                    .thenReturn(objectMapper.readTree(listJson));

            when(emailRepository.existsByAccountIdAndExternalMessageId(testAccount.getId(), "msg-ok"))
                    .thenReturn(false);
            when(emailRepository.existsByAccountIdAndExternalMessageId(testAccount.getId(), "msg-broken"))
                    .thenReturn(false);

            String detailJson = "{\"id\": \"msg-ok\", \"threadId\": \"th-ok\", \"snippet\": \"ok\", \"payload\": {}}";
            when(gmailApiClient.getMessage("valid_access_token", "msg-ok"))
                    .thenReturn(objectMapper.readTree(detailJson));
            when(gmailApiClient.getMessage("valid_access_token", "msg-broken"))
                    .thenThrow(new GmailApiException("Transient rate limit error", 429));

            when(threadRepository.save(any(EmailThread.class))).thenAnswer(inv -> inv.getArgument(0));

            GmailSyncResponse response = gmailService.syncInboxMessages(testUserId, testWorkspaceId, 25);

            assertThat(response.syncedCount()).isEqualTo(1);
            assertThat(response.newMessagesCount()).isEqualTo(1);
            assertThat(response.failedMessagesCount()).isEqualTo(1);
        }

        @Test
        @DisplayName("POST /api/v1/gmail/sync validates workspace and executes authorized sync")
        void shouldExecuteAuthorizedSyncViaController() throws Exception {
            when(workspaceRepository.findById(testWorkspaceId)).thenReturn(Optional.of(testWorkspace));
            when(connectedAccountRepository.findFirstByUserIdAndWorkspaceIdAndProvider(testUserId, testWorkspaceId, "gmail"))
                    .thenReturn(Optional.of(testAccount));

            when(gmailApiClient.listMessages("valid_access_token", 10, "test-page-token", "in:inbox"))
                    .thenReturn(objectMapper.readTree("{\"messages\": []}"));

            GmailSyncRequest request = new GmailSyncRequest(10, "test-page-token");
            ResponseEntity<ApiResponse<GmailSyncResponse>> responseEntity = gmailController.sync(testWorkspaceId, request);

            assertThat(responseEntity.getStatusCode().is2xxSuccessful()).isTrue();
            assertThat(responseEntity.getBody()).isNotNull();
            assertThat(responseEntity.getBody().success()).isTrue();

            assertThat(validatedAccessCalled).isTrue();
        }

        @Test
        @DisplayName("POST /api/v1/gmail/sync rejects requests when workspace authorization fails")
        void shouldRejectWhenWorkspaceAccessDenied() {
            accessDeniedTriggered = true;
            assertThatThrownBy(() -> gmailController.sync(testWorkspaceId, new GmailSyncRequest(25, null)))
                    .isInstanceOf(WorkspaceAccessDeniedException.class)
                    .hasMessageContaining("Workspace access denied");
        }

        @Test
        @DisplayName("POST /api/v1/gmail/sync rejects requests missing X-Workspace-Id header")
        void shouldRejectSyncMissingWorkspaceId() {
            ResponseEntity<ApiResponse<GmailSyncResponse>> responseEntity = gmailController.sync(null, new GmailSyncRequest(25, null));

            assertThat(responseEntity.getStatusCode().value()).isEqualTo(400);
            assertThat(responseEntity.getBody().message()).contains("Workspace ID is required");
        }
    }
}
