#!/bin/bash -e
pushd "$(dirname "$0")" || exit

templateDbFile="../clear-aligner-template.sqlite"
templateDbPath=$(realpath "${templateDbFile}")

if [[ "$*" == *'-h'* || "$*" == *'--help'* ]]; then
  echo "Usage: ${0} [-h|--help] [--no-remove]"
  exit 0
fi

if [[ -f "${templateDbPath}" && "$*" == *'--no-remove'* ]]; then
  echo "Template database already exists: '${templateDbPath}' (not recreating)."

else
  echo "Creating template database: '${templateDbPath}'..."

  rm -fv "${templateDbPath}"
  python3 ./create-db.py \
    -of "${templateDbPath}" \
    -sf "create-template-db.sql"
  python3 ./create-db.py \
    -of "${templateDbPath}" \
    -cf '../../src/tsv/source_macula_hebrew.tsv' \
    -ci 'wlc-hebot' \
    -cn 'WLC' \
    -cfn 'Macula Hebrew Old Testament' \
    -cs 'sources' \
    -cl 'heb' \
    -ctd 'rtl'\
    -cff 'sbl-hebrew'
  python3 ./create-db.py \
    -of "${templateDbPath}" \
    -cf '../../src/tsv/source_macula_greek_SBLGNT.tsv' \
    -ci 'sbl-gnt' \
    -cn 'SBLGNT' \
    -cfn 'SBL Greek New Testament' \
    -cs 'sources' \
    -cl 'grc' \
    -ctd 'ltr'\
    -cff ''
  python3 ./create-db.py \
    -of "${templateDbPath}" \
    -sf 'finalize-db.sql'

  echo "...Template database created: '${templateDbPath}'."
fi

defaultDbFile="../projects/clear-aligner-default.sqlite"
defaultDbPath=$(realpath "${defaultDbFile}")

if [[ -f "${defaultDbPath}" && "$*" == *'--no-remove'* ]]; then
  echo "Default database already exists: '${defaultDbPath}' (not recreating)."

else
  echo "Creating default database: '${defaultDbPath}'..."

  rm -fv "${defaultDbPath}"
  cp -fv "${templateDbPath}" \
    "${defaultDbPath}"
  python3 ./create-db.py \
    -of "${defaultDbPath}" \
    -cf '../../src/tsv/ylt-new.tsv' \
    -ci 'ylt-new' \
    -cn 'YLT' \
    -cfn "Young's Literal Translation" \
    -cs 'targets' \
    -cl 'eng' \
    -ctd 'ltr'\
    -cff '' \
    -cif 'id'
  python3 ./create-db.py \
    -of "${defaultDbPath}" \
    -sf 'finalize-db.sql'

  echo "...Default database created: '${defaultDbPath}'."
fi

userDbFile="../clear-aligner-user.sqlite"
userDbPath=$(realpath "${userDbFile}")

if [[ -f "${userDbPath}" && "$*" == *'--no-remove'* ]]; then
  echo "User database already exists: '${userDbPath}' (not recreating)."

else
  echo "Creating user database: '${userDbPath}'..."

  rm -fv "${userDbPath}"
  python3 ./create-db.py \
    -of "${userDbPath}" \
    -sf "create-user-db.sql"
  python3 ./create-db.py \
    -of "${userDbPath}" \
    -sf 'finalize-db.sql'

  echo "...User database created: '${userDbPath}'."
fi

popd