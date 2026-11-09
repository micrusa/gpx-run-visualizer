package ch.unibas.gpxrunviz.features.imports;

import ch.unibas.gpxrunviz.domain.RunSummary;
import ch.unibas.gpxrunviz.exceptions.InvalidGpxException;
import ch.unibas.gpxrunviz.features.imports.dtos.ParsedPoint;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class RunSummaryCalculator {
    public RunSummary calculate(List<ParsedPoint> points) {
        double distance = 0, gain = 0, loss = 0, heartRateSum = 0;
        int heartRateCount = 0, elevationPairs = 0, timestampCount = 0;
        Double minElevation = null, maxElevation = null;
        Integer maxHeartRate = null;
        Instant start = null, end = null;
        ParsedPoint previous = null;
        for (ParsedPoint point : points) {
            if (point.time() != null) {
                if (end != null && point.time().isBefore(end)) throw new InvalidGpxException("Track timestamps must be chronological.");
                if (start == null) start = point.time();
                end = point.time(); timestampCount++;
            }
            if (point.elevation() != null) {
                minElevation = minElevation == null ? point.elevation() : Math.min(minElevation, point.elevation());
                maxElevation = maxElevation == null ? point.elevation() : Math.max(maxElevation, point.elevation());
            }
            if (point.heartRate() != null) {
                heartRateSum += point.heartRate(); heartRateCount++;
                maxHeartRate = maxHeartRate == null ? point.heartRate() : Math.max(maxHeartRate, point.heartRate());
            }
            // Separate segments must never be joined across recording gaps.
            if (previous != null && previous.segment() == point.segment()) {
                distance += distance(previous, point);
                if (previous.elevation() != null && point.elevation() != null) {
                    double delta = point.elevation() - previous.elevation();
                    gain += Math.max(0, delta); loss += Math.max(0, -delta); elevationPairs++;
                }
            }
            previous = point;
        }
        Double duration = timestampCount == points.size() ? Duration.between(start, end).getSeconds() + Duration.between(start, end).getNano() / 1_000_000_000.0 : null;
        Double pace = duration != null && duration > 0 && distance > 0 ? duration * 1000 / distance : null;
        return new RunSummary(start, end, points.size(), distance, duration, pace,
            elevationPairs > 0 ? gain : null, elevationPairs > 0 ? loss : null,
            minElevation, maxElevation, heartRateCount > 0 ? heartRateSum / heartRateCount : null, maxHeartRate);
    }

    private double distance(ParsedPoint from, ParsedPoint to) {
        double lat1 = Math.toRadians(from.latitude()), lat2 = Math.toRadians(to.latitude());
        double dLat = lat2 - lat1, dLon = Math.toRadians(to.longitude() - from.longitude());
        double a = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dLon / 2), 2);
        return 6_371_008.8 * 2 * Math.asin(Math.sqrt(Math.min(1, a)));
    }
}
