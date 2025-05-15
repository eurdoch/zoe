#!/bin/bash
set -e

# Script to build and deploy the API container and rotate AWS instances
# Prerequisites: AWS CLI, Docker, and proper credentials configured

# Configuration - you may need to adjust these values
GITHUB_PACKAGES_TOKEN=${GITHUB_PACKAGES_TOKEN}
GITHUB_USERNAME="eurdoch"
IMAGE_NAME="ghcr.io/eurdoch/zotik-api"
VERSION="v1.0.0"
LATEST_TAG="latest"
# Let AWS CLI determine the region from its configuration

# Step 1: Log in to GitHub Container Registry
echo "Logging in to GitHub Container Registry..."
echo $GITHUB_PACKAGES_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

# Step 2: Build and push the Docker image
echo "Building and pushing Docker image..."
cd "$(dirname "$0")/api"
docker buildx build --platform linux/amd64 \
  -t $IMAGE_NAME:$LATEST_TAG \
  -t $IMAGE_NAME:$VERSION \
  --push .

echo "Docker image built and pushed successfully!"

# Step 3: List available Auto Scaling Groups and let user select one
echo "Fetching available Auto Scaling Groups..."
# Using older Bash compatible approach instead of readarray
ASG_NAMES=()
# Get the names and handle potential tab-separated output
AWS_OUTPUT=$(aws autoscaling describe-auto-scaling-groups \
  --query "AutoScalingGroups[*].AutoScalingGroupName" \
  --output text)

# Handle both space and tab delimiters
for name in $AWS_OUTPUT; do
  # Skip empty names
  [ -z "$name" ] && continue
  ASG_NAMES+=("$name")
done

if [ ${#ASG_NAMES[@]} -eq 0 ]; then
  echo "No Auto Scaling Groups found in region $AWS_REGION."
  exit 1
fi

echo "Available Auto Scaling Groups:"
for i in "${!ASG_NAMES[@]}"; do
  echo "[$((i+1))] ${ASG_NAMES[$i]}"
done

# Allow user to select from list or pass as argument
if [ -n "$1" ]; then
  # Check if the provided ASG name exists in the list
  ASG_FOUND=false
  for name in "${ASG_NAMES[@]}"; do
    if [ "$name" == "$1" ]; then
      ASG_NAME="$1"
      ASG_FOUND=true
      break
    fi
  done
  
  if [ "$ASG_FOUND" == "false" ]; then
    echo "Error: Auto Scaling Group '$1' not found in region $AWS_REGION."
    exit 1
  fi
else
  # Prompt user to select a group
  echo -n "Enter the number of the Auto Scaling Group to update [1-${#ASG_NAMES[@]}]: "
  read -r selection
  
  # Validate selection
  if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt "${#ASG_NAMES[@]}" ]; then
    echo "Error: Invalid selection."
    exit 1
  fi
  
  ASG_NAME="${ASG_NAMES[$((selection-1))]}"
fi

echo "Selected Auto Scaling Group: $ASG_NAME"

# Step 4: Get current instance IDs in the Auto Scaling Group
echo "Getting instance IDs from Auto Scaling Group $ASG_NAME..."
# Using the same approach for instance IDs as we did for ASG names
INSTANCE_IDS=()
AWS_INSTANCES=$(aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-name "$ASG_NAME" \
  --query "AutoScalingGroups[0].Instances[?LifecycleState=='InService'].InstanceId" \
  --output text)

# Process each instance ID
for id in $AWS_INSTANCES; do
  [ -z "$id" ] && continue
  INSTANCE_IDS+=("$id")
done

if [ ${#INSTANCE_IDS[@]} -eq 0 ]; then
  echo "No running instances found in Auto Scaling Group $ASG_NAME"
  exit 1
fi

echo "Found instances: ${INSTANCE_IDS[@]}"

# Step 5: Terminate instances one by one to trigger their replacement
echo "Starting instance rotation..."
for INSTANCE_ID in "${INSTANCE_IDS[@]}"; do
  echo "Terminating instance $INSTANCE_ID..."
  
  # Get the instance's AZ before terminating it
  AZ=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --query "Reservations[0].Instances[0].Placement.AvailabilityZone" \
    --output text)
  
  # Terminate the instance
  if ! aws autoscaling terminate-instance-in-auto-scaling-group \
      --instance-id "$INSTANCE_ID" \
      --no-should-decrement-desired-capacity; then
    echo "Error: Failed to terminate instance $INSTANCE_ID. Continuing with next instance..."
    continue
  fi
  
  echo "Instance $INSTANCE_ID termination initiated. Waiting for new instance to become InService..."
  
  # Wait for the replacement instance to become InService with timeout
  MAX_ATTEMPTS=30  # 5 minutes timeout (30 * 10 seconds)
  ATTEMPTS=0
  
  while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    echo "Checking for new instance status in AZ $AZ (Attempt $((ATTEMPTS+1))/$MAX_ATTEMPTS)..."
    
    # Get full response and save to variable
    ASG_RESPONSE=$(aws autoscaling describe-auto-scaling-groups \
      --auto-scaling-group-name "$ASG_NAME" \
      --output json)
    
    # Print the full response for debugging
    echo "AWS Response:"
    echo "$ASG_RESPONSE" | jq .
    
    # Extract instance count from the response
    NEW_INSTANCE_COUNT=$(echo "$ASG_RESPONSE" | \
      jq "[.AutoScalingGroups[0].Instances[] | select(.LifecycleState==\"InService\" and .AvailabilityZone==\"$AZ\")] | length")
    
    echo "InService instances in AZ $AZ: $NEW_INSTANCE_COUNT"
    
    if [ "$NEW_INSTANCE_COUNT" -ge "1" ]; then
      echo "New instance is now InService in AZ $AZ"
      break
    else
      echo "Waiting for new instance in AZ $AZ to become InService..."
      sleep 10
      ATTEMPTS=$((ATTEMPTS+1))
    fi
  done
  
  if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then
    echo "Warning: Timeout waiting for new instance in AZ $AZ. Continuing with next instance..."
  fi
done

echo "All instances have been rotated. Deployment complete!"