package ch.unibas.gpxrunviz.features.runview;

import ch.unibas.gpxrunviz.domain.Run;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RunRepository extends JpaRepository<Run, Long> {
    @Query(value = "select r from Run r where r.owner.username = :username order by r.summary.startedAt desc nulls last, r.id desc",
           countQuery = "select count(r) from Run r where r.owner.username = :username")
    Page<Run> findAllForUser(@Param("username") String username, Pageable pageable);
}
