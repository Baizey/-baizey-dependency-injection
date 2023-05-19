import { DependencyInformation, Key, Selector } from './ServiceCollection'

export type PropertyOf<E> = Required<{ [key in keyof E]: key & Key<E> }>

const _propertyOf = new Proxy( {}, { get: ( _, p ) => p } ) as any

export const propertyOf = <T>() => _propertyOf as PropertyOf<T>

export function extractSelector<T, E>( options: Selector<T, E> ): Key<E> {
  switch ( typeof options ) {
    case 'function':
      return options( _propertyOf as PropertyOf<E> )
    case 'symbol':
    case 'string':
      return options
    default:
      throw new Error( `extractSelector could not match anything` )
  }
}

type DependencyFromInformation<X> = X extends DependencyInformation<infer T, any> ? T : never
export type DependenciesOf<X> = Required<{ [key in keyof X]: DependencyFromInformation<X[key]> }>