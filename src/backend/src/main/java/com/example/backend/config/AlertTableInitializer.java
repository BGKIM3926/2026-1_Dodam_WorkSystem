package com.example.backend.config;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
public class AlertTableInitializer {

    private final JdbcTemplate jdbcTemplate;

    public AlertTableInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void initialize() {
        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS alert (
                id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                body_raw_json LONGTEXT NOT NULL,
                time DATETIME(6) NOT NULL
            )
            """);
    }
}
