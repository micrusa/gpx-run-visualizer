package ch.unibas.gpxrunviz.features.charts;

import ch.unibas.gpxrunviz.exceptions.FeatureNotImplementedException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Placeholder for future charts implementation. */
@RestController
public class ChartsController {
    @GetMapping("/api/charts")
    public void placeholder() {
        throw new FeatureNotImplementedException();
    }
}
