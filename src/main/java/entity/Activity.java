package entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;

import enums.ActivityType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 *
 * @author Cerbero
 */

@Entity
@Table(name = "activities")
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private ActivityType type;

    private String description;

    private LocalDateTime activityDate;

    @ManyToOne(fetch = FetchType.LAZY)
    private Opportunity opportunity;

    @ManyToOne(fetch = FetchType.LAZY)
    private User createdBy;
}
