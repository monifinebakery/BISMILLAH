-- Test script to verify chatbot_logs table exists and create if needed
DO $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chatbot_logs') THEN
        RAISE NOTICE 'Creating chatbot_logs table...';

        -- Create the table
        CREATE TABLE chatbot_logs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            message TEXT NOT NULL,
            response TEXT,
            intent TEXT,
            response_time DECIMAL,
            success BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Add indexes
        CREATE INDEX idx_chatbot_logs_user_id ON chatbot_logs(user_id);
        CREATE INDEX idx_chatbot_logs_created_at ON chatbot_logs(created_at DESC);

        -- Add RLS policies
        ALTER TABLE chatbot_logs ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view their own chatbot logs" ON chatbot_logs
            FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own chatbot logs" ON chatbot_logs
            FOR INSERT WITH CHECK (auth.uid() = user_id);

        -- Create trigger for updated_at
        CREATE OR REPLACE FUNCTION update_chatbot_logs_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER chatbot_logs_updated_at
            BEFORE UPDATE ON chatbot_logs
            FOR EACH ROW
            EXECUTE FUNCTION update_chatbot_logs_updated_at();

        RAISE NOTICE 'chatbot_logs table created successfully!';
    ELSE
        RAISE NOTICE 'chatbot_logs table already exists.';
    END IF;
END $$;
