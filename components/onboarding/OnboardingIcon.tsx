import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface Props {
  icon: IconName;
  iconColor: string;
  bg: string;
  heart?: boolean;
}

export default function OnboardingIcon({ icon, iconColor, bg, heart }: Props) {
  return (
    <View style={{ alignItems: 'center', marginBottom: 28 }}>
      <View style={{ width: 110, height: 110, alignItems: 'center', justifyContent: 'center' }}>
        {/* sparkles */}
        <Text style={{ position: 'absolute', top: 6, left: 2, fontSize: 18, color: '#E9A8F0' }}>✦</Text>
        <Text style={{ position: 'absolute', top: 34, left: -6, fontSize: 12, color: '#C4B5FD' }}>✦</Text>
        <Text style={{ position: 'absolute', top: 10, right: 4, fontSize: 16, color: '#C4B5FD' }}>✦</Text>
        <Text style={{ position: 'absolute', top: 44, right: -4, fontSize: 13, color: '#E9A8F0' }}>✦</Text>

        <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={40} color={iconColor} />
          {heart && (
            <View style={{ position: 'absolute', bottom: 12, right: 16, width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="heart" size={11} color="#EC4899" />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
