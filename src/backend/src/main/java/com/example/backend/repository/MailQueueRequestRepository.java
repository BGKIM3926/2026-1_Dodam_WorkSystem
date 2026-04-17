package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.MailQueueRequest;

@Repository
public interface MailQueueRequestRepository extends JpaRepository<MailQueueRequest, Long> {
}
