package com.spentoo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.servlet.config.annotation.ContentNegotiationConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void configureContentNegotiation(ContentNegotiationConfigurer configurer) {
        configurer
            .favorParameter(false)
            .favorPathExtension(false)
            .ignoreAcceptHeader(false)
            .defaultContentType(MediaType.APPLICATION_JSON)
            .mediaType("json", MediaType.APPLICATION_JSON);
    }

    @Override
    public void extendMessageConverters(List<HttpMessageConverter<?>> converters) {
        // Find and configure Jackson converter to accept charset parameters
        converters.stream()
            .filter(converter -> converter instanceof MappingJackson2HttpMessageConverter)
            .map(converter -> (MappingJackson2HttpMessageConverter) converter)
            .forEach(converter -> {
                // Get existing supported media types and create a new mutable list
                List<MediaType> existingTypes = converter.getSupportedMediaTypes();
                List<MediaType> newTypes = new java.util.ArrayList<>(existingTypes);
                
                // Add support for application/json with charset variants if not already present
                MediaType jsonWithUtf8 = MediaType.valueOf("application/json;charset=UTF-8");
                MediaType jsonWithUtf8Lower = MediaType.valueOf("application/json;charset=utf-8");
                
                if (!newTypes.contains(jsonWithUtf8)) {
                    newTypes.add(jsonWithUtf8);
                }
                if (!newTypes.contains(jsonWithUtf8Lower)) {
                    newTypes.add(jsonWithUtf8Lower);
                }
                
                // Set the new list back to the converter
                converter.setSupportedMediaTypes(newTypes);
            });
    }
}

