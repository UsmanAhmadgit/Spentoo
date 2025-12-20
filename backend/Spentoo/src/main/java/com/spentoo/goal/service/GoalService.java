package com.spentoo.goal.service;

import com.spentoo.goal.dto.CreateGoalRequestDTO;
import com.spentoo.goal.dto.GoalDTO;
import com.spentoo.goal.dto.UpdateGoalRequestDTO;
import com.spentoo.goal.model.Goal;
import com.spentoo.goal.model.GoalStatus;
import com.spentoo.goal.repository.GoalRepository;
import com.spentoo.user.model.User;
import com.spentoo.user.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class GoalService {

    private final GoalRepository goalRepository;
    private final UserRepository userRepository;
    
    @PersistenceContext
    private EntityManager entityManager;

    public GoalService(GoalRepository goalRepository, UserRepository userRepository) {
        this.goalRepository = goalRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public GoalDTO createGoal(CreateGoalRequestDTO requestDTO, String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));
        Goal newGoal = new Goal();
        newGoal.setUser(user);
        newGoal.setName(requestDTO.getName());
        newGoal.setTargetAmount(requestDTO.getTargetAmount());
        newGoal.setDeadlineDate(requestDTO.getDeadlineDate());
        newGoal.setStatus(GoalStatus.ACTIVE);
        // Use savedAmount from request DTO (user-entered manually)
        newGoal.setSavedAmount(requestDTO.getSavedAmount() != null ? requestDTO.getSavedAmount() : BigDecimal.ZERO);
        newGoal.setProgressPercent(BigDecimal.ZERO); // Initialize before calculation

        // Calculate progressPercent from savedAmount (without recalculating savedAmount)
        calculateProgressFromSavedAmount(newGoal);
        
        Goal savedGoal = goalRepository.save(newGoal);
        // Fetch the goal with user to ensure it's loaded before converting to DTO
        Goal goalWithUser = goalRepository.findByIdAndUser(savedGoal.getGoalId(), user)
                .orElseThrow(() -> new IllegalStateException("Failed to retrieve saved goal."));
        return convertToDTO(goalWithUser);
    }

    @Transactional
    public GoalDTO updateGoal(Integer goalId, UpdateGoalRequestDTO requestDTO, String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));
        Goal goal = goalRepository.findByIdAndUser(goalId, user)
                .orElseThrow(() -> new IllegalStateException("Goal not found or access denied."));

        if (requestDTO.getName() != null) {
            goal.setName(requestDTO.getName());
        }
        if (requestDTO.getTargetAmount() != null) {
            goal.setTargetAmount(requestDTO.getTargetAmount());
        }
        if (requestDTO.getDeadlineDate() != null) {
            goal.setDeadlineDate(requestDTO.getDeadlineDate());
        }
        
        // Update status from request DTO if provided (user can manually set status)
        if (requestDTO.getStatus() != null) {
            goal.setStatus(requestDTO.getStatus());
        }
        
        // Update savedAmount from request DTO if provided (user-entered manually)
        if (requestDTO.getSavedAmount() != null) {
            goal.setSavedAmount(requestDTO.getSavedAmount());
        }
        // Always calculate progressPercent from savedAmount (without recalculating savedAmount from income/expenses)
        calculateProgressFromSavedAmount(goal);
        
        Goal updatedGoal = goalRepository.save(goal);
        // Fetch the goal with user to ensure it's loaded before converting to DTO
        Goal goalWithUser = goalRepository.findByIdAndUser(updatedGoal.getGoalId(), user)
                .orElseThrow(() -> new IllegalStateException("Failed to retrieve updated goal."));
        return convertToDTO(goalWithUser);
    }

    @Transactional
    public void deleteGoal(Integer goalId, String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));
        Goal goal = goalRepository.findByIdAndUser(goalId, user)
                .orElseThrow(() -> new IllegalStateException("Goal not found or access denied."));

        goalRepository.delete(goal);
    }

    @Transactional
    public GoalDTO getSingleGoal(Integer goalId, String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));
        Goal goal = goalRepository.findByIdAndUser(goalId, user)
                .orElseThrow(() -> new IllegalStateException("Goal not found or access denied."));
        
        // Calculate progressPercent from existing savedAmount (without recalculating savedAmount from income/expenses)
        // This ensures progress is up-to-date without overwriting user-entered savedAmount
        calculateProgressFromSavedAmount(goal);
        goalRepository.save(goal);
        
        return convertToDTO(goal);
    }

    @Transactional(readOnly = true)
    public List<GoalDTO> getAllGoals(String userEmail) {
        try {
            if (userEmail == null || userEmail.trim().isEmpty()) {
                throw new IllegalStateException("User email is required.");
            }
            User user = userRepository.findByEmailIgnoreCase(userEmail)
                    .orElseThrow(() -> new IllegalStateException("User not found."));
            
            // Use native SQL query to avoid Hibernate column name mapping issues
            // Hibernate metadata might be cached and using wrong column names (DeadlineDate vs Deadline)
            String sql = "SELECT g.GoalID, g.UserID, g.Name, g.TargetAmount, " +
                        "g.SavedAmount, g.ProgressPercent, g.Deadline, g.Status, g.CreatedAt, g.UpdatedAt " +
                        "FROM Goal g " +
                        "WHERE g.UserID = :userId " +
                        "ORDER BY g.Deadline ASC, g.CreatedAt DESC";
            Query nativeQuery = entityManager.createNativeQuery(sql);
            nativeQuery.setParameter("userId", user.getUserId());
            @SuppressWarnings("unchecked")
            List<Object[]> results = nativeQuery.getResultList();
            
            // Map native query results to Goal entities
            List<Goal> goals = results.stream()
                    .map(row -> {
                        Goal goal = new Goal();
                        goal.setGoalId((Integer) row[0]);
                        goal.setUser(user); // Set the user relationship
                        goal.setName((String) row[2]);
                        goal.setTargetAmount((BigDecimal) row[3]);
                        goal.setSavedAmount((BigDecimal) row[4]);
                        goal.setProgressPercent((BigDecimal) row[5]);
                        // Handle date conversion
                        if (row[6] instanceof java.sql.Date) {
                            goal.setDeadlineDate(((java.sql.Date) row[6]).toLocalDate());
                        } else if (row[6] instanceof java.time.LocalDate) {
                            goal.setDeadlineDate((java.time.LocalDate) row[6]);
                        }
                        // Handle status
                        if (row[7] != null) {
                            goal.setStatus(GoalStatus.valueOf(row[7].toString()));
                        }
                        // Handle timestamps
                        if (row[8] instanceof java.sql.Timestamp) {
                            goal.setCreatedAt(((java.sql.Timestamp) row[8]).toLocalDateTime());
                        } else if (row[8] instanceof java.time.LocalDateTime) {
                            goal.setCreatedAt((java.time.LocalDateTime) row[8]);
                        }
                        if (row[9] instanceof java.sql.Timestamp) {
                            goal.setUpdatedAt(((java.sql.Timestamp) row[9]).toLocalDateTime());
                        } else if (row[9] instanceof java.time.LocalDateTime) {
                            goal.setUpdatedAt((java.time.LocalDateTime) row[9]);
                        }
                        return goal;
                    })
                    .collect(Collectors.toList());
            
            if (goals == null || goals.isEmpty()) {
                return List.of();
            }
            
            // Recalculate progress percentage and status from existing savedAmount (without recalculating savedAmount)
            // This ensures progress is up-to-date without overwriting user-entered savedAmount
            goals.forEach(goal -> {
                calculateProgressFromSavedAmount(goal);
            });
            
            // Convert to DTOs using the updated goal entities
            return goals.stream()
                    .map(this::convertToDTO)
                    .filter(dto -> dto != null)
                    .collect(Collectors.toList());
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("Error in getAllGoals: " + e.getMessage());
            e.printStackTrace();
            throw new IllegalStateException("Failed to retrieve goals: " + e.getMessage(), e);
        }
    }


    // Calculate progressPercent and status from existing savedAmount (without recalculating savedAmount)
    private void calculateProgressFromSavedAmount(Goal goal) {
        if (goal == null || goal.getTargetAmount() == null) {
            goal.setProgressPercent(BigDecimal.ZERO);
            return;
        }

        try {
            BigDecimal savedAmount = goal.getSavedAmount() != null ? goal.getSavedAmount() : BigDecimal.ZERO;
            
            // Calculate progress percentage
            BigDecimal progressPercent = BigDecimal.ZERO;
            if (goal.getTargetAmount().compareTo(BigDecimal.ZERO) > 0) {
                progressPercent = savedAmount.divide(goal.getTargetAmount(), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100));
                // Clamp progress percentage between 0 and 100
                if (progressPercent.compareTo(BigDecimal.ZERO) < 0) {
                    progressPercent = BigDecimal.ZERO;
                } else if (progressPercent.compareTo(BigDecimal.valueOf(100)) > 0) {
                    progressPercent = BigDecimal.valueOf(100);
                }
            }
            goal.setProgressPercent(progressPercent);

            // Auto-update status: if progress reaches 100% or savedAmount >= targetAmount, set to COMPLETED
            // Only auto-update if status is not already manually set to COMPLETED
            if (progressPercent.compareTo(BigDecimal.valueOf(100)) >= 0 || savedAmount.compareTo(goal.getTargetAmount()) >= 0) {
                // Only auto-complete if not already completed (preserve manual status changes)
                if (goal.getStatus() != GoalStatus.COMPLETED) {
                    goal.setStatus(GoalStatus.COMPLETED);
                }
            } else if (goal.getDeadlineDate() != null && goal.getDeadlineDate().isBefore(LocalDate.now())) {
                // Only set to FAILED if not completed and deadline passed
                if (goal.getStatus() != GoalStatus.COMPLETED) {
                    goal.setStatus(GoalStatus.FAILED);
                }
            } else if (goal.getStatus() == null || goal.getStatus() == GoalStatus.COMPLETED) {
                // If status is null or was completed but progress dropped, set to ACTIVE
                if (progressPercent.compareTo(BigDecimal.valueOf(100)) < 0) {
                    goal.setStatus(GoalStatus.ACTIVE);
                }
            }
        } catch (Exception e) {
            System.err.println("Error calculating progress from saved amount: " + e.getMessage());
            e.printStackTrace();
            goal.setProgressPercent(BigDecimal.ZERO);
        }
    }

    // NOTE: calculateAndSetProgress method removed - savedAmount is now manually entered by users
    // Progress is calculated only from user-entered savedAmount, not from income/expenses

    // Convert Goal entity to DTO (reads from entity fields)
    private GoalDTO convertToDTO(Goal goal) {
        if (goal == null) {
            return null;
        }

        try {
            GoalDTO dto = new GoalDTO();
            dto.setGoalId(goal.getGoalId());
            dto.setUserId(goal.getUser() != null ? goal.getUser().getUserId() : null);
            dto.setName(goal.getName());
            dto.setDescription(null); // Description not in database schema
            dto.setTargetAmount(goal.getTargetAmount());
            dto.setDeadlineDate(goal.getDeadlineDate());
            dto.setStatus(goal.getStatus());
            dto.setCreatedAt(goal.getCreatedAt());
            dto.setUpdatedAt(goal.getUpdatedAt());
            // Read from entity fields (stored in database)
            dto.setSavedAmount(goal.getSavedAmount() != null ? goal.getSavedAmount() : BigDecimal.ZERO);
            dto.setProgressPercentage(goal.getProgressPercent() != null ? goal.getProgressPercent() : BigDecimal.ZERO);

            return dto;
        } catch (Exception e) {
            System.err.println("Error converting goal to DTO: " + e.getMessage());
            e.printStackTrace();
            throw new IllegalStateException("Failed to convert goal to DTO: " + e.getMessage(), e);
        }
    }

}
