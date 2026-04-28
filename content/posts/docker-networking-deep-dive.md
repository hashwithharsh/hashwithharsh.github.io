# Docker Networking: What Nobody Explains Clearly

If you've ever stared at a "connection refused" error between two containers that *should* be able to talk to each other — this post is for you.

I spent 3 hours on this problem last week. Not because Docker networking is that complicated, but because every tutorial I found either oversimplified it or buried the key insight in 3000 words of backstory.

Here's what actually matters.

---

## The Core Problem

Docker containers are isolated by default. They each get their own network namespace, which means they can't talk to each other unless you explicitly tell Docker to connect them.

The confusion usually starts when people expect container networking to work like processes on the same machine. It doesn't. Not by default.

---

## The Four Network Drivers You Actually Care About

### 1. `bridge` (the default)

Every container you start without specifying a network goes onto the default bridge network. Here's the thing nobody tells you: **containers on the default bridge can't resolve each other by name.**

```bash
# Start two containers on the default bridge
docker run -d --name app1 nginx
docker run -d --name app2 nginx

# Try to ping app1 from app2 by name — it fails
docker exec app2 ping app1
# ping: app1: Name or service not known
```

Why? Because the default bridge doesn't have DNS built in. To use name resolution, you need a **user-defined bridge network**.

### 2. User-defined bridge (the right choice for most setups)

```bash
# Create your own network
docker network create my-network

# Now start containers on it
docker run -d --name app1 --network my-network nginx
docker run -d --name app2 --network my-network nginx

# This works now
docker exec app2 ping app1
# PING app1 (172.18.0.2): 56 data bytes
```

User-defined bridge networks get an **embedded DNS server**. Containers can find each other by name. This is what you want for local development and most containerized apps.

### 3. `host` (skip container networking entirely)

```bash
docker run --network host nginx
```

The container uses the host's network stack directly. No isolation, no port mapping needed. Useful for monitoring tools that need to see all network traffic on the host. Not great for most apps.

### 4. `none` (total isolation)

No network access at all. Useful for security-sensitive batch jobs that only need filesystem access.

---

## The Port Binding Misconception

Here's something that trips up almost everyone:

```bash
docker run -p 8080:80 nginx
```

This does **not** make nginx accessible to other containers at port 8080. It makes it accessible from *outside Docker* — i.e., from your host machine or the internet.

Container-to-container communication uses **internal container IPs or DNS names**, not published ports.

```yaml
# docker-compose.yml — the right way
services:
  frontend:
    image: my-frontend
    ports:
      - "3000:3000"  # only needed for external access
  
  backend:
    image: my-backend
    # No ports needed — frontend talks to backend via service name
  
  # In frontend code:
  # fetch('http://backend:4000/api/data')  ← uses service name
```

Docker Compose automatically creates a user-defined network and puts all services on it. This is why Compose setups "just work" for multi-service apps.

---

## Inspecting Networks (when things break)

```bash
# See all networks
docker network ls

# Inspect a specific network — shows connected containers and their IPs
docker network inspect my-network

# Check which networks a container is on
docker inspect container-name | grep -i network

# Test connectivity between containers
docker exec container-a ping container-b
docker exec container-a curl http://container-b:8080/health
```

---

## The Debug Workflow I Use

When containers can't talk to each other, I work through this in order:

1. **Are they on the same network?** `docker inspect` both containers and compare networks.
2. **Are they using user-defined networking?** Default bridge = no DNS. User bridge = DNS works.
3. **Am I using the right name?** In Compose: service name. In custom networks: `--name` value.
4. **Is the target actually listening?** `docker exec target netstat -tlnp` or `ss -tlnp`.
5. **Is a firewall blocking it?** Check `iptables -L` on the host if things are really weird.

---

## The Thing That Actually Burned Me

Here's my specific 3-hour problem:

I had two containers on a user-defined network. One was an API, one was a worker. The worker kept getting "connection refused" when trying to reach the API on port `4000`.

The API was listening fine. The network was set up correctly. The names resolved.

The issue? My API container was binding to `127.0.0.1:4000` instead of `0.0.0.0:4000`. It was only listening on the loopback interface *inside the container* — not on the interface Docker uses for container-to-container traffic.

**Fix: Always bind your services to `0.0.0.0` inside containers.** Let Docker handle the network isolation at the container boundary, not at the application level.

```python
# Wrong — only accessible within the same container
app.run(host='127.0.0.1', port=4000)

# Right — accessible from other containers on the same network
app.run(host='0.0.0.0', port=4000)
```

---

## Quick Reference

| Scenario | What to Use |
|---|---|
| Local dev, multiple services | Docker Compose (auto user-defined bridge) |
| Containers need to find each other by name | User-defined bridge network |
| App needs to be on multiple networks | Connect it to multiple networks |
| Monitor host-level network traffic | `host` network mode |
| Fully isolated workload | `none` network mode |

---

That's it. Three hours of pain distilled into one post.

If you're building multi-container setups, just use Docker Compose and understand that service names are your DNS. If you're doing it manually, use user-defined bridge networks and bind your services to `0.0.0.0`.

Found a mistake or got a different approach that works? Reach out — I genuinely want to know.
