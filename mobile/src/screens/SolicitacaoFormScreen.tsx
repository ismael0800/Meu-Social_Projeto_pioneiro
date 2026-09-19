import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SolicitacaoFormScreen({ navigation }: any) {
  const [matricula, setMatricula] = useState('');
  const [telefone, setTelefone] = useState('');

  const handleSave = async () => {
    // Offline-first: Salva localmente primeiro
    const solicitacao = { matricula, telefone, status: 'PENDENTE_ENVIO', data: new Date().toISOString() };
    
    try {
      const existing = await AsyncStorage.getItem('@solicitacoes_offline');
      const solicitacoes = existing ? JSON.parse(existing) : [];
      solicitacoes.push(solicitacao);
      await AsyncStorage.setItem('@solicitacoes_offline', JSON.stringify(solicitacoes));
      
      Alert.alert("Sucesso", "Solicitação salva! Será enviada assim que houver conexão com a internet.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Erro", "Falha ao salvar a solicitação localmente.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Matrícula da Conta</Text>
      <TextInput 
        style={styles.input} 
        value={matricula} 
        onChangeText={setMatricula} 
        keyboardType="numeric" 
        placeholder="Ex: 12345678"
      />

      <Text style={styles.label}>Telefone / WhatsApp</Text>
      <TextInput 
        style={styles.input} 
        value={telefone} 
        onChangeText={setTelefone} 
        keyboardType="phone-pad"
        placeholder="(86) 99999-9999"
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Salvar Solicitação (Modo Offline)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F8FAFC' },
  label: { fontSize: 16, color: '#333', marginBottom: 5, fontWeight: 'bold' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#ccc', marginBottom: 20 },
  button: { backgroundColor: '#8A1384', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
