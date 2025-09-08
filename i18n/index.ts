import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Traducciones
const resources = {
  es: {
    calculator: {
      title: 'Calculadora de Mecanizado',
      barrenado: 'Barrenado',
      fresado: 'Fresado',
      configuracion: 'Configuración',
      // Parámetros
      diametro: 'Diámetro (D)',
      dientes: 'Número de dientes (Z)',
      rpm: 'Velocidad de rotación (N)',
      velocidadCorte: 'Velocidad de corte (Vc)',
      avanceDiente: 'Avance por diente (fz)',
      avanceRevolucion: 'Avance por revolución (fn)',
      velocidadAvance: 'Velocidad de avance (vf)',
      profundidadAxial: 'Profundidad axial (ap)',
      profundidadRadial: 'Profundidad radial (ae)',
      numeroPasadas: 'Número de pasadas (np)',
      longitudMecanizado: 'Longitud de mecanizado (lm)',
      tiempoCorte: 'Tiempo de corte (tc)',
      tasaRemocion: 'Tasa de remoción (Q)',
      // Unidades
      mm: 'mm',
      inch: 'in',
      rpm_unit: 'rpm',
      mmin: 'm/min',
      mmrev: 'mm/rev',
      mmdiente: 'mm/diente',
      min: 'min',
      cm3min: 'cm³/min'
    },
    settings: {
      ajustes: 'Ajustes',
      medida: 'Unidad de medida',
      velocidad: 'Tipo de velocidad',
      metrico: 'Métrico',
      imperial: 'Imperial',
      normal: 'Normal',
      fast: 'Rápido'
    }
  },
  en: {
    calculator: {
      title: 'Machining Calculator',
      barrenado: 'Drilling',
      fresado: 'Milling',
      configuracion: 'Settings',
      // Parameters
      diametro: 'Diameter (D)',
      dientes: 'Number of teeth (Z)',
      rpm: 'Rotation speed (N)',
      velocidadCorte: 'Cutting speed (Vc)',
      avanceDiente: 'Feed per tooth (fz)',
      avanceRevolucion: 'Feed per revolution (fn)',
      velocidadAvance: 'Feed rate (vf)',
      profundidadAxial: 'Axial depth (ap)',
      profundidadRadial: 'Radial depth (ae)',
      numeroPasadas: 'Number of passes (np)',
      longitudMecanizado: 'Machining length (lm)',
      tiempoCorte: 'Cutting time (tc)',
      tasaRemocion: 'Removal rate (Q)',
      // Units
      mm: 'mm',
      inch: 'in',
      rpm_unit: 'rpm',
      mmin: 'm/min',
      mmrev: 'mm/rev',
      mmdiente: 'mm/tooth',
      min: 'min',
      cm3min: 'cm³/min'
    },
    settings: {
      ajustes: 'Settings',
      medida: 'Unit of measurement',
      velocidad: 'Speed type',
      metrico: 'Metric',
      imperial: 'Imperial',
      normal: 'Normal',
      fast: 'Fast'
    }
  }
};

// Configuración de i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es', // idioma por defecto
    fallbackLng: 'es',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })
  .then(() => {
    // Cargar idioma guardado después de la inicialización
    loadSavedLanguage();
  })
  .catch((error) => {
    console.error('Error initializing i18n:', error);
  });

// Función para cargar el idioma guardado
export const loadSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('user-language');
    if (savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
  } catch (error) {
    console.log('Error loading saved language:', error);
  }
};

// Función para guardar el idioma
export const saveLanguage = async (language: string) => {
  try {
    await AsyncStorage.setItem('user-language', language);
    i18n.changeLanguage(language);
  } catch (error) {
    console.log('Error saving language:', error);
  }
};

export default i18n;