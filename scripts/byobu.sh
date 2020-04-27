#!/bin/bash

SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  DIR="$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
DIR="$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )"


if [ -z "$(byobu-tmux list-sessions | grep 'dev-TrailPassion-manual')" ]
then
    byobu-tmux new-session -d -t 'dev-TrailPassion-manual' # creates a new detached byobu-tmux session

    byobu-tmux rename-window LAMP
    byobu-tmux send-keys -t 0 'cd ~/Code/github/tp' 'C-m'
    byobu-tmux send-keys -t 0 'docker start LAMP' 'C-m'
    byobu-tmux send-keys -t 0 'docker exec -ti LAMP bash' 'C-m'
    byobu-tmux send-keys -t 0 'tail -f /var/log/apache2/error.log' 'C-m'

    byobu-tmux new-window
    byobu-tmux rename-window Main
    byobu-tmux send-keys -t 0 "cd '$DIR/..'" 'C-m'
    byobu-tmux send-keys -t 0 'atom .' 'C-m'
    byobu-tmux split-window -h
    byobu-tmux send-keys -t 1 "cd '$DIR/..'" 'C-m'
    byobu-tmux send-keys -t 1 'npm start' 'C-m'

    byobu-tmux new-window
    byobu-tmux rename-window TP-Lib
    byobu-tmux send-keys -t 0 "cd '$DIR/../../../lib/tp'" 'C-m'
    byobu-tmux send-keys -t 0 'atom .' 'C-m'
    byobu-tmux split-window -h
    byobu-tmux send-keys -t 1 "cd '$DIR/../../../lib/tp'" 'C-m'
    byobu-tmux send-keys -t 1 'npm start' 'C-m'

    byobu-tmux new-window
    byobu-tmux rename-window TFW
    byobu-tmux send-keys -t 0 "cd '$DIR/../../../../../tfw'" 'C-m'
    byobu-tmux send-keys -t 0 'atom .' 'C-m'
    byobu-tmux split-window -h
    byobu-tmux send-keys -t 1 "cd '$DIR/../../../../../tfw'" 'C-m'
    byobu-tmux send-keys -t 1 'npm start' 'C-m'
fi
# Enter byobu-tmux
byobu-tmux attach -t 'dev-TrailPassion-manual'
