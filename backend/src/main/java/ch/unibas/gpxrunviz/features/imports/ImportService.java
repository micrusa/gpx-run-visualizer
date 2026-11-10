package ch.unibas.gpxrunviz.features.imports;

import ch.unibas.gpxrunviz.domain.AppUser;
import ch.unibas.gpxrunviz.domain.GpxImport;
import ch.unibas.gpxrunviz.domain.ImportStatus;
import ch.unibas.gpxrunviz.domain.Run;
import ch.unibas.gpxrunviz.exceptions.InvalidGpxException;
import ch.unibas.gpxrunviz.exceptions.InvalidImportRequestException;
import ch.unibas.gpxrunviz.features.auth.UserRepository;
import ch.unibas.gpxrunviz.features.runview.RunRepository;
import ch.unibas.gpxrunviz.features.imports.dtos.ImportResponse;
import ch.unibas.gpxrunviz.features.imports.dtos.ParsedTrack;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ImportService {
    private final UserRepository users;
    private final GpxParser parser;
    private final GpxImportRepository imports;
    private final RunRepository runs;
    private final TrackPointRepository points;
    private final RunSummaryCalculator summaries;
    private final TransactionTemplate transactions;

    public ImportService(UserRepository users, GpxParser parser, GpxImportRepository imports,
            RunRepository runs, TrackPointRepository points, RunSummaryCalculator summaries,
            PlatformTransactionManager transactionManager) {
        this.users = users; this.parser = parser; this.imports = imports;
        this.runs = runs; this.points = points; this.summaries = summaries;
        this.transactions = new TransactionTemplate(transactionManager);
    }

    public List<ImportResponse> upload(String username, List<MultipartFile> files) {
        if (files.isEmpty()) throw new InvalidImportRequestException("Select at least one GPX file.");
        AppUser owner = users.findByUsername(username)
            .orElseThrow(() -> new AuthenticationCredentialsNotFoundException("User not found"));
        List<ImportResponse> results = new ArrayList<>();
        for (MultipartFile file : files) {
            String filename = filename(file.getOriginalFilename());
            List<ParsedTrack> tracks;
            try (InputStream input = file.getInputStream()) {
                if (!filename.toLowerCase(Locale.ROOT).endsWith(".gpx")) throw new InvalidGpxException("Only .gpx files are supported.");
                if (file.isEmpty()) throw new InvalidGpxException("The file is empty.");
                tracks = parser.parse(input);
            } catch (InvalidGpxException exception) {
                results.add(fail(owner, filename, exception.getMessage()));
                continue;
            } catch (IOException exception) {
                results.add(fail(owner, filename, "Could not read the uploaded file."));
                continue;
            }
            try {
                results.add(complete(owner, filename, tracks));
            } catch (InvalidGpxException exception) {
                results.add(fail(owner, filename, exception.getMessage()));
            }
        }
        return results;
    }

    private ImportResponse complete(AppUser owner, String filename, List<ParsedTrack> tracks) {
        // A transaction per file keeps bulk imports independent, including late parsing/summary failures.
        return transactions.execute(status -> {
            GpxImport gpxImport = imports.save(new GpxImport(owner, filename, ImportStatus.COMPLETED, null));
            for (ParsedTrack track : tracks) {
                String name = track.name() == null || track.name().isBlank() ? filename : track.name();
                if (name.length() > 255) name = name.substring(0, 255);
                Run run = runs.saveAndFlush(new Run(owner, gpxImport, name, summaries.calculate(track.points())));
                points.insert(run.getId(), track.points());
                gpxImport.getRuns().add(run);
            }
            return ImportResponse.from(gpxImport);
        });
    }

    private ImportResponse fail(AppUser owner, String filename, String error) {
        return transactions.execute(status ->
            ImportResponse.from(imports.save(new GpxImport(owner, filename, ImportStatus.FAILED, error))));
    }

    @Transactional(readOnly = true)
    public List<ImportResponse> recent(String username) {
        return imports.findTop50ByOwnerUsernameOrderByUploadedAtDescIdDesc(username).stream()
            .map(ImportResponse::from).toList();
    }

    private String filename(String original) {
        if (original == null || original.isBlank()) return "unnamed.gpx";
        String name = original.replace('\\', '/');
        name = name.substring(name.lastIndexOf('/') + 1).replaceAll("[\\p{Cntrl}]", "_");
        return name.length() > 255 ? name.substring(name.length() - 255) : name;
    }
}
