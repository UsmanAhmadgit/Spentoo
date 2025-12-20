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

    @PostMapping
    public ResponseEntity<BillDTO> createBill(
            @Valid @RequestBody CreateBillRequestDTO requestDTO,
            @AuthenticationPrincipal String userEmail) {
        BillDTO newBill = billsService.createBill(requestDTO, userEmail);
        return new ResponseEntity<>(newBill, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
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
            @RequestParam(required = false) String filter,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @AuthenticationPrincipal String userEmail) {
        List<BillDTO> bills;
        
        // If custom date range is provided, use it (takes priority over filter)
        if (startDate != null && !startDate.trim().isEmpty() && endDate != null && !endDate.trim().isEmpty()) {
            try {
                java.time.LocalDate start = java.time.LocalDate.parse(startDate.trim());
                java.time.LocalDate end = java.time.LocalDate.parse(endDate.trim());
                bills = billsService.listBillsByDateRange(userEmail, start, end);
            } catch (java.time.format.DateTimeParseException e) {
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            } catch (IllegalStateException e) {
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            } catch (Exception e) {
                return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        } else if (filter != null) {
            switch (filter.toLowerCase()) {
                case "lastweek":
                    bills = billsService.listBillsLastWeek(userEmail);
                    break;
                case "lastmonth":
                    bills = billsService.listBillsLastMonth(userEmail);
                    break;
                case "lastyear":
                    bills = billsService.listBillsLastYear(userEmail);
                    break;
                default:
                    bills = billsService.listBills(userEmail);
                    break;
            }
        } else {
            bills = billsService.listBills(userEmail);
        }
        
        return new ResponseEntity<>(bills, HttpStatus.OK);
    }

    @GetMapping("/analytics")
    public ResponseEntity<BigDecimal> getBillAnalytics(
            @AuthenticationPrincipal String userEmail) {
        BigDecimal totalCreatorShare = billsService.getBillAnalytics(userEmail);
        return new ResponseEntity<>(totalCreatorShare, HttpStatus.OK);
    }
}
