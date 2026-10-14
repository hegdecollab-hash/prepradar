# Copy changes (BEFORE → AFTER)

Text only; no logic changed. Sample/demo removal is listed at the end.


## components/site-footer.tsx

- `Designed &amp; Developed By <span className="text-primary font-semibold">FlowSite AI</span>` → `A product by Society for AI initiative`
- `Contact on WhatsApp` → `Message us on WhatsApp`

## lib/config.ts

- `"Hi FlowSite AI, I saw PrepRadar and would like a similar website. Can we discuss the scope?"` → `"Hi, I came across PrepRadar and would like to talk about it."`
- `Questions reported by candidates and prep sources. Verify before relying on them.` → `Questions are reported by candidates and prep sources. Verify them before you rely on them.`
- `We do not store them on our server.` → `Nothing is stored on our server.`

## tests/schema.test.ts

- `wa.me/918500097071?text=Hi%20FlowSite%20AI%2C` → `wa.me/918500097071?text=Hi%2C%20I%20came%20across%20PrepRadar`

## app/layout.tsx

- `"Enter a DSA topic. See which companies asked about it, the questions reported, and a LeetCode link for each."` → `"Search any DSA topic to see which companies ask it, the questions candidates reported, and a LeetCode link for each."`
- ``${APP_NAME} · Know what companies actually ask`, template` → ``${APP_NAME} · See what companies actually ask`, template`
- `title: `${APP_NAME} · Know what companies actually ask`,` → `title: `${APP_NAME} · See what companies actually ask`,`

## app/search/page.tsx

- `Loading…</div>` → `Loading results…</div>`

## app/page.tsx

- `Know what companies <span className="text-primary">actually</span> ask.` → `See what companies <span className="text-primary">actually</span> ask.`
- `Enter a DSA topic. See which companies asked about it, the questions reported, and a LeetCode link for each.` → `Search any DSA topic to see which companies ask it, the questions candidates reported, and a LeetCode link for each.`
- `Searches go to OpenRouter. Progress stays here.` → `Searches run through OpenRouter. Your progress stays in this browser.`
- `"Type a DSA topic like sliding window. Add a company if you want to narrow it down."` → `"Type a DSA topic, like sliding window. Add a company to narrow the results."`
- `t: "We search the live web"` → `t: "Search the live web"`
- `"The app asks a web-search-enabled model, through OpenRouter, for interview reports and prep lists on that topic."` → `"PrepRadar asks a web-search model, via OpenRouter, for interview reports and prep lists on that topic."`
- `"Every question shows the source it came from and a LeetCode link. Unsourced questions are dropped."` → `"Every question links to its source and to LeetCode. Questions without a source are removed."`
- `"Save questions to a checklist in this browser and mark them solved as you go."` → `"Save questions to a checklist in this browser and mark them solved as you practice."`
- `"Questions reported by candidates and prep sources. Verify before relying on them. Interview reports` → `"Interview reports`
- `are anecdotal and can be outdated.` → `are anecdotal and can be out of date, so verify questions before you rely on them.`
- `Pick a topic. Start.` → `Pick a topic. Start practicing.`
- `One topic, real sources, a checklist you control.` → `One topic. Real sources. A checklist you control.`

## components/search/search-form.tsx

- `placeholder="e.g. sliding window"` → `placeholder="Try “sliding window”"`
- `placeholder="Any company"` → `placeholder="All companies"`

## components/results/search-page.tsx

- `"Still searching. Web search plus analysis can take up to a minute."` → `"Still working. Searching and verifying sources can take up to a minute."`
- `"Searching the web, this can take up to a minute."` → `"Searching the web. This can take up to a minute."`
- `"Search failed."` → `"The search didn't complete. Try again."`
- `<p className="kicker text-muted-foreground">Live web search</p>` → `<p className="kicker text-muted-foreground">Live results</p>`
- `That doesn&apos;t look like a DSA topic.` → `That doesn&apos;t look like a DSA topic`
- `No sourced questions found for this search.` → `No sourced questions found`
- `We only show questions tied to a cited source. Try a broader topic, remove the company filter, or refresh later.` → `We only show questions backed by a cited source. Try a broader topic, remove the company, or refresh later.`
- `"Cached search deleted"` → `"Cached search removed"`
- `"Could not delete."` → `"Couldn't remove the cached search."`

