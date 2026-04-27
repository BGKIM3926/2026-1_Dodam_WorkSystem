package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.entity.Issue;

public interface IssueRepository extends JpaRepository<Issue, Long> {
}
