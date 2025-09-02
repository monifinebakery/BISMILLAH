#!/bin/bash

# ==============================================
# Script: Create pemakaian_bahan_daily_mv
# Description: Creates materialized view for daily COGS aggregation
# ==============================================

echo "🔄 Creating pemakaian_bahan_daily_mv materialized view..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if SQL file exists
SQL_FILE="database/materialized_views/pemakaian_bahan_daily_mv.sql"
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Error: SQL file not found: $SQL_FILE"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set. Checking .env.local..."
    
    if [ -f ".env.local" ]; then
        echo "📄 Loading environment from .env.local"
        export $(grep -v '^#' .env.local | xargs)
    else
        echo "❌ Error: No .env.local file found and DATABASE_URL not set"
        echo "Please set DATABASE_URL environment variable or create .env.local file"
        exit 1
    fi
fi

# Validate DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL is still not set after loading environment"
    exit 1
fi

echo "✅ Database URL found"
echo "🔄 Executing SQL script..."

# Execute the SQL file
if command -v psql >/dev/null 2>&1; then
    # Use psql if available
    psql "$DATABASE_URL" -f "$SQL_FILE"
    if [ $? -eq 0 ]; then
        echo "✅ Successfully created pemakaian_bahan_daily_mv!"
        echo ""
        echo "📊 Testing the materialized view..."
        
        # Test query to verify it works
        psql "$DATABASE_URL" -c "SELECT COUNT(*) as total_records, COUNT(DISTINCT user_id) as unique_users FROM public.pemakaian_bahan_daily_mv;"
        
        if [ $? -eq 0 ]; then
            echo "✅ Materialized view is working correctly!"
            echo ""
            echo "🔧 Next steps:"
            echo "   • The materialized view will be used automatically by profit analysis"
            echo "   • To refresh data: SELECT public.refresh_pemakaian_daily_mv();"
            echo "   • View performance with: \\d+ pemakaian_bahan_daily_mv"
        else
            echo "⚠️  Materialized view created but test query failed"
        fi
    else
        echo "❌ Error executing SQL script"
        exit 1
    fi
else
    echo "❌ Error: psql command not found"
    echo "Please install PostgreSQL client tools or use Supabase SQL Editor"
    echo ""
    echo "📋 Manual steps:"
    echo "   1. Open Supabase SQL Editor"
    echo "   2. Copy and paste the contents of: $SQL_FILE"
    echo "   3. Execute the query"
    exit 1
fi
