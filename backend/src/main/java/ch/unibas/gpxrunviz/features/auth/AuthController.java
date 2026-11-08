package ch.unibas.gpxrunviz.features.auth;

import ch.unibas.gpxrunviz.features.auth.dtos.CsrfResponse;
import ch.unibas.gpxrunviz.features.auth.dtos.RegisterRequest;
import ch.unibas.gpxrunviz.features.auth.dtos.UserResponse;
import java.security.Principal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {
    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @GetMapping("/api/auth/csrf")
    public CsrfResponse csrf(CsrfToken csrf) {
        return new CsrfResponse(csrf.getHeaderName(), csrf.getToken());
    }

    @GetMapping("/api/auth/me")
    public UserResponse me(Principal principal) {
        return new UserResponse(principal.getName());
    }

    @PostMapping("/api/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    public void register(@Valid @RequestBody RegisterRequest request) {
        auth.register(request.username(), request.password());
    }

}
