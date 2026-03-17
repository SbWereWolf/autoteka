# Test specification for <task-slug>

## Target behavior

Describe the behavior the tests must prove.

## Test surface

- Unit: <tests/files>
- Integration: <tests/files>
- Smoke/manual: <steps>

## Red phase

### New or updated tests to add first

- <test name / file>
- <test name / file>

### Command(s)

```text
<command>
```

### Expected failing signal before implementation

Describe the failing assertion, error, or missing behavior that proves
this is a real red phase.

## Green phase

### Command(s)

```text
<command>
```

### Expected passing signal after implementation

Describe the passing result.

## If a true red phase is not meaningful

State why not, and define the strongest available alternative:

- characterization test;
- contract test;
- smoke test;
- manual verification steps.

## Evidence log

- <date> — red phase observed: <yes/no + note>
- <date> — green phase observed: <yes/no + note>
