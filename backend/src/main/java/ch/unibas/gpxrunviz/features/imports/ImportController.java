package ch.unibas.gpxrunviz.features.imports;

import ch.unibas.gpxrunviz.exceptions.FeatureNotImplementedException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

/** Placeholder for future imports implementation. */
@RestController
public class ImportController {
    @PostMapping("/api/imports")
    public void placeholder() {
        throw new FeatureNotImplementedException();
    }
}
