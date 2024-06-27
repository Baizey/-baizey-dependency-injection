import {
  MockStrategy,
  propertyOf,
  scoped,
  ServiceCollection,
  ShouldBeMockedDependencyError,
  singleton,
  transient,
} from '../src'
import { ScopedLifetime } from '../src/Lifetime/ScopedLifetime'
import { SingletonLifetime } from '../src/Lifetime/SingletonLifetime'
import { TransientLifetime } from '../src/Lifetime/TransientLifetime'
import { dummy, dummyClass, UUID } from './testUtils'

class Dummy {
}

const services = propertyOf<ServiceCollection>()

describe( 'constructor', () => {
  const testData = [
    [singleton, SingletonLifetime],
    [scoped, ScopedLifetime],
    [transient, TransientLifetime],
  ] as any[][]
  testData.forEach( ( [lifetime, expected] ) => {
    test( `add ${ lifetime.name }`, () => {
      const sut = new ServiceCollection( { alice: lifetime( Dummy ) } )
      expect( sut.get( p => p.alice ) ).toBeInstanceOf( expected )
    } )
  } )
} )

describe( services.replace, () => {
  class Test {
    run() {
      return 'Hello'
    }
  }

  class ValidReplaceTest {
    run() {
      return 'Goodbye'
    }
  }

  test( 'it', () => {
    const sut = new ServiceCollection( { a: singleton( Test ) } )
      .replace( { a: singleton( ValidReplaceTest ) } )
    expect( sut.build().proxy.a.run() ).toBe( new ValidReplaceTest().run() )
  } )
} )

describe( services.buildMock, () => {

  test( 'Real value mocks should still get mocks', () => {
    const { sut, subs } = dummy( {
      end: singleton( dummyClass() ),
      subs: singleton( dummyClass( ( { end } ) => ( { end } ) ) ),
      sut: singleton( dummyClass( ( { end, subs } ) => ( { end, subs } ) ) ),
    } )
      .mock(
        {
          sut: MockStrategy.realValue,
          subs: MockStrategy.realValue,
          end: { func: () => 'lol' },
        },
        MockStrategy.nullStub,
      )

    //console.log( `${ sut.end.func() }\n${ sut.subs.end.func() }\n${ subs.end.func() }` )
    expect( sut.end.func() ).toBe( 'lol' )
    expect( sut.subs.end.func() ).toBe( 'lol' )
    expect( subs.end.func() ).toBe( 'lol' )
  } )

  test( 'Default mock strategy should be followed', () => {
    const { sut, a } = dummy( {
      a: singleton( dummyClass() ),
      sut: singleton( dummyClass( ( { a } ) => ( { a } ) ) ),
    } )
      .mock({
        sut: MockStrategy.realValue,
        a: MockStrategy.realValue
      })
    expect( a.id ).toBeTruthy()
    expect( sut.a.id ).toBeTruthy()
  } )

  test( 'Given mock strategy should be followed', () => {
    const { sut } = dummy( {
      a: singleton( dummyClass() ),
      sut: singleton( dummyClass( ( { a } ) => ( { a } ) ) ),
    } )
      .mock( {
        sut: MockStrategy.realValue
      }, MockStrategy.exceptionStub )
    expect( () => sut.a.id ).toThrowError( new ShouldBeMockedDependencyError( 'a', 'id', 'get' ) )
  } )

  test( 'Dependency mock strategy should be followed', () => {
    const { sut } = dummy( {
      a: singleton( dummyClass() ),
      b: singleton( dummyClass() ),
      c: singleton( dummyClass() ),
      sut: singleton( dummyClass( ( { a, b, c } ) => ( { a, b, c } ) ) ),
    } )
      .mock( {
        sut: MockStrategy.realValue,
        a: MockStrategy.dummyStub,
        b: MockStrategy.exceptionStub,
        c: { id: UUID.randomUUID() },
      } )

    expect( sut.a.id ).toBeNull()
    expect( () => sut.b.id ).toThrowError( new ShouldBeMockedDependencyError( 'b', 'id', 'get' ) )
    expect( sut.c.id ).toBeTruthy()
    sut.c.id = 'cake'
    expect( sut.c.id ).toBe( 'cake' )
  } )

  test( 'Property mock strategy should be followed', () => {
    const { sut } = dummy( {
      a: singleton( dummyClass() ),
      sut: singleton( dummyClass( ( { a } ) => ( { a } ) ) ),
    } )
      .mock( {
        sut: MockStrategy.realValue,
        a: {
          id: MockStrategy.nullStub,
          func: MockStrategy.exceptionStub,
          get getter() {
            return UUID.randomUUID()
          },
        },
      } )
    expect( sut.a.id ).toBeNull()
    expect( () => sut.a.func() ).toThrow( new ShouldBeMockedDependencyError( 'a', 'func', 'function' ) )
    expect( sut.getter ).toBeTruthy()
  } )

  test( 'Service with MockStrategy realValue should return the real deal', () => {
    const sut = dummy( {
      a: singleton( dummyClass( () => ( {} ) ) ),
      b: singleton( dummyClass( () => ( {} ) ) ),
      c: singleton( dummyClass( ( { a, b } ) => ( { a, b } ) ) ),
    } )
      .mock( {
        c: MockStrategy.realValue,
        a: MockStrategy.realValue,
        b: MockStrategy.nullStub,
      } ).c

    expect( sut.a.id ).toBeTruthy()
    expect( sut.b.id ).toBeNull()
  } )
} )
