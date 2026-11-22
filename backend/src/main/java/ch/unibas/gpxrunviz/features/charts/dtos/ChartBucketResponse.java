package ch.unibas.gpxrunviz.features.charts.dtos;

import java.time.LocalDate;

public record ChartBucketResponse(
        String key,
        LocalDate startDate,
        LocalDate endDate,
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
