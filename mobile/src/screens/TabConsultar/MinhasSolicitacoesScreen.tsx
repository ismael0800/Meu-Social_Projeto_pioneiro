import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Modal, Alert, Image, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

// Tipo da Solicitação
type Solicitacao = {
  id: string;
  data: string;
  status: 'EM_ANALISE' | 'APROVADA' | 'PENDENTE_CORRECAO' | 'RECUSADA';
  mensagemEquipe: string;
  dados: {
    nome: string;
    matricula: string;
    endereco: string;
  };
};

function MinhasSolicitacoesScreen() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([
    {
      id: 'SOL-2026-901',
      data: '10/09/2026',
      status: 'PENDENTE_CORRECAO',
      mensagemEquipe: 'A foto da sua fatura de água ficou borrada e não conseguimos ler o número da matrícula. Por favor, envie uma nova foto nítida do documento.',
      dados: { nome: 'Maria Silva Pereira', matricula: '87654321', endereco: 'Rua das Flores, 123' }
    },
    {
      id: 'SOL-2026-442',
      data: '15/05/2026',
      status: 'APROVADA',
      mensagemEquipe: 'Sua solicitação foi aprovada com sucesso pela nossa equipe! O benefício da Tarifa Social foi ativado e o desconto será aplicado na sua próxima fatura.',
      dados: { nome: 'Maria Silva Pereira', matricula: '87654321', endereco: 'Rua das Flores, 123' }
    },
    {
      id: 'SOL-2026-883',
      data: '12/09/2026',
      status: 'EM_ANALISE',
      mensagemEquipe: 'Sua solicitação foi recebida e está na fila de análise da nossa equipe de auditores. Esse processo pode levar até 3 dias úteis.',
      dados: { nome: 'Maria Silva Pereira', matricula: '87654321', endereco: 'Rua das Flores, 123' }
    },
    {
      id: 'SOL-2025-118',
      data: '02/11/2025',
      status: 'RECUSADA',
      mensagemEquipe: 'Identificamos que o cadastro do CadÚnico informado não está ativo. Por favor, regularize sua situação no CRAS e tente novamente.',
      dados: { nome: 'Maria Silva Pereira', matricula: '87654321', endereco: 'Rua das Flores, 123' }
    }
  ]);

  const [selectedSol, setSelectedSol] = useState<Solicitacao | null>(null);
  const [filtroAtual, setFiltroAtual] = useState('TODOS');

  // Configuração visual de cada status
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'APROVADA': 
        return { cor: '#10B981', icone: 'checkmark-circle', titulo: 'Aprovada', fundo: '#D1FAE5' };
      case 'RECUSADA': 
        return { cor: '#EF4444', icone: 'close-circle', titulo: 'Recusada', fundo: '#FEE2E2' };
      case 'PENDENTE_CORRECAO': 
        return { cor: '#F59E0B', icone: 'warning', titulo: 'Ação Necessária', fundo: '#FEF3C7' };
      case 'EM_ANALISE': 
      default:
        return { cor: '#3B82F6', icone: 'time', titulo: 'Em Análise', fundo: '#DBEAFE' };
    }
  };

  const handleEnviarNovaFoto = () => {
    Alert.alert(
      "Abrir Câmera 📸", 
      "Simulação: Tirando foto do novo documento e enviando para a plataforma...", 
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Confirmar Envio", 
          onPress: () => {
            // Atualiza o estado da solicitação para EM_ANALISE
            setSolicitacoes(prev => 
              prev.map(sol => 
                sol.id === selectedSol?.id 
                  ? { ...sol, status: 'EM_ANALISE', mensagemEquipe: 'Novo documento recebido. Aguardando reanálise.' } 
                  : sol
              )
            );
            Alert.alert("Sucesso!", "Nova foto enviada com sucesso. A equipe fará uma nova análise.");
            setSelectedSol(null); // Fecha o modal
          } 
        }
      ]
    );
  };

  // Dados filtrados baseados no botão clicado
  const solicitacoesFiltradas = solicitacoes.filter(sol => 
    filtroAtual === 'TODOS' ? true : sol.status === filtroAtual
  );

  const opcoesFiltro = [
    { id: 'TODOS', label: 'Todas' },
    { id: 'APROVADA', label: 'Aprovadas' },
    { id: 'PENDENTE_CORRECAO', label: 'Pendentes' },
    { id: 'EM_ANALISE', label: 'Em Análise' },
    { id: 'RECUSADA', label: 'Recusadas' }
  ];

  return (
    <View style={styles.container}>
      
      {/* CABEÇALHO ELEGANTE */}
      <View style={styles.elegantHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 20 }}>
            <Text style={styles.elegantTitle}>Minhas Consultas</Text>
            <Text style={styles.elegantSubtitle}>Acompanhe o andamento e o histórico de todas as suas solicitações.</Text>
          </View>
          <View style={styles.headerIconBox}>
            <Ionicons name="filter" size={28} color={colors.azulRoyal} />
          </View>
        </View>
      </View>

      {/* BARRA DE FILTROS HORIZONTAL (FORA DO CABEÇALHO PARA NÃO CORTAR) */}
      <View style={{ backgroundColor: '#F8FAFC' }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterScroll}
        >
          {opcoesFiltro.map(f => (
            <TouchableOpacity 
              key={f.id} 
              style={[styles.filterChip, filtroAtual === f.id && styles.filterChipActive]}
              onPress={() => setFiltroAtual(f.id)}
            >
              <Text style={[styles.filterChipText, filtroAtual === f.id && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {solicitacoesFiltradas.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 40, opacity: 0.5 }}>
            <Ionicons name="folder-open" size={60} color="#94A3B8" />
            <Text style={{ marginTop: 10, color: '#64748B' }}>Nenhuma solicitação encontrada.</Text>
          </View>
        )}
        {solicitacoesFiltradas.map((sol) => {
          const conf = getStatusConfig(sol.status);
          return (
            <TouchableOpacity 
              key={sol.id} 
              style={styles.card} 
              activeOpacity={0.7}
              onPress={() => setSelectedSol(sol)}
            >
              <View style={[styles.statusLine, { backgroundColor: conf.cor }]} />
              
              <View style={styles.cardHeader}>
                <Text style={styles.protocoloText}>Protocolo: {sol.id}</Text>
                <Text style={styles.dataText}>{sol.data}</Text>
              </View>
              
              <View style={styles.cardBody}>
                <View style={[styles.iconCircle, { backgroundColor: conf.fundo }]}>
                  <Ionicons name={conf.icone as any} size={28} color={conf.cor} />
                </View>
                <View style={styles.infoBox}>
                  <Text style={[styles.statusTitle, { color: conf.cor }]}>{conf.titulo}</Text>
                  <Text style={styles.previewMessage} numberOfLines={2}>
                    {sol.mensagemEquipe}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
              </View>

              {sol.status === 'PENDENTE_CORRECAO' && (
                <View style={styles.alertBanner}>
                  <Ionicons name="alert-circle" size={16} color="#B45309" />
                  <Text style={styles.alertBannerText}>Exige envio de novo documento</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* MODAL DE DETALHES DA SOLICITAÇÃO */}
      <Modal visible={!!selectedSol} animationType="slide" transparent={false}>
        {selectedSol && (
          <View style={styles.modalContainer}>
            
            {/* Header do Modal */}
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedSol(null)}>
                <Ionicons name="close" size={28} color={colors.slate800} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Detalhes do Protocolo</Text>
              <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>Protocolo</Text>
                <Text style={styles.detailValue}>{selectedSol.id}</Text>
                
                <View style={styles.divider} />
                
                <Text style={styles.detailLabel}>Data da Solicitação</Text>
                <Text style={styles.detailValue}>{selectedSol.data}</Text>

                <View style={styles.divider} />

                <Text style={styles.detailLabel}>Dados Enviados</Text>
                <Text style={styles.dadosText}>Nome: {selectedSol.dados.nome}</Text>
                <Text style={styles.dadosText}>Matrícula: {selectedSol.dados.matricula}</Text>
                <Text style={styles.dadosText}>Endereço: {selectedSol.dados.endereco}</Text>
              </View>

              <View style={styles.messageBox}>
                <View style={styles.messageHeader}>
                  <Ionicons name="chatbubbles" size={20} color={colors.azulRoyal} />
                  <Text style={styles.messageTitle}>Mensagem da Equipe Águas</Text>
                </View>
                <Text style={styles.messageContent}>{selectedSol.mensagemEquipe}</Text>
              </View>

              {/* ÁREA DE CORREÇÃO SE ESTIVER PENDENTE */}
              {selectedSol.status === 'PENDENTE_CORRECAO' && (
                <View style={styles.correctionActionBox}>
                  <Text style={styles.correctionTitle}>Precisamos da sua ajuda!</Text>
                  <Text style={styles.correctionSubtitle}>
                    Algum dado ou documento apresentou problema. Tire uma nova foto do documento solicitado para darmos continuidade.
                  </Text>
                  
                  <TouchableOpacity style={styles.cameraBtn} onPress={handleEnviarNovaFoto}>
                    <Ionicons name="camera" size={24} color="#FFF" />
                    <Text style={styles.cameraBtnText}>Enviar Nova Foto Agora</Text>
                  </TouchableOpacity>
                </View>
              )}

            </ScrollView>
          </View>
        )}
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  elegantHeader: {
    backgroundColor: colors.azulRoyal,
    paddingTop: 60,
    paddingBottom: 35,
    paddingHorizontal: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
  },
  elegantTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  elegantSubtitle: {
    fontSize: 14,
    color: colors.ciano,
    lineHeight: 20,
  },
  headerIconBox: {
    backgroundColor: '#FFF',
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 5,
  },
  filterScroll: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1,
  },
  filterChipActive: {
    backgroundColor: colors.azulRoyal,
    borderColor: colors.azulRoyal,
  },
  filterChipText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },
  filterChipTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 20,
    paddingTop: 5,
    paddingBottom: 100, // Passar a navegação
    gap: 15,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  statusLine: {
    height: 5,
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 5,
  },
  protocoloText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#64748B',
  },
  dataText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  infoBox: {
    flex: 1,
    paddingRight: 10,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  previewMessage: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 10,
    paddingHorizontal: 20,
    gap: 8,
  },
  alertBannerText: {
    fontSize: 13,
    color: '#B45309',
    fontWeight: 'bold',
  },

  // ESTILOS DO MODAL DE DETALHES
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 25,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  closeBtn: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.slate800,
  },
  modalScroll: {
    padding: 20,
    paddingBottom: 50,
  },
  detailCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2,
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    color: colors.slate800,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 15,
  },
  dadosText: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 5,
  },
  messageBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 20,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  messageTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.azulRoyal,
  },
  messageContent: {
    fontSize: 15,
    color: '#1E3A8A',
    lineHeight: 24,
  },
  correctionActionBox: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#F59E0B',
    alignItems: 'center',
  },
  correctionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B45309',
    marginBottom: 8,
  },
  correctionSubtitle: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  cameraBtn: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingHorizontal: 25,
    borderRadius: 15,
    gap: 10,
    shadowColor: '#F59E0B', shadowOpacity: 0.3, shadowRadius: 5, elevation: 4,
  },
  cameraBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default React.memo(MinhasSolicitacoesScreen);
