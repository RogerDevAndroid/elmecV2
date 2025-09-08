import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import {
  ref,
  set,
  push,
  onValue,
  off,
  serverTimestamp as rtServerTimestamp,
  onDisconnect
} from 'firebase/database';
import { auth, db, realtimeDb } from '../config/firebase';
import { User, Request, ChatRoom, Message, Notification, UserPresence } from '../types/firebase';

export class FirebaseService {
  // Authentication Services
  static async registerUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.correoElectronico,
        userData.correoElectronico // Using email as password temporarily
      );

      const user: User = {
        id: userCredential.user.uid,
        ...userData,
        fcmTokens: [],
        isOnline: true,
        lastSeen: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', user.id), user);
      await this.setUserPresence(user.id, true);

      return user;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  static async loginUser(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      const user = userDoc.data() as User;
      
      // Update last login and online status
      await updateDoc(doc(db, 'users', user.id), {
        lastLogin: new Date().toISOString(),
        isOnline: true,
        updatedAt: new Date().toISOString()
      });

      await this.setUserPresence(user.id, true);

      return user;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  static async logoutUser(): Promise<void> {
    try {
      if (auth.currentUser) {
        await this.setUserPresence(auth.currentUser.uid, false);
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          isOnline: false,
          lastSeen: new Date().toISOString()
        });
      }
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  // User Services
  static async getUserInfo(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists() ? (userDoc.data() as User) : null;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }

  static async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async getDirectoryUsers(role?: string): Promise<User[]> {
    try {
      let q = query(collection(db, 'users'), where('activo', '==', true));
      
      if (role) {
        q = query(q, where('rol', '==', role));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
      console.error('Error getting directory users:', error);
      return [];
    }
  }

  // Request Services
  static async createRequest(requestData: Omit<Request, 'id' | 'createdAt' | 'updatedAt' | 'historialEstatus'>): Promise<Request> {
    try {
      const requestRef = doc(collection(db, 'requests'));
      const request: Request = {
        id: requestRef.id,
        ...requestData,
        historialEstatus: [{
          estatus: requestData.estatus,
          timestamp: new Date().toISOString(),
          userId: requestData.usuarioId
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(requestRef, request);

      // Create notification for agents
      if (requestData.agenteId) {
        await this.createNotification({
          userId: requestData.agenteId,
          title: 'Nueva solicitud asignada',
          body: `Se te ha asignado la solicitud: ${request.titulo}`,
          type: 'assignment',
          priority: 'medium',
          channels: ['push'],
          data: { requestId: request.id }
        });
      }

      return request;
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  }

  static async updateRequestStatus(requestId: string, status: string, userId: string, comentario?: string): Promise<void> {
    try {
      const requestRef = doc(db, 'requests', requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (!requestDoc.exists()) {
        throw new Error('Request not found');
      }

      const request = requestDoc.data() as Request;
      const statusEntry = {
        estatus: status,
        timestamp: new Date().toISOString(),
        userId,
        comentario
      };

      await updateDoc(requestRef, {
        estatus: status,
        updatedAt: new Date().toISOString(),
        historialEstatus: [...request.historialEstatus, statusEntry]
      });

      // Notify the customer about status change
      await this.createNotification({
        userId: request.usuarioId,
        title: 'Actualización de solicitud',
        body: `Tu solicitud "${request.titulo}" ha sido ${status}`,
        type: 'request_update',
        priority: 'medium',
        channels: ['push'],
        data: { requestId }
      });

    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  }

  static async getUserRequests(userId: string, role: string): Promise<Request[]> {
    try {
      const field = role === 'customer' ? 'usuarioId' : 'agenteId';
      const q = query(
        collection(db, 'requests'),
        where(field, '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Request);
    } catch (error) {
      console.error('Error getting user requests:', error);
      return [];
    }
  }

  // Chat Services
  static async createChatRoom(participants: string[], tipo: string, requestId?: string): Promise<ChatRoom> {
    try {
      const chatRef = doc(collection(db, 'chatRooms'));
      const chatRoom: ChatRoom = {
        id: chatRef.id,
        tipo: tipo as any,
        participants,
        requestId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        unreadCounts: participants.reduce((acc, userId) => ({ ...acc, [userId]: 0 }), {}),
        metadata: {
          title: 'Chat de soporte',
          priority: 'medium'
        }
      };

      await setDoc(chatRef, chatRoom);
      return chatRoom;
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw error;
    }
  }

  static async sendMessage(chatRoomId: string, senderId: string, senderName: string, message: string, type: string = 'text'): Promise<Message> {
    try {
      const messageRef = doc(collection(db, 'messages'));
      const messageData: Message = {
        id: messageRef.id,
        chatRoomId,
        senderId,
        senderName,
        message,
        type: type as any,
        timestamp: new Date().toISOString(),
        readBy: { [senderId]: new Date().toISOString() },
        isDeleted: false
      };

      await setDoc(messageRef, messageData);

      // Update chat room with last message
      await updateDoc(doc(db, 'chatRooms', chatRoomId), {
        lastMessage: {
          id: messageData.id,
          message: messageData.message,
          senderId: messageData.senderId,
          timestamp: messageData.timestamp,
          type: messageData.type
        },
        updatedAt: new Date().toISOString()
      });

      // Update unread counts for other participants
      const chatRoom = await getDoc(doc(db, 'chatRooms', chatRoomId));
      if (chatRoom.exists()) {
        const chatData = chatRoom.data() as ChatRoom;
        const batch = writeBatch(db);
        
        chatData.participants.forEach(participantId => {
          if (participantId !== senderId) {
            batch.update(doc(db, 'chatRooms', chatRoomId), {
              [`unreadCounts.${participantId}`]: increment(1)
            });
          }
        });

        await batch.commit();
      }

      return messageData;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  static subscribeToMessages(chatRoomId: string, callback: (messages: Message[]) => void): () => void {
    const q = query(
      collection(db, 'messages'),
      where('chatRoomId', '==', chatRoomId),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => doc.data() as Message);
      callback(messages);
    });
  }

  static async markMessagesAsRead(chatRoomId: string, userId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      const timestamp = new Date().toISOString();

      // Get unread messages
      const q = query(
        collection(db, 'messages'),
        where('chatRoomId', '==', chatRoomId),
        where(`readBy.${userId}`, '==', null)
      );

      const snapshot = await getDocs(q);
      
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          [`readBy.${userId}`]: timestamp
        });
      });

      // Reset unread count
      batch.update(doc(db, 'chatRooms', chatRoomId), {
        [`unreadCounts.${userId}`]: 0
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Notification Services
  static async createNotification(notificationData: Omit<Notification, 'id' | 'createdAt' | 'read' | 'sent'>): Promise<void> {
    try {
      const notificationRef = doc(collection(db, 'notifications'));
      const notification: Notification = {
        id: notificationRef.id,
        ...notificationData,
        channels: ['push'],
        read: false,
        sent: false,
        createdAt: new Date().toISOString(),
      };

      await setDoc(notificationRef, notification);
      
      // Send push notification in real-time
      await this.sendPushNotification(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  static async sendPushNotification(notification: Notification): Promise<void> {
    try {
      // Get user's FCM tokens
      const userDoc = await getDoc(doc(db, 'users', notification.userId));
      if (!userDoc.exists()) return;

      const user = userDoc.data() as User;
      if (!user.fcmTokens || user.fcmTokens.length === 0) return;

      // Send to real-time database for immediate delivery
      const notificationRef = ref(realtimeDb, `notifications/${notification.userId}/${notification.id}`);
      await set(notificationRef, {
        ...notification,
        sent: true,
        sentAt: new Date().toISOString()
      });

      // Update sent status in Firestore
      await updateDoc(doc(db, 'notifications', notification.id), {
        sent: true,
        sentAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  static subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void): () => void {
    const notificationRef = ref(realtimeDb, `notifications/${userId}`);
    
    const unsubscribe = onValue(notificationRef, (snapshot) => {
      if (snapshot.exists()) {
        const notifications = Object.values(snapshot.val()) as Notification[];
        callback(notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } else {
        callback([]);
      }
    });

    return () => off(notificationRef, 'value', unsubscribe);
  }

  // Presence Services
  static async setUserPresence(userId: string, isOnline: boolean): Promise<void> {
    try {
      const presenceRef = ref(realtimeDb, `presence/${userId}`);
      const presence: UserPresence = {
        userId,
        isOnline,
        lastSeen: new Date().toISOString(),
        status: isOnline ? 'available' : 'offline',
        device: 'web'
      };

      await set(presenceRef, presence);

      // Set up disconnect handler
      if (isOnline) {
        onDisconnect(presenceRef).set({
          ...presence,
          isOnline: false,
          status: 'offline',
          lastSeen: rtServerTimestamp()
        });
      }

    } catch (error) {
      console.error('Error setting user presence:', error);
    }
  }

  static subscribeToPresence(callback: (presence: { [userId: string]: UserPresence }) => void): () => void {
    const presenceRef = ref(realtimeDb, 'presence');
    
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      } else {
        callback({});
      }
    });

    return () => off(presenceRef, 'value', unsubscribe);
  }

  // FCM Token Management
  static async updateFCMToken(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const user = userDoc.data() as User;
        const tokens = user.fcmTokens || [];
        
        if (!tokens.includes(token)) {
          await updateDoc(userRef, {
            fcmTokens: [...tokens, token],
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error updating FCM token:', error);
    }
  }

  static async removeFCMToken(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const user = userDoc.data() as User;
        const tokens = (user.fcmTokens || []).filter(t => t !== token);
        
        await updateDoc(userRef, {
          fcmTokens: tokens,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error removing FCM token:', error);
    }
  }

  // Analytics
  static async trackEvent(event: string, properties: any = {}): Promise<void> {
    try {
      const analyticsRef = doc(collection(db, 'analytics'));
      await setDoc(analyticsRef, {
        event,
        userId: auth.currentUser?.uid,
        timestamp: new Date().toISOString(),
        properties,
        sessionId: `session_${Date.now()}`,
        device: {
          platform: 'web',
          version: '1.0.0'
        }
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }
}

export default FirebaseService;