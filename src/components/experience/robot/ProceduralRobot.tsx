import { useEffect, useMemo, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

import { useRobotAnimation } from "./useRobotAnimation";

const shell = {
  color: "#e8f3f7",
  metalness: 0.42,
  roughness: 0.2,
};

const shellDark = {
  color: "#9fb5c1",
  metalness: 0.68,
  roughness: 0.24,
};

const joint = {
  color: "#112a38",
  metalness: 0.88,
  roughness: 0.28,
};

const panel = {
  color: "#071923",
  metalness: 0.72,
  roughness: 0.22,
};

const cyan = "#59e7ff";
const cyanDark = "#00b9df";

function Joint({
  position,
  radius = 0.105,
}: {
  position: [number, number, number];
  radius?: number;
}) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 24, 16]} />
      <meshStandardMaterial {...joint} />
    </mesh>
  );
}

function EnergyStrip({
  position,
  size,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  size: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <RoundedBox
      args={size}
      radius={0.01}
      position={position}
      rotation={rotation}
    >
      <meshBasicMaterial
        color={cyan}
        toneMapped={false}
      />
    </RoundedBox>
  );
}

function Arm({
  side,
  armRef,
  elbowRef,
}: {
  side: number;
  armRef: React.RefObject<THREE.Group | null>;
  elbowRef: React.RefObject<THREE.Group | null>;
}) {
  return (
    <group
      ref={armRef}
      position={[side * 0.62, 0.31, 0]}
    >
      {/* Shoulder core */}
      <Joint
        position={[0, 0, 0]}
        radius={0.15}
      />

      {/* Shoulder armor */}
      <RoundedBox
        args={[0.34, 0.27, 0.36]}
        radius={0.11}
        position={[side * 0.04, 0.05, 0.01]}
      >
        <meshStandardMaterial {...shell} />
      </RoundedBox>

      {/* Shoulder accent */}
      <mesh position={[0, 0, 0.195]}>
        <ringGeometry
          args={[0.065, 0.082, 28]}
        />
        <meshBasicMaterial
          color={cyan}
          toneMapped={false}
        />
      </mesh>

      {/* Upper arm */}
      <RoundedBox
        args={[0.23, 0.35, 0.27]}
        radius={0.1}
        position={[0, -0.25, 0]}
      >
        <meshStandardMaterial {...shell} />
      </RoundedBox>

      {/* Upper arm panel */}
      <RoundedBox
        args={[0.11, 0.2, 0.035]}
        radius={0.02}
        position={[0, -0.25, 0.146]}
      >
        <meshStandardMaterial {...panel} />
      </RoundedBox>

      <EnergyStrip
        position={[0, -0.25, 0.167]}
        size={[0.055, 0.11, 0.012]}
      />

      <group
        ref={elbowRef}
        position={[0, -0.46, 0]}
      >
        <Joint
          position={[0, 0, 0]}
          radius={0.108}
        />

        {/* Forearm */}
        <RoundedBox
          args={[0.29, 0.36, 0.31]}
          radius={0.11}
          position={[0, -0.22, 0.045]}
        >
          <meshStandardMaterial {...shell} />
        </RoundedBox>

        {/* Forearm dark panel */}
        <RoundedBox
          args={[0.12, 0.16, 0.03]}
          radius={0.025}
          position={[0, -0.19, 0.205]}
        >
          <meshStandardMaterial
            color="#102d3e"
            metalness={0.7}
            roughness={0.25}
          />
        </RoundedBox>

        {/* Forearm light */}
        <EnergyStrip
          position={[0, -0.24, 0.225]}
          size={[0.1, 0.025, 0.018]}
        />

        {/* Wrist */}
        <Joint
          position={[0, -0.44, 0.06]}
          radius={0.072}
        />

        {/* Hand */}
        <group
          position={[0, -0.5, 0.07]}
          rotation={[0.1, 0, side * 0.1]}
        >
          <RoundedBox
            args={[0.24, 0.21, 0.18]}
            radius={0.068}
          >
            <meshStandardMaterial {...shell} />
          </RoundedBox>

          <RoundedBox
            args={[0.17, 0.09, 0.025]}
            radius={0.02}
            position={[0, 0.02, 0.105]}
          >
            <meshStandardMaterial {...panel} />
          </RoundedBox>

          {[-1, 0, 1].map((n) => (
            <RoundedBox
              key={n}
              args={[0.058, 0.1, 0.14]}
              radius={0.025}
              position={[
                n * 0.072,
                -0.115,
                0.012,
              ]}
            >
              <meshStandardMaterial {...shellDark} />
            </RoundedBox>
          ))}

          <RoundedBox
            args={[0.072, 0.145, 0.12]}
            radius={0.032}
            position={[
              -side * 0.132,
              -0.015,
              0.04,
            ]}
            rotation={[
              0,
              0,
              -side * 0.45,
            ]}
          >
            <meshStandardMaterial {...shell} />
          </RoundedBox>
        </group>
      </group>
    </group>
  );
}

