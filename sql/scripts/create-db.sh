#!/bin/bash -e
pushd "$(dirname "$0")" || exit

if [[ "$*" == *'-h'* || "$*" == *'--help'* ]]; then
  echo "Usage: ${0} [-h|--help] [--no-remove]"
  exit 0
fi

templateDbPath="../clear-aligner-template.sqlite"

if [[ -f "${templateDbPath}" && "$*" == *'--no-remove'* ]]; then
  echo "Template database already exists: '${templateDbPath}' (not recreating)."

else
  echo "Creating template database: '${templateDbPath}'..."

  rm -fv "${templateDbPath}"
  rm -fv "${templateDbPath}-shm"
  rm -fv "${templateDbPath}-wal"
  rm -fv "${templateDbPath}-journal"
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
  rm -fv "${templateDbPath}-shm"
  rm -fv "${templateDbPath}-wal"
  rm -fv "${templateDbPath}-journal"

  echo "...Template database created: '${templateDbPath}'."
fi

defaultDbPath="../projects/clear-aligner-00000000-0000-4000-8000-000000000000.sqlite"

if [[ -f "${defaultDbPath}" && "$*" == *'--no-remove'* ]]; then
  echo "Default database already exists: '${defaultDbPath}' (not recreating)."

else
  echo "Creating default database: '${defaultDbPath}'..."

  rm -fv "${defaultDbPath}"
  rm -fv "${defaultDbPath}-shm"
  rm -fv "${defaultDbPath}-wal"
  rm -fv "${defaultDbPath}-journal"
  cp -fv "${templateDbPath}" \
    "${defaultDbPath}"
  python3 ./create-db.py \
    -of "${defaultDbPath}" \
    -cf '../../src/tsv/target_BSB_20240904.tsv' \
    -ci 'target_BSB' \
    -cn 'BSB' \
    -cfn "Berean Standard Bible" \
    -cs 'targets' \
    -cl 'eng' \
    -ctd 'ltr'\
    -cff '' \
    -cif 'id'
  python3 ./create-db.py \
    -of "${defaultDbPath}" \
    -sf 'finalize-db.sql'
  rm -fv "${defaultDbPath}-shm"
  rm -fv "${defaultDbPath}-wal"
  rm -fv "${defaultDbPath}-journal"

  echo "...Default database created: '${defaultDbPath}'."
fi

userDbPath="../clear-aligner-user.sqlite"

if [[ -f "${userDbPath}" && "$*" == *'--no-remove'* ]]; then
  echo "User database already exists: '${userDbPath}' (not recreating)."

else
  echo "Creating user database: '${userDbPath}'..."

  rm -fv "${userDbPath}"
  rm -fv "${userDbPath}-shm"
  rm -fv "${userDbPath}-wal"
  rm -fv "${userDbPath}-journal"
  python3 ./create-db.py \
    -of "${userDbPath}" \
    -sf "create-user-db.sql"
  python3 ./create-db.py \
    -of "${userDbPath}" \
    -sf 'finalize-db.sql'
  rm -fv "${userDbPath}-shm"
  rm -fv "${userDbPath}-wal"
  rm -fv "${userDbPath}-journal"

  echo "...User database created: '${userDbPath}'."
fi

popd
