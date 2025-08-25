import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Drill, Settings } from 'lucide-react-native';
import BarrenadoCalculator from '../../components/calculator/BarrenadoCalculator';
import FresadoCalculator from '../../components/calculator/FresadoCalculator';

type CalculatorMode = 'menu' | 'barrenado' | 'fresado';

export default function Calculator() {
  const [mode, setMode] = useState<CalculatorMode>('menu');
  const { width, height } = Dimensions.get('window');

  const renderMainMenu = () => (
    <View style={styles.menuContainer}>
      <Text style={styles.title}>Calculadora de Mecanizado</Text>
      
      <TouchableOpacity 
        style={[styles.menuButton, { backgroundColor: '#54A2D9' }]}
        onPress={() => setMode('barrenado')}
      >
        <Drill size={40} color="white" />
        <Text style={styles.menuButtonText}>Barrenado</Text>
        <Text style={styles.menuButtonSubtext}>Cálculos de perforación</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.menuButton, { backgroundColor: '#264B9B' }]}
        onPress={() => setMode('fresado')}
      >
        <Settings size={40} color="white" />
        <Text style={styles.menuButtonText}>Fresado</Text>
        <Text style={styles.menuButtonSubtext}>Cálculos de fresado</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBarrenado = () => (
    <BarrenadoCalculator onBack={() => setMode('menu')} />
  );

  const renderFresado = () => (
    <FresadoCalculator onBack={() => setMode('menu')} />
  );

  const buttons = [
    ['C', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ];

  const getButtonStyle = (button: string) => {
    if (button === 'C' || button === '±' || button === '%') {
      return [styles.button, styles.functionButton];
    }
    if (['+', '-', '×', '÷', '='].includes(button)) {
      return [styles.button, styles.operatorButton];
    }
    if (button === '0') {
      return [styles.button, styles.zeroButton];
    }
    return styles.button;
  };

  const getButtonTextStyle = (button: string) => {
    if (button === 'C' || button === '±' || button === '%') {
      return [styles.buttonText, styles.functionButtonText];
    }
    if (['+', '-', '×', '÷', '='].includes(button)) {
      return [styles.buttonText, styles.operatorButtonText];
    }
    return styles.buttonText;
  };

  const handleButtonPress = (button: string) => {
    switch (button) {
      case 'C':
        clear();
        break;
      case '±':
        setDisplay(String(parseFloat(display) * -1));
        break;
      case '%':
        setDisplay(String(parseFloat(display) / 100));
        break;
      case '=':
        handleEquals();
        break;
      case '+':
      case '-':
      case '×':
      case '÷':
        performOperation(button);
        break;
      case '.':
        inputDecimal();
        break;
      default:
        inputNumber(button);
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {mode === 'menu' && renderMainMenu()}
      {mode === 'barrenado' && renderBarrenado()}
      {mode === 'fresado' && renderFresado()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  menuContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#264B9B',
    marginBottom: 40,
    textAlign: 'center',
  },
  menuButton: {
    width: '100%',
    maxWidth: 300,
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    marginVertical: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  menuButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  menuButtonSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
    textAlign: 'center',
  },

});