import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WebhookUrls {
  campaignSend: string;
  evolutionCreateInstance: string;
  evolutionConfirmConnection: string;
  evolutionUpdateQrCode: string;
}

interface WebhookUrlsStore {
  urls: WebhookUrls;
  setUrls: (urls: WebhookUrls) => void;
  resetUrls: () => void;
  updateUrl: (key: keyof WebhookUrls, value: string) => void;
}

const defaultWebhookUrls: WebhookUrls = {
  campaignSend: 'https://nwh.devautomatizadores.com.br/webhook/campanha_disparo',
  evolutionCreateInstance: 'https://nwh.devautomatizadores.com.br/webhook/criar_instancia',
  evolutionConfirmConnection: 'https://nwh.devautomatizadores.com.br/webhook/confirma_conexao',
  evolutionUpdateQrCode: 'https://nwh.devautomatizadores.com.br/webhook/atualiza_qrcode'
};

export const useWebhookUrls = create<WebhookUrlsStore>()(
  persist(
    (set) => ({
      urls: defaultWebhookUrls,
      setUrls: (newUrls) => set({ urls: newUrls }),
      resetUrls: () => set({ urls: defaultWebhookUrls }),
      updateUrl: (key, value) => set((state) => ({
        urls: {
          ...state.urls,
          [key]: value
        }
      })),
    }),
    {
      name: 'webhook-urls-storage',
    }
  )
); 