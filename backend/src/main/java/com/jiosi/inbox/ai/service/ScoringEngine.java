package com.jiosi.inbox.ai.service;

import com.jiosi.inbox.ai.dto.ActionItemDto;
import com.jiosi.inbox.email.Email;
import com.jiosi.inbox.email.EmailThread;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.regex.Pattern;

@Component
public class ScoringEngine {

    private static final Pattern HIGH_IMPACT_PATTERN = Pattern.compile(
            "(?i)\\b(outage|incident|p0|p1|downtime|security\\s+alert|vulnerability|breach|contract|agreement|legal|lawsuit|wire\\s+transfer|payment\\s+failed|invoice\\s+overdue|tax\\s+filing|board\\s+resolution|signing\\s+required)\\b"
    );

    private static final Pattern ASAP_TONE_ONLY_PATTERN = Pattern.compile(
            "(?i)\\b(asap|urgent!?|immediately|right\\s+away)\\b"
    );

    private static final Pattern TRANSACTIONAL_PATTERN = Pattern.compile(
            "(?i)\\b(receipt|invoice|order\\s+confirmed|tracking\\s+number|shipped|delivery|payment\\s+received|subscription\\s+renewed|account\\s+created|password\\s+reset|verify\\s+your\\s+email)\\b"
    );

    private static final Pattern NEWSLETTER_PATTERN = Pattern.compile(
            "(?i)\\b(newsletter|weekly\\s+digest|roundup|edition\\s+#|unsubscribe|view\\s+in\\s+browser)\\b"
    );

    private static final Pattern SUSPICIOUS_PATTERN = Pattern.compile(
            "(?i)\\b(verify\\s+your\\s+password|account\\s+suspended\\s+within\\s+24|click\\s+here\\s+to\\s+claim|crypto\\s+wallet|transfer\\s+funds\\s+immediately|dear\\s+beneficiary|western\\s+union)\\b"
    );

    private static final Pattern FREELANCER_PATTERN = Pattern.compile(
            "(?i)\\b(proposal|lead|deliverable|client\\s+approval|scope\\s+change|milestone|contract\\s+terms|payment\\s+terms)\\b"
    );

    private static final Pattern LOCAL_SERVICE_PATTERN = Pattern.compile(
            "(?i)\\b(booking|appointment|cancellation|reschedule|customer\\s+complaint|supplier\\s+delay)\\b"
    );

    private static final Pattern RETAIL_ECOMMERCE_PATTERN = Pattern.compile(
            "(?i)\\b(refund\\s+request|order\\s+delayed|return\\s+request|dispute|chargeback|gateway\\s+failure)\\b"
    );

    private static final Pattern PROFESSIONAL_SERVICES_PATTERN = Pattern.compile(
            "(?i)\\b(tax\\s+deadline|compliance|audit|regulatory\\s+filing|contract\\s+review|retainer)\\b"
    );

    private static final Pattern SMALL_SAAS_PATTERN = Pattern.compile(
            "(?i)\\b(p0|p1|outage|downtime|churn|renewal|enterprise\\s+deal|data\\s+loss|incident)\\b"
    );

    public record TriageScores(
            String category,
            int importanceScore,
            String importanceReason,
            int urgencyScore,
            String urgencyReason,
            boolean needsReply,
            Instant deadline
    ) {}

    /**
     * Backward-compatible overload for calculateScores without profile context.
     */
    public TriageScores calculateScores(
            EmailThread thread,
            List<Email> messages,
            String userEmail,
            List<ActionItemDto> actionItems,
            Instant parsedDeadline,
            String modelCategorySuggestion,
            boolean hasGmailSpamLabel,
            boolean hasListUnsubscribeHeader,
            Instant now
    ) {
        return calculateScores(
                thread,
                messages,
                userEmail,
                actionItems,
                parsedDeadline,
                modelCategorySuggestion,
                hasGmailSpamLabel,
                hasListUnsubscribeHeader,
                false,
                "generic",
                "UTC",
                now
        );
    }

