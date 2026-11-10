package ch.unibas.gpxrunviz.features.runview;

import ch.unibas.gpxrunviz.domain.Run;
import ch.unibas.gpxrunviz.domain.RunSummary;
import ch.unibas.gpxrunviz.exceptions.RunNotFoundException;
import ch.unibas.gpxrunviz.features.runview.dtos.StoredTrackPoint;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RunViewServiceTest {
    private final RunRepository runs = mock(RunRepository.class);
    private final TrackPointRepository points = mock(TrackPointRepository.class);
    private final RunViewService service = new RunViewService(runs, points);
    private final Instant start = Instant.parse("2026-10-15T21:59:00Z");

    private void ownedRun() {
        Run run = mock(Run.class);
        when(run.getId()).thenReturn(7L);
        when(run.getSummary()).thenReturn(new RunSummary(start, start.plusSeconds(180), 5,
            42, 180.0, 300.0, 10.0, 0.0, 100.0, 200.0, 130.0, 140));
        when(runs.findByIdAndOwnerUsername(7L, "runner")).thenReturn(Optional.of(run));
    }

    @Test void computesIntervalMetricsAndKeepsSegmentBoundaries() {
        ownedRun();
        when(points.findByRunId(7L)).thenReturn(List.of(
            new StoredTrackPoint(0, 0, 0, 0, start, 100.0, 100),
            new StoredTrackPoint(1, 0, 0, .01, start.plusSeconds(60), 110.0, 140),
            new StoredTrackPoint(2, 0, 0, .01, start.plusSeconds(120), 111.0, null),
            new StoredTrackPoint(3, 1, 1, 1, start.plusSeconds(180), 200.0, 130),
            new StoredTrackPoint(4, 1, 1, 1.01, null, null, null)));
        var detail = service.detail("runner", 7L);
        var samples = detail.points();
        assertEquals(42, detail.summary().distanceMeters()); // Existing stored summaries are reused.
        assertEquals(0, samples.getFirst().distanceMeters());
        assertEquals(0.0, samples.getFirst().timeSeconds());
        assertNull(samples.getFirst().paceSecondsPerKm());
        assertNull(samples.getFirst().gradePercent());
        assertEquals(1111.95, samples.get(1).distanceMeters(), .1);
        assertEquals(53.959, samples.get(1).paceSecondsPerKm(), .01);
        assertEquals(.8993, samples.get(1).gradePercent(), .001);
        assertEquals(140, samples.get(1).heartRate());
        assertNull(samples.get(2).paceSecondsPerKm()); // Stationary point: never divide by zero.
        assertNull(samples.get(2).gradePercent());
        assertNull(samples.get(2).heartRate());
        assertEquals(samples.get(2).distanceMeters(), samples.get(3).distanceMeters());
        assertNull(samples.get(3).paceSecondsPerKm());
        assertNull(samples.get(3).gradePercent());
        assertEquals(180.0, samples.get(3).timeSeconds());
        assertNull(samples.get(4).timeSeconds());
        assertNull(samples.get(4).paceSecondsPerKm());
        assertNull(samples.get(4).gradePercent());
    }

    @Test void missingTimestampsStayMissingAndRepeatedTimesDoNotProducePace() {
        ownedRun();
        when(points.findByRunId(7L)).thenReturn(List.of(
            new StoredTrackPoint(0, 0, 0, 0, null, null, null),
            new StoredTrackPoint(1, 0, 0, .01, null, null, null)));
        assertTrue(service.detail("runner", 7L).points().stream().allMatch(point -> point.timeSeconds() == null && point.paceSecondsPerKm() == null));
        when(points.findByRunId(7L)).thenReturn(List.of(
            new StoredTrackPoint(0, 0, 0, 0, start, null, null),
            new StoredTrackPoint(1, 0, 0, .01, start, null, null)));
        assertNull(service.detail("runner", 7L).points().getLast().paceSecondsPerKm());
    }

    @Test void doesNotReadPointsForMissingOrOtherUsersRuns() {
        when(runs.findByIdAndOwnerUsername(7L, "other")).thenReturn(Optional.empty());
        assertThrows(RunNotFoundException.class, () -> service.detail("other", 7L));
        verifyNoInteractions(points);
    }
}
