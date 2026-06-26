import { TouchableOpacity, Text } from 'react-native';
import { COLORS, FONT } from '@/constants/theme';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: string;
}

export default function Chip({ label, selected, onPress, icon }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: selected ? COLORS.primary : COLORS.border,
        backgroundColor: selected ? '#F3E8FF' : '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {icon ? (
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      ) : null}
      <Text
        style={{
          fontFamily: selected ? FONT.semiBold : FONT.regular,
          fontSize: 13,
          color: selected ? COLORS.primary : COLORS.textSecondary,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
