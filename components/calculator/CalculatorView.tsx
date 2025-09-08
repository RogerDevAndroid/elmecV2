import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  setField,
  setEditable,
  clearAll,
  updateTextoCa,
} from '../../store/calculatorSlice';
import {
  calcVc,
  calcN,
  calcfz,
  calcfn2,
  calcfn1,
  calcvf,
  calctc,
  calcQ,
  formatNumber,
  isValidNumber,
  getFieldByIndex,
} from '../../utils/calculatorUtils';

interface CalculatorViewProps {
  theme?: 'light' | 'dark';
}

const CalculatorView: React.FC<CalculatorViewProps> = ({ theme = 'light' }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const calculator = useAppSelector((state) => state.calculator);
  const { width, height } = Dimensions.get('window');

  const isDark = theme === 'dark';
  const styles = createStyles(isDark, height);

  // Función para manejar clics en campos de texto
  const textClick = (fieldIndex: number) => {
    if (fieldIndex > 11) fieldIndex = 0;
    
    dispatch(setEditable(fieldIndex));
    
    const fieldName = getFieldByIndex(fieldIndex);
    const textoCampo = calculator[fieldName as keyof typeof calculator] as string;
    
    if (parseFloat(textoCampo) === 0 || isNaN(parseFloat(textoCampo))) {
      dispatch(updateTextoCa('CA'));
    } else {
      dispatch(updateTextoCa('C'));
    }
  };

  // Función para editar campos
  const editarCampo = (boton: string) => {
    const fieldName = getFieldByIndex(calculator.editable);
    let textoCampo = calculator[fieldName as keyof typeof calculator] as string;

    switch (boton) {
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
      case '0':
        if ((parseFloat(textoCampo) === 0 && !textoCampo.includes('.')) || isNaN(parseFloat(textoCampo))) {
          textoCampo = '';
        }
        textoCampo += boton;
        break;
      case '.':
        if (!textoCampo.includes('.')) {
          if (parseFloat(textoCampo) === 0 || isNaN(parseFloat(textoCampo))) {
            textoCampo = '0';
          }
          textoCampo += '.';
        }
        break;
      case 'C':
        if (parseFloat(textoCampo) === 0 || isNaN(parseFloat(textoCampo))) {
          dispatch(clearAll());
        } else {
          textoCampo = '0';
        }
        break;
      case 'S': // Subir
        textClick(calculator.editable - 1);
        return;
      case 'B': // Bajar
        textClick(calculator.editable + 1);
        return;
    }

    // Actualizar el campo
    dispatch(setField({ field: fieldName as any, value: textoCampo }));

    // Realizar cálculos automáticos
    performCalculations(calculator.editable, textoCampo);

    // Actualizar texto del botón C/CA
    if (parseFloat(textoCampo) === 0 || isNaN(parseFloat(textoCampo))) {
      dispatch(updateTextoCa('CA'));
    } else {
      dispatch(updateTextoCa('C'));
    }
  };

  // Función para realizar cálculos automáticos
  const performCalculations = (editable: number, newValue: string) => {
    const numValue = parseFloat(newValue);
    if (isNaN(numValue)) return;

    // Usar setTimeout para asegurar que las actualizaciones de estado ocurran en el próximo ciclo
    setTimeout(() => {
      switch (editable) {
      case 1: // Diámetro (D)
        {
          const N = parseFloat(calculator.N);
          const Vc = parseFloat(calculator.Vc);
          if (N > 0) {
            const newVc = calcVc(numValue, N);
            dispatch(setField({ field: 'Vc', value: formatNumber(newVc, 0) }));
          }
          if (Vc > 0) {
            const newN = calcN(numValue, Vc);
            dispatch(setField({ field: 'N', value: formatNumber(newN, 0) }));
          }
        }
        break;
      case 2: // Número de dientes (Z)
        {
          const fn = parseFloat(calculator.fn);
          const fz = parseFloat(calculator.fz);
          if (fn > 0) {
            const newfz = calcfz(fn, numValue);
            dispatch(setField({ field: 'fz', value: formatNumber(newfz, 3) }));
          }
          if (fz > 0) {
            const newfn = calcfn2(fz, numValue);
            dispatch(setField({ field: 'fn', value: formatNumber(newfn, 3) }));
          }
        }
        break;
      case 3: // RPM (N)
        {
          const D = parseFloat(calculator.D);
          const vf = parseFloat(calculator.vf);
          if (D > 0) {
            const newVc = calcVc(D, numValue);
            dispatch(setField({ field: 'Vc', value: formatNumber(newVc, 0) }));
          }
          if (vf > 0) {
            const newfn = calcfn1(vf, numValue);
            dispatch(setField({ field: 'fn', value: formatNumber(newfn, 3) }));
          }
        }
        break;
      case 4: // Velocidad de corte (Vc)
        {
          const D = parseFloat(calculator.D);
          if (D > 0) {
            const newN = calcN(D, numValue);
            dispatch(setField({ field: 'N', value: formatNumber(newN, 0) }));
          }
        }
        break;
      case 5: // Avance por diente (fz)
        {
          const Z = parseFloat(calculator.Z);
          if (Z > 0) {
            const newfn = calcfn2(numValue, Z);
            dispatch(setField({ field: 'fn', value: formatNumber(newfn, 3) }));
          }
        }
        break;
      case 6: // Avance por revolución (fn)
        {
          const Z = parseFloat(calculator.Z);
          const N = parseFloat(calculator.N);
          if (Z > 0) {
            const newfz = calcfz(numValue, Z);
            dispatch(setField({ field: 'fz', value: formatNumber(newfz, 3) }));
          }
          if (N > 0) {
            const newvf = calcvf(numValue, N);
            dispatch(setField({ field: 'vf', value: formatNumber(newvf, 0) }));
          }
        }
        break;
      case 7: // Velocidad de avance (vf)
        {
          const N = parseFloat(calculator.N);
          const ap = parseFloat(calculator.ap);
          const ae = parseFloat(calculator.ae);
          const lm = parseFloat(calculator.lm);
          const np = parseFloat(calculator.np);
          
          if (N > 0) {
            const newfn = calcfn1(numValue, N);
            dispatch(setField({ field: 'fn', value: formatNumber(newfn, 3) }));
          }
          if (lm > 0 && np > 0) {
            const newtc = calctc(lm, numValue, np);
            dispatch(setField({ field: 'tc', value: formatNumber(newtc, 2) }));
          }
          if (ap > 0 && ae > 0) {
            const newQ = calcQ(ap, ae, numValue);
            dispatch(setField({ field: 'Q', value: formatNumber(newQ, 0) }));
          }
        }
        break;
      case 8: // Profundidad axial (ap)
        {
          const ae = parseFloat(calculator.ae);
          const vf = parseFloat(calculator.vf);
          if (ae > 0 && vf > 0) {
            const newQ = calcQ(numValue, ae, vf);
            dispatch(setField({ field: 'Q', value: formatNumber(newQ, 0) }));
          }
        }
        break;
      case 9: // Profundidad radial (ae)
        {
          const ap = parseFloat(calculator.ap);
          const vf = parseFloat(calculator.vf);
          if (ap > 0 && vf > 0) {
            const newQ = calcQ(ap, numValue, vf);
            dispatch(setField({ field: 'Q', value: formatNumber(newQ, 0) }));
          }
        }
        break;
      case 10: // Número de pasadas (np)
        {
          const lm = parseFloat(calculator.lm);
          const vf = parseFloat(calculator.vf);
          if (lm > 0 && vf > 0) {
            const newtc = calctc(lm, vf, numValue);
            dispatch(setField({ field: 'tc', value: formatNumber(newtc, 2) }));
          }
        }
        break;
      case 11: // Longitud de mecanizado (lm)
        {
          const np = parseFloat(calculator.np);
          const vf = parseFloat(calculator.vf);
          if (np > 0 && vf > 0) {
            const newtc = calctc(numValue, vf, np);
            dispatch(setField({ field: 'tc', value: formatNumber(newtc, 2) }));
          }
        }
        break;
      }
    }, 0);
  };

  // Renderizar campo de entrada
  const renderInputField = (label: string, value: string, unit: string, fieldIndex: number) => {
    const isActive = calculator.editable === fieldIndex;
    
    return (
      <TouchableOpacity
        key={fieldIndex}
        style={[styles.inputContainer, isActive && styles.activeInputContainer]}
        onPress={() => textClick(fieldIndex)}
      >
        <View style={styles.inputLabelContainer}>
          <Text style={styles.inputLabel}>{label}</Text>
          <Text style={styles.inputUnit}>{unit}</Text>
        </View>
        <Text style={[styles.inputValue, isActive && styles.activeInputValue]}>
          {value}
        </Text>
      </TouchableOpacity>
    );
  };

  // Renderizar teclado numérico
  const renderKeyboard = () => {
    if (calculator.editable === 0) return null;

    return (
      <View style={[styles.keyboardContainer, { height: parseFloat(calculator.keyboardHeight) || 0 }]}>
        <View style={styles.numbersContainer}>
          <View style={styles.numberRow}>
            {['1', '2', '3'].map((num) => (
              <TouchableOpacity
                key={num}
                style={styles.numberButton}
                onPress={() => editarCampo(num)}
              >
                <Text style={styles.numberText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.numberRow}>
            {['4', '5', '6'].map((num) => (
              <TouchableOpacity
                key={num}
                style={styles.numberButton}
                onPress={() => editarCampo(num)}
              >
                <Text style={styles.numberText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.numberRow}>
            {['7', '8', '9'].map((num) => (
              <TouchableOpacity
                key={num}
                style={styles.numberButton}
                onPress={() => editarCampo(num)}
              >
                <Text style={styles.numberText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.numberRow}>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() => editarCampo('C')}
            >
              <Text style={styles.numberText}>{calculator.textoCa}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() => editarCampo('0')}
            >
              <Text style={styles.numberText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() => editarCampo('.')}
            >
              <Text style={styles.numberText}>.</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => editarCampo('S')}
          >
            <Text style={styles.navText}>▲</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => editarCampo('B')}
          >
            <Text style={styles.navText}>▼</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={[styles.scrollContainer, { height: parseFloat(calculator.scrollHeight) || '100%' }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.fieldsContainer}>
          {/* Parámetros de entrada */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Parámetros de Entrada</Text>
            {renderInputField(t('calculator:diametro'), calculator.D, calculator.medida === 'mt' ? 'mm' : 'in', 1)}
            {renderInputField(t('calculator:dientes'), calculator.Z, '', 2)}
            {renderInputField(t('calculator:rpm'), calculator.N, 'rpm', 3)}
            {renderInputField(t('calculator:velocidadCorte'), calculator.Vc, 'm/min', 4)}
            {renderInputField(t('calculator:avanceDiente'), calculator.fz, calculator.medida === 'mt' ? 'mm/diente' : 'in/tooth', 5)}
            {renderInputField(t('calculator:avanceRevolucion'), calculator.fn, calculator.medida === 'mt' ? 'mm/rev' : 'in/rev', 6)}
            {renderInputField(t('calculator:velocidadAvance'), calculator.vf, calculator.medida === 'mt' ? 'mm/min' : 'in/min', 7)}
            {renderInputField(t('calculator:profundidadAxial'), calculator.ap, calculator.medida === 'mt' ? 'mm' : 'in', 8)}
            {renderInputField(t('calculator:profundidadRadial'), calculator.ae, calculator.medida === 'mt' ? 'mm' : 'in', 9)}
            {renderInputField(t('calculator:numeroPasadas'), calculator.np, '', 10)}
            {renderInputField(t('calculator:longitudMecanizado'), calculator.lm, calculator.medida === 'mt' ? 'mm' : 'in', 11)}
          </View>

          {/* Resultados calculados */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Resultados</Text>
            <View style={styles.resultContainer}>
              <Text style={styles.resultLabel}>{t('calculator:tiempoCorte')}</Text>
              <Text style={styles.resultValue}>{calculator.tc} min</Text>
            </View>
            <View style={styles.resultContainer}>
              <Text style={styles.resultLabel}>{t('calculator:tasaRemocion')}</Text>
              <Text style={styles.resultValue}>{calculator.Q} cm³/min</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {renderKeyboard()}
    </View>
  );
};

const createStyles = (isDark: boolean, screenHeight: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#061831' : '#f9fafb',
  },
  scrollContainer: {
    flex: 1,
  },
  fieldsContainer: {
    padding: 16,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: isDark ? '#4AA3D3' : '#1e40af',
    marginBottom: 16,
  },
  inputContainer: {
    backgroundColor: isDark ? '#1a2332' : '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activeInputContainer: {
    borderColor: isDark ? '#4AA3D3' : '#1e40af',
    backgroundColor: isDark ? '#2a3442' : '#f0f7ff',
  },
  inputLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: isDark ? '#e5e7eb' : '#374151',
  },
  inputUnit: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: isDark ? '#9ca3af' : '#6b7280',
  },
  inputValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: isDark ? '#ffffff' : '#111827',
  },
  activeInputValue: {
    color: isDark ? '#4AA3D3' : '#1e40af',
  },
  resultContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: isDark ? '#1a2332' : '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: isDark ? '#e5e7eb' : '#374151',
  },
  resultValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: isDark ? '#10b981' : '#059669',
  },
  keyboardContainer: {
    flexDirection: 'row',
    backgroundColor: isDark ? '#1a2332' : '#ffffff',
    borderTopWidth: 1,
    borderTopColor: isDark ? '#374151' : '#e5e7eb',
  },
  numbersContainer: {
    flex: 6,
    padding: 8,
  },
  numberRow: {
    flexDirection: 'row',
    flex: 1,
  },
  numberButton: {
    flex: 1,
    margin: 4,
    backgroundColor: isDark ? '#374151' : '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: isDark ? '#ffffff' : '#111827',
  },
  navigationContainer: {
    flex: 3,
    padding: 8,
  },
  navButton: {
    flex: 1,
    margin: 4,
    backgroundColor: isDark ? '#4AA3D3' : '#1e40af',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
});

export default CalculatorView;