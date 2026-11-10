package ch.unibas.gpxrunviz.features.runview.dtos;

import java.util.List;

public record RunPageResponse(List<RunListResponse> content, int page, int size,
                              int totalPages, long totalElements) {}
