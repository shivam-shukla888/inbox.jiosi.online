package com.jiosi.inbox.ai;

import com.jiosi.inbox.ai.dto.ActionItemDto;
import com.jiosi.inbox.ai.service.ScoringEngine;
import com.jiosi.inbox.email.Email;
import com.jiosi.inbox.email.EmailThread;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class ScoringEngineTests {

    private ScoringEngine scoringEngine;
    private Instant baseTime;

    @BeforeEach
    void setUp() {
        scoringEngine = new ScoringEngine();
        baseTime = Instant.parse("2026-11-15T10:00:00Z");
    }

    @Test
    @DisplayName("Direct recipient with explicit deadline and high impact receives high importance and urgency")
    void testDirectRecipientWithDeadline() {
        EmailThread thread = new EmailThread();
        thread.setSubject("CRITICAL: Production Outage - Database Connection Pool Exhausted");
        thread.setSnippet("Service is down. Please review immediate fix and restart pods.");
        thread.setRecipientEmail("engineer@jiosi.online");
        thread.setNeedsReply(true);

        Email message = new Email();
        message.setSenderEmail("oncall@jiosi.online");
        message.setRecipientEmail("engineer@jiosi.online");
        message.setSubject(thread.getSubject());
        message.setSnippet(thread.getSnippet());

        Instant deadline = baseTime.plus(4, ChronoUnit.HOURS); // Within 24h
        ActionItemDto action = new ActionItemDto("Restart pods", "engineer@jiosi.online", deadline.toString(), "restart pods", 0.95);

        ScoringEngine.TriageScores scores = scoringEngine.calculateScores(
                thread,
                List.of(message),
                "engineer@jiosi.online",
                List.of(action),
                deadline,
                "primary",
                false,
                false,
                baseTime
        );

        assertThat(scores.importanceScore()).isGreaterThanOrEqualTo(75);
        assertThat(scores.urgencyScore()).isGreaterThanOrEqualTo(75);
        assertThat(scores.needsReply()).isTrue();
        assertThat(scores.category()).isEqualTo("primary");
    }

    @Test
    @DisplayName("ASAP and exclamation mark alone do NOT produce high urgency")
    void testAsapAloneDoesNotProduceHighUrgency() {
        EmailThread thread = new EmailThread();
        thread.setSubject("Please check this ASAP!!!");
        thread.setSnippet("Can you look at these design mockups immediately whenever you have time?");
        thread.setRecipientEmail("designer@jiosi.online");

        Email message = new Email();
        message.setSenderEmail("colleague@jiosi.online");
        message.setRecipientEmail("designer@jiosi.online");
        message.setSubject(thread.getSubject());
        message.setSnippet(thread.getSnippet());

        ScoringEngine.TriageScores scores = scoringEngine.calculateScores(
                thread,
                List.of(message),
                "designer@jiosi.online",
                List.of(),
                null, // No explicit deadline
                "primary",
                false,
                false,
                baseTime
        );

        // Urgency must remain capped at low score (< 40)
        assertThat(scores.urgencyScore()).isLessThanOrEqualTo(30);
    }

    @Test
    @DisplayName("Newsletter with List-Unsubscribe is classified as newsletter and capped in urgency")
    void testNewsletterClassification() {
        EmailThread thread = new EmailThread();
        thread.setSubject("Substack: Weekly Engineering Digest #42");
        thread.setSnippet("Top engineering practices in 2026. Click here to unsubscribe.");
        thread.setRecipientEmail("user@jiosi.online");

        ScoringEngine.TriageScores scores = scoringEngine.calculateScores(
                thread,
                List.of(),
                "user@jiosi.online",
                List.of(),
                null,
                "newsletter",
                false,
                true, // hasListUnsubscribeHeader
                baseTime
        );

        assertThat(scores.category()).isEqualTo("newsletter");
        assertThat(scores.urgencyScore()).isLessThanOrEqualTo(20);
        assertThat(scores.importanceScore()).isLessThanOrEqualTo(35);
        assertThat(scores.needsReply()).isFalse();
    }

    @Test
    @DisplayName("Gmail SPAM tag classifies as gmail_spam with minimal importance")
    void testGmailSpamTag() {
        EmailThread thread = new EmailThread();
        thread.setSubject("You won $10,000,000 lottery");
        thread.setSnippet("Send your bank account details now");
        thread.setRecipientEmail("user@jiosi.online");
        thread.setTags(Set.of("SPAM"));

        ScoringEngine.TriageScores scores = scoringEngine.calculateScores(
                thread,
                List.of(),
                "user@jiosi.online",
                List.of(),
                null,
                "spam",
                true, // hasGmailSpamLabel
                false,
                baseTime
        );

        assertThat(scores.category()).isEqualTo("gmail_spam");
        assertThat(scores.importanceScore()).isLessThanOrEqualTo(10);
        assertThat(scores.needsReply()).isFalse();
    }

    @Test
    @DisplayName("Transactional receipt is classified as transactional and does not need reply")
    void testTransactionalReceipt() {
        EmailThread thread = new EmailThread();
        thread.setSubject("Your receipt for Stripe Subscription (Invoice #1042)");
        thread.setSnippet("Thank you for your payment of $49.00. Payment received successfully.");
        thread.setRecipientEmail("finance@jiosi.online");

        ScoringEngine.TriageScores scores = scoringEngine.calculateScores(
                thread,
                List.of(),
                "finance@jiosi.online",
                List.of(),
                null,
                "transactional",
                false,
                false,
                baseTime
        );

        assertThat(scores.category()).isEqualTo("transactional");
        assertThat(scores.needsReply()).isFalse();
    }

    @Test
    @DisplayName("Phishing attempt with password theft keywords is categorized as suspicious")
    void testSuspiciousPhishing() {
        EmailThread thread = new EmailThread();
        thread.setSubject("URGENT: Verify your password now or account suspended within 24 hours");
        thread.setSnippet("Click here to claim and verify your password or transfer funds immediately.");
        thread.setRecipientEmail("user@jiosi.online");

        ScoringEngine.TriageScores scores = scoringEngine.calculateScores(
                thread,
                List.of(),
                "user@jiosi.online",
                List.of(),
                null,
                "suspicious",
                false,
                false,
                baseTime
        );

        assertThat(scores.category()).isEqualTo("suspicious");
    }
}

