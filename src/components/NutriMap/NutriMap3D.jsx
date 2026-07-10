import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export default function NutriMap3D() {
  return (
    <div className="three-box">
      <Canvas camera={{ position: [0, 1.8, 5], fov: 45 }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 5, 4]} intensity={1.5} />

        <mesh position={[0, 0.4, 0]}>
          <capsuleGeometry args={[0.6, 1.8, 24, 48]} />
          <meshStandardMaterial color="#111827" roughness={0.25} metalness={0.3} />
        </mesh>

        <mesh position={[0, 1.55, 0]}>
          <sphereGeometry args={[0.38, 32, 32]} />
          <meshStandardMaterial color="#111827" roughness={0.25} metalness={0.3} />
        </mesh>

        <mesh position={[0.25, 0.8, 0.55]}>
          <sphereGeometry args={[0.08, 32, 32]} />
          <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={2} />
        </mesh>

        <OrbitControls enableZoom={true} />
      </Canvas>
    </div>
  );
}