package com.example.backend.config;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import com.example.backend.entity.converter.EmailEncryptConverter;

import jakarta.annotation.PostConstruct;

@Component
public class UserEmailPlaintextMigration {

    private static final Logger log = LoggerFactory.getLogger(UserEmailPlaintextMigration.class);
    private static final String ENCRYPTED_PREFIX = "enc:v1:";

    private final JdbcTemplate jdbcTemplate;
    private final EmailEncryptConverter emailEncryptConverter = new EmailEncryptConverter();

    public UserEmailPlaintextMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void migrate() {
        List<EncryptedEmailRow> rows = jdbcTemplate.query(
                "SELECT user_id, email FROM users WHERE email LIKE 'enc:v1:%'",
                (rs, rowNum) -> new EncryptedEmailRow(
                        rs.getString("user_id"),
                        rs.getString("email")
                )
        );

        int migratedCount = 0;
        for (EncryptedEmailRow row : rows) {
            String encryptedEmail = row.email();
            if (encryptedEmail == null || !encryptedEmail.startsWith(ENCRYPTED_PREFIX)) {
                continue;
            }

            try {
                String plainEmail = emailEncryptConverter.convertToEntityAttribute(encryptedEmail);
                jdbcTemplate.update(
                        "UPDATE users SET email = ? WHERE user_id = ? AND email = ?",
                        plainEmail,
                        row.userId(),
                        encryptedEmail
                );
                migratedCount++;
            } catch (Exception e) {
                log.warn("users.email 복호화 마이그레이션 실패: user_id={}", row.userId(), e);
            }
        }

        if (migratedCount > 0) {
            log.info("users.email 평문 마이그레이션 완료: {}건", migratedCount);
        }
    }

    private record EncryptedEmailRow(
            String userId,
            String email
    ) {
    }
}
