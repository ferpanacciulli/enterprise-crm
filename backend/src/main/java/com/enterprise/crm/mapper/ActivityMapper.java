package com.enterprise.crm.mapper;

import com.enterprise.crm.dto.ActivityRequest;
import com.enterprise.crm.dto.ActivityResponse;
import com.enterprise.crm.entity.Activity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ActivityMapper {

    @Mapping(target = "opportunity", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "activityDate", ignore = true)
    Activity toEntity(ActivityRequest request);

    @Mapping(target = "opportunityId", source = "opportunity.id")
    @Mapping(target = "createdByName", expression = "java(activity.getCreatedBy().getFirstName() + \" \" + activity.getCreatedBy().getLastName())")
    ActivityResponse toResponse(Activity activity);
}
