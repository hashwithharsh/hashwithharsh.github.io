# I Thought DevOps Engineers Controlled Everything. SDLC Taught Me Otherwise.

When I first started learning DevOps, I had a very simplified view of how software companies worked. I thought developers wrote code, DevOps engineers deployed everything, and somehow applications magically reached customers.

The more I studied SDLC and organizational workflows, the more I realized how wrong that assumption was.

Modern software delivery is not just “developers + deployment.” It’s an entire chain of planning, communication, prioritization, testing, infrastructure, monitoring, and collaboration happening continuously behind the scenes. DevOps is a very important part of that chain, but it’s still only one part of a much larger system.

And honestly, understanding this changed how I look at software engineering completely.

## What SDLC Actually Means

SDLC stands for Software Development Life Cycle. Sounds complicated initially, but the core idea is simple:

```text
Build software using a structured process instead of chaos.
```

That process usually includes:
- Planning
- Analysis
- Design
- Development
- Testing
- Deployment
- Maintenance

At first this sounded overly corporate to me. I used to think:
> “Why not just build the application directly?”

But then I realized what happens without structure:
- Teams lose coordination
- Features become unclear
- Bugs increase
- Deployments become risky
- Nobody knows ownership properly

Basically, things break faster than they scale.

That’s why almost every serious company — startups, product companies, MNCs — follows some form of SDLC.

## The Part Nobody Explains Properly

One thing that surprised me while studying SDLC was how many people are actually involved before a feature even reaches developers.

I assumed customers directly requested features and engineers immediately started building them.

Reality is much more layered.

The requirement flow often looks something like this:

```text
Customer
 ↓
Business Analyst
 ↓
Product Manager
 ↓
Product Owner
 ↓
Solution Architect
 ↓
Scrum Team
```

Initially this looked unnecessarily complicated. But after thinking deeper, it started making sense.

Customers explain problems.

Business Analysts gather requirements.

Product Managers decide priorities.

Product Owners convert ideas into actionable work.

Architects design implementation approaches.

Then finally the engineering teams start execution.

Without this filtering process, software teams would constantly build random things with unclear priorities.

## The Moment SDLC Started Feeling Real

The grocery delivery example made this click for me.

Imagine customers start demanding:
> “We want 15-minute grocery delivery.”

Sounds simple as a business statement.

But internally, that single requirement triggers multiple layers of work:
- Product discussions
- Architecture decisions
- Infrastructure planning
- Backend scaling
- Database changes
- Monitoring requirements
- Mobile updates
- Deployment workflows

Suddenly the requirement becomes much bigger than one feature request.

That’s where SDLC stops feeling theoretical and starts feeling practical.

## Where DevOps Actually Fits

This was probably the biggest misconception I had.

I thought DevOps engineers directly receive customer requirements and start building infrastructure immediately.

Usually, that’s not how things work.

Most DevOps tasks come indirectly through developers, architects, or scrum planning discussions.

For example:

```text
Requirement:
15-minute grocery delivery
```

Developers realize:
```text
Need scalable infrastructure
```

Then stories get created like:
```text
Create Kubernetes cluster
Setup CI/CD pipeline
Provision cloud infrastructure
```

And those tasks eventually reach DevOps engineers.

That workflow changed how I understood the DevOps role entirely.

## DevOps Is Basically About Removing Delivery Friction

The more I study DevOps, the more it feels less like “tool engineering” and more like “delivery optimization.”

DevOps engineers mainly focus on:
- Automation
- CI/CD pipelines
- Infrastructure provisioning
- Deployment consistency
- Testing automation
- Developer workflow improvement

The goal is reducing:
- Manual work
- Delays
- Human errors
- Deployment inconsistency

And increasing:
- Speed
- Reliability
- Automation
- Stability

That’s why DevOps becomes heavily involved during build, testing, and deployment phases inside SDLC.

## Without DevOps, Delivery Becomes Painful Very Quickly

This part made complete sense to me immediately.

Without automation, workflows often look like this:

```text
Developer manually builds
Tester manually tests
Operations manually deploys
```

Now imagine this happening multiple times daily inside large systems.

Sounds exhausting.

That’s exactly why CI/CD pipelines became so important.

Instead of relying entirely on humans, companies started automating repetitive processes:

```text
Code Push
 ↓
Automated Build
 ↓
Automated Testing
 ↓
Automated Deployment
```

This reduces mistakes, speeds up delivery, and creates more consistent deployments.

And honestly, this is where DevOps started feeling genuinely powerful to me.

## Agile and Scrum Finally Made Sense

Earlier, Agile and Scrum sounded like corporate buzzwords.

After studying them properly, they actually feel practical.

Agile basically means:
- Smaller delivery cycles
- Faster feedback
- Continuous improvement
- Iterative development

Instead of waiting 1 year to release software, teams ship smaller improvements continuously.

Scrum is simply a framework inside Agile where work gets organized into sprints.

A sprint is usually:
```text
2–3 weeks of planned work
```

During that sprint:
- Tasks are assigned
- Progress is tracked
- Teams collaborate
- Work gets reviewed

Then retrospective meetings happen to improve future workflows.

Honestly, this feels much more realistic than giant long-term waterfall planning.

## Jira Finally Stopped Looking Confusing

I used to hear words like:
- Epic
- Story
- Sprint
- Backlog

And everything sounded unnecessarily complicated.

But once connected to real workflows, it became simple.

![Epic vs Story in Jira](https://i0.wp.com/appliger.com/wp-content/uploads/2023/12/Differences-Between-Epic-and-Story-in-Jira.png?resize=768%2C353&ssl=1)

# **An Epic is a large business goal.**

Example:
```text
15-minute delivery feature
```

# **Stories are smaller actionable tasks:**
- Create Kubernetes cluster
- Setup database
- Build API
- Create mobile UI

Backlog stores pending work.

Sprints decide what gets worked on immediately.

That’s it.

Much simpler once connected to real examples.( practical of jira is done )

## This Changed How I Think About Software Engineering

Earlier I saw software delivery mostly as:
```text
Code → Deploy → Done
```

Now it feels more like:
```text
Planning → Collaboration → Development → Automation → Monitoring → Continuous Improvement
```

Huge difference.

The deeper I study SDLC and DevOps, the more I realize modern software engineering is mostly about coordination and system efficiency. Tools matter, but workflows matter even more.

And honestly, that realization made DevOps much more interesting to learn.

## Final Takeaway

SDLC exists to make software delivery structured, predictable, and scalable. DevOps fits inside that system by improving delivery efficiency through automation, collaboration, and reliability engineering.

The important realization for me was this:

DevOps engineers are not isolated “deployment people.”

They are part of a much larger ecosystem involving product teams, architects, developers, testers, infrastructure, and operations working together continuously.

Once I understood that, the entire software delivery lifecycle finally started making sense.

---

— Harsh Yadav  
DevOps & Cloud engineer in the making  
Built it. Broke it. Understood it.