#!/usr/bin/expect -f

set timeout -1

# Configuration
set server "192.168.0.6"
set username "ayaz1"
set password "ayaz2006"

# SSH and run deployment
spawn ssh $username@$server "curl -fsSL https://raw.githubusercontent.com/1Ayaz/mubarak-fresh-chicken/master/auto-deploy.sh | bash"

expect {
    "password:" {
        send "$password\r"
        exp_continue
    }
    "yes/no" {
        send "yes\r"
        exp_continue
    }
    eof
}
