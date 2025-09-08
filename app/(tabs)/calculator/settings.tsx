import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Check, Globe, Settings as SettingsIcon } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import {
  setMedida,
  setVelocidad,
} from '../../../store/calculatorSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CalculatorSettings() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { medida, velocidad } = useAppSelector((state) => state.calculator);

  useEffect(() => {
    let isMounted = true;
    
    const loadSettings = async () => {
      try {
        const savedMeasureUnit = await AsyncStorage.getItem('measureUnit');
        const savedSpeedUnit = await AsyncStorage.getItem('speedUnit');
        
        if (isMounted) {
          if (savedMeasureUnit) {
            dispatch(setMedida(savedMeasureUnit));
          }
          if (savedSpeedUnit) {
            dispatch(setVelocidad(savedSpeedUnit));
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    loadSettings();
    
    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  const saveSettings = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleMeasureUnitChange = (unit: string) => {
    dispatch(setMedida(unit));
    saveSettings('measureUnit', unit);
  };

  const handleSpeedUnitChange = (unit: string) => {
    dispatch(setVelocidad(unit));
    saveSettings('speedUnit', unit);
  };

  const handleLanguageChange = async (language: string) => {
    try {
      await i18n.changeLanguage(language);
      await AsyncStorage.setItem('language', language);
      Alert.alert(
        t('settings:languageChanged'),
        t('settings:languageChangedMessage'),
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const SettingCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.settingCard}>
      <Text style={styles.settingTitle}>{title}</Text>
      {children}
    </View>
  );

  const OptionButton = ({
    label,
    isSelected,
    onPress,
  }: {
    label: string;
    isSelected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.optionButton, isSelected && styles.selectedOption]}
      onPress={onPress}
    >
      <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
        {label}
      </Text>
      {isSelected && <Check size={20} color="#ffffff" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{t('settings:title')}</Text>
          <Text style={styles.subtitle}>Configuración de la calculadora</Text>
        </View>
        <View style={styles.headerIcon}>
          <SettingsIcon size={24} color="#6b7280" />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Measure Units */}
        <SettingCard title={t('settings:measureUnits')}>
          <View style={styles.optionsContainer}>
            <OptionButton
              label="Métrico (mm)"
              isSelected={medida === 'mt'}
              onPress={() => handleMeasureUnitChange('mt')}
            />
            <OptionButton
              label="Imperial (in)"
              isSelected={medida === 'im'}
              onPress={() => handleMeasureUnitChange('im')}
            />
          </View>
          <Text style={styles.settingDescription}>
            {medida === 'mt'
              ? 'Diámetros en milímetros, velocidades en m/min'
              : 'Diámetros en pulgadas, velocidades en ft/min'}
          </Text>
        </SettingCard>

        {/* Speed Units */}
        <SettingCard title={t('settings:speedUnits')}>
          <View style={styles.optionsContainer}>
            <OptionButton
              label="Normal"
              isSelected={velocidad === 'n'}
              onPress={() => handleSpeedUnitChange('n')}
            />
            <OptionButton
              label="Rápido"
              isSelected={velocidad === 'fn'}
              onPress={() => handleSpeedUnitChange('fn')}
            />
          </View>
          <Text style={styles.settingDescription}>
            {velocidad === 'n'
              ? 'Velocidad de corte normal'
              : 'Velocidad de corte rápida'}
          </Text>
        </SettingCard>

        {/* Language Settings */}
        <SettingCard title={t('settings:language')}>
          <View style={styles.optionsContainer}>
            <OptionButton
              label="Español"
              isSelected={i18n.language === 'es'}
              onPress={() => handleLanguageChange('es')}
            />
            <OptionButton
              label="English"
              isSelected={i18n.language === 'en'}
              onPress={() => handleLanguageChange('en')}
            />
          </View>
          <Text style={styles.settingDescription}>
            Idioma de la interfaz de usuario
          </Text>
        </SettingCard>

        {/* Information Card */}
        <View style={styles.infoCard}>
          <LinearGradient
            colors={['#1e40af', '#3b82f6']}
            style={styles.infoGradient}
          >
            <Globe size={32} color="#ffffff" />
            <Text style={styles.infoTitle}>Calculadora de Mecanizado</Text>
            <Text style={styles.infoText}>
              Herramienta profesional para cálculos de barrenado y fresado.
              Optimiza tus operaciones de mecanizado con precisión.
            </Text>
          </LinearGradient>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  headerIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  settingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginRight: 8,
  },
  selectedOptionText: {
    color: '#ffffff',
  },
  settingDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    lineHeight: 16,
  },
  infoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  infoGradient: {
    padding: 24,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#e5e7eb',
    textAlign: 'center',
    lineHeight: 20,
  },
});