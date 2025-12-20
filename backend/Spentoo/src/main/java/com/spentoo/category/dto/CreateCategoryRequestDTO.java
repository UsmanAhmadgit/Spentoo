package com.spentoo.category.dto;

import com.spentoo.category.model.CategoryType;
import lombok.Data;

@Data
public class CreateCategoryRequestDTO {

    private String categoryName;

    private CategoryType type;

    private String icon;

    private String color;

    private Integer sortOrder;

    private Integer parentCategoryId;
}
