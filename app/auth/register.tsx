import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useFirebaseAuth } from '@/contexts/FirebaseAuthContext';
import { ArrowLeft, Building, User, Mail, Phone, MapPin } from 'lucide-react-native';

export default function Register() {
  const [formData, setFormData] = useState({
    empresa: '',
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    correoElectronico: '',
    celular: '',
    ciudad: '',
    estado: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useFirebaseAuth();
  const router = useRouter();

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    const requiredFields = Object.keys(formData);
    const emptyFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (emptyFields.length > 0) {
      Alert.alert('Error', 'Por favor, completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const success = await register(formData);
      if (success) {
        Alert.alert('Éxito', 'Registro exitoso', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') }
        ]);
      } else {
        Alert.alert('Error', 'Error al registrar usuario');
      }
    } catch (error) {
      Alert.alert('Error', 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#1e40af', '#3b82f6']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>Únete a la plataforma ELMEC</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Building size={20} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Empresa"
              placeholderTextColor="#9ca3af"
              value={formData.empresa}
              onChangeText={(value) => updateField('empresa', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <User size={20} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              placeholderTextColor="#9ca3af"
              value={formData.nombre}
              onChangeText={(value) => updateField('nombre', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <User size={20} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Apellido Paterno"
              placeholderTextColor="#9ca3af"
              value={formData.apellidoPaterno}
              onChangeText={(value) => updateField('apellidoPaterno', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <User size={20} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Apellido Materno"
              placeholderTextColor="#9ca3af"
              value={formData.apellidoMaterno}
              onChangeText={(value) => updateField('apellidoMaterno', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Mail size={20} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Correo Electrónico"
              placeholderTextColor="#9ca3af"
              value={formData.correoElectronico}
              onChangeText={(value) => updateField('correoElectronico', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Phone size={20} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Celular"
              placeholderTextColor="#9ca3af"
              value={formData.celular}
              onChangeText={(value) => updateField('celular', value)}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <MapPin size={20} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Ciudad"
              placeholderTextColor="#9ca3af"
              value={formData.ciudad}
              onChangeText={(value) => updateField('ciudad', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <MapPin size={20} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Estado"
              placeholderTextColor="#9ca3af"
              value={formData.estado}
              onChangeText={(value) => updateField('estado', value)}
            />
          </View>

          <View style={styles.inputContainer}>
            <User size={20} color="#6b7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#9ca3af"
              value={formData.password}
              onChangeText={(value) => updateField('password', value)}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.registerButtonText}>
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginLink}>
              ¿Ya tienes cuenta? <Text style={styles.loginLinkBold}>Inicia Sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    marginTop: 40,
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  form: {
    gap: 20,
    paddingBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  registerButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 16,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e40af',
  },
  loginLink: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 16,
  },
  loginLinkBold: {
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});