package com.jiosi.inbox;

import io.github.cdimascio.dotenv.Dotenv;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;

@SpringBootApplication
public class JiosiInboxApplication {

    private static final Logger log = LoggerFactory.getLogger(JiosiInboxApplication.class);

    public static void main(String[] args) {
        loadDotenv();
        SpringApplication.run(JiosiInboxApplication.class, args);
    }

    public static void loadDotenv() {
        // 1. Load base .env
        loadEnvFile(".env");
        // 2. Load .env.local to allow local developer / secret overrides
        loadEnvFile(".env.local");
        // 3. Normalize JDBC URL format if needed
        normalizeDatabaseUrl();
    }

    private static void loadEnvFile(String filename) {
        try {
            File currentEnv = new File(filename);
            File parentEnv = new File("../" + filename);
            File target = currentEnv.exists() ? currentEnv : (parentEnv.exists() ? parentEnv : null);

            if (target != null && target.isFile()) {
                File dir = target.getParentFile();
                Dotenv dotenv = Dotenv.configure()
                        .directory(dir != null ? dir.getAbsolutePath() : ".")
                        .filename(target.getName())
                        .ignoreIfMissing()
                        .load();

                dotenv.entries().forEach(entry -> {
                    String key = entry.getKey();
                    String val = entry.getValue() != null ? entry.getValue().trim() : "";
                    // Set System property so Spring Boot property placeholder resolution picks it up
                    // OS environment variables still take precedence over System properties in Spring
                    if (System.getenv(key) == null) {
                        System.setProperty(key, val);
                    }
                });
                log.info("Loaded environment variables from {}", target.getAbsolutePath());
            }
        } catch (Exception e) {
            log.warn("Could not load {} file: {}", filename, e.getMessage());
        }
    }

    private static void normalizeDatabaseUrl() {
        String dbUrl = System.getProperty("DATABASE_URL");
        if (dbUrl == null) {
            dbUrl = System.getenv("DATABASE_URL");
        }
        if (dbUrl != null && !dbUrl.isBlank()) {
            String trimmed = dbUrl.trim();
            if (trimmed.startsWith("postgres://")) {
                trimmed = "jdbc:postgresql://" + trimmed.substring("postgres://".length());
            } else if (trimmed.startsWith("postgresql://")) {
                trimmed = "jdbc:postgresql://" + trimmed.substring("postgresql://".length());
            }

            // Ensure prepareThreshold=0 is set for PgBouncer pooler compatibility if using pooled endpoint
            if (trimmed.contains("-pooler") && !trimmed.contains("prepareThreshold")) {
                String separator = trimmed.contains("?") ? "&" : "?";
                trimmed = trimmed + separator + "prepareThreshold=0";
            }
            System.setProperty("DATABASE_URL", trimmed);

            // Automatically configure direct connection for Flyway migrations if pooled URL is used
            // Neon's PgBouncer pooler operates in transaction mode which drops long DDL migrations and session advisory locks
            if (System.getProperty("FLYWAY_URL") == null && System.getenv("FLYWAY_URL") == null) {
                if (trimmed.contains("-pooler")) {
                    String directFlywayUrl = trimmed.replace("-pooler", "");
                    System.setProperty("FLYWAY_URL", directFlywayUrl);
                    log.info("Configured direct Flyway URL (bypassing PgBouncer pooler for DDL & advisory locks)");
                }
            }
        }
    }
}
