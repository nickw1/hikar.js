import { XR, GeolocationSession, GeolocationAnchor } from '@omnidotdev/rdk';
import { Canvas } from '@react-three/fiber';
import { create } from 'zustand';
import * as LT from 'locar-tiler';
import { useRef } from 'react';
import type { FeatureCollection } from '../types/hikar';

interface Poi {
	position: LT.LonLat;
    name: string;
    type: string;
    osm_id: string;
}

interface PoiState {
	pois: Array<Poi>;
	addPoi: (poi: Poi) => void;
}

const usePoiStore = create<PoiState>((set) => ({
    pois: new Array<Poi>(),
	addPoi: (poi: Poi) => set((state) => (
		{ pois: [...state.pois, poi] }
	))
}));

export default function App() {

    const { pois, addPoi } = usePoiStore();

	const tiler = useRef(new LT.JsonTiler("/map/{z}/{x}/{y}.json?layers=poi&outProj=4326"));

    const renderedPois = pois.map ( poi => 
		<GeolocationAnchor key={poi.osm_id} latitude={poi.position.lat}
			longitude={poi.position.lon}>
		<mesh scale={1}>
		<boxGeometry args={[10, 10, 10]} />
		<meshStandardMaterial color="blue" />
		</mesh>
		</GeolocationAnchor>
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
        </GeolocationSession>
        </XR>
        </Canvas>;

    async function handleGpsUpdate(pos: GeolocationPosition, distMoved: number) {
        console.log(`${JSON.stringify(pos)} ${distMoved}`);
		const newData = await tiler.current.updateByLonLat(
			new LT.LonLat(pos.coords.longitude, pos.coords.latitude)
		);
        for(let tile of newData) {
            console.log(tile);
			for(let poiData of (tile.data as FeatureCollection).features) {
				addPoi({
                    position: new LT.LonLat(
					    poiData.geometry.coordinates[0],
					    poiData.geometry.coordinates[1],
                    ),
                    name: poiData.properties.name || "",
                    type: "",
                    osm_id: poiData.properties.osm_id
				});
			}
		}
    }
}
