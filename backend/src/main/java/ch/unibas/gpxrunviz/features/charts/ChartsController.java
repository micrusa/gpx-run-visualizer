package ch.unibas.gpxrunviz.features.charts;

import ch.unibas.gpxrunviz.features.charts.dtos.ChartGranularity;
import ch.unibas.gpxrunviz.features.charts.dtos.ChartsResponse;
import java.security.Principal;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ChartsController {
    private final ChartsService charts;

    public ChartsController(ChartsService charts) {
        this.charts = charts;
    }

    @GetMapping("/api/charts")
    public ChartsResponse aggregate(
            Principal principal,
            @RequestParam(defaultValue = "WEEKLY") ChartGranularity granularity,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String tz) {
        return charts.aggregate(principal.getName(), granularity, from, to, tz);
    }
}
