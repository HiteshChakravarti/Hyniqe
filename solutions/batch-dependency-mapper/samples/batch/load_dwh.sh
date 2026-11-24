#!/bin/ksh
sqlplus -s dwh/@DWH @/opt/sql/load_gl.sql < /data/dwh/landing/gl_postings.dat
cp /data/dwh/landing/gl_postings.dat /archive/dwh/
