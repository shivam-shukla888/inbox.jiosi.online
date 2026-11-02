package com.jiosi.inbox.health;

import com.jiosi.inbox.common.ApiResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import javax.sql.DataSource;
import java.io.PrintWriter;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.util.Map;
import java.util.logging.Logger;

import static org.junit.jupiter.api.Assertions.*;

class HealthControllerUnitTest {

    @Test
    void testGetHealth_WhenDatabaseIsHealthy_ShouldReturn200AndUpStatus() {
        Connection proxyConn = (Connection) Proxy.newProxyInstance(
                Connection.class.getClassLoader(),
                new Class<?>[]{Connection.class},
                (proxy, method, args) -> {
                    if (method.getName().equals("isValid")) return true;
                    if (method.getName().equals("getMetaData")) {
                        return Proxy.newProxyInstance(
                                DatabaseMetaData.class.getClassLoader(),
                                new Class<?>[]{DatabaseMetaData.class},
                                (mProxy, mMethod, mArgs) -> {
                                    if (mMethod.getName().equals("getDatabaseProductName")) return "PostgreSQL";
                                    return null;
                                }
                        );
                    }
                    if (method.getName().equals("close")) return null;
                    return null;
                }
        );

        DataSource ds = new SimpleTestDataSource(() -> proxyConn);
        HealthController controller = new HealthController(ds);

        ResponseEntity<ApiResponse<HealthResponse>> response = controller.getHealth();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().success());

        HealthResponse health = response.getBody().data();
        assertEquals("UP", health.status());
        assertEquals("JIOSI Inbox Core API", health.application());

        @SuppressWarnings("unchecked")
        Map<String, Object> dbDetails = (Map<String, Object>) health.services().get("database");
        assertNotNull(dbDetails);
        assertEquals("UP", dbDetails.get("status"));
        assertEquals("PostgreSQL", dbDetails.get("databaseProduct"));
    }

    @Test
    void testGetHealth_WhenDatabaseValidationFails_ShouldReturn503AndDegradedStatus() {
        Connection proxyConn = (Connection) Proxy.newProxyInstance(
                Connection.class.getClassLoader(),
                new Class<?>[]{Connection.class},
                (proxy, method, args) -> {
                    if (method.getName().equals("isValid")) return false;
                    if (method.getName().equals("getMetaData")) {
                        return Proxy.newProxyInstance(
                                DatabaseMetaData.class.getClassLoader(),
                                new Class<?>[]{DatabaseMetaData.class},
                                (mProxy, mMethod, mArgs) -> {
                                    if (mMethod.getName().equals("getDatabaseProductName")) return "PostgreSQL";
                                    return null;
                                }
                        );
                    }
                    if (method.getName().equals("close")) return null;
                    return null;
                }
        );

        DataSource ds = new SimpleTestDataSource(() -> proxyConn);
        HealthController controller = new HealthController(ds);

        ResponseEntity<ApiResponse<HealthResponse>> response = controller.getHealth();

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
        assertNotNull(response.getBody());

        HealthResponse health = response.getBody().data();
        assertEquals("DEGRADED", health.status());

        @SuppressWarnings("unchecked")
        Map<String, Object> dbDetails = (Map<String, Object>) health.services().get("database");
        assertNotNull(dbDetails);
        assertEquals("DOWN", dbDetails.get("status"));
    }

    @Test
    void testGetHealth_WhenDatabaseThrowsSQLException_ShouldHandleGracefullyAndReturn503() {
        DataSource ds = new SimpleTestDataSource(() -> {
            throw new SQLException("Connection timed out");
        });
        HealthController controller = new HealthController(ds);

        ResponseEntity<ApiResponse<HealthResponse>> response = controller.getHealth();

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
        assertNotNull(response.getBody());

        HealthResponse health = response.getBody().data();
        assertEquals("DEGRADED", health.status());

        @SuppressWarnings("unchecked")
        Map<String, Object> dbDetails = (Map<String, Object>) health.services().get("database");
        assertNotNull(dbDetails);
        assertEquals("DOWN", dbDetails.get("status"));
        assertEquals("Database connection unavailable", dbDetails.get("error"));
    }

    // Functional interface for connection provider
    @FunctionalInterface
    interface ConnectionProvider {
        Connection getConnection() throws SQLException;
    }

    // Standalone minimal DataSource implementation that avoids Mockito proxy issues on Java 21+
    static class SimpleTestDataSource implements DataSource {
        private final ConnectionProvider provider;

        SimpleTestDataSource(ConnectionProvider provider) {
            this.provider = provider;
        }

        @Override
        public Connection getConnection() throws SQLException {
            return provider.getConnection();
        }

        @Override
        public Connection getConnection(String username, String password) throws SQLException {
            return provider.getConnection();
        }

        @Override public PrintWriter getLogWriter() { return null; }
        @Override public void setLogWriter(PrintWriter out) {}
        @Override public void setLoginTimeout(int seconds) {}
        @Override public int getLoginTimeout() { return 0; }
        @Override public Logger getParentLogger() throws SQLFeatureNotSupportedException { throw new SQLFeatureNotSupportedException(); }
        @Override public <T> T unwrap(Class<T> iface) { return null; }
        @Override public boolean isWrapperFor(Class<?> iface) { return false; }
    }
}
