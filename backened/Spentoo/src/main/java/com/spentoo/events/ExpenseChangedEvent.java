package com.spentoo.events;

import com.spentoo.expense.model.Expense;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class ExpenseChangedEvent extends ApplicationEvent {

    private final Expense expense;
    private final ChangeType changeType;

    public enum ChangeType {
        CREATED,
        UPDATED,
        DELETED
    }

    public ExpenseChangedEvent(Object source, Expense expense, ChangeType changeType) {
        super(source);
        this.expense = expense;
        this.changeType = changeType;
    }
}
