package ch.unibas.gpxrunviz.exceptions;

import java.sql.SQLException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/** Uses standard problem responses, including Spring MVC's 400/404/405/415 errors. */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler({InvalidGpxException.class, InvalidImportRequestException.class, InvalidChartRequestException.class})
    public ProblemDetail invalidRequest(RuntimeException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(RunNotFoundException.class)
    public ProblemDetail runNotFound(RunNotFoundException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler(UsernameTakenException.class)
    public ProblemDetail usernameTaken(UsernameTakenException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, exception.getMessage());
    }

    @ExceptionHandler(FeatureNotImplementedException.class)
    public ProblemDetail notImplemented(FeatureNotImplementedException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_IMPLEMENTED, exception.getMessage());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail dataIntegrity(DataIntegrityViolationException exception) {
        // PostgreSQL unique violations include concurrent registrations of the same username.
        // Other constraint failures must not be mislabeled as a duplicate username.
        for (Throwable cause = exception; cause != null; cause = cause.getCause()) {
            if (cause instanceof SQLException sql && "23505".equals(sql.getSQLState())) {
                return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "A record with these details already exists.");
            }
        }
        return unexpected(exception);
    }

    @ExceptionHandler({DataAccessResourceFailureException.class, CannotCreateTransactionException.class})
    public ProblemDetail databaseUnavailable(Exception exception) {
        log.error("Database unavailable", exception);
        return ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, "Database temporarily unavailable.");
    }

    @ExceptionHandler(AuthenticationServiceException.class)
    public ProblemDetail authenticationUnavailable(AuthenticationServiceException exception) {
        log.error("Authentication unavailable", exception);
        return ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, "Authentication temporarily unavailable.");
    }

    @ExceptionHandler(AuthenticationException.class)
    public ProblemDetail unauthorized(AuthenticationException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Authentication required or credentials invalid.");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail forbidden(AccessDeniedException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, "Access denied or CSRF token invalid.");
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail unexpected(Exception exception) {
        log.error("Unhandled request failure", exception);
        return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred.");
    }
}
