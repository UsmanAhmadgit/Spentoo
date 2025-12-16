package com.spentoo.bills.controller;

import com.spentoo.bills.dto.BillDTO;
import com.spentoo.bills.dto.CreateBillRequestDTO;
import com.spentoo.bills.dto.UpdateBillRequestDTO;
import com.spentoo.bills.service.BillsService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/bills")
public class BillsController {

    private final BillsService billsService;

    public BillsController(BillsService billsService) {
        this.billsService = billsService;
    }

    @PostMapping(consumes = {"application/json", "application/json;charset=UTF-8"})
    public ResponseEntity<BillDTO> createBill(
            @Valid @RequestBody CreateBillRequestDTO requestDTO,
            @AuthenticationPrincipal String userEmail) {
        BillDTO newBill = billsService.createBill(requestDTO, userEmail);
        return new ResponseEntity<>(newBill, HttpStatus.CREATED);
    }

    @PutMapping(value = "/{id}", consumes = {"application/json", "application/json;charset=UTF-8"})
    public ResponseEntity<BillDTO> updateBill(
            @PathVariable("id") Integer id,
            @Valid @RequestBody UpdateBillRequestDTO requestDTO,
            @AuthenticationPrincipal String userEmail) {
        BillDTO updatedBill = billsService.updateBill(id, requestDTO, userEmail);
        return new ResponseEntity<>(updatedBill, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBill(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal String userEmail) {
        billsService.deleteBill(id, userEmail);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BillDTO> getSingleBill(
            @PathVariable("id") Integer id,
            @AuthenticationPrincipal String userEmail) {
        BillDTO bill = billsService.getSingleBill(id, userEmail);
        return new ResponseEntity<>(bill, HttpStatus.OK);
    }

    @GetMapping
    public ResponseEntity<List<BillDTO>> listBills(
            @AuthenticationPrincipal String userEmail) {
        List<BillDTO> bills = billsService.listBills(userEmail);
        return new ResponseEntity<>(bills, HttpStatus.OK);
    }

    @GetMapping("/analytics")
    public ResponseEntity<BigDecimal> getBillAnalytics(
            @AuthenticationPrincipal String userEmail) {
        BigDecimal totalCreatorShare = billsService.getBillAnalytics(userEmail);
        return new ResponseEntity<>(totalCreatorShare, HttpStatus.OK);
    }
}
