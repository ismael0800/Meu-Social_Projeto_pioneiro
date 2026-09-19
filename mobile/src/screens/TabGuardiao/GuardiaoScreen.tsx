import React, { useState, useMemo } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Modal, ActivityIndicator, Alert, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { colors } from '../../theme/colors';

const API_BASE_URL = Platform.OS === 'web' ? 'http://localhost:3000/api' : 'http://192.168.21.93:3000/api';

type Fatura = {
  id: string;
  mes: string;
  consumo: number; // em m³
  valorPago: number;
  valorReal: number; // valor sem tarifa social
};

function GuardiaoScreen() {
  const [faturas, setFaturas] = useState<Fatura[]>([
    { id: '1', mes: 'Agosto/2026', consumo: 9, valorPago: 27.50, valorReal: 55.00 },
    { id: '2', mes: 'Julho/2026', consumo: 14, valorPago: 42.00, valorReal: 84.00 },
    { id: '3', mes: 'Junho/2026', consumo: 18, valorPago: 54.00, valorReal: 108.00 },
  ]);

  const [isScanning, setIsScanning] = useState(false);

  // Cálculos do Dashboard
  const totalEconomizado = useMemo(() => {
    return faturas.reduce((acc, fat) => acc + (fat.valorReal - fat.valorPago), 0);
  }, [faturas]);

  const ultimaFatura = faturas[0];

  // Lógica de Alerta de Consumo
  const getAlertConfig = (consumo: number) => {
    // Simulando regras da Tarifa Social (Ex: até 10m³ = desconto máximo, 10-15 = atenção, >15 = risco)
    if (consumo <= 10) {
      return { 
        cor: '#10B981', 
        fundo: '#D1FAE5', 
        icone: 'checkmark-circle', 
        titulo: 'Consumo Ideal!', 
        msg: 'Você está no limite perfeito e garantindo o desconto máximo da Tarifa Social.' 
      };
    } else if (consumo <= 15) {
      return { 
        cor: '#F59E0B', 
        fundo: '#FEF3C7', 
        icone: 'warning', 
        titulo: 'Atenção ao Consumo', 
        msg: 'Seu consumo está subindo. Evite passar de 15m³ para não perder parte do seu benefício.' 
      };
    } else {
      return { 
        cor: '#EF4444', 
        fundo: '#FEE2E2', 
        icone: 'alert-circle', 
        titulo: 'Cuidado! Alto Consumo', 
        msg: 'Você ultrapassou o limite ideal e corre o risco de perder a Tarifa Social. Tente economizar água!' 
      };
    }
  };

  const alertConfig = ultimaFatura ? getAlertConfig(ultimaFatura.consumo) : null;

  // Barra de progresso do limite (Max visual 20m³)
  const maxConsumoVisual = 20;
  const progressWidth = ultimaFatura ? Math.min((ultimaFatura.consumo / maxConsumoVisual) * 100, 100) : 0;

  const [notification, setNotification] = useState<{ visible: boolean; title: string; message: string; type: 'success' | 'warning' | 'error' | 'info' }>({ visible: false, title: '', message: '', type: 'success' });
  const showNotification = (title: string, message: string, type: 'success' | 'warning' | 'error' | 'info') => setNotification({ visible: true, title, message, type });

  // ==========================================
  // NOVA LÓGICA: Consulta de Fatura em Aberto (Integração com Aegea)
  // ==========================================
  const [faturaAberta, setFaturaAberta] = useState<any>(null);
  const [isVerificando, setIsVerificando] = useState(false);

  React.useEffect(() => {
    // Simula a verificação a cada 12h (aqui fazemos no carregamento para demonstração)
    verificarFaturaAberta();
  }, []);

  const verificarFaturaAberta = async () => {
    try {
      setIsVerificando(true);
      // Pega CPF e Matrícula de um contexto/armazenamento real. Aqui usamos os dados de teste.
      const payload = { cpf: '11122233344', matricula: '123456789' };
      
      const res = await fetch(`${API_BASE_URL}/verificar-fatura`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success && data.faturaAberta) {
        setFaturaAberta(data.dados);
      }
    } catch (error) {
      console.warn("Erro ao verificar fatura na Aegea:", error);
    } finally {
      setIsVerificando(false);
    }
  };

  const handleBaixarFatura = () => {
    if (!faturaAberta || !faturaAberta.pdfBase64) return;
    
    showNotification("Baixando PDF", "Sua fatura está sendo aberta para download/visualização.", "info");
    setTimeout(() => {
      // Cria um Data URI para visualizar/baixar no navegador
      const pdfDataUri = `data:application/pdf;base64,${faturaAberta.pdfBase64}`;
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = pdfDataUri;
        link.download = `Fatura_Aegea_${faturaAberta.mesReferencia.replace('/', '_')}.pdf`;
        link.click();
      } else {
        // No mobile nativo, usaríamos expo-file-system e expo-sharing
        Alert.alert("Sucesso", "Fatura baixada com sucesso (Simulação nativa).");
      }
    }, 1500);
  };
  // ==========================================

  const handleScanFatura = async () => {
    let uri = '';
    let base64 = '';
    
    if (Platform.OS === 'web') {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5, base64: true });
        if(result.canceled || !result.assets) return;
        uri = result.assets[0].uri;
        
        const res = await fetch(uri);
        const blob = await res.blob();
        base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch(e) { return showNotification("Erro", "Erro ao abrir arquivo", "error"); }
    } else {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.granted === false) {
        showNotification('Permissão Recusada', 'Você precisa permitir o acesso à câmera para escanear faturas.', 'error');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.5, base64: true });
      if (result.canceled || !result.assets) return;
      uri = result.assets[0].uri;
      base64 = result.assets[0].base64 || '';
    }

    setIsScanning(true);
    showNotification("Lendo Fatura...", "A IA do Guardião está analisando o seu consumo...", "info");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(`${API_BASE_URL}/analisar-documento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'fatura', imageBase64: base64 }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const responseData = await response.json();
      if (response.status >= 500) throw new Error(responseData.error || "Erro interno na API");

      if (responseData.valido && responseData.dados) {
        const consumoM3 = responseData.dados.consumoM3 || 12;
        const valorFatura = responseData.dados.valorTotal || 35.50;
        const valorReal = valorFatura * 2; // Simulação: seria o dobro sem tarifa social

        const novaFatura = {
          id: Date.now().toString(),
          mes: 'Mês Atual',
          consumo: consumoM3,
          valorPago: valorFatura,
          valorReal: valorReal,
        };

        setFaturas(prev => [novaFatura, ...prev]);
        
        const msg = `O Guardião (IA) identificou:\n\nConsumo: ${consumoM3} m³\nValor da Conta: R$ ${valorFatura.toFixed(2)}\nEconomia Estimada: R$ ${(valorReal - valorFatura).toFixed(2)}\n\nFatura registrada!`;
        showNotification('Fatura Escaneada com Sucesso!', msg, 'success');
      } else {
        const erroMsg = responseData.mensagem || 'Não foi possível ler a fatura claramente. Tente novamente em um ambiente mais iluminado.';
        showNotification('Não foi possível ler', erroMsg, 'warning');
      }
    } catch (error: any) {
      console.error(error);
      const isTimeout = error.name === 'AbortError';
      const msgErro = isTimeout 
         ? 'Servidor demorou muito a responder. Fatura mockada registrada para continuar o teste.' 
         : 'Servidor sobrecarregado. Fatura mockada registrada para continuar o teste.';
      showNotification('Aviso do Sistema', msgErro, 'warning');
      
      setFaturas(prev => [{
        id: Date.now().toString(),
        mes: 'Mês Atual (Demo)',
        consumo: 14,
        valorPago: 42.00,
        valorReal: 84.00,
      }, ...prev]);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      
      {/* CABEÇALHO */}
      <View style={styles.elegantHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 15 }}>
            <Text style={styles.elegantTitle}>Guardião da Água</Text>
            <Text style={styles.elegantSubtitle}>Escaneie suas faturas, veja sua economia e controle seu consumo.</Text>
          </View>
          <View style={styles.headerIconBox}>
            <Ionicons name="shield-checkmark" size={24} color={colors.azulRoyal} />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* ========================================== */}
        {/* BANNER DE FATURA EM ABERTO (Integração Aegea) */}
        {/* ========================================== */}
        {isVerificando && (
           <View style={{ backgroundColor: '#DBEAFE', padding: 15, borderRadius: 15, marginBottom: 20, flexDirection: 'row', alignItems: 'center' }}>
             <ActivityIndicator color={colors.azulRoyal} size="small" />
             <Text style={{ marginLeft: 10, color: '#1E3A8A', fontWeight: 'bold' }}>Consultando faturas na concessionária...</Text>
           </View>
        )}
        
        {!isVerificando && faturaAberta && (
          <View style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1, padding: 20, borderRadius: 15, marginBottom: 20, shadowColor: '#EF4444', shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
              <Ionicons name="warning" size={28} color="#EF4444" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#7F1D1D' }}>Fatura Aberta Encontrada!</Text>
                <Text style={{ fontSize: 13, color: '#991B1B', marginTop: 2 }}>Verificação automática (via CPF/Matrícula)</Text>
              </View>
            </View>
            
            <View style={{ backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
               <View>
                 <Text style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', fontWeight: 'bold' }}>Mês de Referência</Text>
                 <Text style={{ fontSize: 16, color: '#0F172A', fontWeight: 'bold' }}>{faturaAberta.mesReferencia}</Text>
               </View>
               <View style={{ alignItems: 'flex-end' }}>
                 <Text style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', fontWeight: 'bold' }}>Valor a Pagar</Text>
                 <Text style={{ fontSize: 18, color: '#EF4444', fontWeight: '900' }}>R$ {faturaAberta.valor.toFixed(2).replace('.', ',')}</Text>
               </View>
            </View>

            <TouchableOpacity 
              style={{ backgroundColor: '#EF4444', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}
              onPress={handleBaixarFatura}
            >
              <Ionicons name="download-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>Baixar Fatura (PDF)</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* ========================================== */}
        
        {/* CARD DE ECONOMIA TOTAL */}
        <View style={styles.economyCard}>
          <View style={styles.economyHeader}>
            <Ionicons name="wallet" size={22} color="#10B981" />
            <Text style={styles.economyTitle}>Economia Total com o App</Text>
          </View>
          <Text style={styles.economyValue}>R$ {totalEconomizado.toFixed(2).replace('.', ',')}</Text>
          <Text style={styles.economySubtitle}>Valor que você deixou de pagar graças à Tarifa Social.</Text>
        </View>

        {/* ALERTA DE CONSUMO ATUAL */}
        {alertConfig && ultimaFatura && (
          <View style={[styles.alertCard, { borderColor: alertConfig.cor }]}>
            <View style={styles.alertHeader}>
              <View style={[styles.iconCircle, { backgroundColor: alertConfig.fundo }]}>
                <Ionicons name={alertConfig.icone as any} size={24} color={alertConfig.cor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.alertTitle, { color: alertConfig.cor }]}>{alertConfig.titulo}</Text>
                <Text style={styles.alertDesc}>{alertConfig.msg}</Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Seu Consumo: {ultimaFatura.consumo} m³</Text>
                <Text style={styles.progressLimit}>Limite: 15 m³</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressWidth}%`, backgroundColor: alertConfig.cor }]} />
              </View>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Histórico de Faturas</Text>

        {/* LISTA DE FATURAS */}
        {faturas.map((fat) => (
          <View key={fat.id} style={styles.faturaCard}>
            <View style={styles.faturaHeader}>
              <Text style={styles.faturaMes}>{fat.mes}</Text>
              <Text style={styles.faturaConsumo}>{fat.consumo} m³</Text>
            </View>
            
            <View style={styles.faturaDivider} />
            
            <View style={styles.faturaValues}>
              <View>
                <Text style={styles.faturaLabel}>Valor Pago</Text>
                <Text style={styles.faturaValorPago}>R$ {fat.valorPago.toFixed(2).replace('.', ',')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.faturaLabel}>Valor sem a Tarifa</Text>
                <Text style={styles.faturaValorReal}>R$ {fat.valorReal.toFixed(2).replace('.', ',')}</Text>
              </View>
            </View>
            
            <View style={styles.economiaTag}>
              <Ionicons name="trending-down" size={16} color="#10B981" />
              <Text style={styles.economiaTagText}>
                Você economizou R$ {(fat.valorReal - fat.valorPago).toFixed(2).replace('.', ',')}
              </Text>
            </View>
          </View>
        ))}

      </ScrollView>

      {/* BOTÃO FLUTUANTE DE ESCANEAR */}
      <TouchableOpacity style={styles.fab} onPress={handleScanFatura} activeOpacity={0.8}>
        <Ionicons name="camera" size={20} color="#FFF" />
        <Text style={styles.fabText}>Escanear Fatura</Text>
      </TouchableOpacity>

      {/* MODAL SIMULADOR DE SCANNER */}
      <Modal visible={isScanning} transparent animationType="fade">
        <View style={styles.scannerModal}>
          <View style={styles.scannerFrame}>
            <View style={styles.scannerCornerTL} />
            <View style={styles.scannerCornerTR} />
            <View style={styles.scannerCornerBL} />
            <View style={styles.scannerCornerBR} />
            
            <ActivityIndicator size="large" color={colors.ciano} style={{ marginBottom: 20 }} />
            <Text style={styles.scannerText}>Lendo fatura com Inteligência Artificial...</Text>
            <Text style={styles.scannerSubtext}>Mantenha o celular estável</Text>
          </View>
        </View>
      </Modal>

      {/* Custom Notification Modal */}
      <Modal transparent animationType="fade" visible={notification.visible}>
        <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20}}>
           <View style={{backgroundColor: '#FFF', borderRadius: 20, padding: 25, width: '100%', maxWidth: 350, alignItems: 'center'}}>
              <Ionicons 
                name={notification.type === 'success' ? 'checkmark-circle' : notification.type === 'error' ? 'close-circle' : 'warning'} 
                size={70} 
                color={notification.type === 'success' ? '#10B981' : notification.type === 'error' ? '#EF4444' : notification.type === 'info' ? colors.azulRoyal : '#F59E0B'} 
              />
              <Text style={{fontSize: 22, fontWeight: 'bold', color: '#1E293B', marginTop: 15, textAlign: 'center'}}>{notification.title}</Text>
              <Text style={{fontSize: 16, color: '#64748B', marginTop: 10, textAlign: 'center', lineHeight: 22}}>{notification.message}</Text>
              
              <TouchableOpacity 
                style={{backgroundColor: colors.azulRoyal, padding: 15, borderRadius: 12, width: '100%', marginTop: 25, alignItems: 'center'}} 
                onPress={() => setNotification(prev => ({...prev, visible: false}))}
              >
                 <Text style={{color: '#FFF', fontSize: 16, fontWeight: 'bold'}}>Entendi</Text>
              </TouchableOpacity>
           </View>
        </View>
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
    paddingTop: Platform.OS === 'ios' ? 45 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
  },
  elegantTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  elegantSubtitle: {
    fontSize: 13,
    color: colors.ciano,
    lineHeight: 18,
  },
  headerIconBox: {
    backgroundColor: '#FFF',
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 5,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 100, // Espaço menor para o botão
    gap: 15,
  },
  economyCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  economyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
  },
  economyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  economyValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 5,
  },
  economySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  alertCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 16,
    borderWidth: 2,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 15,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  alertDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  progressContainer: {
    marginTop: 5,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.slate800,
  },
  progressLimit: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.slate800,
    marginTop: 5,
    marginLeft: 5,
  },
  faturaCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 16,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2,
  },
  faturaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faturaMes: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.slate800,
  },
  faturaConsumo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.azulRoyal,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  faturaDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  faturaValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  faturaLabel: {
    fontSize: 11,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  faturaValorPago: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.slate800,
  },
  faturaValorReal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  economiaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#D1FAE5',
    paddingVertical: 8,
    borderRadius: 10,
  },
  economiaTagText: {
    color: '#065F46',
    fontWeight: 'bold',
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: colors.azulRoyal,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    gap: 8,
    shadowColor: colors.azulRoyal, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  fabText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // MODAL SIMULADOR SCANNER
  scannerModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: '80%',
    height: 400,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    position: 'relative',
  },
  scannerCornerTL: { position: 'absolute', top: -2, left: -2, width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderColor: colors.ciano, borderTopLeftRadius: 20 },
  scannerCornerTR: { position: 'absolute', top: -2, right: -2, width: 40, height: 40, borderTopWidth: 4, borderRightWidth: 4, borderColor: colors.ciano, borderTopRightRadius: 20 },
  scannerCornerBL: { position: 'absolute', bottom: -2, left: -2, width: 40, height: 40, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: colors.ciano, borderBottomLeftRadius: 20 },
  scannerCornerBR: { position: 'absolute', bottom: -2, right: -2, width: 40, height: 40, borderBottomWidth: 4, borderRightWidth: 4, borderColor: colors.ciano, borderBottomRightRadius: 20 },
  scannerText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  scannerSubtext: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 10,
  }
});

export default React.memo(GuardiaoScreen);
