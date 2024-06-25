import { Provider } from './Provider'
import { Key, LifetimeCollection, Selector } from '../ServiceCollection'
import { ScopeContext } from './ScopeContext'
import { extractSelector } from '../utils'

export class ServiceProvider<E = any> implements Provider<E> {
  readonly instances: Partial<{ [key in keyof E]: any }> = {}
  readonly proxy: E = this.createProxy()
  readonly lifetimes: LifetimeCollection<E>

  constructor( lifetimes: LifetimeCollection<E> ) {
    this.lifetimes = lifetimes
  }

  createProxy( context?: ScopeContext<E> ): E {
    return new Proxy( this, { get: ( t, p: Key<E> ) => t.provide( p, context ) } ) as unknown as E
  }

  provide<T>( selector: Selector<T, E>, context?: ScopeContext<E> ): T {
    const key = extractSelector( selector )
    context ??= { instances: {}, depth: 0 } satisfies Partial<ScopeContext<E>> as any as ScopeContext<E>
    context.depth++
    if ( key in this.instances ) return this.instances[key] as T
    if ( key in context.instances ) return context.instances[key] as T

    return this.lifetimes[key].provide( this, context ) as T
  }
}