    /**
     * Computes explainable importance and urgency scores along with conservative category suggestion,
     * incorporating small-business workflow profile, VIP contact relationship, and business timezone.
     */
    public TriageScores calculateScores(
            EmailThread thread,
            List<Email> messages,
            String userEmail,
            List<ActionItemDto> actionItems,
            Instant parsedDeadline,
            String modelCategorySuggestion,
            boolean hasGmailSpamLabel,
            boolean hasListUnsubscribeHeader,
            boolean isVipContact,
            String profileType,
            String userTimezone,
            Instant now
    ) {
        if (now == null) {
            now = Instant.now();
        }

        String subject = thread.getSubject() != null ? thread.getSubject() : "";
        String snippet = thread.getSnippet() != null ? thread.getSnippet() : "";
        String fullText = subject + " " + snippet;

        Email latestMessage = (messages != null && !messages.isEmpty()) ? messages.get(messages.size() - 1) : null;
        boolean isDirectRecipient = isUserDirectRecipient(latestMessage, thread, userEmail);
        boolean isLatestInbound = latestMessage != null && !isSenderUser(latestMessage, userEmail);

        // -------------------------------------------------------------
        // 1. CATEGORY CLASSIFICATION (Conservative, high precision)
        // -------------------------------------------------------------
        String category = resolveCategory(
                fullText,
                modelCategorySuggestion,
                hasGmailSpamLabel,
                hasListUnsubscribeHeader
        );

        // -------------------------------------------------------------
        // 2. IMPORTANCE SCORING (0-100)
        // -------------------------------------------------------------
        int importance = 0;
        List<String> importanceReasons = new ArrayList<>();

        if (isDirectRecipient) {
            importance += 25;
            importanceReasons.add("Sent directly to your address");
        } else {
            importance += 10;
        }

        if (isVipContact) {
            importance += 30;
            importanceReasons.add("Sender is in your configured VIP contacts");
        }

        boolean hasHighImpact = HIGH_IMPACT_PATTERN.matcher(fullText).find();
        if (hasHighImpact) {
            importance += 35;
            importanceReasons.add("Contains high-impact operational or financial subject");
        }

        // Profile-specific importance weighting
        if (profileType != null && !profileType.equalsIgnoreCase("generic")) {
            boolean matchesProfile = switch (profileType.toLowerCase(Locale.ROOT)) {
                case "freelancer_agency" -> FREELANCER_PATTERN.matcher(fullText).find();
                case "local_service" -> LOCAL_SERVICE_PATTERN.matcher(fullText).find();
                case "retail_ecommerce" -> RETAIL_ECOMMERCE_PATTERN.matcher(fullText).find();
                case "professional_services" -> PROFESSIONAL_SERVICES_PATTERN.matcher(fullText).find();
                case "small_saas" -> SMALL_SAAS_PATTERN.matcher(fullText).find();
                default -> false;
            };

            if (matchesProfile) {
                importance += 20;
                importanceReasons.add("Matches " + formatProfileName(profileType) + " workflow priorities");
            }
        }

        if (actionItems != null && !actionItems.isEmpty()) {
            importance += 25;
            importanceReasons.add("Contains explicit action items or tasks");
        } else if (thread.isNeedsReply()) {
            importance += 15;
            importanceReasons.add("Awaiting your input");
        }

        // Newsletters and marketing promos have lower baseline importance
        if ("newsletter".equals(category) || "promotional".equals(category)) {
            importance = Math.min(importance, 35);
        } else if ("spam".equals(category) || "gmail_spam".equals(category)) {
            importance = Math.min(importance, 10);
        }

        importance = Math.min(100, Math.max(0, importance));
        String importanceReason = importanceReasons.isEmpty() ? "Standard correspondence" : String.join("; ", importanceReasons);

        // -------------------------------------------------------------
        // 3. URGENCY SCORING (0-100)
        // -------------------------------------------------------------
        int urgency = 0;
        List<String> urgencyReasons = new ArrayList<>();

        if (parsedDeadline != null) {
            Duration timeRemaining = Duration.between(now, parsedDeadline);
            if (!timeRemaining.isNegative()) {
                long hoursRemaining = timeRemaining.toHours();
                if (hoursRemaining <= 24) {
                    urgency += 50;
                    urgencyReasons.add("Explicit deadline within 24 hours");
                } else if (hoursRemaining <= 48) {
                    urgency += 35;
                    urgencyReasons.add("Explicit deadline within 48 hours");
                } else if (hoursRemaining <= 168) { // 7 days
                    urgency += 20;
                    urgencyReasons.add("Deadline within this week");
                }
            } else {
                urgency += 15;
                urgencyReasons.add("Past due deadline");
            }

            // Timezone awareness for today's deadline
            try {
                ZoneId zone = (userTimezone != null && !userTimezone.isBlank()) ? ZoneId.of(userTimezone) : ZoneId.of("UTC");
                ZonedDateTime userNow = now.atZone(zone);
                ZonedDateTime deadlineLocal = parsedDeadline.atZone(zone);
                if (userNow.toLocalDate().isEqual(deadlineLocal.toLocalDate()) && !timeRemaining.isNegative()) {
                    urgency = Math.max(urgency, 60);
                    urgencyReasons.add("Action due today in your business timezone (" + zone.getId() + ")");
                }
            } catch (Exception ignored) {}
        }

        if (hasHighImpact && isLatestInbound) {
            urgency += 30;
            urgencyReasons.add("Active security or operational incident");
        }

        // "ASAP" or exclamation tone alone does NOT produce high urgency, only minor modifier
        if (urgencyReasons.isEmpty() && ASAP_TONE_ONLY_PATTERN.matcher(fullText).find()) {
            urgency += 20;
            urgencyReasons.add("Sender indicated urgency (ASAP)");
        }

        if ("newsletter".equals(category) || "promotional".equals(category) || "spam".equals(category) || "gmail_spam".equals(category)) {
            urgency = Math.min(urgency, 20);
        }

        urgency = Math.min(100, Math.max(0, urgency));
        String urgencyReason = urgencyReasons.isEmpty() ? "No imminent deadline detected" : String.join("; ", urgencyReasons);

        // -------------------------------------------------------------
        // 4. NEEDS-REPLY SUGGESTION
        // -------------------------------------------------------------
        boolean needsReply = false;
        if (isLatestInbound && !"newsletter".equals(category) && !"promotional".equals(category) &&
            !"spam".equals(category) && !"gmail_spam".equals(category) && !"transactional".equals(category)) {

            // If user is directly addressed and email asks for action/response
            if (isDirectRecipient && (thread.isNeedsReply() || (actionItems != null && !actionItems.isEmpty()) || fullText.contains("?"))) {
                needsReply = true;
            }
        }

        return new TriageScores(
                category,
                importance,
                importanceReason,
                urgency,
                urgencyReason,
                needsReply,
                parsedDeadline
        );
    }

