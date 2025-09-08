// Funciones de cálculo para la calculadora de mecanizado

// Calcular velocidad de corte (Vc) basado en diámetro (D) y RPM (N)
export const calcVc = (D: number, N: number): number => {
  if (D === 0 || N === 0) return 0;
  return (Math.PI * D * N) / 1000;
};

// Calcular RPM (N) basado en diámetro (D) y velocidad de corte (Vc)
export const calcN = (D: number, Vc: number): number => {
  if (D === 0 || Vc === 0) return 0;
  return (Vc * 1000) / (Math.PI * D);
};

// Calcular avance por diente (fz) basado en avance por revolución (fn) y número de dientes (Z)
export const calcfz = (fn: number, Z: number): number => {
  if (Z === 0) return 0;
  return fn / Z;
};

// Calcular avance por revolución (fn) basado en avance por diente (fz) y número de dientes (Z)
export const calcfn2 = (fz: number, Z: number): number => {
  return fz * Z;
};

// Calcular avance por revolución (fn) basado en velocidad de avance (vf) y RPM (N)
export const calcfn1 = (vf: number, N: number): number => {
  if (N === 0) return 0;
  return vf / N;
};

// Calcular velocidad de avance (vf) basado en avance por revolución (fn) y RPM (N)
export const calcvf = (fn: number, N: number): number => {
  return fn * N;
};

// Calcular tiempo de corte (tc) basado en longitud de mecanizado (lm), velocidad de avance (vf) y número de pasadas (np)
export const calctc = (lm: number, vf: number, np: number): number => {
  if (vf === 0) return 0;
  return (lm * np) / vf;
};

// Calcular tasa de remoción de material (Q) basado en profundidad axial (ap), profundidad radial (ae) y velocidad de avance (vf)
export const calcQ = (ap: number, ae: number, vf: number): number => {
  return ap * ae * vf;
};

// Función para formatear números con decimales específicos
export const formatNumber = (value: number, decimals: number): string => {
  if (isNaN(value) || !isFinite(value)) return '0';
  return value.toFixed(decimals);
};

// Función para validar entrada numérica
export const isValidNumber = (value: string): boolean => {
  const num = parseFloat(value);
  return !isNaN(num) && isFinite(num);
};

// Función para obtener el texto del campo según el índice
export const getFieldByIndex = (index: number): string => {
  const fields = [
    '', // 0 - no field
    'D',  // 1 - Diámetro
    'Z',  // 2 - Número de dientes
    'N',  // 3 - RPM
    'Vc', // 4 - Velocidad de corte
    'fz', // 5 - Avance por diente
    'fn', // 6 - Avance por revolución
    'vf', // 7 - Velocidad de avance
    'ap', // 8 - Profundidad axial
    'ae', // 9 - Profundidad radial
    'np', // 10 - Número de pasadas
    'lm'  // 11 - Longitud de mecanizado
  ];
  return fields[index] || '';
};