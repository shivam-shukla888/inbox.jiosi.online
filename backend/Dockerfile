# ==============================================================================
# JIOSI Inbox Backend — Multi-Stage Production Dockerfile
# Optimized for Render Free Tier (512 MB RAM, 0.1 vCPU)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build & Package Spring Boot Application
# ------------------------------------------------------------------------------
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# 1. Copy dependency descriptor and Maven wrapper first for Docker layer caching
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw mvnw.cmd ./

# Fix execute permissions on Maven wrapper if needed
RUN chmod +x mvnw

# 2. Pre-fetch dependencies into cache layer
RUN mvn dependency:resolve -B

# 3. Copy application source code
COPY src ./src

# 4. Package executable Spring Boot fat JAR (skipping test execution during image build)
RUN mvn clean package -DskipTests -B && \
    cp target/jiosi-inbox-backend-*.jar target/app.jar

# ------------------------------------------------------------------------------
# Stage 2: Minimal Production Runtime
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Run as non-root user for security compliance
RUN addgroup -S jiosi && adduser -S jiosi -G jiosi
USER jiosi

# Copy packaged fat JAR from build stage
COPY --from=builder /build/target/app.jar app.jar

# Expose backend port
EXPOSE 8080

# Configure JVM flags conservatively for Render Free's 512 MB RAM limit:
# - MaxRAMPercentage=75.0 (caps heap to ~384MB, leaving 128MB for OS/Metaspace/threads)
# - Xmx320m / Xms128m (explicit upper heap limit)
# - UseSerialGC (minimal GC memory overhead compared to G1GC)
# - TieredStopAtLevel=1 (faster startup & lower memory footprint on shared CPU)
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -Xmx320m -Xms128m -XX:+UseSerialGC -XX:TieredStopAtLevel=1 -Djava.security.egd=file:/dev/./urandom"
ENV SERVER_PORT=8080

# Health check verifies the live actuator health endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/v1/health || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
