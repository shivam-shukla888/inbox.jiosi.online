package com.jiosi.inbox.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Configuration
public class CorsConfig {

    private static final Logger log = LoggerFactory.getLogger(CorsConfig.class);
    private static final Pattern EXTENSION_ID_PATTERN = Pattern.compile("^[a-p]{32}$");
    private static final Pattern FULL_EXTENSION_ORIGIN_PATTERN = Pattern.compile("^chrome-extension://[a-p]{32}$");

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000,https://inbox.jiosi.online}")
    private String allowedOrigins;

    @Value("${app.cors.allowed-extension-ids:}")
    private String allowedExtensionIds;

    public void setAllowedOrigins(String allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    public void setAllowedExtensionIds(String allowedExtensionIds) {
        this.allowedExtensionIds = allowedExtensionIds;
    }

    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);

        List<String> validOrigins = new ArrayList<>();

        if (allowedOrigins != null && !allowedOrigins.isBlank()) {
            for (String origin : allowedOrigins.split(",")) {
                String trimmed = origin.trim();
                if (trimmed.isEmpty()) continue;

                // Explicitly forbid wildcard origin when credentials are enabled
                if ("*".equals(trimmed)) {
                    log.warn("CORS wildcard '*' is forbidden when credentials are enabled. Discarding wildcard origin.");
                    continue;
                }

                if (trimmed.startsWith("chrome-extension://")) {
                    if (FULL_EXTENSION_ORIGIN_PATTERN.matcher(trimmed).matches()) {
                        validOrigins.add(trimmed);
                    } else {
                        log.warn("Discarding invalid Chrome extension origin: {}", trimmed);
                    }
                } else {
                    validOrigins.add(trimmed);
                }
            }
        }

        // Add exact configured Chrome extension IDs
        if (allowedExtensionIds != null && !allowedExtensionIds.isBlank()) {
            for (String extId : allowedExtensionIds.split(",")) {
                String trimmed = extId.trim();
                if (trimmed.isEmpty()) continue;

                if (EXTENSION_ID_PATTERN.matcher(trimmed).matches()) {
                    String extensionOrigin = "chrome-extension://" + trimmed;
                    if (!validOrigins.contains(extensionOrigin)) {
                        validOrigins.add(extensionOrigin);
                    }
                } else if (FULL_EXTENSION_ORIGIN_PATTERN.matcher(trimmed).matches()) {
                    if (!validOrigins.contains(trimmed)) {
                        validOrigins.add(trimmed);
                    }
                } else {
                    log.warn("Discarding invalid Chrome extension ID format: '{}'. Must match ^[a-p]{{32}}$", trimmed);
                }
            }
        }

        log.info("Configuring CORS allowed origins: {}", validOrigins);
        config.setAllowedOrigins(validOrigins);
        config.setAllowedHeaders(List.of("Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With", "X-Workspace-Id", "X-XSRF-TOKEN"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setExposedHeaders(List.of("X-Total-Count", "Link", "XSRF-TOKEN"));
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public CorsFilter corsFilter() {
        return new CorsFilter(corsConfigurationSource());
    }
}
