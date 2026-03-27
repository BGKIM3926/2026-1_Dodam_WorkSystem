package com.example.backend.controller;

import com.example.backend.dto.UserRequestDto;
import com.example.backend.dto.UserResponseDto;
import com.example.backend.service.UserService;

import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public void createUser(@RequestBody UserRequestDto dto) {
        userService.createUser(dto);
    }

    // 🔹 수정
    @PutMapping("/{id}")
    public void updateUser(@PathVariable String id,
            @RequestBody UserRequestDto dto) {
        userService.updateUser(id, dto);
    }

    // 🔹 삭제
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
    }
}