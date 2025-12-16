package com.spentoo.goal.repository;

import com.spentoo.goal.model.Goal;
import com.spentoo.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GoalRepository extends JpaRepository<Goal, Integer> {

    /**
     * Finds all goals for a specific user with eager fetching of user.
     * This prevents N+1 query problems.
     * Uses native query to ensure correct column names match database schema.
     * @param user The user whose goals to find.
     * @return A list of goals for the given user.
     */
    @Query(value = "SELECT g.GoalID, g.UserID, g.Name, g.TargetAmount, " +
           "g.SavedAmount, g.ProgressPercent, g.Deadline, g.Status, g.CreatedAt, g.UpdatedAt " +
           "FROM Goal g " +
           "WHERE g.UserID = :userId " +
           "ORDER BY g.Deadline ASC, g.CreatedAt DESC", nativeQuery = true)
    List<Object[]> findAllByUserNative(@Param("userId") Integer userId);
    
    /**
     * Finds all goals for a specific user with eager fetching of user.
     * This prevents N+1 query problems.
     * @param user The user whose goals to find.
     * @return A list of goals for the given user.
     */
    @Query("SELECT g FROM Goal g " +
           "LEFT JOIN FETCH g.user " +
           "WHERE g.user = :user " +
           "ORDER BY g.deadlineDate ASC, g.createdAt DESC")
    List<Goal> findAllByUser(@Param("user") User user);

    /**
     * Finds a goal by ID and user with eager fetching.
     * @param goalId The goal ID.
     * @param user The user.
     * @return An Optional containing the goal if found and owned by user.
     */
    @Query("SELECT g FROM Goal g " +
           "LEFT JOIN FETCH g.user " +
           "WHERE g.goalId = :goalId AND g.user = :user")
    Optional<Goal> findByIdAndUser(@Param("goalId") Integer goalId, @Param("user") User user);
}
