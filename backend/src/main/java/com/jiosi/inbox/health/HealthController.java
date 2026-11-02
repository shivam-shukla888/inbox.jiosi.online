package com.jiosi.inbox.health;

import com.jiosi.inbox.common.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.lang.management.ManagementFactory;
import java.sql.Connection;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    private static final Logger log = LoggerFactory.getLogger(HealthController.class);

    private final DataSource dataSource;

    @Value("${app.version:0.1.0-alpha}")
    private String version;

    @Value("${spring.profiles.active:dev}")
    private String environment;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<HealthResponse>> getHealth() {
        long uptime = ManagementFactory.getRuntimeMXBean().getUptime();
        Map<String, Object> services = new LinkedHashMap<>();

        boolean databaseHealthy = checkDatabaseHealth(services);

        String overallStatus = databaseHealthy ? "UP" : "DEGRADED";

        HealthResponse healthResponse = new HealthResponse(
                overallStatus,
                "JIOSI Inbox Core API",
                version,
                environment,
                Instant.now(),
                uptime,
                services
        );

        HttpStatus status = databaseHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
        return ResponseEntity.status(status).body(ApiResponse.ok(healthResponse, "System health report"));
    }

    private boolean checkDatabaseHealth(Map<String, Object> services) {
        Map<String, Object> dbDetails = new LinkedHashMap<>();
        try (Connection conn = dataSource.getConnection()) {
            boolean valid = conn.isValid(2);
            dbDetails.put("status", valid ? "UP" : "DOWN");
            dbDetails.put("databaseProduct", conn.getMetaData().getDatabaseProductName());
            services.put("database", dbDetails);
            return valid;
        } catch (Exception e) {
            log.error("Database health check failed: {}", e.getMessage());
            dbDetails.put("status", "DOWN");
            dbDetails.put("error", "Database connection unavailable");
            services.put("database", dbDetails);
            return false;
        }
    }
}
