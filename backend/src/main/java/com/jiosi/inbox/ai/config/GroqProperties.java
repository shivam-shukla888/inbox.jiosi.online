package com.jiosi.inbox.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "jiosi.ai.groq")
public class GroqProperties {

    private String apiKey;
    private String baseUrl = "https://api.groq.com/openai/v1";
    private String modelSummary = "llama-3.3-70b-versatile";
    private String modelDraft = "llama-3.1-8b-instant";
    private String modelClassify = "llama-3.3-70b-versatile";
    private int timeoutSeconds = 15;
    private int maxRetries = 2;
    private boolean enabled = true;
    private int maxInputChars = 12000;

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }

    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }

    public String getModelSummary() { return modelSummary; }
    public void setModelSummary(String modelSummary) { this.modelSummary = modelSummary; }

    public String getModelDraft() { return modelDraft; }
    public void setModelDraft(String modelDraft) { this.modelDraft = modelDraft; }

    public String getModelClassify() { return modelClassify; }
    public void setModelClassify(String modelClassify) { this.modelClassify = modelClassify; }

    public int getTimeoutSeconds() { return timeoutSeconds; }
    public void setTimeoutSeconds(int timeoutSeconds) { this.timeoutSeconds = timeoutSeconds; }

    public int getMaxRetries() { return maxRetries; }
    public void setMaxRetries(int maxRetries) { this.maxRetries = maxRetries; }

    public boolean isEnabled() {
        return enabled && apiKey != null && !apiKey.isBlank() && !apiKey.equals("test-placeholder");
    }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public int getMaxInputChars() { return maxInputChars; }
    public void setMaxInputChars(int maxInputChars) { this.maxInputChars = maxInputChars; }
}

