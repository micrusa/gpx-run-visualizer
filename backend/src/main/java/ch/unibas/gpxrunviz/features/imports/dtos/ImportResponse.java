package ch.unibas.gpxrunviz.features.imports.dtos;

import ch.unibas.gpxrunviz.domain.GpxImport;
import ch.unibas.gpxrunviz.domain.ImportStatus;
import java.time.Instant;
import java.util.List;

public record ImportResponse(Long id, String filename, Instant uploadedAt, ImportStatus status,
                             String error, List<ImportedRunResponse> runs) {
    public static ImportResponse from(GpxImport gpxImport) {
        return new ImportResponse(gpxImport.getId(), gpxImport.getFilename(), gpxImport.getUploadedAt(),
            gpxImport.getStatus(), gpxImport.getErrorMessage(),
            gpxImport.getRuns().stream().map(ImportedRunResponse::from).toList());
    }
}
