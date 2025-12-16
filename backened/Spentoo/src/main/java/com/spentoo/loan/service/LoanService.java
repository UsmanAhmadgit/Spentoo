package com.spentoo.loan.service;

import com.spentoo.category.model.Category;
import com.spentoo.category.repository.CategoryRepository;
import com.spentoo.category.service.CategoryService;
import com.spentoo.expense.dto.CreateExpenseRequestDTO;
import com.spentoo.expense.service.ExpenseService;
import com.spentoo.income.dto.CreateIncomeRequestDTO;
import com.spentoo.income.service.IncomeService;
import com.spentoo.loan.dto.AddInstallmentRequestDTO;
import com.spentoo.loan.dto.CreateLoanRequestDTO;
import com.spentoo.loan.dto.LoanAnalyticsDTO;
import com.spentoo.loan.dto.LoanDTO;
import com.spentoo.loan.dto.LoanInstallmentDTO;
import com.spentoo.loan.dto.UpdateLoanRequestDTO;
import com.spentoo.loan.model.Loan;
import com.spentoo.loan.model.LoanInstallment;
import com.spentoo.loan.model.LoanStatus;
import com.spentoo.loan.model.LoanType;
import com.spentoo.loan.repository.LoanInstallmentRepository;
import com.spentoo.loan.repository.LoanRepository;
import com.spentoo.payment.model.PaymentMethod;
import com.spentoo.payment.repository.PaymentMethodRepository;
import com.spentoo.payment.service.PaymentMethodService;
import com.spentoo.user.model.User;
import com.spentoo.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LoanService {

    private final LoanRepository loanRepository;
    private final LoanInstallmentRepository loanInstallmentRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final ExpenseService expenseService;
    private final IncomeService incomeService;
    // Removed CategoryService as it's not directly used in LoanService
    private final PaymentMethodService paymentMethodService;

    public LoanService(LoanRepository loanRepository, LoanInstallmentRepository loanInstallmentRepository,
                       UserRepository userRepository, CategoryRepository categoryRepository,
                       PaymentMethodRepository paymentMethodRepository, ExpenseService expenseService,
                       IncomeService incomeService, PaymentMethodService paymentMethodService) { // Removed CategoryService from constructor
        this.loanRepository = loanRepository;
        this.loanInstallmentRepository = loanInstallmentRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.paymentMethodRepository = paymentMethodRepository;
        this.expenseService = expenseService;
        this.incomeService = incomeService;
        this.paymentMethodService = paymentMethodService;
    }

    @Transactional
    public LoanDTO createLoan(CreateLoanRequestDTO requestDTO, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found.")); // Corrected

        // Validations (some handled by DTO annotations, but re-check business logic)
        if (requestDTO.getOriginalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("Original amount must be greater than 0.");
        }
        if (requestDTO.getPersonName() == null || requestDTO.getPersonName().trim().isEmpty()) {
            throw new IllegalStateException("Person name cannot be empty.");
        }

        Loan newLoan = new Loan();
        newLoan.setUser(user);
        newLoan.setType(requestDTO.getType());
        newLoan.setPersonName(requestDTO.getPersonName());
        newLoan.setOriginalAmount(requestDTO.getOriginalAmount());
        newLoan.setRemainingAmount(requestDTO.getOriginalAmount()); // Initially remaining is original amount
        newLoan.setInterestRate(requestDTO.getInterestRate());
        newLoan.setStartDate(requestDTO.getStartDate());
        newLoan.setDueDate(requestDTO.getDueDate());
        newLoan.setNotes(requestDTO.getNotes());
        newLoan.setStatus(LoanStatus.ACTIVE); // Default status

        Loan savedLoan = loanRepository.save(newLoan);
        return convertToDTO(savedLoan);
    }

    @Transactional
    public LoanDTO addInstallment(Integer loanId, AddInstallmentRequestDTO requestDTO, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found.")); // Corrected

        Loan loan = loanRepository.findById(loanId)
                .filter(l -> l.getUser().getUserId().equals(user.getUserId()))
                .orElseThrow(() -> new IllegalStateException("Loan not found or access denied."));

        if (loan.getStatus() == LoanStatus.CLOSED) {
            throw new IllegalStateException("Cannot add installment to a closed loan.");
        }
        if (requestDTO.getAmountPaid().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("Installment amount must be greater than 0.");
        }

        // Handle Payment Method
        PaymentMethod paymentMethod;
        if (requestDTO.getPaymentMethodId() == null) {
            // Default to "Cash" if no payment method is provided
            paymentMethod = paymentMethodRepository.findByUserAndName(user, "Cash")
                    .orElseThrow(() -> new IllegalStateException("Default 'Cash' payment method not found for user."));
        } else {
            // Find and validate the provided payment method
            paymentMethod = paymentMethodRepository.findById(requestDTO.getPaymentMethodId())
                    .filter(pm -> pm.getUser().getUserId().equals(user.getUserId()))
                    .orElseThrow(() -> new IllegalStateException("Payment method not found or access denied."));
        }

        // Create and save LoanInstallment
        LoanInstallment newInstallment = new LoanInstallment();
        newInstallment.setLoan(loan);
        newInstallment.setAmountPaid(requestDTO.getAmountPaid());
        newInstallment.setPaymentDate(requestDTO.getPaymentDate());
        newInstallment.setPaymentMethod(paymentMethod);
        newInstallment.setAutoGenerated(false); // Manually added installment
        newInstallment.setNotes(requestDTO.getNotes());
        loanInstallmentRepository.save(newInstallment);

        // Update RemainingAmount
        loan.setRemainingAmount(loan.getRemainingAmount().subtract(requestDTO.getAmountPaid()));

        // Auto-close loan if RemainingAmount <= 0
        if (loan.getRemainingAmount().compareTo(BigDecimal.ZERO) <= 0) {
            loan.setRemainingAmount(BigDecimal.ZERO); // Ensure it's not negative
            loan.setStatus(LoanStatus.CLOSED);
        }

        // Create Expense/Income entry
        if (loan.getType() == LoanType.TAKEN) {
            Category loanPaymentsCategory = categoryRepository.findByUserAndCategoryNameIgnoreCaseAndIsSystemGenerated(user, "Loan Payments", true)
                    .orElseThrow(() -> new IllegalStateException("System-generated 'Loan Payments' category not found for user."));
            CreateExpenseRequestDTO expenseRequest = new CreateExpenseRequestDTO();
            expenseRequest.setCategoryId(loanPaymentsCategory.getCategoryId());
            expenseRequest.setPaymentMethodId(paymentMethod.getMethodId());
            expenseRequest.setAmount(requestDTO.getAmountPaid());
            expenseRequest.setDescription("Installment for loan with " + loan.getPersonName());
            expenseService.addExpense(expenseRequest, userEmail);
        } else if (loan.getType() == LoanType.GIVEN) {
            Category loanRepaymentsCategory = categoryRepository.findByUserAndCategoryNameIgnoreCaseAndIsSystemGenerated(user, "Loan Repayments", true)
                    .orElseThrow(() -> new IllegalStateException("System-generated 'Loan Repayments' category not found for user."));
            CreateIncomeRequestDTO incomeRequest = new CreateIncomeRequestDTO();
            incomeRequest.setCategoryId(loanRepaymentsCategory.getCategoryId());
            incomeRequest.setAmount(requestDTO.getAmountPaid());
            incomeRequest.setSource("Repayment from " + loan.getPersonName());
            incomeRequest.setDescription("Repayment from " + loan.getPersonName());
            incomeService.addIncome(incomeRequest, userEmail);
        }

        Loan updatedLoan = loanRepository.save(loan);
        return convertToDTO(updatedLoan);
    }

    @Transactional
    public LoanDTO updateLoan(Integer loanId, UpdateLoanRequestDTO requestDTO, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found.")); // Corrected

        Loan loan = loanRepository.findById(loanId)
                .filter(l -> l.getUser().getUserId().equals(user.getUserId()))
                .orElseThrow(() -> new IllegalStateException("Loan not found or access denied."));

        // Allowed updates: PersonName, Notes, DueDate, InterestRate
        if (requestDTO.getPersonName() != null) {
            loan.setPersonName(requestDTO.getPersonName());
        }
        if (requestDTO.getNotes() != null) {
            loan.setNotes(requestDTO.getNotes());
        }
        if (requestDTO.getDueDate() != null) {
            loan.setDueDate(requestDTO.getDueDate());
        }
        if (requestDTO.getInterestRate() != null) {
            loan.setInterestRate(requestDTO.getInterestRate());
        }
        // Allow manual closing if remaining amount is zero
        if (requestDTO.getStatus() == LoanStatus.CLOSED) {
            if (loan.getRemainingAmount().compareTo(BigDecimal.ZERO) != 0) {
                throw new IllegalStateException("Cannot close loan manually unless remaining amount is zero.");
            }
            loan.setStatus(LoanStatus.CLOSED);
        }

        Loan updatedLoan = loanRepository.save(loan);
        return convertToDTO(updatedLoan);
    }

    @Transactional
    public void deleteLoan(Integer loanId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found.")); // Corrected

        Loan loan = loanRepository.findById(loanId)
                .filter(l -> l.getUser().getUserId().equals(user.getUserId()))
                .orElseThrow(() -> new IllegalStateException("Loan not found or access denied."));

        if (!loan.getInstallments().isEmpty()) {
            throw new IllegalStateException("Loan cannot be deleted because it has installment records.");
        }

        loanRepository.delete(loan); // Hard delete
    }

    @Transactional
    public LoanDTO closeLoanManually(Integer loanId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found.")); // Corrected

        Loan loan = loanRepository.findById(loanId)
                .filter(l -> l.getUser().getUserId().equals(user.getUserId()))
                .orElseThrow(() -> new IllegalStateException("Loan not found or access denied."));

        if (loan.getRemainingAmount().compareTo(BigDecimal.ZERO) != 0) {
            throw new IllegalStateException("Cannot close loan manually unless remaining amount is zero.");
        }
        loan.setStatus(LoanStatus.CLOSED);
        Loan closedLoan = loanRepository.save(loan);
        return convertToDTO(closedLoan);
    }

    @Transactional(readOnly = true)
    public LoanDTO getSingleLoan(Integer loanId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found.")); // Corrected

        return loanRepository.findById(loanId)
                .filter(l -> l.getUser().getUserId().equals(user.getUserId()))
                .map(this::convertToDTO)
                .orElseThrow(() -> new IllegalStateException("Loan not found or access denied."));
    }

    @Transactional(readOnly = true)
    public List<LoanDTO> getAllLoans(String userEmail, boolean includeClosed) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found.")); // Corrected

        List<Loan> loans = loanRepository.findAllByUser(user);
        if (!includeClosed) {
            loans = loans.stream()
                    .filter(loan -> loan.getStatus() == LoanStatus.ACTIVE)
                    .collect(Collectors.toList()); // Use toList() for Java 16+
        }
        return loans.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList()); // Use toList() for Java 16+
    }

    @Transactional(readOnly = true)
    public LoanAnalyticsDTO getLoanAnalytics(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalStateException("User not found.")); // Corrected

        List<Loan> userLoans = loanRepository.findAllByUser(user);

        BigDecimal totalLoansTaken = BigDecimal.ZERO;
        BigDecimal totalLoansGiven = BigDecimal.ZERO;
        BigDecimal totalOutstanding = BigDecimal.ZERO;
        BigDecimal totalReceivedForGivenLoans = BigDecimal.ZERO;
        BigDecimal totalPaidForTakenLoans = BigDecimal.ZERO;

        for (Loan loan : userLoans) {
            if (loan.getType() == LoanType.TAKEN) {
                totalLoansTaken = totalLoansTaken.add(loan.getOriginalAmount());
                totalPaidForTakenLoans = totalPaidForTakenLoans.add(loan.getOriginalAmount().subtract(loan.getRemainingAmount()));
            } else if (loan.getType() == LoanType.GIVEN) {
                totalLoansGiven = totalLoansGiven.add(loan.getOriginalAmount());
                totalReceivedForGivenLoans = totalReceivedForGivenLoans.add(loan.getOriginalAmount().subtract(loan.getRemainingAmount()));
            }
            totalOutstanding = totalOutstanding.add(loan.getRemainingAmount());
        }

        // Placeholder for Interest Summary - requires more complex calculations not in current spec
        // For now, it will be null or zero.

        return new LoanAnalyticsDTO(
                totalLoansTaken,
                totalLoansGiven,
                totalOutstanding,
                totalReceivedForGivenLoans,
                totalPaidForTakenLoans,
                BigDecimal.ZERO // Interest summary placeholder
        );
    }


    // Helper method to convert Loan entity to DTO
    private LoanDTO convertToDTO(Loan loan) {
        if (loan == null) {
            return null;
        }

        LoanDTO dto = new LoanDTO();
        dto.setLoanId(loan.getLoanId());
        dto.setUserId(loan.getUser().getUserId());
        dto.setType(loan.getType());
        dto.setPersonName(loan.getPersonName());
        dto.setOriginalAmount(loan.getOriginalAmount());
        dto.setRemainingAmount(loan.getRemainingAmount());
        dto.setInterestRate(loan.getInterestRate());
        dto.setStartDate(loan.getStartDate());
        dto.setDueDate(loan.getDueDate());
        dto.setNotes(loan.getNotes());
        dto.setStatus(loan.getStatus());
        dto.setCreatedAt(loan.getCreatedAt());
        dto.setUpdatedAt(loan.getUpdatedAt());

        if (loan.getInstallments() != null && !loan.getInstallments().isEmpty()) {
            dto.setInstallments(loan.getInstallments().stream()
                    .map(this::convertInstallmentToDTO)
                    .collect(Collectors.toList())); // Use toList() for Java 16+
        }

        return dto;
    }

    // Helper method to convert LoanInstallment entity to DTO
    private LoanInstallmentDTO convertInstallmentToDTO(LoanInstallment installment) {
        if (installment == null) {
            return null;
        }

        LoanInstallmentDTO dto = new LoanInstallmentDTO();
        dto.setInstallmentId(installment.getInstallmentId());
        dto.setLoanId(installment.getLoan().getLoanId());
        dto.setAmountPaid(installment.getAmountPaid());
        dto.setPaymentDate(installment.getPaymentDate());
        dto.setAutoGenerated(installment.isAutoGenerated());
        dto.setNotes(installment.getNotes());
        dto.setCreatedAt(installment.getCreatedAt());
        dto.setUpdatedAt(installment.getUpdatedAt());

        if (installment.getPaymentMethod() != null) {
            dto.setPaymentMethod(paymentMethodService.convertToDTO(installment.getPaymentMethod()));
        }

        return dto;
    }
}
