import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BarrenadoCalculatorProps {
  onBack: () => void;
}

export default function BarrenadoCalculator({ onBack }: BarrenadoCalculatorProps) {
  const { width } = Dimensions.get('window');

  // Estados para los valores de entrada
  const [textD, setTextD] = useState('0'); // Diámetro
  const [textZ, setTextZ] = useState('0'); // Número de filos
  const [textN, setTextN] = useState('0'); // Velocidad de giro (RPM)
  const [textVc, setTextVc] = useState('0'); // Velocidad de corte
  const [textfz, setTextfz] = useState('0'); // Avance por filo
  const [textfn, setTextfn] = useState('0'); // Avance por revolución
  const [textvf, setTextvf] = useState('0'); // Velocidad de avance
  const [texttc, setTexttc] = useState('0'); // Tiempo de corte
  const [textQ, setTextQ] = useState('0'); // Volumen de viruta

  // Estados para controlar qué campo está siendo editado
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [lock, setLock] = useState(3); // Control de bloqueo para cálculos

  useEffect(() => {
    loadData();
  }, []);

  // Efectos para cálculos automáticos
  useEffect(() => {
    // Auto-calcular N cuando cambian D o Vc
    const d = parseFloat(textD);
    const vc = parseFloat(textVc);
    if (d > 0 && vc > 0 && textD !== '0' && textVc !== '0') {
      const result = ((vc * 1000) / (Math.PI * d)).toFixed(2);
      if (result !== textN) {
        setTextN(result);
        saveValue('barrenado-n', result);
      }
    }
  }, [textD, textVc]);

  useEffect(() => {
    // Auto-calcular Vc cuando cambian D o N
    const d = parseFloat(textD);
    const n = parseFloat(textN);
    if (d > 0 && n > 0 && textD !== '0' && textN !== '0') {
      const result = ((Math.PI * d * n) / 1000).toFixed(2);
      if (result !== textVc) {
        setTextVc(result);
        saveValue('barrenado-vc', result);
      }
    }
  }, [textD, textN]);

  useEffect(() => {
    // Auto-calcular fz cuando cambian fn o Z
    const fn = parseFloat(textfn);
    const z = parseFloat(textZ);
    if (fn > 0 && z > 0 && textfn !== '0' && textZ !== '0') {
      const result = (fn / z).toFixed(3);
      if (result !== textfz) {
        setTextfz(result);
        saveValue('barrenado-fz', result);
      }
    }
  }, [textfn, textZ]);

  useEffect(() => {
    // Auto-calcular fn cuando cambian fz o Z
    const fz = parseFloat(textfz);
    const z = parseFloat(textZ);
    if (fz > 0 && z > 0 && textfz !== '0' && textZ !== '0') {
      const result = (fz * z).toFixed(3);
      if (result !== textfn) {
        setTextfn(result);
        saveValue('barrenado-fn', result);
      }
    }
  }, [textfz, textZ]);

  useEffect(() => {
    // Auto-calcular vf cuando cambian fn o N
    const fn = parseFloat(textfn);
    const n = parseFloat(textN);
    if (fn > 0 && n > 0 && textfn !== '0' && textN !== '0') {
      const result = (fn * n).toFixed(2);
      if (result !== textvf) {
        setTextvf(result);
        saveValue('barrenado-vf', result);
      }
    }
  }, [textfn, textN]);

  useEffect(() => {
    // Auto-calcular tc cuando cambia vf
    const vf = parseFloat(textvf);
    const l = 10; // Longitud fija para el ejemplo
    if (vf > 0 && textvf !== '0') {
      const result = (l / vf).toFixed(3);
      if (result !== texttc) {
        setTexttc(result);
        saveValue('barrenado-tc', result);
      }
    }
  }, [textvf]);

  useEffect(() => {
    // Auto-calcular Q cuando cambian D o vf
    const d = parseFloat(textD);
    const vf = parseFloat(textvf);
    if (d > 0 && vf > 0 && textD !== '0' && textvf !== '0') {
      const result = ((Math.PI * Math.pow(d, 2) * vf) / 4000).toFixed(3);
      if (result !== textQ) {
        setTextQ(result);
        saveValue('barrenado-q', result);
      }
    }
  }, [textD, textvf]);

  const loadData = async () => {
    try {
      const keys = [
        'barrenado-d',
        'barrenado-z',
        'barrenado-n',
        'barrenado-vc',
        'barrenado-fz',
        'barrenado-fn',
        'barrenado-vf',
        'barrenado-tc',
        'barrenado-q',
      ];

      const values = await AsyncStorage.multiGet(keys);
      
      values.forEach(([key, value]) => {
        const val = value || '0';
        switch (key) {
          case 'barrenado-d':
            setTextD(val);
            break;
          case 'barrenado-z':
            setTextZ(val);
            break;
          case 'barrenado-n':
            setTextN(val);
            break;
          case 'barrenado-vc':
            setTextVc(val);
            break;
          case 'barrenado-fz':
            setTextfz(val);
            break;
          case 'barrenado-fn':
            setTextfn(val);
            break;
          case 'barrenado-vf':
            setTextvf(val);
            break;
          case 'barrenado-tc':
            setTexttc(val);
            break;
          case 'barrenado-q':
            setTextQ(val);
            break;
        }
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveValue = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  // Funciones de cálculo basadas en el proyecto de referencia
  const calcN = () => {
    const d = parseFloat(textD);
    const vc = parseFloat(textVc);
    if (d > 0 && vc > 0) {
      const result = ((vc * 1000) / (Math.PI * d)).toFixed(2);
      setTextN(result);
      saveValue('barrenado-n', result);
    }
  };

  const calcVc = () => {
    const d = parseFloat(textD);
    const n = parseFloat(textN);
    if (d > 0 && n > 0) {
      const result = ((Math.PI * d * n) / 1000).toFixed(2);
      setTextVc(result);
      saveValue('barrenado-vc', result);
    }
  };

  const calcfz = () => {
    const fn = parseFloat(textfn);
    const z = parseFloat(textZ);
    if (fn > 0 && z > 0) {
      const result = (fn / z).toFixed(3);
      setTextfz(result);
      saveValue('barrenado-fz', result);
    }
  };

  const calcfn = () => {
    const fz = parseFloat(textfz);
    const z = parseFloat(textZ);
    if (fz > 0 && z > 0) {
      const result = (fz * z).toFixed(3);
      setTextfn(result);
      saveValue('barrenado-fn', result);
    }
  };

  const calcvf = () => {
    const fn = parseFloat(textfn);
    const n = parseFloat(textN);
    if (fn > 0 && n > 0) {
      const result = (fn * n).toFixed(2);
      setTextvf(result);
      saveValue('barrenado-vf', result);
    }
  };

  const calctc = () => {
    const vf = parseFloat(textvf);
    const l = 10; // Longitud fija para el ejemplo
    if (vf > 0) {
      const result = (l / vf).toFixed(3);
      setTexttc(result);
      saveValue('barrenado-tc', result);
    }
  };

  const calcQ = () => {
    const d = parseFloat(textD);
    const vf = parseFloat(textvf);
    if (d > 0 && vf > 0) {
      const result = ((Math.PI * Math.pow(d, 2) * vf) / 4000).toFixed(3);
      setTextQ(result);
      saveValue('barrenado-q', result);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Validar que solo contenga números y punto decimal
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    switch (field) {
      case 'd':
        setTextD(numericValue);
        saveValue('barrenado-d', numericValue);
        break;
      case 'z':
        setTextZ(numericValue);
        saveValue('barrenado-z', numericValue);
        break;
      case 'n':
        setTextN(numericValue);
        saveValue('barrenado-n', numericValue);
        break;
      case 'vc':
        setTextVc(numericValue);
        saveValue('barrenado-vc', numericValue);
        break;
      case 'fz':
        setTextfz(numericValue);
        saveValue('barrenado-fz', numericValue);
        break;
      case 'fn':
        setTextfn(numericValue);
        saveValue('barrenado-fn', numericValue);
        break;
      case 'vf':
        setTextvf(numericValue);
        saveValue('barrenado-vf', numericValue);
        break;
      case 'tc':
        setTexttc(numericValue);
        saveValue('barrenado-tc', numericValue);
        break;
      case 'q':
        setTextQ(numericValue);
        saveValue('barrenado-q', numericValue);
        break;
    }
  };

  const clearAll = () => {
    Alert.alert(
      'Limpiar Datos',
      '¿Estás seguro de que quieres limpiar todos los valores?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: () => {
            setTextD('0');
            setTextZ('0');
            setTextN('0');
            setTextVc('0');
            setTextfz('0');
            setTextfn('0');
            setTextvf('0');
            setTexttc('0');
            setTextQ('0');
            
            // Limpiar AsyncStorage
            const keys = [
              'barrenado-d', 'barrenado-z', 'barrenado-n', 'barrenado-vc',
              'barrenado-fz', 'barrenado-fn', 'barrenado-vf', 'barrenado-tc', 'barrenado-q'
            ];
            keys.forEach(key => AsyncStorage.removeItem(key));
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Calculadora de Barrenado</Text>
        <TouchableOpacity onPress={clearAll} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Limpiar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Parámetros de entrada */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parámetros de Entrada</Text>
          
          <View style={styles.inputRow}>
            <Text style={styles.label}>Diámetro (mm):</Text>
            <TextInput
              style={[styles.input, selectedField === 'd' && styles.inputSelected]}
              value={textD}
              onChangeText={(value) => handleInputChange('d', value)}
              onFocus={() => setSelectedField('d')}
              onBlur={() => setSelectedField(null)}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>Número de filos:</Text>
            <TextInput
              style={[styles.input, selectedField === 'z' && styles.inputSelected]}
              value={textZ}
              onChangeText={(value) => handleInputChange('z', value)}
              onFocus={() => setSelectedField('z')}
              onBlur={() => setSelectedField(null)}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
        </View>

        {/* Velocidades */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Velocidades</Text>
          
          <View style={styles.inputRow}>
            <Text style={styles.label}>Velocidad de giro (RPM):</Text>
            <TextInput
              style={[styles.input, selectedField === 'n' && styles.inputSelected]}
              value={textN}
              onChangeText={(value) => handleInputChange('n', value)}
              onFocus={() => setSelectedField('n')}
              onBlur={() => setSelectedField(null)}
              keyboardType="numeric"
              placeholder="0"
            />
            <TouchableOpacity style={styles.calcButton} onPress={calcN}>
              <Text style={styles.calcButtonText}>Calc</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>Velocidad de corte (m/min):</Text>
            <TextInput
              style={[styles.input, selectedField === 'vc' && styles.inputSelected]}
              value={textVc}
              onChangeText={(value) => handleInputChange('vc', value)}
              onFocus={() => setSelectedField('vc')}
              onBlur={() => setSelectedField(null)}
              keyboardType="numeric"
              placeholder="0"
            />
            <TouchableOpacity style={styles.calcButton} onPress={calcVc}>
              <Text style={styles.calcButtonText}>Calc</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Avances */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avances</Text>
          
          <View style={styles.inputRow}>
            <Text style={styles.label}>Avance por filo (mm/filo):</Text>
            <TextInput
              style={[styles.input, selectedField === 'fz' && styles.inputSelected]}
              value={textfz}
              onChangeText={(value) => handleInputChange('fz', value)}
              onFocus={() => setSelectedField('fz')}
              onBlur={() => setSelectedField(null)}
              keyboardType="numeric"
              placeholder="0"
            />
            <TouchableOpacity style={styles.calcButton} onPress={calcfz}>
              <Text style={styles.calcButtonText}>Calc</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>Avance por revolución (mm/rev):</Text>
            <TextInput
              style={[styles.input, selectedField === 'fn' && styles.inputSelected]}
              value={textfn}
              onChangeText={(value) => handleInputChange('fn', value)}
              onFocus={() => setSelectedField('fn')}
              onBlur={() => setSelectedField(null)}
              keyboardType="numeric"
              placeholder="0"
            />
            <TouchableOpacity style={styles.calcButton} onPress={calcfn}>
              <Text style={styles.calcButtonText}>Calc</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>Velocidad de avance (mm/min):</Text>
            <TextInput
              style={[styles.input, selectedField === 'vf' && styles.inputSelected]}
              value={textvf}
              onChangeText={(value) => handleInputChange('vf', value)}
              onFocus={() => setSelectedField('vf')}
              onBlur={() => setSelectedField(null)}
              keyboardType="numeric"
              placeholder="0"
            />
            <TouchableOpacity style={styles.calcButton} onPress={calcvf}>
              <Text style={styles.calcButtonText}>Calc</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Resultados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resultados</Text>
          
          <View style={styles.inputRow}>
            <Text style={styles.label}>Tiempo de corte (min):</Text>
            <TextInput
              style={[styles.input, selectedField === 'tc' && styles.inputSelected]}
              value={texttc}
              onChangeText={(value) => handleInputChange('tc', value)}
              onFocus={() => setSelectedField('tc')}
              onBlur={() => setSelectedField(null)}
              keyboardType="numeric"
              placeholder="0"
            />
            <TouchableOpacity style={styles.calcButton} onPress={calctc}>
              <Text style={styles.calcButtonText}>Calc</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.label}>Volumen de viruta (cm³/min):</Text>
            <TextInput
              style={[styles.input, selectedField === 'q' && styles.inputSelected]}
              value={textQ}
              onChangeText={(value) => handleInputChange('q', value)}
              onFocus={() => setSelectedField('q')}
              onBlur={() => setSelectedField(null)}
              keyboardType="numeric"
              placeholder="0"
            />
            <TouchableOpacity style={styles.calcButton} onPress={calcQ}>
              <Text style={styles.calcButtonText}>Calc</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#264B9B',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  clearButton: {
    padding: 5,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#264B9B',
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    flex: 2,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  inputSelected: {
    borderColor: '#54A2D9',
    borderWidth: 2,
  },
  calcButton: {
    marginLeft: 10,
    backgroundColor: '#54A2D9',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  calcButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});