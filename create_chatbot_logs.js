import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createChatbotLogsTable() {
  try {
    console.log('Creating chatbot_logs table...');

    // First, check if table exists
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'chatbot_logs');

    if (checkError) {
      console.log('Error checking table:', checkError);
    }

    if (existingTables && existingTables.length > 0) {
      console.log('Table chatbot_logs already exists!');
      return;
    }

    // Create table using raw SQL
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS chatbot_logs (
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

        CREATE INDEX IF NOT EXISTS idx_chatbot_logs_user_id ON chatbot_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_chatbot_logs_created_at ON chatbot_logs(created_at DESC);

        ALTER TABLE chatbot_logs ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view their own chatbot logs" ON chatbot_logs
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert their own chatbot logs" ON chatbot_logs
          FOR INSERT WITH CHECK (auth.uid() = user_id);

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
      `
    });

    if (createError) {
      console.log('Error creating table:', createError);
    } else {
      console.log('Table chatbot_logs created successfully!');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

createChatbotLogsTable();
