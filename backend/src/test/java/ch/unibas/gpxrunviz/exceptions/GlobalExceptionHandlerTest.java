package ch.unibas.gpxrunviz.exceptions;

import ch.unibas.gpxrunviz.features.auth.dtos.RegisterRequest;
import jakarta.validation.Valid;
import java.sql.SQLException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class GlobalExceptionHandlerTest {
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.standaloneSetup(new ErrorController())
            .setControllerAdvice(new GlobalExceptionHandler()).build();
    }

    @Test
    void usernameConflictReturnsProblem() throws Exception {
        mvc.perform(get("/duplicate"))
            .andExpect(status().isConflict())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
            .andExpect(jsonPath("detail").value("Username already taken"));
    }

    @Test
    void uniqueViolationReturnsConflictWithoutDatabaseDetails() throws Exception {
        mvc.perform(get("/unique"))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("detail").value("A record with these details already exists."));
    }

    @Test
    void unrelatedConstraintViolationIsNotAUsernameConflict() throws Exception {
        mvc.perform(get("/constraint"))
            .andExpect(status().isInternalServerError())
            .andExpect(jsonPath("detail").value("An unexpected error occurred."));
    }

    @Test
    void unavailableDatabaseReturnsServiceUnavailable() throws Exception {
        mvc.perform(get("/database")).andExpect(status().isServiceUnavailable());
    }

    @Test
    void unexpectedErrorHidesInternalDetails() throws Exception {
        mvc.perform(get("/unexpected"))
            .andExpect(status().isInternalServerError())
            .andExpect(jsonPath("detail").value("An unexpected error occurred."));
    }

    @Test
    void featureStubReturnsNotImplemented() throws Exception {
        mvc.perform(get("/stub")).andExpect(status().isNotImplemented());
    }

    @Test
    void validationAndMalformedJsonRemainBadRequests() throws Exception {
        mvc.perform(post("/validate").contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"x\",\"password\":\"short\"}"))
            .andExpect(status().isBadRequest());
        mvc.perform(post("/validate").contentType(MediaType.APPLICATION_JSON).content("{"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void frameworkErrorsKeepTheirStatusCodes() throws Exception {
        mvc.perform(get("/validate")).andExpect(status().isMethodNotAllowed());
        mvc.perform(post("/validate").contentType(MediaType.TEXT_PLAIN).content("invalid"))
            .andExpect(status().isUnsupportedMediaType());
        mvc.perform(get("/missing")).andExpect(status().isNotFound());
    }

    @Test
    void securityErrorsKeepTheirMeaning() throws Exception {
        mvc.perform(get("/unauthorized")).andExpect(status().isUnauthorized());
        mvc.perform(get("/forbidden")).andExpect(status().isForbidden());
        mvc.perform(get("/auth-unavailable")).andExpect(status().isServiceUnavailable());
    }

    @RestController
    static class ErrorController {
        @GetMapping("/unauthorized") void unauthorized() { throw new BadCredentialsException("sensitive details"); }
        @GetMapping("/forbidden") void forbidden() { throw new AccessDeniedException("sensitive details"); }
        @GetMapping("/auth-unavailable") void authUnavailable() { throw new AuthenticationServiceException("sensitive details"); }
        @GetMapping("/duplicate") void duplicate() { throw new UsernameTakenException(); }
        @GetMapping("/unique") void unique() {
            throw new DataIntegrityViolationException("sensitive SQL", new SQLException("sensitive SQL", "23505"));
        }
        @GetMapping("/constraint") void constraint() {
            throw new DataIntegrityViolationException("sensitive SQL", new SQLException("sensitive SQL", "23502"));
        }
        @GetMapping("/database") void database() { throw new DataAccessResourceFailureException("sensitive connection"); }
        @GetMapping("/unexpected") void unexpected() { throw new IllegalStateException("sensitive details"); }
        @GetMapping("/stub") void stub() { throw new FeatureNotImplementedException(); }
        @PostMapping("/validate") void validate(@Valid @RequestBody RegisterRequest request) {}
    }
}
