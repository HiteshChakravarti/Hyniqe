#!/bin/ksh
sftp rates@rates.provider.example <<END
cd outbound
get fxrates_today.csv
END
cp fxrates_today.csv /data/mainframe/upload/PROD.REF.FXRATES.DAILY
