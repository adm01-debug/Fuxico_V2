// FUXICO - Edge Function de Sincronização com Bitrix24
// Integração completa: Contatos, Atividades e Negócios

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================
// TIPOS
// ============================================

interface Bitrix24Config {
  webhook_url: string
  auto_sync_contacts: boolean
  auto_register_activities: boolean
  auto_create_deals: boolean
  send_notifications: boolean
  default_deal_stage: string
  default_deal_category: string
}

interface SyncRequest {
  action: 'sync_contact' | 'register_activity' | 'create_deal' | 'send_notification'
  data: Record<string, unknown>
}

// ============================================
// BITRIX24 API CLIENT
// ============================================

class Bitrix24Client {
  private webhookUrl: string

  constructor(webhookUrl: string) {
    // Garantir que a URL termina sem barra
    this.webhookUrl = webhookUrl.replace(/\/$/, '')
  }

  private async call(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    const url = `${this.webhookUrl}/${method}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Bitrix24 API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`Bitrix24 error: ${data.error_description || data.error}`)
    }

    return data.result
  }

  // ============================================
  // CONTATOS
  // ============================================

  async findContactByEmail(email: string): Promise<number | null> {
    const result = await this.call('crm.contact.list', {
      filter: { 'EMAIL': email },
      select: ['ID', 'NAME', 'LAST_NAME', 'EMAIL'],
    }) as Array<{ ID: string }>

    if (result && result.length > 0) {
      return parseInt(result[0].ID)
    }
    return null
  }

  async createContact(data: {
    email: string
    name?: string
    lastName?: string
    phone?: string
    company?: string
    source?: string
  }): Promise<number> {
    // Extrair nome do email se não fornecido
    const emailName = data.email.split('@')[0]
    const nameParts = emailName.replace(/[._-]/g, ' ').split(' ')
    
    const result = await this.call('crm.contact.add', {
      fields: {
        NAME: data.name || nameParts[0] || 'Contato',
        LAST_NAME: data.lastName || nameParts.slice(1).join(' ') || '',
        EMAIL: [{ VALUE: data.email, VALUE_TYPE: 'WORK' }],
        PHONE: data.phone ? [{ VALUE: data.phone, VALUE_TYPE: 'WORK' }] : undefined,
        COMPANY_TITLE: data.company,
        SOURCE_ID: data.source || 'FUXICO',
        COMMENTS: 'Contato criado automaticamente pelo FUXICO',
      },
    }) as number

    return result
  }

  async updateContact(contactId: number, data: Record<string, unknown>): Promise<boolean> {
    await this.call('crm.contact.update', {
      id: contactId,
      fields: data,
    })
    return true
  }

  // ============================================
  // ATIVIDADES
  // ============================================

  async createActivity(data: {
    contactId: number
    type: 'email_open' | 'link_click' | 'document_view' | 'email_sent'
    subject: string
    description: string
    completed?: boolean
  }): Promise<number> {
    // Mapear tipo para tipo de atividade do Bitrix24
    const typeMap: Record<string, number> = {
      'email_open': 4,      // Email
      'link_click': 6,      // Meeting (usando como clique)
      'document_view': 7,   // Call (usando como visualização)
      'email_sent': 4,      // Email
    }

    const result = await this.call('crm.activity.add', {
      fields: {
        OWNER_TYPE_ID: 3, // Contact
        OWNER_ID: data.contactId,
        TYPE_ID: typeMap[data.type] || 4,
        SUBJECT: data.subject,
        DESCRIPTION: data.description,
        COMPLETED: data.completed ? 'Y' : 'N',
        DIRECTION: 1, // Incoming
        START_TIME: new Date().toISOString(),
        END_TIME: new Date().toISOString(),
        COMMUNICATIONS: [],
        SETTINGS: {
          SOURCE: 'FUXICO',
        },
      },
    }) as number

    return result
  }

  // ============================================
  // NEGÓCIOS (DEALS)
  // ============================================

  async findDealByContact(contactId: number): Promise<number | null> {
    const result = await this.call('crm.deal.list', {
      filter: { 'CONTACT_ID': contactId },
      select: ['ID', 'TITLE', 'STAGE_ID'],
      order: { 'DATE_CREATE': 'DESC' },
    }) as Array<{ ID: string }>

    if (result && result.length > 0) {
      return parseInt(result[0].ID)
    }
    return null
  }

  async createDeal(data: {
    contactId: number
    title: string
    stageId?: string
    categoryId?: string
    value?: number
    currency?: string
    source?: string
  }): Promise<number> {
    const result = await this.call('crm.deal.add', {
      fields: {
        TITLE: data.title,
        STAGE_ID: data.stageId || 'NEW',
        CATEGORY_ID: data.categoryId || '0',
        CONTACT_ID: data.contactId,
        OPPORTUNITY: data.value || 0,
        CURRENCY_ID: data.currency || 'BRL',
        SOURCE_ID: data.source || 'FUXICO',
        COMMENTS: 'Negócio criado automaticamente pelo FUXICO após interação por email',
      },
    }) as number

    return result
  }

  async updateDeal(dealId: number, data: Record<string, unknown>): Promise<boolean> {
    await this.call('crm.deal.update', {
      id: dealId,
      fields: data,
    })
    return true
  }

  // ============================================
  // NOTIFICAÇÕES
  // ============================================

  async sendNotification(userId: number, message: string): Promise<boolean> {
    await this.call('im.notify.personal.add', {
      USER_ID: userId,
      MESSAGE: message,
    })
    return true
  }

  async sendSystemNotification(message: string): Promise<boolean> {
    // Enviar para todos os admins ou usuário padrão (ID 1)
    await this.call('im.notify.system.add', {
      USER_ID: 1, // Admin principal
      MESSAGE: message,
    })
    return true
  }
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Usar service role para operações
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar configuração do Bitrix24 do usuário
    const { data: userPrefs } = await supabase
      .from('user_preferences')
      .select('bitrix24_config')
      .eq('user_id', user.id)
      .maybeSingle()

    const bitrixConfig = userPrefs?.bitrix24_config as Bitrix24Config | null

    if (!bitrixConfig?.webhook_url) {
      return new Response(JSON.stringify({ 
        error: 'Bitrix24 not configured',
        message: 'Configure o webhook do Bitrix24 nas configurações'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const bitrix = new Bitrix24Client(bitrixConfig.webhook_url)

    // Parse do body
    const body = await req.json() as SyncRequest

    let result: Record<string, unknown> = {}

    // ============================================
    // AÇÕES
    // ============================================

    switch (body.action) {
      case 'sync_contact': {
        const { email, name, lastName, phone, company } = body.data as {
          email: string
          name?: string
          lastName?: string
          phone?: string
          company?: string
        }

        if (!email) {
          return new Response(JSON.stringify({ error: 'Email is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Verificar se contato já existe
        let contactId = await bitrix.findContactByEmail(email)
        let isNew = false

        if (!contactId) {
          // Criar novo contato
          contactId = await bitrix.createContact({ email, name, lastName, phone, company })
          isNew = true
          console.log(`[Bitrix24] Contato criado: ${contactId}`)
        } else {
          console.log(`[Bitrix24] Contato existente: ${contactId}`)
        }

        result = {
          success: true,
          contactId,
          isNew,
          message: isNew ? 'Contato criado no Bitrix24' : 'Contato já existente no Bitrix24',
        }
        break
      }

      case 'register_activity': {
        const { contactId, email, type, subject, description, trackingId } = body.data as {
          contactId?: number
          email?: string
          type: 'email_open' | 'link_click' | 'document_view' | 'email_sent'
          subject: string
          description: string
          trackingId?: string
        }

        if (!bitrixConfig.auto_register_activities) {
          result = { success: false, message: 'Registro de atividades desabilitado' }
          break
        }

        // Se não tem contactId, buscar pelo email
        let finalContactId = contactId
        if (!finalContactId && email) {
          finalContactId = await bitrix.findContactByEmail(email) || undefined

          // Se não encontrou e auto_sync_contacts está habilitado, criar
          if (!finalContactId && bitrixConfig.auto_sync_contacts) {
            finalContactId = await bitrix.createContact({ email })
          }
        }

        if (!finalContactId) {
          result = { success: false, message: 'Contato não encontrado' }
          break
        }

        const activityId = await bitrix.createActivity({
          contactId: finalContactId,
          type,
          subject,
          description,
          completed: true,
        })

        // Enviar notificação se habilitado
        if (bitrixConfig.send_notifications) {
          const notificationMsg = type === 'email_open' 
            ? `📬 ${email} abriu seu email: ${subject}`
            : type === 'link_click'
            ? `🔗 ${email} clicou em um link: ${subject}`
            : `📄 ${email} visualizou um documento: ${subject}`
          
          await bitrix.sendSystemNotification(notificationMsg).catch(() => {})
        }

        result = {
          success: true,
          activityId,
          contactId: finalContactId,
          message: 'Atividade registrada no Bitrix24',
        }
        break
      }

      case 'create_deal': {
        const { contactId, email, title, value, source } = body.data as {
          contactId?: number
          email?: string
          title: string
          value?: number
          source?: string
        }

        if (!bitrixConfig.auto_create_deals) {
          result = { success: false, message: 'Criação de negócios desabilitada' }
          break
        }

        // Buscar ou criar contato
        let finalContactId = contactId
        if (!finalContactId && email) {
          finalContactId = await bitrix.findContactByEmail(email) || undefined
          
          if (!finalContactId && bitrixConfig.auto_sync_contacts) {
            finalContactId = await bitrix.createContact({ email })
          }
        }

        if (!finalContactId) {
          result = { success: false, message: 'Contato não encontrado' }
          break
        }

        // Verificar se já existe deal para este contato
        const existingDealId = await bitrix.findDealByContact(finalContactId)
        
        if (existingDealId) {
          result = {
            success: true,
            dealId: existingDealId,
            isNew: false,
            message: 'Negócio já existente para este contato',
          }
          break
        }

        const dealId = await bitrix.createDeal({
          contactId: finalContactId,
          title,
          stageId: bitrixConfig.default_deal_stage,
          categoryId: bitrixConfig.default_deal_category,
          value,
          source,
        })

        result = {
          success: true,
          dealId,
          contactId: finalContactId,
          isNew: true,
          message: 'Negócio criado no Bitrix24',
        }
        break
      }

      case 'send_notification': {
        const { message, userId } = body.data as {
          message: string
          userId?: number
        }

        if (!bitrixConfig.send_notifications) {
          result = { success: false, message: 'Notificações desabilitadas' }
          break
        }

        if (userId) {
          await bitrix.sendNotification(userId, message)
        } else {
          await bitrix.sendSystemNotification(message)
        }

        result = { success: true, message: 'Notificação enviada' }
        break
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in bitrix24-sync function:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
