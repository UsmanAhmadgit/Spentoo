package com.spentoo.bills.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Data;
import lombok.Setter;

import java.math.BigDecimal;

@Data
public class BillParticipantDTO {

    private Integer participantId; // Will be null for new participants

    @NotBlank(message = "Participant name cannot be empty.")
    private String participantName;

    @NotNull(message = "Share amount is required.")
    @DecimalMin(value = "0.01", message = "Share amount must be greater than 0.")
    private BigDecimal shareAmount;

    @Setter(AccessLevel.NONE) // Prevent Lombok from generating setCreator(), we use setIsCreator() instead
    @JsonProperty("isCreator")
    private boolean creator = false; // Internal field name (avoids Lombok "is" prefix issues)
    
    // Explicit getter for isCreator (Jackson will use this for serialization)
    @JsonProperty("isCreator")
    public boolean isCreator() {
        return creator;
    }
    
    // Explicit setter for isCreator (Jackson will use this for deserialization)  
    @JsonProperty("isCreator")
    public void setIsCreator(boolean isCreator) {
        this.creator = isCreator;
    }
}
