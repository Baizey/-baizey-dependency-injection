import {
  DependencyFactory,
  DependencyInformation,
  FactoryOption,
  Key,
  Stateful,
  StatefulConstructor,
} from '../ServiceCollection'
import { ILifetime, Lifetime } from './ILifetime'
import { ScopeContext, ServiceProvider } from '../ServiceProvider'

export class StatefulLifetime<T, P, E> implements ILifetime<Stateful<P, T>, E> {
  public readonly name: Key<E>
  private readonly factory: DependencyFactory<T, P, E>
  private readonly next: ( { instances }: ScopeContext<E> ) => number

  constructor( name: Key<E>, factory: DependencyFactory<T, P, E> ) {
    this.name = name
    this.factory = factory

    this.next = function( { instances }: ScopeContext<E> ): number {
      instances[name] = instances[name] || 1
      return instances[name]++
    }
  }

  public provide( provider: ServiceProvider<E>, context: ScopeContext<E> ): Stateful<P, T> {
    const parentContext = context.parent
    const { isSingleton } = context.lastSingleton ?? {}
    const name = this.name
    const next = this.next

    function createContext(): ScopeContext<E> {
      if ( !parentContext.depth || !parentContext.isEscaped )
        return provider.enterLifetime( name, parentContext, Lifetime.dummy( `${ name }@instance`, isSingleton ) )

      const id = next( parentContext )
      return provider.enterLifetime( name, undefined, Lifetime.dummy( `${ name }@instance#${ id }`, isSingleton ) )
    }

    return {
      create: ( props: P ) => {
        const usedContext = createContext()
        const result = this.factory( provider.createProxy( name, usedContext ), props, provider, usedContext )
        usedContext.isEscaped = true
        return result
      },
    }
  }

  public clone(): ILifetime<Stateful<P, T>, E> {
    return new StatefulLifetime( this.name, this.factory )
  }
}

export function stateful<T, P, E>( dep: FactoryOption<T, P, E> | StatefulConstructor<T, P, E> ): DependencyInformation<Stateful<P, T>, E> {
  return ( typeof dep === 'function'
      ? { lifetime: StatefulLifetime, constructor: dep }
      : { lifetime: StatefulLifetime, ...dep }
  ) as unknown as DependencyInformation<Stateful<P, T>, E>
}