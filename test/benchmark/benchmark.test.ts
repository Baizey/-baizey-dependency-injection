import { scoped, services, singleton, transient } from '../../src'
import { Suite } from 'benchmark'

describe( 'benchmark', () => {
  // Dont run outside of local
  if ( 1 === 1 ) {
    test( '', () => {
      expect( true ).toBeTruthy()
    } )
    return;
  }


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
      raw: () => () => new D( {
        a: new A(),
        b: new B( { a: new A() } ),
        c: new C( { b: new B( { a: new A() } ) } ),
      } ),
    },
    {
      lifetime: scoped,
      raw: () => () => {
        const a = new A()
        const b = new B( { a } )
        const c = new C( { b } )
        return new D( { a, b, c } )
      },
    },
    {
      lifetime: singleton,
      raw: () => {
        let a: A | undefined
        let b: B | undefined
        let c: C | undefined
        let d: D | undefined
        return () => {
          if ( d !== undefined ) return d
          a ??= new A()
          b ??= new B( { a } )
          c ??= new C( { b } )
          d ??= new D( { a, b, c } )
          return d
        }
      },
    },
  ]

  raw.forEach( ( { lifetime, raw } ) => {
    test( lifetime.name, () => {
      const provider = services( { a: lifetime( A ), b: lifetime( B ), c: lifetime( C ), d: lifetime( D ) } ).build()
      const debug = services( { a: lifetime( A ), b: lifetime( B ), c: lifetime( C ), d: lifetime( D ) } ).buildDebug()
      new Suite()
        .add( 'No DI', () => raw() )
        .add( `prod ${ lifetime.name }`, () => provider.provide( 'd' ) )
        .add( `dev ${ lifetime.name }`, () => debug.provide( 'd' ) )
        .on( 'cycle', ( e: any ) => console.log( String( e.target ) ) )
        .run( { async: false } )
    } )
  } )
} )