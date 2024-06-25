import { ScopeContext } from './ScopeContext'
import { LifetimeCollection, Selector } from '../ServiceCollection'

export interface Provider<E = any> {
  readonly instances: Partial<{ [key in keyof E]: any }>
  readonly proxy: E
  readonly lifetimes: LifetimeCollection<E>

  createProxy( context?: ScopeContext<E> ): E

  provide<T>( selector: Selector<T, E>, context?: ScopeContext<E> ): T
}