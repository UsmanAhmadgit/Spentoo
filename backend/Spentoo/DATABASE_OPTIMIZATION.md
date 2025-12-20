# Database Optimization Guide

## Recommended Indexes

Add these indexes to improve query performance:

### User Table
```sql
CREATE INDEX idx_user_email ON User(Email);
```

### Income Table
```sql
CREATE INDEX idx_income_user_date ON Income(UserID, TransactionDate);
CREATE INDEX idx_income_date ON Income(TransactionDate);
```

### Expense Table
```sql
CREATE INDEX idx_expense_user_date ON Expense(UserID, TransactionDate);
CREATE INDEX idx_expense_date ON Expense(TransactionDate);
CREATE INDEX idx_expense_category ON Expense(CategoryID);
```

### Loan Table
```sql
CREATE INDEX idx_loan_user ON Loan(UserID);
CREATE INDEX idx_loan_status ON Loan(Status);
CREATE INDEX idx_loan_dates ON Loan(StartDate, DueDate);
```

### LoanInstallment Table
```sql
CREATE INDEX idx_installment_loan ON LoanInstallment(LoanID);
CREATE INDEX idx_installment_date ON LoanInstallment(PaymentDate);
```

### Bills Table
```sql
CREATE INDEX idx_bills_user ON Bills(UserID);
CREATE INDEX idx_bills_created ON Bills(CreatedAt);
```

### BillsParticipant Table
```sql
CREATE INDEX idx_participant_bill ON BillsParticipant(BillsID);
```

### Goal Table
```sql
CREATE INDEX idx_goal_user ON Goal(UserID);
CREATE INDEX idx_goal_status ON Goal(Status);
CREATE INDEX idx_goal_deadline ON Goal(Deadline);
```

### Budget Table
```sql
CREATE INDEX idx_budget_user ON Budget(UserID);
CREATE INDEX idx_budget_dates ON Budget(StartDate, EndDate);
CREATE INDEX idx_budget_category ON Budget(CategoryID);
```

## Query Optimization Tips

1. **Use Pagination**: For large datasets, implement pagination
2. **Limit Results**: Use LIMIT clause for dashboard summaries
3. **Eager Loading**: Already implemented with JOIN FETCH
4. **Batch Operations**: Group multiple operations when possible

## Connection Pooling

Ensure your `application.properties` has:
```properties
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
```

