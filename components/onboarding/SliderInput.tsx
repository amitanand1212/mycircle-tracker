import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import { COLORS, FONT } from '@/constants/theme';

interface Props {
  value: number;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  unit?: string;
  onValueChange: (value: number) => void;
}

export default function SliderInput({
  value,
  minimumValue,
  maximumValue,
  step = 1,
  unit = 'days',
  onValueChange,
}: Props) {
  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 24 }}>
        <Text style={{ fontFamily: FONT.bold, fontSize: 72, color: COLORS.primary, lineHeight: 78 }}>
          {value}
        </Text>
        <Text style={{ fontFamily: FONT.medium, fontSize: 22, color: COLORS.textSecondary, marginBottom: 14, marginLeft: 8 }}>
          {unit}
        </Text>
      </View>

      <View style={{ width: '100%', paddingHorizontal: 4 }}>
        <Slider
          value={value}
          minimumValue={minimumValue}
          maximumValue={maximumValue}
          step={step}
          onValueChange={onValueChange}
          minimumTrackTintColor={COLORS.primary}
          maximumTrackTintColor="#EADDF7"
          thumbTintColor={COLORS.primary}
          style={{ width: '100%', height: 40 }}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          <Text style={{ fontFamily: FONT.bold, fontSize: 16, color: '#1E1B4B' }}>{minimumValue}</Text>
          <Text style={{ fontFamily: FONT.bold, fontSize: 16, color: '#1E1B4B' }}>{maximumValue}</Text>
        </View>
      </View>
    </View>
  );
}
