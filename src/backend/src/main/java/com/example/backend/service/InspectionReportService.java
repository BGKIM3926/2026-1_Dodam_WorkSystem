package com.example.backend.service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.entity.DSystem;
import com.example.backend.entity.Info;
import com.example.backend.repository.DSystemRepository;
import com.example.backend.repository.InfoRepository;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class InspectionReportService {

    private static final String TEMPLATE_PATH = "templates/inspection_report.html";
    private static final String ASSET_BASE = "/api/inspectionreport/assets/";
    private static final Pattern MT_PATTERN = Pattern.compile("M/T\\s*:\\s*([^\\r\\n]+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern SERIAL_PATTERN = Pattern.compile("S/N\\s*:\\s*([^\\r\\n]+?)(?:\\s+\\d+\\s*Core|$)", Pattern.CASE_INSENSITIVE);
    private static final Pattern CORE_PATTERN = Pattern.compile("(\\d+)\\s*Core", Pattern.CASE_INSENSITIVE);
    private static final Pattern MEMORY_PATTERN = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*GB", Pattern.CASE_INSENSITIVE);

    private final InfoRepository infoRepository;
    private final DSystemRepository dSystemRepository;
    private final ObjectMapper objectMapper;

    public InspectionReportService(
            InfoRepository infoRepository,
            DSystemRepository dSystemRepository,
            ObjectMapper objectMapper
    ) {
        this.infoRepository = infoRepository;
        this.dSystemRepository = dSystemRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public String generateHtml(List<Long> infoIds) {
        if (infoIds == null || infoIds.isEmpty()) {
            throw new IllegalArgumentException("생성할 info를 선택해 주세요.");
        }

        String template = readTemplate();
        String normalizedTemplate = removeExportScript(rewriteAssetPaths(template));

        if (infoIds.size() == 1) {
            return renderOne(normalizedTemplate, infoIds.get(0));
        }

        String first = renderOne(normalizedTemplate, infoIds.get(0));
        StringBuilder pages = new StringBuilder(extractBodyWithoutScript(first));
        for (int i = 1; i < infoIds.size(); i++) {
            pages.append(extractPageContent(renderOne(normalizedTemplate, infoIds.get(i))));
        }
        return replaceBody(first, pages.toString());
    }

    private String renderOne(String template, Long infoId) {
        Info info = infoRepository.findById(infoId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 info입니다: " + infoId));
        JsonNode root = readJson(info.getBodyRawJson());
        JsonNode content = content(root);
        Long systemId = readLong(root, "system_id", "systemId", "dsystem_id", "dsystemId");
        DSystem system = systemId == null
                ? null
                : dSystemRepository.findById(systemId).orElse(null);

        return applyValues(template, buildValues(system, content));
    }

    private Map<String, String> buildValues(DSystem system, JsonNode content) {
        Map<String, String> values = new LinkedHashMap<>();
        JsonNode resources = child(content, "resources");
        JsonNode cpu = child(resources, "cpu");
        JsonNode memory = child(resources, "memory");
        JsonNode disk = child(resources, "disk");
        JsonNode network = child(resources, "network");
        JsonNode software = child(content, "software");
        JsonNode filesystems = child(disk, "filesystems");
        JsonNode fs1 = arrayItem(filesystems, 0);
        JsonNode fs2 = arrayItem(filesystems, 1);

        int cpuUse = readInt(cpu, "last_pct", 0);
        long memoryTotalMb = readLong(memory, "total_mb", 0L);
        long memoryAvailMb = readLong(memory, "avail_mb", 0L);
        long diskTotalK = readLong(disk, "total_k", 0L);
        long diskAvailK = readLong(disk, "avail_k", 0L);
        String hardwareInfo = system == null ? "" : system.getHardwareInfo();
        String parsedCpuCores = extract(hardwareInfo, CORE_PATTERN);
        String parsedMemoryGb = extract(hardwareInfo, MEMORY_PATTERN);
        String memoryTotalGb = memoryTotalMb > 0 ? mbToGb(memoryTotalMb) : parsedMemoryGb;

        put(values, "reportTitleSystemName", system == null ? "서버" : firstText(system.getSystemName(), system.getSystemNameMin(), "서버"));
        put(values, "siteName", system == null ? "" : system.getCustomerName());
        put(values, "serviceName", system == null ? "" : system.getServiceName());
        put(values, "checker", system == null ? "" : system.getManager());
        put(values, "modelName", system == null ? "" : system.getHardwareName());
        put(values, "osVersion", system == null ? "" : firstText(system.getOsName(), system.getOsInfo()));
        put(values, "mt", extract(hardwareInfo, MT_PATTERN));
        put(values, "serialNumber", extract(hardwareInfo, SERIAL_PATTERN));

        put(values, "cpuCores", firstText(text(cpu, "cores"), parsedCpuCores));
        put(values, "cpuProcess", "");
        put(values, "cpuUsePct", String.valueOf(cpuUse));
        put(values, "cpuIdlePct", String.valueOf(Math.max(0, 100 - cpuUse)));

        put(values, "memoryTotalGb", memoryTotalGb);
        put(values, "memoryUsedGb", mbToGb(Math.max(0, memoryTotalMb - memoryAvailMb)));
        put(values, "memoryUsePct", text(memory, "last_pct"));

        put(values, "diskActivePct", text(disk, "last_pct"));
        put(values, "diskTotalGb", kbToGb(diskTotalK));
        put(values, "diskAvailGb", kbToGb(diskAvailK));
        put(values, "diskUsePct", text(disk, "last_pct"));
        put(values, "dataDiskStatus", readInt(disk, "max_pct", 0) >= 80 ? "80% 이상" : "");

        fillFilesystem(values, "fs1", fs1);
        fillFilesystem(values, "fs2", fs2);

        putChecks(values, "hw", true);
        putChecks(values, "cpu", isNormal(cpu));
        putChecks(values, "memory", isNormal(memory));
        putChecks(values, "disk", isNormal(disk));
        putChecks(values, "service", softwareNormal(software));
        putChecks(values, "network", isNormal(network));

        put(values, "actionNote", buildActionNote(content));
        put(values, "inspectionResult", buildInspectionResult(content, cpu, memory, disk, network, software));

        return values;
    }

    private void fillFilesystem(Map<String, String> values, String prefix, JsonNode fs) {
        put(values, prefix + "Mount", text(fs, "mount"));
        put(values, prefix + "Name", text(fs, "fs"));
        put(values, prefix + "SizeGb", kbToGb(readLong(fs, "total_k", 0L)));
        put(values, prefix + "AvailGb", kbToGb(readLong(fs, "avail_k", 0L)));
        put(values, prefix + "UsePct", text(fs, "used_pct"));
    }

    private String buildActionNote(JsonNode content) {
        JsonNode issues = child(content, "issues");
        if (issues == null || !issues.isArray() || issues.isEmpty()) {
            return "특이사항 없음";
        }

        Map<String, Integer> issueCounts = new LinkedHashMap<>();
        for (JsonNode issue : issues) {
            String key = firstText(
                    text(issue, "event_code"),
                    text(issue, "type"),
                    text(issue, "category"),
                    text(issue, "issuekey"),
                    text(issue, "detail"),
                    text(issue, "message")
            );
            if (!key.isBlank()) {
                issueCounts.merge(key.trim(), 1, Integer::sum);
            }
        }

        if (issueCounts.isEmpty()) {
            return "특이사항 없음";
        }

        StringBuilder result = new StringBuilder();
        for (Map.Entry<String, Integer> entry : issueCounts.entrySet()) {
            if (result.length() > 0) {
                result.append("\n");
            }
            result.append("- ").append(displayIssueName(entry.getKey()));
            if (entry.getValue() > 1) {
                result.append(" ").append(entry.getValue()).append("건");
            }
            result.append(" 확인");
        }
        return result.toString();
    }

    private String displayIssueName(String key) {
        String normalized = key == null ? "" : key.trim();
        String upper = normalized.toUpperCase();
        if (upper.contains("CPU")) {
            return "CPU 사용률 경고";
        }
        if (upper.contains("MEMORY") || upper.contains("MEM")) {
            return "메모리 사용률 경고";
        }
        if (upper.contains("DISK") || upper.contains("FILESYSTEM") || upper.contains("FS")) {
            return "디스크 사용률 경고";
        }
        if (upper.contains("NETWORK") || upper.contains("NET")) {
            return "네트워크 상태 경고";
        }
        if (upper.contains("SERVICE")) {
            return "서비스 상태 경고";
        }
        if (upper.contains("SWAP")) {
            return "스왑 사용률 경고";
        }
        if (upper.contains("LOAD")) {
            return "시스템 부하 경고";
        }
        return normalized;
    }

    private String buildInspectionResult(JsonNode content, JsonNode cpu, JsonNode memory, JsonNode disk, JsonNode network, JsonNode software) {
        StringBuilder result = new StringBuilder();
        appendAbnormalStatus(result, "CPU", text(cpu, "status"));
        appendAbnormalStatus(result, "MEMORY", text(memory, "status"));
        appendAbnormalStatus(result, "DISK", text(disk, "status"));
        appendAbnormalStatus(result, "NETWORK", text(network, "status"));
        if (!softwareNormal(software)) {
            appendResultItem(result, "SERVICE 확인 필요");
        }
        return result.length() == 0 ? "전체 정상" : result.toString();
    }

    private void appendAbnormalStatus(StringBuilder result, String label, String status) {
        if (status == null || status.isBlank() || "info".equalsIgnoreCase(status)) {
            return;
        }
        appendResultItem(result, label + " " + displayStatus(status));
    }

    private void appendResultItem(StringBuilder result, String value) {
        if (result.length() > 0) {
            result.append(" / ");
        }
        result.append(value);
    }

    private boolean softwareNormal(JsonNode software) {
        if (software == null || software.isNull()) {
            return true;
        }
        for (JsonNode item : software) {
            String state = text(item, "state");
            if (!state.isBlank() && !"running".equalsIgnoreCase(state)) {
                return false;
            }
        }
        return true;
    }

    private boolean isNormal(JsonNode node) {
        String status = text(node, "status");
        return status.isBlank() || "info".equalsIgnoreCase(status);
    }

    private void putChecks(Map<String, String> values, String prefix, boolean normal) {
        put(values, prefix + "NormalCheck", normal ? "☑" : "□");
        put(values, prefix + "EtcCheck", normal ? "□" : "☑");
    }

    private String applyValues(String template, Map<String, String> values) {
        String html = template;
        for (Map.Entry<String, String> entry : values.entrySet()) {
            html = html.replace("{{" + entry.getKey() + "}}", formatReplacement(entry.getKey(), entry.getValue()));
        }
        return html.replaceAll("\\{\\{[A-Za-z0-9_]+}}", "");
    }

    private String readTemplate() {
        try {
            return new String(new ClassPathResource(TEMPLATE_PATH).getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("점검서 템플릿을 읽을 수 없습니다.", e);
        }
    }

    private String rewriteAssetPaths(String html) {
        return html
                .replace("href=\"점검서_style.css\"", "href=\"" + ASSET_BASE + "점검서_style.css\"")
                .replace("href=\"점검서_custom.css\"", "href=\"" + ASSET_BASE + "점검서_custom.css\"")
                .replace("url('점검서_hd1.png')", "url('" + ASSET_BASE + "점검서_hd1.png')")
                .replace("윈도우 서버 정기점검 보고서", "{{reportTitleSystemName}} 정기점검 보고서")
                .replace("</head>", inspectionReportStyle() + "</head>");
    }

    private String removeExportScript(String html) {
        return html.replaceAll("(?is)<script\\b[^>]*>.*?</script>", "");
    }

    private JsonNode readJson(String value) {
        try {
            return objectMapper.readTree(value);
        } catch (Exception e) {
            throw new IllegalStateException("info JSON을 읽을 수 없습니다.");
        }
    }

    private JsonNode content(JsonNode root) {
        JsonNode content = child(root, "content");
        return content == null || content.isNull() ? root : content;
    }

    private JsonNode child(JsonNode node, String field) {
        return node == null || node.isNull() ? null : node.get(field);
    }

    private JsonNode arrayItem(JsonNode node, int index) {
        return node != null && node.isArray() && node.size() > index ? node.get(index) : null;
    }

    private String text(JsonNode node, String field) {
        JsonNode value = child(node, field);
        return value == null || value.isNull() ? "" : value.asString();
    }

    private Long readLong(JsonNode node, String... fields) {
        for (String field : fields) {
            JsonNode value = child(node, field);
            if (value == null || value.isNull()) {
                continue;
            }
            try {
                return Long.parseLong(value.asString());
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }

    private long readLong(JsonNode node, String field, long defaultValue) {
        String value = text(node, field);
        if (value.isBlank()) {
            return defaultValue;
        }
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    private int readInt(JsonNode node, String field, int defaultValue) {
        String value = text(node, field);
        if (value.isBlank()) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    private String mbToGb(long mb) {
        return decimal(BigDecimal.valueOf(mb).divide(BigDecimal.valueOf(1024), 2, RoundingMode.HALF_UP));
    }

    private String kbToGb(long kb) {
        return decimal(BigDecimal.valueOf(kb).divide(BigDecimal.valueOf(1024 * 1024), 2, RoundingMode.HALF_UP));
    }

    private String decimal(BigDecimal value) {
        if (value.compareTo(BigDecimal.ZERO) == 0) {
            return "";
        }
        return value.stripTrailingZeros().toPlainString();
    }

    private void put(Map<String, String> values, String key, String value) {
        values.put(key, value == null ? "" : value);
    }

    private String extract(String value, Pattern pattern) {
        if (value == null || value.isBlank()) {
            return "";
        }
        Matcher matcher = pattern.matcher(value);
        return matcher.find() ? matcher.group(1).trim() : "";
    }

    private String displayStatus(String status) {
        if (status == null || status.isBlank() || "info".equalsIgnoreCase(status)) {
            return "정상";
        }
        if ("warn".equalsIgnoreCase(status)) {
            return "주의";
        }
        if ("danger".equalsIgnoreCase(status)) {
            return "위험";
        }
        return status;
    }

    private String formatReplacement(String key, String value) {
        String escaped = escapeHtml(value);
        if ("actionNote".equals(key)) {
            return "<span class=\"inspection-report-note\">" + escaped.replace("\n", "<br>") + "</span>";
        }
        if ("inspectionResult".equals(key)) {
            return "<span class=\"inspection-report-result\">" + escaped + "</span>";
        }
        if (key.matches("fs\\d+Name")) {
            return "<span class=\"inspection-report-filesystem\">" + escaped + "</span>";
        }
        if (isNumericValueKey(key)) {
            return "<span class=\"inspection-report-number\">" + escaped + "</span>";
        }
        return escaped;
    }

    private boolean isNumericValueKey(String key) {
        return key.endsWith("Pct")
                || key.endsWith("Gb")
                || key.endsWith("Cores")
                || "cpuProcess".equals(key)
                || "diskActivePct".equals(key);
    }

    private String inspectionReportStyle() {
        return """
                <style>
                .inspection-report-number {
                    font-family: "맑은 고딕", "Malgun Gothic", sans-serif !important;
                    font-size: 8pt !important;
                    font-weight: 400 !important;
                    letter-spacing: -0.01em !important;
                    line-height: 1.1 !important;
                }
                .cs19 {
                    font-size: 8pt !important;
                    line-height: 1.1 !important;
                }
                .cs19 .inspection-report-number {
                    font-size: inherit !important;
                    line-height: inherit !important;
                }
                .inspection-report-filesystem {
                    display: inline-block;
                    width: 35mm;
                    max-width: 35mm;
                    font-family: "맑은 고딕", "Malgun Gothic", sans-serif !important;
                    font-size: 6.8pt !important;
                    font-weight: 400 !important;
                    line-height: 1.12 !important;
                    letter-spacing: -0.02em !important;
                    white-space: normal !important;
                    word-break: break-all !important;
                    overflow-wrap: anywhere !important;
                    text-align: left !important;
                    vertical-align: middle !important;
                }
                .inspection-report-note {
                    display: inline-block;
                    max-width: 111mm;
                    font-family: "맑은 고딕", "Malgun Gothic", sans-serif !important;
                    font-size: 8pt !important;
                    font-weight: 400 !important;
                    line-height: 1.45 !important;
                    letter-spacing: -0.01em !important;
                    white-space: normal !important;
                    word-break: keep-all !important;
                    overflow-wrap: anywhere !important;
                    text-align: left !important;
                }
                .inspection-report-result {
                    display: inline-block;
                    width: 111mm;
                    max-width: 111mm;
                    font-family: "맑은 고딕", "Malgun Gothic", sans-serif !important;
                    font-size: 8pt !important;
                    font-weight: 400 !important;
                    letter-spacing: -0.01em !important;
                    line-height: 1.25 !important;
                    white-space: normal !important;
                    word-break: keep-all !important;
                    overflow-wrap: anywhere !important;
                    text-align: left !important;
                    vertical-align: middle !important;
                }
                </style>
                """;
    }

    private String firstText(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    private String escapeHtml(String value) {
        return value == null ? "" : value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private String extractBodyWithoutScript(String html) {
        int bodyStart = html.indexOf("<body>");
        int bodyEnd = html.lastIndexOf("</body>");
        if (bodyStart < 0 || bodyEnd < 0) {
            return html;
        }
        int scriptStart = html.indexOf("<script", bodyStart);
        int contentEnd = scriptStart >= 0 && scriptStart < bodyEnd ? scriptStart : bodyEnd;
        return html.substring(bodyStart + "<body>".length(), contentEnd);
    }

    private String extractPageContent(String html) {
        return extractBodyWithoutScript(html);
    }

    private String replaceBody(String html, String bodyContent) {
        int bodyStart = html.indexOf("<body>");
        int bodyEnd = html.lastIndexOf("</body>");
        if (bodyStart < 0 || bodyEnd < 0) {
            return html;
        }
        return html.substring(0, bodyStart + "<body>".length())
                + bodyContent
                + html.substring(bodyEnd);
    }
}
