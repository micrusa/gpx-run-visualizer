package ch.unibas.gpxrunviz.features.runview;

import ch.unibas.gpxrunviz.exceptions.RunNotFoundException;
import ch.unibas.gpxrunviz.features.runview.dtos.RunListResponse;
import ch.unibas.gpxrunviz.features.runview.dtos.RunDetailResponse;
import ch.unibas.gpxrunviz.features.runview.dtos.RunPointResponse;
import ch.unibas.gpxrunviz.features.runview.dtos.StoredTrackPoint;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import ch.unibas.gpxrunviz.features.runview.dtos.RunPageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RunViewService {
    private final RunRepository runs;

    private final TrackPointRepository points;

    public RunViewService(RunRepository runs, TrackPointRepository points) {
        this.runs = runs; this.points = points;
    }

    @Transactional(readOnly = true)
    public RunPageResponse list(String username, int page, int size) {
        var result = runs.findAllForUser(username, PageRequest.of(page, size)).map(RunListResponse::from);
        return new RunPageResponse(result.getContent(), result.getNumber(), result.getSize(),
            result.getTotalPages(), result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public RunDetailResponse detail(String username, Long id) {
        var run = runs.findByIdAndOwnerUsername(id, username).orElseThrow(RunNotFoundException::new);
        return new RunDetailResponse(RunListResponse.from(run), plotPoints(points.findByRunId(id)));
    }

    private List<RunPointResponse> plotPoints(List<StoredTrackPoint> samples) {
        Instant start = samples.stream().map(StoredTrackPoint::time).filter(time -> time != null).findFirst().orElse(null);
        List<RunPointResponse> result = new ArrayList<>(samples.size());
        double distance = 0;
        StoredTrackPoint previous = null;
        for (StoredTrackPoint point : samples) {
            Double pace = null, grade = null;
            if (previous != null && previous.segment() == point.segment()) {
                double step = distance(previous, point);
                distance += step;
                if (step > 0) {
                    if (previous.time() != null && point.time() != null) {
                        double seconds = secondsBetween(previous.time(), point.time());
                        if (seconds > 0) pace = seconds * 1000 / step;
                    }
                    if (previous.elevationMeters() != null && point.elevationMeters() != null)
                        grade = 100 * (point.elevationMeters() - previous.elevationMeters()) / step;
                }
            }
            Double time = point.time() == null || start == null ? null : secondsBetween(start, point.time());
            result.add(new RunPointResponse(point.index(), point.segment(), point.latitude(), point.longitude(),
                distance, time, pace, point.elevationMeters(), grade, point.heartRate()));
            previous = point;
        }
        return result;
    }

    private double secondsBetween(Instant start, Instant end) {
        Duration duration = Duration.between(start, end);
        return duration.getSeconds() + duration.getNano() / 1_000_000_000.0;
    }

    private double distance(StoredTrackPoint from, StoredTrackPoint to) {
        double lat1 = Math.toRadians(from.latitude()), lat2 = Math.toRadians(to.latitude());
        double dLat = lat2 - lat1, dLon = Math.toRadians(to.longitude() - from.longitude());
        double a = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dLon / 2), 2);
        return 6_371_008.8 * 2 * Math.asin(Math.sqrt(Math.min(1, a)));
    }
}
