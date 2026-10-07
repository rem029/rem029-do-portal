#!/bin/bash

# Navigate to the apps directory
cd apps || exit

# Iterate through each subdirectory in apps
for d in */ ; do
    echo "Running yarn install in $d..."
    cd "$d" || continue # If the directory doesn't exist, skip to the next one
    yarn install # Run yarn install
    cd .. # Go back to the apps directory
done

# Optionally, go back to the project root and run yarn install there as well
echo "Running yarn install in project root..."
cd ..
yarn install
