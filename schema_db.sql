-- =====================================================
-- SCHEMA COMPLETO PARA SISTEMA DE CONVERSAS COM IA
-- =====================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- 1. TABELA DE PLANOS
-- =====================================================
CREATE TABLE public.plans (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    token_limit INTEGER NOT NULL, -- Limite mensal de tokens
    price_cents INTEGER NOT NULL DEFAULT 0, -- Preço em centavos
    max_users INTEGER, -- Limite de usuários (NULL = ilimitado)
    max_conversations_per_user INTEGER DEFAULT 50,
    features JSONB DEFAULT '{}', -- Features específicas do plano
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT plans_pkey PRIMARY KEY (id),
    CONSTRAINT plans_name_unique UNIQUE (name),
    CONSTRAINT plans_token_limit_positive CHECK (token_limit > 0),
    CONSTRAINT plans_price_non_negative CHECK (price_cents >= 0)
);

-- =====================================================
-- 2. TABELA DE EMPRESAS
-- =====================================================
CREATE TABLE public.companies (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL, -- Para URLs amigáveis
    email VARCHAR(255),
    phone VARCHAR(20),
    plan_id UUID NOT NULL,
    plan_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    plan_expires_at TIMESTAMPTZ, -- NULL para planos perpétuos
    tokens_consumed_current_period INTEGER DEFAULT 0,
    tokens_consumed_total BIGINT DEFAULT 0,
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly, custom
    status VARCHAR(20) DEFAULT 'active',
    settings JSONB DEFAULT '{}', -- Configurações específicas da empresa
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT companies_pkey PRIMARY KEY (id),
    CONSTRAINT companies_slug_unique UNIQUE (slug),
    CONSTRAINT companies_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES plans(id),
    CONSTRAINT companies_status_check CHECK (status IN ('active', 'suspended', 'cancelled')),
    CONSTRAINT companies_billing_cycle_check CHECK (billing_cycle IN ('monthly', 'yearly', 'custom')),
    CONSTRAINT companies_tokens_non_negative CHECK (tokens_consumed_current_period >= 0)
);

-- =====================================================
-- 3. TABELA DE USUÁRIOS
-- =====================================================
CREATE TABLE public.users (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'user',
    permissions JSONB DEFAULT '[]', -- Permissões específicas
    preferences JSONB DEFAULT '{}', -- Preferências do usuário
    last_login_at TIMESTAMPTZ,
    email_verified_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_company_username_unique UNIQUE (company_id, username),
    CONSTRAINT users_role_check CHECK (role IN ('admin', 'manager', 'user', 'readonly'))
);

-- =====================================================
-- 4. TABELA DE CONVERSAS
-- =====================================================
CREATE TABLE public.conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    model VARCHAR(50) NOT NULL DEFAULT 'gpt-4.1', -- Modelo da IA usado
    system_prompt TEXT, -- Prompt do sistema para esta conversa
    temperature DECIMAL(2,1) DEFAULT 0.7, -- Parâmetros do modelo
    max_tokens INTEGER DEFAULT 4096,
    status VARCHAR(20) DEFAULT 'active',
    is_pinned BOOLEAN DEFAULT FALSE,
    is_shared BOOLEAN DEFAULT FALSE, -- Se a conversa pode ser compartilhada
    share_token VARCHAR(32), -- Token para compartilhamento público
    tags TEXT[], -- Tags para organização
    total_tokens_used INTEGER DEFAULT 0, -- Tokens usados nesta conversa
    message_count INTEGER DEFAULT 0, -- Contador de mensagens
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    archived_at TIMESTAMPTZ, -- Quando foi arquivada
    CONSTRAINT conversations_pkey PRIMARY KEY (id),
    CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT conversations_status_check CHECK (status IN ('active', 'archived', 'deleted')),
    CONSTRAINT conversations_temperature_range CHECK (temperature >= 0.0 AND temperature <= 2.0),
    CONSTRAINT conversations_tokens_non_negative CHECK (total_tokens_used >= 0)
);

