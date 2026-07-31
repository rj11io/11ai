---
name: 11ai-operator-aws-cli-v2-costs
description: "Report AWS spend and find what drove a change, covering Cost Explorer queries grouped by service, account, or tag, month-over-month and daily comparisons, unblended versus amortized cost, forecasts, budgets and alerts, untagged spend, and the usual sources of a sudden increase. Use when a bill must be explained, when spend has jumped, when a budget or alert must be created, or when cost must be attributed to a team or project."
---
# 11ai AWS costs

Version baseline: AWS CLI v2, using the latest stable v2 patch available for the host platform (2.36.x at this review). Reject AWS CLI v1-only behavior and inspect aws --version plus the live v2 command help before composing commands.

Cost data is read-only, which makes this the safest skill in the plugin — with one exception: Cost Explorer charges per API request, so a broad daily query over a long window has its own small cost. Ask a narrow question, then widen it.

Cost data also lags by up to a day, so today's figures are always incomplete. Never diagnose a spike from a partial day.

## Establish the baseline

```bash
aws ce get-cost-and-usage \
  --time-period Start=2026-06-01,End=2026-08-01 \
  --granularity MONTHLY --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --query 'ResultsByTime[].{Start:TimePeriod.Start,Groups:Groups[].{Service:Keys[0],Amount:Metrics.UnblendedCost.Amount}}' \
  --profile PROFILE
```

`End` is exclusive, so that window covers June and July. Getting this wrong by a day is the most common reason two reports disagree.

Which metric to ask for:

- **`UnblendedCost`** is what the account is charged. Use it to explain a bill.
- **`AmortizedCost`** spreads a reservation or savings plan payment across the period it covers. Use it to compare months fairly when a commitment was bought.
- **`BlendedCost`** averages across an organization and rarely answers a practical question.

Comparing an `UnblendedCost` month containing an upfront payment against one without it produces a spike that is not a spend increase. Use amortized cost for trend questions.

## Find what changed

Compare two periods at the same granularity, then narrow to the service that moved:

```bash
aws ce get-cost-and-usage \
  --time-period Start=2026-07-01,End=2026-07-31 \
  --granularity DAILY --metrics UnblendedCost \
  --filter '{"Dimensions":{"Key":"SERVICE","Values":["Amazon Elastic Compute Cloud - Compute"]}}' \
  --query 'ResultsByTime[].{Day:TimePeriod.Start,Amount:Total.UnblendedCost.Amount}' \
  --profile PROFILE
```

```bash
aws ce get-cost-and-usage \
  --time-period Start=2026-07-01,End=2026-08-01 \
  --granularity MONTHLY --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=USAGE_TYPE \
  --filter '{"Dimensions":{"Key":"SERVICE","Values":["Amazon Simple Storage Service"]}}' \
  --profile PROFILE
```

Daily granularity is what pinpoints the day a change started; usage type is what names the specific charge — storage versus requests versus data transfer. A cost increase with flat usage is a pricing or region change; rising usage is a workload change.

The usual causes, worth checking in this order: data transfer out of a region, NAT gateway processing, storage that only grows because nothing expires it, a forgotten test environment left running, logs retained forever, and idle load balancers or provisioned capacity. Data transfer and NAT processing are the two that surprise people most, because neither appears as a resource anyone created.

## Attribute spend to a team

```bash
aws ce get-cost-and-usage \
  --time-period Start=2026-07-01,End=2026-08-01 \
  --granularity MONTHLY --metrics UnblendedCost \
  --group-by Type=TAG,Key=Project \
  --profile PROFILE
aws ce list-cost-allocation-tags --status Active --profile PROFILE
```

A tag must be activated as a cost allocation tag before it appears here, and activation is not retroactive — it applies from the month it was enabled. Report the untagged portion explicitly; a report that silently omits it understates every team's share.

## Forecast, budget, and alert

```bash
aws ce get-cost-forecast \
  --time-period Start=2026-08-01,End=2026-09-01 \
  --metric UNBLENDED_COST --granularity MONTHLY --profile PROFILE
aws budgets describe-budgets --account-id ACCOUNT_ID --profile PROFILE \
  --query 'Budgets[].{Name:BudgetName,Limit:BudgetLimit.Amount,Type:BudgetType}'
```

A forecast extrapolates recent usage and does not know about a planned launch or shutdown, so present it as a projection rather than a number.

Creating a budget is an account change and it sends notifications to real people, so confirm the threshold and the recipients before creating one. Prefer an alert at a percentage of a monthly limit plus a forecast-based alert, so a slow overrun and a sudden spike both surface.

Nothing in this skill reduces spend on its own. Turning something off to save money is a change to that resource, with its own approval, in the skill that owns it.

## Report

State the account or accounts, the exact time period with its exclusive end date, the metric used and why, the totals by service, the specific day and usage type where a change began, the likely driver, the untagged share when attributing by tag, and any budget or alert created with its threshold and recipients. Say plainly that recent days are incomplete, and separate what the data shows from what you infer caused it.
