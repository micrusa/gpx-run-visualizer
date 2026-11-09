package ch.unibas.gpxrunviz.features.imports.dtos;

import ch.unibas.gpxrunviz.domain.Run;

public record ImportedRunResponse(Long id, String name, RunSummaryResponse summary) {
    public static ImportedRunResponse from(Run run) {
        return new ImportedRunResponse(run.getId(), run.getName(), RunSummaryResponse.from(run.getSummary()));
    }
}
