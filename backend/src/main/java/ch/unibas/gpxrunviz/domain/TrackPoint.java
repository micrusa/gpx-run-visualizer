package ch.unibas.gpxrunviz.domain;

import jakarta.persistence.*;
import java.time.Instant;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Point;

@Entity
@Table(name = "track_points", uniqueConstraints = @UniqueConstraint(columnNames = {"run_id", "point_index"}))
public class TrackPoint extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Run run;
    @Column(name = "point_index", nullable = false)
    private int pointIndex;
    @Column(nullable = false)
    private int segmentIndex;
    @JdbcTypeCode(SqlTypes.GEOMETRY)
    @Column(nullable = false, columnDefinition = "geometry(Point,4326)")
    private Point location;
    private Instant recordedAt;
    private Double elevationMeters;
    private Integer heartRate;

    protected TrackPoint() {}
    public int getPointIndex() { return pointIndex; }
    public int getSegmentIndex() { return segmentIndex; }
    public Point getLocation() { return location; }
    public Instant getRecordedAt() { return recordedAt; }
    public Double getElevationMeters() { return elevationMeters; }
    public Integer getHeartRate() { return heartRate; }
}