-- =====================================================
-- 5. TABELA DE MENSAGENS
-- =====================================================
CREATE TABLE public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL,
    content JSONB NOT NULL, -- Conteúdo estruturado da mensagem
    content_text TEXT, -- Versão em texto puro para busca
    message_index INTEGER NOT NULL,
    parent_message_id UUID, -- Para ramificações de conversa
    tokens_used INTEGER DEFAULT 0, -- Tokens consumidos por esta mensagem
    model_used VARCHAR(50), -- Modelo específico usado para esta mensagem
    processing_time_ms INTEGER, -- Tempo de processamento em ms
    tool_calls JSONB, -- Chamadas de ferramentas/funções
    tool_results JSONB, -- Resultados das ferramentas
    attachments JSONB, -- Anexos (arquivos, imagens, etc.)
    feedback JSONB, -- Feedback do usuário (like/dislike, etc.)
    is_edited BOOLEAN DEFAULT FALSE,
    edit_history JSONB DEFAULT '[]', -- Histórico de edições
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT messages_pkey PRIMARY KEY (id),
    CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT messages_parent_message_id_fkey FOREIGN KEY (parent_message_id) REFERENCES messages(id),
    CONSTRAINT messages_conversation_id_message_index_unique UNIQUE (conversation_id, message_index),
    CONSTRAINT messages_role_check CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    CONSTRAINT messages_tokens_non_negative CHECK (tokens_used >= 0)
);

-- =====================================================
-- 6. TABELA DE USO DE TOKENS (AUDITORIA)
-- =====================================================
CREATE TABLE public.token_usage (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    user_id UUID NOT NULL,
    conversation_id UUID,
    message_id UUID,
    model VARCHAR(50) NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
    cost_cents INTEGER DEFAULT 0, -- Custo em centavos
    operation_type VARCHAR(30) DEFAULT 'chat', -- chat, completion, embedding, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT token_usage_pkey PRIMARY KEY (id),
    CONSTRAINT token_usage_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT token_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT token_usage_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT token_usage_message_id_fkey FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    CONSTRAINT token_usage_tokens_non_negative CHECK (input_tokens >= 0 AND output_tokens >= 0)
);

-- =====================================================
-- 7. TABELA DE SESSÕES DE USUÁRIO
-- =====================================================
CREATE TABLE public.user_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT user_sessions_pkey PRIMARY KEY (id),
    CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT user_sessions_token_hash_unique UNIQUE (token_hash)
);

-- =====================================================
-- 8. TABELA DE COMPARTILHAMENTOS
-- =====================================================
CREATE TABLE public.conversation_shares (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    shared_by_user_id UUID NOT NULL,
    share_token VARCHAR(32) NOT NULL,
    title VARCHAR(500), -- Título customizado para o compartilhamento
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255), -- Para compartilhamentos protegidos por senha
    expires_at TIMESTAMPTZ,
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT conversation_shares_pkey PRIMARY KEY (id),
    CONSTRAINT conversation_shares_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT conversation_shares_shared_by_user_id_fkey FOREIGN KEY (shared_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT conversation_shares_share_token_unique UNIQUE (share_token)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para companies
CREATE INDEX idx_companies_plan_id ON companies(plan_id);
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_slug ON companies(slug);

-- Índices para users
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Índices para conversations
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_is_pinned_true ON conversations(is_pinned) WHERE is_pinned;
CREATE INDEX idx_conversations_tags ON conversations USING GIN(tags);
CREATE INDEX idx_conversations_share_token ON conversations(share_token) WHERE share_token IS NOT NULL;

-- Índices para messages
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_parent_id ON messages(parent_message_id) WHERE parent_message_id IS NOT NULL;
CREATE INDEX idx_messages_content_text_gin ON messages USING GIN(to_tsvector('portuguese', content_text));
CREATE INDEX idx_messages_role ON messages(role);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Índices para token_usage
CREATE INDEX idx_token_usage_company_id ON token_usage(company_id);
CREATE INDEX idx_token_usage_user_id ON token_usage(user_id);
CREATE INDEX idx_token_usage_conversation_id ON token_usage(conversation_id);
CREATE INDEX idx_token_usage_created_at ON token_usage(created_at DESC);
CREATE INDEX idx_token_usage_model ON token_usage(model);

-- Índices para user_sessions
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);

