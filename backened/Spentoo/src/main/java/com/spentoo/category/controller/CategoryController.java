package com.spentoo.category.controller;

import com.spentoo.category.dto.CategoryDTO;
import com.spentoo.category.dto.CreateCategoryRequestDTO;
import com.spentoo.category.dto.RenameCategoryRequestDTO;
import com.spentoo.category.dto.UpdateCategoryRequestDTO;
import com.spentoo.category.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @PostMapping
    public ResponseEntity<CategoryDTO> createCategory(
            @Valid @RequestBody CreateCategoryRequestDTO requestDTO,
            @AuthenticationPrincipal String userEmail) {
        CategoryDTO createdCategory = categoryService.createCategory(requestDTO, userEmail);
        return new ResponseEntity<>(createdCategory, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<CategoryDTO>> getAllCategories(
            @AuthenticationPrincipal String userEmail) {
        List<CategoryDTO> categories = categoryService.getAllCategories(userEmail);
        return new ResponseEntity<>(categories, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryDTO> getCategoryById(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal String userEmail) {
        CategoryDTO category = categoryService.getCategoryById(id, userEmail);
        return new ResponseEntity<>(category, HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryDTO> updateCategory(
            @PathVariable("id") Integer id,
            @Valid @RequestBody UpdateCategoryRequestDTO requestDTO,
            @AuthenticationPrincipal String userEmail) {
        CategoryDTO updatedCategory = categoryService.updateCategory(id, requestDTO, userEmail);
        return new ResponseEntity<>(updatedCategory, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal String userEmail) {
        categoryService.deleteCategory(id, userEmail);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @PutMapping("/{id}/restore")
    public ResponseEntity<CategoryDTO> restoreCategory(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal String userEmail) {
        CategoryDTO restoredCategory = categoryService.restoreCategory(id, userEmail);
        return new ResponseEntity<>(restoredCategory, HttpStatus.OK);
    }

    @PutMapping("/{id}/rename")
    public ResponseEntity<CategoryDTO> renameCategory(
            @PathVariable("id") Integer id,
            @Valid @RequestBody RenameCategoryRequestDTO requestDTO,
            @AuthenticationPrincipal String userEmail) {
        CategoryDTO renamedCategory = categoryService.renameCategory(id, requestDTO, userEmail);
        return new ResponseEntity<>(renamedCategory, HttpStatus.OK);
    }

    @GetMapping("/export")
    public ResponseEntity<String> exportCategories(@AuthenticationPrincipal String userEmail) {
        String csvData = categoryService.exportCategories(userEmail);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_PLAIN);
        headers.setContentDispositionFormData("attachment", "categories.csv");

        return new ResponseEntity<>(csvData, headers, HttpStatus.OK);
    }

    @PostMapping("/import")
    public ResponseEntity<String> importCategories(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal String userEmail) throws Exception {
        if (file.isEmpty()) {
            return new ResponseEntity<>("Please upload a CSV file.", HttpStatus.BAD_REQUEST);
        }

        categoryService.importCategories(file, userEmail);
        return new ResponseEntity<>("Categories imported successfully.", HttpStatus.CREATED);
    }
}
