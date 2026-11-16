package ch.unibas.gpxrunviz.features.runview.dtos;

import ch.unibas.gpxrunviz.domain.Run;
import ch.unibas.gpxrunviz.domain.RunSummary;
import java.time.Instant;

public record RunListResponse(Long id, String name, Instant startedAt, double distanceMeters,
        Double durationSeconds, Double averagePaceSecondsPerKm, Double elevationGainMeters,
        Double averageHeartRate) {
    public static RunListResponse from(Run run) {
        RunSummary summary = run.getSummary();
        return new RunListResponse(run.getId(), run.getName(), summary.getStartedAt(),
            summary.getDistanceMeters(), summary.getDurationSeconds(), summary.getAveragePaceSecondsPerKm(),
            summary.getElevationGainMeters(), summary.getAverageHeartRate());
    }
}
