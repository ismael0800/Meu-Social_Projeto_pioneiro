import React from 'react';
import { TouchableOpacity, Linking, StyleSheet } from 'react-native';

export default function FloatingWhatsApp() {
  const handlePress = () => {
    Linking.openURL('https://wa.me/558002232000');
  };

  return (
    <TouchableOpacity style={styles.fab} onPress={handlePress}>
      {/* Aqui iria um ícone do WhatsApp */}
      <Text style={styles.text}>WApp</Text>
    </TouchableOpacity>
  );
}

import { Text } from 'react-native';

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: '#25D366', // Verde WhatsApp
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 1000
  },
  text: { color: '#fff', fontWeight: 'bold', fontSize: 12 }
});
