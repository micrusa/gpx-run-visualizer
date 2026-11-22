package ch.unibas.gpxrunviz.features.charts;

import ch.unibas.gpxrunviz.domain.Run;
import ch.unibas.gpxrunviz.domain.RunSummary;
import ch.unibas.gpxrunviz.exceptions.InvalidChartRequestException;
import ch.unibas.gpxrunviz.features.charts.dtos.ChartGranularity;
import ch.unibas.gpxrunviz.features.runview.RunRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ChartsServiceTest {
    private final RunRepository runs = mock(RunRepository.class);
    private final Clock clock = Clock.fixed(Instant.parse("2026-11-22T12:00:00Z"), ZoneOffset.UTC);
    private final ChartsService service = new ChartsService(runs, clock);

    private Run run(Instant start, double distanceMeters, Double durationSeconds,
            Double elevationGainMeters, Double avgHr, Integer maxHr) {
        Run r = mock(Run.class);
        Double pace = durationSeconds != null && distanceMeters > 0 ? durationSeconds / (distanceMeters / 1000.0) : null;
        when(r.getSummary()).thenReturn(new RunSummary(
                start, durationSeconds != null ? start.plusSeconds(durationSeconds.longValue()) : start,
                10, distanceMeters, durationSeconds, pace, elevationGainMeters, 0.0, 100.0, 150.0, avgHr, maxHr));
        return r;
    }

    @Test void bucketsDailyRunsWithZeroFillAndWeightedMetrics() {
        Run morning = run(Instant.parse("2026-11-20T07:00:00Z"), 5000, 1500.0, 50.0, 150.0, 165);
        Run evening = run(Instant.parse("2026-11-20T18:00:00Z"), 10000, 3600.0, 200.0, 140.0, 172);
        when(runs.findForUserInRange(eq("runner"), any(), any())).thenReturn(List.of(morning, evening));
        when(runs.countWithoutTimestampForUser("runner")).thenReturn(2L);

        var response = service.aggregate("runner", ChartGranularity.DAILY,
                LocalDate.of(2026, 11, 20), LocalDate.of(2026, 11, 22), "UTC");

        assertEquals(3, response.buckets().size());
        assertEquals(2, response.omittedWithoutTimestamp());

        var day1 = response.buckets().get(0);
        assertEquals("2026-11-20", day1.key());
        assertEquals(2, day1.runCount());
        assertEquals(15000.0, day1.distanceMeters(), 0.01);
        assertEquals(5100.0, day1.durationSeconds(), 0.01);
        assertEquals(250.0, day1.elevationGainMeters(), 0.01);
        assertEquals(340.0, day1.averagePaceSecondsPerKm(), 0.01); // 5100 / 15
        assertEquals(15.0 / (5100.0 / 3600.0), day1.averageSpeedKmh(), 0.01);
        // Duration-weighted HR: (150*1500 + 140*3600) / 5100 = 729000 / 5100
        assertEquals(729000.0 / 5100.0, day1.averageHeartRate(), 0.01);
        assertEquals(172, day1.maxHeartRate());
        // Total beats = 150*25 + 140*60 = 3750 + 8400 = 12150; beats/km = 12150 / 15 = 810
        assertEquals(810.0, day1.beatsPerKm(), 0.01);
        assertEquals(15000.0 / 12150.0, day1.efficiencyFactor(), 0.001);
        assertEquals(250.0 / 15.0, day1.elevationPerKm(), 0.01);

        var emptyDay = response.buckets().get(1);
        assertEquals(0, emptyDay.runCount());
        assertEquals(0.0, emptyDay.distanceMeters());
        assertNull(emptyDay.averagePaceSecondsPerKm());
        assertNull(emptyDay.averageHeartRate());
        assertNull(emptyDay.beatsPerKm());
    }

    @Test void respectsUserTimeZoneWhenBucketingLateNightRuns() {
        // 2026-11-20T23:30:00Z is 2026-11-21T00:30:00+01:00 in Europe/Zurich
        Run lateRun = run(Instant.parse("2026-11-20T23:30:00Z"), 8000, 2400.0, 40.0, null, null);
        when(runs.findForUserInRange(eq("runner"), any(), any())).thenReturn(List.of(lateRun));
        when(runs.countWithoutTimestampForUser("runner")).thenReturn(0L);

        var response = service.aggregate("runner", ChartGranularity.DAILY,
                LocalDate.of(2026, 11, 20), LocalDate.of(2026, 11, 21), "Europe/Zurich");

        assertEquals(0, response.buckets().get(0).runCount());
        assertEquals(1, response.buckets().get(1).runCount());
        assertEquals(8000.0, response.buckets().get(1).distanceMeters(), 0.01);
    }

    @Test void alignsWeeklyAndMonthlyBuckets() {
        when(runs.findForUserInRange(eq("runner"), any(), any())).thenReturn(List.of());
        when(runs.countWithoutTimestampForUser("runner")).thenReturn(0L);

        var weekly = service.aggregate("runner", ChartGranularity.WEEKLY,
                LocalDate.of(2026, 11, 18), LocalDate.of(2026, 11, 25), "UTC");
        assertEquals(2, weekly.buckets().size());
        assertEquals(LocalDate.of(2026, 11, 16), weekly.from());
        assertEquals(LocalDate.of(2026, 11, 29), weekly.to());
        assertEquals("2026-W47", weekly.buckets().get(0).key());
        assertEquals("2026-W48", weekly.buckets().get(1).key());

        var monthly = service.aggregate("runner", ChartGranularity.MONTHLY,
                LocalDate.of(2026, 10, 15), LocalDate.of(2026, 12, 5), "UTC");
        assertEquals(3, monthly.buckets().size());
        assertEquals(LocalDate.of(2026, 10, 1), monthly.from());
        assertEquals(LocalDate.of(2026, 12, 31), monthly.to());
        assertEquals("2026-10", monthly.buckets().get(0).key());
        assertEquals("2026-12", monthly.buckets().get(2).key());
    }

    @Test void rejectsInvalidRangesAndTimeZones() {
        assertThrows(InvalidChartRequestException.class, () ->
                service.aggregate("runner", ChartGranularity.DAILY, LocalDate.of(2026, 11, 22), LocalDate.of(2026, 11, 20), "UTC"));
        assertThrows(InvalidChartRequestException.class, () ->
                service.aggregate("runner", ChartGranularity.DAILY, LocalDate.of(2026, 11, 20), LocalDate.of(2026, 11, 22), "Invalid/Zone"));
        assertThrows(InvalidChartRequestException.class, () ->
                service.aggregate("runner", ChartGranularity.DAILY, LocalDate.of(2024, 1, 1), LocalDate.of(2026, 11, 22), "UTC"));
    }
}
