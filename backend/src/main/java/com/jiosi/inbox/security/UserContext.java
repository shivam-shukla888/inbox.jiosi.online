package com.jiosi.inbox.security;

import com.jiosi.inbox.user.User;

public final class UserContext {

    private static final ThreadLocal<User> CURRENT_USER = new ThreadLocal<>();
    private static final ThreadLocal<String> CURRENT_WORKSPACE_ROLE = new ThreadLocal<>();

    private UserContext() {}

    public static void set(User user, String role) {
        CURRENT_USER.set(user);
        CURRENT_WORKSPACE_ROLE.set(role);
    }

    public static User getUser() {
        return CURRENT_USER.get();
    }

    public static String getWorkspaceRole() {
        return CURRENT_WORKSPACE_ROLE.get();
    }

    public static void clear() {
        CURRENT_USER.remove();
        CURRENT_WORKSPACE_ROLE.remove();
    }
}

