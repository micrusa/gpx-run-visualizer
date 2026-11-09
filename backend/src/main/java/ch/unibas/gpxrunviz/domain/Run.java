package ch.unibas.gpxrunviz.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "runs", indexes = @Index(columnList = "owner_id"))
public class Run extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private AppUser owner;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private GpxImport gpxImport;
    @Column(nullable = false, length = 255)
    private String name;
    @Embedded
    private RunSummary summary;

    protected Run() {}
    public Run(AppUser owner, GpxImport gpxImport, String name, RunSummary summary) {
        this.owner = owner; this.gpxImport = gpxImport; this.name = name; this.summary = summary;
    }
    public String getName() { return name; }
    public RunSummary getSummary() { return summary; }
}
