package ch.unibas.gpxrunviz.features.imports;

import ch.unibas.gpxrunviz.domain.GpxImport;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GpxImportRepository extends JpaRepository<GpxImport, Long> {
    List<GpxImport> findTop50ByOwnerUsernameOrderByUploadedAtDescIdDesc(String username);
}
