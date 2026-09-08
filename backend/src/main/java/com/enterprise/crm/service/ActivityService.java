package com.enterprise.crm.service;

import com.enterprise.crm.dto.ActivityRequest;
import com.enterprise.crm.dto.ActivityResponse;
import com.enterprise.crm.entity.Activity;
import com.enterprise.crm.entity.Opportunity;
import com.enterprise.crm.entity.User;
import com.enterprise.crm.exception.ResourceNotFoundException;
import com.enterprise.crm.mapper.ActivityMapper;
import com.enterprise.crm.repository.ActivityRepository;
import com.enterprise.crm.repository.OpportunityRepository;
import com.enterprise.crm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final OpportunityRepository opportunityRepository;
    private final UserRepository userRepository;
    private final ActivityMapper activityMapper;

    public List<ActivityResponse> findByOpportunity(Long opportunityId) {
        // Confirma que la oportunidad existe (si no, 404 en vez de una lista vacia engañosa)
        if (!opportunityRepository.existsById(opportunityId)) {
            throw new ResourceNotFoundException("Oportunidad no encontrada: " + opportunityId);
        }
        return activityRepository.findByOpportunityIdOrderByActivityDateDesc(opportunityId).stream()
                .map(activityMapper::toResponse)
                .toList();
    }

    @Transactional
    public ActivityResponse create(Long opportunityId, ActivityRequest request, String authorEmail) {
        Opportunity opportunity = opportunityRepository.findById(opportunityId)
                .orElseThrow(() -> new ResourceNotFoundException("Oportunidad no encontrada: " + opportunityId));

        User author = userRepository.findByEmail(authorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + authorEmail));

        Activity activity = activityMapper.toEntity(request);
        activity.setOpportunity(opportunity);
        activity.setCreatedBy(author);
        activity.setActivityDate(LocalDateTime.now());

        return activityMapper.toResponse(activityRepository.save(activity));
    }
}
