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
        try {
            File currentEnv = new File(".env");
            File parentEnv = new File("../.env");
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
                    if (System.getenv(key) == null && System.getProperty(key) == null) {
                        System.setProperty(key, val);
                    }
                });
                log.info("Loaded environment variables from {}", target.getAbsolutePath());
            }
        } catch (Exception e) {
            log.warn("Could not load .env file: {}", e.getMessage());
        }
    }
}
