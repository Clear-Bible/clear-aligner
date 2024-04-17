
# Get rid of existing modules folder & yarn.lock file
rm -rf node_modules yarn.lock

# Install the node dependencies
yarn install

# Rebuild any modules that need it
yarn electron-rebuild
