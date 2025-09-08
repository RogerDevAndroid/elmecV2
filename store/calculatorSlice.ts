import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CalculatorState {
  // Parámetros de entrada
  D: string; // Diámetro
  Z: string; // Número de dientes
  N: string; // Velocidad de rotación (RPM)
  Vc: string; // Velocidad de corte
  fz: string; // Avance por diente
  fn: string; // Avance por revolución
  vf: string; // Velocidad de avance
  ap: string; // Profundidad axial
  ae: string; // Profundidad radial
  np: string; // Número de pasadas
  lm: string; // Longitud de mecanizado
  
  // Parámetros calculados
  pb: string; // Potencia de corte
  nb: string; // Número de revoluciones
  tc: string; // Tiempo de corte
  Q: string; // Tasa de remoción de material
  
  // Estado de la interfaz
  editable: number; // Campo actualmente editable
  keyboardHeight: string;
  scrollHeight: string;
  textoCa: string; // Texto del botón C/CA
  
  // Configuración
  medida: string; // 'mt' para métrico, 'im' para imperial
  velocidad: string; // 'n' para normal, 'fn' para fast
}

const initialState: CalculatorState = {
  D: '0',
  Z: '0',
  N: '0',
  Vc: '0',
  fz: '0',
  fn: '0',
  vf: '0',
  ap: '0',
  ae: '0',
  np: '0',
  lm: '0',
  pb: '0',
  nb: '0',
  tc: '0',
  Q: '0',
  editable: 0,
  keyboardHeight: '0%',
  scrollHeight: '100%',
  textoCa: 'CA',
  medida: 'mt',
  velocidad: 'n'
};

const calculatorSlice = createSlice({
  name: 'calculator',
  initialState,
  reducers: {
    setField: (state, action: PayloadAction<{ field: keyof CalculatorState; value: string }>) => {
      const { field, value } = action.payload;
      state[field] = value as any;
    },
    setEditable: (state, action: PayloadAction<number>) => {
      state.editable = action.payload;
      if (action.payload > 0) {
        state.scrollHeight = '70%';
        state.keyboardHeight = '30%';
      } else {
        state.scrollHeight = '100%';
        state.keyboardHeight = '0%';
      }
    },
    clearAll: (state) => {
      state.D = '0';
      state.Z = '0';
      state.N = '0';
      state.Vc = '0';
      state.fz = '0';
      state.fn = '0';
      state.vf = '0';
      state.ap = '0';
      state.ae = '0';
      state.np = '0';
      state.lm = '0';
      state.pb = '0';
      state.nb = '0';
      state.tc = '0';
      state.Q = '0';
    },
    setMedida: (state, action: PayloadAction<string>) => {
      state.medida = action.payload;
    },
    setVelocidad: (state, action: PayloadAction<string>) => {
      state.velocidad = action.payload;
    },
    updateTextoCa: (state, action: PayloadAction<string>) => {
      state.textoCa = action.payload;
    }
  }
});

export const { 
  setField, 
  setEditable, 
  clearAll, 
  setMedida, 
  setVelocidad, 
  updateTextoCa 
} = calculatorSlice.actions;

export default calculatorSlice.reducer;