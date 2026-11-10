package com.jiosi.inbox.ai.service;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
public class EvidenceValidator {

    /**
     * Checks whether an extracted quote or evidence statement is grounded in the source text.
     * Performs normalized substring matching (ignoring whitespace variations and case).
     */
    public boolean isValidEvidence(String quote, String sourceText) {
        if (quote == null || quote.isBlank() || sourceText == null || sourceText.isBlank()) {
            return false;
        }

        String normalizedSource = normalize(sourceText);
        String normalizedQuote = normalize(quote);

        if (normalizedQuote.length() < 3) {
            return false;
        }

        // Direct exact or normalized substring match
        if (normalizedSource.contains(normalizedQuote)) {
            return true;
        }

        // If quote is long, check if a 60% contiguous segment matches (handles minor truncation or ellipsis)
        if (normalizedQuote.length() > 30) {
            int window = Math.min(normalizedQuote.length(), 40);
            String prefix = normalizedQuote.substring(0, window);
            if (normalizedSource.contains(prefix)) {
                return true;
            }
            String suffix = normalizedQuote.substring(normalizedQuote.length() - window);
            if (normalizedSource.contains(suffix)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Filters a list of evidence strings, keeping only those supported by the authorized source text.
     */
    public List<String> filterValidEvidence(List<String> evidenceList, String sourceText) {
        if (evidenceList == null || evidenceList.isEmpty()) {
            return List.of();
        }
        List<String> validList = new ArrayList<>();
        for (String ev : evidenceList) {
            if (isValidEvidence(ev, sourceText)) {
                validList.add(ev.trim());
            }
        }
        return validList;
    }

    private String normalize(String input) {
        return input.toLowerCase(Locale.ROOT)
                .replaceAll("[\\r\\n\\t]+", " ")
                .replaceAll("\\s{2,}", " ")
                .replaceAll("[\"'`“”‘’]", "")
                .trim();
    }
}

