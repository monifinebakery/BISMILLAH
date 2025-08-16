#!/bin/bash

# Auto Push Script for BISMILLAH Project
# Usage: ./auto-push.sh [optional-message]

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Auto Push to GitHub${NC}"
echo "=================================="

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    exit 1
fi

# Check if there are any changes
if git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}📝 No changes to commit${NC}"
    echo -e "${GREEN}✅ Repository is up to date${NC}"
    exit 0
fi

# Get current branch
BRANCH=$(git branch --show-current)
echo -e "${BLUE}📍 Current branch: ${BRANCH}${NC}"

# Add all changes
echo -e "${YELLOW}📦 Adding all changes...${NC}"
git add -A

# Generate commit message
if [ -n "$1" ]; then
    # Use provided message
    COMMIT_MSG="$1"
else
    # Auto-generate commit message based on changed files
    CHANGED_FILES=$(git diff --cached --name-only)
    FILE_COUNT=$(echo "$CHANGED_FILES" | wc -l | xargs)
    
    # Get current timestamp
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Determine commit type based on file changes
    if echo "$CHANGED_FILES" | grep -q "package.json\|package-lock.json"; then
        COMMIT_TYPE="📦 deps:"
    elif echo "$CHANGED_FILES" | grep -q "\.tsx\?\|\.jsx\?"; then
        COMMIT_TYPE="✨ feat:"
    elif echo "$CHANGED_FILES" | grep -q "\.css\|\.scss\|\.sass"; then
        COMMIT_TYPE="💄 style:"
    elif echo "$CHANGED_FILES" | grep -q "\.md"; then
        COMMIT_TYPE="📝 docs:"
    elif echo "$CHANGED_FILES" | grep -q "test\|spec"; then
        COMMIT_TYPE="✅ test:"
    elif echo "$CHANGED_FILES" | grep -q "config\|\.env"; then
        COMMIT_TYPE="🔧 config:"
    else
        COMMIT_TYPE="🚀 update:"
    fi
    
    COMMIT_MSG="${COMMIT_TYPE} Auto-commit - ${FILE_COUNT} files updated

Updated files:
$(echo "$CHANGED_FILES" | sed 's/^/- /')

Auto-pushed at: ${TIMESTAMP}"
fi

# Commit changes
echo -e "${YELLOW}💾 Committing changes...${NC}"
git commit -m "$COMMIT_MSG"

# Push to remote
echo -e "${YELLOW}🔄 Pushing to origin/${BRANCH}...${NC}"
if git push origin "$BRANCH"; then
    echo ""
    echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
    echo -e "${GREEN}🎉 Branch: ${BRANCH}${NC}"
    echo -e "${GREEN}📝 Commit: $(git rev-parse --short HEAD)${NC}"
else
    echo -e "${RED}❌ Failed to push to GitHub${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔗 Check your changes at:${NC}"
echo -e "${BLUE}https://github.com/monifinebakery/BISMILLAH/tree/${BRANCH}${NC}"
