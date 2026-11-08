package ch.unibas.gpxrunviz.features.runview;

import ch.unibas.gpxrunviz.exceptions.FeatureNotImplementedException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Placeholder for future runview implementation. */
@RestController
public class RunViewController {
    @GetMapping("/api/runs/{runId}")
    public void placeholder() {
        throw new FeatureNotImplementedException();
    }
}
