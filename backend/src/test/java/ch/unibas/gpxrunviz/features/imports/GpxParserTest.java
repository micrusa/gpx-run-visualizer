package ch.unibas.gpxrunviz.features.imports;

import ch.unibas.gpxrunviz.exceptions.InvalidGpxException;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class GpxParserTest {
    private final GpxParser parser = new GpxParser();
    private final String points = "<trkpt lat='47' lon='7'/><trkpt lat='47.01' lon='7.01'/>";

    private java.util.List<ch.unibas.gpxrunviz.features.imports.dtos.ParsedTrack> parse(String xml) {
        return parser.parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));
    }

    @Test void parsesNamespacedTrackAndGarminHeartRate() {
        var tracks = parse("""
            <gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">
              <trk><name>Afternoon run</name><trkseg>
                <trkpt lat="47.593013" lon="7.587977"><ele>237.8</ele><time>2026-11-03T14:31:31Z</time>
                  <extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>82</gpxtpx:hr></gpxtpx:TrackPointExtension></extensions>
                </trkpt>
                <trkpt lat="47.593002" lon="7.587982"/>
              </trkseg></trk>
            </gpx>
            """);
        assertEquals("Afternoon run", tracks.getFirst().name());
        var point = tracks.getFirst().points().getFirst();
        assertEquals(47.593013, point.latitude());
        assertEquals(7.587977, point.longitude());
        assertEquals(82, point.heartRate());
        assertEquals(237.8, point.elevation());
        assertNull(tracks.getFirst().points().getLast().time());
    }

    @Test void preservesSeparateTracksAndSegments() {
        var tracks = parse("<gpx><trk><trkseg>"+points+"</trkseg><trkseg>"+points+"</trkseg></trk><trk><trkseg>"+points+"</trkseg></trk></gpx>");
        assertEquals(2, tracks.size());
        assertEquals(0, tracks.getFirst().points().getFirst().segment());
        assertEquals(1, tracks.getFirst().points().getLast().segment());
    }

    @Test void acceptsMoreThanOneHundredTracks() {
        var tracks = parse("<gpx>" + ("<trk><trkseg>" + points + "</trkseg></trk>").repeat(101) + "</gpx>");
        assertEquals(101, tracks.size());
    }

    @Test void acceptsMoreThanTwoHundredThousandPoints() {
        var tracks = parse("<gpx><trk><trkseg>" + "<trkpt lat='47' lon='7'/>".repeat(200_001) + "</trkseg></trk></gpx>");
        assertEquals(200_001, tracks.getFirst().points().size());
    }

    @Test void rejectsDtdAndExternalEntities() {
        assertThrows(InvalidGpxException.class, () -> parse("<!DOCTYPE gpx [<!ENTITY secret SYSTEM 'file:///etc/passwd'>]><gpx><trk><name>&secret;</name><trkseg>"+points+"</trkseg></trk></gpx>"));
    }

    @Test void rejectsMalformedDocumentsAndMissingTracks() {
        for (String xml : new String[]{"<gpx>", "<html/>", "<gpx/>", "<gpx><trk><trkseg/></trk></gpx>"})
            assertThrows(InvalidGpxException.class, () -> parse(xml));
    }

    @Test void rejectsInvalidCoordinatesAndTimes() {
        for (String attributes : new String[]{"lat='91' lon='7'", "lat='47'", "lat='NaN' lon='7'", "lat='47' lon='Infinity'"})
            assertThrows(InvalidGpxException.class, () -> parse("<gpx><trk><trkseg><trkpt "+attributes+"/>"+points+"</trkseg></trk></gpx>"));
        assertThrows(InvalidGpxException.class, () -> parse("<gpx><trk><trkseg><trkpt lat='47' lon='7'><time>not-a-time</time></trkpt>"+points+"</trkseg></trk></gpx>"));
    }
}
