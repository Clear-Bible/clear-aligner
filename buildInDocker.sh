#!/bin/bash

yarn install && yarn build $2

useradd user -u $1
chown -R user .
#su user -c "yarn build $2"
#su user -c "yarn install && yarn build $2"
