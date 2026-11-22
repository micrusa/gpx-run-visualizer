package ch.unibas.gpxrunviz.features.charts.dtos;

import java.time.LocalDate;
import java.util.List;

public record ChartsResponse(
        ChartGranularity granularity,
        LocalDate from,
        LocalDate to,
        String timeZone,
        int omittedWithoutTimestamp,
        ChartTotalsResponse totals,
        List<ChartBucketResponse> buckets) {}
