import { scoped, services, singleton, stateful, transient } from '../../src'
import { TimeSpan } from 'sharp-time-span'

describe( 'benchmark', () => {
  // Dont run outside of local
  if (1 === 1) return;

  class A {
  }

  class B {
    private a: any
    constructor( { a }: any ) {
      this.a = a
    }
  }

  class C {
    private b: any
    constructor( { b }: any ) {
      this.b = b
    }
  }

  class D {
    private a: any
    private b: any
    private c: any

    constructor( { a, b, c }: any ) {
      this.a = a
      this.b = b
      this.c = c
    }
  }

  const raw: { lifetime: ( a: any ) => any, raw: () => any }[] = [
    {
      lifetime: transient,
      raw: () => benchmark( () => new D( {
        a: new A(),
        b: new B( { a: new A() } ),
        c: new C( { b: new B( { a: new A() } ) } ),
      } ) ),
    },
    {
      lifetime: scoped,
      raw: () => benchmark( () => {
        const a = new A()
        const b = new B( { a } )
        const c = new C( { b } )
        return new D( { a, b, c } )
      } ),
    },
    {
      lifetime: stateful,
      raw: () => benchmark( () => {
        const a = { create: () => new A() }
        const b = { create: () => new B( { a } ) }
        const c = { create: () => new C( { b } ) }
        return { create: () => new D( { a, b, c } ) }
      } ),
    },
    {
      lifetime: singleton,
      raw: () => {
        let d: D | undefined
        return benchmark( () => {
          if ( d ) return d
          const a = new A()
          const b = new B( { a } )
          const c = new C( { b } )
          d = new D( { a, b, c } )
          return d
        } )
      },
    },
  ]
  let a = true
  if ( a )
    raw.forEach( ( { lifetime, raw } ) => {
      test( lifetime.name, () => {
        const provider = services( {
          a: lifetime( A ),
          b: lifetime( B ),
          c: lifetime( C ),
          d: lifetime( D ),
        } ).build()
        const bestCase = raw()
        const actualCase = benchmark( () => provider.provide( 'd' ) )
        expect( actualCase ).toBeLessThan( 0 )
      } )
    } )
  else test( 'placeholder', () => expect( true ).toBeTruthy() )
} )

function benchmark( action: () => void ) {
  const runs = 1000000
  let i = 0
  const start = Date.now()
  for ( ; i < runs; i++ ) action()
  const end = Date.now()

  const span = TimeSpan.between( start, end )
  return ( span.millis * 1e6 ) / runs
}