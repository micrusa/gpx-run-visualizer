package ch.unibas.gpxrunviz.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "gpx_imports", indexes = @Index(columnList = "owner_id,uploaded_at"))
public class GpxImport extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private AppUser owner;
    @Column(nullable = false, length = 255)
    private String filename;
    @Column(nullable = false)
    private Instant uploadedAt = Instant.now();
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ImportStatus status;
    @Column(length = 500)
    private String errorMessage;
    @OneToMany(mappedBy = "gpxImport")
    @OrderBy("id ASC")
    private List<Run> runs = new ArrayList<>();

    protected GpxImport() {}
    public GpxImport(AppUser owner, String filename, ImportStatus status, String errorMessage) {
        this.owner = owner; this.filename = filename; this.status = status; this.errorMessage = errorMessage;
    }
    public String getFilename() { return filename; }
    public Instant getUploadedAt() { return uploadedAt; }
    public ImportStatus getStatus() { return status; }
    public String getErrorMessage() { return errorMessage; }
    public List<Run> getRuns() { return runs; }
}
