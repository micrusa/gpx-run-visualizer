package ch.unibas.gpxrunviz.features.imports;

import ch.unibas.gpxrunviz.domain.Run;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RunRepository extends JpaRepository<Run, Long> {}
