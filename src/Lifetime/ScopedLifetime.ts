import { SingletonScopedDependencyError } from '../Errors'
import { DependencyFactory, DependencyInformation, FactoryOption, Key, NormalConstructor } from '../ServiceCollection'
import { ILifetime } from './ILifetime'
import { ScopeContext, ServiceProvider } from '../ServiceProvider'

export class ScopedLifetime<T, E> implements ILifetime<T, E> {
  private readonly factory: DependencyFactory<T, void, E>

  readonly name: Key<E>

  constructor( name: Key<E>, factory: DependencyFactory<T, void, E> ) {
    this.name = name
    this.factory = factory
  }

  provide( provider: ServiceProvider<E>, context: ScopeContext<E> ) {
    const { lastSingleton, instances } = context
    if ( lastSingleton ) throw new SingletonScopedDependencyError( lastSingleton.name, this.name )
    if ( !instances[this.name] ) instances[this.name] = this.factory( provider.createProxy( this.name, context ), undefined, provider, context )
    return instances[this.name]
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