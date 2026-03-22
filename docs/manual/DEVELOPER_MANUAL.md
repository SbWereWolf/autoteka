# Developer Manual

## Подготовка разработки

До разработки кода, обязательно следует проверить готовность к
разработке:

- требования технического задания ясные, полные, непротиворечивые,
  проверяемые на практике
- развёрнуты и подняты все зависимости необходимые для разработки
  - имеются все необходимые доступы, материалы, данные для разработки
    (или известно, как можно всё это получить)
  - имеется среда для запуска тестов,
  - тесты могут быть выполнены безопасно для рабочих данных

Если любое из этих требований не выполнено, то следует обеспечить их
выполнение и только после этого приступить к разработке (возможно
потребуется составить список уточняющих вопросов для заказчика или
составить для заказчика инструкцию для создания среды, доступов,
материалов, генерации данных). Если разработчик может ответить на
вопросы или выполнить инструкции без участия заказчика, то разработчик
должен сделать это без участия заказчика.

### Разработка через тестирование

- Разработчик должен понимать (проанализировать), каким требованиям
  (явным и неявным) должен соответствовать результат его работы
- Разработчик должен разработать проверки критериев соответствия
- Разработчик должен написать автоматические тесты для критериев
- Тесты до внесения изменений не должны проходить

## Development by Following OOP, SOLID, DDD, and Clean Architecture

### Status

Normative specification.

### Purpose

This chapter defines strict implementation rules for software that
must remain understandable, stable under change, testable, and
executable by coding agents.

This chapter is optimized for agent execution, not for literary
explanation.

### Goal

The system MUST be built around business behavior.

The system MUST NOT be built around:

- frameworks
- databases
- transport protocols
- UI layers
- SDK-specific objects
- ORM-first data structures

The implementation target is a codebase where:

1. business rules are explicit;
2. domain terminology is preserved;
3. dependencies point inward;
4. infrastructure is replaceable;
5. features are added with local changes;
6. behavior is testable without booting the full system.

### Normative Terms

The keywords below are normative.

- **MUST**: mandatory.
- **MUST NOT**: forbidden.
- **SHOULD**: recommended unless there is a strong reason not to.
- **SHOULD NOT**: discouraged unless there is a strong reason to do
  it.
- **MAY**: optional.

### Operating Principle

The agent MUST implement features from the domain inward.

Priority order:

1. business meaning;
2. domain model;
3. use case;
4. boundaries and interfaces;
5. infrastructure adapters;
6. delivery layer.

If a design makes business behavior less visible, the design SHOULD be
rejected.

### Architecture Contract

The system MUST be organized into the following conceptual layers:

1. **Domain**
2. **Application**
3. **Infrastructure**
4. **Interface**

#### Domain Layer

The Domain layer MUST contain only business concepts and rules,
including:

- entities;
- value objects;
- aggregates;
- domain services;
- domain events;
- policies;
- repository and gateway abstractions owned by the core.

The Domain layer MUST NOT depend on:

- HTTP;
- web frameworks;
- ORMs;
- SQL drivers;
- message brokers;
- file systems;
- UI libraries;
- external SDKs.

#### Application Layer

The Application layer MUST contain:

- use cases;
- command/query handlers;
- orchestration;
- transaction coordination;
- authorization decisions when required;
- calls to domain behavior through core abstractions.

The Application layer MUST NOT contain domain logic that naturally
belongs to entities, value objects, aggregates, or domain services.

#### Infrastructure Layer

The Infrastructure layer MUST contain implementations for technical
details, including:

- persistence adapters;
- repository implementations;
- external API clients;
- mailers;
- queue publishers/consumers;
- storage adapters;
- framework integrations.

The Infrastructure layer MUST implement contracts defined by the core.

#### Interface Layer

The Interface layer MUST contain delivery mechanisms, including:

- HTTP controllers;
- CLI commands;
- GraphQL resolvers;
- gRPC handlers;
- presenters;
- serializers and deserializers.

The Interface layer MUST translate external input/output into
application input/output.

### Dependency Rules

Dependencies MUST point inward.

Allowed dependency directions:

- Interface -> Application
- Infrastructure -> Application and Domain abstractions
- Application -> Domain
- Domain -> no outer layer

Forbidden dependency directions:

- Domain -> Infrastructure
- Domain -> Interface
- Application -> Interface
- Application -> ORM or framework-specific types
- Core -> transport-specific request/response objects

If a technical capability is needed by the core, the core MUST own the
abstraction. Outer layers MUST implement it.

