package com.spentoo.category.model;

import com.spentoo.user.model.User;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Entity
@Table(name = "Category", uniqueConstraints = {
    @UniqueConstraint(name = "UQ_User_CategoryName", columnNames = {"UserID", "CategoryName"})
})
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CategoryID")
    private Integer categoryId;

    @Column(name = "CategoryName", nullable = false, length = 100)
    private String categoryName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "Type", nullable = false, length = 20)
    private CategoryType type;

    @Column(name = "Icon", length = 50)
    private String icon;

    @Column(name = "Color", length = 20)
    private String color;

    @Column(name = "SortOrder")
    private Integer sortOrder;

    @Column(name = "IsDefault", nullable = false)
    private boolean isDefault = false;

    @Column(name = "IsActive", nullable = false)
    private boolean isActive = true;

    @Column(name = "IsSystemGenerated", nullable = false)
    private boolean isSystemGenerated = false;

    @Column(name = "IsBudgetable", nullable = false)
    private boolean isBudgetable = true; // New field

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ParentCategoryID")
    private Category parentCategory;

    @OneToMany(mappedBy = "parentCategory")
    private Set<Category> subCategories;

    @CreationTimestamp
    @Column(name = "CreatedAt", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "UpdatedAt", nullable = false)
    private LocalDateTime updatedAt;
}
