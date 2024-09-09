#!/bin/bash -xe
#################################################
# To Run, environment must contain BUILD_NUMBER #
# which will be appended to package version     #
#################################################

function parse_git_branch(){
	git branch 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/\1/'
}

base_version="$(node -p "require('./package.json').version"|cut -d'-' -f1)"

if [[ "$(parse_git_branch)" == "main" ]];
then
	npm --no-git-tag-version --allow-same-version --no-commit-hooks version "${base_version}-${BUILD_NUMBER}"
	exit 0
fi

sanitized_branch_name=$(parse_git_branch|sed 's~[^[[:alnum:]-]/]\+~~g')

npm --no-git-tag-version --allow-same-version --no-commit-hooks version "${base_version}--${sanitized_branch_name}--$(date +%Y-%m-%d-%H-%M)"
