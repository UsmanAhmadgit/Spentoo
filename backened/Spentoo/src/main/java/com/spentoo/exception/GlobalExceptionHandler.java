package com.spentoo.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles business logic exceptions (e.g., validation errors from service layer).
     * @param ex The exception that was thrown.
     * @param request The current web request.
     * @return A ResponseEntity with the error message and HTTP status 400 (Bad Request).
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<String> handleIllegalStateException(IllegalStateException ex, WebRequest request) {
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles validation errors from @Valid annotations on DTOs.
     * @param ex The MethodArgumentNotValidException that was thrown.
     * @param request The current web request.
     * @return A ResponseEntity with a map of field errors and HTTP status 400 (Bad Request).
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex, WebRequest request) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles unsupported media type exceptions (e.g., Content-Type with charset).
     * @param ex The HttpMediaTypeNotSupportedException that was thrown.
     * @param request The current web request.
     * @return A ResponseEntity with a helpful error message and HTTP status 415 (Unsupported Media Type).
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<String> handleHttpMediaTypeNotSupportedException(HttpMediaTypeNotSupportedException ex, WebRequest request) {
        String message = "Content-Type not supported. Please use 'application/json' without charset parameter.";
        System.err.println("=== HttpMediaTypeNotSupportedException ===");
        System.err.println("Message: " + ex.getMessage());
        System.err.println("Supported types: " + ex.getSupportedMediaTypes());
        return new ResponseEntity<>(message, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
    }

    /**
     * A general-purpose handler for all other exceptions.
     * @param ex The exception that was thrown.
     * @param request The current web request.
     * @return A ResponseEntity with a generic error message and HTTP status 500 (Internal Server Error).
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGlobalException(Exception ex, WebRequest request) {
        // Log the exception with stack trace for debugging
        ex.printStackTrace();
        System.err.println("=== Exception occurred ===");
        System.err.println("Message: " + ex.getMessage());
        System.err.println("Class: " + ex.getClass().getName());
        if (ex.getCause() != null) {
            System.err.println("Cause: " + ex.getCause().getMessage());
        }
        System.err.println("========================");
        
        // Return detailed error message in development, generic in production
        String message = "An unexpected error occurred: " + ex.getMessage();
        if (ex.getCause() != null) {
            message += " (Cause: " + ex.getCause().getMessage() + ")";
        }
        return new ResponseEntity<>(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
