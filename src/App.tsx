import { XR, GeolocationSession, GeolocationAnchor, useGeolocationBackend } from '@omnidotdev/rdk';
import { Canvas } from '@react-three/fiber';
 import { create } from 'zustand';
import * as LT from 'locar-tiler';
import { useRef, useState, useEffect } from 'react';
import { Line } from '@react-three/drei';
import type { FeatureCollection, LineGeometry } from '../types/hikar';

interface OsmEntity {
    id: string;
    name: string;
    type: string;
}

interface Poi extends OsmEntity {
    position: LT.LonLat;
}

interface Way extends OsmEntity {
    coordinates: Array<[number,number] | [number,number,number]>;
}

interface PoiState {
    pois: Array<Poi>;
    ways: Array<Way>;
    addPoi: (poi: Poi) => void;
    addWay: (way: Way) => void;
}

interface GpsStatus {
    pos: GeolocationPosition;
    distMoved: number;
};

const usePoiStore = create<PoiState>((set) => ({
    pois: new Array<Poi>(),
    ways: new Array<Way>(),
    addPoi: (poi: Poi) => set((state) => (
        { pois: [...state.pois, poi] }
    )),
    addWay: (way: Way) => set((state) => (
        { ways: [...state.ways, way] }
    )),
}));

const wayColours = new Map<string,string>([
    ["footway" , "green"],
    ["path" , "green"],
    ["bridleway", "brown"],
    ["byway" , "red"],
    ["cycleway", "blue"],
    ["public_footpath", "green"],
    ["public_bridleway" , "brown"],
    ["byway_open_to_all_traffic","red"],
    ["restricted_byway","magenta"]
]);
    
export default function App() {
    const { pois, addPoi, ways, addWay } = usePoiStore();
    const { isSuccess, locar } = useGeolocationBackend();
    const [ attemptedGps, setAttemptedGps ] = useState<GpsStatus | null>(null);

    useEffect(() => {
        if(attemptedGps) {
            handleGpsUpdate(attemptedGps.pos, attemptedGps.distMoved);
        }
    }, [isSuccess]);

    console.log(`useGeolocationBackend() status: ${isSuccess} ${locar}`);
    const tiler = useRef(new LT.JsonTiler("/map/{z}/{x}/{y}.json?layers=poi,ways&outProj=4326"));

    const renderedPois = pois.map ( poi => 
        <GeolocationAnchor key={`p${poi.id}`} latitude={poi.position.lat}
            longitude={poi.position.lon}>
        <mesh scale={1}>
        <boxGeometry args={[10, 10, 10]} />
        <meshStandardMaterial color="blue" />
        </mesh>
        </GeolocationAnchor>
    );

    const renderedWays = ways.map ( way => 
        <Line key={`w${way.id}`} points={way.coordinates} color={wayColours.get(way.type) || 'lightgray'} lineWidth={5} worldUnits={true} />
    );

    return <Canvas gl={{antialias: false, powerPreference: "default"}}>
        <ambientLight intensity={1.0} />
        <directionalLight position={[10, 10, 10]}  intensity={2} />
        <XR>
        <GeolocationSession options={{ 
            fakeLat: 51.05, fakeLon: -0.72,
            onGpsUpdate: handleGpsUpdate,
        }}>
        <GeolocationAnchor
            latitude={51.0505} 
            longitude={-0.72}>
        <mesh scale={1}>
        <boxGeometry args={[10, 10, 10]} />
        <meshStandardMaterial color="red" />
        </mesh>
        </GeolocationAnchor>
        { renderedPois }
        { renderedWays }
        </GeolocationSession>
        </XR>
        </Canvas>;

    async function handleGpsUpdate(pos: GeolocationPosition, distMoved: number) {
        if(!isSuccess || !locar) {
            console.log("locar not initialised yet - saving pos for later");
            setAttemptedGps({ pos, distMoved });
            return;
        }

        console.log(`handleGpsUpdate(): ${JSON.stringify(pos)} ${distMoved}`);
        const newData = await tiler.current.updateByLonLat(
            new LT.LonLat(pos.coords.longitude, pos.coords.latitude)
        );
        console.log("got newData");
        for(let tile of newData) {
            for(let poiData of (tile.data as FeatureCollection).features) {
                switch(poiData.geometry.type) {
                    case "Point":
                        addPoi({
                            position: new LT.LonLat(
                                poiData.geometry.coordinates[0],
                                poiData.geometry.coordinates[1],
                            ),
                            name: poiData.properties.name || "",
                            type: poiData.properties.place || poiData.properties.natural || poiData.properties.amenity,
                            id: poiData.properties.osm_id
                        });
                        break;
                    case "LineString":
                        if(poiData.properties.access !== "private") {
                            const way = {
                                name: poiData.properties.name || "",
                                type: poiData.properties.designation || poiData.properties.highway,
                                id: `${tile.tile.x}:${tile.tile.y}:${poiData.properties.osm_id}`, // ways can duplicate across tiles so include tile x and y in the ID
                                coordinates:  (poiData.geometry as LineGeometry).coordinates.map(
                                    (lonLat: [number,number] | [number,number,number]) : [number,number,number] => {
                                        const world = locar.lonLatToWorldCoords(lonLat[0], lonLat[1]);
                                        return [world[0],  lonLat[2] || -50, world[1]];

                                    })
                            };
                            if(way.coordinates.length >= 2) {
                                addWay(way);
                            }
                        }
                        break;
                }
            }
        }
    }
}
