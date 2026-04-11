package com.example.backend.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.backend.entity.MaintenanceHistory;
import com.example.backend.repository.WorkHistoryRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final WorkHistoryRepository workHistoryRepository;

    @PersistenceContext
    private EntityManager em;

    private boolean hasWorkerId(String workerId) {
        return workerId != null && !workerId.isBlank();
    }

    public Map<String, Object> getSummary(String workerId) {
        List<MaintenanceHistory> allByWorker = workHistoryRepository.findAll()
                .stream()
                .filter(h -> !hasWorkerId(workerId) || workerId.equals(h.getWorkerId()))
                .collect(Collectors.toList());

        long totalCount = allByWorker.size();

        LocalDate now = LocalDate.now();
        int currentYear = now.getYear();
        int currentMonth = now.getMonthValue();

        long monthlyCount = allByWorker.stream()
                .filter(h -> h.getVisitDate() != null
                        && h.getVisitDate().getYear() == currentYear
                        && h.getVisitDate().getMonthValue() == currentMonth)
                .count();

        long incompleteCount = allByWorker.stream()
                .filter(h -> ("장애조치".equals(h.getWorkType()) || "기술지원".equals(h.getWorkType()))
                        && h.getCompletedDate() == null)
                .count();

        long missingInspectionCount = getMissingInspections(workerId).size();

        Map<String, Object> result = new HashMap<>();
        result.put("totalCount", totalCount);
        result.put("monthlyCount", monthlyCount);
        result.put("incompleteCount", incompleteCount);
        result.put("missingInspectionCount", missingInspectionCount);
        return result;
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getMissingInspections(String workerId) {
        LocalDate now = LocalDate.now();
        LocalDate monthStart = now.withDayOfMonth(1);
        LocalDate monthEnd = now.withDayOfMonth(now.lengthOfMonth());

        // 전체 서비스 목록 조회 (dsystem에서 고유 serviceId별 그룹)
        List<Object[]> allServices = em.createQuery(
                "SELECT d.serviceId, d.customerName, d.serviceNameMin " +
                        "FROM DSystem d WHERE d.serviceId IS NOT NULL " +
                        "GROUP BY d.serviceId, d.customerName, d.serviceNameMin " +
                        "ORDER BY d.serviceId",
                Object[].class)
                .getResultList();

        // 이번 달 정기점검이 있는 serviceId 조회 (전체 기준)
        List<Long> inspectedServiceIds = em.createQuery(
                "SELECT DISTINCT m.serviceId FROM MaintenanceHistory m " +
                        "WHERE m.workType = '정기점검' " +
                        "AND m.visitDate BETWEEN :start AND :end AND m.serviceId IS NOT NULL",
                Long.class)
                .setParameter("start", monthStart)
                .setParameter("end", monthEnd)
                .getResultList();

        Set<Long> inspectedSet = Set.copyOf(inspectedServiceIds);

        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] row : allServices) {
            Long serviceId = ((Number) row[0]).longValue();
            if (inspectedSet.contains(serviceId)) {
                continue;
            }

            String region = (String) row[1];
            String serviceName = (String) row[2];

            // 해당 서비스의 최근 정기점검일 조회
            List<LocalDate> lastDates = em.createQuery(
                    "SELECT MAX(m.visitDate) FROM MaintenanceHistory m " +
                            "WHERE m.serviceId = :serviceId AND m.workType = '정기점검'",
                    LocalDate.class)
                    .setParameter("serviceId", serviceId)
                    .getResultList();

            LocalDate lastDate = (lastDates != null && !lastDates.isEmpty()) ? lastDates.get(0) : null;

            Map<String, Object> entry = new HashMap<>();
            entry.put("serviceId", serviceId);
            entry.put("region", region);
            entry.put("serviceName", serviceName);
            entry.put("lastInspectionDate", lastDate);
            result.add(entry);
        }

        return result;
    }

    public List<Map<String, Object>> getRecentHistory(String workerId) {
        StringBuilder jpql = new StringBuilder(
                "SELECT m.historyId, m.workType, m.issue, m.region, " +
                        "COALESCE(d.serviceNameMin, m.serviceName), m.visitDate " +
                        "FROM MaintenanceHistory m LEFT JOIN DSystem d ON m.systemId = d.systemId ");

        if (hasWorkerId(workerId)) {
            jpql.append("WHERE m.workerId = :workerId ");
        }

        jpql.append("ORDER BY m.visitDate DESC, m.historyId DESC");

        var query = em.createQuery(jpql.toString(), Object[].class);
        if (hasWorkerId(workerId)) {
            query.setParameter("workerId", workerId);
        }

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.setMaxResults(10).getResultList();

        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rows) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("historyId", row[0]);
            entry.put("workType", row[1]);
            entry.put("issue", row[2]);
            entry.put("region", row[3]);
            entry.put("serviceName", row[4]);
            entry.put("visitDate", row[5]);
            result.add(entry);
        }
        return result;
    }
}
