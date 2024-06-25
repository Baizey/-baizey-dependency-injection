import { Key } from '../ServiceCollection'
import { ScopeContext, ServiceProvider } from '../ServiceProvider'

export interface DependencyInfo<E = any> {
  readonly name: Key<E>,
  readonly isSingleton: boolean
}

export interface ILifetime<T, E> extends DependencyInfo<E> {
  provide( provider: ServiceProvider<E>, context: ScopeContext<E> ): T
  validate( provider: ServiceProvider<E>, context: ScopeContext<E> ): T
  clone(): ILifetime<T, E>
}

export class Lifetime {

  // noinspection JSUnusedLocalSymbols
  private constructor() {
  }

  static dummy( name: Key<any>, isSingleton?: boolean ): ILifetime<null, any> {
    return {
      clone() {
        return null as unknown as ILifetime<null, any>
      },
      provide() {
        return null
      },
      validate() {
        return null
      },
      name,
      isSingleton: false,
    }
  }
}