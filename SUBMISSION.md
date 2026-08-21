# Submission answers — Session 8

---

## Question 1

**Live app:** https://era-v5-session8-attention.netlify.app
**Repo:** `<PASTE GITHUB URL>`

---

## Question 2 — What the timeline actually shows

Six things became visible only after the mechanisms were sorted by ship date. Every date below is an arXiv v1 submission timestamp or a primary release note; the full source table is in the repo README.

**1. The first thing on the timeline is not attention.**

Learned absolute position embeddings arrive on **8 May 2017** in Gehring et al., *Convolutional Sequence to Sequence Learning* (arXiv 1705.03122) — thirty-five days before *Attention Is All You Need* (**12 June 2017**, arXiv 1706.03762), which cites it as reference [9]. Taught as a list starting with standard attention, positions look like an accessory bolted on afterwards. In date order the accessory came first and the Transformer inherited it. This also means the session's own teaching order is chronologically inverted at the very first step.

**2. There are two long silences, and they mean opposite things.**

The timeline contains a **680-day** gap (12 Jun 2017 → 23 Apr 2019) and a **633-day** gap (27 Aug 2021 → 22 May 2023). Both are longer than any other gap on the page, and only one of them is interesting.

The first is unremarkable. Sequences were short, models were small, and nobody was paying a bill large enough to complain about. That is silence from absence of pressure.

The second is the anomaly. It spans ChatGPT's launch and the most heavily funded period in the field's history — pressure at maximum — and still produced nothing on the covered list.

The cause sits inside it and is not an attention variant at all: **FlashAttention**, **27 May 2022**, arXiv 2205.14135. It computes *exact* softmax attention, unchanged, but tiles the computation so the N×N matrix is never materialised in GPU HBM. It made attention dramatically faster without approximating anything — and when exact attention got cheap, the incentive to approximate it collapsed. The 2019–2021 wave of sparse, linear and windowed approximations simply stopped.

The wave restarts in 2023 for a *different reason*, and this is the part a list cannot show. Pre-2022 work optimises **training** compute. Post-2023 work — GQA, MLA, attention sinks, sparse — optimises **inference serving**. Same quadratic problem, different payer. The bill moved from training the model once to serving it to millions of people, and the mechanisms changed shape to match.

**3. An entire branch of the field was built by hobbyists, not labs.**

NTK-aware scaled RoPE has no paper. It is a **June 2023** post by /u/bloc97 on r/LocalLLaMA. Two months later the same person — Bowen Peng — is first author on **YaRN** (**31 Aug 2023**, arXiv 2309.00071); the paper's author block carries the Reddit handle. Meta's **Position Interpolation** paper (**27 June 2023**, arXiv 2306.15595) credits independent blogger *kaiokendev* for a concurrent 2K→8K result. And as late as **December 2025**, Sakana AI's DroPE paper still cites the Reddit thread as the canonical NTK reference.

Three of the four context-extension methods in mid-2023 originate outside formal publication. A list of mechanisms hides the fact that one of them was never published at all.

**4. The newest-looking idea on the timeline is the oldest.**

DeltaNet (**10 June 2024**, arXiv 2406.06484) and Gated DeltaNet (**9 Dec 2024**, arXiv 2412.06464) read as recent inventions. But Schlag, Irie & Schmidhuber (**22 Feb 2021**, arXiv 2102.11174) prove that linearised attention is formally equivalent to **Fast Weight Programmers** — Schmidhuber, *Neural Computation* 4(1):131–139, **1992**. Twenty-five years before the Transformer.

What happened in 2024 was not invention but *parallelisation*: reformulating the sequential delta update as products of Householder matrices so it trains over sequence length. In date order you can watch the field abandon recurrence for attention in 2017, hit an unaffordable quadratic bill, and go back and rediscover pre-transformer recurrent memory once it needed a fixed-size state again.

**5. The positional-encoding thread ends by arguing the mechanism should be deleted.**

Learned absolute (2017) → sinusoidal (2017) → RoPE (2021) → ALiBi (2021) → a dense 2023 cluster of *patches to RoPE* (PI in June, NTK in June, YaRN in August) → and then **DroPE** (**13 Dec 2025**, arXiv 2512.12167, Sakana AI + Oxford), which argues positional embeddings are a training scaffold and removes them entirely after pretraining, recalibrating at the original context length for under 1% of the pretraining budget.

