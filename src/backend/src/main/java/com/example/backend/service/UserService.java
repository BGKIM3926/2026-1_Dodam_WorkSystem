package com.example.backend.service;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Base64;

import org.springframework.stereotype.Service;

import com.example.backend.dto.UserRequestDto;
import com.example.backend.dto.UserResponseDto;
import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

@Service
public class UserService {

    private static final String PASSWORD_HASH_PREFIX = "pbkdf2";
    private static final int PASSWORD_HASH_ITERATIONS = 210000;
    private static final int PASSWORD_HASH_KEY_LENGTH = 256;
    private static final int PASSWORD_SALT_BYTES = 16;

    private final UserRepository userRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // 🔹 전체 조회
    public List<UserResponseDto> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(user -> new UserResponseDto(
                        user.getId(),
                        user.getName(),
                        user.getRole()))
                .collect(Collectors.toList());
    }

    // 🔹 추가
    public void createUser(UserRequestDto dto) {
        if (dto.getPassword() == null || dto.getPassword().isEmpty()) {
            throw new IllegalArgumentException("비밀번호는 필수 입력값입니다.");
        }

        if (userRepository.existsById(dto.getId())) {
            throw new RuntimeException("이미 존재하는 ID입니다");
        }

        List<String> validRoles = List.of("일반사용자", "관리자", "팀장");
        if (dto.getRole() == null || !validRoles.contains(dto.getRole())) {
            throw new IllegalArgumentException("유효하지 않은 role 값입니다. 허용: " + validRoles);
        }

        User user = new User();
        user.setId(dto.getId());
        user.setPassword(hashPassword(dto.getPassword()));
        user.setName(dto.getName());
        user.setRole(dto.getRole());

        userRepository.save(user);
    }

    // 🔹 수정
    public void updateUser(String id, UserRequestDto dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setName(dto.getName());
        user.setRole(dto.getRole());

        // 🔥 password는 있을 때만 변경
        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            user.setPassword(hashPassword(dto.getPassword()));
        }

        userRepository.save(user);
    }

    // 🔹 로그인
    public Optional<UserResponseDto> login(String id, String password) {
        return userRepository.findById(id)
                .filter(user -> passwordMatches(user, password))
                .map(user -> new UserResponseDto(
                        user.getId(),
                        user.getName(),
                        user.getRole()));
    }

    private boolean passwordMatches(User user, String rawPassword) {
        String storedPassword = user.getPassword();

        if (storedPassword == null || rawPassword == null) {
            return false;
        }

        if (isPbkdf2Hash(storedPassword)) {
            return verifyPassword(rawPassword, storedPassword);
        }

        boolean matchesLegacyPlainTextPassword = storedPassword.equals(rawPassword);
        if (matchesLegacyPlainTextPassword) {
            user.setPassword(hashPassword(rawPassword));
            userRepository.save(user);
        }

        return matchesLegacyPlainTextPassword;
    }

    private String hashPassword(String rawPassword) {
        byte[] salt = new byte[PASSWORD_SALT_BYTES];
        secureRandom.nextBytes(salt);

        byte[] hash = createPbkdf2Hash(rawPassword, salt, PASSWORD_HASH_ITERATIONS);

        return PASSWORD_HASH_PREFIX
                + "$" + PASSWORD_HASH_ITERATIONS
                + "$" + Base64.getEncoder().encodeToString(salt)
                + "$" + Base64.getEncoder().encodeToString(hash);
    }

    private boolean verifyPassword(String rawPassword, String storedPassword) {
        String[] parts = storedPassword.split("\\$", 4);
        if (parts.length != 4 || !PASSWORD_HASH_PREFIX.equals(parts[0])) {
            return false;
        }

        try {
            int iterations = Integer.parseInt(parts[1]);
            byte[] salt = Base64.getDecoder().decode(parts[2]);
            byte[] expectedHash = Base64.getDecoder().decode(parts[3]);
            byte[] actualHash = createPbkdf2Hash(rawPassword, salt, iterations);

            return MessageDigest.isEqual(expectedHash, actualHash);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private byte[] createPbkdf2Hash(String rawPassword, byte[] salt, int iterations) {
        try {
            PBEKeySpec spec = new PBEKeySpec(
                    rawPassword.toCharArray(),
                    salt,
                    iterations,
                    PASSWORD_HASH_KEY_LENGTH);
            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            return factory.generateSecret(spec).getEncoded();
        } catch (InvalidKeySpecException | java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException("비밀번호 해시 생성에 실패했습니다.", e);
        }
    }

    private boolean isPbkdf2Hash(String password) {
        return password.startsWith(PASSWORD_HASH_PREFIX + "$");
    }

    // 🔹 삭제
    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }
}
