export {};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: {
            client_id: string;
            nonce?: string;
            callback: (response: { credential: string }) => void;
          }): void;
          renderButton(
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'small' | 'medium' | 'large';
              width?: string;
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              locale?: string;
              shape?: 'pill';
            },
          ): void;
        };
      };
    };
  }
}