    private String resolveCategory(
            String text,
            String modelSuggestion,
            boolean hasGmailSpamLabel,
            boolean hasListUnsubscribeHeader
    ) {
        if (hasGmailSpamLabel) {
            return "gmail_spam";
        }

        // Suspicious / phishing check
        if (SUSPICIOUS_PATTERN.matcher(text).find()) {
            return "suspicious";
        }

        // Bulk / Newsletter check: List-Unsubscribe or List-ID supports newsletter
        if (hasListUnsubscribeHeader || NEWSLETTER_PATTERN.matcher(text).find()) {
            if (text.contains("% off") || text.contains("discount") || text.contains("sale")) {
                return "promotional";
            }
            return "newsletter";
        }

        if (TRANSACTIONAL_PATTERN.matcher(text).find()) {
            return "transactional";
        }

        if (modelSuggestion != null && !modelSuggestion.isBlank()) {
            String lower = modelSuggestion.toLowerCase(Locale.ROOT).trim();
            if (List.of("primary", "transactional", "newsletter", "promotional", "social", "suspicious", "spam").contains(lower)) {
                return lower;
            }
        }

        return "primary";
    }

    private boolean isUserDirectRecipient(Email latestMessage, EmailThread thread, String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            return true;
        }
        String recipient = latestMessage != null ? latestMessage.getRecipientEmail() : thread.getRecipientEmail();
        return recipient != null && recipient.equalsIgnoreCase(userEmail.trim());
    }

    private boolean isSenderUser(Email latestMessage, String userEmail) {
        if (userEmail == null || latestMessage == null || latestMessage.getSenderEmail() == null) {
            return false;
        }
        return latestMessage.getSenderEmail().equalsIgnoreCase(userEmail.trim());
    }

    private String formatProfileName(String profileType) {
        return switch (profileType.toLowerCase(Locale.ROOT)) {
            case "freelancer_agency" -> "Freelancer/Agency";
            case "local_service" -> "Local Service";
            case "retail_ecommerce" -> "Retail/E-commerce";
            case "professional_services" -> "Professional Services";
            case "small_saas" -> "Small SaaS";
            default -> "Business";
        };
    }
}
