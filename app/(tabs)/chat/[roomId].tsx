import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  Alert,
  Platform,
  KeyboardAvoidingView,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useChat, ChatMessage } from '@/contexts/ChatContext';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { 
  ArrowLeft, 
  Send, 
  Paperclip, 
  Camera, 
  Image as ImageIcon, 
  Mic, 
  MicOff,
  Smile,
  Reply,
  X
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Emoji picker data
const emojiCategories = {
  'Frecuentes': ['😀', '😂', '🥰', '😍', '🤔', '👍', '👎', '❤️', '🔥', '💯'],
  'Personas': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇'],
  'Objetos': ['📱', '💻', '⌚', '📷', '🎵', '🎮', '🚗', '✈️', '🏠', '💡'],
  'Símbolos': ['❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍', '🤎', '💯'],
};

export default function ChatRoom() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { messages, sendMessage, getChatRoom, markMessagesAsRead } = useChat();
  const { user } = useFirebaseAuth();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState('Frecuentes');
  const [isRecording, setIsRecording] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  const chatRoom = getChatRoom(roomId!);
  const roomMessages = messages[roomId!] || [];

  useEffect(() => {
    if (roomId) {
      markMessagesAsRead(roomId);
    }
  }, [roomId, markMessagesAsRead]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [roomMessages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() && !replyingTo) return;

    await sendMessage(
      roomId!,
      messageText.trim(),
      'text',
      undefined,
      undefined,
      undefined,
      replyingTo?.id
    );

    setMessageText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
  };

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos requeridos', 'Necesitamos permisos para acceder a tus fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await sendMessage(
        roomId!,
        'Imagen enviada',
        'image',
        result.assets[0].uri
      );
    }
    setShowAttachmentMenu(false);
  };

  const handleCameraPicker = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos requeridos', 'Necesitamos permisos para acceder a la cámara');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await sendMessage(
        roomId!,
        'Foto tomada',
        'image',
        result.assets[0].uri
      );
    }
    setShowAttachmentMenu(false);
  };

  const handleDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        await sendMessage(
          roomId!,
          'Archivo enviado',
          'file',
          result.assets[0].uri,
          result.assets[0].name
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
    setShowAttachmentMenu(false);
  };

  const handleVoiceRecording = () => {
    if (Platform.OS === 'web') {
      Alert.alert('No disponible', 'La grabación de audio no está disponible en web');
      return;
    }

    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      // In a real app, you would stop the recording and send the audio file
      sendMessage(roomId!, 'Audio enviado', 'audio', undefined, undefined, 30);
    } else {
      // Start recording
      setIsRecording(true);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getOtherParticipant = () => {
    if (!chatRoom || !user) return 'Chat';
    return chatRoom.participantNames.find(
      name => name !== `${user.nombre} ${user.apellidoPaterno}`
    ) || 'Chat';
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isOwnMessage = message.senderId === user?.id;
    const showAvatar = !isOwnMessage && (
      index === 0 || 
      roomMessages[index - 1]?.senderId !== message.senderId
    );

    const replyMessage = message.replyTo 
      ? roomMessages.find(m => m.id === message.replyTo)
      : null;

    return (
      <View key={message.id} style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        {showAvatar && !isOwnMessage && (
          <View style={styles.messageAvatar}>
            <Text style={styles.messageAvatarText}>
              {message.senderName.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </Text>
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
          !showAvatar && !isOwnMessage && styles.messageWithoutAvatar
        ]}>
          {replyMessage && (
            <View style={styles.replyContainer}>
              <View style={styles.replyBar} />
              <View style={styles.replyContent}>
                <Text style={styles.replyAuthor}>{replyMessage.senderName}</Text>
                <Text style={styles.replyText} numberOfLines={1}>
                  {replyMessage.messageType === 'text' 
                    ? replyMessage.message 
                    : `${replyMessage.messageType === 'image' ? '📷' : '📎'} ${replyMessage.messageType}`
                  }
                </Text>
              </View>
            </View>
          )}

          {message.messageType === 'image' && message.fileUrl && (
            <Image source={{ uri: message.fileUrl }} style={styles.messageImage} />
          )}
          
          {message.messageType === 'audio' && (
            <View style={styles.audioMessage}>
              <TouchableOpacity style={styles.playButton}>
                <Text style={styles.playButtonText}>▶️</Text>
              </TouchableOpacity>
              <Text style={styles.audioDuration}>
                {message.audioDuration ? `${message.audioDuration}s` : '0:30'}
              </Text>
            </View>
          )}
          
          {message.messageType === 'file' && (
            <View style={styles.fileMessage}>
              <Text style={styles.fileIcon}>📎</Text>
              <Text style={styles.fileName}>{message.fileName || 'Archivo'}</Text>
            </View>
          )}
          
          {(message.messageType === 'text' || message.messageType === 'emoji') && (
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {message.message}
            </Text>
          )}
          
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
            ]}>
              {formatTime(message.timestamp)}
            </Text>
            {isOwnMessage && (
              <Text style={styles.messageStatus}>
                {message.isRead ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.replyButton}
          onPress={() => setReplyingTo(message)}
        >
          <Reply size={16} color="#6b7280" />
        </TouchableOpacity>
      </View>
    );
  };

  if (!chatRoom) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Chat no encontrado</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>
                {getOtherParticipant().split(' ').map(n => n[0]).join('').substring(0, 2)}
              </Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerName}>{getOtherParticipant()}</Text>
              <Text style={styles.headerStatus}>En línea</Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {roomMessages.map((message, index) => renderMessage(message, index))}
        </ScrollView>

        {/* Reply Preview */}
        {replyingTo && (
          <View style={styles.replyPreview}>
            <View style={styles.replyPreviewContent}>
              <Text style={styles.replyPreviewAuthor}>Respondiendo a {replyingTo.senderName}</Text>
              <Text style={styles.replyPreviewText} numberOfLines={1}>
                {replyingTo.message}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <X size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        )}

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <View style={styles.emojiPicker}>
            <View style={styles.emojiCategories}>
              {Object.keys(emojiCategories).map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.emojiCategory,
                    selectedEmojiCategory === category && styles.emojiCategoryActive
                  ]}
                  onPress={() => setSelectedEmojiCategory(category)}
                >
                  <Text style={[
                    styles.emojiCategoryText,
                    selectedEmojiCategory === category && styles.emojiCategoryTextActive
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <ScrollView style={styles.emojiGrid} showsVerticalScrollIndicator={false}>
              <View style={styles.emojiRow}>
                {emojiCategories[selectedEmojiCategory as keyof typeof emojiCategories].map((emoji, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.emojiButton}
                    onPress={() => {
                      setMessageText(prev => prev + emoji);
                    }}
                  >
                    <Text style={styles.emoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Attachment Menu */}
        {showAttachmentMenu && (
          <View style={styles.attachmentMenu}>
            <TouchableOpacity style={styles.attachmentOption} onPress={handleCameraPicker}>
              <Camera size={24} color="#1e40af" />
              <Text style={styles.attachmentOptionText}>Cámara</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachmentOption} onPress={handleImagePicker}>
              <ImageIcon size={24} color="#10b981" />
              <Text style={styles.attachmentOptionText}>Galería</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachmentOption} onPress={handleDocumentPicker}>
              <Paperclip size={24} color="#f59e0b" />
              <Text style={styles.attachmentOptionText}>Archivo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachmentButton}
            onPress={() => setShowAttachmentMenu(!showAttachmentMenu)}
          >
            <Paperclip size={24} color="#6b7280" />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#9ca3af"
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={styles.emojiButton}
            onPress={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile size={24} color="#6b7280" />
          </TouchableOpacity>

          {messageText.trim() ? (
            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
              <Send size={20} color="#ffffff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.voiceButton, isRecording && styles.voiceButtonRecording]}
              onPress={handleVoiceRecording}
            >
              {isRecording ? (
                <MicOff size={20} color="#ffffff" />
              ) : (
                <Mic size={20} color="#ffffff" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 16,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e40af',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerAvatarText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  headerStatus: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#10b981',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6b7280',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  messageAvatarText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    borderRadius: 16,
    padding: 12,
  },
  ownMessageBubble: {
    backgroundColor: '#1e40af',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageWithoutAvatar: {
    marginLeft: 40,
  },
  replyContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  replyBar: {
    width: 3,
    backgroundColor: '#6b7280',
    borderRadius: 2,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyAuthor: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6b7280',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 4,
  },
  audioMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  playButtonText: {
    fontSize: 12,
  },
  audioDuration: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#ffffff',
  },
  fileMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  fileIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  fileName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
  },
  ownMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#111827',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#9ca3af',
  },
  messageStatus: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
  replyButton: {
    padding: 8,
    marginLeft: 8,
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  replyPreviewContent: {
    flex: 1,
  },
  replyPreviewAuthor: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#1e40af',
    marginBottom: 2,
  },
  replyPreviewText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  emojiPicker: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    height: 250,
  },
  emojiCategories: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  emojiCategory: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emojiCategoryActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#1e40af',
  },
  emojiCategoryText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
  },
  emojiCategoryTextActive: {
    color: '#1e40af',
  },
  emojiGrid: {
    flex: 1,
    padding: 16,
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emojiButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  emoji: {
    fontSize: 24,
  },
  attachmentMenu: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    justifyContent: 'space-around',
  },
  attachmentOption: {
    alignItems: 'center',
    padding: 12,
  },
  attachmentOptionText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  attachmentButton: {
    padding: 8,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    maxHeight: 100,
    marginRight: 8,
  },
  emojiButton: {
    padding: 8,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e40af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButtonRecording: {
    backgroundColor: '#ef4444',
  },
});