export type RecordItem = Record<string, unknown> & { id?: number | string };

export interface ServerSettings {
  port: number;
  host: string;
  delay: number;
  errorRate: number;
  ui: boolean;
}

export interface RequestLog {
  id: string;
  timestamp: number;
  method: string;
  path: string;
  status: number;
  duration: number;
}

export interface StudioState {
  resourceNames: string[];
  resources: Record<string, RecordItem[]>;
  settings: ServerSettings;
  logs: RequestLog[];
}
