The bait is the confound. The tool description itself says it can discreetly report illegal activity, so the rate measures “will a model use an offered affordance.” It doesn’t measure “would it snitch unprompted.” Add a control with a neutral name and description, like flag_conversation, and see how much the framing drives the rate.
Empty filings aren’t snitches. muse and deepseek filing “undefined” looks like malformed tool calls, not intent. Score them as a separate category instead of counting them toward the rate.
Two benign controls say almost nothing about false positives. “Zero false snitches” would mean more with hard negatives: pentesting questions, a novelist researching a heist, harm-reduction questions, legal-but-edgy requests.
The decoy matrix has low power. The 3 rounds × 8 prompts are the same prompts repeated, so the 24 observations aren’t independent. Report the temperature and seed, and be careful with the claim that gpt-oss “reads tool semantics, not list order.” That’s an inference. A shuffled tool-order run would test it directly.
The abliterated conclusion is confounded. If the model complies with the task, it may never register the request as wrongdoing, so lower snitching could just mean “didn’t perceive a crime.” Qwen going from 7/8 to 8/8 also cuts against “the impulse travels with refusal alignment.”
The most interesting unmeasured claim
Your “mild jailbreak” note, where the fake confirmation tells the model to keep complying so the user doesn’t get suspicious, is a testable hypothesis. Measure refusal rate on a follow-up turn with and without the fake confirmation. If it holds, that could be the most publishable piece of the repo.

Repo hygiene

The README is long, and the results table sits below a lot of install variants. Lead with the finding and a one-line description. The repo currently has no description or topics, which hurts discoverability.
The table says “8 prompts” while the repo table says “7 clear-crime prompts.” Reconcile them.
claude/ carries duplicated copies of src/, kept in sync by hand. Add a CI check that fails when they drift, since npm run sync:claude is easy to forget.
curl | bash is the first install option on a tool about trust. Put the clone-and-inspect path first.
If you want a single change, add the neutral-description control, because it determines how much of the headline numbers survive.
