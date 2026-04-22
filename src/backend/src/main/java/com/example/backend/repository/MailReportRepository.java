package com.example.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.entity.MailReport;

@Repository
public interface MailReportRepository extends JpaRepository<MailReport, Long> {
}
