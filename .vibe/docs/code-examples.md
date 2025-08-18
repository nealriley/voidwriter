# React Three Fiber Code Examples for VoidWriter

## 1. Particle System for Typing Effects

### Basic Particle Emitter
```jsx
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function TypingParticles({ emitPosition, isTyping }) {
  const particlesRef = useRef()
  const particleCount = 100
  
  // Create particle positions and velocities
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    const vel = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount; i++) {
      // Initial positions at emit point
      pos[i * 3] = emitPosition[0]
      pos[i * 3 + 1] = emitPosition[1]
      pos[i * 3 + 2] = emitPosition[2]
      
      // Random velocities
      vel[i * 3] = (Math.random() - 0.5) * 0.02
      vel[i * 3 + 1] = Math.random() * 0.02
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02
    }
    
    return [pos, vel]
  }, [emitPosition])
  
  // Animate particles
  useFrame((state, delta) => {
    if (!particlesRef.current || !isTyping) return
    
    const positions = particlesRef.current.geometry.attributes.position.array
    
    for (let i = 0; i < particleCount; i++) {
      // Update positions based on velocity
      positions[i * 3] += velocities[i * 3]
      positions[i * 3 + 1] += velocities[i * 3 + 1]
      positions[i * 3 + 2] += velocities[i * 3 + 2]
      
      // Reset particles that go too far
      if (positions[i * 3 + 1] > 5) {
        positions[i * 3] = emitPosition[0]
        positions[i * 3 + 1] = emitPosition[1]
        positions[i * 3 + 2] = emitPosition[2]
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true
  })
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#88ccff"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
```

## 2. Letter Physics with React Three Rapier

### Physics-Enabled Letters
```jsx
import { RigidBody } from '@react-three/rapier'
import { Text } from '@react-three/drei'

function PhysicsLetter({ letter, position, fontSize = 0.7 }) {
  return (
    <RigidBody
      position={position}
      rotation={[Math.random() * 0.5, Math.random() * 0.5, 0]}
      linearVelocity={[
        (Math.random() - 0.5) * 2,
        Math.random() * 2,
        (Math.random() - 0.5) * 2
      ]}
      angularVelocity={[
        Math.random() * 2,
        Math.random() * 2,
        Math.random() * 2
      ]}
      linearDamping={0.8}
      angularDamping={0.8}
    >
      <Text
        fontSize={fontSize}
        color="#ffffff"
        outlineWidth={fontSize * 0.05}
        outlineColor="#000000"
      >
        {letter}
      </Text>
    </RigidBody>
  )
}

// Usage in main component with Physics provider
import { Physics } from '@react-three/rapier'

function Scene() {
  return (
    <Physics gravity={[0, -2, 0]}>
      {letters.map((letter) => (
        <PhysicsLetter key={letter.id} {...letter} />
      ))}
    </Physics>
  )
}
```

## 3. Text Trail Effects

### Letter with Trail
```jsx
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Trail } from '@react-three/drei'

function TrailingLetter({ letter, position }) {
  const meshRef = useRef()
  
  useFrame((state) => {
    if (meshRef.current) {
      // Floating animation
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 2) * 0.002
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1
    }
  })
  
  return (
    <Trail
      width={2}
      length={10}
      color={new THREE.Color('#88ff88')}
      attenuation={(width) => width}
    >
      <mesh ref={meshRef} position={position}>
        <Text fontSize={0.7} color="white">
          {letter}
        </Text>
      </mesh>
    </Trail>
  )
}
```

## 4. Environment Themes

