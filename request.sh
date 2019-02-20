#!/bin/bash
# chmode +x ./file make it executable
bash -c 'for i in `seq 1 1000`; 
do 
curl -d "UserMsg=hey" -d "UserName=Hosting1A" -d "AccessToken=iusybe87ybc88um9m8uxw" http://localhost:3000/send-messages
done'

