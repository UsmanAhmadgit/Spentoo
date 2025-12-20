package com.spentoo.category.dto;

import com.spentoo.category.model.CategoryType;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Set;

@Data
public class CategoryDTO {

    private Integer categoryId;
    private String categoryName;
    private CategoryType type;
    private String icon;
    private String color;
    private Integer sortOrder;
    private boolean isDefault;
    private boolean isActive;
    private Integer parentCategoryId;
    private Set<CategoryDTO> subCategories;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