### Dynamic Environment Switcher
```jsx
import { Environment, Stars, Cloud, Sky } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'

function ThemedEnvironment({ theme = 'space' }) {
  const themes = {
    space: (
      <>
        <Stars radius={100} depth={50} count={5000} factor={4} fade />
        <fog attach="fog" args={['#000000', 10, 50]} />
        <EffectComposer>
          <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} />
          <Vignette eskil={false} offset={0.1} darkness={0.5} />
        </EffectComposer>
      </>
    ),
    underwater: (
      <>
        <fog attach="fog" args={['#006994', 1, 20]} />
        <Environment preset="sunset" />
        <Cloud
          opacity={0.2}
          speed={0.4}
          width={10}
          depth={1.5}
          segments={20}
        />
        <EffectComposer>
          <Bloom luminanceThreshold={0.5} intensity={0.5} />
        </EffectComposer>
      </>
    ),
    forest: (
      <>
        <Sky
          distance={450000}
          sunPosition={[0, 1, 0]}
          inclination={0}
          azimuth={0.25}
        />
        <fog attach="fog" args={['#88cc88', 5, 30]} />
        <Environment preset="forest" />
      </>
    ),
    matrix: (
      <>
        <fog attach="fog" args={['#00ff00', 10, 40]} />
        <gridHelper args={[100, 100, '#00ff00', '#004400']} />
        <EffectComposer>
          <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} />
        </EffectComposer>
      </>
    )
  }
  
  return themes[theme] || themes.space
}
```

## 5. Interactive Camera Controls

### Dynamic Camera Movement
```jsx
import { useThree, useFrame } from '@react-three/fiber'
import { useRef } from 'react'

function DynamicCamera({ target, mode = 'orbit' }) {
  const { camera } = useThree()
  const time = useRef(0)
  
  useFrame((state, delta) => {
    time.current += delta
    
    switch (mode) {
      case 'orbit':
        // Orbit around target
        const radius = 10
        camera.position.x = Math.sin(time.current * 0.2) * radius
        camera.position.z = Math.cos(time.current * 0.2) * radius
        camera.position.y = 5
        camera.lookAt(target)
        break
        
      case 'float':
        // Gentle floating motion
        camera.position.y += Math.sin(time.current) * 0.01
        camera.lookAt(target)
        break
        
      case 'focus':
        // Smooth approach to target
        camera.position.lerp(
          { x: target.x, y: target.y + 2, z: target.z + 5 },
          0.02
        )
        camera.lookAt(target)
        break
    }
  })
  
  return null
}
```

## 6. Word Formation Effects

### Exploding Word Animation
```jsx
import { useSpring, animated } from '@react-spring/three'
import { Text } from '@react-three/drei'

function ExplodingWord({ word, explode = false }) {
  const letters = word.split('')
  
  return (
    <>
      {letters.map((letter, index) => (
        <ExplodingLetter
          key={index}
          letter={letter}
          index={index}
          explode={explode}
        />
      ))}
    </>
  )
}

function ExplodingLetter({ letter, index, explode }) {
  const { position, rotation, scale } = useSpring({
    position: explode
      ? [
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10
        ]
      : [index * 0.5, 0, 0],
    rotation: explode
      ? [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]
      : [0, 0, 0],
    scale: explode ? 0 : 1,
    config: { tension: 200, friction: 20 }
  })
  
  return (
    <animated.mesh position={position} rotation={rotation} scale={scale}>
      <Text fontSize={0.7} color="white">
        {letter}
      </Text>
    </animated.mesh>
  )
}
```

## 7. Performance Optimized Instanced Letters

### Instanced Text System
```jsx
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function InstancedLetters({ letters, maxCount = 1000 }) {
  const meshRef = useRef()
  const tempObject = useMemo(() => new THREE.Object3D(), [])
  
  // Update instances
  useFrame((state) => {
    if (!meshRef.current) return
    
    letters.forEach((letter, i) => {
      tempObject.position.set(...letter.position)
      tempObject.rotation.set(
        Math.sin(state.clock.elapsedTime + i) * 0.1,
        Math.cos(state.clock.elapsedTime + i) * 0.1,
        0
      )
      tempObject.scale.setScalar(letter.scale || 1)
      tempObject.updateMatrix()
      meshRef.current.setMatrixAt(i, tempObject.matrix)
    })
    
    meshRef.current.instanceMatrix.needsUpdate = true
  })
  
  return (
    <instancedMesh ref={meshRef} args={[null, null, maxCount]}>
      <boxGeometry args={[0.5, 0.5, 0.1]} />
      <meshStandardMaterial color="white" />
    </instancedMesh>
  )
}
```

## 8. Shader-Based Text Effects

