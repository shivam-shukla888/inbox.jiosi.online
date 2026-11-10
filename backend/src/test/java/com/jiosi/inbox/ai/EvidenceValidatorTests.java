package com.jiosi.inbox.ai;

import com.jiosi.inbox.ai.service.EvidenceValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EvidenceValidatorTests {

    private EvidenceValidator validator;

    @BeforeEach
    void setUp() {
        validator = new EvidenceValidator();
    }

    @Test
    @DisplayName("Exact quote match is validated")
    void testExactQuoteMatch() {
        String source = "Hi Alex, please send the signed term sheet by Thursday 2:00 PM.";
        String quote = "please send the signed term sheet by Thursday 2:00 PM";
        assertThat(validator.isValidEvidence(quote, source)).isTrue();
    }

    @Test
    @DisplayName("Case and whitespace normalized quote match is validated")
    void testNormalizedQuoteMatch() {
        String source = "We need the\n   API specs finalized\n   before tomorrow.";
        String quote = "api specs finalized before tomorrow";
        assertThat(validator.isValidEvidence(quote, source)).isTrue();
    }

    @Test
    @DisplayName("Hallucinated quote not in source is rejected")
    void testHallucinatedQuoteRejected() {
        String source = "Hi Alex, our team had a great meeting today. Looking forward to our next sync.";
        String quote = "Alex agreed to pay $50,000 upfront by Friday";
        assertThat(validator.isValidEvidence(quote, source)).isFalse();
    }

    @Test
    @DisplayName("Empty or null quotes are rejected")
    void testEmptyQuoteRejected() {
        assertThat(validator.isValidEvidence(null, "some text")).isFalse();
        assertThat(validator.isValidEvidence("", "some text")).isFalse();
        assertThat(validator.isValidEvidence("   ", "some text")).isFalse();
        assertThat(validator.isValidEvidence("valid", null)).isFalse();
    }

    @Test
    @DisplayName("filterValidEvidence retains only grounded quotes")
    void testFilterValidEvidence() {
        String source = "The security audit is complete. Please verify DNS records. Deployment is scheduled for Friday.";
        List<String> rawQuotes = List.of(
                "Please verify DNS records",
                "Deployment is scheduled for Friday",
                "The CEO approved a 20% bonus" // Hallucinated
        );

        List<String> valid = validator.filterValidEvidence(rawQuotes, source);
        assertThat(valid).hasSize(2);
        assertThat(valid).containsExactly(
                "Please verify DNS records",
                "Deployment is scheduled for Friday"
        );
    }
}

