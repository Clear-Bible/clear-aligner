# ClearAligner

ClearAligner is a cross-platform tool for working with Biblical alignment data.

Read the [public documentation](https://biblica.gitbook.io/clear-aligner) to learn more.

## Local development Quickstart

- Setup the environment variables (secrets)
  - Copy the `.env.template` file to `.env`
  - replace the sample values with the correct values
- Install dependencies: `source ./setup.sh`
- Build: `yarn build`
  - build for Windows: `yarn build:win`
  - build for Mac: `yarn build:mac`
- Run electron in dev mode: `yarn dev-electron`
  - **Note:** `yarn start` _will not work_, due to the use of platform-specific
    libraries (sqlite3) and main/renderer process IPC.

### Install electron build dependencies on Ubuntu 22.04

```bash
sudo apt-get install build-essential clang libdbus-1-dev libgtk-3-dev \
                       libnotify-dev libasound2-dev libcap-dev \
                       libcups2-dev libxtst-dev \
                       libxss1 libnss3-dev gcc-multilib g++-multilib curl \
                       gperf bison python3-dbusmock openjdk-8-jre \
                       libfuse2 sqlite3 python3 python3-regex fonts-roboto
```

### Run Electron AppImage on Ubuntu 20.04+ - requires fuse

- requires `libfuse2` package

## The Template, Default, and User Databases

These database files are the basis of all project databases and included with the platform
builds. These files are:

```
sql/clear-aligner-template.sqlite
sql/clear-aligner-user.sqlite
sql/projects/clear-aligner-00000000-0000-4000-9000-000000000000.sqlite
```

...in the project directory during development and the application footprint after
installation.

These are created automatically when executing `yarn dev-electron` or any of the
`yarn build*` commands, including the platform builds. These build steps will
_only_ create these files when they're missing. These may be manually recreated at
any time by executing the following shell script:

```
sql/create-db.sh
```

This script requires Python3 installed and the corpora TSV files to be in `src/tsv`.

---

**ClearAligner** is stewarded by [Biblica](https://biblica.com) and is released under an open source [license](LICENSE).
