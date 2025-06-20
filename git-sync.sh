#!/bin/bash

# Delete any leftover lock files if they exist
rm -f .git/index.lock
rm -f .git/refs/remotes/origin/main.lock

echo "🔄 Fetching latest changes from GitHub..."
git fetch origin main

echo "📥 Rebasing local changes on top of latest remote..."
git pull --rebase origin main

# Check for conflict markers in the JSON file
if grep -q "<<<<<<<" available-times.json; then
  echo "⚠️ Merge conflict detected in available-times.json"
  echo "Please resolve the conflict manually before continuing."
else
  echo "✅ Synced successfully. Ready to work!"
fi
