export interface CabinetLocker {
  level: number;
  column?: number | null;
}

export interface Cabinet {
  id: string;
  name: string;
  levels: number;
  columns: number; // default fallback
  levelColumns?: Record<number, number>; // Maps a level number to its specific column count
  hasLocker: boolean;
  lockers?: CabinetLocker[];
}

export interface FileType {
  id: string;
  name: string;
  defaultCabinetId?: string;
  defaultLevel?: number;
  defaultColumn?: number;
  defaultIsLocker?: boolean;
}

export interface FileDoc {
  id: string;
  bdCollection: 'I' | 'II';
  fileNumber: string;
  financialYear: string;
  fileName: string;
  fileTypeId: string;
  cabinetId: string;
  level: number;
  column: number;
  isLocker: boolean;
  isConfidential: boolean;
  password?: string;
}

export interface AppDocument {
  id: string;
  bdCollection: 'I' | 'II' | '';
  documentNumber: string; 
  documentType: string;
  cabinetId: string;
  level: number;
  column: number;
  isLocker: boolean;
  isConfidential: boolean;
  password?: string;
}
