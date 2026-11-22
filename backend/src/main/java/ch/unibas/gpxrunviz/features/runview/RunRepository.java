package ch.unibas.gpxrunviz.features.runview;

import ch.unibas.gpxrunviz.domain.Run;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RunRepository extends JpaRepository<Run, Long> {
    Optional<Run> findByIdAndOwnerUsername(Long id, String username);
    @Query(value = "select r from Run r where r.owner.username = :username order by r.summary.startedAt desc nulls last, r.id desc",
           countQuery = "select count(r) from Run r where r.owner.username = :username")
    Page<Run> findAllForUser(@Param("username") String username, Pageable pageable);

    @Query("select r from Run r where r.owner.username = :username and r.summary.startedAt >= :from and r.summary.startedAt < :to order by r.summary.startedAt asc, r.id asc")
    List<Run> findForUserInRange(@Param("username") String username, @Param("from") Instant from, @Param("to") Instant to);

    @Query("select count(r) from Run r where r.owner.username = :username and r.summary.startedAt is null")
    long countWithoutTimestampForUser(@Param("username") String username);
}
