#!/bin/bash

# Build the web app
echo "Building the web application..."
npm run build

# Initialize Capacitor with the iOS platform
echo "Adding iOS platform to Capacitor..."
npx cap add ios

# Sync the web build with Capacitor
echo "Syncing web build with Capacitor..."
npx cap sync ios

echo "iOS setup complete. You can now run './capacitor-ios-open.sh' to open the project in Xcode."