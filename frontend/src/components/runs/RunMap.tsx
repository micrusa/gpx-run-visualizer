import { useEffect, useMemo } from "react";
import { latLngBounds, type LatLngTuple, type LatLngBounds } from "leaflet";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { type RunSelection } from "@/lib/runSelectionService";
import { type RunPoint } from "@/lib/runService";

type Props = { points: RunPoint[]; hovered: number | null; selection: RunSelection | null };

export default function RunMap({ points, hovered, selection }: Props) {
  const visible = useMemo(() => selection ? points.slice(selection.start, selection.end + 1) : points, [points, selection]);
  const segments = useMemo(() => {
    const result: LatLngTuple[][] = [];
    let previous: number | null = null;
    visible.forEach(point => {
      if (point.segment !== previous) result.push([]);
      result[result.length - 1].push([point.latitude, point.longitude]);
      previous = point.segment;
    });
    return result;
  }, [visible]);
  const bounds = useMemo(() => latLngBounds(segments.flat()), [segments]);
  if (!visible.length) return <p>No route points available.</p>;
  const position = (point: RunPoint): LatLngTuple => [point.latitude, point.longitude];
  const active = hovered == null ? null : points[hovered];
  return <MapContainer className="run-map" bounds={bounds} boundsOptions={{ padding: [24, 24], maxZoom: 16 }}
    scrollWheelZoom={false} aria-label="Map of the run route">
    <MapViewport bounds={bounds} maxZoom={selection ? 18 : 16} />
    <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19}
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
    {segments.map((segment, index) => <Polyline key={index} positions={segment} pathOptions={{ color: "#17604e", weight: 4 }} />)}
    <CircleMarker center={position(visible[0])} radius={6} pathOptions={{ color: "white", fillColor: "#17604e", fillOpacity: 1 }}><Tooltip>Start</Tooltip></CircleMarker>
    <CircleMarker center={position(visible[visible.length - 1])} radius={6} pathOptions={{ color: "white", fillColor: "#c45127", fillOpacity: 1 }}><Tooltip>Finish</Tooltip></CircleMarker>
    {active && <CircleMarker center={position(active)} radius={7} pathOptions={{ color: "white", fillColor: "#216cc1", fillOpacity: 1 }} />}
  </MapContainer>;
}

function MapViewport({ bounds, maxZoom }: { bounds: LatLngBounds; maxZoom: number }) {
  const map = useMap();
  useEffect(() => {
    const fit = () => {
      map.invalidateSize({ pan: false });
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24], maxZoom, animate: false });
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map, bounds, maxZoom]);
  return null;
}
