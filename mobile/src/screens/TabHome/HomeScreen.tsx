import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Linking, Image, LayoutAnimation, UIManager, Platform 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

// Habilita animações fluidas no Android (LayoutAnimation)
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

function HomeScreen() {
  const navigation = useNavigation<any>();
  const [newsExpanded, setNewsExpanded] = useState(false);

  const openWhatsApp = () => {
    // 0800 223 2000 configurado para o WhatsApp
    Linking.openURL('https://wa.me/5508002232000?text=Olá,%20gostaria%20de%20informações%20sobre%20a%20Tarifa%20Social');
  };

  const handleLogin = () => {
    navigation.navigate('Conta');
  };

  const toggleNews = () => {
    // Dispara uma transição suave de expansão/recolhimento
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNewsExpanded(!newsExpanded);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* BANNER SUPERIOR */}
      <View style={styles.header}>
        {/* Botão de Acessibilidade removido a pedido do usuário */}
        <Image 
          source={require('../../../assets/logo.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
        <Text style={styles.welcomeText}>Bem-vindo ao Meu Social+</Text>
        <Text style={styles.subWelcomeText}>Águas de Teresina</Text>
      </View>

      {/* O QUE É A TARIFA SOCIAL */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Ionicons name="information-circle" size={24} color={colors.rosa} />
          <Text style={styles.infoTitle}>O que é a Tarifa Social?</Text>
        </View>
        <Text style={styles.infoText}>
          A Tarifa Social é um benefício que concede um <Text style={{fontWeight: 'bold', color: colors.azulRoyal}}>desconto de até 50%</Text> na conta de água para famílias de baixa renda inscritas no CadÚnico. Garanta seu direito de forma rápida e digital!
        </Text>
      </View>

      {/* ACORDEÃO DA NOTÍCIA */}
      <View style={styles.newsContainer}>
        <TouchableOpacity style={styles.newsHeader} onPress={toggleNews} activeOpacity={0.7}>
          <View style={styles.newsHeaderLeft}>
            <Ionicons name="newspaper-outline" size={22} color={colors.azulRoyal} />
            <Text style={styles.newsTitle}>Notícia: Impacto em Teresina</Text>
          </View>
          <Ionicons 
            name={newsExpanded ? "chevron-up" : "chevron-down"} 
            size={24} 
            color="#475569" 
          />
        </TouchableOpacity>

        {newsExpanded && (
          <View style={styles.newsContent}>
            <Image 
              source={require('../../../assets/noticia-tarifa.jpg')} 
              style={styles.newsImage} 
              resizeMode="cover"
            />
            
            <Text style={styles.newsParagraph}>
              Mais de 28 mil pessoas na capital já contam com desconto na conta de água por meio da Tarifa Social da Águas de Teresina. A iniciativa garante acesso ao saneamento básico com custo reduzido para famílias inscritas no CadÚnico ou beneficiárias do BPC, promovendo saúde, qualidade de vida e justiça social.
            </Text>

            <Text style={styles.newsSubtitle}>Impacto Comunitário em Números</Text>
            
            <View style={styles.bulletItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.verdeSucesso} style={styles.bulletIcon} />
              <Text style={styles.bulletText}><Text style={styles.boldText}>+49 mil</Text> pessoas alcançadas pelas ações e projetos sociais da concessionária em 2025.</Text>
            </View>
            <View style={styles.bulletItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.verdeSucesso} style={styles.bulletIcon} />
              <Text style={styles.bulletText}><Text style={styles.boldText}>+85</Text> mutirões de atendimento realizados nos bairros pelo programa Estamos Presentes, beneficiando diretamente mais de 2 mil moradores com cadastros, negociação de débitos e troca de titularidade.</Text>
            </View>
            <View style={styles.bulletItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.verdeSucesso} style={styles.bulletIcon} />
              <Text style={styles.bulletText}><Text style={styles.boldText}>+3,3 mil</Text> demandas da comunidade acolhidas e encaminhadas por meio do programa Afluentes.</Text>
            </View>
            <View style={styles.bulletItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.verdeSucesso} style={styles.bulletIcon} />
              <Text style={styles.bulletText}><Text style={styles.boldText}>+5 mil</Text> crianças alcançadas em 31 instituições com ações de educação ambiental do programa Saúde Nota 10.</Text>
            </View>

            <Text style={styles.newsSubtitle}>Requisitos e Documentos para Solicitação</Text>
            
            <View style={styles.bulletItem}>
              <View style={styles.dot} />
              <Text style={styles.bulletText}>CPF e RG do titular;</Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.dot} />
              <Text style={styles.bulletText}>Número do NIS (CadÚnico) ativo ou comprovante do BPC;</Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.dot} />
              <Text style={styles.bulletText}>Conta de água mais recente;</Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.dot} />
              <Text style={styles.bulletText}>Laudo médico circunstanciado (em caso de pessoa com deficiência).</Text>
            </View>

          </View>
        )}
      </View>

      {/* BOTÕES PRINCIPAIS DE AÇÃO */}
      <View style={styles.actionsContainer}>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.azulRoyal }]} 
          onPress={() => navigation.navigate('Solicitar')}
        >
          <Ionicons name="document-text" size={24} color={colors.branco} />
          <Text style={styles.actionButtonText}>Solicitar Tarifa Social Simplificada</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#25D366' }]} 
          onPress={openWhatsApp}
        >
          <Ionicons name="logo-whatsapp" size={24} color={colors.branco} />
          <Text style={styles.actionButtonText}>Solicitar via WhatsApp</Text>
        </TouchableOpacity>

      </View>

      {/* SEÇÃO DE ACOMPANHAMENTO E CONTA */}
      <View style={styles.secondaryContainer}>
        <Text style={styles.sectionTitle}>Já possui um pedido?</Text>

        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={() => navigation.navigate('Consultar')}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="search" size={20} color={colors.azulRoyal} />
          </View>
          <View style={styles.btnTextContainer}>
            <Text style={styles.secondaryButtonText}>Ver minhas solicitações</Text>
            <Text style={styles.secondaryButtonSubText}>Acompanhe o andamento</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={handleLogin}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="person" size={20} color={colors.rosa} />
          </View>
          <View style={styles.btnTextContainer}>
            <Text style={styles.secondaryButtonText}>Entrar em minha conta</Text>
            <Text style={styles.secondaryButtonSubText}>Acesse seus dados e faturas</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  content: { 
    paddingBottom: 40 
  },
  header: {
    backgroundColor: colors.azulRoyal,
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    shadowColor: '#000', 
    shadowOpacity: 0.15, 
    shadowRadius: 10, 
    elevation: 8,
    position: 'relative', // Para o botão de acessibilidade absoluto
  },
  accessibilityBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  logo: { 
    width: 200, 
    height: 80, 
    marginBottom: 10,
    tintColor: '#FFF'
  },
  welcomeText: { 
    color: colors.branco, 
    fontSize: 22, 
    fontWeight: 'bold' 
  },
  subWelcomeText: { 
    color: colors.ciano, 
    fontSize: 14, 
    marginTop: 4,
    fontWeight: '600'
  },
  infoCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: -20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000', 
    shadowOpacity: 0.06, 
    shadowRadius: 8, 
    elevation: 4,
  },
  infoHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  infoTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#1E293B', 
    marginLeft: 8 
  },
  infoText: { 
    fontSize: 14, 
    color: '#475569', 
    lineHeight: 22 
  },
  newsContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 25,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  newsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
    marginLeft: 10,
  },
  newsContent: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  newsImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 15,
  },
  newsParagraph: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 20,
  },
  newsSubtitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.azulRoyal,
    marginBottom: 12,
    marginTop: 5,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  bulletIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.rosa,
    marginTop: 8,
    marginRight: 10,
    marginLeft: 5,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#1E293B',
  },
  actionsContainer: { 
    paddingHorizontal: 20, 
    gap: 15 
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 5, 
    elevation: 3,
  },
  actionButtonText: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginLeft: 10 
  },
  secondaryContainer: { 
    paddingHorizontal: 20, 
    marginTop: 35, 
    gap: 12 
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#1E293B', 
    marginBottom: 5,
    paddingLeft: 5
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  btnTextContainer: {
    flex: 1,
  },
  secondaryButtonText: { 
    color: '#1E293B', 
    fontSize: 15, 
    fontWeight: 'bold' 
  },
  secondaryButtonSubText: { 
    color: '#64748B', 
    fontSize: 12, 
    marginTop: 2 
  },
});
export default React.memo(HomeScreen);