function Legs() {
  return (
    <group>
      {/* Waist */}
      <RoundedBox
        args={[0.76, 0.22, 0.46]}
        radius={0.085}
        position={[0, -0.54, 0]}
      >
        <meshStandardMaterial {...shellDark} />
      </RoundedBox>

      {/* Waist center */}
      <RoundedBox
        args={[0.3, 0.13, 0.06]}
        radius={0.04}
        position={[0, -0.55, 0.245]}
      >
        <meshStandardMaterial {...joint} />
      </RoundedBox>

      {/* Waist energy strip */}
      <EnergyStrip
        position={[0, -0.55, 0.28]}
        size={[0.18, 0.018, 0.014]}
      />

      {[-1, 1].map((side) => (
        <group
          key={side}
          position={[side * 0.25, 0, 0]}
        >
          <Joint
            position={[0, -0.66, 0]}
            radius={0.108}
          />

          {/* Thigh */}
          <RoundedBox
            args={[0.29, 0.26, 0.3]}
            radius={0.085}
            position={[0, -0.76, 0]}
          >
            <meshStandardMaterial {...shell} />
          </RoundedBox>

          {/* Knee */}
          <Joint
            position={[0, -0.91, 0.025]}
            radius={0.108}
          />

          <mesh
            position={[0, -0.91, 0.135]}
          >
            <circleGeometry
              args={[0.078, 24]}
            />
            <meshStandardMaterial
              color="#416273"
              metalness={0.82}
              roughness={0.2}
            />
          </mesh>

          <mesh
            position={[0, -0.91, 0.14]}
          >
            <ringGeometry
              args={[0.047, 0.058, 24]}
            />
            <meshBasicMaterial
              color={cyan}
              toneMapped={false}
            />
          </mesh>

          {/* Shin */}
          <RoundedBox
            args={[0.28, 0.27, 0.31]}
            radius={0.08}
            position={[0, -1.065, 0.025]}
          >
            <meshStandardMaterial {...shell} />
          </RoundedBox>

          <RoundedBox
            args={[0.09, 0.11, 0.018]}
            radius={0.022}
            position={[0, -1.06, 0.184]}
          >
            <meshStandardMaterial {...joint} />
          </RoundedBox>

          <Joint
            position={[0, -1.2, 0.025]}
            radius={0.075}
          />

          {/* Foot */}
          <RoundedBox
            args={[0.4, 0.17, 0.59]}
            radius={0.07}
            position={[0, -1.245, 0.11]}
          >
            <meshStandardMaterial {...shell} />
          </RoundedBox>

          <RoundedBox
            args={[0.4, 0.05, 0.59]}
            radius={0.018}
            position={[0, -1.33, 0.11]}
          >
            <meshStandardMaterial {...joint} />
          </RoundedBox>

          {/* Foot light */}
          <EnergyStrip
            position={[0, -1.28, 0.407]}
            size={[0.22, 0.016, 0.014]}
          />
        </group>
      ))}
    </group>
  );
}

