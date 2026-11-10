package ch.unibas.gpxrunviz.features.runview.dtos;

import java.util.List;

public record RunDetailResponse(RunListResponse summary, List<RunPointResponse> points) {}
