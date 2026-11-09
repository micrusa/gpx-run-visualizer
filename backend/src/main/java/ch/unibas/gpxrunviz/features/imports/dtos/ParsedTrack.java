package ch.unibas.gpxrunviz.features.imports.dtos;

import java.util.List;

public record ParsedTrack(String name, List<ParsedPoint> points) {}
