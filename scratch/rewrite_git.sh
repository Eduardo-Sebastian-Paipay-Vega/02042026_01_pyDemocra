#!/bin/bash
git filter-branch -f --env-filter '
WRONG_EMAIL="steve.ovalle.27@unsch.edu.pe"
NEW_NAME="sebas"
NEW_EMAIL="eduardo.paipay.27@unsch.edu.pe"

if [ "$GIT_COMMITTER_EMAIL" = "$WRONG_EMAIL" ]
then
    export GIT_COMMITTER_NAME="$NEW_NAME"
    export GIT_COMMITTER_EMAIL="$NEW_EMAIL"
fi
if [ "$GIT_AUTHOR_EMAIL" = "$WRONG_EMAIL" ]
then
    export GIT_AUTHOR_NAME="$NEW_NAME"
    export GIT_AUTHOR_EMAIL="$NEW_EMAIL"
fi
' --tag-name-filter cat -- --branches --tags
