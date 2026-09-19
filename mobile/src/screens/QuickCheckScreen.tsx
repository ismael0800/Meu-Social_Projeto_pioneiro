import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Speech from 'expo-speech';

export default function QuickCheckScreen({ navigation }: any) {
  const [result, setResult] = useState<string | null>(null);

  const simulateOCR = () => {
    // Simula a leitura da foto
    const consumo = Math.floor(Math.random() * 15);
    if (consumo <= 10) {
      const msg = `Seu consumo é de ${consumo} metros cúbicos. Você se enquadra na Tarifa Social!`;
      setResult(msg);
      Speech.speak(msg, { language: 'pt-BR' });
    } else {
      const msg = `Seu consumo de ${consumo} metros cúbicos está acima do limite de 10 metros para o benefício máximo.`;
      setResult(msg);
      Speech.speak(msg, { language: 'pt-BR' });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verifique se você tem direito</Text>
      <Text style={styles.subtitle}>Tire uma foto da sua conta para uma análise rápida (menor ou igual a 10m³).</Text>
      
      <TouchableOpacity style={styles.button} onPress={simulateOCR}>
        <Text style={styles.buttonText}>Simular Leitura (OCR)</Text>
      </TouchableOpacity>

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{result}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('SolicitacaoForm')}>
            <Text style={styles.buttonText}>Fazer Solicitação Oficial</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Guardiao')}>
        <Text style={styles.linkText}>Ir para o Guardião do Consumo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Timeline')}>
        <Text style={styles.linkText}>Ver Minhas Solicitações</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F8FAFC', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#580F53', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#333', textAlign: 'center', marginBottom: 30 },
  button: { backgroundColor: '#00E5FF', padding: 15, borderRadius: 10, alignItems: 'center' },
  primaryButton: { backgroundColor: '#8A1384', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 15 },
  buttonText: { color: '#580F53', fontWeight: 'bold', fontSize: 16 },
  resultBox: { marginTop: 30, padding: 20, backgroundColor: '#fff', borderRadius: 10, elevation: 2 },
  resultText: { fontSize: 18, color: '#333', textAlign: 'center', marginBottom: 10 },
  linkButton: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#8A1384', fontWeight: 'bold' }
});
