package com.spentoo.category.repository;

import com.spentoo.category.model.Category;
import com.spentoo.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Integer> {

    /**
     * Finds a category by its name, ignoring case.
     *
     * @param categoryName The name of the category to find.
     * @return An Optional containing the found category, or empty if not found.
     */
    Optional<Category> findByCategoryNameIgnoreCase(String categoryName);

    /**
     * Finds all active categories for a specific user.
     *
     * @param user The user whose categories to find.
     * @return A list of active categories.
     */
    List<Category> findAllByUserAndIsActiveTrue(User user);

    /**
     * Finds all categories for a specific user (both active and inactive).
     *
     * @param user The user whose categories to find.
     * @return A list of all categories.
     */
    List<Category> findAllByUser(User user);

    /**
     * Finds an active category by its name, ignoring case.
     * Used to prevent name conflicts when restoring or creating a category.
     *
     * @param categoryName The name of the category to find.
     * @return An Optional containing the found active category, or empty if not found.
     */
    Optional<Category> findByCategoryNameIgnoreCaseAndIsActiveTrue(String categoryName);

    /**
     * Finds a category by user, name (ignoring case), and system-generated status.
     * Used to retrieve system-generated categories like "Recurring Payments".
     *
     * @param user The user who owns the category.
     * @param name The name of the category.
     * @param isSystemGenerated Whether the category is system-generated.
     * @return An Optional containing the found category, or empty if not found.
     */
    Optional<Category> findByUserAndCategoryNameIgnoreCaseAndIsSystemGenerated(User user, String name, boolean isSystemGenerated);

    /**
     * Finds a category by user and name (ignoring case).
     * Used to check for duplicate category names per user.
     *
     * @param user The user who owns the category.
     * @param categoryName The name of the category.
     * @return An Optional containing the found category, or empty if not found.
     */
    Optional<Category> findByUserAndCategoryNameIgnoreCase(User user, String categoryName);

    /**
     * Finds an active category by user and name (ignoring case).
     * Used to check for duplicate active category names per user.
     *
     * @param user The user who owns the category.
     * @param categoryName The name of the category.
     * @return An Optional containing the found active category, or empty if not found.
     */
    Optional<Category> findByUserAndCategoryNameIgnoreCaseAndIsActiveTrue(User user, String categoryName);

    /**
     * Finds all active subcategories for a specific parent category and user.
     * Used to get subcategories when creating a subcategory budget.
     *
     * @param user The user who owns the categories.
     * @param parentCategory The parent category.
     * @return A list of active subcategories.
     */
    List<Category> findAllByUserAndParentCategoryAndIsActiveTrue(User user, Category parentCategory);
}
