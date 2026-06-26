import { View, type ViewStyle } from 'react-native';
import { CARD_SHADOW } from '@/constants/theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
}

export default function Card({ children, style, className }: Props) {
  return (
    <View
      className={`bg-surface rounded-card p-5 ${className ?? ''}`}
      style={[CARD_SHADOW, style]}
    >
      {children}
    </View>
  );
}
