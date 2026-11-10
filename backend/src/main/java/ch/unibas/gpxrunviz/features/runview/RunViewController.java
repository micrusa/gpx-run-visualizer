package ch.unibas.gpxrunviz.features.runview;

import ch.unibas.gpxrunviz.features.runview.dtos.RunPageResponse;
import ch.unibas.gpxrunviz.features.runview.dtos.RunDetailResponse;
import jakarta.validation.constraints.Min;
import java.security.Principal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
public class RunViewController {
    private final RunViewService runs;

    public RunViewController(RunViewService runs) { this.runs = runs; }

    @GetMapping("/api/runs")
    public RunPageResponse list(Principal principal,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) int size) {
        return runs.list(principal.getName(), page, size);
    }

    @GetMapping("/api/runs/{id}")
    public RunDetailResponse detail(Principal principal, @PathVariable Long id) {
        return runs.detail(principal.getName(), id);
    }
}
