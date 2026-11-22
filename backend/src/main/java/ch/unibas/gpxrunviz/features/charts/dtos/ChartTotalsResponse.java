package ch.unibas.gpxrunviz.features.charts.dtos;

public record ChartTotalsResponse(
        int runCount,
        double distanceMeters,
        double durationSeconds,
        double elevationGainMeters,
        Double averagePaceSecondsPerKm,
        Double averageSpeedKmh,
        Double averageHeartRate,
        Integer maxHeartRate,
        Double beatsPerKm,
        Double efficiencyFactor,
        Double elevationPerKm) {}
