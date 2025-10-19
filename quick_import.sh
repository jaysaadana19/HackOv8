#!/bin/bash
# Hackov8 Database Import - Quick Start Script
# Run this in your PRODUCTION environment after uploading database_export folder

set -e  # Exit on error

echo "=============================================================================="
echo "HACKOV8 DATABASE IMPORT - PRODUCTION"
echo "=============================================================================="
echo ""

# Check if database_export directory exists
if [ ! -d "/app/database_export" ]; then
    echo "❌ ERROR: /app/database_export directory not found!"
    echo "Please upload the database_export folder to /app/ first."
    exit 1
fi

echo "✅ Found database_export directory"
echo ""

# Check if import script exists
if [ ! -f "/app/import_database.py" ]; then
    echo "❌ ERROR: /app/import_database.py not found!"
    echo "Please ensure import_database.py is in /app/ directory."
    exit 1
fi

echo "✅ Found import script"
echo ""

# Show what will be imported
echo "📦 Collections to import:"
ls -1 /app/database_export/*.json | grep -v metadata | while read file; do
    collection=$(basename "$file" .json)
    count=$(python3 -c "import json; print(len(json.load(open('$file'))))")
    echo "   - $collection: $count documents"
done
echo ""

# Ask for confirmation
read -p "⚠️  This will import data into the production database. Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Import cancelled"
    exit 0
fi

echo ""
echo "🚀 Starting import..."
echo ""

# Run import script
python3 /app/import_database.py

echo ""
echo "=============================================================================="
echo "POST-IMPORT STEPS"
echo "=============================================================================="
echo ""
echo "1️⃣  Restart backend service:"
echo "   sudo supervisorctl restart backend"
echo ""
echo "2️⃣  Restart frontend service (optional):"
echo "   sudo supervisorctl restart frontend"
echo ""
echo "3️⃣  Verify data import:"
echo "   python3 /app/verify_database.py"
echo ""
echo "4️⃣  Test the application:"
echo "   - Visit: https://hackov8-1.emergent.host"
echo "   - Login with: jaysaadana@gmail.com / Welcome@123"
echo "   - Check Social Winter Of Code shows 304 registrations"
echo ""
echo "=============================================================================="
echo "✅ IMPORT SCRIPT COMPLETED"
echo "=============================================================================="
