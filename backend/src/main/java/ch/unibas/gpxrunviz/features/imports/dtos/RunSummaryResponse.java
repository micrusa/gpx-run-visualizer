package ch.unibas.gpxrunviz.features.imports.dtos;

import ch.unibas.gpxrunviz.domain.RunSummary;
import java.time.Instant;

public record RunSummaryResponse(
    Instant startedAt,
    Instant endedAt,
    int pointCount,
    double distanceMeters,
    Double durationSeconds,
    Double averagePaceSecondsPerKm,
    Double elevationGainMeters,
    Double elevationLossMeters,
    Double minElevationMeters,
    Double maxElevationMeters,
    Double averageHeartRate,
    Integer maxHeartRate
) {
    public static RunSummaryResponse from(RunSummary summary) {
        return new RunSummaryResponse(summary.getStartedAt(), summary.getEndedAt(), summary.getPointCount(), summary.getDistanceMeters(), summary.getDurationSeconds(), summary.getAveragePaceSecondsPerKm(), summary.getElevationGainMeters(), summary.getElevationLossMeters(), summary.getMinElevationMeters(), summary.getMaxElevationMeters(), summary.getAverageHeartRate(), summary.getMaxHeartRate());
    }
}
