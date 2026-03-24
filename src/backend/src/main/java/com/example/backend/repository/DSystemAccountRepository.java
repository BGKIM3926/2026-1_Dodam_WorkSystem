package com.example.backend.repository;

import com.example.backend.entity.DSystemAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DSystemAccountRepository extends JpaRepository<DSystemAccount, Integer> {

    // 🔥 systemId로 계정 조회
    List<DSystemAccount> findBySystemId(int systemId);
}