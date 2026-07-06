## SimpleClosure Take home
## Author: Kevin Pruett

**Hosted**: https://simpleclosure-takehome.vercel.app/

## Running Locally
```bash
bun dev # starts local server on port 3000
```

## Notes from the Author
This is a trivial application that follows the latest Next.js conventions - most notably - [`cache components`](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents). We are using [shadcn](https://ui.shadcn.com) and [tailwindcss](https://tailwindcss.com) for the majority of our styling. We are utilizing a Data Access Layer (DAL) pattern, written about here: [https://nextjs.org/docs/app/guides/data-security](https://nextjs.org/docs/app/guides/data-security) that provides a durable and predicable way to manage server-side data fetching. It's a bit overblown and unnecessary for this trivial appliction, but a pattern that I've liked using on larger projects. It tends to scale nicely.

Perhaps the most interesting aspect of this particular project is the kanban-style architecture I've built to work. As mentioned, this is a trivial application, so I wanted to experient with a semi-auditable / observable trace for the reviewer. I built a simple looping mechanism (via [`run-backlog.sh`](run-backlog.sh)) that will pick up any task in the [`tasks/backlog/`](tasks/backlog) directory. Tasks are just [`.json` files](tasks/done) that follow a [schema](.claude/skills/tasks/task.schema.json) that I came up with. Under the hood, we are calling Claude Code's `/goal` command (documented here: [https://code.claude.com/docs/en/goal](https://code.claude.com/docs/en/goal)) to work on a particular task. I should emphasize that this is an experimental form of working for me, extremely incomplete, but felt appropriate for the reasons mentioned above. Additionally, it was fun to build and experiment with new agentic engineering loops! It attempts to showcase how I thought about the initial prompt and how I'd think about chunking the work into discrete units of work. If nothing else, I'm hoping that seeing these units is helpful.

### Given more time...
Given more time, I would have liked to focus more on the user interace. Functionally, the next features I'd work on would be to expand beyond a single movie genre and implement infinite scrolling. Instead of focusing purely on feature work (which is relatively cheap), I attempted to showcase overarching engineering/design decisions and work prioritization.
