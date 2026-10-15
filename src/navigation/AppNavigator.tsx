import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Layers, Flame } from 'lucide-react-native';

import { DeckListScreen } from '../screens/DeckListScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { DeckDetailScreen } from '../screens/DeckDetailScreen';
import { StudyScreen } from '../screens/StudyScreen';
import { SpeedReviewScreen } from '../screens/SpeedReviewScreen';
import { TypingReviewScreen } from '../screens/TypingReviewScreen';
import { CardEditorModal } from '../screens/CardEditorModal';
import { DeckEditorModal } from '../screens/DeckEditorModal';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="DecksTab"
        component={DeckListScreen}
        options={{
          tabBarLabel: 'Decks',
          tabBarIcon: ({ color, size }) => <Layers size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="StatsTab"
        component={StatsScreen}
        options={{
          tabBarLabel: 'Progress',
          tabBarIcon: ({ color, size }) => <Flame size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="DeckDetail" component={DeckDetailScreen} />
        <Stack.Screen
          name="Study"
          component={StudyScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="SpeedReview"
          component={SpeedReviewScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="TypingReview"
          component={TypingReviewScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Group screenOptions={{ presentation: 'modal' }}>
          <Stack.Screen name="CardEditor" component={CardEditorModal} />
          <Stack.Screen name="DeckEditor" component={DeckEditorModal} />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
};
