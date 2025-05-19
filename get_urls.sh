#!/bin/bash

# Script to get URLs of containers in an auto-scaling group
# Usage: ./get_urls.sh

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
echo -e "\n${MAGENTA}${BOLD}Instance URLs:${NC}"

# For each instance, get the public DNS and display it
for INSTANCE_ID in $INSTANCE_IDS; do
  # Get public DNS for the instance
  INSTANCE_DNS=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --query "Reservations[0].Instances[0].PublicDnsName" \
    --output text)
  
  if [ "$INSTANCE_DNS" == "None" ] || [ -z "$INSTANCE_DNS" ]; then
    echo -e "${RED}No public DNS found for instance $INSTANCE_ID, skipping...${NC}"
    continue
  fi
  
  echo -e "${CYAN}$INSTANCE_ID:${NC} ${YELLOW}http://$INSTANCE_DNS${NC}"
done