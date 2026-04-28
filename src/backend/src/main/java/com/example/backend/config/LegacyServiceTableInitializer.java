package com.example.backend.config;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
public class LegacyServiceTableInitializer {

    private final JdbcTemplate jdbcTemplate;

    public LegacyServiceTableInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void initialize() {
        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS legacy_service (
                service_id BIGINT NOT NULL PRIMARY KEY,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """);

        Integer versionColumnCount = jdbcTemplate.queryForObject("""
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'dsystem'
              AND COLUMN_NAME = 'version'
            """, Integer.class);

        if (versionColumnCount == null || versionColumnCount == 0) {
            jdbcTemplate.execute("ALTER TABLE dsystem ADD COLUMN version VARCHAR(10) NOT NULL DEFAULT '신'");
        }

        jdbcTemplate.update("UPDATE dsystem SET version = '신' WHERE version IS NULL OR TRIM(version) = ''");

        Integer managerColumnCount = jdbcTemplate.queryForObject("""
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'dsystem'
              AND COLUMN_NAME = 'manager'
            """, Integer.class);

        if (managerColumnCount == null || managerColumnCount == 0) {
            jdbcTemplate.execute("ALTER TABLE dsystem ADD COLUMN manager VARCHAR(10) NOT NULL DEFAULT '조상현'");
        }

        jdbcTemplate.update("UPDATE dsystem SET manager = '조상현' WHERE manager IS NULL OR TRIM(manager) = ''");
        jdbcTemplate.execute("ALTER TABLE dsystem MODIFY COLUMN manager VARCHAR(10) NOT NULL DEFAULT '조상현'");
    }
}
