# Sharp-Dependency-Injection

[![codecov](https://codecov.io/gh/Baizey/ts-dependency-injection/branch/master/graph/badge.svg?token=BD76USM0X4)](https://codecov.io/gh/Baizey/ts-dependency-injection)

Simple type strong dependency injection

## Goals of this package

- Minimal impact on how you write individual objects
- Draw inspiration from .net core's dependency injection, but with a distinct ts/js flavor
- Avoid decorators and other pre-processing magic as much as possible
- Strong type checking

## Quick start

The recommended structure for a class in the IoC flow is something like this:

````
// A.ts
type ADep = BIoC & CIoC
export class A {
    constructor({b, c}: ADep)
}
export const aIoC = { a: singleton(A) } // lifetime is either singleton, scoped, transient or scoped
export type AIoC = DependenciesOf<typeof AIoC> // turns { a: lifetime(A) } into { a: A }
````

Note that the ``ADep`` and ``AIoC`` are convenience patterns to help typechecking and later refactoring

Also note that any object-type is supported by
doing ``singleton({factory: (provided, props, provider, context) => ... })`` instead of the shorthand for classes

````
// IoC.ts
const dependencies = { ...aIoC, ...bIoC, ...cIoC }
export type Dependencies = DependenciesOf<typeof Dependencies>
const services = new ServiceCollection(dependencies)
const provider = services.build()
export providerProxy: Dependencies = provider.proxy
````

The ``providerProxy`` can then be used anywhere to provide any of the registered properties for ``AIoC``,``BIoC``,
or ``CIoC``

alternatively you can also use the provider itself the difference is primarily semantics that
``const {a} = providerProxy`` vs ``const a = provider.provide('a')``

# Performance

A simple performance test has been done with the dependency structure:

- A: no dependencies
- B: depends on A
- C: depends on B
- D: depends on A, B and C

All dependencies are set up to all uses the lifetime being tested

Below is the average time it took to provide A or D over 1_000_000 provisions in nanoseconds

A best showcases the expected performance per resolution,
while D showcases how the different lifetime affect performance

| Lifetime  | DI (A) (ns) | DI (D) (ns) | Raw JS (D) (ns) |
|-----------|------------:|------------:|----------------:|
| Singleton |           6 |          15 |               3 |
| Scoped    |         230 |        1930 |               4 |
| Transient |         227 |        3133 |               2 |
| Stateful  |          70 |         109 |              17 |

# API

## Type references throughout

```
Generics used throughout:
T is the type being provided by a lifetime, note that statefuls are actually Stateful<Prop, T>
E is always your custom class dictating which dependencies the ServiceCollection will require to be added
P is props for any stateful dependencies, for any non-stateful this will be defaulted as void/undefined
KE is an extra generic to allow typescript to figure stuff out, with an unknown object having a key to either add or remove from E  
    
type Key<E> = keyof E & (string)

type LifetimeCollection<E = any> = { [key in keyof E]: ILifetime<unknown, E> }
type MatchingProperties<T, E> = { [K in keyof E]: E[K] extends T ? K : never }[keyof E]
type SelectorOptions<T = any, E = any> = { [key in MatchingProperties<T, E>]: key & Key<E> }
type Selector<T, E> = Key<E> | (( e: SelectorOptions<T, E> ) => Key<E>)

type Stateful<P, T> = { create( props: P ): T }

type Factory<T, P, E> = ( provider: E, props: P, scope: ScopedServiceProvider<E> ) => T

type LifetimeConstructor<T = any, P = void, E = any> =
	{ new( name: Key<E>, factory: Factory<T, P, E> ): ILifetime<T, E> }
	
type StatefulConstructor<T, P, E> = { new( provider: E, props: P ): T }

type NormalConstructor<T, E> = { new( provider: E ): T } | { new(): T }

type FactoryOption<T, P, E> = { factory: Factory<T, P, E> }
type ConstructorOption<T, E> = { constructor: NormalConstructor<T, E> }
type DependencyOption<T, E> = FactoryOption<T, void, E> | ConstructorOption<T, E>
type DependencyInformation<T, E> = { lifetime: LifetimeConstructor } & DependencyOption<T, E>

type DependencyMap<E, F> = { [key in keyof F]: DependencyInformation<F[key], any> }
```

## ServiceCollection<E>

### Constructor

- `new<E>( dependencies: DependencyMap<E, E> )`

### Get

- `get<T>( Selector<T, E> )`

returns `ILifetime<T, E> | undefined`

### Replace

- `replace( dependencies: DependencyMap<E, E> )`

returns `ServiceCollection<E>`

note that this does not create a new collection, it alters the existing one

### Build

- `build()`

returns `ServiceProvider<E>`

### BuildMock

This is only meant for testing, it will provide a IServiceProvider similar to `build()`

except that only the directly provided dependencies will be given normally, anything they depend on will be mocked

How this mocking occurs can be modified via the setup

Note if you give a `MockStrategy` as first argument is as if you only gave `defaultMockType` with that value

- `buildMock(mock: MockStrategy | ProviderMock<E> = {}, defaultMockType?: MockStrategy)`

returns `ServiceProvider<E>`

#### Types involved

This won't be easily understandable, but it describes all the possibilities for mocking

````
type PartialNested<T> = { [key in keyof T]?: T[key] extends object ? PartialNested<T[key]> : T[key] }
type PropertyMock<T> = { [key in keyof T]?: PartialNested<T[key]> | MockStrategy | null | (() => null) }
type DependencyMock<E, K extends keyof E> =
  | Partial<PropertyMock<E[K]>>
  | Factory<Partial<PropertyMock<E[K]>>, any, E>
  | MockStrategy
type ProviderMock<E> = { [key in keyof E]?: DependencyMock<E, key> };
enum MockStrategy {
  dummyStub = 'dummyStub', // All getter/setter works, but default value is null
  nullStub = 'nullStub', // All setters are ignored, and getters return null
  exceptionStub = 'exceptionStub', // All getters and setters throw exception
  realStub = 'realStub', // Provides everything as-if it wasn't mocked
}
````

## ServiceProvider<E>

### Proxy

- `proxy`

returns `E`

Note all properties on result acts as-if you used `provide<T>(...)` on the service provider itself

### Provide

- `provide<T>(Selector<T, E>)`

returns `T`

Can throw

- `CircularDependencyError`, two dependencies require each other to be resolved, resulting in a never ending resolving
- `SingletonScopedDependencyError`, A ``singleton`` depending on a ``Scoped`` lifetime, this is not allowed as it traps
  the `Scoped` lifetime as a `Singleton`
- `ExistanceDependencyError`, you forgot to provide for one of the properties of `E`

## ILifetime<T, E>

- ``Singleton``, 1 to rule all
- ``Scoped``, 1 per request
- ``Transient``, always a new one
- ``Stateful``, always a new one, returns `Stateful<P, T>` which is equivalent to `{ create(p: P) => T }`

### Provide

- `provide(provider: ScopedContext<T, E>)`

returns ``T`` based on assigned lifetime

Note: This is not meant to be used manually, but can be done via: `new ScopedContext(services.build().lifetimes)`

Can throw

- `CircularDependencyError`, two dependencies require each other to be resolved, resulting in a never ending resolving
- `SingletonScopedDependencyError`, A ``singleton`` depending on a ``Scoped`` lifetime, this is not allowed as it traps
  the `Scoped` lifetime as a `Singleton`