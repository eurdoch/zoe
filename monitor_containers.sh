#!/bin/bash

# Script to monitor pm2 logs from containers in an auto-scaling group
# Usage: ./monitor_containers.sh

set -e

# Define colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Hardcoded PEM key path
KEY_PATH="/Users/georgebalch/Documents/zotik-image.pem"

# Validate key file exists and has correct permissions
if [ ! -f "$KEY_PATH" ]; then
  echo "Error: PEM key file not found at $KEY_PATH"
  exit 1
fi

# Fix permissions on the key file (SSH requires key files to be read-only by owner)
echo -e "${BLUE}Setting correct permissions on key file...${NC}"
chmod 400 "$KEY_PATH"

# Get list of auto scaling groups
echo -e "${CYAN}Fetching available Auto Scaling Groups...${NC}"
ASG_LIST=($(aws autoscaling describe-auto-scaling-groups --query "AutoScalingGroups[*].AutoScalingGroupName" --output text))

if [ ${#ASG_LIST[@]} -eq 0 ]; then
  echo -e "${RED}No Auto Scaling Groups found in your account.${NC}"
  exit 1
fi

# Display numbered list of ASGs
echo -e "\n${BOLD}Available Auto Scaling Groups:${NC}"
for i in "${!ASG_LIST[@]}"; do
  echo -e "${GREEN}[$((i+1))]${NC} ${YELLOW}${ASG_LIST[$i]}${NC}"
done

# Prompt user to select an ASG
echo
read -p "$(echo -e ${BOLD}"Enter the number of the Auto Scaling Group to monitor: "${NC})" SELECTION

# Validate input
if ! [[ "$SELECTION" =~ ^[0-9]+$ ]] || [ "$SELECTION" -lt 1 ] || [ "$SELECTION" -gt ${#ASG_LIST[@]} ]; then
  echo -e "${RED}Invalid selection. Please run the script again and enter a valid number.${NC}"
  exit 1
fi

# Get the selected ASG name
ASG_NAME="${ASG_LIST[$((SELECTION-1))]}"
echo -e "${BLUE}Getting instances for Auto Scaling Group:${NC} ${YELLOW}$ASG_NAME${NC}"

# Get instance IDs from the auto scaling group
INSTANCE_IDS=$(aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-name "$ASG_NAME" \
  --query "AutoScalingGroups[0].Instances[*].InstanceId" \
  --output text)

if [ -z "$INSTANCE_IDS" ]; then
  echo -e "${RED}No instances found in Auto Scaling Group: $ASG_NAME${NC}"
  exit 1
fi

echo -e "${GREEN}Found instances:${NC} ${YELLOW}$INSTANCE_IDS${NC}"

# For each instance, get the public DNS name and connect to it
for INSTANCE_ID in $INSTANCE_IDS; do
  echo -e "\n${MAGENTA}${BOLD}Processing instance:${NC} ${CYAN}$INSTANCE_ID${NC}"
  
  # Get public DNS name for the instance
  INSTANCE_DNS=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --query "Reservations[0].Instances[0].PublicDnsName" \
    --output text)
  
  if [ "$INSTANCE_DNS" == "None" ] || [ -z "$INSTANCE_DNS" ]; then
    echo -e "${RED}No public DNS found for instance $INSTANCE_ID, skipping...${NC}"
    continue
  fi
  
  echo -e "${BLUE}Connecting to:${NC} ${YELLOW}$INSTANCE_DNS${NC}"
  
  # Try different users (ec2-user, ubuntu, admin) since username may vary by AMI
  for USER in ec2-user ubuntu admin; do
    echo -e "${CYAN}Trying to connect as ${BOLD}$USER${NC}..."
    
    # Test the connection first
    if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -o BatchMode=yes -i "$KEY_PATH" $USER@"$INSTANCE_DNS" "echo Connection successful" &>/dev/null; then
      echo -e "${GREEN}Connection as $USER successful${NC}, checking for containers..."
      
      # Connect to instance, get container ID, and stream logs (without -it flag to avoid TTY error)
      ssh -o StrictHostKeyChecking=no -i "$KEY_PATH" $USER@"$INSTANCE_DNS" \
        "CONTAINER_ID=\$(sudo docker ps --filter name=zotik -q | head -1); \
         if [ -n \"\$CONTAINER_ID\" ]; then \
           echo -e \"\${GREEN}Container ID: \${YELLOW}\$CONTAINER_ID\${NC}\"; \
           echo -e \"\${MAGENTA}================== LOG OUTPUT ==================\${NC}\"; \
           sudo docker exec \$CONTAINER_ID pm2 logs zotik --raw --lines 100 | \
             sed -e \"s/\(.*ERROR.*\)/\${RED}\1\${NC}/g\" \
                 -e \"s/\(.*WARN.*\)/\${YELLOW}\1\${NC}/g\" \
                 -e \"s/\(.*INFO.*\)/\${GREEN}\1\${NC}/g\" \
                 -e \"s/\(.*DEBUG.*\)/\${BLUE}\1\${NC}/g\"; \
           echo -e \"\${MAGENTA}================ END OF LOGS =================\${NC}\"; \
         else \
           echo -e \"\${RED}No zotik container found on this instance\${NC}\"; \
         fi"
      
      # If we got this far, we connected successfully, so break the loop
      break
    else
      echo -e "${RED}Failed to connect as $USER${NC}"
    fi
  done
done