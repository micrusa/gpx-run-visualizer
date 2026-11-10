package ch.unibas.gpxrunviz.features.runview.dtos;

public record RunPointResponse(int index, int segment, double latitude, double longitude,
        double distanceMeters, Double timeSeconds, Double paceSecondsPerKm,
        Double elevationMeters, Double gradePercent, Integer heartRate) {}
