package ch.unibas.gpxrunviz.features.runview.dtos;

import java.time.Instant;

public record StoredTrackPoint(int index, int segment, double latitude, double longitude,
                               Instant time, Double elevationMeters, Integer heartRate) {}
