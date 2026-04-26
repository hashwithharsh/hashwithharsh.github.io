# Setting Up Kubernetes From Scratch (Without Losing Your Mind)

Everyone recommends managed Kubernetes — EKS, GKE, AKS. And they're right, for production. But if you want to *actually understand* what Kubernetes is doing, you need to set it up yourself at least once.

This is that walkthrough. Two Ubuntu VMs, a control plane, a worker node, and a containerized app running by the end.

---

## What We're Building

```
┌─────────────────────┐    ┌─────────────────────┐
│   control-plane     │    │   worker-node-01    │
│   192.168.1.10      │◄──►│   192.168.1.11      │
│                     │    │                     │
│  ● API Server       │    │  ● kubelet          │
│  ● etcd             │    │  ● kube-proxy       │
│  ● Scheduler        │    │  ● containerd       │
│  ● Controller Mgr   │    │                     │
└─────────────────────┘    └─────────────────────┘
```

---

## Prerequisites

- Two VMs (Ubuntu 22.04) — 2 vCPU, 2GB RAM minimum each
- Both on the same network, can reach each other
- Unique hostnames and static IPs (or at least stable DHCP)
- `sudo` access on both

---

## Step 1: Prepare Both Nodes

Run everything below on **both** the control plane and worker node.

### Disable swap

Kubernetes doesn't play nice with swap. It needs predictable memory management.

```bash
sudo swapoff -a
# Make it permanent
sudo sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab
```

### Load required kernel modules

```bash
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter
```

### Set sysctl params

```bash
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

sudo sysctl --system
```

### Install containerd

```bash
sudo apt-get update
sudo apt-get install -y containerd

# Configure containerd
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml

# Enable SystemdCgroup (this tripped me up for an hour)
sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml

sudo systemctl restart containerd
sudo systemctl enable containerd
```

### Install kubeadm, kubelet, kubectl

```bash
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gpg

curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.29/deb/Release.key | \
  sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] \
  https://pkgs.k8s.io/core:/stable:/v1.29/deb/ /' | \
  sudo tee /etc/apt/sources.list.d/kubernetes.list

sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
```

---

## Step 2: Initialize the Control Plane

Run this **only on the control plane node**:

```bash
sudo kubeadm init \
  --pod-network-cidr=10.244.0.0/16 \
  --apiserver-advertise-address=192.168.1.10  # your control plane IP
```

The `--pod-network-cidr` value needs to match whatever CNI plugin you use. We're using Flannel, which expects `10.244.0.0/16`.

When it finishes, you'll see a join command at the bottom. **Save it.** You'll need it for the worker node.

Set up kubectl access:

```bash
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

### Install Flannel (CNI)

Pods can't communicate without a CNI plugin. Install Flannel:

```bash
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
```

Check it's running:

```bash
kubectl get pods -n kube-flannel
# NAME                    READY   STATUS    RESTARTS   AGE
# kube-flannel-ds-xxxxx   1/1     Running   0          30s
```

---

## Step 3: Join the Worker Node

On the **worker node**, run the join command from step 2:

```bash
sudo kubeadm join 192.168.1.10:6443 \
  --token <your-token> \
  --discovery-token-ca-cert-hash sha256:<your-hash>
```

Back on the control plane, verify:

```bash
kubectl get nodes
# NAME              STATUS   ROLES           AGE   VERSION
# control-plane     Ready    control-plane   5m    v1.29.0
# worker-node-01    Ready    <none>          1m    v1.29.0
```

Both nodes showing `Ready` is the milestone.

---

## Step 4: Deploy Something Real

Let's deploy nginx to verify the cluster actually works:

```yaml
# nginx-deploy.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:latest
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
  type: NodePort
  ports:
  - port: 80
    nodePort: 30080
```

```bash
kubectl apply -f nginx-deploy.yaml

# Watch it come up
kubectl get pods -w
# NAME                     READY   STATUS    RESTARTS   AGE
# nginx-5f7b9d7f6b-2xk4j   1/1     Running   0          20s
# nginx-5f7b9d7f6b-mq8tz   1/1     Running   0          20s

# Hit it from your machine
curl http://192.168.1.11:30080
# <!DOCTYPE html><html>...nginx welcome page...
```

It works.

---

## The Things That Actually Broke For Me

**Nodes stuck at NotReady:** Usually the CNI plugin. Make sure Flannel pods are running in `kube-flannel` namespace before anything else.

**kubeadm join token expired:** Tokens expire after 24 hours. Generate a new one: `kubeadm token create --print-join-command`

**Pods stuck in ContainerCreating:** Check containerd is running and `SystemdCgroup = true` is set. This was my longest debugging session.

**kubectl connection refused:** Make sure you copied the kubeconfig properly. Run `kubectl cluster-info` to verify.

---

## What You Actually Learned

By doing this manually, you now understand:
- What kubeadm actually initializes (API server, etcd, scheduler, controller manager)
- Why CNI is needed and what it does
- How worker nodes join via tokens
- How `kubelet` and `containerd` work together
- What the kubeconfig file actually is

When you use EKS next time, you'll know exactly what AWS is doing for you — and more importantly, where things can go wrong.

---

Next steps: add persistent storage with local-path-provisioner, set up ingress with nginx-ingress-controller, or add cert-manager for TLS. I'll write about each of those soon.