Six years of adding positional machinery, concluding that the best long-context behaviour comes from throwing it away. Grouped by family that reads as "another position method." In date order it is a reversal.

**6. Two mechanisms shipped before this session that were not covered.**

See below.

---

### Mechanisms not covered, with dates and sources

**Compressed Sparse Attention (CSA) and Heavily Compressed Attention (HCA)**
**26 April 2026** — arXiv **2606.19348**, *DeepSeek-V4: Towards Highly Efficient Million-Token Context Intelligence*, DeepSeek-AI. Date is the arXiv v1 submission line: `[v1] Sun, 26 Apr 2026 14:49:33 UTC`.

Two distinct mechanisms, interleaved across layers. CSA consolidates every *m* entries of the KV cache into one, then runs DSA-style top-k selection over the compressed entries. HCA uses a much larger compression rate but keeps attention dense over what survives. Together they report **27% of the single-token inference FLOPs and 10% of the KV cache** of DeepSeek-V3.2 at one-million-token context.

These are the direct continuation of DSA, which *was* covered — and they are the timeline's final move: the field stops looking for one trade that fixes both bills and splits the problem, aiming one mechanism at memory and another at compute.

**FlashAttention** — **27 May 2022**, arXiv **2205.14135** (Dao, Fu, Ermon, Rudra, Ré). Included with a caveat: it is arguably *not* an attention variant, since it changes no mathematics and returns exact attention. It is an IO-level optimisation. I include it because it is the only thing that explains the 633-day gap, and because the distinction between "changed the maths" and "changed the memory movement" is itself worth drawing on a timeline of cost-reduction techniques.

**Position Interpolation** — **27 June 2023**, arXiv **2306.15595** (Chen, Wong, Chen, Tian, Meta). Not on the covered list, but NTK-aware and YaRN are both direct responses to it. Without it, that stretch of the timeline has effects with no cause.

---

### One correction offered

**NSA and DSA are two mechanisms, not one.** The brief lists "compressed and sparse attention as DeepSeek does it" as a single item. They are separate, seven months apart, and answer different problems:

- **Native Sparse Attention** — 16 Feb 2025, arXiv 2502.11089. Sparsity trained in *from scratch*, hardware-aligned kernels, no retrofit path.
- **DeepSeek Sparse Attention** — released 29 Sep 2025 with DeepSeek-V3.2-Exp (paper arXiv 2512.02556, Dec 2025). Sparsity *retrofitted* onto an already-trained dense checkpoint via a lightning indexer.

DeepSeek did the expensive, principled thing first and the cheap, practical thing second — which on a timeline reads as a deliberate move toward deployability, not a compromise.

---

### A note on method

Every date was checked individually against the paper's own abstract page or primary release note. Not conference year — ALiBi is Aug 2021, not ICLR 2022; attention sinks is Sep 2023, not ICLR 2024; Gated DeltaNet is Dec 2024, not ICLR 2025. Not last-revised date — RoFormer's latest version is Nov 2023, but RoPE is April 2021.

The repo contains `dates.json`, where each entry carries its own source URL, the verbatim `[v1]` line, and a status field. Anything unverified was blocked from rendering during the build rather than checked afterwards. `test_invariants.js` runs 96 assertions covering chronological ordering, field completeness, a minimum of two honest costs per mechanism, coverage of the full brief list, and each of the six findings independently. Coverage is checked item by item against the brief's own "At minimum cover" sentence, requiring a *dedicated card* for each — being mentioned inside another entry does not count. That check caught two gaps in an earlier draft: sinusoidal had been folded into the Transformer card, and top-k existed only as a phrase inside other entries. Both now stand alone (sinusoidal, 12 Jun 2017, arXiv 1706.03762; top-k attention, 13 Jun 2021, arXiv 2106.06899).

