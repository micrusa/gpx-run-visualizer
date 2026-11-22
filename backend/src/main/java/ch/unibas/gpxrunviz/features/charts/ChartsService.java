package ch.unibas.gpxrunviz.features.charts;

import ch.unibas.gpxrunviz.domain.Run;
import ch.unibas.gpxrunviz.domain.RunSummary;
import ch.unibas.gpxrunviz.exceptions.InvalidChartRequestException;
import ch.unibas.gpxrunviz.features.charts.dtos.ChartBucketResponse;
import ch.unibas.gpxrunviz.features.charts.dtos.ChartGranularity;
import ch.unibas.gpxrunviz.features.charts.dtos.ChartTotalsResponse;
import ch.unibas.gpxrunviz.features.charts.dtos.ChartsResponse;
import ch.unibas.gpxrunviz.features.runview.RunRepository;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ChartsService {
    private static final int MAX_BUCKETS = 366;
    private static final int DEFAULT_DAILY_BUCKETS = 30;
    private static final int DEFAULT_WEEKLY_BUCKETS = 12;
    private static final int DEFAULT_MONTHLY_BUCKETS = 12;

    private final RunRepository runs;
    private final Clock clock;

    @Autowired
    public ChartsService(RunRepository runs) {
        this(runs, Clock.systemUTC());
    }

    ChartsService(RunRepository runs, Clock clock) {
        this.runs = runs;
        this.clock = clock;
    }

    public ChartsResponse aggregate(String username, ChartGranularity granularity, LocalDate from, LocalDate to, String tz) {
        ZoneId zone = parseZone(tz);
        LocalDate today = LocalDate.now(clock.withZone(zone));
        LocalDate resolvedTo = to != null ? to : defaultEnd(granularity, today);
        LocalDate resolvedFrom = from != null ? from : defaultStart(granularity, resolvedTo);
        LocalDate alignedFrom = alignStart(granularity, resolvedFrom);
        LocalDate alignedTo = alignEnd(granularity, resolvedTo);
        if (alignedFrom.isAfter(alignedTo)) {
            throw new InvalidChartRequestException("Start date must be on or before end date.");
        }

        Map<LocalDate, BucketSlot> slots = buildSlots(granularity, alignedFrom, alignedTo);
        Instant rangeStart = alignedFrom.atStartOfDay(zone).toInstant();
        Instant rangeEnd = alignedTo.plusDays(1).atStartOfDay(zone).toInstant();

        List<Run> userRuns = runs.findForUserInRange(username, rangeStart, rangeEnd);
        Accumulator totals = new Accumulator();
        for (Run run : userRuns) {
            RunSummary summary = run.getSummary();
            if (summary == null || summary.getStartedAt() == null) continue;
            LocalDate localDate = summary.getStartedAt().atZone(zone).toLocalDate();
            BucketSlot slot = slots.get(alignStart(granularity, localDate));
            if (slot != null) {
                slot.accumulator.add(summary);
                totals.add(summary);
            }
        }

        List<ChartBucketResponse> buckets = new ArrayList<>(slots.size());
        for (BucketSlot slot : slots.values()) {
            buckets.add(slot.toResponse());
        }
        int omitted = Math.toIntExact(runs.countWithoutTimestampForUser(username));
        return new ChartsResponse(granularity, alignedFrom, alignedTo, zone.getId(), omitted, totals.toTotalsResponse(), buckets);
    }

    private ZoneId parseZone(String tz) {
        if (tz == null || tz.isBlank()) return ZoneOffset.UTC;
        try {
            return ZoneId.of(tz.trim());
        } catch (DateTimeException ex) {
            throw new InvalidChartRequestException("Invalid time zone: " + tz);
        }
    }

    private LocalDate defaultEnd(ChartGranularity granularity, LocalDate today) {
        return alignEnd(granularity, today);
    }

    private LocalDate defaultStart(ChartGranularity granularity, LocalDate end) {
        return switch (granularity) {
            case DAILY -> end.minusDays(DEFAULT_DAILY_BUCKETS - 1L);
            case WEEKLY -> alignStart(ChartGranularity.WEEKLY, end).minusWeeks(DEFAULT_WEEKLY_BUCKETS - 1L);
            case MONTHLY -> alignStart(ChartGranularity.MONTHLY, end).minusMonths(DEFAULT_MONTHLY_BUCKETS - 1L);
        };
    }

    private LocalDate alignStart(ChartGranularity granularity, LocalDate date) {
        return switch (granularity) {
            case DAILY -> date;
            case WEEKLY -> date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            case MONTHLY -> date.withDayOfMonth(1);
        };
    }

    private LocalDate alignEnd(ChartGranularity granularity, LocalDate date) {
        return switch (granularity) {
            case DAILY -> date;
            case WEEKLY -> date.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
            case MONTHLY -> YearMonth.from(date).atEndOfMonth();
        };
    }

    private LocalDate nextStart(ChartGranularity granularity, LocalDate start) {
        return switch (granularity) {
            case DAILY -> start.plusDays(1);
            case WEEKLY -> start.plusWeeks(1);
            case MONTHLY -> start.plusMonths(1);
        };
    }

    private String bucketKey(ChartGranularity granularity, LocalDate start) {
        return switch (granularity) {
            case DAILY -> start.toString();
            case WEEKLY -> {
                int weekYear = start.get(WeekFields.ISO.weekBasedYear());
                int week = start.get(WeekFields.ISO.weekOfWeekBasedYear());
                yield String.format("%04d-W%02d", weekYear, week);
            }
            case MONTHLY -> YearMonth.from(start).toString();
        };
    }

    private Map<LocalDate, BucketSlot> buildSlots(ChartGranularity granularity, LocalDate alignedFrom, LocalDate alignedTo) {
        Map<LocalDate, BucketSlot> slots = new LinkedHashMap<>();
        LocalDate cursor = alignedFrom;
        while (!cursor.isAfter(alignedTo)) {
            if (slots.size() >= MAX_BUCKETS) {
                throw new InvalidChartRequestException("Date range exceeds maximum of " + MAX_BUCKETS + " buckets.");
            }
            LocalDate bucketEnd = alignEnd(granularity, cursor);
            slots.put(cursor, new BucketSlot(bucketKey(granularity, cursor), cursor, bucketEnd));
            cursor = nextStart(granularity, cursor);
        }
        return slots;
    }

    private static final class BucketSlot {
        final String key;
        final LocalDate startDate;
        final LocalDate endDate;
        final Accumulator accumulator = new Accumulator();

        BucketSlot(String key, LocalDate startDate, LocalDate endDate) {
            this.key = key;
            this.startDate = startDate;
            this.endDate = endDate;
        }

        ChartBucketResponse toResponse() {
            return new ChartBucketResponse(
                    key, startDate, endDate,
                    accumulator.runCount,
                    accumulator.distanceMeters,
                    accumulator.durationSeconds,
                    accumulator.elevationGainMeters,
                    accumulator.averagePaceSecondsPerKm(),
                    accumulator.averageSpeedKmh(),
                    accumulator.averageHeartRate(),
                    accumulator.maxHeartRate,
                    accumulator.beatsPerKm(),
                    accumulator.efficiencyFactor(),
                    accumulator.elevationPerKm());
        }
    }

    private static final class Accumulator {
        int runCount;
        double distanceMeters;
        double durationSeconds;
        double elevationGainMeters;

        double timedDistanceMeters;
        double timedDurationSeconds;

        double hrDurationSum;
        double hrDurationWeight;
        double hrCountSum;
        int hrCount;
        Integer maxHeartRate;

        double hrTimedBeats;
        double hrTimedDistanceMeters;

        double elevGainForRate;
        double elevDistanceMeters;

        void add(RunSummary summary) {
            runCount++;
            double distance = Math.max(0.0, summary.getDistanceMeters());
            distanceMeters += distance;

            Double duration = summary.getDurationSeconds();
            boolean hasDuration = duration != null && Double.isFinite(duration) && duration > 0;
            if (hasDuration) {
                durationSeconds += duration;
                if (distance > 0) {
                    timedDistanceMeters += distance;
                    timedDurationSeconds += duration;
                }
            }

            Double elevGain = summary.getElevationGainMeters();
            if (elevGain != null && Double.isFinite(elevGain) && elevGain >= 0) {
                elevationGainMeters += elevGain;
                if (distance > 0) {
                    elevGainForRate += elevGain;
                    elevDistanceMeters += distance;
                }
            }

            Double avgHr = summary.getAverageHeartRate();
            boolean hasHr = avgHr != null && Double.isFinite(avgHr) && avgHr > 0;
            if (hasHr) {
                hrCountSum += avgHr;
                hrCount++;
                if (hasDuration) {
                    hrDurationSum += avgHr * duration;
                    hrDurationWeight += duration;
                    if (distance > 0) {
                        hrTimedBeats += avgHr * (duration / 60.0);
                        hrTimedDistanceMeters += distance;
                    }
                }
            }

            Integer runMaxHr = summary.getMaxHeartRate();
            if (runMaxHr != null && runMaxHr > 0) {
                maxHeartRate = maxHeartRate == null ? runMaxHr : Math.max(maxHeartRate, runMaxHr);
            }
        }

        Double averagePaceSecondsPerKm() {
            return timedDistanceMeters > 0 ? timedDurationSeconds / (timedDistanceMeters / 1000.0) : null;
        }

        Double averageSpeedKmh() {
            return timedDurationSeconds > 0 ? (timedDistanceMeters / 1000.0) / (timedDurationSeconds / 3600.0) : null;
        }

        Double averageHeartRate() {
            if (hrDurationWeight > 0) return hrDurationSum / hrDurationWeight;
            return hrCount > 0 ? hrCountSum / hrCount : null;
        }

        Double beatsPerKm() {
            return hrTimedDistanceMeters > 0 ? hrTimedBeats / (hrTimedDistanceMeters / 1000.0) : null;
        }

        Double efficiencyFactor() {
            return hrTimedBeats > 0 ? hrTimedDistanceMeters / hrTimedBeats : null;
        }

        Double elevationPerKm() {
            return elevDistanceMeters > 0 ? elevGainForRate / (elevDistanceMeters / 1000.0) : null;
        }

        ChartTotalsResponse toTotalsResponse() {
            return new ChartTotalsResponse(
                    runCount, distanceMeters, durationSeconds, elevationGainMeters,
                    averagePaceSecondsPerKm(), averageSpeedKmh(), averageHeartRate(),
                    maxHeartRate, beatsPerKm(), efficiencyFactor(), elevationPerKm());
        }
    }
}
