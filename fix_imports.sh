#!/bin/bash
find app -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 | while IFS= read -r -d '' file; do
  sed -i '' 's/from '"'"'~\/components\//from '"'"'~\/shared\/components\//g' "$file"
  sed -i '' 's/from '"'"'~\/hooks\//from '"'"'~\/shared\/hooks\//g' "$file"
  sed -i '' 's/from '"'"'~\/constants\//from '"'"'~\/shared\/constants\//g' "$file"
  sed -i '' 's/from '"'"'~\/stores\//from '"'"'~\/shared\/stores\//g' "$file"
  
  sed -i '' 's/from '"'"'~\/lib\/prisma'"'"'/from '"'"'~\/core\/db.server'"'"'/g' "$file"
  sed -i '' 's/from '"'"'~\/lib\/logger.server'"'"'/from '"'"'~\/core\/logger.server'"'"'/g' "$file"
  sed -i '' 's/from '"'"'~\/lib\/gcloud-logging.server'"'"'/from '"'"'~\/core\/gcloud-logging.server'"'"'/g' "$file"
  sed -i '' 's/from '"'"'~\/lib\/firebase.client'"'"'/from '"'"'~\/core\/firebase.client'"'"'/g' "$file"
  
  # For the rest of lib imports
  sed -i '' 's/from '"'"'~\/lib\//from '"'"'~\/shared\/lib\//g' "$file"
done
