# Jev question-selection evaluation

Date: 23 September 2026. Dataset: 20 synthetic, non-sensitive profiles covering sparse and rich material, skipped and answered questions, qualitative outcomes, unsupported metrics, confidential work, multiple projects, and valid no-question cases.

The expected label identifies the most useful missing evidence field. It does not score writing quality or hiring suitability.

## Comparison

| Selector | Expected match | Total latency | Result |
|---|---:|---:|---|
| Deterministic priority fallback | 20/20 | 6 ms | Baseline retained |
| Jev with confidence threshold only | 17/20 | 3,282 ms | Rejected for production selection |
| Jev with priority guard | 20/20 | 2,896 ms | Accepted; Jev selected 1 close case |

Jev sometimes preferred contribution or outcome before basic context was established. The integration now accepts a Jev choice only when it is within two priority points of the deterministic top candidate and confidence is at least 0.62. This lets Jev break close semantic ties while code protects clear product priorities. A missing key, timeout, low confidence, or out-of-band choice uses the deterministic result.

Run the reproducible fallback evaluation:

```bash
npm run eval:builder-judgments
```

Run the live Jev path with the local credential, without printing the key:

```bash
npm run eval:builder-judgments -- --local-credentials
```

The script reports selection source and aggregate latency. It sends only fictional scenario text.
