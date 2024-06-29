import { v4 } from 'uuid'
import {
  DependencyMap,
  ILifetime,
  LifetimeConstructor,
  propertyOf,
  ProviderMock,
  ScopeContext,
  ServiceCollection,
  DebugServiceProvider,
} from '../src'

export const propertyOfLifetime = propertyOf<ILifetime<any, any>>()

class NextNumber {
  private static nextNumber = 1

  static next() {
    return String( this.nextNumber++ )
  }
}

export const next = () => NextNumber.next()
export const UUID = {
  randomUUID(): string {
    return v4()
  },
}

export const Lifetime = ( Constructor: LifetimeConstructor ) =>
  new Constructor( UUID.randomUUID(), () => UUID.randomUUID() )

export const Provider = () => new DebugServiceProvider( {} )
export const Context = <E = any>(): ScopeContext<E> => ( {
  instances: {},
  isEscaped: false,
  lastSingleton: null,
  parent: null as any,
  depth: 0,
  ordered: [],
  lookup: {},
} )

export class InnerBase {
  id = UUID.randomUUID()

  get getter() {
    return this.id
  }

  set setter( value: any ) {
    this.id = value
  }

  func() {
    return this.id
  }
}

type Recursive<Current> =
  Required<{ [key in keyof Current]: Recursive<Current> }>
  & { create: () => Recursive<Current> } & InnerBase
type OnCreation = ( e: Recursive<any> ) => Partial<Recursive<any>> | undefined | null | void

export function dummyClass( onCreation?: OnCreation ) {
  return class Inner<E> extends InnerBase {
    constructor( provider: Recursive<E> ) {
      super()
      const data = onCreation && onCreation( provider )
      if ( !data ) return
      const self = this
      // @ts-ignore
      Object.entries( data ).forEach( ( [key, value] ) => self[key] = value )
    }
  }
}

// noinspection JSUnusedLocalSymbols
class Dummy<E = {}> {
  private readonly services: ServiceCollection<E>

  constructor( dependencies: DependencyMap<E, E> ) {
    this.services = new ServiceCollection<E>( dependencies )
  }

  public build(): Recursive<E> {
    // @ts-ignore
    return this.services.build().proxy
  }

  public mock( mock: ProviderMock<Recursive<E>> = {}): Recursive<E> {
    // @ts-ignore
    return this.services.buildMock( mock ).proxy
  }
}

export const dummy = <E>( dependencies: DependencyMap<E, E> ) => new Dummy( dependencies )