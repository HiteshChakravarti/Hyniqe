#!/bin/ksh
# Sends the outbound MT103 batch to the SWIFT gateway. Runs from cron at 06:15 and 14:45 UK time.
# TODO: move off the old AIX box
cd /data/payments/outbound
if [ -f PAY_BATCH.fin ]; then
  cp PAY_BATCH.fin /archive/payments/PAY_BATCH_$(date +%Y%m%d%H%M).fin
  wc -l PAY_BATCH.fin
  sshpass -p Gw4yPass99 sftp swiftops@10.20.4.15 <<EOF
put PAY_BATCH.fin
bye
EOF
  rm -f /data/payments/outbound/*.fin
  mailx -s "SWIFT batch sent" payments-ops@bank.example
fi
sqlplus -s payops/@PAYDB @/opt/scripts/mark_sent.sql
