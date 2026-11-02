# Production runtime image for JIOSI Inbox Backend
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app
# Run as non-root user for security
RUN addgroup -S jiosi && adduser -S jiosi -G jiosi
USER jiosi

COPY target/*.jar app.jar

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/v1/health || exit 1

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