Performance figures were audited the same way, since the brief warns about half-remembered techniques as well as invented dates: every quoted number is traced in a `claims_provenance` block in `dates.json`. That pass produced four corrections, all cases where the page had dropped a paper's own "up to" hedge or omitted the basis of a comparison (ALiBi's 11% saving comes from training on shorter sequences, which the original wording hid). One date is flagged as weaker evidence rather than quietly levelled up: MQA resolves to **6 Nov 2019** from the abstract page's indexed date on a single-version paper with no revisions, but no explicit `[v1]` line was located in any source read.

---

### What comes next

The brief says the reason for asking is that a timeline lets you guess what follows. So the app does not stop at the present. It ends with three predictions, each extending a trend already dated on the page and each stating what would falsify it.

**One — architectures stop being "an attention mechanism" and become a schedule.** Every mechanism after 2024 proposes mixing rather than replacing: the Gated DeltaNet paper recommends hybrids with sliding-window attention, Qwen3-Next ships three linear layers per full-attention layer, DeepSeek-V4 interleaves CSA and HCA at different rates. Prediction: "what attention does this model use" becomes an ill-formed question, and the layer schedule becomes a published, tuned artifact. Falsified by a frontier model shipping one uniform mechanism per layer and beating hybrids at equal cost.

**Two — the next wins come from retrofit-ability, not better mathematics.** GQA won over MQA partly by uptraining from existing MHA weights at ~5% of pretraining compute. Top-k attention was notable in 2021 for needing no corrective pretraining. NSA was the stronger, principled design and required training from scratch; DSA was weaker in principle, retrofittable in practice, and it is the one that shipped to production and halved the API price. Prediction: a mechanism 10% worse but installable on an existing checkpoint keeps beating one 20% better that demands a fresh pretraining run.

**Three — softmax normalisation is the next thing deleted.** The field patches a component for years, then someone shows it was scaffolding and removes it — which just happened to positional embeddings via DroPE. The same shape of evidence already exists for softmax: attention sinks exist *because* softmax must sum to one, so with nothing worth attending to the model dumps mass on the first token, and the fix is to keep four meaningless tokens permanently resident. That is a workaround for a constraint. Prediction: the normalisation constraint gets relaxed rather than accommodated, and sinks stop being necessary rather than being managed.

I would bet against the third one first. The timeline itself shows why forecasting here is hard: in 2021 the strongest available signal was that the field had stopped caring about attention efficiency, and that signal was wrong — FlashAttention had simply removed the incentive for a while.

---

## Question 3 — LinkedIn / X post

I put every attention mechanism since 2017 on a timeline, ordered by the date it actually shipped.

Not grouped by family. Not in teaching order. Chronological.

Six things showed up that I could not see as a list:

→ The first item isn't attention. Learned positional embeddings ship 8 May 2017 in ConvS2S — 35 days before "Attention Is All You Need," which cites it as reference [9].

→ There are two long silences and they mean opposite things. A 680-day gap in 2017–19 is just a field not yet paying a big enough bill. A 633-day gap in 2021–23 spans ChatGPT's launch with pressure at maximum — and produced nothing. The cause is FlashAttention (May 2022), which made *exact* attention fast without approximating anything. When exact got cheap, approximating it stopped being worth doing.

→ The wave restarts in 2023 for a different reason. Pre-2022 work optimises training compute. Post-2023 work optimises inference serving. Same quadratic problem, different payer.

→ A whole branch was built by hobbyists. NTK-aware RoPE scaling has no paper — it's a Reddit post. Two months later the same person first-authors YaRN. Sakana AI still cites the Reddit thread in Dec 2025.

→ The newest-looking idea is the oldest. DeltaNet traces to Schmidhuber's Fast Weight Programmers — Neural Computation, 1992. Twenty-five years before the Transformer. 2024 contributed parallelisation, not invention.

→ The positional thread ends by deleting itself. Six years of adding positional machinery, then DroPE (Dec 2025): remove the positional embeddings after pretraining and long-context behaviour improves.

Vanilla attention was never wrong. It was expensive. Everything since is somebody looking at that bill and trying to pay less of it.

Every date checked against the paper's own abstract page — not conference year, not last-revised. The repo ships a verification ledger and 96 assertions that fail the build if any claim breaks.

`<LINK>`

#LLM #Transformers #MachineLearning #ERAV5
