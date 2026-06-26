import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT } from '@/constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface Props {
  icon: IconName;
  iconColor: string;
  title?: string;
  desc: string;
  circle?: boolean;
}

export default function InfoCard({ icon, iconColor, title, desc, circle = true }: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#EFE8FB', borderRadius: 20, padding: 16 }}>
      {circle ? (
        <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={24} color={iconColor} />
        </View>
      ) : (
        <Ionicons name={icon} size={30} color={iconColor} />
      )}
      <View style={{ flex: 1 }}>
        {title ? (
          <Text style={{ fontFamily: FONT.bold, fontSize: 15, color: '#1E1B4B', marginBottom: 2 }}>{title}</Text>
        ) : null}
        <Text style={{ fontFamily: FONT.regular, fontSize: 13, color: '#6B7280', lineHeight: 19 }}>{desc}</Text>
      </View>
    </View>
  );
}
