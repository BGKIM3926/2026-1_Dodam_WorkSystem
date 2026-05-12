package com.example.backend.config;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
public class IssueTableInitializer {

    private final JdbcTemplate jdbcTemplate;

    public IssueTableInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void initialize() {
        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS issue (
                id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                info_id BIGINT NULL,
                issuekey VARCHAR(100) NULL,
                level VARCHAR(50) NULL,
                target VARCHAR(100) NULL,
                type VARCHAR(100) NULL,
                value VARCHAR(500) NULL,
                detail LONGTEXT NULL
            )
            """);

        addColumnIfMissing("issuekey", "ALTER TABLE issue ADD COLUMN issuekey VARCHAR(100) NULL");
        addColumnIfMissing("level", "ALTER TABLE issue ADD COLUMN level VARCHAR(50) NULL");
        addColumnIfMissing("target", "ALTER TABLE issue ADD COLUMN target VARCHAR(100) NULL");
    }

    private void addColumnIfMissing(String columnName, String alterSql) {
        Integer columnCount = jdbcTemplate.queryForObject("""
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'issue'
              AND COLUMN_NAME = ?
            """, Integer.class, columnName);

        if (columnCount == null || columnCount == 0) {
            jdbcTemplate.execute(alterSql);
        }
    }
}
