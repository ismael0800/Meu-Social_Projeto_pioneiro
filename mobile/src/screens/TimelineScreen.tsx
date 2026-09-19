import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const mockTimeline = [
  { id: '1', titulo: 'Solicitação Recebida', data: '11/09/2026', concluido: true },
  { id: '2', titulo: 'Triagem Automática OCR', data: '11/09/2026', concluido: true },
  { id: '3', titulo: 'Análise Comercial', data: 'Pendente', concluido: false },
  { id: '4', titulo: 'Benefício Ativado', data: 'Pendente', concluido: false },
];

export default function TimelineScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Acompanhamento</Text>
      <Text style={styles.subtitle}>Matrícula: 12345678</Text>

      <FlatList
        data={mockTimeline}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.timelineItem}>
            <View style={styles.lineColumn}>
              <View style={[styles.circle, item.concluido ? styles.circleConcluido : styles.circlePendente]} />
              {index < mockTimeline.length - 1 && <View style={styles.line} />}
            </View>
            <View style={styles.contentColumn}>
              <Text style={[styles.itemTitle, item.concluido ? styles.textConcluido : styles.textPendente]}>{item.titulo}</Text>
              <Text style={styles.itemDate}>{item.data}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F8FAFC' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#580F53', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30 },
  timelineItem: { flexDirection: 'row', marginBottom: 0 },
  lineColumn: { width: 30, alignItems: 'center' },
  circle: { width: 16, height: 16, borderRadius: 8, zIndex: 1 },
  circleConcluido: { backgroundColor: '#00E5FF' },
  circlePendente: { backgroundColor: '#CBD5E1' },
  line: { width: 2, flex: 1, backgroundColor: '#E2E8F0', marginTop: -8, marginBottom: -8 },
  contentColumn: { flex: 1, paddingBottom: 30, paddingLeft: 10 },
  itemTitle: { fontSize: 16, fontWeight: 'bold' },
  textConcluido: { color: '#580F53' },
  textPendente: { color: '#94A3B8' },
  itemDate: { fontSize: 14, color: '#666', marginTop: 2 }
});
