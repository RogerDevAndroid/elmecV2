import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, Drill, Wrench } from 'lucide-react-native';

export default function CalculatorHome() {
  const { t } = useTranslation();
  const router = useRouter();
  const { width, height } = Dimensions.get('window');

  const handleNavigation = (screenName: string) => {
    router.push(`/calculator/${screenName}` as any);
  };

  const buttonStyle = {
    borderRadius: 16,
    margin: 20,
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  };

  const textStyle = {
    color: '#1e40af',
    fontSize: height * 0.025,
    fontFamily: 'Inter-Bold',
    textAlign: 'center' as const,
    marginTop: 12,
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{t('calculator:title')}</Text>
          <Text style={styles.subtitle}>Herramientas de cálculo para mecanizado</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => handleNavigation('settings')}
        >
          <Settings size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Calculator Options */}
      <View style={styles.optionsContainer}>
        {/* Drilling Option */}
        <TouchableOpacity
          style={[styles.optionCard, { marginBottom: 20 }]}
          onPress={() => handleNavigation('drilling')}
        >
          <LinearGradient
            colors={['#ffffff', '#f8fafc']}
            style={[buttonStyle, { margin: 0 }]}
          >
            <View style={styles.iconContainer}>
              <Drill size={48} color="#1e40af" />
            </View>
            <Text style={textStyle}>{t('calculator:barrenado')}</Text>
            <Text style={styles.optionDescription}>
              Cálculos para operaciones de barrenado y taladrado
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Milling Option */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => handleNavigation('milling')}
        >
          <LinearGradient
            colors={['#ffffff', '#f8fafc']}
            style={[buttonStyle, { margin: 0 }]}
          >
            <View style={styles.iconContainer}>
              <Wrench size={48} color="#1e40af" />
            </View>
            <Text style={textStyle}>{t('calculator:fresado')}</Text>
            <Text style={styles.optionDescription}>
              Cálculos para operaciones de fresado y mecanizado
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Quick Access Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Características</Text>
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Cálculos automáticos en tiempo real</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Soporte para unidades métricas e imperiales</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Interfaz intuitiva y fácil de usar</Text>
          </View>
        </View>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
  },
  headerContent: {
    flex: 1,
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
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionsContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  optionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  infoContainer: {
    backgroundColor: '#ffffff',
    margin: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1e40af',
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    flex: 1,
  },
});