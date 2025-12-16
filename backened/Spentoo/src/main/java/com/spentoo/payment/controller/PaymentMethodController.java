package com.spentoo.payment.controller;

import com.spentoo.payment.dto.CreatePaymentMethodRequestDTO;
import com.spentoo.payment.dto.PaymentMethodDTO;
import com.spentoo.payment.dto.UpdatePaymentMethodRequestDTO;
import com.spentoo.payment.service.PaymentMethodService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payment-methods")
public class PaymentMethodController {

    private final PaymentMethodService paymentMethodService;

    public PaymentMethodController(PaymentMethodService paymentMethodService) {
        this.paymentMethodService = paymentMethodService;
    }

    @PostMapping
    public ResponseEntity<PaymentMethodDTO> addPaymentMethod(
            @Valid @RequestBody CreatePaymentMethodRequestDTO requestDTO,
            @AuthenticationPrincipal String userEmail) {
        PaymentMethodDTO newMethod = paymentMethodService.addPaymentMethod(requestDTO, userEmail);
        return new ResponseEntity<>(newMethod, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PaymentMethodDTO> editPaymentMethod(
            @PathVariable("id") Integer id,
            @Valid @RequestBody UpdatePaymentMethodRequestDTO requestDTO,
            @AuthenticationPrincipal String userEmail) {
        PaymentMethodDTO updatedMethod = paymentMethodService.editPaymentMethod(id, requestDTO, userEmail);
        return new ResponseEntity<>(updatedMethod, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePaymentMethod(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal String userEmail) {
        paymentMethodService.deletePaymentMethod(id, userEmail);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @GetMapping
    public ResponseEntity<List<PaymentMethodDTO>> listPaymentMethods(
            @AuthenticationPrincipal String userEmail) {
        List<PaymentMethodDTO> methods = paymentMethodService.listPaymentMethods(userEmail);
        return new ResponseEntity<>(methods, HttpStatus.OK);
    }

    @GetMapping("/all")
    public ResponseEntity<List<PaymentMethodDTO>> listAllPaymentMethods(
            @AuthenticationPrincipal String userEmail) {
        List<PaymentMethodDTO> methods = paymentMethodService.listAllPaymentMethods(userEmail);
        return new ResponseEntity<>(methods, HttpStatus.OK);
    }
}
