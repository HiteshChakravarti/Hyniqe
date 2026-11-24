#!/bin/bash
# Rotate SFTP keys for the clearing house connection
ssh-keygen -t rsa -b 2048 -f /keys/clearing_sftp -N ""
openssl genrsa -out /keys/swift-gateway.key 2048
openssl req -new -newkey rsa:4096 -nodes -keyout /keys/api.key -out /keys/api.csr
