#!/bin/bash

# Load environment variables from .env file
set -a
source ../../.env
set +a

# Run the ingest script
npx tsx ingestArcsRules.ts 