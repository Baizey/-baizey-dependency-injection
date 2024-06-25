import { SingletonScopedDependencyError } from '../Errors'
import { DependencyFactory, DependencyInformation, FactoryOption, Key, NormalConstructor } from '../ServiceCollection'
import { ILifetime } from './ILifetime'
import { ScopeContext, Provider } from '../ServiceProvider'

export class ScopedLifetime<T, E> implements ILifetime<T, E> {
  private readonly factory: DependencyFactory<T, void, E>

  readonly name: Key<E>
  readonly isSingleton = false

  constructor( name: Key<E>, factory: DependencyFactory<T, void, E> ) {
    this.name = name
    this.factory = factory
  }

  provide( provider: Provider<E>, context: ScopeContext<E> ) {
    const { instances } = context
    if ( !( this.name in instances ) )
      instances[this.name] = this.factory( provider.createProxy( context ), undefined, provider, context )
    return instances[this.name]
  }

  validate( provider: Provider<E>, context: ScopeContext<E> ) {
    const { lastSingleton } = context
    if ( lastSingleton ) throw new SingletonScopedDependencyError( lastSingleton.name, this.name )
    return this.provide( provider, context )
  }

  public clone(): ILifetime<T, E> {
    return new ScopedLifetime( this.name, this.factory )
  }
}

export function scoped<T, E>( dep: FactoryOption<T, void, E> | NormalConstructor<T, E> ): DependencyInformation<T, E> {
  return typeof dep === 'function'
    ? { lifetime: ScopedLifetime, constructor: dep }
    : { lifetime: ScopedLifetime, ...dep }
}