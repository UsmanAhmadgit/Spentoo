package com.spentoo.user.dto;

import lombok.Data;

@Data
public class UserProfileDTO {

    private Integer userId;
    private String firstName;
    private String lastName;
    private String username;
    private String email;
    private String country;
    private boolean isActive;
}
