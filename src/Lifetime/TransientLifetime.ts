import { DependencyFactory, DependencyInformation, FactoryOption, Key, NormalConstructor } from '../ServiceCollection'
import { ILifetime } from './ILifetime'
import { ScopeContext, ServiceProvider } from '../ServiceProvider'

export class TransientLifetime<T, E> implements ILifetime<T, E> {
  private readonly factory: DependencyFactory<T, void, E>

  readonly name: Key<E>
  readonly isSingleton = false

  constructor( name: Key<E>, factory: DependencyFactory<T, void, E> ) {
    this.name = name
    this.factory = factory
  }

  provide( provider: ServiceProvider<E>, context: ScopeContext<E> ) {
    return this.factory( provider.createProxy( context ), undefined, provider, context )
  }

  validate( provider: ServiceProvider<E>, context: ScopeContext<E> ) {
    return this.provide( provider, context )
  }


  public clone(): ILifetime<T, E> {
    return new TransientLifetime( this.name, this.factory )
  }
}

export function transient<T, E>( dep: FactoryOption<T, void, E> | NormalConstructor<T, E> ): DependencyInformation<T, E> {
  return typeof dep === 'function'
    ? { lifetime: TransientLifetime, constructor: dep }
    : { lifetime: TransientLifetime, ...dep }
}