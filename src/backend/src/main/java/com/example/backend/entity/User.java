package com.example.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.example.backend.entity.converter.EmailEncryptConverter;

@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(name = "user_id")
    private String id;

    @JsonIgnore
    @Column(name = "password", length = 100)
    private String password;

    @Column(name = "name")
    private String name;

    @Column(name = "email", length = 512)
    @Convert(converter = EmailEncryptConverter.class)
    private String email;

    @Column(name = "role")
    private String role;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
