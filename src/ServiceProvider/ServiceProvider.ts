import { Provider } from './Provider'
import { Key, LifetimeCollection, Selector } from '../ServiceCollection'
import { ScopeContext } from './ScopeContext'
import { extractSelector } from '../utils'

export class ServiceProvider<E = any> implements Provider<E> {
  readonly instances: Partial<{ [key in keyof E]: any }>
  readonly lifetimes: LifetimeCollection<E>
  readonly proxy: E

  constructor( lifetimes: LifetimeCollection<E> ) {
    this.instances = {}
    this.lifetimes = lifetimes
    this.proxy = new Proxy( this, { get: ( t, p: Key<E> ) => t.provide( p ) } ) as any as E
  }

  createProxy( context?: ScopeContext<E> ): E {
    return context?.proxy ?? this.proxy
  }

  provide<T>( selector: Selector<T, E>, context?: ScopeContext<E> ): T {
    const key = extractSelector( selector )
    const stored = context?.instances[key] ?? this.instances[key]
    if ( stored !== undefined ) return stored
    if ( context === undefined ) {
      context = { instances: {} } as any
      context!.proxy = new Proxy( this, { get: ( t, p: Key<E> ) => t.provide( p, context ) } ) as unknown as E
    }
    return this.lifetimes[key].provide( this, context! ) as T
  }
}