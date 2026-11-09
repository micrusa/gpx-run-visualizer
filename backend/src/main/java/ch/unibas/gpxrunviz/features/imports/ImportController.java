package ch.unibas.gpxrunviz.features.imports;

import ch.unibas.gpxrunviz.features.imports.dtos.ImportResponse;
import java.security.Principal;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class ImportController {
    private final ImportService imports;

    public ImportController(ImportService imports) {
        this.imports = imports;
    }

    @PostMapping(value = "/api/imports", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<ImportResponse> upload(Principal principal, @RequestParam("files") List<MultipartFile> files) {
        return imports.upload(principal.getName(), files);
    }

    @GetMapping("/api/imports")
    public List<ImportResponse> recent(Principal principal) {
        return imports.recent(principal.getName());
    }
}
