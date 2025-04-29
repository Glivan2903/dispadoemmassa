export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      campanhas_disparadas: {
        Row: {
          id: number
          nome: string
          instancia: string
          data_envio: string
          quantidade_numeros: number
          delay: number
          tipo_envio: 'texto' | 'imagem' | 'imagem_texto'
          imagem_url: string | null
          mensagem: string | null
        }
        Insert: {
          id?: number
          nome: string
          instancia: string
          data_envio?: string
          quantidade_numeros: number
          delay?: number
          tipo_envio?: 'texto' | 'imagem' | 'imagem_texto'
          imagem_url?: string | null
          mensagem?: string | null
        }
        Update: {
          id?: number
          nome?: string
          instancia?: string
          data_envio?: string
          quantidade_numeros?: number
          delay?: number
          tipo_envio?: 'texto' | 'imagem' | 'imagem_texto'
          imagem_url?: string | null
          mensagem?: string | null
        }
      }
      chat_messages: {
        Row: {
          id: number
          conversation_id: string
          user_message: string
          bot_message: string
          created_at: string
          data: string
          message_type: string
          phone: string
          active: boolean
        }
        Insert: {
          id?: number
          conversation_id: string
          user_message: string
          bot_message: string
          created_at?: string
          data: string
          message_type: string
          phone: string
          active?: boolean
        }
        Update: {
          id?: number
          conversation_id?: string
          user_message?: string
          bot_message?: string
          created_at?: string
          data?: string
          message_type?: string
          phone?: string
          active?: boolean
        }
      }
      chats: {
        Row: {
          id: number
          conversation_id: string
          phone: string
          app: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          conversation_id: string
          phone: string
          app: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          conversation_id?: string
          phone?: string
          app?: string
          created_at?: string
          updated_at?: string
        }
      }
      dados_cliente: {
        Row: {
          id: number
          nome: string
          email: string
          telefone: string
          created_at: string
        }
        Insert: {
          id?: number
          nome: string
          email: string
          telefone: string
          created_at?: string
        }
        Update: {
          id?: number
          nome?: string
          email?: string
          telefone?: string
          created_at?: string
        }
      }
      documents: {
        Row: {
          id: number
          title: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          title: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      n8n_chat_histories: {
        Row: {
          id: number
          conversation_id: string
          phone: string
          data: string
          created_at: string
        }
        Insert: {
          id?: number
          conversation_id: string
          phone: string
          data: string
          created_at?: string
        }
        Update: {
          id?: number
          conversation_id?: string
          phone?: string
          data?: string
          created_at?: string
        }
      }
      pausa_bot: {
        Row: {
          id: number
          phone: string
          status: string
          data: string
          number: string
        }
        Insert: {
          id?: number
          phone: string
          status: string
          data: string
          number: string
        }
        Update: {
          id?: number
          phone?: string
          status?: string
          data?: string
          number?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 