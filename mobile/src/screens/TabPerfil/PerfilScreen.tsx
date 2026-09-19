import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, 
  KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator, Alert, Linking, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { colors } from '../../theme/colors';

import { API_BASE_URL } from '../../config/api';

function PerfilScreen() {
  let content;
  // --- STATE DO WIZARD (MÁQUINA DE ESTADOS) ---
  // 0: Menu Inicial (Login / Cadastrar)
  // 1: Escolha (OCR vs Manual)
  // 2: Simulador Câmera
  // 3: Nome -> 4: Matricula -> 5: CEP -> 6: Endereço -> 7: Bairro 
  // 8: Email -> 9: CPF -> 10: WhatsApp -> 11: Senha
  // 12: Sucesso Animado
  // 13: Dashboard do Perfil (Logado)
  // 20: Login
  // 21: Recuperar Senha
  const [step, setStep] = useState(0);
  const [statusTarifa, setStatusTarifa] = useState('SEM_BENEFICIO'); // 'SEM_BENEFICIO', 'EM_ANALISE', 'ATIVA'

  // --- STATE DOS CAMPOS ---
  const [formData, setFormData] = useState({
    nome: '',
    matricula: '',
    cep: '',
    endereco: '',
    bairro: '',
    email: '',
    cpf: '',
    whatsapp: '',
    senha: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => (prev === 3 ? 1 : prev - 1));

  const [notification, setNotification] = useState<{ visible: boolean; title: string; message: string; type: 'success' | 'warning' | 'error', onConfirm?: () => void }>({ visible: false, title: '', message: '', type: 'success' });

  const showNotification = (title: string, message: string, type: 'success' | 'warning' | 'error', onConfirm?: () => void) => {
    setNotification({ visible: true, title, message, type, onConfirm });
  };

  const handleSimulateOCR = async () => {
    try {
      let uri = '';
      let base64 = '';
      
      if (Platform.OS === 'web') {
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
      } else {
        Alert.alert("Como deseja escanear a fatura?", "Escolha a origem da imagem:", [
          { text: "Tirar Foto (Câmera)", onPress: async () => {
              const perm = await ImagePicker.requestCameraPermissionsAsync();
              if(!perm.granted) {
                 showNotification("Permissão negada", "Precisamos da câmera para ler a fatura.", "error");
                 return;
              }
              const result = await ImagePicker.launchCameraAsync({ quality: 0.5, base64: true });
              if(!result.canceled && result.assets) processarBase64(result.assets[0].uri, result.assets[0].base64);
          }},
          { text: "Procurar nos Arquivos/Galeria", onPress: async () => {
              const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if(!perm.granted) {
                 showNotification("Permissão negada", "Precisamos da galeria para ler a fatura.", "error");
                 return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5, base64: true });
              if(!result.canceled && result.assets) processarBase64(result.assets[0].uri, result.assets[0].base64);
          }},
          { text: "Cancelar", style: "cancel" }
        ]);
        return; // Retorna para não continuar o fluxo principal, quem continua é o callback do Alert
      }
    } catch(e) {}
  };

  const processarBase64 = async (uri: string, b64?: string | null) => {
    try {
      setIsLoading(true);
      let base64 = b64;
      if (!base64 && Platform.OS !== 'web') {
         base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 segundos de timeout

      const aiRes = await fetch(`${API_BASE_URL}/analisar-documento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'fatura', imageBase64: base64 }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const aiData = await aiRes.json();
      if (aiRes.status >= 500) throw new Error(aiData.error || "Erro interno");

      if (aiData.valido) {
        const novoNome = aiData.dados?.nomeTitular || formData.nome;
        const novaMatricula = aiData.dados?.matricula || formData.matricula;
        setFormData(prev => ({
          ...prev,
          nome: novoNome,
          matricula: novaMatricula
        }));
        setIsLoading(false);
        showNotification("Leitura Concluída! ✅", `Encontramos os seguintes dados:\nNome: ${novoNome}\nMatrícula: ${novaMatricula}\n\nEles já foram preenchidos para você continuar!`, "success", () => setStep(3));
      } else {
        setIsLoading(false);
        showNotification("Não foi possível ler", aiData.mensagem || "A foto não parece ser uma fatura clara. Por favor, preencha manualmente.", "warning", () => setStep(3));
      }
      
    } catch (e: any) {
      console.warn("Falha no OCR da Fatura:", e.message);
      setIsLoading(false);
      
      const isTimeout = e.name === 'AbortError';
      const isDemoFallback = isTimeout || e.message.includes('sobrecarregado') || e.message.includes('demand');
      const errorMsg = isDemoFallback 
        ? "Os servidores da IA estão sobrecarregados (ou demoraram muito). Vamos aprovar com dados fictícios para você continuar o teste sem ficar travado." 
        : "Ocorreu um erro ao conectar com o servidor. Vamos aprovar com dados fictícios para continuar.";
      
      setFormData(prev => ({
        ...prev,
        nome: 'João Fictício (Demo)',
        matricula: '12345678-9'
      }));
      
      showNotification("Aviso do Sistema", errorMsg, "warning", () => setStep(3));
    }
  };

  const handleFinalize = () => {
    setStep(12); // Tela de Sucesso
    setTimeout(() => {
      setStep(13); // Tela logada
    }, 4000);
  };

  const handleRecoverAccount = () => {
    if (!formData.cpf) {
      Alert.alert("Atenção", "Por favor, digite o seu CPF ou Matrícula primeiro.");
      return;
    }
    
    Alert.alert(
      "Como deseja redefinir sua senha?",
      "Encontramos sua conta! Escolha onde prefere receber o código ou link de recuperação:",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Por E-mail", 
          onPress: () => {
            Alert.alert("Sucesso", "Um link de recuperação foi enviado para seu e-mail cadastrado.");
            setStep(20);
          }
        },
        { 
          text: "Por SMS", 
          onPress: () => {
            Alert.alert("Sucesso", "Um código de recuperação foi enviado para seu celular via SMS.");
            setStep(20);
          }
        }
      ]
    );
  };

  // --- RENDERIZADORES POR ETAPA ---

  if (step === 0) {
    content = (
      <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}>
        <View style={styles.introHeader}>
          <Ionicons name="person-circle" size={80} color="#FFF" />
          <Text style={styles.introTitle}>Minha Conta</Text>
          <Text style={styles.introSubtitle}>
            Acesse seus dados ou crie um novo cadastro para gerenciar suas solicitações.
          </Text>
        </View>
        
        <View style={{ padding: 30, gap: 15, marginTop: 10 }}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(1)}>
            <Text style={styles.primaryBtnText}>Criar meu Cadastro</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(20)}>
            <Text style={styles.secondaryBtnText}>Já tenho conta (Entrar)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (step === 1) {
    content = (
      <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ flexGrow: 1, padding: 30, paddingTop: 100, paddingBottom: 100, justifyContent: 'center' }}>
        <TouchableOpacity style={styles.backBtn} onPress={prevStep}>
          <Ionicons name="arrow-back" size={24} color={colors.slate800} />
        </TouchableOpacity>
        
        <Text style={styles.title}>Como quer preencher?</Text>
        <Text style={styles.subtitle}>Poupe tempo usando nossa inteligência artificial para ler sua Fatura de Água.</Text>
        
        <View style={{ gap: 20, width: '100%', marginTop: 30 }}>
          <TouchableOpacity style={styles.cardBtn} onPress={handleSimulateOCR}>
            <View style={[styles.iconCircle, { backgroundColor: colors.rosa }]}>
              <Ionicons name="camera" size={30} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Tirar foto da Fatura</Text>
              <Text style={styles.cardSubtitle}>Preenchemos Nome, Matrícula e Endereço automaticamente para você!</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cardBtn} onPress={() => setStep(3)}>
            <View style={[styles.iconCircle, { backgroundColor: '#94A3B8' }]}>
              <Ionicons name="create" size={30} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Digitar manualmente</Text>
              <Text style={styles.cardSubtitle}>Preencher todos os campos passo a passo sem usar a câmera.</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // PASSOS DE 3 a 11 (Formulário Progressivo 1 a 1)
  const currentFieldProps = () => {
    switch(step) {
      case 3: return { key: 'nome', title: 'Qual o seu Nome Completo?', icon: 'person' };
      case 4: return { key: 'matricula', title: 'Digite o número da sua Matrícula de Água', icon: 'water' };
      case 5: return { key: 'cep', title: 'Qual o seu CEP?', icon: 'map' };
      case 6: return { key: 'endereco', title: 'Qual o seu Endereço (Rua/Número)?', icon: 'home' };
      case 7: return { key: 'bairro', title: 'E qual o seu Bairro?', icon: 'business' };
      case 8: return { key: 'email', title: 'Digite seu E-mail (Opcional)', icon: 'mail' };
      case 9: return { key: 'cpf', title: 'Qual o seu CPF?', icon: 'card' };
      case 10: return { key: 'whatsapp', title: 'Seu WhatsApp / Telefone', icon: 'logo-whatsapp' };
      case 11: return { key: 'senha', title: 'Crie uma Senha forte', icon: 'lock-closed', isPassword: true };
      default: return { key: 'nome', title: '', icon: '' };
    }
  };

  if (step >= 3 && step <= 11) {
    const props = currentFieldProps();
    const isLastStep = step === 11;
    
    content = (
      <View style={styles.formRoot}>
        {/* Header Fixo Superior */}
        <View style={styles.formHeaderRow}>
          <TouchableOpacity style={styles.formBackBtn} onPress={prevStep}>
            <Ionicons name="arrow-back" size={24} color={colors.slate800} />
          </TouchableOpacity>
          <View style={{ flex: 1, paddingLeft: 15 }}>
            <Text style={styles.progressTextRight}>Passo {step - 2} de 9</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${((step - 2) / 9) * 100}%` }]} />
            </View>
          </View>
        </View>

        {/* Corpo com Rolagem e Ajuste de Teclado */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.formScrollContent} keyboardShouldPersistTaps="handled">
            
            <View style={styles.questionHeaderBox}>
              <View style={styles.iconSquare}>
                <Ionicons name={props.icon as any} size={28} color={colors.azulRoyal} />
              </View>
              <Text style={styles.questionTitleMain}>{props.title}</Text>
            </View>
            
            <TextInput
              style={styles.hugeInput}
              value={formData[props.key as keyof typeof formData]}
              onChangeText={(val) => updateField(props.key as keyof typeof formData, val)}
              autoFocus
              secureTextEntry={props.isPassword}
              placeholder="Sua resposta..."
              placeholderTextColor="#94A3B8"
            />

            {props.key === 'matricula' && (
              <TouchableOpacity
                style={{ marginTop: 25, padding: 18, backgroundColor: 'rgba(37,211,102,0.1)', borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                onPress={() => Linking.openURL('https://wa.me/5508002232000?text=Olá,%20quero%20solicitar%20a%20minha%20primeira%20ligação%20de%20água%20e%20obter%20o%20número%20de%20matrícula%20para%20minha%20casa')}
              >
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" style={{ marginRight: 10 }} />
                <Text style={{ color: '#065F46', fontWeight: 'bold', fontSize: 13, textAlign: 'center', flexShrink: 1 }}>Solicitar a sua primeira ligação de água e obter o número de matrícula para sua casa</Text>
              </TouchableOpacity>
            )}

            <View style={{ flex: 1, minHeight: 40 }} />

            <TouchableOpacity 
              style={[styles.continueBtn, (props.key !== 'email' && !formData[props.key as keyof typeof formData]) && { backgroundColor: '#94A3B8' }]} 
              onPress={isLastStep ? handleFinalize : nextStep}
              disabled={props.key !== 'email' && !formData[props.key as keyof typeof formData]}
            >
              <Text style={styles.continueBtnText}>{isLastStep ? 'Finalizar Cadastro' : 'Continuar'}</Text>
              <Ionicons name={isLastStep ? "checkmark-circle" : "arrow-forward"} size={24} color="#FFF" />
            </TouchableOpacity>
            
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // SUCESSO ANIMADO
  if (step === 12) {
    content = (
      <View style={[styles.containerCenter, { backgroundColor: colors.verdeSucesso }]}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={100} color={colors.verdeSucesso} />
        </View>
        <Text style={[styles.title, { color: '#FFF', fontSize: 28, marginTop: 20 }]}>Cadastro Criado!</Text>
        <Text style={[styles.subtitle, { color: '#E2E8F0', fontSize: 16 }]}>Seus dados foram validados com sucesso.</Text>
      </View>
    );
  }

  // TELA DE LOGIN (ENTRAR NA CONTA)
  if (step === 20) {
    content = (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1, backgroundColor: '#FFF' }} contentContainerStyle={{ flexGrow: 1, padding: 30, paddingTop: 80, paddingBottom: 100 }}>
          <TouchableOpacity style={[styles.backBtn, { position: 'relative', top: 0, left: 0, alignSelf: 'flex-start', marginBottom: 20 }]} onPress={() => setStep(0)}>
            <Ionicons name="arrow-back" size={24} color={colors.slate800} />
          </TouchableOpacity>

          <Text style={[styles.title, { textAlign: 'left', marginTop: 10 }]}>Bem-vindo de volta!</Text>
          <Text style={[styles.subtitle, { textAlign: 'left', marginTop: 5 }]}>Faça login com seu CPF ou Matrícula da Águas de Teresina.</Text>

          <View style={{ marginTop: 40, gap: 20 }}>
            <View>
              <Text style={styles.inputLabel}>CPF ou Matrícula</Text>
              <TextInput 
                style={styles.standardInput}
                placeholder="Digite apenas números"
                keyboardType="numeric"
                value={formData.cpf}
                onChangeText={(val) => updateField('cpf', val)}
              />
            </View>
            <View>
              <Text style={styles.inputLabel}>Senha</Text>
              <TextInput 
                style={styles.standardInput}
                placeholder="••••••••"
                secureTextEntry
                value={formData.senha}
                onChangeText={(val) => updateField('senha', val)}
              />
              <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: 15 }} onPress={() => setStep(21)}>
                <Text style={{ color: colors.azulRoyal, fontWeight: 'bold', fontSize: 14 }}>Esqueci minha senha</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flex: 1, minHeight: 40 }} />

          <TouchableOpacity 
            style={[styles.primaryBtn, { marginTop: 40 }]} 
            onPress={() => {
              updateField('nome', formData.nome || 'Maria Silva Pereira');
              updateField('matricula', formData.cpf || '87654321');
              setStep(13);
            }}
          >
            <Text style={styles.primaryBtnText}>Entrar na Conta</Text>
            <Ionicons name="log-in-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // TELA DE RECUPERAR SENHA (PASSO 21)
  if (step === 21) {
    content = (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1, backgroundColor: '#FFF' }} contentContainerStyle={{ flexGrow: 1, padding: 30, paddingTop: 80, paddingBottom: 100 }}>
          <TouchableOpacity style={[styles.backBtn, { position: 'relative', top: 0, left: 0, alignSelf: 'flex-start', marginBottom: 20 }]} onPress={() => setStep(20)}>
            <Ionicons name="arrow-back" size={24} color={colors.slate800} />
          </TouchableOpacity>

          <Text style={[styles.title, { textAlign: 'left', marginTop: 10 }]}>Recuperar Senha</Text>
          <Text style={[styles.subtitle, { textAlign: 'left', marginTop: 5 }]}>Para sua segurança, precisamos identificar sua conta. Digite seu CPF ou número da Matrícula de Água abaixo.</Text>

          <View style={{ marginTop: 40, gap: 20 }}>
            <View>
              <Text style={styles.inputLabel}>CPF ou Matrícula</Text>
              <TextInput 
                style={styles.standardInput}
                placeholder="Digite apenas números"
                keyboardType="numeric"
                value={formData.cpf} // Reaproveitando o estado
                onChangeText={(val) => updateField('cpf', val)}
              />
            </View>
          </View>

          <View style={{ flex: 1, minHeight: 40 }} />

          <TouchableOpacity 
            style={[styles.primaryBtn, { marginTop: 40 }]} 
            onPress={handleRecoverAccount}
          >
            <Text style={styles.primaryBtnText}>Buscar Conta</Text>
            <Ionicons name="search-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // DASHBOARD DO PERFIL (Pós-Cadastro)
  if (step === 13) {
    const getStatusConfig = () => {
      if (statusTarifa === 'ATIVA') return { label: 'Tarifa Ativa', cor: '#10B981', icone: 'checkmark-circle' };
      if (statusTarifa === 'EM_ANALISE') return { label: 'Em Análise', cor: '#F59E0B', icone: 'time' };
      return { label: 'Sem Benefício', cor: '#EF4444', icone: 'close-circle' };
    };
    const stConf = getStatusConfig();

    const cycleStatus = () => {
      if (statusTarifa === 'SEM_BENEFICIO') setStatusTarifa('EM_ANALISE');
      else if (statusTarifa === 'EM_ANALISE') setStatusTarifa('ATIVA');
      else setStatusTarifa('SEM_BENEFICIO');
    };

    content = (
      <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.profileHeader}>
          
          {/* TAG DE STATUS DA TARIFA */}
          <TouchableOpacity 
            style={[styles.statusTag, { backgroundColor: stConf.cor }]} 
            activeOpacity={0.8}
            onPress={cycleStatus} // Apenas para demonstração!
          >
            <Ionicons name={stConf.icone as any} size={16} color="#FFF" />
            <Text style={styles.statusTagText}>{stConf.label}</Text>
          </TouchableOpacity>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{formData.nome.charAt(0) || 'U'}</Text>
          </View>
          <Text style={styles.profileName}>{formData.nome}</Text>
          <Text style={styles.profileMatricula}>Matrícula: {formData.matricula}</Text>
        </View>
        
        <View style={styles.profileDataBox}>
          <Text style={styles.dataTitle}>Meus Dados Salvos</Text>
          <View style={styles.dataRow}><Text style={styles.dataLabel}>Endereço:</Text><Text style={styles.dataValue}>{formData.endereco}, {formData.bairro}</Text></View>
          <View style={styles.dataRow}><Text style={styles.dataLabel}>CEP:</Text><Text style={styles.dataValue}>{formData.cep}</Text></View>
          <View style={styles.dataRow}><Text style={styles.dataLabel}>CPF:</Text><Text style={styles.dataValue}>{formData.cpf}</Text></View>
          <View style={styles.dataRow}><Text style={styles.dataLabel}>WhatsApp:</Text><Text style={styles.dataValue}>{formData.whatsapp}</Text></View>
          <View style={styles.dataRow}><Text style={styles.dataLabel}>E-mail:</Text><Text style={styles.dataValue}>{formData.email}</Text></View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => setStep(0)}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutBtnText}>Sair da Conta</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <>
      {content}
      
      {/* Custom Notification Modal */}
      <Modal transparent animationType="fade" visible={notification.visible}>
        <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20}}>
           <View style={{backgroundColor: '#FFF', borderRadius: 20, padding: 25, width: '100%', maxWidth: 350, alignItems: 'center'}}>
              <Ionicons 
                name={notification.type === 'success' ? 'checkmark-circle' : notification.type === 'error' ? 'close-circle' : 'warning'} 
                size={70} 
                color={notification.type === 'success' ? '#10B981' : notification.type === 'error' ? '#EF4444' : '#F59E0B'} 
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
      <Modal visible={isLoading} transparent animationType="fade" onRequestClose={() => setIsLoading(false)}>
        <View style={{flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 30}}>
          <View style={styles.scannerBox}>
            <Ionicons name="scan-outline" size={200} color={colors.ciano} />
            <ActivityIndicator size="large" color={colors.ciano} style={{ position: 'absolute' }} />
          </View>
          <Text style={[styles.title, { color: '#FFF', marginTop: 30 }]}>Lendo Fatura...</Text>
          <Text style={[styles.subtitle, { color: '#94A3B8' }]}>Nossa IA está extraindo seus dados automaticamente. Segure firme!</Text>
          
          <TouchableOpacity style={{ marginTop: 40, padding: 15 }} onPress={() => setIsLoading(false)}>
            <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: 'bold' }}>Cancelar Leitura</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  containerCenter: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  introHeader: {
    backgroundColor: colors.azulRoyal,
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
  },
  introTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFF', marginTop: 15, textAlign: 'center' },
  introSubtitle: { fontSize: 15, color: colors.ciano, textAlign: 'center', marginTop: 10, lineHeight: 22, fontWeight: '500' },
  backBtn: {
    position: 'absolute', top: 50, left: 20,
    padding: 10, backgroundColor: '#FFF', borderRadius: 20,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3,
  },
  title: { fontSize: 26, fontWeight: 'bold', color: colors.slate800, marginTop: 20, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#64748B', textAlign: 'center', marginTop: 10, lineHeight: 22 },
  
  actionsBox: { width: '100%', marginTop: 50, gap: 15 },
  primaryBtn: {
    backgroundColor: colors.azulRoyal, padding: 18, borderRadius: 15,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    shadowColor: colors.azulRoyal, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  secondaryBtn: {
    backgroundColor: '#FFF', padding: 18, borderRadius: 15,
    alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1',
  },
  secondaryBtnText: { color: colors.azulRoyal, fontSize: 16, fontWeight: 'bold' },

  cardBtn: {
    backgroundColor: '#FFF', padding: 20, borderRadius: 20,
    flexDirection: 'row', alignItems: 'center', gap: 15,
    borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  iconCircle: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.slate800 },
  cardSubtitle: { fontSize: 13, color: '#64748B', marginTop: 5 },

  scannerBox: {
    width: 250, height: 250, borderRadius: 20,
    borderWidth: 4, borderColor: colors.ciano, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
  },

  formRoot: {
    flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  formHeaderRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF'
  },
  formBackBtn: {
    padding: 8, backgroundColor: '#F1F5F9', borderRadius: 12,
  },
  progressTextRight: { fontSize: 13, fontWeight: 'bold', color: colors.azulRoyal, marginBottom: 5 },
  progressBar: { width: '100%', height: 6, backgroundColor: '#E2E8F0', borderRadius: 3 },
  progressFill: { height: '100%', backgroundColor: colors.ciano, borderRadius: 3 },
  
  formScrollContent: {
    padding: 30, flexGrow: 1, backgroundColor: '#FFF'
  },
  questionHeaderBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  iconSquare: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#F0F9FF', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  questionTitleMain: { fontSize: 24, fontWeight: 'bold', color: colors.slate800, flex: 1, lineHeight: 32 },
  hugeInput: {
    fontSize: 26, fontWeight: 'bold', color: colors.azulRoyal,
    borderBottomWidth: 2, borderBottomColor: '#E2E8F0', paddingVertical: 15,
  },
  continueBtn: {
    backgroundColor: colors.azulRoyal, padding: 18, borderRadius: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    shadowColor: colors.azulRoyal, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3, marginTop: 20
  },
  continueBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  successCircle: {
    width: 150, height: 150, borderRadius: 75, backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 10,
  },

  profileHeader: {
    backgroundColor: colors.azulRoyal, padding: 40, paddingTop: Platform.OS === 'ios' ? 60 : 40, alignItems: 'center',
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
    position: 'relative',
  },
  statusTag: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 25,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, elevation: 5,
  },
  statusTagText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.ciano, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
  profileName: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  profileMatricula: { fontSize: 14, color: '#CBD5E1', marginTop: 5 },

  profileDataBox: { backgroundColor: '#FFF', margin: 20, padding: 20, borderRadius: 15, elevation: 2 },
  dataTitle: { fontSize: 16, fontWeight: 'bold', color: colors.slate800, marginBottom: 15 },
  dataRow: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingVertical: 10 },
  dataLabel: { fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 'bold' },
  dataValue: { fontSize: 15, color: '#334155', marginTop: 4, fontWeight: '500' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginHorizontal: 20, padding: 15, backgroundColor: '#FEF2F2', borderRadius: 15, borderWidth: 1, borderColor: '#FECACA'
  },
  logoutBtnText: { color: '#EF4444', fontWeight: 'bold', fontSize: 16 },

  inputLabel: {
    fontSize: 14, fontWeight: 'bold', color: colors.slate800, marginBottom: 8, textTransform: 'uppercase'
  },
  standardInput: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 15, fontSize: 16, color: colors.slate800
  }
});

export default React.memo(PerfilScreen);
