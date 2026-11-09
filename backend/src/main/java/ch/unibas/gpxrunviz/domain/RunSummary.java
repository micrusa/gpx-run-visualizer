package ch.unibas.gpxrunviz.domain;

import jakarta.persistence.Embeddable;
import java.time.Instant;

/** Stored once at import. Duration and pace use elapsed time, including pauses. */
@Embeddable
public class RunSummary {
    private Instant startedAt;
    private Instant endedAt;
    private int pointCount;
    private double distanceMeters;
    private Double durationSeconds;
    private Double averagePaceSecondsPerKm;
    private Double elevationGainMeters;
    private Double elevationLossMeters;
    private Double minElevationMeters;
    private Double maxElevationMeters;
    private Double averageHeartRate;
    private Integer maxHeartRate;

    protected RunSummary() {}
    public RunSummary(Instant startedAt, Instant endedAt, int pointCount, double distanceMeters,
            Double durationSeconds, Double averagePaceSecondsPerKm, Double elevationGainMeters,
            Double elevationLossMeters, Double minElevationMeters, Double maxElevationMeters,
            Double averageHeartRate, Integer maxHeartRate) {
        this.startedAt = startedAt; this.endedAt = endedAt; this.pointCount = pointCount;
        this.distanceMeters = distanceMeters; this.durationSeconds = durationSeconds;
        this.averagePaceSecondsPerKm = averagePaceSecondsPerKm; this.elevationGainMeters = elevationGainMeters;
        this.elevationLossMeters = elevationLossMeters; this.minElevationMeters = minElevationMeters;
        this.maxElevationMeters = maxElevationMeters; this.averageHeartRate = averageHeartRate;
        this.maxHeartRate = maxHeartRate;
    }
    public Instant getStartedAt() { return startedAt; }
    public Instant getEndedAt() { return endedAt; }
    public int getPointCount() { return pointCount; }
    public double getDistanceMeters() { return distanceMeters; }
    public Double getDurationSeconds() { return durationSeconds; }
    public Double getAveragePaceSecondsPerKm() { return averagePaceSecondsPerKm; }
    public Double getElevationGainMeters() { return elevationGainMeters; }
    public Double getElevationLossMeters() { return elevationLossMeters; }
    public Double getMinElevationMeters() { return minElevationMeters; }
    public Double getMaxElevationMeters() { return maxElevationMeters; }
    public Double getAverageHeartRate() { return averageHeartRate; }
    public Integer getMaxHeartRate() { return maxHeartRate; }
}
