declare module 'axios-retry' {
  import { AxiosInstance } from 'axios';

  interface AxiosRetry {
    (axios: AxiosInstance, options: {
      retries?: number;
      retryDelay?: (retryCount: number) => number;
      retryCondition?: (error: any) => boolean;
    }): void;

    isNetworkOrIdempotentRequestError(error: any): boolean;
  }

  const axiosRetry: AxiosRetry;
  export default axiosRetry;
}