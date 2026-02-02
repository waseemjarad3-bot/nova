import React, { useEffect, useState, useRef } from 'react';
import { X, Navigation, Map as MapIcon, Clock, MoveUp, RotateCcw } from 'lucide-react';

interface NavigationModuleProps {
    destination: string;
    onClose: () => void;
}

const NavigationModule: React.FC<NavigationModuleProps> = ({ destination: initialDestination, onClose }) => {
    const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
    const [startLocation, setStartLocation] = useState<string>("");
    const [startCoords, setStartCoords] = useState<[number, number] | null>(null);
    const [destination, setDestination] = useState(initialDestination);
    const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
    const [routeData, setRouteData] = useState<any>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
    const mapRef = useRef<any>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const LRef = useRef<any>(null);

    // 1. Check Permissions
    useEffect(() => {
        if ('permissions' in navigator) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                setPermissionStatus(result.state);
                result.onchange = () => {
                    setPermissionStatus(result.state);
                };
            });
        }
    }, []);

    // 2. Load Leaflet from CDN
    useEffect(() => {
        if ((window as any).L) {
            LRef.current = (window as any).L;
            setMapLoaded(true);
            return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => {
            LRef.current = (window as any).L;
            setMapLoaded(true);
        };
        document.body.appendChild(script);
    }, []);

    // 3. Get Current Location (with Fallback)
    useEffect(() => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            return;
        }

        const getIPFallback = async () => {
            try {
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();
                if (data.latitude && data.longitude) {
                    setCurrentLocation((prev) => prev || [data.latitude, data.longitude]);
                    setError(null);
                }
            } catch (e) {
                console.error("IP Geoloc fail", e);
            }
        };

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setCurrentLocation([position.coords.latitude, position.coords.longitude]);
                setError(null);
            },
            (err) => {
                console.error("Location error:", err);
                // On error or timeout, try IP fallback
                getIPFallback();
                if (!currentLocation) {
                    setError("GPS Pulse Weak. Attempting IP triangulation...");
                }
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: Infinity }
        );

        // Immediate IP attempt as background task
        getIPFallback();

        return () => navigator.geolocation.clearWatch(watchId);
    }, []); // Empty dependency to keep the watch stable

    // 4. Geocode Start Location (Manual Override)
    useEffect(() => {
        if (!startLocation) return;

        const geocodeStart = async () => {
            setIsSearching(true);
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(startLocation)}&limit=1`);
                const data = await response.json();
                if (data && data.length > 0) {
                    const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                    setStartCoords(coords);
                    setCurrentLocation(coords); // Treat as current for routing
                    mapRef.current?.setView(coords, 13);
                }
            } catch (err) {
                console.error("Geocoding start error:", err);
            } finally {
                setIsSearching(false);
            }
        };

        geocodeStart();
    }, [startLocation]);

    // 5. Geocode Destination
    useEffect(() => {
        if (!destination) return;

        const geocode = async () => {
            setIsSearching(true);
            setError(null);
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`);
                const data = await response.json();
                if (data && data.length > 0) {
                    setDestCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
                } else {
                    setError(`SCAN FAILED: Location "${destination}" not found in OSM database.`);
                    setDestCoords(null);
                    setRouteData(null);
                }
            } catch (err) {
                console.error("Geocoding error:", err);
                setError("Protocol Error: Connection to mapping uplink failed.");
            } finally {
                setIsSearching(false);
            }
        };

        geocode();
    }, [destination]);

    // 6. Calculate Route
    useEffect(() => {
        const origin = currentLocation || startCoords; // Fallback to manual start
        if (!origin || !destCoords) return;

        const getRoute = async () => {
            try {
                const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${destCoords[1]},${destCoords[0]}?overview=full&geometries=geojson`);
                const data = await response.json();
                if (data.routes && data.routes.length > 0) {
                    setRouteData(data.routes[0]);
                    setError(null);
                } else {
                    setError("Logistics Failure: No valid route found for the selected coordinates.");
                }
            } catch (err) {
                console.error("Routing error:", err);
                setError("Routing service unavailable.");
            }
        };

        getRoute();
    }, [currentLocation, startCoords, destCoords]);

    // 7. Initialize & Update Map
    useEffect(() => {
        if (!mapLoaded || !mapContainerRef.current || !LRef.current) return;

        const L = LRef.current;

        if (!mapRef.current) {
            const center: [number, number] = currentLocation || startCoords || [0, 0];
            mapRef.current = L.map(mapContainerRef.current, {
                zoomControl: false,
                attributionControl: false
            }).setView(center, (currentLocation || startCoords) ? 13 : 2);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; CartoDB',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(mapRef.current);

            // Add Click Handler to set Location
            mapRef.current.on('click', (e: any) => {
                const { lat, lng } = e.latlng;
                setCurrentLocation([lat, lng]);
                setStartCoords([lat, lng]);
            });
        }

        // Add/Update Markers
        if (mapRef.current.userMarker) mapRef.current.removeLayer(mapRef.current.userMarker);
        if (mapRef.current.destMarker) mapRef.current.removeLayer(mapRef.current.destMarker);

        const markers = [];

        if (currentLocation) {
            const userPulse = L.divIcon({
                className: 'user-location-pulse',
                html: `
                    <div class="relative flex items-center justify-center">
                        <div class="absolute w-10 h-10 bg-j-cyan/20 rounded-full animate-ping"></div>
                        <div class="relative w-5 h-5 bg-j-cyan rounded-full border-2 border-white shadow-xl flex items-center justify-center">
                            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                    </div>
                `,
                iconSize: [40, 40]
            });

            mapRef.current.userMarker = L.marker(currentLocation, { icon: userPulse }).addTo(mapRef.current);
            markers.push(mapRef.current.userMarker);
        }

        if (destCoords) {
            const destIcon = L.divIcon({
                className: 'dest-location-icon',
                html: `
                    <div class="relative flex flex-col items-center">
                        <div class="w-8 h-8 bg-j-magenta rounded-full border-2 border-white shadow-xl flex items-center justify-center transform -translate-y-1 scale-110">
                            <div class="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <div class="w-0.5 h-3 bg-white mt-[-2px]"></div>
                    </div>
                `,
                iconSize: [32, 40]
            });

            mapRef.current.destMarker = L.marker(destCoords, { icon: destIcon }).addTo(mapRef.current);
            mapRef.current.destMarker.bindPopup(`<b>Target:</b> ${destination}`).openPopup();
            markers.push(mapRef.current.destMarker);
        }

        // Fit bounds if we have points and no route yet (route fit is handled below)
        if (markers.length > 0 && !routeData) {
            const group = L.featureGroup(markers);
            mapRef.current.fitBounds(group.getBounds(), { padding: [80, 80], maxZoom: 15 });
        }

        // Draw Route
        if (routeData) {
            if (mapRef.current.routeLayer) {
                mapRef.current.removeLayer(mapRef.current.routeLayer);
            }

            const routeLayer = L.geoJSON(routeData.geometry, {
                style: {
                    color: '#3b82f6', // Vibrant modern blue (Google Maps style)
                    weight: 8,
                    opacity: 0.9,
                    lineJoin: 'round'
                }
            }).addTo(mapRef.current);

            // Add a subtle glow effect with a second layer
            const glowLayer = L.geoJSON(routeData.geometry, {
                style: {
                    color: '#60a5fa',
                    weight: 12,
                    opacity: 0.3,
                    lineJoin: 'round'
                }
            }).addTo(mapRef.current);

            mapRef.current.routeLayer = L.layerGroup([routeLayer, glowLayer]).addTo(mapRef.current);

            // Fit bounds to show full route
            const group = new L.FeatureGroup([mapRef.current.userMarker, ...destCoords ? [L.marker(destCoords)] : []]);
            mapRef.current.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
        }

        return () => {
            if (mapRef.current && mapRef.current.routeLayer) {
                mapRef.current.removeLayer(mapRef.current.routeLayer);
            }
            if (mapRef.current && mapRef.current.userMarker) {
                mapRef.current.removeLayer(mapRef.current.userMarker);
            }
        };
    }, [mapLoaded, currentLocation, destCoords, routeData, destination]);

    const formatDistance = (m: number) => {
        if (m > 1000) return (m / 1000).toFixed(1) + ' km';
        return Math.round(m) + ' m';
    };

    const formatDuration = (s: number) => {
        const mins = Math.round(s / 60);
        if (mins > 60) {
            const hrs = Math.floor(mins / 60);
            const m = mins % 60;
            return `${hrs}h ${m}m`;
        }
        return mins + ' mins';
    };

    const calculateFare = (distanceMeters: number, type: 'bike' | 'taxi' | 'bus') => {
        const km = distanceMeters / 1000;
        // Average rates (PKR logic as requested context implies Pakistan)
        if (type === 'bike') {
            return Math.round(30 + (km * 20)); // Base 30 + 20/km
        }
        if (type === 'bus') {
            return Math.round(20 + (km * 5)); // Base 20 + 5/km (Flat-ish local rates)
        }
        return Math.round(100 + (km * 60)); // Base 100 + 60/km for Taxi
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 lg:p-10 pointer-events-none">
            <div className="w-full h-full max-w-6xl bg-j-panel/90 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden pointer-events-auto animate-in fade-in zoom-in duration-500">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-j-surface/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-j-cyan/10 rounded-2xl">
                            <Navigation className="text-j-cyan animate-pulse" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-widest uppercase font-mono">Nova Navigation</h2>
                            <p className="text-xs text-j-text-muted font-mono uppercase tracking-[0.2em]">Enroute to {destination}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-white/5 rounded-2xl text-j-text-muted hover:text-white transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {permissionStatus === 'denied' ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-j-void/50">
                            <div className="w-20 h-20 rounded-full bg-j-crimson/10 border border-j-crimson/30 flex items-center justify-center mb-6">
                                <Navigation className="text-j-crimson" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">Navigation Terminated</h3>
                            <p className="text-sm text-j-text-muted max-w-md leading-relaxed font-mono">
                                Location access restricted by system protocols. Please enable <b>GPS / Location Services</b> in your browser settings to proceed.
                            </p>
                            <button
                                onClick={onClose}
                                className="mt-8 px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-mono text-j-text-muted uppercase tracking-widest transition-all"
                            >
                                Acknowledge & Close
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Map Sidebar */}
                            <div className="w-80 border-r border-white/5 p-6 flex flex-col gap-6 bg-j-surface/10 overflow-y-auto no-scrollbar">
                                {/* Search Overrides */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-j-cyan uppercase tracking-widest ml-1">Origin Scan</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder={currentLocation ? "GPS Active..." : "Enter start location..."}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        setStartLocation(e.currentTarget.value);
                                                    }
                                                }}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-j-cyan/50 transition-all"
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Navigation size={14} className={currentLocation ? "text-j-cyan animate-pulse" : "text-white/20"} />
                                            </div>
                                        </div>
                                        {!currentLocation && (
                                            <p className="text-[8px] text-j-magenta font-mono uppercase tracking-tighter animate-pulse ml-1 italic">
                                                Tip: Click on map to set start point
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-j-magenta uppercase tracking-widest ml-1">Destination Scan</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                defaultValue={destination}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        setDestination(e.currentTarget.value);
                                                    }
                                                }}
                                                placeholder="Enter destination..."
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-j-cyan/50 transition-all"
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                {isSearching ? (
                                                    <div className="w-4 h-4 border-2 border-j-cyan/30 border-t-j-cyan rounded-full animate-spin"></div>
                                                ) : (
                                                    <MapIcon size={14} className="text-white/20" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-white/5 w-full" />

                                {routeData ? (
                                    <>
                                        <div className="space-y-4">
                                            <div className="p-4 rounded-2xl bg-j-cyan/5 border border-j-cyan/20">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <MapIcon className="text-j-cyan" size={18} />
                                                    <span className="text-[10px] font-bold text-j-cyan uppercase tracking-widest">Distance</span>
                                                </div>
                                                <span className="text-2xl font-mono text-white">{formatDistance(routeData.distance)}</span>
                                            </div>

                                            <div className="p-4 rounded-2xl bg-j-magenta/5 border border-j-magenta/20">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Clock className="text-j-magenta" size={18} />
                                                    <span className="text-[10px] font-bold text-j-magenta uppercase tracking-widest">Est. Time</span>
                                                </div>
                                                <span className="text-2xl font-mono text-white">{formatDuration(routeData.duration)}</span>
                                            </div>
                                        </div>

                                        <div className="h-px bg-white/5 w-full" />

                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-bold text-j-text-muted uppercase tracking-[0.3em] ml-1">Fare Protocol</h3>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1 items-center text-center">
                                                    <span className="text-[8px] text-white/40 uppercase tracking-widest font-mono">Bike</span>
                                                    <span className="text-xs font-mono text-j-cyan">Rs. {calculateFare(routeData.distance, 'bike')}</span>
                                                </div>
                                                <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1 items-center text-center">
                                                    <span className="text-[8px] text-white/40 uppercase tracking-widest font-mono">Taxi</span>
                                                    <span className="text-xs font-mono text-j-magenta">Rs. {calculateFare(routeData.distance, 'taxi')}</span>
                                                </div>
                                                <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1 items-center text-center">
                                                    <span className="text-[8px] text-white/40 uppercase tracking-widest font-mono">Bus</span>
                                                    <span className="text-xs font-mono text-j-cyan">Rs. {calculateFare(routeData.distance, 'bus')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-px bg-white/5 w-full" />

                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-bold text-j-text-muted uppercase tracking-[0.3em] ml-1">Protocol Time</h3>
                                            <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col items-center">
                                                <span className="text-lg font-mono text-white tracking-widest">
                                                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                                                </span>
                                                <span className="text-[9px] font-mono text-white/40 uppercase mt-1">
                                                    {new Date().toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                                            <h3 className="text-[10px] font-bold text-j-text-muted uppercase tracking-[0.3em] mb-4">Nav Protocol</h3>
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex gap-4 items-center">
                                                <div className="w-10 h-10 rounded-full bg-j-cyan/10 flex items-center justify-center shrink-0">
                                                    <MoveUp className="text-j-cyan" size={20} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-white font-medium uppercase tracking-tight">Vantage Point Active</span>
                                                    <span className="text-[10px] text-j-text-muted font-mono leading-tight">Proceed to the highlighted route for guidance.</span>
                                                </div>
                                            </div>
                                            <p className="text-[9px] text-j-text-muted font-mono text-center pt-10 px-4 opacity-50">
                                                "Live traffic data not available, showing best static route."
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 gap-6">
                                        {error ? (
                                            <>
                                                <div className="w-16 h-16 rounded-full bg-j-crimson/5 border border-j-crimson/20 flex items-center justify-center animate-pulse">
                                                    <Navigation size={32} className="text-j-crimson rotate-45" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="text-[10px] font-bold text-j-crimson uppercase tracking-widest">Protocol Sync Error</h4>
                                                    <p className="text-[10px] font-mono text-j-text-muted uppercase tracking-tight leading-relaxed px-4">
                                                        {error === "GPS Pulse Weak. Attempting IP triangulation..."
                                                            ? "Acquiring orbital link... Please type your city in Origin Scan if auto-sync fails."
                                                            : error}
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-16 h-16 rounded-full border border-j-cyan/30 border-t-j-cyan animate-spin"></div>
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-mono text-j-cyan uppercase tracking-[0.2em] animate-pulse">Establishing Satellite Link...</p>
                                                    <p className="text-[8px] text-white/20 font-mono uppercase">Scanning IP & GPS Signatures</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                <button
                                    onClick={() => window.location.reload()}
                                    className="w-full py-4 rounded-2xl border border-white/10 hover:bg-white/5 text-[10px] font-mono text-j-text-muted uppercase tracking-widest transition-all flex items-center justify-center gap-3 mt-auto"
                                >
                                    <RotateCcw size={14} />
                                    Recalibrate Sensors
                                </button>
                            </div>

                            {/* Map Visualizer */}
                            <div className="flex-1 relative bg-j-void">
                                <div ref={mapContainerRef} className="absolute inset-0 z-0" />

                                {/* Overlay FX */}
                                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_40%,_rgba(0,0,0,0.4)_100%)] z-10" />
                                <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-j-void to-transparent z-20" />
                                <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-j-void to-transparent z-20" />
                                <div className="scanline z-30" />

                                {/* Compass and Coordinates */}
                                <div className="absolute bottom-10 right-10 z-40 flex flex-col items-end gap-2">
                                    <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg font-mono text-[9px] text-j-cyan tracking-widest uppercase">
                                        Lat: {currentLocation?.[0].toFixed(5)} | Lon: {currentLocation?.[1].toFixed(5)}
                                    </div>
                                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-black/40 backdrop-blur-md">
                                        <Navigation size={20} className="text-white/60 -rotate-45" />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <style>{`
                .leaflet-container {
                    background: transparent !important;
                }
                .user-location-pulse {
                    background: transparent !important;
                    border: none !important;
                }
                @keyframes pulse-ring {
                    0% { transform: scale(0.33); opacity: 1; }
                    80%, 100% { opacity: 0; }
                }
                .user-location-pulse .animate-ping {
                    animation: pulse-ring 1.25s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
                }
            `}</style>
            </div>
        </div>
    );
};

export default NavigationModule;
