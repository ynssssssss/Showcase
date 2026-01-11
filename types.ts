
export interface DemoStep {
  sender: 'agent' | 'user';
  text: string;
  fieldToUpdate?: string;
  valueToCapture?: string;
  isInput?: boolean;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  steps: DemoStep[];
}

export interface CapturedData {
  name: string;
  phone: string;
  intent: string;
  dateTime: string;
  notes: string;
  leadScore: string;
}
