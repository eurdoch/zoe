export class NetworkError extends Error { 
  public statusCode: number;
  public errorCode?: string;

  constructor(message: string, statusCode: number, errorCode?: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, NetworkError.prototype);
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      stack: this.stack
    };
  }
}

export class AuthenticationError extends NetworkError {
  constructor(message: string = "Authentication failed. Please log in again.", statusCode: number = 401) {
    super(message, statusCode);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export default NetworkError;
