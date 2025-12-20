// FUXICO - Edge Function de Sincronização com Bitrix24
// Versão 2.0 - Com endpoints GET para buscar dados reais

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
  action: 'sync_contact' | 'register_activity' | 'create_deal' | 'send_notification' | 
          'get_contacts' | 'get_activities' | 'get_deals'
  data: Record<string, unknown>
}

// ============================================
// BITRIX24 API CLIENT
// ============================================

class Bitrix24Client {
  private webhookUrl: string

  constructor(webhookUrl: string) {
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
  // CONTATOS - GET
  // ============================================

  async getContacts(limit = 50): Promise<Array<{
    id: string
    name: string
    email: string
    phone?: string
    company?: string
    source?: string
    lastActivity?: string
  }>> {
    const result = await this.call('crm.contact.list', {
      select: ['ID', 'NAME', 'LAST_NAME', 'EMAIL', 'PHONE', 'COMPANY_TITLE', 'SOURCE_ID', 'DATE_MODIFY'],
      order: { 'DATE_MODIFY': 'DESC' },
      start: 0,
    }) as Array<{
      ID: string
      NAME: string
      LAST_NAME: string
      EMAIL: Array<{ VALUE: string }>
      PHONE: Array<{ VALUE: string }>
      COMPANY_TITLE: string
      SOURCE_ID: string
      DATE_MODIFY: string
    }>

    return (result || []).slice(0, limit).map(contact => ({
      id: contact.ID,
      name: `${contact.NAME || ''} ${contact.LAST_NAME || ''}`.trim() || 'Sem nome',
      email: contact.EMAIL?.[0]?.VALUE || '',
      phone: contact.PHONE?.[0]?.VALUE,
      company: contact.COMPANY_TITLE,
      source: contact.SOURCE_ID,
      lastActivity: contact.DATE_MODIFY,
    }))
  }

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
  // ATIVIDADES - GET
  // ============================================

  async getActivities(limit = 50): Promise<Array<{
    id: string
    type: 'email_open' | 'link_click' | 'document_view' | 'email_sent'
    subject: string
    contactId: string
    contactName: string
    timestamp: string
  }>> {
    // Buscar atividades com filtro FUXICO
    const result = await this.call('crm.activity.list', {
      filter: {
        'DIRECTION': 1, // Incoming
      },
      select: ['ID', 'TYPE_ID', 'SUBJECT', 'OWNER_ID', 'CREATED', 'DESCRIPTION'],
      order: { 'CREATED': 'DESC' },
      start: 0,
    }) as Array<{
      ID: string
      TYPE_ID: string
      SUBJECT: string
      OWNER_ID: string
      CREATED: string
      DESCRIPTION: string
    }>

    // Filtrar apenas atividades do FUXICO (baseado na descrição)
    const fuxicoActivities = (result || [])
      .filter(a => a.DESCRIPTION?.includes('FUXICO') || a.SUBJECT?.includes('FUXICO'))
      .slice(0, limit)

    // Mapear tipo reverso
    const typeReverseMap: Record<string, 'email_open' | 'link_click' | 'document_view' | 'email_sent'> = {
      '4': 'email_open',
      '6': 'link_click',
      '7': 'document_view',
    }

    // Buscar nomes dos contatos
    const contactIds = [...new Set(fuxicoActivities.map(a => a.OWNER_ID))]
    const contactNames: Record<string, string> = {}
    
    if (contactIds.length > 0) {
      const contacts = await this.call('crm.contact.list', {
        filter: { 'ID': contactIds },
        select: ['ID', 'NAME', 'LAST_NAME'],
      }) as Array<{ ID: string; NAME: string; LAST_NAME: string }>
      
      contacts?.forEach(c => {
        contactNames[c.ID] = `${c.NAME || ''} ${c.LAST_NAME || ''}`.trim()
      })
    }

    return fuxicoActivities.map(activity => ({
      id: activity.ID,
      type: typeReverseMap[activity.TYPE_ID] || 'email_open',
      subject: activity.SUBJECT,
      contactId: activity.OWNER_ID,
      contactName: contactNames[activity.OWNER_ID] || 'Contato desconhecido',
      timestamp: activity.CREATED,
    }))
  }

  async createActivity(data: {
    contactId: number
    type: 'email_open' | 'link_click' | 'document_view' | 'email_sent'
    subject: string
    description: string
    completed?: boolean
  }): Promise<number> {
    const typeMap: Record<string, number> = {
      'email_open': 4,
      'link_click': 6,
      'document_view': 7,
      'email_sent': 4,
    }

    const result = await this.call('crm.activity.add', {
      fields: {
        OWNER_TYPE_ID: 3,
        OWNER_ID: data.contactId,
        TYPE_ID: typeMap[data.type] || 4,
        SUBJECT: data.subject,
        DESCRIPTION: `[FUXICO] ${data.description}`,
        COMPLETED: data.completed ? 'Y' : 'N',
        DIRECTION: 1,
        START_TIME: new Date().toISOString(),
        END_TIME: new Date().toISOString(),
        COMMUNICATIONS: [],
      },
    }) as number

    return result
  }

  // ============================================
  // NEGÓCIOS (DEALS) - GET
  // ============================================

  async getDeals(limit = 50): Promise<Array<{
    id: string
    title: string
    contactId: string
    contactName: string
    stage: string
    value?: number
    currency?: string
    createdAt: string
  }>> {
    const result = await this.call('crm.deal.list', {
      filter: { 'SOURCE_ID': 'FUXICO' },
      select: ['ID', 'TITLE', 'CONTACT_ID', 'STAGE_ID', 'OPPORTUNITY', 'CURRENCY_ID', 'DATE_CREATE'],
      order: { 'DATE_CREATE': 'DESC' },
      start: 0,
    }) as Array<{
      ID: string
      TITLE: string
      CONTACT_ID: string
      STAGE_ID: string
      OPPORTUNITY: string
      CURRENCY_ID: string
      DATE_CREATE: string
    }>

    const deals = (result || []).slice(0, limit)

    // Buscar nomes dos contatos
    const contactIds = [...new Set(deals.map(d => d.CONTACT_ID).filter(Boolean))]
    const contactNames: Record<string, string> = {}
    
    if (contactIds.length > 0) {
      const contacts = await this.call('crm.contact.list', {
        filter: { 'ID': contactIds },
        select: ['ID', 'NAME', 'LAST_NAME'],
      }) as Array<{ ID: string; NAME: string; LAST_NAME: string }>
      
      contacts?.forEach(c => {
        contactNames[c.ID] = `${c.NAME || ''} ${c.LAST_NAME || ''}`.trim()
      })
    }

    // Buscar nomes dos estágios
    const stageNames: Record<string, string> = {}
    try {
      const stages = await this.call('crm.status.list', {
        filter: { 'ENTITY_ID': 'DEAL_STAGE' },
      }) as Array<{ STATUS_ID: string; NAME: string }>
      
      stages?.forEach(s => {
        stageNames[s.STATUS_ID] = s.NAME
      })
    } catch (e) {
      // Log removido
    }

    return deals.map(deal => ({
      id: deal.ID,
      title: deal.TITLE,
      contactId: deal.CONTACT_ID,
      contactName: contactNames[deal.CONTACT_ID] || 'Sem contato',
      stage: stageNames[deal.STAGE_ID] || deal.STAGE_ID,
      value: parseFloat(deal.OPPORTUNITY) || undefined,
      currency: deal.CURRENCY_ID,
      createdAt: deal.DATE_CREATE,
    }))
  }

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
    await this.call('im.notify.system.add', {
      USER_ID: 1,
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar configuração do Bitrix24
    const { data: userPrefs } = await supabase
      .from('user_preferences')
      .select('bitrix24_config')
      .eq('user_id', user.id)
      .maybeSingle()

    const bitrixConfig = userPrefs?.bitrix24_config as Bitrix24Config | null

    if (!bitrixConfig?.webhook_url) {
      return new Response(JSON.stringify({ 
        error: 'Bitrix24 not configured',
        message: 'Configure o webhook do Bitrix24 nas configurações',
        useMock: true
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const bitrix = new Bitrix24Client(bitrixConfig.webhook_url)

    const body = await req.json() as SyncRequest

    let result: Record<string, unknown> = {}

    // ============================================
    // AÇÕES
    // ============================================

    switch (body.action) {
      // GET CONTACTS
      case 'get_contacts': {
        const limit = (body.data?.limit as number) || 50
        const contacts = await bitrix.getContacts(limit)
        result = { success: true, contacts }
        break
      }

      // GET ACTIVITIES
      case 'get_activities': {
        const limit = (body.data?.limit as number) || 50
        const activities = await bitrix.getActivities(limit)
        result = { success: true, activities }
        break
      }

      // GET DEALS
      case 'get_deals': {
        const limit = (body.data?.limit as number) || 50
        const deals = await bitrix.getDeals(limit)
        result = { success: true, deals }
        break
      }

      // SYNC CONTACT
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

        let contactId = await bitrix.findContactByEmail(email)
        let isNew = false

        if (!contactId) {
          contactId = await bitrix.createContact({ email, name, lastName, phone, company })
          isNew = true
          // Log removido - sincronização silenciosa
        } else {
          // Log removido - sincronização silenciosa
        }

        result = {
          success: true,
          contactId,
          isNew,
          message: isNew ? 'Contato criado no Bitrix24' : 'Contato já existente no Bitrix24',
        }
        break
      }

      // REGISTER ACTIVITY
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

        const activityId = await bitrix.createActivity({
          contactId: finalContactId,
          type,
          subject,
          description,
          completed: true,
        })

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

      // CREATE DEAL
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

      // SEND NOTIFICATION
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: errorMessage,
      useMock: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
