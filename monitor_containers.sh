#!/bin/bash

# Script to monitor pm2 logs from containers in an auto-scaling group
# Usage: ./monitor_containers.sh

set -e

# Hardcoded PEM key path
KEY_PATH="/Users/georgebalch/Documents/zotik-image.pem"

# Validate key file exists and has correct permissions
if [ ! -f "$KEY_PATH" ]; then
  echo "Error: PEM key file not found at $KEY_PATH"
  exit 1
fi

# Fix permissions on the key file (SSH requires key files to be read-only by owner)
echo "Setting correct permissions on key file..."
chmod 400 "$KEY_PATH"

# Get list of auto scaling groups
echo "Fetching available Auto Scaling Groups..."
ASG_LIST=($(aws autoscaling describe-auto-scaling-groups --query "AutoScalingGroups[*].AutoScalingGroupName" --output text))

if [ ${#ASG_LIST[@]} -eq 0 ]; then
  echo "No Auto Scaling Groups found in your account."
  exit 1
fi

# Display numbered list of ASGs
echo "Available Auto Scaling Groups:"
for i in "${!ASG_LIST[@]}"; do
  echo "[$((i+1))] ${ASG_LIST[$i]}"
done

# Prompt user to select an ASG
echo
read -p "Enter the number of the Auto Scaling Group to monitor: " SELECTION

# Validate input
if ! [[ "$SELECTION" =~ ^[0-9]+$ ]] || [ "$SELECTION" -lt 1 ] || [ "$SELECTION" -gt ${#ASG_LIST[@]} ]; then
  echo "Invalid selection. Please run the script again and enter a valid number."
  exit 1
fi

# Get the selected ASG name
ASG_NAME="${ASG_LIST[$((SELECTION-1))]}"
echo "Getting instances for Auto Scaling Group: $ASG_NAME"

# Get instance IDs from the auto scaling group
INSTANCE_IDS=$(aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-name "$ASG_NAME" \
  --query "AutoScalingGroups[0].Instances[*].InstanceId" \
  --output text)

if [ -z "$INSTANCE_IDS" ]; then
  echo "No instances found in Auto Scaling Group: $ASG_NAME"
  exit 1
fi

echo "Found instances: $INSTANCE_IDS"

# For each instance, get the public DNS name and connect to it
for INSTANCE_ID in $INSTANCE_IDS; do
  echo "Processing instance: $INSTANCE_ID"
  
  # Get public DNS name for the instance
  INSTANCE_DNS=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --query "Reservations[0].Instances[0].PublicDnsName" \
    --output text)
  
  if [ "$INSTANCE_DNS" == "None" ] || [ -z "$INSTANCE_DNS" ]; then
    echo "No public DNS found for instance $INSTANCE_ID, skipping..."
    continue
  fi
  
  echo "Connecting to: $INSTANCE_DNS"
  
  # Try different users (ec2-user, ubuntu, admin) since username may vary by AMI
  for USER in ec2-user ubuntu admin; do
    echo "Trying to connect as $USER..."
    
    # Test the connection first
    if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -o BatchMode=yes -i "$KEY_PATH" $USER@"$INSTANCE_DNS" "echo Connection successful"; then
      echo "Connection as $USER successful, checking for containers..."
      
      # Connect to instance, get container ID, and stream logs (without -it flag to avoid TTY error)
      ssh -o StrictHostKeyChecking=no -i "$KEY_PATH" $USER@"$INSTANCE_DNS" \
        "CONTAINER_ID=\$(sudo docker ps --filter name=zotik -q | head -1); \
         if [ -n \"\$CONTAINER_ID\" ]; then \
           echo \"Container ID: \$CONTAINER_ID\"; \
           sudo docker exec \$CONTAINER_ID pm2 logs zotik --raw --lines 100; \
         else \
           echo \"No zotik container found on this instance\"; \
         fi"
      
      # If we got this far, we connected successfully, so break the loop
      break
    else
      echo "Failed to connect as $USER"
    fi
  done
done