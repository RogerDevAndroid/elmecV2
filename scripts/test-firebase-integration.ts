/**
 * Script para probar la integración de Firebase
 * Este script verifica que todos los servicios de Firebase estén funcionando correctamente
 */

import FirebaseService from '../services/firebaseService';
import { User } from '../types/firebase';

// Datos de prueba
const testUser = {
  email: 'test@elmec.com',
  empresa: 'ELMEC',
  nombre: 'Usuario',
  apellidoPaterno: 'Prueba',
  apellidoMaterno: 'Test',
  correoElectronico: 'test@elmec.com',
  celular: '+52 123 456 7890',
  ciudad: 'México',
  estado: 'CDMX',
  rol: 'customer' as const,
  categoria: 'Soporte',
  zona: 'Centro',
  activo: true,
  fcmTokens: [],
  isOnline: false,
  lastSeen: new Date().toISOString()
};

const testRequest = {
  titulo: 'Solicitud de prueba',
  descripcion: 'Esta es una solicitud de prueba para verificar Firebase',
  mensaje: 'Mensaje inicial de la solicitud',
  tipo: 1,
  categoria: 'Soporte técnico',
  prioridad: 'media' as const,
  estatus: 'nuevo' as const,
  usuarioId: '',
  metadata: {
    source: 'mobile' as const,
    urgencia: false,
    cliente_vip: false
  },
  archivos: []
};

export class FirebaseIntegrationTest {
  
  static async testAuthentication(): Promise<boolean> {
    try {
      console.log('🔐 Probando autenticación...');
      
      // Registrar usuario de prueba
      const registeredUser = await FirebaseService.registerUser(testUser);
      
      if (!registeredUser) {
        console.error('❌ Error en registro');
        return false;
      }
      
      console.log('✅ Registro exitoso');
      
      // Iniciar sesión
      const loggedInUser = await FirebaseService.loginUser(
        testUser.correoElectronico,
        testUser.correoElectronico // Using email as password
      );
      
      if (!loggedInUser) {
        console.error('❌ Error en login');
        return false;
      }
      
      console.log('✅ Login exitoso');
      
      // Cerrar sesión
      await FirebaseService.logoutUser();
      console.log('✅ Logout exitoso');
      
      return true;
    } catch (error) {
      console.error('❌ Error en prueba de autenticación:', error);
      return false;
    }
  }
  
  static async testUserManagement(): Promise<boolean> {
    try {
      console.log('👤 Probando gestión de usuarios...');
      
      // Iniciar sesión primero
      const loggedInUser = await FirebaseService.loginUser(
        testUser.correoElectronico,
        testUser.correoElectronico
      );
      
      if (!loggedInUser) {
        console.error('❌ No se pudo iniciar sesión');
        return false;
      }
      
      // Obtener información del usuario
      const userInfo = await FirebaseService.getUserInfo(loggedInUser.id);
      if (!userInfo) {
        console.error('❌ No se pudo obtener la información del usuario');
        return false;
      }
      
      console.log('✅ Información de usuario obtenida');
      
      // Actualizar usuario
      await FirebaseService.updateUser(loggedInUser.id, {
        celular: '+52 987 654 3210'
      });
      
      console.log('✅ Usuario actualizado');
      
      return true;
    } catch (error) {
      console.error('❌ Error en prueba de gestión de usuarios:', error);
      return false;
    }
  }
  
  static async testRequestManagement(): Promise<boolean> {
    try {
      console.log('📋 Probando gestión de solicitudes...');
      
      // Primero necesitamos un usuario autenticado
      const loggedInUser = await FirebaseService.loginUser(
        testUser.correoElectronico,
        testUser.correoElectronico
      );
      
      if (!loggedInUser) {
        console.error('❌ No se pudo autenticar para crear solicitud');
        return false;
      }
      
      // Actualizar el testRequest con el userId
      const requestWithUser = {
        ...testRequest,
        usuarioId: loggedInUser.id
      };
      
      // Crear solicitud
      const createdRequest = await FirebaseService.createRequest(requestWithUser);
      
      if (!createdRequest) {
        console.error('❌ Error creando solicitud');
        return false;
      }
      
      console.log('✅ Solicitud creada');
      
      // Actualizar estado de solicitud
      await FirebaseService.updateRequestStatus(
        createdRequest.id,
        'en_proceso',
        loggedInUser.id,
        'Solicitud en revisión'
      );
      
      console.log('✅ Estado de solicitud actualizado');
      
      return true;
    } catch (error) {
      console.error('❌ Error en prueba de gestión de solicitudes:', error);
      return false;
    }
  }
  
  static async testNotifications(): Promise<boolean> {
    try {
      console.log('🔔 Probando notificaciones...');
      
      // Primero necesitamos un usuario autenticado
      const loggedInUser = await FirebaseService.loginUser(
        testUser.correoElectronico,
        testUser.correoElectronico
      );
      
      if (!loggedInUser) {
        console.error('❌ No se pudo autenticar para crear notificación');
        return false;
      }
      
      // Crear notificación
       await FirebaseService.createNotification({
         userId: loggedInUser.id,
         title: 'Notificación de prueba',
         body: 'Esta es una notificación de prueba',
         type: 'system',
         priority: 'medium',
         channels: ['push'],
         data: { requestId: 'test-request-id' }
       });
      
      console.log('✅ Notificación creada');
      
      return true;
    } catch (error) {
      console.error('❌ Error en prueba de notificaciones:', error);
      return false;
    }
  }
  
  static async runAllTests(): Promise<void> {
    console.log('🚀 Iniciando pruebas de integración de Firebase...');
    console.log('=' .repeat(50));
    
    const tests = [
      { name: 'Autenticación', test: this.testAuthentication },
      { name: 'Gestión de usuarios', test: this.testUserManagement },
      { name: 'Gestión de solicitudes', test: this.testRequestManagement },
      { name: 'Notificaciones', test: this.testNotifications }
    ];
    
    let passedTests = 0;
    
    for (const { name, test } of tests) {
      console.log(`\n📝 Ejecutando prueba: ${name}`);
      const result = await test();
      
      if (result) {
        passedTests++;
        console.log(`✅ ${name}: PASÓ`);
      } else {
        console.log(`❌ ${name}: FALLÓ`);
      }
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log(`📊 Resultados: ${passedTests}/${tests.length} pruebas pasaron`);
    
    if (passedTests === tests.length) {
      console.log('🎉 ¡Todas las pruebas pasaron! Firebase está correctamente integrado.');
    } else {
      console.log('⚠️  Algunas pruebas fallaron. Revisa la configuración de Firebase.');
    }
  }
}

// Ejecutar pruebas si el script se ejecuta directamente
if (require.main === module) {
  FirebaseIntegrationTest.runAllTests().catch(console.error);
}

export default FirebaseIntegrationTest;