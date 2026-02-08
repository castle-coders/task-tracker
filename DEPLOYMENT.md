# Task Tracker - Deployment Guide

## Quick Deploy

1. **Build and push images:**
   ```bash
   ./build-and-push.sh
   ```

2. **Deploy to k3s:**
   ```bash
   kubectl apply -f k8s-deployment.yaml
   ```

3. **Check status:**
   ```bash
   kubectl get pods -n viki -l app=task-tracker
   ```

4. **Access the app:**
   - URL: https://tasks.local.pw10n.pw
   - Frontend: React/Vite (nginx)
   - Backend: Flask API (gunicorn)

## Multi-Arch Build Details

The `build-and-push.sh` script:
- Builds for both **AMD64** and **ARM64** architectures
- Uses Docker Buildx with QEMU emulation
- Pushes to local registry: `docker.local.pw10n.pw`
- Creates manifest lists so k3s pulls the correct architecture

### Why Multi-Arch?

The k3s cluster runs on a **Jetson** node (ARM64). Without multi-arch images, you'd get `exec format error` when trying to run x86 images on ARM hardware.

## Database Configuration

- **Host:** titanium (10.5.0.61)
- **Database:** `tasktracker`
- **User:** `tracker_user`
- **Connection:** MySQL via pymysql

The password contains special characters (`@` and `!`) and must be URL-encoded in the connection string.

## Kubernetes Resources

Deployed to namespace: `viki`

### Deployments
- `task-tracker-backend` - Flask API (port 5000)
- `task-tracker-frontend` - React app (port 80)

### Services
- `task-tracker-backend` - ClusterIP (5000)
- `task-tracker-frontend` - ClusterIP (80)

### Ingress
- `task-tracker` - Traefik IngressRoute
  - `/api/*` → backend
  - `/*` → frontend
  - TLS: `localcert-tls`

## Restart Deployments

After rebuilding images:
```bash
kubectl rollout restart deployment/task-tracker-backend deployment/task-tracker-frontend -n viki
```

Watch pods restart:
```bash
kubectl get pods -n viki -l app=task-tracker -w
```

## View Logs

Backend:
```bash
kubectl logs -n viki deployment/task-tracker-backend --tail=50 -f
```

Frontend:
```bash
kubectl logs -n viki deployment/task-tracker-frontend --tail=50 -f
```

## Troubleshooting

### Backend won't start

Check logs:
```bash
kubectl logs -n viki deployment/task-tracker-backend
```

Common issues:
- Database connection: Check secret has correct URL-encoded password
- Module import errors: Verify Dockerfile structure
- Permission denied: Check MySQL grants on titanium

### Wrong architecture

If you see `exec format error`:
```bash
# Check node architecture
kubectl get nodes -o wide

# Rebuild with multi-arch
./build-and-push.sh
```

### Image not updating

Force pull new image:
```bash
kubectl rollout restart deployment/task-tracker-backend -n viki
```

Or delete the pod to force recreation:
```bash
kubectl delete pod -n viki -l app=task-tracker,component=backend
```
