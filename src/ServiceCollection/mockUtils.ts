import { ServiceCollection } from './ServiceCollection'
import { DependencyFactory } from './types'
import { DebugServiceProvider, Provider } from '../ServiceProvider'


type PartialNested<T> = { [key in keyof T]?: T[key] extends object ? PartialNested<T[key]> : T[key] };
type PropertyMock<T> = { [key in keyof T]?: PartialNested<T[key]> | null | ( () => null ) };
type DependencyMock<E, K extends keyof E> =
  | Partial<PropertyMock<E[K]>>
  | DependencyFactory<Partial<PropertyMock<E[K]>>, any, E>;
export type ProviderMock<E> = { [key in keyof E]?: DependencyMock<E, key> };

export function proxyLifetimes<E>(
  services: ServiceCollection<E>,
  providerMock: ProviderMock<E>,
): Provider<E> {
  const provider = services.buildDebug()
  Object.entries( providerMock ).forEach( ( [key, value] ) => {
    const lifetime = provider.lifetimes[key as keyof E]
    switch ( typeof value ) {
      case 'function':
        lifetime.factory = value as any
        break
      default:
        lifetime.factory = () => value
        break
    }
  } )
  return new DebugServiceProvider( provider.lifetimes )
}