export function ProceduralRobot() {
  const upper =
    useRef<THREE.Group>(null);

  const head =
    useRef<THREE.Group>(null);

  const left =
    useRef<THREE.Group>(null);

  const right =
    useRef<THREE.Group>(null);

  const leftElbow =
    useRef<THREE.Group>(null);

  const rightElbow =
    useRef<THREE.Group>(null);

  const eyes =
    useRef<THREE.Group>(null);

  const neutralEyes =
    useRef<THREE.Group>(null);

  const happyEyes =
    useRef<THREE.Group>(null);

  const glow =
    useRef<THREE.MeshStandardMaterial>(null);

  const mouth =
    useRef<THREE.Group>(null);

  useRobotAnimation({
    upper,
    head,
    left,
    right,
    leftElbow,
    rightElbow,
    eyes,
    neutralEyes,
    happyEyes,
    mouth,
    glow,
  });

  const badge = useMemo(() => {
    const canvas =
      document.createElement("canvas");

    canvas.width = 512;
    canvas.height = 128;

    const c =
      canvas.getContext("2d")!;

    c.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    c.font =
      "600 58px monospace";

    c.textAlign =
      "center";

    c.textBaseline =
      "middle";

    c.fillStyle =
      "#9fd9ec";

    c.shadowColor =
      "#00c8ff";

    c.shadowBlur = 10;

    c.fillText(
      "CSEBOT",
      canvas.width / 2,
      canvas.height / 2
    );

    const texture =
      new THREE.CanvasTexture(
        canvas
      );

    texture.colorSpace =
      THREE.SRGBColorSpace;

    return texture;
  }, []);

  useEffect(() => {
    return () => {
      badge.dispose();
    };
  }, [badge]);

  return (
    <group>
      <Legs />

      <group ref={upper}>
        {/* Neck */}
        <mesh
          position={[0, 0.4, 0]}
        >
          <cylinderGeometry
            args={[
              0.18,
              0.21,
              0.2,
              28,
            ]}
          />
          <meshStandardMaterial {...joint} />
        </mesh>

        <mesh
          position={[0, 0.47, 0]}
        >
          <cylinderGeometry
            args={[
              0.24,
              0.24,
              0.045,
              28,
            ]}
          />
          <meshStandardMaterial {...shell} />
        </mesh>

        {/* Main torso */}
        <RoundedBox
          args={[1.04, 0.84, 0.66]}
          radius={0.23}
          smoothness={6}
          position={[0, -0.025, 0]}
        >
          <meshStandardMaterial {...shell} />
        </RoundedBox>

        {/* Shoulder armor plates */}
        {[-1, 1].map((side) => (
          <RoundedBox
            key={side}
            args={[
              0.28,
              0.22,
              0.5,
            ]}
            radius={0.08}
            position={[
              side * 0.47,
              0.22,
              0.02,
            ]}
            rotation={[
              0,
              0,
              -side * 0.08,
            ]}
          >
            <meshStandardMaterial {...shellDark} />
          </RoundedBox>
        ))}

        {/* Chest dark panel */}
        <RoundedBox
          args={[0.79, 0.58, 0.085]}
          radius={0.18}
          smoothness={5}
          position={[0, -0.04, 0.32]}
        >
          <meshStandardMaterial {...panel} />
        </RoundedBox>

        {/* Inner chest layer */}
        <RoundedBox
          args={[0.59, 0.39, 0.045]}
          radius={0.12}
          smoothness={4}
          position={[0, -0.04, 0.37]}
        >
          <meshStandardMaterial
            color="#113344"
            metalness={0.78}
            roughness={0.2}
          />
        </RoundedBox>

        {/* Chest core */}
        <mesh
          position={[
            0,
            -0.055,
            0.402,
          ]}
        >
          <circleGeometry
            args={[0.115, 8]}
          />
          <meshStandardMaterial
            ref={glow}
            color="#8cf5ff"
            emissive={cyanDark}
            emissiveIntensity={1.5}
          />
        </mesh>

        {/* Core outer ring */}
        <mesh
          position={[
            0,
            -0.055,
            0.407,
          ]}
        >
          <ringGeometry
            args={[
              0.13,
              0.148,
              8,
            ]}
          />
          <meshBasicMaterial
            color={cyan}
            toneMapped={false}
          />
        </mesh>

        {/* Core halo */}
        <mesh
          position={[
            0,
            -0.055,
            0.411,
          ]}
        >
          <ringGeometry
            args={[
              0.16,
              0.164,
              32,
            ]}
          />
          <meshBasicMaterial
            color="#79eaff"
            transparent
            opacity={0.3}
            toneMapped={false}
          />
        </mesh>

        {/* Badge */}
        <mesh
          position={[
            0,
            0.17,
            0.369,
          ]}
        >
          <planeGeometry
            args={[0.38, 0.095]}
          />
          <meshBasicMaterial
            map={badge}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* Chest side lights */}
        {[-1, 1].map((side) => (
          <EnergyStrip
            key={side}
            position={[
              side * 0.43,
              -0.025,
              0.29,
            ]}
            size={[
              0.024,
              0.27,
              0.018,
            ]}
            rotation={[
              0,
              0,
              -side * 0.2,
            ]}
          />
        ))}

        {/* Lower chest vents */}
        {[-1, 1].map((side) => (
          <group
            key={side}
            position={[
              side * 0.23,
              -0.29,
              0.35,
            ]}
          >
            {[-1, 0, 1].map((n) => (
              <RoundedBox
                key={n}
                args={[
                  0.11,
                  0.012,
                  0.012,
                ]}
                radius={0.004}
                position={[
                  0,
                  n * 0.025,
                  0,
                ]}
              >
                <meshBasicMaterial
                  color="#578597"
                  transparent
                  opacity={0.55}
                />
              </RoundedBox>
            ))}
          </group>
        ))}

        {/* HEAD */}
        <group
          ref={head}
          position={[0, 0.96, 0]}
        >
          {/* Main head */}
          <RoundedBox
            args={[1.44, 0.96, 0.87]}
            radius={0.35}
            smoothness={7}
          >
            <meshStandardMaterial {...shell} />
          </RoundedBox>

          {/* Temple side trims */}
          {[-1, 1].map((side) => (
            <RoundedBox
              key={side}
              args={[
                0.09,
                0.52,
                0.28,
              ]}
              radius={0.045}
              position={[
                side * 0.67,
                -0.015,
                0.2,
              ]}
            >
              <meshStandardMaterial {...shellDark} />
            </RoundedBox>
          ))}

          {/* Face bezel */}
          <RoundedBox
            args={[
              1.3,
              0.81,
              0.24,
            ]}
            radius={0.29}
            smoothness={7}
            position={[
              0,
              -0.025,
              0.39,
            ]}
          >
            <meshStandardMaterial
              color="#2d5364"
              metalness={0.83}
              roughness={0.18}
            />
          </RoundedBox>

          {/* Face glass */}
          <RoundedBox
            args={[
              1.24,
              0.75,
              0.245,
            ]}
            radius={0.27}
            smoothness={7}
            position={[
              0,
              -0.02,
              0.423,
            ]}
          >
            <meshPhysicalMaterial
              color="#020b12"
              metalness={0.5}
              roughness={0.1}
              clearcoat={1}
              clearcoatRoughness={0.06}
              transmission={0.02}
            />
          </RoundedBox>

          {/* Face glass reflection */}
          <RoundedBox
            args={[
              0.82,
              0.036,
              0.014,
            ]}
            radius={0.018}
            position={[
              -0.08,
              0.23,
              0.548,
            ]}
            rotation={[
              0,
              0,
              0.035,
            ]}
          >
            <meshBasicMaterial
              color="#c5efff"
              transparent
              opacity={0.16}
            />
          </RoundedBox>

          {/* Eyes */}
          <group
            ref={eyes}
            position={[
              0,
              0,
              0.556,
            ]}
          >
            <group ref={neutralEyes}>
              {[-1, 1].map((side) => (
                <RoundedBox
                  key={side}
                  args={[
                    0.185,
                    0.26,
                    0.038,
                  ]}
                  radius={0.085}
                  smoothness={5}
                  position={[
                    side * 0.267,
                    0.015,
                    0,
                  ]}
                  rotation={[
                    0,
                    0,
                    side * 0.06,
                  ]}
                >
                  <meshBasicMaterial
                    color={cyan}
                    toneMapped={false}
                  />
                </RoundedBox>
              ))}
            </group>

            <group ref={happyEyes}>
              {[-1, 1].map((side) => (
                <mesh
                  key={side}
                  position={[
                    side * 0.267,
                    -0.015,
                    0,
                  ]}
                >
                  <torusGeometry
                    args={[
                      0.086,
                      0.025,
                      8,
                      24,
                      Math.PI,
                    ]}
                  />
                  <meshBasicMaterial
                    color={cyan}
                    toneMapped={false}
                  />
                </mesh>
              ))}
            </group>
          </group>

          {/* Mouth */}
          <group
            ref={mouth}
            position={[
              0,
              -0.19,
              0.56,
            ]}
          >
            <RoundedBox
              args={[
                0.15,
                0.024,
                0.018,
              ]}
              radius={0.01}
              smoothness={3}
            >
              <meshBasicMaterial
                color="#72e8f7"
                toneMapped={false}
              />
            </RoundedBox>
          </group>

          {/* Ear modules */}
          {[-1, 1].map((side) => (
            <group
              key={side}
              position={[
                side * 0.73,
                -0.015,
                0,
              ]}
              rotation={[
                0,
                0,
                Math.PI / 2,
              ]}
            >
              <mesh>
                <cylinderGeometry
                  args={[
                    0.175,
                    0.175,
                    0.12,
                    28,
                  ]}
                />
                <meshStandardMaterial {...joint} />
              </mesh>

              <mesh
                position={[
                  0,
                  -side * 0.068,
                  0,
                ]}
              >
                <cylinderGeometry
                  args={[
                    0.128,
                    0.128,
                    0.028,
                    28,
                  ]}
                />
                <meshStandardMaterial {...shell} />
              </mesh>

              <mesh
                position={[
                  0,
                  -side * 0.087,
                  0,
                ]}
              >
                <cylinderGeometry
                  args={[
                    0.069,
                    0.069,
                    0.014,
                    28,
                  ]}
                />
                <meshBasicMaterial
                  color={cyan}
                  toneMapped={false}
                />
              </mesh>
            </group>
          ))}

          {/* Top sensor */}
          <RoundedBox
            args={[
              0.28,
              0.035,
              0.06,
            ]}
            radius={0.016}
            position={[
              0,
              0.49,
              0.06,
            ]}
          >
            <meshBasicMaterial
              color={cyan}
              toneMapped={false}
            />
          </RoundedBox>

          {/* Small sensor dots */}
          {[-1, 0, 1].map((n) => (
            <mesh
              key={n}
              position={[
                n * 0.06,
                0.492,
                0.095,
              ]}
            >
              <sphereGeometry
                args={[
                  0.012,
                  12,
                  8,
                ]}
              />
              <meshBasicMaterial
                color="#b7f5ff"
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>

        <Arm
          side={-1}
          armRef={left}
          elbowRef={leftElbow}
        />

        <Arm
          side={1}
          armRef={right}
          elbowRef={rightElbow}
        />
      </group>
    </group>
  );
}