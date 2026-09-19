import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import NetInfo from '@react-native-community/netinfo';
import { API_BASE_URL } from '../config/api';

const OFFLINE_QUEUE_KEY = '@offline_requests_queue';

// Configurar comportamento da notificação (mostrar mesmo com app aberto)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const scheduleNotification = async (title: string, body: string) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
    },
    trigger: null, // Send immediately
  });
};

export const enqueueRequest = async (requestData: any) => {
  try {
    const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue = queueJson ? JSON.parse(queueJson) : [];
    queue.push({ ...requestData, id: Date.now() });
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    
    // Notificar usuário que foi salvo offline
    await scheduleNotification(
      'Solicitação Salva (Modo Offline)', 
      'Você está sem internet no momento. Sua solicitação foi salva e será enviada automaticamente quando a conexão retornar.'
    );
  } catch (error) {
    console.error('Failed to enqueue request', error);
  }
};

export const processQueue = async () => {
  try {
    const queueJson = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!queueJson) return;
    
    let queue = JSON.parse(queueJson);
    if (queue.length === 0) return;

    let successCount = 0;
    const failedQueue = [];

    for (const req of queue) {
      try {
        const response = await fetch(`${API_BASE_URL}/solicitacoes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req)
        });
        
        if (response.ok) {
          successCount++;
        } else {
          failedQueue.push(req);
        }
      } catch (error) {
        failedQueue.push(req);
      }
    }

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failedQueue));

    if (successCount > 0) {
      await scheduleNotification(
        'Conexão Restabelecida', 
        `${successCount} solicitação(ões) enviada(s) com sucesso para análise!`
      );
    }
  } catch (error) {
    console.error('Failed to process offline queue', error);
  }
};

export const initSyncService = () => {
  // Solicita permissão para notificações
  Notifications.requestPermissionsAsync();

  // Escuta mudanças de rede
  NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable) {
      processQueue();
    }
  });
};
