package ch.unibas.gpxrunviz.features.runview;

import ch.unibas.gpxrunviz.features.imports.dtos.ParsedPoint;
import ch.unibas.gpxrunviz.features.runview.dtos.StoredTrackPoint;
import java.sql.Types;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class TrackPointRepository {
    private final JdbcTemplate jdbc;
    public TrackPointRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public List<StoredTrackPoint> findByRunId(Long runId) {
        return jdbc.query("""
            SELECT point_index, segment_index, ST_Y(location) AS latitude, ST_X(location) AS longitude,
                   recorded_at, elevation_meters, heart_rate
            FROM track_points WHERE run_id = ? ORDER BY point_index
            """, (row, index) -> new StoredTrackPoint(row.getInt("point_index"), row.getInt("segment_index"),
                row.getDouble("latitude"), row.getDouble("longitude"),
                row.getTimestamp("recorded_at") == null ? null : row.getTimestamp("recorded_at").toInstant(),
                row.getObject("elevation_meters", Double.class), row.getObject("heart_rate", Integer.class)), runId);
    }

    // JDBC batches avoid one round trip per generated identity ID for large GPX files.
    public void insert(Long runId, List<ParsedPoint> points) {
        String sql = """
            INSERT INTO track_points (run_id, point_index, segment_index, location, recorded_at, elevation_meters, heart_rate)
            VALUES (?, ?, ?, ST_SetSRID(ST_MakePoint(?, ?), 4326), ?, ?, ?)
            """;
        int[] index = {0};
        jdbc.batchUpdate(sql, points, 1000, (statement, point) -> {
            statement.setLong(1, runId);
            statement.setInt(2, index[0]++);
            statement.setInt(3, point.segment());
            statement.setDouble(4, point.longitude());
            statement.setDouble(5, point.latitude());
            statement.setObject(6, point.time() == null ? null : OffsetDateTime.ofInstant(point.time(), ZoneOffset.UTC), Types.TIMESTAMP_WITH_TIMEZONE);
            statement.setObject(7, point.elevation(), Types.DOUBLE);
            statement.setObject(8, point.heartRate(), Types.INTEGER);
        });
    }
}
