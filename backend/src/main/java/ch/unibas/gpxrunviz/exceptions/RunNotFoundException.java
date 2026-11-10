package ch.unibas.gpxrunviz.exceptions;

public class RunNotFoundException extends RuntimeException {
    public RunNotFoundException() { super("Run not found."); }
}
