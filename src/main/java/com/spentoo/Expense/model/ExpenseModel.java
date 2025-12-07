package com.spentoo.expense.model;

import com.spentoo.user.model.User;
import com.spentoo.category.model.Category;
import com.spentoo.payment.model.PaymentMethod;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer expenseID;

    @ManyToOne
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "CategoryID", nullable = false)
    private Category category;

    @ManyToOne
    @JoinColumn(name = "PaymentMethodID")
    private PaymentMethod paymentMethod;

    private Double amount;

    private String currency;

    private String description;

    private String merchant;

    private String tags;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public Expense() {}

    // Getters & Setters
    public Integer getExpenseID() { return expenseID; }
    public void setExpenseID(Integer expenseID) { this.expenseID = expenseID; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getMerchant() { return merchant; }
    public void setMerchant(String merchant) { this.merchant = merchant; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
