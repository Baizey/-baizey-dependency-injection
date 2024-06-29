import {
  propertyOf,
  scoped,
  ServiceCollection,
  singleton,
  transient,
} from '../src'
import { ScopedLifetime } from '../src/Lifetime/ScopedLifetime'
import { SingletonLifetime } from '../src/Lifetime/SingletonLifetime'
import { TransientLifetime } from '../src/Lifetime/TransientLifetime'

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
