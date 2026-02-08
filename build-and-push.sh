#!/bin/bash
# build-and-push.sh - Build and push multi-arch Docker images for task-tracker
#
# This script builds both AMD64 and ARM64 images and pushes them to the local registry.
# The multi-arch images allow the app to run on both x86_64 and ARM (Jetson) nodes.

set -e

REGISTRY="docker.local.pw10n.pw"
BACKEND_IMAGE="${REGISTRY}/task-tracker-backend:latest"
FRONTEND_IMAGE="${REGISTRY}/task-tracker-frontend:latest"

echo "=== Task Tracker Multi-Arch Build ==="
echo "Registry: ${REGISTRY}"
echo "Backend: ${BACKEND_IMAGE}"
echo "Frontend: ${FRONTEND_IMAGE}"
echo ""

# Check if buildx is available
if ! docker buildx version &>/dev/null; then
    echo "ERROR: docker buildx not found. Installing..."
    
    # Install buildx
    BUILDX_VERSION=$(curl -sL https://api.github.com/repos/docker/buildx/releases/latest | grep '"tag_name":' | sed -E 's/.*"v([^"]+)".*/\1/')
    mkdir -p ~/.docker/cli-plugins
    curl -L "https://github.com/docker/buildx/releases/download/v${BUILDX_VERSION}/buildx-v${BUILDX_VERSION}.linux-amd64" \
        -o ~/.docker/cli-plugins/docker-buildx
    chmod +x ~/.docker/cli-plugins/docker-buildx
    
    echo "✓ docker buildx installed"
fi

# Set up QEMU for ARM emulation (if not already set up)
if ! docker run --rm --privileged multiarch/qemu-user-static --reset -p yes &>/dev/null; then
    echo "Setting up QEMU for multi-arch builds..."
    sudo docker run --rm --privileged multiarch/qemu-user-static --reset -p yes
    echo "✓ QEMU configured"
fi

# Create or use existing buildx builder
if ! docker buildx inspect multiarch &>/dev/null; then
    echo "Creating multi-arch builder..."
    docker buildx create --name multiarch --driver docker-container --use
    docker buildx inspect --bootstrap
    echo "✓ Builder created"
else
    echo "Using existing builder: multiarch"
    docker buildx use multiarch
fi

# Build and push backend
echo ""
echo "=== Building Backend (multi-arch) ==="
cd "$(dirname "$0")/backend"
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -t "${BACKEND_IMAGE}" \
    --push \
    .

echo "✓ Backend built and pushed"

# Build and push frontend
echo ""
echo "=== Building Frontend (multi-arch) ==="
cd "$(dirname "$0")/frontend"
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -t "${FRONTEND_IMAGE}" \
    --push \
    .

echo "✓ Frontend built and pushed"

echo ""
echo "=== Build Complete ==="
echo "Images pushed to ${REGISTRY}"
echo ""
echo "To deploy/restart in k8s:"
echo "  kubectl rollout restart deployment/task-tracker-backend deployment/task-tracker-frontend -n viki"
