package ch.unibas.gpxrunviz.exceptions;

public class FeatureNotImplementedException extends RuntimeException {
    public FeatureNotImplementedException() {
        super("This feature is not implemented yet.");
    }
}
