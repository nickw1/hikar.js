import React from 'react';
import { XR, GeolocationSession, GeolocationAnchor } from '@omnidotdev/rdk';
import { Canvas } from '@react-three/fiber';

export default function App() {

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
        </GeolocationSession>
        </XR>
        </Canvas>;

    function handleGpsUpdate(pos, distMoved) {
        console.log(JSON.stringify(pos));
    }
}
