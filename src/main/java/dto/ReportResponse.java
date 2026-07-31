package dto;
/**
 *
 * @author Cerbero
 */
import java.time.LocalDate;
import java.util.List;

public class ReportResponse {

    private String reportName;

    private LocalDate generatedAt;

    private List<?> data;

}