-- Índices para conversation_shares
CREATE INDEX idx_conversation_shares_conversation_id ON conversation_shares(conversation_id);
CREATE INDEX idx_conversation_shares_share_token ON conversation_shares(share_token);
CREATE INDEX idx_conversation_shares_expires_at ON conversation_shares(expires_at);

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para extrair texto das mensagens
CREATE OR REPLACE FUNCTION extract_message_content_text()
RETURNS TRIGGER AS $$
BEGIN
    -- Extrai texto do conteúdo JSON
    IF NEW.content IS NOT NULL THEN
        NEW.content_text = COALESCE(NEW.content->>'text', NEW.content->>0, '');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar última mensagem da conversa
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET 
        last_message_at = NEW.created_at,
        message_count = message_count + 1,
        total_tokens_used = total_tokens_used + COALESCE(NEW.tokens_used, 0),
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para validar dados da conversa
CREATE OR REPLACE FUNCTION validate_conversation_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Valida se o usuário pode criar mais conversas
    IF TG_OP = 'INSERT' THEN
        DECLARE
            user_company_id UUID;
            company_plan_id UUID;
            max_conversations INTEGER;
            current_conversations INTEGER;
        BEGIN
            -- Busca dados da empresa e plano
            SELECT u.company_id, c.plan_id INTO user_company_id, company_plan_id
            FROM users u
            JOIN companies c ON c.id = u.company_id
            WHERE u.id = NEW.user_id;
            
            -- Busca limite de conversas do plano
            SELECT max_conversations_per_user INTO max_conversations
            FROM plans
            WHERE id = company_plan_id;
            
            -- Se há limite, verifica se não foi excedido
            IF max_conversations IS NOT NULL THEN
                SELECT COUNT(*) INTO current_conversations
                FROM conversations
                WHERE user_id = NEW.user_id AND status = 'active';
                
                IF current_conversations >= max_conversations THEN
                    RAISE EXCEPTION 'Limite de conversas excedido para este usuário';
                END IF;
            END IF;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Triggers para updated_at
CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers específicos
CREATE TRIGGER trg_extract_message_content_text BEFORE INSERT OR UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION extract_message_content_text();
CREATE TRIGGER trg_update_conversation_last_message AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();
CREATE TRIGGER trg_validate_conversation_data BEFORE INSERT OR UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION validate_conversation_data();

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Planos básicos
INSERT INTO plans (name, description, token_limit, price_cents, max_users, features) VALUES
('Gratuito', 'Plano gratuito com funcionalidades básicas', 10000, 0, 5, '{"basic_chat": true, "history_days": 7}'),
('Sifat AI Starter', 'Plano básico para pequenas equipes', 100000, 2900, 25, '{"basic_chat": true, "history_days": 30, "file_upload": true}'),
('Sifat AI PRO', 'Plano profissional para empresas', 500000, 9900, 100, '{"advanced_chat": true, "history_unlimited": true, "file_upload": true, "custom_models": true}'),
('Sifat AI Business', 'Plano empresarial com recursos avançados', 2000000, 29900, NULL, '{"enterprise_features": true, "priority_support": true, "custom_integration": true}');

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View para estatísticas da empresa
CREATE VIEW company_stats AS
SELECT 
    c.id,
    c.name,
    c.status,
    p.name as plan_name,
    c.tokens_consumed_current_period,
    p.token_limit,
    ROUND((c.tokens_consumed_current_period::DECIMAL / p.token_limit * 100), 2) as usage_percentage,
    (SELECT COUNT(*) FROM users WHERE company_id = c.id AND is_active = true) as active_users,
    (SELECT COUNT(*) FROM conversations conv JOIN users u ON conv.user_id = u.id WHERE u.company_id = c.id) as total_conversations,
    c.created_at,
    c.plan_started_at
FROM companies c
JOIN plans p ON p.id = c.plan_id;

-- View para conversas com estatísticas
CREATE VIEW conversation_details AS
SELECT 
    conv.id,
    conv.title,
    conv.status,
    conv.is_pinned,
    conv.message_count,
    conv.total_tokens_used,
    conv.last_message_at,
    u.first_name || ' ' || u.last_name as user_name,
    u.username,
    c.name as company_name,
    conv.created_at
FROM conversations conv
JOIN users u ON conv.user_id = u.id
JOIN companies c ON u.company_id = c.id;