
export const tokenService = {
    get: (): string | null => {
      return localStorage.getItem("accessToken");
    },
  
    set: (token: string): void => {
      localStorage.setItem("accessToken", token);
    },
  
    clear: (): void => {
      localStorage.removeItem("accessToken");
    },
  };