## components/results/results-view.tsx

- `No questions match these filters.` → `No questions match these filters`
- `<option value="unsolved">Not solved</option>` → `<option value="unsolved">Unsolved</option>`

## components/results/question-row.tsx

- `"Could not update your checklist."` → `"Couldn't update your checklist."`
- `"Removed from saved"` → `"Removed from your checklist"`
- `toast.success("Saved", {` → `toast.success("Saved to your checklist", {`
- `<span>Asked at:</span>` → `<span>Asked at</span>`

## components/results/company-card.tsx

- `title="Computed from question count and distinct source domains"` → `title="Based on the number of questions and distinct source sites"`

## components/saved/saved-page.tsx

- `"Could not update browser storage."` → `"Couldn't update browser storage."`
- `No saved questions yet.` → `No saved questions yet`
- `Run a search and tap Save on the questions you want to practice.` → `Search a topic, then save the questions you want to practice.`
- `"Removed from saved"` → `"Removed from your checklist"`

## lib/storage.ts

- `"Browser storage is full. Delete cached searches to free space."` → `"Browser storage is full. Delete cached searches to free up space."`
- `"Could not write to browser storage."` → `"Couldn't save to browser storage."`

## lib/search-client.ts

- `"Could not reach the server. Check your connection and try again."` → `"Couldn't reach PrepRadar. Check your connection and try again."`
- ``The server returned an unreadable response (${res.status}).`` → ``We received an unexpected response (${res.status}). Try again.``
- ``Search failed (${res.status}).`` → ``The search didn't complete (${res.status}). Try again.``

## app/api/search/route.ts

- `"Request is too large."` → `"This request is too large."`
- `"Invalid request."` → `"This request isn't valid."`
- `"Too many searches. Wait a few minutes and try again."` → `"You've reached the search limit. Try again in a few minutes."`
- `"Something went wrong on our side."` → `"We hit an unexpected error. Try again."`

## lib/openrouter.ts

- `"Search is not configured on this server yet."` → `"Search isn't available right now. It hasn't been configured yet."`
- `"The model returned no answer. Try again."` → `"The search returned no answer. Try again."`
- `"The model's answer was cut off. Try a narrower topic."` → `"The answer was cut short. Try a more specific topic."`
- `"The model returned an empty answer."` → `"The search returned an empty answer. Try again."`
- `"The model returned malformed data. Try again."` → `"The search returned unreadable data. Try again."`
- `"The model's answer did not match the expected format."` → `"The answer wasn't in the expected format. Try again."`
- `"The search provider is busy. Try again in a minute."` → `"Search is busy right now. Try again in a minute."`
- `"The search provider had a temporary problem. Try again."` → `"Search is temporarily unavailable. Try again."`
- `"The search took too long. Try again."` → `"The search timed out. Try again."`
- `"Could not reach the search provider."` → `"Couldn't reach the search provider. Try again."`

## lib/schema.ts

- `"Topic must be at least 2 characters."` → `"Use at least 2 characters."`
- `"Topic must be 80 characters or fewer."` → `"Keep the topic under 80 characters."`
- `"Topic contains invalid characters."` → `"Remove unsupported characters from the topic."`
- `"Company must be 60 characters or fewer."` → `"Keep the company name under 60 characters."`
- `"Company contains invalid characters."` → `"Remove unsupported characters from the company name."`

## Sample/demo removal
- app/page.tsx: removed “or see a static example” link and the whole “Sample preview · static, not a live result / What a result looks like” section (fake companies, questions, sample-prep-list / sample-interview-experience links). The existing “How it works” steps section remains as the non-data visual.
- components/results/results-view.tsx: removed `sample` prop, “Sample · not live / This is a sample, not a live search.” banner, “Run a real search” button, “static example, not searched” label.
- components/search/search-form.tsx: removed sample-only `requestPrefill` helper.
- lib/sample.ts: deleted.
