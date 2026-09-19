import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Linking, Modal, Animated, Alert, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import NetInfo from '@react-native-community/netinfo';
import { enqueueRequest } from '../../services/SyncService';

import { API_BASE_URL } from '../../config/api';

function SolicitacaoMenu() {
  // Estado para o Assistente de Voz
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [voiceStep, setVoiceStep] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);

  // Estados do Formulário Padrão
  const [formStep, setFormStep] = useState(0); // 0 = Menu, 1+ = Formulário
  const [formData, setFormData] = useState({
    matricula: '12345678-9', // Auto-preenchido do cadastro
    cpf: '111.222.333-44', // Auto-preenchido do cadastro
    rgEnviado: false,
    cadUnicoEnviado: false,
    rgBase64: '',
    cadUnicoBase64: '',
    salvarDocs: false,
    assinatura: false
  });

  // Iniciar animação do microfone (pulsando para simular audição)
  useEffect(() => {
    if (voiceModalVisible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1); // Reseta a animação
    }
  }, [voiceModalVisible]);

  const openWhatsApp = () => {
    Linking.openURL('https://wa.me/5508002232000?text=Olá,%20quero%20solicitar%20a%20Tarifa%20Social');
  };

  const handleOfflineRequest = () => {
    Alert.alert(
      "Modo Offline Seguro 🛡️", 
      "Você pode realizar a sua solicitação normalmente mesmo sem internet! \n\nO aplicativo irá salvar os seus dados com segurança e, assim que você se conectar a uma rede Wi-Fi ou 4G, enviará tudo automaticamente para a equipe da Águas de Teresina."
    );
    // Aqui no futuro podemos apenas abrir o setFormStep(1) e salvar os dados no SQLite local
    setFormStep(1);
  };

  const getVoicePrompt = (step: number) => {
    switch(step) {
      case 0: return "Olá! Sou a assistente virtual. Para começar, por favor, me fale o seu nome completo, CPF e o número da matrícula da sua conta de água.";
      case 1: return "Estou enviando o áudio para análise da inteligência artificial. Aguarde um instante...";
      default: return "";
    }
  };

  const startVoiceMode = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permissão', 'Precisamos do microfone para a acessibilidade por voz.');
        return;
      }
      setVoiceStep(0);
      setVoiceModalVisible(true);
      Speech.speak(getVoicePrompt(0), { language: 'pt-BR', pitch: 1.1, rate: 0.9 });
    } catch (err) {
      console.warn(err);
    }
  };

  const closeVoiceMode = () => {
    Speech.stop();
    setVoiceModalVisible(false);
    if (recording) {
      recording.stopAndUnloadAsync();
      setRecording(null);
    }
    setIsRecording(false);
  };

  const toggleRecording = async () => {
    Speech.stop();
    if (isRecording) {
      // Para de gravar e processa
      setIsRecording(false);
      setIsProcessingAudio(true);
      setVoiceStep(1);
      Speech.speak(getVoicePrompt(1), { language: 'pt-BR', pitch: 1.1, rate: 0.9 });
      
      try {
        if (!recording) return;
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        
        if (uri) {
          let base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          
          const aiRes = await fetch(`${API_BASE_URL}/analisar-audio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64: base64 })
          });
          const aiData = await aiRes.json();
          
          setIsProcessingAudio(false);
          closeVoiceMode();
          
          if (aiData.success && aiData.dados) {
            setFormData(prev => ({
              ...prev,
              cpf: aiData.dados.cpf || prev.cpf,
              matricula: aiData.dados.matricula || prev.matricula
            }));
            
            Alert.alert(
              "Dados Preenchidos!", 
              `A IA ouviu e preencheu:\nCPF: ${aiData.dados.cpf || 'Não identificado'}\nMatrícula: ${aiData.dados.matricula || 'Não identificado'}`
            );
            
            setFormStep(1); // Vai para o formulário ver os dados preenchidos
          } else {
            Alert.alert("Aviso", "A IA não conseguiu identificar os dados no áudio. Tente novamente.");
          }
        }
      } catch (err) {
        setIsProcessingAudio(false);
        closeVoiceMode();
        Alert.alert("Erro", "Falha ao processar o áudio.");
      }
    } else {
      // Inicia a gravação
      try {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        setRecording(recording);
        setIsRecording(true);
      } catch (err) {
        Alert.alert('Erro', 'Falha ao iniciar gravação.');
      }
    }
  };

  // Funções de Navegação do Formulário
  const nextStep = () => setFormStep(prev => prev + 1);
  const prevStep = () => setFormStep(prev => prev - 1);
  const simularDocumento = async (tipo: 'rg' | 'cadUnico') => {
    // Na Web, o Alert com múltiplos botões nativos não funciona bem. Vamos direto para a galeria.
    if (Platform.OS === 'web') {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5, base64: true });
        if(!result.canceled && result.assets && result.assets.length > 0) {
           processarUpload(tipo, result.assets[0].uri, result.assets[0].base64);
        }
      } catch (e: any) {
        alert("Erro ao abrir seletor de arquivos.");
      }
      return;
    }

    Alert.alert("Anexar Documento", `Escolha a origem do seu documento (${tipo === 'rg' ? 'Identidade' : 'Comprovante'}):`, [
      { text: "Tirar Foto (Câmera)", onPress: async () => {
          try {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if(!perm.granted) return Alert.alert("Permissão negada", "Precisamos de acesso à câmera");
            const result = await ImagePicker.launchCameraAsync({ quality: 0.5, base64: true });
            if(!result.canceled && result.assets && result.assets.length > 0) {
               processarUpload(tipo, result.assets[0].uri, result.assets[0].base64);
            }
          } catch (e: any) {
            Alert.alert("Erro", "Não foi possível abrir a câmera. Verifique se está usando um emulador.");
          }
      }},
      { text: "Procurar nos Arquivos/Galeria", onPress: async () => {
          try {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if(!perm.granted) return Alert.alert("Permissão negada", "Precisamos de acesso à galeria");
            const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5, base64: true });
            if(!result.canceled && result.assets && result.assets.length > 0) {
               processarUpload(tipo, result.assets[0].uri, result.assets[0].base64);
            }
          } catch (e: any) {
            Alert.alert("Erro", "Não foi possível abrir a galeria.");
          }
      }},
      { text: "Cancelar", style: "cancel" }
    ]);
  };

  const [isUploading, setIsUploading] = useState(false);

  const [notification, setNotification] = useState<{ visible: boolean; title: string; message: string; type: 'success' | 'warning' | 'error' | 'info', onConfirm?: () => void }>({ visible: false, title: '', message: '', type: 'success' });
  const showNotification = (title: string, message: string, type: 'success' | 'warning' | 'error' | 'info', onConfirm?: () => void) => setNotification({ visible: true, title, message, type, onConfirm });

  const processarUpload = async (tipo: 'rg' | 'cadUnico', uri: string, base64Arg?: string | null) => {
    setIsUploading(true);
    let base64 = base64Arg;
    try {
      // 1. Ler o arquivo como Base64
      if (!base64) {
        if (Platform.OS === 'web') {
           const res = await fetch(uri);
           const blob = await res.blob();
           base64 = await new Promise((resolve, reject) => {
             const reader = new FileReader();
             reader.onload = () => {
               const result = reader.result as string;
               resolve(result.split(',')[1]);
             };
             reader.onerror = reject;
             reader.readAsDataURL(blob);
           });
        } else {
           base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        }
      }
      
      // 2. Enviar para a IA validar
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const aiRes = await fetch(`${API_BASE_URL}/analisar-documento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, imageBase64: base64 }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const aiData = await aiRes.json();
      if (aiRes.status >= 500) {
         throw new Error(aiData.error || "Erro interno na API");
      }
      
      if (!aiData.valido) {
        const msg = aiData.mensagem || "A imagem enviada não corresponde ao documento exigido. Tire outra foto.";
        setIsUploading(false);
        showNotification("Documento Inválido", msg, "error");
        return;
      }

      // Sucesso
      setFormData(prev => ({ 
        ...prev, 
        [tipo === 'rg' ? 'rgEnviado' : 'cadUnicoEnviado']: true,
        [tipo === 'rg' ? 'rgBase64' : 'cadUnicoBase64']: base64 
      }));
      setIsUploading(false);
      showNotification("Tudo certo!", `O documento (${tipo === 'rg' ? 'Identidade' : 'Benefício'}) foi validado com sucesso pela nossa IA!`, "success");

    } catch (e: any) {
      console.warn("API de IA falhou, usando bypass para continuar o fluxo:", e.message);
      
      // Se for timeout ou sobrecarga, aplicamos o bypass
      setFormData(prev => ({ 
        ...prev, 
        [tipo === 'rg' ? 'rgEnviado' : 'cadUnicoEnviado']: true,
        [tipo === 'rg' ? 'rgBase64' : 'cadUnicoBase64']: base64 
      }));
      setIsUploading(false);
      
      const isTimeout = e.name === 'AbortError' || (e.message && e.message.includes('AbortError'));
      showNotification("Aviso", isTimeout ? "A IA demorou muito para responder. Vamos aprovar sua foto automaticamente para não travar o teste." : "Os servidores da IA estão sobrecarregados no momento. Vamos aprovar sua foto automaticamente para não travar seu teste.", "warning");
    }
  };

  const enviarSolicitacao = async () => {
    try {
      Alert.alert("Aguarde...", "Preparando sua solicitação...");
      
      const payload = {
        matricula: formData.matricula,
        cpf: formData.cpf,
        origem: 'APP',
        documentos: [
          { tipo: 'rg', base64: formData.rgBase64 },
          { tipo: 'cadunico', base64: formData.cadUnicoBase64 }
        ]
      };

      const netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        await enqueueRequest(payload);
        setFormStep(0);
        setFormData({ matricula: '12345678-9', cpf: '111.222.333-44', rgEnviado: false, cadUnicoEnviado: false, rgBase64: '', cadUnicoBase64: '', salvarDocs: false, assinatura: false });
        return;
      }

      const res = await fetch(`${API_BASE_URL}/solicitacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();
      
      if (resData.success) {
        Alert.alert("Solicitação Enviada! 🎉", "Tudo certo! Seus dados e documentos foram enviados para nossa equipe auditar. Acompanhe na aba Consultar.");
        setFormStep(0);
        setFormData({ matricula: '12345678-9', cpf: '111.222.333-44', rgEnviado: false, cadUnicoEnviado: false, rgBase64: '', cadUnicoBase64: '', salvarDocs: false, assinatura: false });
      } else {
        Alert.alert("Erro", "Falha ao enviar a solicitação.");
      }
    } catch(e) {
      // Fallback para fila offline se o fetch falhar
      await enqueueRequest({ matricula: formData.matricula, cpf: formData.cpf, origem: 'APP' });
      setFormStep(0);
      setFormData({ matricula: '12345678-9', cpf: '111.222.333-44', rgEnviado: false, cadUnicoEnviado: false, rgBase64: '', cadUnicoBase64: '', salvarDocs: false, assinatura: false });
    }
  };

  // --- RENDER: FORMULÁRIO PADRÃO PROGRESSIVO ---
  if (formStep > 0) {
    const totalSteps = 6;
    const progress = (formStep / totalSteps) * 100;

    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        
        {/* Header do Form */}
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.slate800} />
          </TouchableOpacity>
          <Text style={styles.formHeaderTitle}>Solicitação (Passo {formStep})</Text>
          <View style={{width: 24}} />
        </View>

        {/* Barra de Progresso */}
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
          
          {formStep === 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepIconBox}><Ionicons name="water" size={32} color={colors.azulRoyal}/></View>
              <Text style={styles.stepTitle}>Qual a Matrícula da sua conta de água?</Text>
              <Text style={styles.stepDesc}>Você encontra esse número de 9 dígitos no canto superior direito da fatura de água.</Text>
              <TextInput 
                style={styles.input} placeholder="Ex: 12345678-9" 
                keyboardType="numeric" value={formData.matricula}
                onChangeText={(t) => setFormData({...formData, matricula: t})}
              />
              <TouchableOpacity 
                style={[styles.nextBtn, !formData.matricula && styles.nextBtnDisabled]} 
                onPress={nextStep} disabled={!formData.matricula}
              >
                <Text style={styles.nextBtnText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          )}

          {formStep === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepIconBox}><Ionicons name="person" size={32} color={colors.azulRoyal}/></View>
              <Text style={styles.stepTitle}>Confirme o seu CPF</Text>
              <Text style={styles.stepDesc}>Precisamos do CPF do titular para consultar o CadÚnico no banco de dados do Governo.</Text>
              <TextInput 
                style={styles.input} placeholder="Somente números" 
                keyboardType="numeric" value={formData.cpf}
                onChangeText={(t) => setFormData({...formData, cpf: t})}
              />
              <TouchableOpacity 
                style={[styles.nextBtn, !formData.cpf && styles.nextBtnDisabled]} 
                onPress={nextStep} disabled={!formData.cpf}
              >
                <Text style={styles.nextBtnText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          )}

          {formStep === 3 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepIconBox}><Ionicons name="id-card" size={32} color={colors.azulRoyal}/></View>
              <Text style={styles.stepTitle}>Documento de Identidade</Text>
              <Text style={styles.stepDesc}>Agora precisamos de uma foto clara do seu RG ou CNH (Frente e Verso).</Text>
              
              <TouchableOpacity 
                style={[styles.cameraBtn, formData.rgEnviado && styles.cameraBtnSuccess]} 
                onPress={() => simularDocumento('rg')}
              >
                <Ionicons name={formData.rgEnviado ? "checkmark-circle" : "camera"} size={28} color={formData.rgEnviado ? "#10B981" : colors.azulRoyal} />
                <Text style={[styles.cameraBtnText, formData.rgEnviado && {color: "#10B981"}]}>
                  {formData.rgEnviado ? "Documento Salvo!" : "Tirar Foto ou Anexar Arquivo"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={{flexDirection: 'row', alignItems: 'center', marginTop: 25, alignSelf: 'flex-start'}} 
                onPress={() => setFormData({...formData, salvarDocs: !formData.salvarDocs})}
                activeOpacity={0.7}
              >
                <Ionicons name={formData.salvarDocs ? "checkbox" : "square-outline"} size={24} color={formData.salvarDocs ? colors.azulRoyal : '#94A3B8'} />
                <Text style={{marginLeft: 10, color: colors.slate800, flex: 1, fontSize: 13, lineHeight: 18}}>
                  Salvar este documento no meu cadastro para não precisar anexar novamente nas próximas vezes.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.nextBtn, !formData.rgEnviado && styles.nextBtnDisabled, {marginTop: 30}]} 
                onPress={nextStep} disabled={!formData.rgEnviado}
              >
                <Text style={styles.nextBtnText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          )}

          {formStep === 4 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepIconBox}><Ionicons name="newspaper" size={32} color={colors.azulRoyal}/></View>
              <Text style={styles.stepTitle}>Comprovante do Benefício</Text>
              <Text style={styles.stepDesc}>Envie uma foto do seu resumo do CadÚnico, Cartão Bolsa Família ou BPC.</Text>
              
              <TouchableOpacity 
                style={[styles.cameraBtn, formData.cadUnicoEnviado && styles.cameraBtnSuccess]} 
                onPress={() => simularDocumento('cadUnico')}
              >
                <Ionicons name={formData.cadUnicoEnviado ? "checkmark-circle" : "camera"} size={28} color={formData.cadUnicoEnviado ? "#10B981" : colors.azulRoyal} />
                <Text style={[styles.cameraBtnText, formData.cadUnicoEnviado && {color: "#10B981"}]}>
                  {formData.cadUnicoEnviado ? "Comprovante Salvo!" : "Tirar Foto ou Anexar Arquivo"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={{flexDirection: 'row', alignItems: 'center', marginTop: 25, alignSelf: 'flex-start'}} 
                onPress={() => setFormData({...formData, salvarDocs: !formData.salvarDocs})}
                activeOpacity={0.7}
              >
                <Ionicons name={formData.salvarDocs ? "checkbox" : "square-outline"} size={24} color={formData.salvarDocs ? colors.azulRoyal : '#94A3B8'} />
                <Text style={{marginLeft: 10, color: colors.slate800, flex: 1, fontSize: 13, lineHeight: 18}}>
                  Salvar este comprovante no meu cadastro para solicitações futuras.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.nextBtn, !formData.cadUnicoEnviado && styles.nextBtnDisabled, {marginTop: 30}]} 
                onPress={nextStep} disabled={!formData.cadUnicoEnviado}
              >
                <Text style={styles.nextBtnText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          )}

          {formStep === 5 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepIconBox}><Ionicons name="document-lock" size={32} color={colors.azulRoyal}/></View>
              <Text style={styles.stepTitle}>Termo de Autodeclaração</Text>
              <Text style={styles.stepDesc}>Para a Tarifa Social, é necessário assinar a declaração abaixo.</Text>

              <View style={{backgroundColor: '#F8FAFC', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20}}>
                <Text style={{fontSize: 13, color: '#475569', lineHeight: 20, textAlign: 'justify'}}>
                  Declaro, sob as penas da lei, que as informações prestadas são verdadeiras. Confirmo que meu imóvel possui área construída de até 50m², e que me encontro em situação de vulnerabilidade social. Estou ciente de que posso perder o benefício caso qualquer informação seja falsa.
                </Text>
              </View>

              <TouchableOpacity 
                style={{flexDirection: 'row', alignItems: 'center', marginBottom: 30, alignSelf: 'flex-start'}} 
                onPress={() => setFormData({...formData, assinatura: !formData.assinatura})}
                activeOpacity={0.7}
              >
                <Ionicons name={formData.assinatura ? "checkbox" : "square-outline"} size={28} color={formData.assinatura ? colors.azulRoyal : '#94A3B8'} />
                <Text style={{marginLeft: 10, flex: 1, color: colors.slate800, fontWeight: 'bold', fontSize: 14, lineHeight: 20}}>
                  Li e concordo com o termo, e assino digitalmente esta solicitação.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.nextBtn, !formData.assinatura && styles.nextBtnDisabled]} 
                onPress={nextStep} disabled={!formData.assinatura}
              >
                <Text style={styles.nextBtnText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          )}

          {formStep === 6 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepIconBox}><Ionicons name="list-circle" size={32} color={colors.azulRoyal}/></View>
              <Text style={styles.stepTitle}>Revise sua Solicitação</Text>
              <Text style={styles.stepDesc}>Confira os dados abaixo antes de enviar para nossa equipe.</Text>
              
              <View style={styles.resumoBox}>
                <View style={styles.resumoRow}><Text style={styles.resumoLabel}>Matrícula:</Text><Text style={styles.resumoValue}>{formData.matricula}</Text></View>
                <View style={styles.resumoRow}><Text style={styles.resumoLabel}>CPF:</Text><Text style={styles.resumoValue}>{formData.cpf}</Text></View>
                <View style={styles.resumoRow}><Text style={styles.resumoLabel}>Identidade:</Text><Text style={styles.resumoValueOk}>Anexada <Ionicons name="checkmark" size={14}/></Text></View>
                <View style={styles.resumoRow}><Text style={styles.resumoLabel}>CadÚnico:</Text><Text style={styles.resumoValueOk}>Anexado <Ionicons name="checkmark" size={14}/></Text></View>
                <View style={[styles.resumoRow, {borderBottomWidth: 0}]}><Text style={styles.resumoLabel}>Assinatura:</Text><Text style={styles.resumoValueOk}>Realizada <Ionicons name="checkmark" size={14}/></Text></View>
              </View>

              <TouchableOpacity style={[styles.nextBtn, {backgroundColor: '#10B981'}]} onPress={enviarSolicitacao}>
                <Text style={styles.nextBtnText}>Confirmar e Enviar Solicitação</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // --- RENDER: MENU PRINCIPAL DE ESCOLHA (Step 0) ---
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* CABEÇALHO ELEGANTE */}
        <View style={styles.elegantHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 20 }}>
              <Text style={styles.elegantTitle}>Nova Solicitação</Text>
              <Text style={styles.elegantSubtitle}>Escolha a forma mais fácil para você fazer o seu pedido.</Text>
            </View>
            <View style={styles.headerIconBox}>
              <Ionicons name="document-text" size={28} color={colors.azulRoyal} />
            </View>
          </View>
        </View>

        <View style={styles.cardsContainer}>
          
          {/* 1. SOLICITAÇÃO PADRÃO */}
          <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.7}
            onPress={() => setFormStep(1)}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(37, 99, 235, 0.1)' }]}>
              <Ionicons name="create" size={26} color={colors.azulRoyal} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Pelo Aplicativo (Padrão)</Text>
              <Text style={styles.cardDesc}>Preencha seus dados e envie fotos dos documentos por aqui.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>

          {/* 2. SOLICITAÇÃO POR VOZ / ACESSIBILIDADE */}
          <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.7}
            onPress={startVoiceMode}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(236, 72, 153, 0.1)' }]}>
              <Ionicons name="mic" size={26} color={colors.rosa} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Acessibilidade por Voz</Text>
              <Text style={styles.cardDesc}>Converse com o app. Ideal para dificuldades visuais ou de leitura.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>

          {/* 3. SOLICITAÇÃO OFFLINE */}
          <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.7}
            onPress={handleOfflineRequest}
          >
            <View style={[styles.iconBox, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="cloud-offline" size={26} color="#64748B" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Modo Offline</Text>
              <Text style={styles.cardDesc}>Sem rede? Preencha tudo agora e enviamos assim que conectar.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>

          {/* 4. WHATSAPP */}
          <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.7}
            onPress={openWhatsApp}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(37, 211, 102, 0.1)' }]}>
              <Ionicons name="logo-whatsapp" size={26} color="#25D366" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Via WhatsApp</Text>
              <Text style={styles.cardDesc}>Atendimento rápido diretamente pelo nosso canal oficial.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>

        </View>

      </ScrollView>

      {/* MODAL DE ASSISTENTE DE VOZ (TELA INTEIRA MODO ESCURO) */}
      <Modal visible={voiceModalVisible} animationType="slide" transparent={false}>
        <View style={styles.voiceModalContainer}>
          
          <TouchableOpacity 
            style={styles.closeVoiceBtn} 
            onPress={closeVoiceMode}
          >
            <Ionicons name="close" size={30} color="#FFF" />
          </TouchableOpacity>

          <Text style={styles.voiceModalTitle}>Assistente de Acessibilidade</Text>
          
          <View style={styles.micArea}>
            <Animated.View style={[styles.micPulseRing, { transform: [{ scale: pulseAnim }] }]} />
            <View style={styles.micCenter}>
              <Ionicons name="mic" size={60} color="#FFF" />
            </View>
          </View>

          <Text style={styles.voicePromptText}>{getVoicePrompt(voiceStep)}</Text>

          <Text style={styles.voiceInstructionText}>
            (O aplicativo está falando as instruções em áudio e ouvindo a sua resposta pelo microfone...)
          </Text>

          {isProcessingAudio ? (
            <ActivityIndicator size="large" color="#FFF" style={{marginTop: 20}} />
          ) : (
            <TouchableOpacity 
              style={[styles.mockVoiceBtn, isRecording && { backgroundColor: '#EF4444' }]} 
              onPress={toggleRecording}
            >
              <Text style={styles.mockVoiceBtnText}>
                {isRecording ? "[ PARAR DE FALAR ]" : "[ RESPONDER FALANDO ]"}
              </Text>
            </TouchableOpacity>
          )}

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
                onPress={() => {
                  const onConf = notification.onConfirm;
                  setNotification(prev => ({...prev, visible: false}));
                  if(onConf) onConf();
                }}
              >
                 <Text style={{color: '#FFF', fontSize: 16, fontWeight: 'bold'}}>Entendi</Text>
              </TouchableOpacity>
           </View>
        </View>
      </Modal>

      {/* Loading Scanner Modal */}
      <Modal visible={isUploading} transparent animationType="fade" onRequestClose={() => setIsUploading(false)}>
        <View style={{flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 30}}>
          <View style={{ width: 250, height: 250, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 30, borderWidth: 2, borderColor: colors.ciano, borderStyle: 'dashed' }}>
            <Ionicons name="scan-outline" size={150} color={colors.ciano} />
            <ActivityIndicator size="large" color={colors.ciano} style={{ position: 'absolute' }} />
          </View>
          <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#FFF', marginTop: 30, textAlign: 'center' }}>Lendo Documento...</Text>
          <Text style={{ fontSize: 15, color: '#94A3B8', textAlign: 'center', marginTop: 10, lineHeight: 22 }}>Nossa IA está analisando a foto para garantir que está legível. Aguarde um instante!</Text>
          
          <TouchableOpacity style={{ marginTop: 40, padding: 15 }} onPress={() => setIsUploading(false)}>
            <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: 'bold' }}>Cancelar Leitura</Text>
          </TouchableOpacity>
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
  content: {
    flexGrow: 1,
    paddingBottom: 100, // Espaço para barra inferior
  },
  elegantHeader: {
    backgroundColor: colors.azulRoyal,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 25,
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
  cardsContainer: {
    paddingHorizontal: 15,
    marginTop: 20,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
    paddingRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },

  // --- ESTILOS DO FORMULÁRIO PADRÃO ---
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
  },
  backBtn: {
    padding: 5,
  },
  formHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.slate800,
  },
  progressBg: {
    height: 4,
    backgroundColor: '#E2E8F0',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.azulRoyal,
  },
  formContent: {
    flexGrow: 1,
    padding: 25,
    paddingBottom: 120,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  stepIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.slate800,
    textAlign: 'center',
    marginBottom: 10,
  },
  stepDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  input: {
    width: '100%',
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 15,
    padding: 18,
    fontSize: 18,
    color: colors.slate800,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  nextBtn: {
    backgroundColor: colors.azulRoyal,
    width: '100%',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: colors.azulRoyal, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  nextBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
    borderRadius: 15,
    paddingVertical: 20,
    width: '100%',
    gap: 12,
  },
  cameraBtnSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderStyle: 'solid',
  },
  cameraBtnText: {
    color: colors.azulRoyal,
    fontSize: 16,
    fontWeight: 'bold',
  },
  resumoBox: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  resumoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  resumoLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: 'bold',
  },
  resumoValue: {
    fontSize: 14,
    color: colors.slate800,
    fontWeight: 'bold',
  },
  resumoValueOk: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: 'bold',
  },

  // ESTILOS DO MODO DE VOZ
  voiceModalContainer: {
    flex: 1,
    backgroundColor: '#0F172A', // Fundo escuro de alto contraste
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  closeVoiceBtn: {
    position: 'absolute',
    top: 50,
    right: 30,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  voiceModalTitle: {
    position: 'absolute',
    top: 60,
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  micArea: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
  },
  micPulseRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(236, 72, 153, 0.3)', // Rosa translúcido
  },
  micCenter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.rosa,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.rosa, shadowOpacity: 0.8, shadowRadius: 20, elevation: 15,
  },
  voicePromptText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 30,
  },
  voiceInstructionText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  mockVoiceBtn: {
    position: 'absolute',
    bottom: 50,
    padding: 15,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
  },
  mockVoiceBtnText: {
    color: '#94A3B8',
    fontWeight: 'bold',
  }
});

export default React.memo(SolicitacaoMenu);
