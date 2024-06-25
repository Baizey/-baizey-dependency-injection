import { DependencyFactory, DependencyInformation, FactoryOption, Key, NormalConstructor } from '../ServiceCollection'
import { ILifetime } from './ILifetime'
import { ScopeContext, Provider } from '../ServiceProvider'

export class SingletonLifetime<T, E> implements ILifetime<T, E> {
  private readonly factory: DependencyFactory<T, void, E>

  readonly name: Key<E>
  readonly isSingleton = true

  constructor( name: Key<E>, factory: DependencyFactory<T, void, E> ) {
    this.name = name
    this.factory = factory
  }

  provide( provider: Provider<E>, context: ScopeContext<E> ) {
    const { instances } = provider
    if ( !( this.name in instances ) )
      instances[this.name] = this.factory( provider.createProxy( context ), undefined, provider, context )
    return instances[this.name]
  }

  validate( provider: Provider<E>, context: ScopeContext<E> ) {
    return this.provide( provider, context )
  }

  public clone(): ILifetime<T, E> {
    return new SingletonLifetime( this.name, this.factory )
  }
}

export function singleton<T, E>( dep: FactoryOption<T, void, E> | NormalConstructor<T, E> ): DependencyInformation<T, E> {
  return typeof dep === 'function'
    ? { lifetime: SingletonLifetime, constructor: dep }
    : { lifetime: SingletonLifetime, ...dep }
}