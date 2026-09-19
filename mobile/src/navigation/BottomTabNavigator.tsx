import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

import HomeScreen from '../screens/TabHome/HomeScreen';
import SolicitacaoMenu from '../screens/TabSolicitar/SolicitacaoMenu';
import GuardiaoScreen from '../screens/TabGuardiao/GuardiaoScreen';
import MinhasSolicitacoesScreen from '../screens/TabConsultar/MinhasSolicitacoesScreen';
import PerfilScreen from '../screens/TabPerfil/PerfilScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        lazy: true,
        detachInactiveScreens: true,
        headerStyle: { backgroundColor: colors.rosa },
        headerTintColor: colors.branco,
        tabBarActiveTintColor: colors.ciano,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { backgroundColor: colors.branco },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Solicitar') iconName = focused ? 'document-text' : 'document-text-outline';
          else if (route.name === 'Guardião') iconName = focused ? 'water' : 'water-outline';
          else if (route.name === 'Consultar') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'Conta') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Solicitar" component={SolicitacaoMenu} options={{ headerShown: false }} />
      <Tab.Screen name="Consultar" component={MinhasSolicitacoesScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Guardião" component={GuardiaoScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Conta" component={PerfilScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}
