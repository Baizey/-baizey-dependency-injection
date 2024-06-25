import { ILifetime } from '../Lifetime'
import { Provider, ScopeContext } from '../ServiceProvider'

export type Key<E> = keyof E & ( string )

export type LifetimeConstructor<T = any, P = void, E = any> =
  { new( name: Key<E>, factory: DependencyFactory<T, P, E> ): ILifetime<T, E> }

export type LifetimeCollection<E = any> = { [key in keyof E]: ILifetime<unknown, E> }

export type MatchingProperties<T, E> = { [K in keyof E]: E[K] extends T ? K : never }[keyof E]
export type SelectorOptions<T = any, E = any> = { [key in MatchingProperties<T, E>]: key & Key<E> }
export type Selector<T, E> = Key<E> | ( ( e: SelectorOptions<T, E> ) => Key<E> )

export type DependencyFactory<T, P, E> = ( providable: E, props: P, provider: Provider<E>, context: ScopeContext<E> ) => T

export type NormalConstructor<T, E> = { new( provider: E ): T } | { new(): T }

export type FactoryOption<T, P, E> = { factory: DependencyFactory<T, P, E> }
export type ConstructorOption<T, E> = { constructor: NormalConstructor<T, E> }
export type DependencyOption<T, E> = FactoryOption<T, void, E> | ConstructorOption<T, E>
export type DependencyInformation<T, E> = { lifetime: LifetimeConstructor } & DependencyOption<T, E>

export type DependencyMap<E, F> = { [key in keyof F]: DependencyInformation<F[key], any> }