### Holographic Text Shader
```jsx
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

const HolographicMaterial = shaderMaterial(
  // Uniforms
  {
    time: 0,
    color: new THREE.Color('#00ffff')
  },
  // Vertex shader
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform float time;
    uniform vec3 color;
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      float stripe = sin(vPosition.y * 100.0 + time * 5.0) * 0.5 + 0.5;
      float alpha = stripe * (1.0 - vUv.y);
      
      vec3 finalColor = color + vec3(0.0, stripe * 0.5, stripe);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
)

extend({ HolographicMaterial })

function HolographicText({ text }) {
  const materialRef = useRef()
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.time = state.clock.elapsedTime
    }
  })
  
  return (
    <Text fontSize={1} outlineWidth={0.02}>
      {text}
      <holographicMaterial
        ref={materialRef}
        transparent
        side={THREE.DoubleSide}
      />
    </Text>
  )
}
```

## 9. Morphing Text Geometry

### Text Morph Animation
```jsx
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text3D } from '@react-three/drei'

function MorphingText({ text1, text2, morphSpeed = 1 }) {
  const meshRef = useRef()
  const morphRef = useRef(0)
  
  useFrame((state, delta) => {
    if (!meshRef.current) return
    
    // Oscillate between 0 and 1
    morphRef.current = (Math.sin(state.clock.elapsedTime * morphSpeed) + 1) / 2
    
    // Apply morph target influence
    if (meshRef.current.morphTargetInfluences) {
      meshRef.current.morphTargetInfluences[0] = morphRef.current
    }
  })
  
  return (
    <mesh ref={meshRef}>
      <Text3D
        font="/fonts/helvetiker_regular.typeface.json"
        size={0.75}
        height={0.2}
        curveSegments={12}
        bevelEnabled
        bevelThickness={0.02}
        bevelSize={0.02}
        bevelOffset={0}
        bevelSegments={5}
      >
        {text1}
        <meshNormalMaterial />
      </Text3D>
    </mesh>
  )
}
```

## 10. Sound Reactive Text

### Audio-Responsive Letters
```jsx
import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'

function AudioReactiveText({ text, audioUrl }) {
  const meshRef = useRef()
  const analyserRef = useRef()
  const [audioData, setAudioData] = useState(new Uint8Array(128))
  
  useEffect(() => {
    // Set up audio context and analyser
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    analyserRef.current = analyser
    
    const audio = new Audio(audioUrl)
    const source = audioContext.createMediaElementSource(audio)
    source.connect(analyser)
    analyser.connect(audioContext.destination)
    
    audio.play()
    
    return () => {
      audio.pause()
      audioContext.close()
    }
  }, [audioUrl])
  
  useFrame(() => {
    if (!analyserRef.current || !meshRef.current) return
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    
    // Calculate average frequency
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
    
    // Scale text based on audio
    const scale = 1 + (average / 255) * 0.5
    meshRef.current.scale.setScalar(scale)
    
    // Color based on frequency
    const color = new THREE.Color(
      average / 255,
      (255 - average) / 255,
      0.5
    )
    meshRef.current.material.color = color
  })
  
  return (
    <mesh ref={meshRef}>
      <Text fontSize={1} color="white">
        {text}
        <meshStandardMaterial />
      </Text>
    </mesh>
  )
}
```

## Implementation Tips

### Performance Best Practices
1. **Use Instancing**: For multiple similar objects (letters)
2. **Implement LOD**: Reduce detail for distant objects
3. **Optimize Shaders**: Keep fragment shaders simple
4. **Batch Updates**: Group state changes together
5. **Use Memoization**: Prevent unnecessary recalculations

### Memory Management
```jsx
// Dispose of geometries and materials properly
useEffect(() => {
  return () => {
    geometry?.dispose()
    material?.dispose()
    texture?.dispose()
  }
}, [geometry, material, texture])
```

### Progressive Enhancement
```jsx
// Detect device capabilities
const getQualityLevel = () => {
  const gpu = detectGPU()
  if (gpu.tier >= 3) return 'high'
  if (gpu.tier >= 2) return 'medium'
  return 'low'
}

// Adjust effects based on quality
const quality = getQualityLevel()
const particleCount = quality === 'high' ? 10000 : quality === 'medium' ? 1000 : 100
```

## Conclusion

These code examples provide practical implementations for enhancing VoidWriter with advanced 3D effects. Each example can be adapted and combined to create unique, immersive writing experiences. Remember to profile performance and provide quality settings for different devices.