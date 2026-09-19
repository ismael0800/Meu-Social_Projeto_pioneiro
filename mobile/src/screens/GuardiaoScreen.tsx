import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function GuardiaoScreen() {
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'success' | 'danger'>('success');

  const simularLeitura = () => {
    // Simula a leitura de um hidrômetro para prever o consumo mensal
    const leituraAtual = Math.floor(Math.random() * 5); // Consumo em poucos dias
    const diasPassados = 10;
    const projecaoMensal = (leituraAtual / diasPassados) * 30;

    if (projecaoMensal <= 10) {
      setAlertType('success');
      setMensagem(`Sua projeção de consumo é de ${projecaoMensal.toFixed(1)}m³ neste mês. Você está dentro da meta da Tarifa Social!`);
    } else {
      setAlertType('danger');
      setMensagem(`Atenção! Sua projeção é de ${projecaoMensal.toFixed(1)}m³ neste mês. Você corre risco de perder o benefício máximo (10m³).`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Guardião da Tarifa Social</Text>
      <Text style={styles.subtitle}>Tire uma foto do seu hidrômetro agora e nós calcularemos se o seu ritmo de consumo vai estourar a cota de 10m³ no fim do mês.</Text>

      <TouchableOpacity style={styles.button} onPress={simularLeitura}>
        <Text style={styles.buttonText}>Fotografar Hidrômetro (Simulação)</Text>
      </TouchableOpacity>

      {mensagem && (
        <View style={[styles.resultBox, alertType === 'success' ? styles.successBox : styles.dangerBox]}>
          <Text style={[styles.resultText, alertType === 'success' ? styles.successText : styles.dangerText]}>
            {mensagem}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F8FAFC', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#580F53', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#333', textAlign: 'center', marginBottom: 30 },
  button: { backgroundColor: '#8A1384', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  resultBox: { marginTop: 30, padding: 20, borderRadius: 10, elevation: 2 },
  successBox: { backgroundColor: '#D1FAE5', borderColor: '#34D399', borderWidth: 1 },
  dangerBox: { backgroundColor: '#FEE2E2', borderColor: '#F87171', borderWidth: 1 },
  resultText: { fontSize: 16, textAlign: 'center', fontWeight: 'bold' },
  successText: { color: '#065F46' },
  dangerText: { color: '#991B1B' }
});
