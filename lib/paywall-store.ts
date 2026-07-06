type PaywallListener = (reason: string) => void;
let listener: PaywallListener | null = null;

export const paywallStore = {
  trigger: (reason: string) => {
    if (listener) listener(reason);
  },
  subscribe: (fn: PaywallListener) => {
    listener = fn;
    return () => {
      listener = null;
    };
  },
};
