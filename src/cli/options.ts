/**
 * CLI option types shared between commander and the start command.
 */

export interface CLIOptions {
  config?: string;
  port?: number;
  host?: string;
  delay?: number;
  errorRate?: number;
  watch?: boolean;
  dbFile?: string;
}
