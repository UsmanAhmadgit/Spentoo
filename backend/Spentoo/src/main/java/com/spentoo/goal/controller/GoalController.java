package com.spentoo.goal.controller;

import com.spentoo.goal.dto.CreateGoalRequestDTO;
import com.spentoo.goal.dto.GoalDTO;
import com.spentoo.goal.dto.UpdateGoalRequestDTO;
import com.spentoo.goal.service.GoalService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goals")
public class GoalController {

    private final GoalService goalService;

    public GoalController(GoalService goalService) {
        this.goalService = goalService;
    }

    @PostMapping(consumes = {"application/json", "application/json;charset=UTF-8"})
    public ResponseEntity<GoalDTO> createGoal(
            @Valid @RequestBody CreateGoalRequestDTO requestDTO,
            @AuthenticationPrincipal String userEmail) {
        GoalDTO newGoal = goalService.createGoal(requestDTO, userEmail);
        return new ResponseEntity<>(newGoal, HttpStatus.CREATED);
    }

    @PutMapping(value = "/{id}", consumes = {"application/json", "application/json;charset=UTF-8"})
    public ResponseEntity<GoalDTO> updateGoal(
            @PathVariable("id") Integer id,
            @Valid @RequestBody UpdateGoalRequestDTO requestDTO,
            @AuthenticationPrincipal String userEmail) {
        GoalDTO updatedGoal = goalService.updateGoal(id, requestDTO, userEmail);
        return new ResponseEntity<>(updatedGoal, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGoal(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal String userEmail) {
        goalService.deleteGoal(id, userEmail);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GoalDTO> getSingleGoal(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal String userEmail) {
        GoalDTO goal = goalService.getSingleGoal(id, userEmail);
        return new ResponseEntity<>(goal, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<GoalDTO>> getAllGoals(
            @AuthenticationPrincipal String userEmail) {
        if (userEmail == null || userEmail.trim().isEmpty()) {
            return new ResponseEntity<>(List.of(), HttpStatus.OK);
        }
        try {
            List<GoalDTO> goals = goalService.getAllGoals(userEmail);
            return new ResponseEntity<>(goals, HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("Error in getAllGoals controller: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}
