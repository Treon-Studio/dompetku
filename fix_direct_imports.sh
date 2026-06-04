#!/bin/bash
find app -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 | while IFS= read -r -d '' file; do
  sed -i '' "s/from 'hooks\//from '~\/shared\/hooks\//g" "$file"
  sed -i '' "s/from 'lib\//from '~\/shared\/lib\//g" "$file"
  sed -i '' "s/from 'constants\//from '~\/shared\/constants\//g" "$file"
  
  # Also handle double quotes if any
  sed -i '' "s/from \"hooks\//from \"~\/shared\/hooks\//g" "$file"
  sed -i '' "s/from \"lib\//from \"~\/shared\/lib\//g" "$file"
  sed -i '' "s/from \"constants\//from \"~\/shared\/constants\//g" "$file"
done
