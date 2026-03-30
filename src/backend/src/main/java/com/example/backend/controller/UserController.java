package com.example.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.UserRequestDto;
import com.example.backend.dto.UserResponseDto;
import com.example.backend.service.UserService;

@CrossOrigin(origins = "http://localhost:3000") // 🔥 CORS
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // 🔹 조회
    @GetMapping
    public List<UserResponseDto> getUsers() {
        return userService.getAllUsers();
    }

    // 🔹 추가
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody UserRequestDto dto) {
        try {
            userService.createUser(dto);
            return ResponseEntity.ok().build();

        } catch (RuntimeException e) {
            String message = e.getMessage();

            if (message != null && message.contains("이미 존재")) {
                return ResponseEntity
                    .status(409)
                    .body(Map.of("message", message));
            }

            return ResponseEntity
                .badRequest()
                .body(Map.of("message", message));
        
        }
    }

    // 🔹 수정
    @PutMapping("/{id}")
    public void updateUser(@PathVariable String id,
            @RequestBody UserRequestDto dto) {
        userService.updateUser(id, dto);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleInvalidArgument(IllegalArgumentException e) {
        return ResponseEntity
                .badRequest()
                .body(Map.of("message", e.getMessage()));
    }

    // 🔹 삭제
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
    }
}