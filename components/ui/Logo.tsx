import Svg, { Defs, LinearGradient, Stop, Circle, Path, G } from 'react-native-svg';

interface Props {
  size?: number;
}

/** "My Circle" brand mark — an open gradient ring with a leaf at the top-right. */
export default function Logo({ size = 64 }: Props) {
  const r = 33;
  const c = 2 * Math.PI * r;
  const dash = c * 0.78;
  const gap = c * 0.22;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="ringGrad" x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor="#8B5CF6" />
          <Stop offset="1" stopColor="#EC4899" />
        </LinearGradient>
        <LinearGradient id="leafGrad" x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor="#C026D3" />
          <Stop offset="1" stopColor="#EC4899" />
        </LinearGradient>
      </Defs>

      {/* Ring with a gap at the top-right */}
      <G rotation={-52} origin="50,50">
        <Circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={11}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
        />
      </G>

      {/* Leaf */}
      <Path
        d="M70 14 C84 16 88 30 79 41 C65 39 61 24 70 14 Z"
        fill="url(#leafGrad)"
      />
    </Svg>
  );
}
