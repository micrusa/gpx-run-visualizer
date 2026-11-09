package ch.unibas.gpxrunviz.features.imports.dtos;

import java.time.Instant;

public record ParsedPoint(int segment, double latitude, double longitude, Instant time,
                          Double elevation, Integer heartRate) {}
