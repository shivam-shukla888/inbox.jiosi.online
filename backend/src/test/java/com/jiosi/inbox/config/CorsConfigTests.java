package com.jiosi.inbox.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CorsConfigTests {

    @Test
    @DisplayName("CORS allows configured web origins and rejects wildcards with credentials")
    void testCorsAllowedOriginsAndWildcardHandling() {
        CorsConfig corsConfig = new CorsConfig();
        corsConfig.setAllowedOrigins("https://inbox.jiosi.online, http://localhost:5173, *");
        corsConfig.setAllowedExtensionIds("");

        UrlBasedCorsConfigurationSource source = corsConfig.corsConfigurationSource();
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/threads");
        CorsConfiguration config = source.getCorsConfiguration(request);

        assertThat(config).isNotNull();
        assertThat(config.getAllowCredentials()).isTrue();
        // Wildcard '*' MUST be discarded when credentials are true
        assertThat(config.getAllowedOrigins()).contains("https://inbox.jiosi.online", "http://localhost:5173");
        assertThat(config.getAllowedOrigins()).doesNotContain("*");
    }

    @Test
    @DisplayName("CORS allows exact configured Chrome extension IDs matching ^[a-p]{32}$")
    void testCorsAllowedExtensionIds() {
        CorsConfig corsConfig = new CorsConfig();
        corsConfig.setAllowedOrigins("https://inbox.jiosi.online");
        // 'abcdefghijklmnopabcdefghijklmnop' is 32 chars of [a-p]
        String validId1 = "abcdefghijklmnopabcdefghijklmnop";
        String validId2 = "ppoooonnmmllkkjjiihhggffeeddccbb";
        String invalidIdWrongChars = "abcdefghijklmnopqrstuvwxyz123456"; // contains q-z and digits
        String invalidIdTooShort = "abcde";

        corsConfig.setAllowedExtensionIds(String.join(",", List.of(validId1, validId2, invalidIdWrongChars, invalidIdTooShort)));

        UrlBasedCorsConfigurationSource source = corsConfig.corsConfigurationSource();
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/ai/daily-brief");
        CorsConfiguration config = source.getCorsConfiguration(request);

        assertThat(config).isNotNull();
        List<String> allowed = config.getAllowedOrigins();
        assertThat(allowed).contains("chrome-extension://" + validId1);
        assertThat(allowed).contains("chrome-extension://" + validId2);
        assertThat(allowed).doesNotContain("chrome-extension://" + invalidIdWrongChars);
        assertThat(allowed).doesNotContain("chrome-extension://" + invalidIdTooShort);
        assertThat(allowed).doesNotContain(invalidIdWrongChars);
    }

    @Test
    @DisplayName("CORS matches allowed origin and rejects disallowed origin")
    void testOriginMatching() {
        CorsConfig corsConfig = new CorsConfig();
        corsConfig.setAllowedOrigins("https://inbox.jiosi.online");
        corsConfig.setAllowedExtensionIds("abcdefghijklmnopabcdefghijklmnop");

        UrlBasedCorsConfigurationSource source = corsConfig.corsConfigurationSource();
        CorsConfiguration config = source.getCorsConfiguration(new MockHttpServletRequest("GET", "/api/v1/threads"));
        assertThat(config).isNotNull();

        // Allowed Web Origin
        assertThat(config.checkOrigin("https://inbox.jiosi.online")).isEqualTo("https://inbox.jiosi.online");

        // Allowed Extension Origin
        assertThat(config.checkOrigin("chrome-extension://abcdefghijklmnopabcdefghijklmnop"))
                .isEqualTo("chrome-extension://abcdefghijklmnopabcdefghijklmnop");

        // Disallowed Origins
        assertThat(config.checkOrigin("https://malicious-site.com")).isNull();
        assertThat(config.checkOrigin("chrome-extension://unauthorizedextensionidunauthoriz")).isNull();
    }
}

