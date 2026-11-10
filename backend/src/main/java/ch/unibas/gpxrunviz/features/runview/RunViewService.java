package ch.unibas.gpxrunviz.features.runview;

import ch.unibas.gpxrunviz.features.runview.dtos.RunListResponse;
import ch.unibas.gpxrunviz.features.runview.dtos.RunPageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RunViewService {
    private final RunRepository runs;

    public RunViewService(RunRepository runs) { this.runs = runs; }

    @Transactional(readOnly = true)
    public RunPageResponse list(String username, int page, int size) {
        var result = runs.findAllForUser(username, PageRequest.of(page, size)).map(RunListResponse::from);
        return new RunPageResponse(result.getContent(), result.getNumber(), result.getSize(),
            result.getTotalPages(), result.getTotalElements());
    }
}
