# Why Git Felt Easy… Until I Broke My Own Repository

I thought Git was simple.

Just run:

```bash
git add .
git commit -m "done"
git push
```

…and somehow magic happens.

That illusion lasted exactly until I:
- deleted a branch accidentally,
- force pushed wrong commits,
- entered detached HEAD state,
- and spent 40 minutes trying to understand why Git “lost” my files.

This is the part nobody explains properly when you start learning DevOps.

Git looks easy when everything works.  
Git becomes interesting when things break.

And honestly… that’s where I actually started understanding it.

---

# The Problem

When I first started using Git, I treated it like a save button.

Make changes → commit → push.

I never thought about:
- what Git stores internally,
- what HEAD actually means,
- how branches work,
- or why merge conflicts happen.

Then one day I deleted a branch locally thinking:

> “It’s probably fine.”

It wasn’t fine.

The branch had commits that weren’t pushed yet.

Suddenly:
- work disappeared,
- `git branch` showed nothing useful,
- panic mode activated.

Classic beginner DevOps moment.

---

# What I Thought

I assumed Git worked like cloud storage.

Like:
- files go somewhere,
- Git remembers everything automatically,
- nothing can truly disappear.

I also thought:
- branches are copies,
- merge conflicts are random,
- and `git push --force` was just a stronger push.

That last one is dangerous.

Very dangerous.

---

# What Actually Happens

Git is basically a huge history tracking system.

It tracks:
- commits,
- pointers,
- snapshots,
- references.

Not “folders” the way beginners imagine.

This changed how I think about Git entirely.

A branch is not a copy of your project.

It’s basically a movable label pointing to commits.

Something like this:

```text
Commit A → Commit B → Commit C
                           ↑
                         main
```

And `HEAD`?

It’s just a pointer to where you currently are.

```text
Commit A → Commit B → Commit C ← HEAD
```

This sounds small… but this is where Git finally started making sense to me.

---

# The Moment I Broke Everything

I was experimenting with branches.

Created a feature branch:

```bash
git checkout -b feature-login
```

Made some commits.

Then I switched back to `main` and deleted the branch:

```bash
git branch -D feature-login
```

Instant regret.

The commits were never pushed to GitHub.

I thought the work was gone permanently.

Checked logs.  
Nothing useful.

Restarted terminal.  
Still nothing.

At this point I was mentally preparing to rewrite everything.

Then I discovered:

```bash
git reflog
```

And honestly… `git reflog` feels like Git’s hidden recovery superpower.

---

# The Breakthrough

`reflog` tracks all HEAD movements.

Even deleted branches leave traces behind.

So Git still knew:
- where my commits existed,
- which commit ID I lost,
- and how to restore it.

Recovery looked like this:

```bash
git reflog
```

Found the commit ID.

Then:

```bash
git checkout -b recovered-branch <commit-id>
```

Branch restored.

Files restored.

Stress reduced by 90%.

This was the exact moment Git stopped feeling random.

---

# Simple Way to Understand Git

The easiest analogy I found:

Git is like a time machine with labeled checkpoints.

- Commits = save points
- Branches = alternate timelines
- HEAD = your current position
- Rebase = rewriting timeline history
- Merge = combining timelines

And merge conflicts?

Not “Git being broken.”

Git is literally saying:

> “Two people changed the same thing differently. You decide.”

That realization changed everything.

---

# Why Merge Conflicts Actually Happen

Before this, merge conflicts looked terrifying.

Then I saw a conflict file for the first time:

```text
<<<<<<< HEAD
main code
=======
feature code
>>>>>>> feature-login
```

At first this looked like corruption.

But Git is actually showing:
- current branch code,
- incoming branch code,
- and asking you to choose.

That’s it.

This didn’t make sense at first because tutorials oversimplify merging too much.

Real repositories are messy.

Especially in teams.

---

# The Dangerous Part Nobody Warns Beginners About

This command:

```bash
git push --force
```

can overwrite remote history.

Meaning:
- teammates can lose commits,
- CI/CD pipelines may break,
- deployments may become inconsistent.

I learned this after rewriting history accidentally during rebase experiments.

Now I prefer:

```bash
git push --force-with-lease
```

Much safer.

Git is powerful… but it absolutely punishes careless habits.

---

# Where Git Became Real DevOps

At first Git felt like “developer stuff.”

Then I started learning DevOps properly.

Suddenly Git was everywhere:
- Jenkins pipelines
- Dockerfiles
- Kubernetes YAML
- Terraform
- Helm charts
- GitHub Actions
- CI/CD workflows

And then this clicked:

Git is not just source control.

Git is infrastructure history.

Production history.

Deployment history.

Rollback history.

Everything depends on it.

---

# The Biggest Lesson

The biggest Git improvement didn’t come from reading commands.

It came from breaking repositories.

Seriously.

Because once things fail:
- you understand staging properly,
- you understand commits properly,
- you understand branches properly,
- and Git stops feeling magical.

Now before doing anything risky, I always check:

```bash
git status
```

That one habit alone prevents so many stupid mistakes.

---

# Key Takeaways

- Git is a snapshot system, not cloud storage
- Branches are pointers, not folder copies
- `HEAD` matters more than beginners realize
- `reflog` can save destroyed work
- Merge conflicts are normal
- Force push is dangerous on shared branches
- Git becomes understandable after recovery scenarios

---

# Real World Relevance

In DevOps environments:
- Git triggers CI/CD pipelines
- tags control deployments
- rollback depends on commit history
- infrastructure changes are audited through Git
- production incidents often trace back to Git operations

Which means:
understanding Git deeply is not optional anymore.

Especially if you want to work with:
- Kubernetes
- Terraform
- Jenkins
- Docker
- GitHub Actions
- Cloud infrastructure

---

This was one of those technologies that looked “basic” at first.

Then I broke it.

Then I finally understood it.

---

— Harsh Yadav  
DevOps & Cloud engineer in the making  
Built it. Broke it. Understood it.