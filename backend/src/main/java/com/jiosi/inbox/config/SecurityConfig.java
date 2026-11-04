package com.jiosi.inbox.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiosi.inbox.security.JwtAuthenticationFilter;
import com.jiosi.inbox.security.OAuth2AuthenticationFailureHandler;
import com.jiosi.inbox.security.OAuth2AuthenticationSuccessHandler;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Map;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
    private final OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler;
    private final UrlBasedCorsConfigurationSource corsConfigurationSource;
    private final ObjectProvider<ClientRegistrationRepository> clientRegistrationRepositoryProvider;
    private final ObjectMapper objectMapper;
    private final String frontendUrl;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler,
            OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler,
            UrlBasedCorsConfigurationSource corsConfigurationSource,
            ObjectProvider<ClientRegistrationRepository> clientRegistrationRepositoryProvider,
            ObjectMapper objectMapper,
            @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.oAuth2AuthenticationSuccessHandler = oAuth2AuthenticationSuccessHandler;
        this.oAuth2AuthenticationFailureHandler = oAuth2AuthenticationFailureHandler;
        this.corsConfigurationSource = corsConfigurationSource;
        this.clientRegistrationRepositoryProvider = clientRegistrationRepositoryProvider;
        this.objectMapper = objectMapper;
        this.frontendUrl = frontendUrl;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        CsrfTokenRequestAttributeHandler requestHandler = new CsrfTokenRequestAttributeHandler();
        requestHandler.setCsrfRequestAttributeName(null);

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf
                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        .csrfTokenRequestHandler(requestHandler)
                        .requireCsrfProtectionMatcher(request -> {
                            // Bearer token authenticated requests are immune to browser CSRF
                            String authHeader = request.getHeader("Authorization");
                            if (authHeader != null && authHeader.trim().startsWith("Bearer ")) {
                                return false;
                            }
                            // Exclude initial auth endpoints and health
                            String path = request.getRequestURI();
                            if (path.startsWith("/api/v1/auth/google")
                                    || path.startsWith("/api/v1/auth/csrf")
                                    || path.startsWith("/api/v1/health")
                                    || path.startsWith("/oauth2/")
                                    || path.startsWith("/login/oauth2/")) {
                                return false;
                            }
                            // Enforce CSRF on cookie-authenticated state-changing requests
                            String method = request.getMethod();
                            return "POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method)
                                    || "PATCH".equalsIgnoreCase(method) || "DELETE".equalsIgnoreCase(method);
                        })
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                        .sessionFixation(sf -> sf.migrateSession())
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                "/api/v1/health",
                                "/api/v1/auth/csrf",
                                "/api/v1/auth/google",
                                "/oauth2/**",
                                "/login/oauth2/**"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> {
                    clientRegistrationRepositoryProvider.ifAvailable(repo -> {
                        oauth2.authorizationEndpoint(authEndpoint -> authEndpoint
                                .authorizationRequestResolver(new CustomOAuth2AuthorizationRequestResolver(repo, frontendUrl))
                        );
                    });
                    oauth2.successHandler(oAuth2AuthenticationSuccessHandler);
                    oauth2.failureHandler(oAuth2AuthenticationFailureHandler);
                })
                .logout(logout -> logout
                        .logoutUrl("/api/v1/auth/logout")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID", "XSRF-TOKEN")
                        .logoutSuccessHandler((request, response, authentication) -> {
                            response.setStatus(HttpServletResponse.SC_OK);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            objectMapper.writeValue(response.getWriter(), Map.of(
                                    "success", true,
                                    "message", "Logged out successfully"
                            ));
                        })
                )
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            objectMapper.writeValue(response.getWriter(), Map.of(
                                    "success", false,
                                    "code", "UNAUTHORIZED",
                                    "message", "Authentication required: missing or invalid credentials"
                            ));
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            objectMapper.writeValue(response.getWriter(), Map.of(
                                    "success", false,
                                    "code", "WORKSPACE_ACCESS_DENIED",
                                    "message", "Access denied: insufficient permissions"
                            ));
                        })
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
