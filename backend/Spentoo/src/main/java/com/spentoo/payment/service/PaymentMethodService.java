package com.spentoo.payment.service;

import com.spentoo.payment.dto.CreatePaymentMethodRequestDTO;
import com.spentoo.payment.dto.PaymentMethodDTO;
import com.spentoo.payment.dto.UpdatePaymentMethodRequestDTO;
import com.spentoo.payment.model.PaymentMethod;
import com.spentoo.payment.repository.PaymentMethodRepository;
import com.spentoo.user.model.User;
import com.spentoo.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PaymentMethodService {

    private final PaymentMethodRepository paymentMethodRepository;
    private final UserRepository userRepository;

    public PaymentMethodService(PaymentMethodRepository paymentMethodRepository, UserRepository userRepository) {
        this.paymentMethodRepository = paymentMethodRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void createDefaultCashMethod(User user) {
        Optional<PaymentMethod> existingCash = paymentMethodRepository.findByUserAndNameIgnoreCase(user, "Cash");
        if (existingCash.isEmpty()) {
            PaymentMethod cashMethod = new PaymentMethod();
            cashMethod.setUser(user);
            cashMethod.setName("Cash");
            cashMethod.setActive(true);
            cashMethod.setSystemGenerated(false); // Not system generated
            paymentMethodRepository.save(cashMethod);
        }
    }

    // This method will be used internally to create system-generated payment methods
    @Transactional
    public PaymentMethod createSystemGeneratedPaymentMethod(User user, String name) {
        Optional<PaymentMethod> existing = paymentMethodRepository.findByUserAndNameIgnoreCase(user, name);
        if (existing.isPresent()) {
            return existing.get(); // Return existing if already present
        }

        PaymentMethod newMethod = new PaymentMethod();
        newMethod.setUser(user);
        newMethod.setName(name);
        newMethod.setActive(true);
        newMethod.setSystemGenerated(true); // Mark as system generated
        return paymentMethodRepository.save(newMethod);
    }

    @Transactional
    public PaymentMethodDTO addPaymentMethod(CreatePaymentMethodRequestDTO requestDTO, String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));
        
        // Name is guaranteed not to be null or empty by @NotBlank on DTO
        String trimmedName = requestDTO.getName().trim();

        // Check for duplicate name (case-insensitive)
        Optional<PaymentMethod> existingMethod = paymentMethodRepository.findByUserAndNameIgnoreCase(user, trimmedName);
        if (existingMethod.isPresent()) {
            throw new IllegalStateException("A payment method with this name already exists for your account.");
        }

        // Validate that name is not empty after trim
        if (trimmedName.isEmpty()) {
            throw new IllegalStateException("Payment method name cannot be empty.");
        }

        PaymentMethod newMethod = new PaymentMethod();
        newMethod.setUser(user);
        newMethod.setName(trimmedName);
        newMethod.setProvider(requestDTO.getProvider() != null && !requestDTO.getProvider().trim().isEmpty() 
                ? requestDTO.getProvider().trim() : null);
        newMethod.setAccountNumberMasked(requestDTO.getAccountNumberMasked() != null && !requestDTO.getAccountNumberMasked().trim().isEmpty()
                ? requestDTO.getAccountNumberMasked().trim() : null);
        newMethod.setActive(true);
        newMethod.setSystemGenerated(false); // User-added methods are not system generated
        PaymentMethod savedMethod = paymentMethodRepository.save(newMethod);
        return convertToDTO(savedMethod);
    }

    @Transactional
    public PaymentMethodDTO editPaymentMethod(Integer methodId, UpdatePaymentMethodRequestDTO requestDTO, String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found.")); // Corrected

        PaymentMethod method = paymentMethodRepository.findById(methodId)
                .filter(pm -> pm.getUser().getUserId().equals(user.getUserId()))
                .orElseThrow(() -> new IllegalStateException("Payment method not found or access denied."));

        if (method.isSystemGenerated()) {
            throw new IllegalStateException("System-generated payment methods cannot be modified.");
        }

        String newName = requestDTO.getName() != null ? requestDTO.getName().trim() : null;

        // "Cash" method cannot be renamed
        if ("Cash".equalsIgnoreCase(method.getName()) && newName != null && !newName.equalsIgnoreCase("Cash")) {
            throw new IllegalStateException("The 'Cash' payment method cannot be renamed.");
        }

        // Check for duplicate name if name is being changed (case-insensitive check)
        if (newName != null && !newName.trim().isEmpty() && !newName.equalsIgnoreCase(method.getName())) {
            paymentMethodRepository.findByUserAndNameIgnoreCase(user, newName.trim()).ifPresent(existing -> {
                throw new IllegalStateException("A payment method with this name already exists for your account.");
            });
            method.setName(newName.trim());
        } else if (newName != null && newName.trim().isEmpty()) {
            throw new IllegalStateException("Payment method name cannot be empty.");
        }

        // Update provider - allow setting to null if empty string is provided
        if (requestDTO.getProvider() != null) {
            String provider = requestDTO.getProvider().trim();
            method.setProvider(provider.isEmpty() ? null : provider);
        }
        
        // Update account number masked - allow setting to null if empty string is provided
        if (requestDTO.getAccountNumberMasked() != null) {
            String accountNumber = requestDTO.getAccountNumberMasked().trim();
            method.setAccountNumberMasked(accountNumber.isEmpty() ? null : accountNumber);
        }
        
        // Update active status
        if (requestDTO.getIsActive() != null) {
            method.setActive(requestDTO.getIsActive());
        }

        PaymentMethod updatedMethod = paymentMethodRepository.save(method);
        return convertToDTO(updatedMethod);
    }

    @Transactional
    public void deletePaymentMethod(Integer methodId, String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found.")); // Corrected

        PaymentMethod method = paymentMethodRepository.findById(methodId)
                .filter(pm -> pm.getUser().getUserId().equals(user.getUserId()))
                .orElseThrow(() -> new IllegalStateException("Payment method not found or access denied."));

        if (method.isSystemGenerated()) {
            throw new IllegalStateException("System-generated payment methods cannot be deleted.");
        }
        if ("Cash".equalsIgnoreCase(method.getName())) {
            throw new IllegalStateException("The 'Cash' payment method cannot be deleted.");
        }

        paymentMethodRepository.delete(method);
    }

    @Transactional(readOnly = true)
    public List<PaymentMethodDTO> listPaymentMethods(String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));
        return paymentMethodRepository.findAllByUserAndIsActiveTrue(user)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PaymentMethodDTO> listAllPaymentMethods(String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found."));
        return paymentMethodRepository.findAllByUser(user)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PaymentMethodDTO convertToDTO(PaymentMethod paymentMethod) {
        if (paymentMethod == null) {
            return null;
        }
        PaymentMethodDTO dto = new PaymentMethodDTO();
        dto.setMethodId(paymentMethod.getMethodId());
        dto.setUserId(paymentMethod.getUser().getUserId());
        dto.setName(paymentMethod.getName());
        dto.setProvider(paymentMethod.getProvider());
        dto.setAccountNumberMasked(paymentMethod.getAccountNumberMasked());
        dto.setActive(paymentMethod.isActive());
        dto.setSystemGenerated(paymentMethod.isSystemGenerated());
        dto.setCreatedAt(paymentMethod.getCreatedAt());
        dto.setUpdatedAt(paymentMethod.getUpdatedAt());
        return dto;
    }
}
