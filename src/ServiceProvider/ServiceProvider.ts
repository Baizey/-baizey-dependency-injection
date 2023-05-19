import { Key, LifetimeCollection, Selector } from '../ServiceCollection'
import { extractSelector } from '../utils'
import { ILifetime } from '../Lifetime'
import { CircularDependencyError, ExistenceDependencyError } from '../Errors'
import { ScopeContext } from './ScopeContext'

const proxyOf = <E>( self: ServiceProvider<E>, context?: ScopeContext<E> ) =>
  new Proxy( self, { get: ( t, p: Key<E> ) => t.provide( p, context ) } ) as unknown as E

export class ServiceProvider<E = any> {
  readonly instances: Partial<{ [key in keyof E]: any }> = {}
  readonly proxy: E = proxyOf( this )
  private readonly verified: Partial<Record<Key<E>, true>> = {}

  constructor( readonly lifetimes: LifetimeCollection<E> ) {
    this.lifetimes = lifetimes
  }

  createProxy( key: Key<E>, context?: ScopeContext<E> ): E {
    if ( this.verified[key] && !context ) return this.proxy
    return proxyOf<E>( this, context )
  }

  provide<T>( selector: Selector<T, E>, context?: ScopeContext<E> ): T {
    const key = extractSelector( selector )
    if ( this.instances[key] ) return this.instances[key] as T
    if ( context?.instances[key] ) return context.instances[key] as T

    const lifetime = this.lifetimes[key] as ILifetime<T, E>
    const newContext = this.enterLifetime( key, context, lifetime )

    const result = lifetime.provide( this, newContext )
    newContext.isEscaped = true

    return result
  }

  enterLifetime<T>( key: Key<E>, currentContext?: ScopeContext<E>, lifetime?: ILifetime<T, E> ): ScopeContext<E> {
    if ( !currentContext ) currentContext = this.createContext( true )
    if ( this.verified[key] ) return currentContext

    if ( !lifetime ) throw new ExistenceDependencyError( key )
    if ( lifetime.name in currentContext.lookup ) {
      throw new CircularDependencyError(
        lifetime.name,
        currentContext.ordered.map( e => e.name ) )
    }
    return {
      parent: currentContext,
      instances: currentContext.instances,
      ordered: currentContext.ordered.map( e => e ).concat( [lifetime] ),
      lookup: { ...currentContext.lookup, [lifetime.name]: lifetime },
      depth: currentContext.depth + 1,
      lastSingleton: lifetime.isSingleton ? lifetime : currentContext.lastSingleton,
      isEscaped: false,
    }  satisfies ScopeContext<E>
  }

  private createContext( createDummyParent: boolean ): ScopeContext<E> {
    return {
      instances: {},
      depth: 0,
      isEscaped: false,
      lastSingleton: null,
      parent: createDummyParent ? this.createContext( false ) : null as any,
      lookup: {},
      ordered: [],
    } satisfies ScopeContext<E>
  }
}