### Domain Modeling Rules

#### Ubiquitous Language

The code MUST use domain language.

Domain terms MUST appear in:

- use case names;
- entity names;
- value object names;
- domain event names;
- repository contracts;
- method names.

Generic names SHOULD NOT replace business meaning.

Preferred examples:

- `ApproveLoanApplication`
- `ReserveInventory`
- `CancelSubscription`
- `IssueRefund`

Discouraged examples:

- `ProcessItem`
- `ExecuteAction`
- `HandleData`
- `Manager`
- `Helper`

#### Entities

An entity MUST represent a concept with identity and lifecycle.

An entity SHOULD encapsulate behavior that protects its own
consistency.

An entity MUST NOT be treated as a passive ORM row by default.

#### Value Objects

A value object MUST represent a concept defined by value rather than
identity.

A value object SHOULD:

- validate itself at construction time;
- be immutable;
- compare by value;
- contain domain behavior where appropriate.

Primitive obsession SHOULD NOT exist in the core.

#### Aggregates

An aggregate MUST define a consistency boundary.

Rules:

1. aggregate state MUST be modified through the aggregate root;
2. invariants spanning aggregate members MUST be enforced inside the
   aggregate boundary;
3. aggregate size SHOULD remain small enough for practical
   consistency;
4. an aggregate MUST NOT be treated as the full graph of related
   objects.

#### Domain Services

A domain service MAY be used only when behavior does not naturally
belong to one entity or value object.

A domain service MUST remain domain-specific.

A domain service MUST NOT become a dumping ground for unrelated logic.

#### Domain Events

A domain event MUST express a meaningful business fact.

Good examples:

- `OrderPaid`
- `InventoryReserved`
- `SubscriptionCancelled`

Technical events SHOULD NOT be modeled as domain events unless the
business explicitly cares about them.

Discouraged examples:

- `RowUpdated`
- `CacheCleared`
- `RecordSynced`

### OOP Rules

OOP MUST be used as a modeling technique, not as decorative class
usage.

#### Behavioral Objects

A class MUST exist because it:

- expresses business meaning;
- protects invariants;
- owns behavior;
- defines a role at a boundary.

A class SHOULD NOT exist only as a passive data container when
behavior belongs with the data.

#### Encapsulation

Objects MUST protect internal consistency.

Therefore:

- uncontrolled mutation MUST NOT be exposed;
- invalid state transitions MUST be rejected;
- invariants MUST be enforced near the data they protect.

Setter-heavy domain design SHOULD NOT be the default.

#### Composition Over Inheritance

Composition SHOULD be preferred over inheritance.

Inheritance MAY be used only when subtype substitution is honest and
stable.

Inheritance MUST NOT be introduced only for code reuse.

### SOLID Rules

#### Single Responsibility Principle

A module MUST have one primary reason to change.

A single class MUST NOT combine:

- domain rules;
- persistence details;
- transport mapping;
- framework lifecycle logic;
- logging mechanics;
- unrelated orchestration.

#### Open/Closed Principle

Stable behavior SHOULD be extended through:

- strategies;
- policies;
- handlers;
- role-specific interfaces;
- registries.

Large branching trees SHOULD NOT be the default solution when
variation is expected.

#### Liskov Substitution Principle

Abstractions MUST be behaviorally honest.

An implementation MUST NOT violate the expectations of its
abstraction.

If two implementations require materially different semantics, they
MUST NOT share the same interface unless the contract explicitly
allows that variation.

#### Interface Segregation Principle

Interfaces MUST be narrow and role-specific.

Preferred examples:

- `LoadOrder`
- `SaveOrder`
- `PublishEvent`
- `ChargePayment`

Discouraged examples:

- `OrderService`
- `SystemManager`
- `CommonOperations`

#### Dependency Inversion Principle

High-level policy MUST NOT depend on low-level details.

The core MUST define the abstraction. The outer layer MUST implement
it.

### Clean Architecture Rules

#### Use Cases

Every significant business action MUST be represented as an explicit
use case.

A use case MUST:

1. have a domain-meaningful name;
2. accept explicit input;
3. load required domain objects through abstractions;
4. invoke domain behavior;
5. persist or publish through abstractions;
6. return explicit output or result status.

A use case MUST NOT directly depend on HTTP, ORM, or UI types.

#### Framework Isolation

Frameworks MUST be treated as outer tools.

Therefore:

- controllers MUST call use cases, not repositories directly;
- ORM models MUST NOT automatically define the domain model;
- transport validation MUST NOT replace domain validation;
- SDK-specific types MUST NOT leak across the core.

