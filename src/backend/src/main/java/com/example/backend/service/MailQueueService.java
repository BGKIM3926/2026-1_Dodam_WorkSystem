package com.example.backend.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.MailRequestDto;
import com.example.backend.dto.MailResponseDto;
import com.example.backend.entity.DSystem;
import com.example.backend.entity.Info;
import com.example.backend.entity.Issue;
import com.example.backend.entity.User;
import com.example.backend.repository.DSystemRepository;
import com.example.backend.repository.InfoRepository;
import com.example.backend.repository.IssueRepository;
import com.example.backend.repository.UserRepository;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class MailQueueService {

    private static final int MAX_SYSTEM_ID_LENGTH = 100;
    private static final int MAX_BODY_LENGTH = 65535;
    private static final ZoneId KOREA_ZONE = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter FILE_TIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");
    private static final DateTimeFormatter HTML_TIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final Pattern BARE_DASH_JSON_VALUE_PATTERN =
            Pattern.compile("(:\\s*)-(\\s*[,}\\]])");

    private final DSystemRepository dSystemRepository;
    private final InfoRepository infoRepository;
    private final IssueRepository issueRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Value("${mail.queue-dir:mail-queue}")
    private String queueDir;

    public MailQueueService(
            DSystemRepository dSystemRepository,
            InfoRepository infoRepository,
            IssueRepository issueRepository,
            UserRepository userRepository,
            ObjectMapper objectMapper
    ) {
        this.dSystemRepository = dSystemRepository;
        this.infoRepository = infoRepository;
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public MailResponseDto enqueue(MailRequestDto request, String clientIp) {
        return enqueue(request, clientIp, false);
    }

    @Transactional
    public MailResponseDto enqueueAlert(MailRequestDto request, String clientIp) {
        return enqueue(request, clientIp, true);
    }

    private MailResponseDto enqueue(MailRequestDto request, String clientIp, boolean alert) {
        validate(request);

        String requestId = UUID.randomUUID().toString();
        LocalDateTime receivedAt = nowInKorea();
        String systemIdText = request.getSystemId().trim();
        Long dsystemId = parseDSystemId(systemIdText);
        DSystem dSystem = findDSystemOrThrow(dsystemId);

        SavedReport savedReport = saveInfoAndIssues(request, receivedAt);
        ReportStats reportStats = calculateReportStats(savedReport.issues());
        String recipientEmail = findRecipientEmail(savedReport.info(), dsystemId);
        List<IssueGroup> issueGroups = buildIssueGroups(dSystem, savedReport.issues());

        try {
            writeQueueHtmlFile(
                    receivedAt,
                    recipientEmail,
                    reportStats,
                    issueGroups,
                    alert
            );
            return new MailResponseDto(requestId, "FILE_WRITTEN");
        } catch (IOException e) {
            throw new IllegalStateException("메일 큐 파일 저장에 실패했습니다.");
        }
    }

    private SavedReport saveInfoAndIssues(MailRequestDto request, LocalDateTime receivedAt) {
        JsonNode reportJson = readReportJsonOrNull(request.getContent());
        String bodyRawJson = createBodyRawJson(request, receivedAt, reportJson);

        Info info = new Info();
        info.setBodyRawJson(bodyRawJson);
        info.setTime(receivedAt);
        Info savedInfo = infoRepository.save(info);

        List<Issue> savedIssues = reportJson == null
                ? List.of()
                : saveIssues(reportJson, savedInfo.getId());

        return new SavedReport(reportJson, savedInfo, savedIssues);
    }

    private List<Issue> saveIssues(JsonNode reportJson, Long infoId) {
        JsonNode issues = getIssueArray(reportJson);
        if (issues == null || !issues.isArray()) {
            return List.of();
        }

        List<Issue> savedIssues = new ArrayList<>();
        for (JsonNode item : issues) {
            Issue issue = new Issue();
            issue.setInfoId(infoId);
            issue.setType(readText(item, "type", readText(item, "category", "UNKNOWN")));
            issue.setValue(readText(item, "value", readText(item, "level", "UNKNOWN")));
            issue.setDetail(readIssueDetail(item));
            savedIssues.add(issueRepository.save(issue));
        }
        return savedIssues;
    }

    private JsonNode getIssueArray(JsonNode reportJson) {
        JsonNode issues = reportJson.get("issues");
        if (issues != null && issues.isArray()) {
            return issues;
        }
        JsonNode healthFlags = reportJson.get("health_flags");
        if (healthFlags != null && healthFlags.isArray()) {
            return healthFlags;
        }
        return null;
    }

    private String readIssueDetail(JsonNode item) {
        String detail = readText(item, "detail", readText(item, "message", ""));
        String target = readText(item, "target", "");
        if (target == null || target.isBlank()) {
            return detail;
        }
        if (detail == null || detail.isBlank()) {
            return "target=" + target;
        }
        return "target=" + target + " | " + detail;
    }

    private String readText(JsonNode node, String fieldName, String defaultValue) {
        if (node == null || node.isNull()) {
            return defaultValue;
        }
        JsonNode value = node.get(fieldName);
        if (value == null || value.isNull()) {
            return defaultValue;
        }
        return value.asString();
    }

    private JsonNode readReportJsonOrNull(String body) {
        if (body == null || body.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readTree(body);
        } catch (Exception e) {
            String repairedBody = repairCollectorJson(body);
            if (repairedBody.equals(body)) {
                return null;
            }
            try {
                return objectMapper.readTree(repairedBody);
            } catch (Exception ignored) {
                return null;
            }
        }
    }

    private String repairCollectorJson(String body) {
        return BARE_DASH_JSON_VALUE_PATTERN.matcher(body).replaceAll("$1null$2");
    }

    private String createBodyRawJson(MailRequestDto request, LocalDateTime receivedAt, JsonNode reportJson) {
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("system_id", request.getSystemId());
            body.put("key", request.getKey());
            body.put("content", reportJson == null ? request.getContent() : reportJson);
            body.put("received_at", HTML_TIME_FORMAT.format(receivedAt));
            return objectMapper.writeValueAsString(body);
        } catch (Exception e) {
            throw new IllegalStateException("info 원본 JSON 생성에 실패했습니다.");
        }
    }

    private String writeJson(JsonNode node) {
        try {
            return objectMapper.writeValueAsString(node);
        } catch (Exception e) {
            throw new IllegalStateException("info 원본 JSON 저장에 실패했습니다.");
        }
    }

    private void validate(MailRequestDto request) {
        if (request == null) {
            throw new IllegalArgumentException("요청 본문이 필요합니다.");
        }
        if (request.getSystemId() == null || request.getSystemId().isBlank()) {
            throw new IllegalArgumentException("system_id는 필수입니다.");
        }
        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new IllegalArgumentException("content는 필수입니다.");
        }
        if (request.getSystemId().trim().length() > MAX_SYSTEM_ID_LENGTH) {
            throw new IllegalArgumentException("system_id는 100자 이하여야 합니다.");
        }
        if (request.getContent().length() > MAX_BODY_LENGTH) {
            throw new IllegalArgumentException("content는 65535자 이하여야 합니다.");
        }
        if (parseSystemId(request.getSystemId().trim()).isEmpty()) {
            throw new IllegalArgumentException("system_id는 숫자여야 합니다.");
        }
    }

    private Path writeQueueHtmlFile(
            LocalDateTime generatedAt,
            String recipientEmail,
            ReportStats reportStats,
            List<IssueGroup> issueGroups,
            boolean alert
    ) throws IOException {
        Path resolvedQueueDir = resolveQueueDirectory();
        Files.createDirectories(resolvedQueueDir);

        Path filePath = alert
                ? resolveAlertQueueFilePath(resolvedQueueDir, generatedAt)
                : resolveQueueFilePath(resolvedQueueDir, generatedAt);

        String html = buildHtmlPayload(reportStats, issueGroups, generatedAt, recipientEmail);
        Files.writeString(filePath, html, StandardCharsets.UTF_8);
        return filePath;
    }

    private LocalDateTime nowInKorea() {
        return LocalDateTime.now(KOREA_ZONE);
    }

    private Path resolveQueueFilePath(Path queueDir, LocalDateTime generatedAt) {
        LocalDateTime candidateTime = generatedAt;
        Path candidatePath;
        do {
            candidatePath = queueDir.resolve(FILE_TIME_FORMAT.format(candidateTime) + ".html");
            candidateTime = candidateTime.plusSeconds(1);
        } while (Files.exists(candidatePath));
        return candidatePath;
    }

    private Path resolveAlertQueueFilePath(Path queueDir, LocalDateTime generatedAt) {
        LocalDateTime candidateTime = generatedAt;
        Path candidatePath;
        do {
            candidatePath = queueDir.resolve(FILE_TIME_FORMAT.format(candidateTime) + "-ALERT.html");
            candidateTime = candidateTime.plusSeconds(1);
        } while (Files.exists(candidatePath));
        return candidatePath;
    }

    private Path resolveQueueDirectory() {
        Path dirPath = Path.of(queueDir);
        if (dirPath.isAbsolute()) {
            return dirPath.normalize();
        }
        return Path.of(System.getProperty("user.dir")).resolve(dirPath).normalize();
    }

    private String buildHtmlPayload(
            ReportStats reportStats,
            List<IssueGroup> issueGroups,
            LocalDateTime generatedAt,
            String recipientEmail
    ) {
        String issueRows = buildIssueRows(issueGroups);
        String recipientLine = buildRecipientLine(recipientEmail);

        return """
                <!doctype html>
                <html lang="ko">
                <head>
                  <meta charset="UTF-8">
                  <title>점검 상태 보고서</title>
                </head>
                <body style="margin:0; padding:0; background:#ffffff; color:#333; font-family:'NanumGothic','Malgun Gothic','Apple SD Gothic Neo',Dotum,Helvetica,sans-serif; -webkit-text-size-adjust:100%%;">
                  <table width="100%%" cellpadding="0" cellspacing="0" border="0" style="width:100%%; margin:0; padding:0; background:#ffffff; border-collapse:collapse;">
                    <tr>
                      <td align="center" style="padding:0; margin:0;">
                        <table width="595" cellpadding="0" cellspacing="0" border="0" style="width:595px; max-width:595px; background:#ffffff; border-collapse:collapse; table-layout:fixed;">
                          <tr>
                            <td style="padding:56px 21px 44px; color:#333; font-family:'NanumGothic','Malgun Gothic','Apple SD Gothic Neo',Dotum,Helvetica,sans-serif;">
                              <div style="margin:0; padding:0; color:#424240; font-size:28px; line-height:34px; font-weight:700; font-family:'NanumGothic','Malgun Gothic','Apple SD Gothic Neo',Dotum,Helvetica,sans-serif;">
                                시스템 <span style="color:#2f6fed;">점검 상태 보고서</span>
                              </div>
                              <div style="margin:14px 0 0; padding:0; color:#696969; font-size:13px; line-height:20px; font-family:'NanumGothic','Malgun Gothic','Apple SD Gothic Neo',Dotum,Helvetica,sans-serif;">
                                생성시각: %s
                              </div>
                              <div style="height:1px; line-height:1px; font-size:1px; margin:26px 0 0; background:#e5e5e5;">&nbsp;</div>
                %s
                              <div style="height:24px; line-height:24px; font-size:24px;">&nbsp;</div>
                              <div style="height:24px; color:#000; font-size:14px; line-height:24px; font-weight:700; font-family:'NanumGothic','Malgun Gothic','Apple SD Gothic Neo',Dotum,Helvetica,sans-serif;">
                                통계
                              </div>
                              <div style="height:2px; line-height:2px; font-size:2px; background:#424240;">&nbsp;</div>
                              <table width="100%%" cellpadding="0" cellspacing="0" border="0" style="width:100%%; border-collapse:collapse; table-layout:fixed;">
                                <tr>
                                  <th width="33.33%%" style="padding:18px 10px 15px; border:0; border-bottom:1px dotted #e6e6e6; text-align:center; color:#696969; background:#ffffff; font-size:14px; line-height:22px; font-weight:700; font-family:'NanumGothic','Malgun Gothic','Apple SD Gothic Neo',Dotum,Helvetica,sans-serif;">정상(건)</th>
                                  <th width="33.33%%" style="padding:18px 10px 15px; border:0; border-bottom:1px dotted #e6e6e6; text-align:center; color:#696969; background:#ffffff; font-size:14px; line-height:22px; font-weight:700; font-family:'NanumGothic','Malgun Gothic','Apple SD Gothic Neo',Dotum,Helvetica,sans-serif;">경고</th>
                                  <th width="33.33%%" style="padding:18px 10px 15px; border:0; border-bottom:1px dotted #e6e6e6; text-align:center; color:#696969; background:#ffffff; font-size:14px; line-height:22px; font-weight:700; font-family:'NanumGothic','Malgun Gothic','Apple SD Gothic Neo',Dotum,Helvetica,sans-serif;">위험</th>
                                </tr>
                                <tr>
                                  <td width="33.33%%" style="padding:15px 10px; border:0; border-bottom:1px dotted #e6e6e6; text-align:center; vertical-align:middle;">
                                    <span style="color:#137333; font-family:Helvetica,Arial,sans-serif; font-size:30px; line-height:34px; font-weight:700;">%d</span>
                                  </td>
                                  <td width="33.33%%" style="padding:15px 10px; border:0; border-bottom:1px dotted #e6e6e6; text-align:center; vertical-align:middle;">
                                    <span style="color:#b26a00; font-family:Helvetica,Arial,sans-serif; font-size:30px; line-height:34px; font-weight:700;">%d</span>
                                  </td>
                                  <td width="33.33%%" style="padding:15px 10px; border:0; border-bottom:1px dotted #e6e6e6; text-align:center; vertical-align:middle;">
                                    <span style="color:#b42318; font-family:Helvetica,Arial,sans-serif; font-size:30px; line-height:34px; font-weight:700;">%d</span>
                                  </td>
                                </tr>
                              </table>
                              <div style="height:42px; line-height:42px; font-size:42px;">&nbsp;</div>
                              <div style="height:24px; color:#000; font-size:14px; line-height:24px; font-weight:700; font-family:'NanumGothic','Malgun Gothic','Apple SD Gothic Neo',Dotum,Helvetica,sans-serif;">
                                이슈
                              </div>
                              <div style="height:2px; line-height:2px; font-size:2px; background:#424240;">&nbsp;</div>
                              <table width="100%%" cellpadding="0" cellspacing="0" border="0" style="width:100%%; border-collapse:collapse; table-layout:fixed;">
                                <tr>
                                  <th width="20%%" style="padding:18px 10px 15px; border:0; border-bottom:1px dotted #e6e6e6; text-align:center; color:#696969; background:#ffffff; font-size:14px; line-height:22px; font-weight:700; font-family:'NanumGothic','Malgun Gothic','Apple SD Gothic Neo',Dotum,Helvetica,sans-serif;">고객사</th>
                                  <th width="20%%" style="padding:18px 10px 15px; border:0; border-bottom:1px dotted #e6e6e6; text-align:center; color:#696969; background:#ffffff; font-size:14px; line-height:22px; font-weight:700; font-family:'NanumGothic','Malgun Gothic','Apple SD Gothic Neo',Dotum,Helvetica,sans-serif;">시스템명</th>
                                  <th width="60%%" style="padding:18px 10px 15px; border:0; border-bottom:1px dotted #e6e6e6; text-align:center; color:#696969; background:#ffffff; font-size:14px; line-height:22px; font-weight:700; font-family:'NanumGothic','Malgun Gothic','Apple SD Gothic Neo',Dotum,Helvetica,sans-serif;">이슈내용</th>
                                </tr>
                %s              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:18px 21px; color:#696969; background:#e5e5e5; font-size:12px; line-height:17px; font-family:'NanumGothic','Malgun Gothic','Apple SD Gothic Neo',Dotum,Helvetica,sans-serif;">
                              본 메일은 시스템 점검 결과를 바탕으로 자동 생성되었습니다.
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(
                HTML_TIME_FORMAT.format(generatedAt),
                recipientLine,
                reportStats.normalCount(),
                reportStats.warningCount(),
                reportStats.dangerCount(),
                issueRows
        );
    }

    private String buildRecipientLine(String recipientEmail) {
        if (recipientEmail == null || recipientEmail.isBlank()) {
            return "";
        }
        return """
                              <div style="margin:28px 0 0; padding:0; color:#424240; font-size:14px; line-height:22px; font-weight:700; font-family:'NanumGothic','Malgun Gothic','Apple SD Gothic Neo',Dotum,Helvetica,sans-serif;">
                                발송할 주소 : %s
                              </div>
                """.formatted(escapeHtml(recipientEmail.trim()));
    }

    private String buildIssueRows(List<IssueGroup> issueGroups) {
        if (issueGroups.isEmpty()) {
            return """
                                <tr>
                                  <td colspan="3" style="padding:15px 10px; border:0; border-bottom:1px dotted #e6e6e6; text-align:center; vertical-align:middle; color:#777; font-size:14px; line-height:22px; font-family:'NanumGothic','Malgun Gothic','Apple SD Gothic Neo',Dotum,Helvetica,sans-serif;">경고 또는 위험 이슈가 없습니다.</td>
                                </tr>
                """;
        }

        StringBuilder rows = new StringBuilder();
        for (IssueGroup issueGroup : issueGroups) {
            rows.append("""
                                <tr>
                                  <td width="20%%" style="padding:15px 10px; border:0; border-bottom:1px dotted #e6e6e6; text-align:left; vertical-align:middle; color:#333; font-size:14px; line-height:22px; word-break:break-word; font-family:'NanumGothic','Malgun Gothic','Apple SD Gothic Neo',Dotum,Helvetica,sans-serif;">%s</td>
                                  <td width="20%%" style="padding:15px 10px; border:0; border-bottom:1px dotted #e6e6e6; text-align:left; vertical-align:middle; color:#333; font-size:14px; line-height:22px; word-break:break-word; font-family:'NanumGothic','Malgun Gothic','Apple SD Gothic Neo',Dotum,Helvetica,sans-serif;">%s</td>
                                  <td width="60%%" style="padding:15px 10px; border:0; border-bottom:1px dotted #e6e6e6; text-align:left; vertical-align:middle; color:#333; font-size:14px; line-height:22px; word-break:break-word; font-family:'NanumGothic','Malgun Gothic','Apple SD Gothic Neo',Dotum,Helvetica,sans-serif;">%s</td>
                                </tr>
                    """.formatted(
                    escapeHtml(issueGroup.customerName()),
                    escapeHtml(issueGroup.systemName()),
                    escapeHtmlWithLineBreaks(issueGroup.issueContent())
            ));
        }
        return rows.toString();
    }

    private ReportStats calculateReportStats(List<Issue> issues) {
        if (issues.isEmpty()) {
            return new ReportStats(1, 0, 0);
        }

        IssueLevel systemLevel = IssueLevel.NORMAL;
        for (Issue issue : issues) {
            IssueLevel level = classifyIssueLevel(issue);
            if (level == IssueLevel.DANGER) {
                systemLevel = IssueLevel.DANGER;
                break;
            } else if (level == IssueLevel.WARNING) {
                systemLevel = IssueLevel.WARNING;
            }
        }

        if (systemLevel == IssueLevel.DANGER) {
            return new ReportStats(0, 0, 1);
        }
        if (systemLevel == IssueLevel.WARNING) {
            return new ReportStats(0, 1, 0);
        }
        return new ReportStats(1, 0, 0);
    }

    private List<IssueGroup> buildIssueGroups(DSystem dSystem, List<Issue> issues) {
        List<Issue> notableIssues = issues.stream()
                .filter(issue -> {
                    IssueLevel level = classifyIssueLevel(issue);
                    return level == IssueLevel.WARNING || level == IssueLevel.DANGER;
                })
                .toList();
        if (notableIssues.isEmpty()) {
            return List.of();
        }

        String customerName = dSystem.getCustomerName();
        String systemName = getDisplaySystemName(dSystem);
        Long infoId = notableIssues.get(0).getInfoId();
        StringBuilder issueContent = new StringBuilder();
        for (Issue issue : notableIssues) {
            if (issueContent.length() > 0) {
                issueContent.append("\n");
            }
            issueContent.append(formatIssueContent(issue));
        }
        return List.of(new IssueGroup(infoId, customerName, systemName, issueContent.toString()));
    }

    private String formatIssueContent(Issue issue) {
        String type = issue.getType() == null || issue.getType().isBlank() ? "UNKNOWN" : issue.getType().trim();
        String value = issue.getValue() == null || issue.getValue().isBlank() ? "UNKNOWN" : issue.getValue().trim();
        String detail = issue.getDetail() == null || issue.getDetail().isBlank() ? "" : issue.getDetail().trim();
        if (detail.isBlank()) {
            return "[%s] %s".formatted(value, type);
        }
        return "[%s] %s - %s".formatted(value, type, detail);
    }

    private IssueLevel classifyIssueLevel(Issue issue) {
        String value = issue == null ? "" : issue.getValue();
        if (value == null || value.isBlank()) {
            return IssueLevel.WARNING;
        }

        String normalized = value.trim().toUpperCase();
        if (normalized.equals("INFO")
                || normalized.equals("OK")
                || normalized.equals("NORMAL")
                || normalized.equals("정상")) {
            return IssueLevel.NORMAL;
        }
        if (normalized.equals("WARN")
                || normalized.equals("WARNING")
                || normalized.equals("경고")) {
            return IssueLevel.WARNING;
        }
        if (normalized.equals("DANGER")
                || normalized.equals("ERROR")
                || normalized.equals("CRITICAL")
                || normalized.equals("FATAL")
                || normalized.equals("위험")) {
            return IssueLevel.DANGER;
        }
        return IssueLevel.WARNING;
    }

    private String getDisplaySystemName(DSystem dSystem) {
        String systemName = dSystem.getSystemNameMin();
        if (systemName == null || systemName.isBlank()) {
            systemName = dSystem.getSystemName();
        }
        return systemName == null ? "" : systemName;
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String escapeHtmlWithLineBreaks(String value) {
        return escapeHtml(value).replace("\n", "<br />");
    }

    private String findRecipientEmail(Info info, Long fallbackSystemId) {
        Long dsystemId = readDSystemIdFromBodyRawJson(info.getBodyRawJson()).orElse(fallbackSystemId);
        return dSystemRepository.findById(dsystemId)
                .map(DSystem::getManager)
                .map(String::trim)
                .filter(manager -> !manager.isBlank())
                .flatMap(userRepository::findFirstByName)
                .map(User::getEmail)
                .map(String::trim)
                .filter(email -> !email.isBlank())
                .orElse("");
    }

    private Optional<Long> readDSystemIdFromBodyRawJson(String bodyRawJson) {
        if (bodyRawJson == null || bodyRawJson.isBlank()) {
            return Optional.empty();
        }
        try {
            JsonNode root = objectMapper.readTree(bodyRawJson);
            return readLong(root, "dsystem_id")
                    .or(() -> readLong(root, "dsystemId"))
                    .or(() -> readLong(root, "system_id"))
                    .or(() -> readLong(root, "systemId"));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private Optional<Long> readLong(JsonNode node, String fieldName) {
        if (node == null || node.isNull()) {
            return Optional.empty();
        }
        JsonNode value = node.get(fieldName);
        if (value == null || value.isNull()) {
            return Optional.empty();
        }
        return parseSystemId(value.asString());
    }

    private DSystem findDSystemOrThrow(Long systemId) {
        return dSystemRepository.findById(systemId)
                .orElseThrow(() -> new IllegalStateException("존재하지 않는 system_id입니다: " + systemId));
    }

    private Long parseDSystemId(String value) {
        return parseSystemId(value)
                .orElseThrow(() -> new IllegalArgumentException("system_id는 숫자여야 합니다."));
    }

    private Optional<Long> parseSystemId(String value) {
        if (value == null || value.isBlank() || !value.matches("\\d+")) {
            return Optional.empty();
        }
        try {
            return Optional.of(Long.parseLong(value));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    private record SavedReport(
            JsonNode reportJson,
            Info info,
            List<Issue> issues
    ) {
    }

    private record ReportStats(
            int normalCount,
            int warningCount,
            int dangerCount
    ) {
    }

    private record IssueGroup(
            Long infoId,
            String customerName,
            String systemName,
            String issueContent
    ) {
    }

    private enum IssueLevel {
        NORMAL,
        WARNING,
        DANGER
    }
}
