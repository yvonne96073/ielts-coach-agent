# Evaluation Plan

## What To Evaluate

- Does the agent correctly identify the learner's error pattern?
- Does the feedback include evidence?
- Is the next drill matched to the actual weakness?
- Does vocabulary review reduce repeated misses?
- Are Speaking and Writing rewrites natural instead of memorised?

## Sample Test Case

Input:

```text
Question type: TFNG
Learner answer: True
Correct answer: Not Given
Reasoning: The programme was introduced to reduce pollution.
```

Expected diagnosis:

```text
Likely method: treated intention as result
Error pattern: over-inference
Next drill: intention vs result TFNG
```
