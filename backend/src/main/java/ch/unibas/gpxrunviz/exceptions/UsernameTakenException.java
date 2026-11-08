package ch.unibas.gpxrunviz.exceptions;

public class UsernameTakenException extends RuntimeException {
    public UsernameTakenException() {
        super("Username already taken");
    }
}
