package com.example.backend.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.backend.dto.UserRequestDto;
import com.example.backend.dto.UserResponseDto;
import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;

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
        if (userRepository.existsById(dto.getId())) {
            throw new RuntimeException("이미 존재하는 ID입니다");
        }

        List<String> validRoles = List.of("일반사용자", "관리자", "팀장");
        if (dto.getRole() == null || !validRoles.contains(dto.getRole())) {
            throw new IllegalArgumentException("유효하지 않은 role 값입니다. 허용: " + validRoles);
        }

        User user = new User();
        user.setId(dto.getId());
        user.setPassword(dto.getPassword());
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
            user.setPassword(dto.getPassword());
        }

        userRepository.save(user);
    }

    // 🔹 삭제
    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }
}