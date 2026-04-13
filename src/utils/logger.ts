export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] [${this.context}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  error(message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] [${this.context}] ${message}`);
    if (error) {
      if (error instanceof Error) {
        console.error(`  Message: ${error.message}`);
        console.error(`  Stack: ${error.stack}`);
      } else {
        console.error(JSON.stringify(error, null, 2));
      }
    }
  }

  warn(message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] [${this.context}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  debug(message: string, data?: any): void {
    if (process.env.DEBUG === 'true') {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [DEBUG] [${this.context}] ${message}`);
      if (data) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }

  success(message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [SUCCESS] [${this.context}] ✓ ${message}`);
  }
}
