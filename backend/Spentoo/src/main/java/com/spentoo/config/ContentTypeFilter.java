package com.spentoo.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;

/**
 * Filter to normalize Content-Type header by removing charset parameter.
 * This ensures Spring accepts requests even if axios adds charset=UTF-8.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ContentTypeFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        
        String contentType = request.getContentType();
        
        // If Content-Type contains application/json with charset, normalize it
        if (contentType != null && contentType.toLowerCase().contains("application/json")) {
            // Normalize: remove charset parameter and any other parameters
            String normalizedContentType = "application/json";
            
            // Wrap the request to override the Content-Type header
            HttpServletRequest wrappedRequest = new HttpServletRequestWrapper(request) {
                @Override
                public String getContentType() {
                    return normalizedContentType;
                }
                
                @Override
                public String getHeader(String name) {
                    if ("Content-Type".equalsIgnoreCase(name)) {
                        return normalizedContentType;
                    }
                    return super.getHeader(name);
                }
                
                @Override
                public Enumeration<String> getHeaders(String name) {
                    if ("Content-Type".equalsIgnoreCase(name)) {
                        return Collections.enumeration(List.of(normalizedContentType));
                    }
                    return super.getHeaders(name);
                }
            };
            
            chain.doFilter(wrappedRequest, response);
        } else {
            chain.doFilter(request, response);
        }
    }
}

