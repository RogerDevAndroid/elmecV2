import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useChat } from '@/contexts/ChatContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { Search, MessageCircle, Clock } from 'lucide-react-native';

export default function ChatList() {
  const [searchQuery, setSearchQuery] = useState('');
  const { chatRooms, messages } = useChat();
  const { user } = useFirebaseAuth();
  const router = useRouter();

  const filteredRooms = chatRooms.filter(room => {
    const otherParticipant = room.participantNames.find(
      name => name !== `${user?.nombre} ${user?.apellidoPaterno}`
    );
    return otherParticipant?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString('es-ES', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    }
  };

  const getLastMessagePreview = (roomId: string) => {
    const roomMessages = messages[roomId] || [];
    const lastMessage = roomMessages[roomMessages.length - 1];
    
    if (!lastMessage) return 'No hay mensajes';
    
    switch (lastMessage.messageType) {
      case 'image':
        return '📷 Imagen';
      case 'audio':
        return '🎵 Audio';
      case 'file':
        return '📎 Archivo';
      default:
        return lastMessage.message.length > 50 
          ? lastMessage.message.substring(0, 50) + '...'
          : lastMessage.message;
    }
  };

  const getOtherParticipant = (room: any) => {
    return room.participantNames.find(
      (name: string) => name !== `${user?.nombre} ${user?.apellidoPaterno}`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
        <Text style={styles.subtitle}>Conversaciones activas</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar conversaciones..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView style={styles.chatList} showsVerticalScrollIndicator={false}>
        {filteredRooms.map((room) => {
          const otherParticipant = getOtherParticipant(room);
          const lastMessagePreview = getLastMessagePreview(room.id);
          
          return (
            <TouchableOpacity
              key={room.id}
              style={styles.chatItem}
              onPress={() => router.push(`/chat/${room.id}`)}
            >
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {otherParticipant?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </Text>
                </View>
                {room.unreadCount > 0 && <View style={styles.onlineIndicator} />}
              </View>

              <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                  <Text style={styles.participantName}>{otherParticipant}</Text>
                  <Text style={styles.timestamp}>
                    {room.lastMessage ? formatTime(room.lastMessage.timestamp) : formatTime(room.updatedAt)}
                  </Text>
                </View>
                
                <View style={styles.messagePreview}>
                  <Text style={[
                    styles.lastMessage,
                    room.unreadCount > 0 && styles.unreadMessage
                  ]}>
                    {lastMessagePreview}
                  </Text>
                  {room.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadCount}>
                        {room.unreadCount > 99 ? '99+' : room.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredRooms.length === 0 && (
          <View style={styles.emptyState}>
            <MessageCircle size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No hay conversaciones</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery 
                ? 'No se encontraron conversaciones con ese nombre'
                : 'Inicia una conversación desde el directorio'
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  chatList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  chatItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1e40af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  participantName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
  },
  messagePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    flex: 1,
  },
  unreadMessage: {
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  unreadBadge: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  unreadCount: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});