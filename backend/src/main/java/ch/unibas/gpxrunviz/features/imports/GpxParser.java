package ch.unibas.gpxrunviz.features.imports;

import ch.unibas.gpxrunviz.exceptions.InvalidGpxException;
import ch.unibas.gpxrunviz.features.imports.dtos.ParsedPoint;
import ch.unibas.gpxrunviz.features.imports.dtos.ParsedTrack;
import java.io.InputStream;
import java.time.Instant;
import java.time.DateTimeException;
import java.util.ArrayList;
import java.util.List;
import javax.xml.stream.*;
import org.springframework.stereotype.Component;

@Component
public class GpxParser {

    public List<ParsedTrack> parse(InputStream input) {
        XMLInputFactory factory = XMLInputFactory.newFactory();
        factory.setProperty(XMLInputFactory.SUPPORT_DTD, false);
        factory.setProperty(XMLInputFactory.IS_SUPPORTING_EXTERNAL_ENTITIES, false);
        factory.setXMLResolver((publicId, systemId, baseUri, namespace) -> {
            throw new XMLStreamException("External resources are not allowed");
        });
        XMLStreamReader xml = null;
        try {
            xml = factory.createXMLStreamReader(input);
            while (xml.hasNext() && next(xml) != XMLStreamConstants.START_ELEMENT) { }
            String namespace = xml.getNamespaceURI();
            if (!xml.isStartElement() || !"gpx".equals(xml.getLocalName()) ||
                (namespace != null && !namespace.isEmpty() &&
                 !namespace.equals("http://www.topografix.com/GPX/1/1") &&
                 !namespace.equals("http://www.topografix.com/GPX/1/0"))) {
                throw new InvalidGpxException("Expected a GPX document.");
            }
            List<ParsedTrack> tracks = new ArrayList<>();
            int depth = 1;
            while (xml.hasNext()) {
                int event = next(xml);
                if (event == XMLStreamConstants.START_ELEMENT) {
                    depth++;
                    if (depth == 2 && "trk".equals(xml.getLocalName())) {
                        tracks.add(readTrack(xml));
                        depth--;
                    }
                } else if (event == XMLStreamConstants.END_ELEMENT) depth--;
            }
            if (tracks.isEmpty()) throw new InvalidGpxException("No tracks found. Upload a GPX containing track points.");
            return tracks;
        } catch (XMLStreamException | IllegalArgumentException | DateTimeException exception) {
            throw new InvalidGpxException("Invalid GPX: malformed XML, coordinates, timestamps, or sensor values.");
        } finally {
            if (xml != null) try { xml.close(); } catch (XMLStreamException ignored) { }
        }
    }

    private ParsedTrack readTrack(XMLStreamReader xml) throws XMLStreamException {
        String name = null;
        List<ParsedPoint> points = new ArrayList<>();
        int segment = 0;
        int depth = 1;
        while (xml.hasNext() && depth > 0) {
            int event = next(xml);
            if (event == XMLStreamConstants.START_ELEMENT) {
                depth++;
                if (depth == 2 && "name".equals(xml.getLocalName())) {
                    name = xml.getElementText().strip(); depth--;
                } else if (depth == 2 && "trkseg".equals(xml.getLocalName())) {
                    readSegment(xml, segment++, points); depth--;
                }
            } else if (event == XMLStreamConstants.END_ELEMENT) depth--;
        }
        if (points.size() < 2) throw new InvalidGpxException("Each track must contain at least two points.");
        return new ParsedTrack(name, List.copyOf(points));
    }

    private void readSegment(XMLStreamReader xml, int segment, List<ParsedPoint> points) throws XMLStreamException {
        int depth = 1;
        while (xml.hasNext() && depth > 0) {
            int event = next(xml);
            if (event == XMLStreamConstants.START_ELEMENT) {
                depth++;
                if (depth == 2 && "trkpt".equals(xml.getLocalName())) {
                    points.add(readPoint(xml, segment)); depth--;
                }
            } else if (event == XMLStreamConstants.END_ELEMENT) depth--;
        }
    }

    private ParsedPoint readPoint(XMLStreamReader xml, int segment) throws XMLStreamException {
        double latitude = number(xml.getAttributeValue(null, "lat"));
        double longitude = number(xml.getAttributeValue(null, "lon"));
        if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw new InvalidGpxException("Coordinates are out of range.");
        Double elevation = null;
        Instant time = null;
        Integer heartRate = null;
        int depth = 1;
        boolean extensions = false;
        while (xml.hasNext() && depth > 0) {
            int event = next(xml);
            if (event == XMLStreamConstants.START_ELEMENT) {
                depth++;
                String tag = xml.getLocalName();
                if (depth == 2 && "ele".equals(tag)) {
                    elevation = number(xml.getElementText()); depth--;
                } else if (depth == 2 && "time".equals(tag)) {
                    time = Instant.parse(xml.getElementText().strip()); depth--;
                    if (time.isBefore(Instant.parse("0001-01-01T00:00:00Z")) || time.isAfter(Instant.parse("9999-12-31T23:59:59Z")))
                        throw new InvalidGpxException("Timestamp is out of range.");
                } else if (depth == 2 && "extensions".equals(tag)) {
                    extensions = true;
                } else if (extensions && "hr".equals(tag)) {
                    int value = Integer.parseInt(xml.getElementText().strip()); depth--;
                    if (value < 0 || value > 65535) throw new InvalidGpxException("Invalid heart rate.");
                    heartRate = value == 0 ? null : value;
                }
            } else if (event == XMLStreamConstants.END_ELEMENT) {
                if (depth == 2 && "extensions".equals(xml.getLocalName())) extensions = false;
                depth--;
            }
        }
        return new ParsedPoint(segment, latitude, longitude, time, elevation, heartRate);
    }

    private double number(String value) {
        if (value == null) throw new InvalidGpxException("A track point is missing coordinates.");
        double number = Double.parseDouble(value.strip());
        if (!Double.isFinite(number)) throw new InvalidGpxException("Numeric values must be finite.");
        return number;
    }

    private int next(XMLStreamReader xml) throws XMLStreamException {
        int event = xml.next();
        if (event == XMLStreamConstants.DTD || event == XMLStreamConstants.ENTITY_REFERENCE)
            throw new InvalidGpxException("DTD and entity declarations are not allowed.");
        return event;
    }
}
