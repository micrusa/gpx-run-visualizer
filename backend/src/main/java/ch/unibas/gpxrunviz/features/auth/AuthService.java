package ch.unibas.gpxrunviz.features.auth;

import ch.unibas.gpxrunviz.domain.AppUser;
import ch.unibas.gpxrunviz.exceptions.UsernameTakenException;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder passwords;

    public AuthService(UserRepository users, PasswordEncoder passwords) {
        this.users = users;
        this.passwords = passwords;
    }

    @Transactional
    public void register(String username, String password) {
        if (users.existsByUsername(username)) {
            throw new UsernameTakenException();
        }
        users.saveAndFlush(new AppUser(username, passwords.encode(password)));
    }
}
