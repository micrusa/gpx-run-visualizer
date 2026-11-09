package ch.unibas.gpxrunviz.features.imports;

import ch.unibas.gpxrunviz.exceptions.InvalidGpxException;
import ch.unibas.gpxrunviz.features.imports.dtos.ParsedPoint;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class RunSummaryCalculatorTest {
    private final RunSummaryCalculator calculator = new RunSummaryCalculator();
    private final Instant start = Instant.parse("2026-11-03T14:31:31Z");

    @Test void calculatesDistancePaceElevationAndHeartRate() {
        var summary = calculator.calculate(List.of(
            new ParsedPoint(0, 0, 0, start, 100.0, 100),
            new ParsedPoint(0, 0, .01, start.plusSeconds(300), 110.0, 140),
            new ParsedPoint(0, 0, .02, start.plusSeconds(600), 105.0, null)));
        assertEquals(2223.9, summary.getDistanceMeters(), .1);
        assertEquals(600.0, summary.getDurationSeconds());
        assertEquals(269.8, summary.getAveragePaceSecondsPerKm(), .1);
        assertEquals(10.0, summary.getElevationGainMeters());
        assertEquals(5.0, summary.getElevationLossMeters());
        assertEquals(120.0, summary.getAverageHeartRate());
        assertEquals(140, summary.getMaxHeartRate());
    }

    @Test void doesNotConnectSeparateSegments() {
        var summary = calculator.calculate(List.of(
            new ParsedPoint(0, 0, 0, start, 100.0, null),
            new ParsedPoint(1, 1, 1, start.plusSeconds(300), 200.0, null)));
        assertEquals(0, summary.getDistanceMeters());
        assertNull(summary.getElevationGainMeters());
        assertNull(summary.getAveragePaceSecondsPerKm());
        assertEquals(300.0, summary.getDurationSeconds());
    }

    @Test void missingSamplesStayNullAndDoNotBridgeElevationGaps() {
        var summary = calculator.calculate(List.of(
            new ParsedPoint(0, 0, 0, start, 100.0, null),
            new ParsedPoint(0, 0, .01, null, null, null),
            new ParsedPoint(0, 0, .02, start.plusSeconds(600), 200.0, null)));
        assertNull(summary.getDurationSeconds());
        assertNull(summary.getAveragePaceSecondsPerKm());
        assertNull(summary.getElevationGainMeters());
        assertNull(summary.getAverageHeartRate());
    }

    @Test void rejectsBackwardsTimestampsAndHandlesStationaryTracks() {
        assertThrows(InvalidGpxException.class, () -> calculator.calculate(List.of(
            new ParsedPoint(0, 0, 0, start, null, null),
            new ParsedPoint(0, 0, 0, start.minusSeconds(1), null, null))));
        var summary = calculator.calculate(List.of(
            new ParsedPoint(0, 0, 0, start, null, null),
            new ParsedPoint(0, 0, 0, start, null, null)));
        assertEquals(0, summary.getDurationSeconds());
        assertNull(summary.getAveragePaceSecondsPerKm());
    }
}
