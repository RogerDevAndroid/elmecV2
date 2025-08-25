import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Share } from 'react-native';

// Tipos para las calculadoras
type CalculatorType = 'menu' | 'barrenado' | 'fresado';

interface CalculatorState {
  // Variables de entrada
  d: string;    // Diámetro de la herramienta (mm)
  z: string;    // Número de dientes/filos
  n: string;    // Velocidad de rotación (rpm)
  vc: string;   // Velocidad de corte (m/min)
  fz: string;   // Avance por diente (mm/diente)
  fn: string;   // Avance por revolución (mm/rev)
  vf: string;   // Velocidad de avance (mm/min)
  tc: string;   // Tiempo de corte (min)
  q: string;    // Caudal de viruta (cm³/min)
  ap: string;   // Profundidad axial (mm) - solo fresado
  ae: string;   // Profundidad radial (mm) - solo fresado
  np: string;   // Número de pasadas - solo fresado
  lm: string;   // Longitud mecanizada (mm)
  pb: string;   // Profundidad de barrenado (mm)
  nb: string;   // Número de barrenos
  
  // Estado de la interfaz
  selectedField: string;
  showLoading: boolean;
  loadingMessage: string;
}

export default function Calculator() {
  const [currentView, setCurrentView] = useState<CalculatorType>('menu');
  const [state, setState] = useState<CalculatorState>({
    d: '0', z: '0', n: '0', vc: '0', fz: '0', fn: '0', vf: '0',
    tc: '0', q: '0', ap: '0', ae: '0', np: '0', lm: '0', pb: '0', nb: '0',
    selectedField: 'd',
    showLoading: false,
    loadingMessage: ''
  });

  // Función para validar y formatear números
  const validarNumero = (numero: number, decimales: number = 3): string => {
    if (numero === 0 || isNaN(numero) || !isFinite(numero)) {
      return '0';
    }
    return numero.toFixed(decimales);
  };

  // Función para cargar datos desde AsyncStorage
  const loadData = async (type: 'barrenado' | 'fresado') => {
    try {
      const keys = ['d', 'z', 'n', 'vc', 'fz', 'fn', 'vf', 'tc', 'q', 'pb', 'nb'];
      if (type === 'fresado') {
        keys.push('ap', 'ae', 'np', 'lm');
      }
      
      const values: { [key: string]: string } = {};
      for (const key of keys) {
        const value = await AsyncStorage.getItem(`${type}-${key}`);
        values[key] = value || '0';
      }
      
      setState(prev => ({ ...prev, ...values }));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Función para guardar datos en AsyncStorage
  const saveData = async (key: string, value: string, type: 'barrenado' | 'fresado') => {
    try {
      await AsyncStorage.setItem(`${type}-${key}`, value);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  // Funciones de cálculo para Barrenado
  const calcBarrenadoN = (d: number, vc: number): number => {
    if (d === 0) return 0;
    return (vc * 1000) / (Math.PI * d);
  };

  const calcBarrenadoVc = (d: number, n: number): number => {
    return (Math.PI * d * n) / 1000;
  };

  const calcBarrenadoFn = (fz: number, z: number): number => {
    return fz * z;
  };

  const calcBarrenadoVf = (fn: number, n: number): number => {
    return fn * n;
  };

  const calcBarrenadoTc = (pb: number, vf: number, nb: number): number => {
    if (vf === 0) return 0;
    return (pb * nb) / vf;
  };

  const calcBarrenadoQ = (d: number, pb: number, nb: number, tc: number): number => {
    if (tc === 0) return 0;
    const area = Math.PI * Math.pow(d / 2, 2);
    return (area * pb * nb) / (tc * 1000); // cm³/min
  };

  // Funciones de cálculo para Fresado
  const calcFresadoN = (d: number, vc: number): number => {
    if (d === 0) return 0;
    return (vc * 1000) / (Math.PI * d);
  };

  const calcFresadoVc = (d: number, n: number): number => {
    return (Math.PI * d * n) / 1000;
  };

  const calcFresadoFn = (fz: number, z: number): number => {
    return fz * z;
  };

  const calcFresadoVf = (fn: number, n: number): number => {
    return fn * n;
  };

  const calcFresadoTc = (lm: number, vf: number, np: number): number => {
    if (vf === 0) return 0;
    return (lm * np) / vf;
  };

  const calcFresadoQ = (ae: number, ap: number, vf: number): number => {
    return (ae * ap * vf) / 1000; // cm³/min
  };

  // Función para manejar entrada de números
  const handleNumberInput = (input: string, type: 'barrenado' | 'fresado') => {
    const currentValue = state[state.selectedField as keyof CalculatorState] as string;
    let newValue = currentValue;

    if (input === 'C') {
      newValue = '0';
    } else if (input === '.') {
      if (!currentValue.includes('.')) {
        newValue = currentValue + '.';
      }
    } else if (input === 'DEL') {
      newValue = currentValue.length > 1 ? currentValue.slice(0, -1) : '0';
    } else {
      newValue = currentValue === '0' ? input : currentValue + input;
    }

    setState(prev => ({ ...prev, [state.selectedField]: newValue }));
    saveData(state.selectedField, newValue, type);
    
    // Recalcular valores dependientes
    recalculate(state.selectedField, parseFloat(newValue), type);
  };

  // Función para recalcular valores automáticamente
  const recalculate = (changedField: string, value: number, type: 'barrenado' | 'fresado') => {
    const d = parseFloat(state.d);
    const z = parseFloat(state.z);
    const n = parseFloat(state.n);
    const vc = parseFloat(state.vc);
    const fz = parseFloat(state.fz);
    const fn = parseFloat(state.fn);
    const vf = parseFloat(state.vf);
    const pb = parseFloat(state.pb);
    const nb = parseFloat(state.nb);
    const lm = parseFloat(state.lm);
    const ap = parseFloat(state.ap);
    const ae = parseFloat(state.ae);
    const np = parseFloat(state.np);

    let updates: Partial<CalculatorState> = {};

    if (type === 'barrenado') {
      switch (changedField) {
        case 'd':
        case 'vc':
          if (d > 0 && vc > 0) {
            const newN = calcBarrenadoN(d, vc);
            updates.n = validarNumero(newN, 0);
            const newVf = calcBarrenadoVf(fn, newN);
            updates.vf = validarNumero(newVf, 2);
          }
          break;
        case 'n':
          if (d > 0 && n > 0) {
            const newVc = calcBarrenadoVc(d, n);
            updates.vc = validarNumero(newVc, 2);
            const newVf = calcBarrenadoVf(fn, n);
            updates.vf = validarNumero(newVf, 2);
          }
          break;
        case 'fz':
        case 'z':
          if (fz > 0 && z > 0) {
            const newFn = calcBarrenadoFn(fz, z);
            updates.fn = validarNumero(newFn, 3);
            const newVf = calcBarrenadoVf(newFn, n);
            updates.vf = validarNumero(newVf, 2);
          }
          break;
        case 'fn':
          if (fn > 0 && n > 0) {
            const newVf = calcBarrenadoVf(fn, n);
            updates.vf = validarNumero(newVf, 2);
          }
          break;
      }
      
      // Calcular tiempo y caudal
      const finalVf = parseFloat(updates.vf || state.vf);
      if (pb > 0 && nb > 0 && finalVf > 0) {
        const newTc = calcBarrenadoTc(pb, finalVf, nb);
        updates.tc = validarNumero(newTc, 2);
        
        if (d > 0) {
          const newQ = calcBarrenadoQ(d, pb, nb, newTc);
          updates.q = validarNumero(newQ, 2);
        }
      }
    } else if (type === 'fresado') {
      switch (changedField) {
        case 'd':
        case 'vc':
          if (d > 0 && vc > 0) {
            const newN = calcFresadoN(d, vc);
            updates.n = validarNumero(newN, 0);
            const newVf = calcFresadoVf(fn, newN);
            updates.vf = validarNumero(newVf, 2);
          }
          break;
        case 'n':
          if (d > 0 && n > 0) {
            const newVc = calcFresadoVc(d, n);
            updates.vc = validarNumero(newVc, 2);
            const newVf = calcFresadoVf(fn, n);
            updates.vf = validarNumero(newVf, 2);
          }
          break;
        case 'fz':
        case 'z':
          if (fz > 0 && z > 0) {
            const newFn = calcFresadoFn(fz, z);
            updates.fn = validarNumero(newFn, 3);
            const newVf = calcFresadoVf(newFn, n);
            updates.vf = validarNumero(newVf, 2);
          }
          break;
        case 'fn':
          if (fn > 0 && n > 0) {
            const newVf = calcFresadoVf(fn, n);
            updates.vf = validarNumero(newVf, 2);
          }
          break;
      }
      
      // Calcular tiempo y caudal para fresado
      const finalVf = parseFloat(updates.vf || state.vf);
      if (lm > 0 && np > 0 && finalVf > 0) {
        const newTc = calcFresadoTc(lm, finalVf, np);
        updates.tc = validarNumero(newTc, 2);
      }
      
      if (ae > 0 && ap > 0 && finalVf > 0) {
        const newQ = calcFresadoQ(ae, ap, finalVf);
        updates.q = validarNumero(newQ, 2);
      }
    }

    // Aplicar actualizaciones y guardar en AsyncStorage
    setState(prev => ({ ...prev, ...updates }));
    Object.entries(updates).forEach(([key, value]) => {
      if (typeof value === 'string') {
        saveData(key, value, type);
      }
    });
  };

  // Función para compartir resultados
  const shareResults = async (type: 'barrenado' | 'fresado') => {
    const title = type === 'barrenado' ? 'Resultados de Barrenado' : 'Resultados de Fresado';
    const results = `${title}\n\n` +
      `Diámetro (d): ${state.d} mm\n` +
      `Dientes (z): ${state.z}\n` +
      `Velocidad rotación (n): ${state.n} rpm\n` +
      `Velocidad corte (Vc): ${state.vc} m/min\n` +
      `Avance por diente (fz): ${state.fz} mm/diente\n` +
      `Avance por revolución (fn): ${state.fn} mm/rev\n` +
      `Velocidad avance (Vf): ${state.vf} mm/min\n` +
      `Tiempo corte (Tc): ${state.tc} min\n` +
      `Caudal viruta (Q): ${state.q} cm³/min`;

    try {
      await Share.share({
        message: results,
        title: title
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo compartir los resultados');
    }
  };

  // Renderizar menú principal
  const renderMainMenu = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calculadora de Mecanizado</Text>
        <Text style={styles.subtitle}>Herramientas profesionales de cálculo</Text>
      </View>

      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => {
            setCurrentView('barrenado');
            loadData('barrenado');
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#3b82f6', '#1d4ed8']}
            style={styles.menuGradient}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>⚡</Text>
            </View>
            <Text style={styles.menuTitle}>Barrenado</Text>
            <Text style={styles.menuDescription}>
              Cálculos para operaciones de taladrado y barrenado
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => {
            setCurrentView('fresado');
            loadData('fresado');
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.menuGradient}
          >
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>🔧</Text>
            </View>
            <Text style={styles.menuTitle}>Fresado</Text>
            <Text style={styles.menuDescription}>
              Cálculos para operaciones de fresado y mecanizado
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Características</Text>
          <Text style={styles.infoText}>• Cálculos automáticos en tiempo real</Text>
          <Text style={styles.infoText}>• Persistencia de datos</Text>
          <Text style={styles.infoText}>• Exportación de resultados</Text>
          <Text style={styles.infoText}>• Interfaz intuitiva y profesional</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  // Renderizar teclado numérico
  const renderNumericKeypad = (type: 'barrenado' | 'fresado') => (
    <View style={styles.keypadContainer}>
      <View style={styles.keypadRow}>
        {['7', '8', '9'].map(num => (
          <TouchableOpacity
            key={num}
            style={styles.keypadButton}
            onPress={() => handleNumberInput(num, type)}
            activeOpacity={0.7}
          >
            <Text style={styles.keypadButtonText}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.keypadRow}>
        {['4', '5', '6'].map(num => (
          <TouchableOpacity
            key={num}
            style={styles.keypadButton}
            onPress={() => handleNumberInput(num, type)}
            activeOpacity={0.7}
          >
            <Text style={styles.keypadButtonText}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.keypadRow}>
        {['1', '2', '3'].map(num => (
          <TouchableOpacity
            key={num}
            style={styles.keypadButton}
            onPress={() => handleNumberInput(num, type)}
            activeOpacity={0.7}
          >
            <Text style={styles.keypadButtonText}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.keypadRow}>
        <TouchableOpacity
          style={[styles.keypadButton, styles.specialButton]}
          onPress={() => handleNumberInput('.', type)}
          activeOpacity={0.7}
        >
          <Text style={styles.keypadButtonText}>.</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.keypadButton}
          onPress={() => handleNumberInput('0', type)}
          activeOpacity={0.7}
        >
          <Text style={styles.keypadButtonText}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.keypadButton, styles.deleteButton]}
          onPress={() => handleNumberInput('DEL', type)}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteButtonText}>⌫</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.keypadRow}>
        <TouchableOpacity
          style={[styles.keypadButton, styles.clearButton]}
          onPress={() => handleNumberInput('C', type)}
          activeOpacity={0.7}
        >
          <Text style={styles.clearButtonText}>C</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.keypadButton, styles.shareButton]}
          onPress={() => shareResults(type)}
          activeOpacity={0.7}
        >
          <Text style={styles.shareButtonText}>📤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Renderizar campo de entrada
  const renderInputField = (key: string, label: string, unit: string, type: 'barrenado' | 'fresado') => {
    const isSelected = state.selectedField === key;
    const value = state[key as keyof CalculatorState] as string;
    
    return (
      <TouchableOpacity
        key={key}
        style={[styles.inputField, isSelected && styles.selectedInputField]}
        onPress={() => setState(prev => ({ ...prev, selectedField: key }))}
        activeOpacity={0.8}
      >
        <View style={styles.inputFieldHeader}>
          <Text style={styles.inputFieldLabel}>{label}</Text>
          <Text style={styles.inputFieldUnit}>{unit}</Text>
        </View>
        <Text style={[styles.inputFieldValue, isSelected && styles.selectedInputFieldValue]}>
          {value}
        </Text>
      </TouchableOpacity>
    );
  };

  // Renderizar calculadora de barrenado
  const renderBarrenadoCalculator = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.calculatorHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentView('menu')}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.calculatorTitle}>Calculadora de Barrenado</Text>
      </View>

      <ScrollView style={styles.calculatorContent} showsVerticalScrollIndicator={false}>
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Parámetros de Entrada</Text>
          <View style={styles.inputGrid}>
            {renderInputField('d', 'Diámetro', 'mm', 'barrenado')}
            {renderInputField('z', 'Dientes', '', 'barrenado')}
            {renderInputField('vc', 'Vel. Corte', 'm/min', 'barrenado')}
            {renderInputField('fz', 'Avance/Diente', 'mm/diente', 'barrenado')}
            {renderInputField('pb', 'Prof. Barrenado', 'mm', 'barrenado')}
            {renderInputField('nb', 'Núm. Barrenos', '', 'barrenado')}
          </View>
        </View>

        <View style={styles.resultSection}>
          <Text style={styles.sectionTitle}>Resultados Calculados</Text>
          <View style={styles.resultGrid}>
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Velocidad Rotación</Text>
              <Text style={styles.resultValue}>{state.n} rpm</Text>
            </View>
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Avance/Revolución</Text>
              <Text style={styles.resultValue}>{state.fn} mm/rev</Text>
            </View>
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Velocidad Avance</Text>
              <Text style={styles.resultValue}>{state.vf} mm/min</Text>
            </View>
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Tiempo Corte</Text>
              <Text style={styles.resultValue}>{state.tc} min</Text>
            </View>
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Caudal Viruta</Text>
              <Text style={styles.resultValue}>{state.q} cm³/min</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {renderNumericKeypad('barrenado')}
    </SafeAreaView>
  );

  // Renderizar calculadora de fresado
  const renderFresadoCalculator = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.calculatorHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentView('menu')}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.calculatorTitle}>Calculadora de Fresado</Text>
      </View>

      <ScrollView style={styles.calculatorContent} showsVerticalScrollIndicator={false}>
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>Parámetros de Entrada</Text>
          <View style={styles.inputGrid}>
            {renderInputField('d', 'Diámetro', 'mm', 'fresado')}
            {renderInputField('z', 'Dientes', '', 'fresado')}
            {renderInputField('vc', 'Vel. Corte', 'm/min', 'fresado')}
            {renderInputField('fz', 'Avance/Diente', 'mm/diente', 'fresado')}
            {renderInputField('ap', 'Prof. Axial', 'mm', 'fresado')}
            {renderInputField('ae', 'Prof. Radial', 'mm', 'fresado')}
            {renderInputField('lm', 'Long. Mecanizada', 'mm', 'fresado')}
            {renderInputField('np', 'Núm. Pasadas', '', 'fresado')}
          </View>
        </View>

        <View style={styles.resultSection}>
          <Text style={styles.sectionTitle}>Resultados Calculados</Text>
          <View style={styles.resultGrid}>
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Velocidad Rotación</Text>
              <Text style={styles.resultValue}>{state.n} rpm</Text>
            </View>
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Avance/Revolución</Text>
              <Text style={styles.resultValue}>{state.fn} mm/rev</Text>
            </View>
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Velocidad Avance</Text>
              <Text style={styles.resultValue}>{state.vf} mm/min</Text>
            </View>
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Tiempo Corte</Text>
              <Text style={styles.resultValue}>{state.tc} min</Text>
            </View>
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Caudal Viruta</Text>
              <Text style={styles.resultValue}>{state.q} cm³/min</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {renderNumericKeypad('fresado')}
    </SafeAreaView>
  );

  // Renderizar vista actual
  switch (currentView) {
    case 'barrenado':
      return renderBarrenadoCalculator();
    case 'fresado':
      return renderFresadoCalculator();
    default:
      return renderMainMenu();
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  menuCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  menuGradient: {
    padding: 24,
    alignItems: 'center',
  },
  menuIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  menuIconText: {
    fontSize: 24,
  },
  menuTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  menuDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 6,
    lineHeight: 20,
  },
  calculatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#3b82f6',
  },
  calculatorTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    flex: 1,
  },
  calculatorContent: {
    flex: 1,
    padding: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 16,
  },
  inputGrid: {
    gap: 12,
  },
  inputField: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedInputField: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  inputFieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputFieldLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
  },
  inputFieldUnit: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
  inputFieldValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  selectedInputFieldValue: {
    color: '#3b82f6',
  },
  resultSection: {
    marginBottom: 24,
  },
  resultGrid: {
    gap: 12,
  },
  resultCard: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  resultLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  keypadContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 12,
  },
  keypadButton: {
    flex: 1,
    height: 56,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  keypadButtonText: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  specialButton: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    fontSize: 18,
    color: '#ef4444',
  },
  clearButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
    flex: 1,
  },
  clearButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#ef4444',
  },
  shareButton: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
    flex: 1,
  },
  shareButtonText: {
    fontSize: 18,
  },
});