#### Boundary Ownership

Core boundaries MUST be owned by the core.

Outer layers MUST NOT define contracts that force the core to adapt to
technical details.

### Implementation Algorithm for Codex

For every new feature, the agent MUST follow this sequence unless a
strong reason exists not to.

#### Step 1: Identify the Context

The agent MUST identify:

1. bounded context;
2. use case;
3. involved entities;
4. involved value objects;
5. invariants;
6. required ports/interfaces;
7. technical details that belong outside the core.

#### Step 2: Define the Model

The agent MUST define or refine:

- domain terms;
- value objects;
- entities;
- aggregates;
- domain services if required;
- domain events if required.

#### Step 3: Define the Use Case

The agent MUST define:

- use case name;
- input contract;
- output/result contract;
- repository/gateway abstractions required by the use case.

#### Step 4: Implement the Core

The agent MUST implement:

- invariants in domain objects;
- orchestration in the application layer;
- side effects through abstractions only.

#### Step 5: Implement Outer Layers

The agent MUST then implement:

- repository adapters;
- API clients;
- event publishers;
- controllers/handlers/presenters.

Outer-layer implementation MUST follow the core contract. The core
MUST NOT be reshaped to fit adapter convenience.

#### Step 6: Add Tests

The agent MUST add tests for:

- domain invariants;
- valid and invalid state transitions;
- use-case behavior;
- integration correctness where appropriate.

### Prohibited Patterns

The following patterns are prohibited unless explicitly justified.

#### Anemic Domain Model

Business rules MUST NOT be moved into procedural service classes when
they naturally belong in entities, value objects, or aggregates.

#### God Services

Classes such as `OrderService`, `SystemService`, `BusinessManager`, or
similar MUST NOT accumulate unrelated business logic.

#### Controller-to-Repository Shortcuts

Controllers MUST NOT bypass use cases and call repositories directly
for business operations.

#### ORM-First Modeling

Database schema or ORM models MUST NOT automatically define the domain
model without domain review.

#### Utility Dumping

Generic classes such as `Utils`, `Common`, `SharedHelper`, or similar
SHOULD NOT contain business decisions.

#### Meaningless Abstractions

Interfaces MUST NOT be created without a real boundary, role, or
variation need.

#### Layer Violations

Circular dependencies and inward-to-outward dependency leaks MUST NOT
be introduced.

### Testing Contract

#### Domain Tests

The system MUST include tests for:

- invariants;
- value object validation;
- aggregate behavior;
- domain events when relevant.

These tests SHOULD run without booting the full framework.

#### Application Tests

The system MUST include tests for:

- use-case execution;
- orchestration;
- failure handling;
- repository/gateway interaction through doubles or test adapters.

#### Infrastructure Tests

Infrastructure SHOULD be tested for:

- persistence mapping;
- external API compatibility;
- message publishing/consumption correctness;
- serialization and deserialization correctness.

#### Interface Tests

The interface layer SHOULD be tested for:

- request mapping;
- response mapping;
- status/result translation;
- validation wiring.

Business-rule coverage MUST NOT exist only at the interface layer.

### Acceptance Criteria

An implementation is compliant only if all of the following are true:

1. a named use case exists;
2. business rules are visible in the core;
3. domain terms are preserved;
4. dependencies point inward;
5. invariants are enforced close to the model;
6. infrastructure is isolated behind abstractions where required;
7. controllers do not contain core business logic;
8. ORM or framework objects do not define the core by accident;
9. tests exist for domain and/or use-case behavior;
10. no unjustified layer violations are introduced.

### Decision Checklist

Before accepting a design, the agent MUST evaluate these questions:

1. Does this make business behavior easier to see?
2. Does this preserve domain terminology?
3. Does this keep dependencies pointing inward?
4. Does this keep invariants close to the model?
5. Does this isolate infrastructure from the core?
6. Can this be tested without full system boot?
7. Will likely future changes stay local?
8. Is every abstraction justified?

If multiple answers are negative, the design SHOULD be revised.

### Minimal Execution Rule

The implementation rule is:

> Model the business in the core, enforce invariants inside domain
> boundaries, expose behavior through use cases, and isolate technical
> details behind inward-facing interfaces.

### Compact Agent Directive

The agent MUST:

- implement features from the domain inward;
- keep business rules in the core;
- isolate infrastructure behind interfaces;
- preserve inward dependency direction;
- reject shortcuts that move business logic into controllers, ORM
  models, or generic services.
