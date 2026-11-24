#!/bin/ksh
# Copies the GL postings unloaded from the mainframe to the data warehouse landing zone
SRC=/data/mainframe/PROD.GL.POSTINGS
cp $SRC /data/dwh/landing/gl_postings.dat
./load_dwh.sh
