import { DependencyInfo } from '../Lifetime'
import { Key } from '../ServiceCollection'

export interface ScopeContext<E> {
  readonly parent: ScopeContext<E>
  isEscaped: boolean

  readonly instances: Partial<{ [key in keyof E]: any }>

  depth: number
  readonly lastSingleton: null | DependencyInfo<E>

  readonly lookup: Record<Key<any>, DependencyInfo>
  readonly ordered: DependencyInfo[]
}